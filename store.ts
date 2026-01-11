
import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  User, UserRole, QuestionBank, Question, Exam, 
  ExamRecord, PracticeRecord, QuestionType, LoginLog, 
  AuditLog, QuestionNote, DailyProgress, StudentPermission, PracticeMode,
  PracticalTask, PracticalTaskRecord, SrsRecord
} from './types';

const API_BASE = '/api';

// 防抖工具函数
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// 错误事件节流机制
const errorEventCache = new Map<string, number>();
const ERROR_THROTTLE_MS = 1000;

const dispatchErrorEvent = (eventName: string, detail: any) => {
  const key = `${eventName}:${JSON.stringify(detail)}`;
  const lastTime = errorEventCache.get(key) || 0;
  const now = Date.now();
  
  if (now - lastTime < ERROR_THROTTLE_MS) {
    return; // 跳过重复事件
  }
  
  errorEventCache.set(key, now);
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
};

const fetchApi = async (endpoint: string, options: any = {}, retries: number = 2): Promise<any> => {
  const token = localStorage.getItem('edu_token');
  
  // 如果没有 token 且不是登录接口，直接拒绝请求
  const isLoginEndpoint = endpoint.includes('/auth/login');
  if (!token && !isLoginEndpoint) {
    console.debug(`[fetchApi] Skipping ${endpoint} - no token available`);
    throw new Error('No authentication token');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (!response.ok) {
      const text = await response.text();
      console.warn(`[fetchApi] ${endpoint} -> ${response.status} ${text}`);
      // 只在以下情况触发auth-error事件：
      // 1. 401错误
      // 2. 有token（排除token缺失导致的401）
      // 3. 不是登录接口（登录失败不应该触发auth-error）
      if (response.status === 401 && token && !isLoginEndpoint) {
        console.warn('[fetchApi] Received 401 with token present — token may be expired or invalid');
        try { dispatchErrorEvent('edu:auth-error', { status: response.status, message: 'Token已过期或无效，请重新登录' }); } catch (e) { console.debug(e); }
      }
      throw new Error(text);
    }
    return response.json();
  } catch (err: any) {
    // 如果是 "No authentication token" 错误，不要重试和派发事件
    if (err.message === 'No authentication token') {
      throw err;
    }
    
    // 处理瞬态网络错误（例如 ERR_NETWORK_CHANGED）——简单重试策略
    const isNetworkError = err instanceof TypeError || /network|failed to fetch|ECONNREFUSED|NetworkError|ERR_NETWORK_CHANGED/i.test(err.message || '');
    console.warn(`[fetchApi] Network error on ${endpoint}:`, err && err.message ? err.message : err);
    if (isNetworkError && retries > 0) {
      const backoff = (3 - retries) * 300; // 300ms, 600ms...
      console.info(`[fetchApi] Retrying ${endpoint} in ${backoff}ms (${retries} retries left)`);
      await new Promise(r => setTimeout(r, backoff));
      try {
        return await fetchApi(endpoint, options, retries - 1);
      } catch (e) {
        // fallthrough
      }
    }
    // 派发网络错误事件供 UI 显示（不自动强制 reload）
    try { dispatchErrorEvent('edu:network-error', { endpoint, message: err && err.message ? err.message : String(err) }); } catch (e) { console.debug(e); }
    throw err;
  }
};

export const useAppStore = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>([]);
  const [examHistory, setExamHistory] = useState<ExamRecord[]>([]);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [mistakes, setMistakes] = useState<Question[]>([]);
  const [favorites, setFavorites] = useState<Question[]>([]);
  const [activeBank, setActiveBank] = useState<QuestionBank | null>(null);
  const [srsRecords, setSrsRecords] = useState<SrsRecord[]>([]);

  // 缓存：讨论和标签数据（5分钟有效期）
  const [discussionsCache, setDiscussionsCache] = useState<{
    data: any[];
    timestamp: number;
    params: string;
  } | null>(null);
  const [tagsCache, setTagsCache] = useState<{
    data: any[];
    timestamp: number;
  } | null>(null);

  // Added missing states for administrative and functional features
  const [students, setStudents] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [practicalTasks, setPracticalTasks] = useState<PracticalTask[]>([]);
  const [practicalRecords, setPracticalRecords] = useState<PracticalTaskRecord[]>([]);
  const [customFieldSchema, setCustomFieldSchema] = useState<string[]>([]);
  const [allProgress, setAllProgress] = useState<DailyProgress[]>([]);

  const refreshAll = useCallback(async () => {
    const token = localStorage.getItem('edu_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      // First, fetch profile to determine role and avoid calling admin-only endpoints for students
      const userProfile = await fetchApi('/user/profile').catch(err => {
        console.warn('[refreshAll] Failed to fetch profile', err);
        return null;
      });

      // 如果获取用户信息失败，说明token无效，停止后续调用
      if (!userProfile) {
        console.warn('[refreshAll] User profile is null, stopping refresh');
        setIsLoading(false);
        return;
      }

      const promises: Array<Promise<any>> = [
        Promise.resolve(userProfile),
        fetchApi('/banks').catch(err => { console.debug('[refreshAll] /banks failed:', err); return []; }),
        fetchApi('/questions').catch(err => { console.debug('[refreshAll] /questions failed:', err); return []; }),
        fetchApi('/exams').catch(err => { console.debug('[refreshAll] /exams failed:', err); return []; }),
        fetchApi('/config').catch(err => { console.debug('[refreshAll] /config failed:', err); return null; }),
        fetchApi('/practice').catch(err => { console.debug('[refreshAll] /practice failed:', err); return []; }),
        fetchApi('/favorites').catch(err => { console.debug('[refreshAll] /favorites failed:', err); return []; }),
        fetchApi('/user/progress').catch(err => { console.debug('[refreshAll] /user/progress failed:', err); return []; }),
      ];

      // Conditionally add admin-only endpoints
      if (userProfile && userProfile.role === 'ADMIN') {
        promises.push(fetchApi('/admin/students').catch(err => { console.debug('[refreshAll] /admin/students failed:', err); return []; }));
        promises.push(fetchApi('/admin/admins').catch(err => { console.debug('[refreshAll] /admin/admins failed:', err); return []; }));
        promises.push(fetchApi('/admin/login-logs').catch(err => { console.debug('[refreshAll] /admin/login-logs failed:', err); return []; }));
        promises.push(fetchApi('/admin/audit-logs').catch(err => { console.debug('[refreshAll] /admin/audit-logs failed:', err); return []; }));
        promises.push(fetchApi('/admin/all-progress').catch(err => { console.debug('[refreshAll] /admin/all-progress failed:', err); return []; }));
      } else {
        // placeholders for indexes consistency
        promises.push(Promise.resolve([])); // students
        promises.push(Promise.resolve([])); // admins
        promises.push(Promise.resolve([])); // login-logs
        promises.push(Promise.resolve([])); // audit-logs
        promises.push(Promise.resolve([])); // all-progress
      }

      // Non-admin functional endpoints
      promises.push(fetchApi('/practical/tasks').catch(err => { console.debug('[refreshAll] /practical/tasks failed:', err); return []; }));
      promises.push(fetchApi('/practical/records').catch(err => { console.debug('[refreshAll] /practical/records failed:', err); return []; }));
      promises.push(fetchApi('/srs/records').catch(err => { console.debug('[refreshAll] /srs/records failed:', err); return []; }));
      promises.push(fetchApi('/mistakes').catch(err => { console.debug('[refreshAll] /mistakes failed:', err); return []; }));
      
      // 管理员获取所有考试历史，学员只获取自己的
      if (userProfile && userProfile.role === 'ADMIN') {
        promises.push(fetchApi('/admin/exam-history').catch(err => { console.debug('[refreshAll] /admin/exam-history failed:', err); return []; }));
      } else {
        promises.push(fetchApi('/exams/history').catch(err => { console.debug('[refreshAll] /exams/history failed:', err); return []; }));
      }

      const results = await Promise.all(promises);

      const user = results[0] || null;
      const b = results[1] || [];
      const q = results[2] || [];
      const e = results[3] || [];
      const config = results[4] || null;
      const pr = results[5] || [];
      const fav = results[6] || [];
      const progress = results[7] || [];
      const st = results[8] || [];
      const adm = results[9] || [];
      const lLogs = results[10] || [];
      const aLogs = results[11] || [];
      const allProg = results[12] || [];
      const pTasks = results[13] || [];
      const pRecs = results[14] || [];
      const srs = results[15] || [];
      const mist = results[16] || [];
      const eHist = results[17] || [];

      setCurrentUser(user);
      // 规范化 banks 数据，确保 scoreConfig 是对象
      const normalizedBanks = (b || []).map((bank: any) => ({
        ...bank,
        scoreConfig: typeof bank.scoreConfig === 'string' ? (() => {
          try {
            return JSON.parse(bank.scoreConfig);
          } catch (e) {
            return { SINGLE: 1, MULTIPLE: 2, JUDGE: 1 };
          }
        })() : (bank.scoreConfig || { SINGLE: 1, MULTIPLE: 2, JUDGE: 1 })
      }));
      setBanks(normalizedBanks);
      setQuestions(q || []);
      setExams(e || []);
      setSystemConfig(config);
      // 解析 practice_records 中的 userAnswers（可能是 JSON 字符串）和 isCustom（可能是 0/1）
      const parsedPracticeRecords = (pr || []).map((r: any) => ({
        ...r,
        userAnswers: typeof r.userAnswers === 'string' ? (() => {
          try { return JSON.parse(r.userAnswers); } catch { return {}; }
        })() : (r.userAnswers || {}),
        isCustom: r.isCustom === 1 || r.isCustom === true
      }));
      setPracticeRecords(parsedPracticeRecords);
      setFavorites(fav || []);
      setStudents(st || []);
      setAdmins(adm || []);
      setLoginLogs(lLogs || []);
      setAuditLogs(aLogs || []);
      setAllProgress(allProg || []);
      setPracticalTasks(pTasks || []);
      setPracticalRecords(pRecs || []);
      setSrsRecords(srs || []);
      setMistakes(mist || []);
      setExamHistory(eHist || []);
      setCustomFieldSchema(config?.customFieldSchema || []);
      
      if (!activeBank && b?.length > 0) setActiveBank(b[0]);
    } catch (err) {
      console.error("Refresh failed", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeBank]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  // Heartbeat interval - send heartbeat every 2 minutes to update online status
  useEffect(() => {
    const token = localStorage.getItem('edu_token');
    if (!token || !currentUser) return;

    // Send initial heartbeat
    fetchApi('/user/heartbeat', { method: 'POST' }).catch(e => console.debug('[Heartbeat] Failed:', e));

    // Setup interval to send heartbeat every 2 minutes
    const interval = setInterval(() => {
      fetchApi('/user/heartbeat', { method: 'POST' }).catch(e => console.debug('[Heartbeat] Failed:', e));
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [currentUser]);

  // 选择性刷新函数
  const refreshPracticeRecords = useCallback(async () => {
    try {
      const records = await fetchApi('/practice');
      const parsedRecords = (records || []).map((r: any) => ({
        ...r,
        userAnswers: typeof r.userAnswers === 'string' ? (() => {
          try { return JSON.parse(r.userAnswers); } catch { return {}; }
        })() : (r.userAnswers || {}),
        isCustom: r.isCustom === 1 || r.isCustom === true
      }));
      setPracticeRecords(parsedRecords);
    } catch (err) {
      console.error("Failed to refresh practice records", err);
    }
  }, []);

  const refreshBanks = useCallback(async () => {
    try {
      const b = await fetchApi('/banks');
      const normalizedBanks = (b || []).map((bank: any) => ({
        ...bank,
        scoreConfig: typeof bank.scoreConfig === 'string' ? (() => {
          try {
            return JSON.parse(bank.scoreConfig);
          } catch (e) {
            return { SINGLE: 1, MULTIPLE: 2, JUDGE: 1 };
          }
        })() : (bank.scoreConfig || { SINGLE: 1, MULTIPLE: 2, JUDGE: 1 })
      }));
      setBanks(normalizedBanks);
    } catch (err) {
      console.error("Failed to refresh banks", err);
    }
  }, []);

  // 创建防抖版本的 updatePracticeRecord
  const debouncedUpdatePracticeRecord = useCallback(
    debounce(async (id: string, data: any) => {
      await fetchApi(`/practice/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      await refreshPracticeRecords();
    }, 500),
    []
  );

  const storeValue = useMemo(() => ({
    isLoading, currentUser, banks, questions, exams, practiceRecords, examHistory, systemConfig, mistakes, favorites, srsRecords,
    students, admins, loginLogs, auditLogs, practicalTasks, practicalRecords, customFieldSchema, allProgress,
    activeBank: activeBank || banks[0], setActiveBank,
    
    login: async (phone: string, pass: string, role: UserRole) => {
      try {
        const res = await fetchApi('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ phone, password: pass, role })
        });
        localStorage.setItem('edu_token', res.token);
        setCurrentUser(res.user);
        await refreshAll();
        return true;
      } catch (e) {
        return false;
      }
    },

    // Heartbeat to update online status
    sendHeartbeat: async () => {
      try {
        await fetchApi('/user/heartbeat', { method: 'POST' });
      } catch (e) {
        console.debug('[Heartbeat] Failed:', e);
      }
    },

    logout: () => {
      // 先清除 token，这样后续的 API 调用会被阻止
      localStorage.removeItem('edu_token');
      
      // 清空所有状态
      setCurrentUser(null);
      setBanks([]);
      setQuestions([]);
      setExams([]);
      setPracticeRecords([]);
      setExamHistory([]);
      setSystemConfig(null);
      setMistakes([]);
      setFavorites([]);
      setActiveBank(null);
      setSrsRecords([]);
      setStudents([]);
      setAdmins([]);
      setLoginLogs([]);
      setAuditLogs([]);
      setPracticalTasks([]);
      setPracticalRecords([]);
      setCustomFieldSchema([]);
      setAllProgress([]);
      setDiscussionsCache(null);
      setTagsCache(null);
      
      // 通知其他标签页退出登录
      localStorage.setItem('edu_logout_event', Date.now().toString());
    },

    updateProfile: async (data: Partial<User>) => {
      await fetchApi('/user/profile', { method: 'PUT', body: JSON.stringify(data) });
      await refreshAll();
    },

    getPracticeRecord: async (bankId: string, mode: PracticeMode, isCustom: boolean = false) => {
      // 总是从 API 获取最新数据，确保进度是最新的
      try {
        const allRecords = await fetchApi('/practice');
        const found = allRecords.find((r: PracticeRecord) => r.bankId === bankId && r.mode === mode && (isCustom ? r.isCustom : !r.isCustom));
        if (found) {
          // 解析 userAnswers（如果是字符串）
          if (typeof found.userAnswers === 'string') {
            try {
              found.userAnswers = JSON.parse(found.userAnswers);
            } catch (e) {
              found.userAnswers = {};
            }
          }
          return found;
        }
      } catch (e) {
        console.warn('[getPracticeRecord] Failed to fetch from API, falling back to cache', e);
        // 如果 API 失败，才使用内存缓存
        let record = practiceRecords.find(r => r.bankId === bankId && r.mode === mode && (isCustom ? r.isCustom : !r.isCustom)) || null;
        if (record && typeof record.userAnswers === 'string') {
          try {
            record.userAnswers = JSON.parse(record.userAnswers);
          } catch (e) {
            record.userAnswers = {};
          }
        }
        return record;
      }
      return null;
    },

    addPracticeRecord: async (r: any) => {
       await fetchApi('/practice', { method: 'POST', body: JSON.stringify(r) });
       await refreshAll();
    },

    updatePracticeRecord: async (id: string, data: any) => {
      debouncedUpdatePracticeRecord(id, data);
    },

    // Added: deletePracticeRecord required by PracticeList
    deletePracticeRecord: async (id: string) => {
      await fetchApi(`/practice/${id}`, { method: 'DELETE' });
      await refreshPracticeRecords(); // 只刷新练习记录
    },
    
    getDailyProgress: async () => {
      return await fetchApi('/user/progress');
    },

    incrementDailyProgress: async () => {
      await fetchApi('/user/progress/increment', { method: 'POST' });
    },

    addNote: async (qId: string, content: string) => {
      await fetchApi('/notes', { method: 'POST', body: JSON.stringify({ questionId: qId, content }) });
    },

    getNote: async (qId: string) => {
      try { return await fetchApi(`/notes/${qId}`); } catch { return null; }
    },

    toggleFavorite: async (q: Question) => {
      await fetchApi(`/favorites/${q.id}`, { method: 'POST' });
      await refreshAll();
    },

    addToMistakes: async (q: Question) => {
      await fetchApi('/mistakes', { method: 'POST', body: JSON.stringify({ questionId: q.id }) });
      await refreshAll();
    },

    // Added: updateSrsRecord required by PracticeMode
    updateSrsRecord: async (questionId: string, level: 'HARD' | 'GOOD' | 'EASY') => {
      await fetchApi('/srs/update', { method: 'POST', body: JSON.stringify({ questionId, level }) });
      await refreshAll();
    },

    // Administrative: Students management methods
    addStudent: async (student: any) => {
      await fetchApi('/admin/students', { method: 'POST', body: JSON.stringify(student) });
      await refreshAll();
    },
    updateStudent: async (id: string, data: any) => {
      await fetchApi(`/admin/students/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      await refreshAll();
    },
    deleteStudents: async (ids: string[]) => {
      await fetchApi('/admin/students/batch-delete', { method: 'POST', body: JSON.stringify({ ids }) });
      await refreshAll();
    },

    // Administrative: Custom field schema management
    addCustomField: async (name: string) => {
      await fetchApi('/admin/config/custom-fields', { method: 'POST', body: JSON.stringify({ name }) });
      await refreshAll();
    },
    removeCustomField: async (name: string) => {
      await fetchApi(`/admin/config/custom-fields/${name}`, { method: 'DELETE' });
      await refreshAll();
    },

    // Administrative: Bank management methods
    addBank: async (bank: any) => {
      await fetchApi('/banks', { method: 'POST', body: JSON.stringify(bank) });
      await refreshAll();
    },
    updateBank: async (id: string, data: any) => {
      await fetchApi(`/banks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      await refreshAll();
    },
    deleteBank: async (id: string) => {
      await fetchApi(`/banks/${id}`, { method: 'DELETE' });
      await refreshAll();
    },
    updateBankScore: async (bankId: string, config: any) => {
      await fetchApi(`/banks/${bankId}/score`, { method: 'PUT', body: JSON.stringify({ scoreConfig: config }) });
      await refreshAll();
    },

    // Administrative: Question management methods
    addQuestion: async (q: Question) => {
      const res = await fetchApi('/questions', { method: 'POST', body: JSON.stringify(q) });
      await refreshAll();
      return res;
    },
    updateQuestion: async (id: string, data: Partial<Question>) => {
      await fetchApi(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      await refreshAll();
    },
    deleteQuestion: async (id: string) => {
      await fetchApi(`/questions/${id}`, { method: 'DELETE' });
      await refreshAll();
    },
    deleteQuestions: async (bankId: string, ids: string[]) => {
      await fetchApi('/questions/batch-delete', { method: 'POST', body: JSON.stringify({ bankId, ids }) });
      await refreshAll();
    },
    importQuestions: async (bankId: string, qs: Question[]) => {
      const res = await fetchApi(`/banks/${bankId}/import`, { method: 'POST', body: JSON.stringify({ questions: qs }) });
      await refreshAll();
      return res;
    },

    // Administrative: Exam management methods
    publishExam: async (exam: Exam) => {
      await fetchApi('/exams', { method: 'POST', body: JSON.stringify(exam) });
      await refreshAll();
    },
    updateExam: async (id: string, data: any) => {
      await fetchApi(`/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      await refreshAll();
    },
    deleteExam: async (id: string) => {
      await fetchApi(`/exams/${id}`, { method: 'DELETE' });
      await refreshAll();
    },
    toggleExamVisibility: async (id: string) => {
      await fetchApi(`/exams/${id}/toggle-visibility`, { method: 'POST' });
      await refreshAll();
    },

    // Administrative: System settings methods
    updateSystemSettings: async (data: any) => {
      try {
        await fetchApi('/config', { method: 'PUT', body: JSON.stringify(data) });
        await refreshAll();
        return true;
      } catch (err) {
        console.error('updateSystemSettings failed', err);
        return false;
      }
    },
    changeAdminPassword: async (old: string, newP: string) => {
      try {
        await fetchApi('/admin/change-password', { method: 'POST', body: JSON.stringify({ old, newP }) });
        return true;
      } catch {
        return false;
      }
    },

    // Change password for any user (students and admins)
    changePassword: async (old: string, newP: string) => {
      try {
        await fetchApi('/user/change-password', { method: 'POST', body: JSON.stringify({ old, newP }) });
        return true;
      } catch {
        return false;
      }
    },

    // Administrative: Student permissions methods
    batchSetStudentPerms: async (data: Record<string, { studentPerms: StudentPermission[], allowedBankIds: string[] }>) => {
      console.log('[store.batchSetStudentPerms] Batch updating students:', Object.keys(data).length, 'students');
      console.log('[store.batchSetStudentPerms] Data:', data);
      await fetchApi('/admin/students/batch-perms', { method: 'POST', body: JSON.stringify(data) });
      console.log('[store.batchSetStudentPerms] API call complete, calling refreshAll');
      await refreshAll();
      console.log('[store.batchSetStudentPerms] refreshAll complete');
    },
    updateStudentPerms: async (id: string, perms: StudentPermission[], bankIds?: string[]) => {
      console.log('[store.updateStudentPerms] Updating student:', {
        id,
        perms,
        bankIds
      });
      await fetchApi(`/admin/students/${id}/perms`, { method: 'PUT', body: JSON.stringify({ studentPerms: perms, allowedBankIds: bankIds }) });
      console.log('[store.updateStudentPerms] API call complete, calling refreshAll');
      await refreshAll();
      console.log('[store.updateStudentPerms] refreshAll complete');
    },

    // Administrative: Admin account management methods
    addAdmin: async (a: any) => {
      await fetchApi('/admin/admins', { method: 'POST', body: JSON.stringify(a) });
      await refreshAll();
    },
    updateAdmin: async (id: string, data: any) => {
      await fetchApi(`/admin/admins/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      await refreshAll();
    },
    deleteAdmin: async (id: string) => {
      await fetchApi(`/admin/admins/${id}`, { method: 'DELETE' });
      await refreshAll();
    },

    // Exam History management methods
    addExamHistory: async (record: ExamRecord) => {
      await fetchApi('/exams/history', { method: 'POST', body: JSON.stringify(record) });
      await refreshAll();
    },
    deleteExamHistory: async (id: string) => {
      await fetchApi(`/exams/history/${id}`, { method: 'DELETE' });
      await refreshAll();
    },

    // User data management methods
    resetUserData: async () => {
      await fetchApi('/user/reset', { method: 'POST' });
      await refreshAll();
    },

    // Backup & Restore methods
    exportData: () => {
      const data = { currentUser, banks, questions, exams, practiceRecords, examHistory, systemConfig, mistakes, favorites, srsRecords, students, admins, loginLogs, auditLogs, practicalTasks, practicalRecords, customFieldSchema };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edumaster_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    },
    importData: async (file: File) => {
      const text = await file.text();
      const data = JSON.parse(text);
      await fetchApi('/admin/import-all', { method: 'POST', body: JSON.stringify(data) });
      await refreshAll();
    },

    // Practical Tasks management methods
    addPracticalTask: async (task: PracticalTask) => {
      await fetchApi('/practical/tasks', { method: 'POST', body: JSON.stringify(task) });
      await refreshAll();
    },
    updatePracticalTask: async (task: PracticalTask) => {
      await fetchApi(`/practical/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify(task) });
      await refreshAll();
    },
    deletePracticalTask: async (id: string) => {
      await fetchApi(`/practical/tasks/${id}`, { method: 'DELETE' });
      await refreshAll();
    },
    savePracticalRecord: async (record: PracticalTaskRecord) => {
      await fetchApi('/practical/records', { method: 'POST', body: JSON.stringify(record) });
      await refreshAll();
    },
    deletePracticalRecord: async (id: string) => {
      await fetchApi(`/practical/records/${id}`, { method: 'DELETE' });
      await refreshAll();
    },

    logAction: async (action: string, target: string) => {
      console.log(`Action: ${action} on ${target}`);
      // Only send audit logs when current user is admin
      if (!currentUser || currentUser.role !== 'ADMIN') return;
      try {
        await fetchApi('/admin/audit-logs', { 
          method: 'POST', 
          body: JSON.stringify({ 
            action, 
            target, 
            operatorId: currentUser.id,
            operatorName: currentUser.realName || currentUser.nickname || currentUser.phone,
            timestamp: new Date().toLocaleString() 
          }) 
        });
      } catch (e: any) {
        // ignore 403/401 for now and log for debugging
        console.debug('logAction failed', e?.message || e);
      }
    },

    // 填空题评分
    gradeFillInBlank: async (questionId: string, userAnswers: Record<string, string>) => {
      try {
        const result = await fetchApi('/questions/grade-fill-blank', {
          method: 'POST',
          body: JSON.stringify({ questionId, userAnswers })
        });
        return result;
      } catch (e: any) {
        console.error('[gradeFillInBlank] Failed:', e);
        throw e;
      }
    },

    // 简答题AI评分
    gradeShortAnswer: async (questionId: string, userAnswer: string, referenceAnswer: string) => {
      try {
        const result = await fetchApi('/ai/grade-answer', {
          method: 'POST',
          body: JSON.stringify({ questionId, userAnswer, referenceAnswer })
        });
        return result;
      } catch (e: any) {
        console.error('[gradeShortAnswer] Failed:', e);
        throw e;
      }
    },

    // ========== 标签系统 ==========
    
    // 获取所有标签（带缓存）
    fetchTags: async (forceRefresh = false) => {
      const now = Date.now();
      const CACHE_DURATION = 5 * 60 * 1000; // 5分钟
      
      // 如果有缓存且未过期，直接返回缓存
      if (!forceRefresh && tagsCache && (now - tagsCache.timestamp < CACHE_DURATION)) {
        console.log('[fetchTags] 使用缓存数据');
        return tagsCache.data;
      }
      
      try {
        console.log('[fetchTags] 从服务器加载');
        const result = await fetchApi('/tags');
        const tags = result.tags || [];
        
        // 更新缓存
        setTagsCache({
          data: tags,
          timestamp: now
        });
        
        return tags;
      } catch (e: any) {
        console.error('[fetchTags] Failed:', e);
        // 如果请求失败但有缓存，返回缓存数据
        if (tagsCache) {
          console.log('[fetchTags] 请求失败，使用缓存数据');
          return tagsCache.data;
        }
        throw e;
      }
    },

    // 创建标签
    createTag: async (name: string, color?: string) => {
      try {
        const result = await fetchApi('/tags', {
          method: 'POST',
          body: JSON.stringify({ name, color })
        });
        // 清除标签缓存
        setTagsCache(null);
        return result.tag;
      } catch (e: any) {
        console.error('[createTag] Failed:', e);
        throw e;
      }
    },

    // 更新标签
    updateTag: async (id: string, name: string, color?: string) => {
      try {
        const result = await fetchApi(`/tags/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ name, color })
        });
        // 清除标签缓存
        setTagsCache(null);
        return result.tag;
      } catch (e: any) {
        console.error('[updateTag] Failed:', e);
        throw e;
      }
    },

    // 删除标签
    deleteTag: async (id: string) => {
      try {
        await fetchApi(`/tags/${id}`, { method: 'DELETE' });
        // 清除标签缓存
        setTagsCache(null);
      } catch (e: any) {
        console.error('[deleteTag] Failed:', e);
        throw e;
      }
    },

    // 合并标签
    mergeTags: async (sourceTagId: string, targetTagId: string) => {
      try {
        await fetchApi('/tags/merge', {
          method: 'POST',
          body: JSON.stringify({ sourceTagId, targetTagId })
        });
        // 清除标签缓存
        setTagsCache(null);
      } catch (e: any) {
        console.error('[mergeTags] Failed:', e);
        throw e;
      }
    },

    // 按标签筛选题目
    fetchQuestionsByTags: async (tagIds: string[], bankId?: string) => {
      try {
        const params = new URLSearchParams();
        tagIds.forEach(id => params.append('tagIds', id));
        if (bankId) params.append('bankId', bankId);
        
        const result = await fetchApi(`/questions/by-tags?${params.toString()}`);
        return result.questions || [];
      } catch (e: any) {
        console.error('[fetchQuestionsByTags] Failed:', e);
        throw e;
      }
    },

    // 批量给题目打标签
    batchTagQuestions: async (questionIds: string[], tagIds: string[]) => {
      try {
        await fetchApi('/questions/batch-tag', {
          method: 'POST',
          body: JSON.stringify({ questionIds, tagIds })
        });
      } catch (e: any) {
        console.error('[batchTagQuestions] Failed:', e);
        throw e;
      }
    },

    // ========== 讨论系统 ==========
    
    // 获取讨论列表（带缓存）
    fetchDiscussions: async (params?: { 
      questionId?: string; 
      sortBy?: 'latest' | 'hot' | 'mostCommented';
      includeHidden?: boolean;
    }, forceRefresh = false) => {
      const now = Date.now();
      const CACHE_DURATION = 5 * 60 * 1000; // 5分钟
      const cacheKey = JSON.stringify(params || {});
      
      // 如果有缓存且未过期，直接返回缓存
      if (!forceRefresh && discussionsCache && 
          discussionsCache.params === cacheKey && 
          (now - discussionsCache.timestamp < CACHE_DURATION)) {
        console.log('[fetchDiscussions] 使用缓存数据');
        return discussionsCache.data;
      }
      
      try {
        console.log('[fetchDiscussions] 从服务器加载');
        const searchParams = new URLSearchParams();
        if (params?.questionId) searchParams.append('questionId', params.questionId);
        if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
        if (params?.includeHidden) searchParams.append('includeHidden', 'true');
        
        const query = searchParams.toString();
        const result = await fetchApi(`/discussions${query ? '?' + query : ''}`);
        const discussions = result.discussions || [];
        
        // 更新缓存
        setDiscussionsCache({
          data: discussions,
          timestamp: now,
          params: cacheKey
        });
        
        return discussions;
      } catch (e: any) {
        console.error('[fetchDiscussions] Failed:', e);
        // 如果请求失败但有缓存，返回缓存数据
        if (discussionsCache && discussionsCache.params === cacheKey) {
          console.log('[fetchDiscussions] 请求失败，使用缓存数据');
          return discussionsCache.data;
        }
        throw e;
      }
    },

    // 获取单个讨论详情
    fetchDiscussion: async (id: string) => {
      try {
        const result = await fetchApi(`/discussions/${id}`);
        return result.discussion;
      } catch (e: any) {
        console.error('[fetchDiscussion] Failed:', e);
        throw e;
      }
    },

    // 创建讨论
    createDiscussion: async (data: { 
      title: string; 
      content: string; 
      questionId?: string;
    }) => {
      try {
        const result = await fetchApi('/discussions', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        // 清除讨论缓存
        setDiscussionsCache(null);
        return result.discussion;
      } catch (e: any) {
        console.error('[createDiscussion] Failed:', e);
        throw e;
      }
    },

    // 更新讨论
    updateDiscussion: async (id: string, data: { 
      title?: string; 
      content?: string;
    }) => {
      try {
        const result = await fetchApi(`/discussions/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        // 清除讨论缓存
        setDiscussionsCache(null);
        return result.discussion;
      } catch (e: any) {
        console.error('[updateDiscussion] Failed:', e);
        throw e;
      }
    },

    // 删除讨论
    deleteDiscussion: async (id: string) => {
      try {
        await fetchApi(`/discussions/${id}`, { method: 'DELETE' });
        // 清除讨论缓存
        setDiscussionsCache(null);
      } catch (e: any) {
        console.error('[deleteDiscussion] Failed:', e);
        throw e;
      }
    },

    // 切换讨论可见性
    toggleDiscussionVisibility: async (id: string) => {
      try {
        const result = await fetchApi(`/discussions/${id}/toggle-visibility`, {
          method: 'POST'
        });
        // 清除讨论缓存
        setDiscussionsCache(null);
        return result.discussion;
      } catch (e: any) {
        console.error('[toggleDiscussionVisibility] Failed:', e);
        throw e;
      }
    },

    // 切换讨论置顶状态
    toggleDiscussionPin: async (id: string) => {
      try {
        const result = await fetchApi(`/discussions/${id}/toggle-pin`, {
          method: 'POST'
        });
        // 清除讨论缓存
        setDiscussionsCache(null);
        return result.discussion;
      } catch (e: any) {
        console.error('[toggleDiscussionPin] Failed:', e);
        throw e;
      }
    },

    // 点赞/取消点赞讨论
    toggleDiscussionLike: async (id: string) => {
      try {
        const result = await fetchApi(`/discussions/${id}/like`, {
          method: 'POST'
        });
        return result;
      } catch (e: any) {
        console.error('[toggleDiscussionLike] Failed:', e);
        throw e;
      }
    },

    // 获取讨论的评论列表
    fetchComments: async (discussionId: string) => {
      try {
        const result = await fetchApi(`/discussions/${discussionId}/comments`);
        // 后端直接返回评论数组，不是包含comments字段的对象
        return Array.isArray(result) ? result : [];
      } catch (e: any) {
        console.error('[fetchComments] Failed:', e);
        throw e;
      }
    },

    // 创建评论
    createComment: async (discussionId: string, data: { 
      content: string; 
      parentId?: string;
    }) => {
      try {
        const result = await fetchApi(`/discussions/${discussionId}/comments`, {
          method: 'POST',
          body: JSON.stringify(data)
        });
        return result.comment;
      } catch (e: any) {
        console.error('[createComment] Failed:', e);
        throw e;
      }
    },

    // 删除评论
    deleteComment: async (commentId: string) => {
      try {
        await fetchApi(`/comments/${commentId}`, { method: 'DELETE' });
      } catch (e: any) {
        console.error('[deleteComment] Failed:', e);
        throw e;
      }
    },

    // 点赞/取消点赞评论
    toggleCommentLike: async (commentId: string) => {
      try {
        const result = await fetchApi(`/comments/${commentId}/like`, {
          method: 'POST'
        });
        return result;
      } catch (e: any) {
        console.error('[toggleCommentLike] Failed:', e);
        throw e;
      }
    },

    // 获取题目相关的讨论
    fetchQuestionDiscussions: async (questionId: string) => {
      try {
        const result = await fetchApi(`/questions/${questionId}/discussions`);
        return result.discussions || [];
      } catch (e: any) {
        console.error('[fetchQuestionDiscussions] Failed:', e);
        throw e;
      }
    },

    // ========== AI解析相关方法 ==========
    
    // 保存AI解析内容
    saveAiAnalysis: async (questionId: string, content: string) => {
      try {
        await fetchApi('/ai/analysis', {
          method: 'POST',
          body: JSON.stringify({ questionId, content })
        });
      } catch (e: any) {
        console.error('[saveAiAnalysis] Failed:', e);
        throw e;
      }
    },

    // 获取AI解析内容
    getAiAnalysis: async (questionId: string) => {
      try {
        const result = await fetchApi(`/ai/analysis/${questionId}`);
        return result;
      } catch (e: any) {
        console.error('[getAiAnalysis] Failed:', e);
        return null;
      }
    },

    // 管理员获取所有AI解析记录
    fetchAdminAiAnalysis: async (params?: {
      page?: number;
      pageSize?: number;
      search?: string;
      type?: string;
    }) => {
      try {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
        if (params?.search) searchParams.append('search', params.search);
        if (params?.type) searchParams.append('type', params.type);
        
        const query = searchParams.toString();
        const result = await fetchApi(`/admin/ai-analysis${query ? '?' + query : ''}`);
        return result;
      } catch (e: any) {
        console.error('[fetchAdminAiAnalysis] Failed:', e);
        throw e;
      }
    }
  }), [isLoading, currentUser, banks, questions, exams, practiceRecords, examHistory, systemConfig, mistakes, favorites, srsRecords, students, admins, loginLogs, auditLogs, practicalTasks, practicalRecords, customFieldSchema, refreshAll]);

  return storeValue;
};
