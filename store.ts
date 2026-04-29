
import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  User, UserRole, QuestionBank, Question, Exam, 
  ExamRecord, PracticeRecord, QuestionType, LoginLog, 
  AuditLog, QuestionNote, DailyProgress, StudentPermission, PracticeMode,
  PracticalTask, PracticalTaskRecord, SrsRecord, UserGroup, GroupPermissions,
  Course, CourseChapter, CourseLesson, LiveSession, CourseEnrollment
} from './types';
import { getCachedData, setCachedData, CACHE_KEYS, clearAllCache, removeCachedData, removeCachedDataByPrefix } from './utils/cache';

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

// 内存缓存层：避免重复加载同一题库
const questionsMemoryCache = new Map<string, { data: Question[], timestamp: number }>();
const MEMORY_CACHE_DURATION = 5 * 60 * 1000; // 5分钟内存缓存

export const useAppStore = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);  // 题目加载状态
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

  // Added missing states for administrative and functional features
  const [students, setStudents] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [practicalTasks, setPracticalTasks] = useState<PracticalTask[]>([]);
  const [practicalRecords, setPracticalRecords] = useState<PracticalTaskRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [groupList, setGroupList] = useState<UserGroup[]>([]);
  const [customFieldSchema, setCustomFieldSchema] = useState<string[]>([]);
  const [allProgress, setAllProgress] = useState<DailyProgress[]>([]);

  const refreshAll = useCallback(async () => {
    const token = localStorage.getItem('edu_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      // ========== 阶段 1: 核心数据（优先使用缓存，< 0.5秒）==========
      console.log('[refreshAll] 阶段1: 加载核心数据...');
      
      // 尝试从缓存加载
      const cachedBanks = getCachedData<QuestionBank[]>(CACHE_KEYS.BANKS);
      const cachedConfig = getCachedData<any>(CACHE_KEYS.CONFIG);
      const cachedProfile = getCachedData<User>(CACHE_KEYS.USER_PROFILE);
      
      // 如果有缓存，立即显示
      if (cachedProfile && cachedBanks && cachedConfig) {
        console.log('[refreshAll] 使用缓存数据，立即显示页面');
        setCurrentUser(cachedProfile);
        setBanks(cachedBanks);
        setSystemConfig(cachedConfig);
        setCustomFieldSchema(cachedConfig?.customFieldSchema || []);
        if (!activeBank && cachedBanks?.length > 0) {
          setActiveBank(cachedBanks[0]);
        }
        setIsLoading(false);
        
        // 后台刷新数据
        console.log('[refreshAll] 后台刷新核心数据...');
      }
      
      // 从服务器加载最新数据
      const [userProfile, banksData, configData] = await Promise.all([
        fetchApi('/user/profile').catch(err => {
          console.warn('[refreshAll] Failed to fetch profile', err);
          return cachedProfile || null;
        }),
        fetchApi('/banks').catch(err => { 
          console.debug('[refreshAll] /banks failed:', err); 
          return cachedBanks || []; 
        }),
        fetchApi('/config').catch(err => { 
          console.debug('[refreshAll] /config failed:', err); 
          return cachedConfig || null; 
        }),
      ]);

      // 如果获取用户信息失败且没有缓存，停止
      if (!userProfile) {
        console.warn('[refreshAll] User profile is null, stopping refresh');
        setIsLoading(false);
        return;
      }

      // 更新状态
      setCurrentUser(userProfile);
      
      // 规范化 banks 数据
      const normalizedBanks = (banksData || []).map((bank: any) => ({
        ...bank,
        scoreConfig: typeof bank.scoreConfig === 'string' ? (() => {
          try {
            return JSON.parse(bank.scoreConfig);
          } catch (e) {
            return { SINGLE: 1, MULTIPLE: 2, JUDGE: 1 };
          }
        })() : (bank.scoreConfig || { SINGLE: 1, MULTIPLE: 2, JUDGE: 1 })
      }));
      
      // 检测题库权限是否变更
      const oldBankIds = (cachedBanks || []).map(b => b.id).sort().join(',');
      const newBankIds = normalizedBanks.map(b => b.id).sort().join(',');
      
      if (oldBankIds !== newBankIds && oldBankIds !== '') {
        console.log('[refreshAll] 检测到题库权限变更，清理题库缓存');
        console.log('[refreshAll] 旧题库:', oldBankIds);
        console.log('[refreshAll] 新题库:', newBankIds);
        
        // 清理所有题库缓存
        removeCachedDataByPrefix('questions_bank_');
        
        // 清空内存缓存
        questionsMemoryCache.clear();
        
        // 清空当前题目
        setQuestions([]);
        
        // 重置 activeBank（会在后面重新设置）
        setActiveBank(null);
      }
      
      setBanks(normalizedBanks);
      setSystemConfig(configData);
      setCustomFieldSchema(configData?.customFieldSchema || []);
      
      if (!activeBank && normalizedBanks?.length > 0) {
        setActiveBank(normalizedBanks[0]);
      }

      // 缓存核心数据（30分钟）
      setCachedData(CACHE_KEYS.USER_PROFILE, userProfile, 30 * 60 * 1000);
      setCachedData(CACHE_KEYS.BANKS, normalizedBanks, 30 * 60 * 1000);
      setCachedData(CACHE_KEYS.CONFIG, configData, 30 * 60 * 1000);

      // 如果之前没有缓存，现在解除加载状态
      if (!cachedProfile || !cachedBanks || !cachedConfig) {
        setIsLoading(false);
      }
      console.log('[refreshAll] 阶段1完成，页面已可用');

      // ========== 阶段 2: 次要数据（后台加载，优先使用缓存）==========
      setTimeout(async () => {
        console.log('[refreshAll] 阶段2: 后台加载次要数据...');
        
        // 尝试从缓存加载
        const cachedPractice = getCachedData<PracticeRecord[]>(CACHE_KEYS.PRACTICE_RECORDS);
        const cachedFavorites = getCachedData<Question[]>(CACHE_KEYS.FAVORITES);
        const cachedExams = getCachedData<Exam[]>(CACHE_KEYS.EXAMS);
        // ⚠️ 不再加载所有题目，改为按需加载以避免数据过大问题
        
        // 如果有缓存，立即使用
        if (cachedPractice) setPracticeRecords(cachedPractice);
        if (cachedFavorites) setFavorites(cachedFavorites);
        if (cachedExams) setExams(cachedExams);
        
        // 从服务器加载最新数据（移除 questions 的全量加载）
        const [practiceData, favoritesData, examsData] = await Promise.all([
          fetchApi('/practice').catch(() => cachedPractice || []),
          fetchApi('/favorites').catch(() => cachedFavorites || []),
          fetchApi('/exams').catch(() => cachedExams || []),
          // ❌ 移除：fetchApi('/questions').catch(() => [])  // 数据过大（8MB+），导致 HTTP/2 错误
        ]);

        // 解析 practice_records
        const parsedPracticeRecords = (practiceData || []).map((r: any) => ({
          ...r,
          userAnswers: typeof r.userAnswers === 'string' ? (() => {
            try { return JSON.parse(r.userAnswers); } catch { return {}; }
          })() : (r.userAnswers || {}),
          isCustom: r.isCustom === 1 || r.isCustom === true
        }));
        
        setPracticeRecords(parsedPracticeRecords);
        setFavorites(favoritesData || []);
        setExams(examsData || []);
        // ✅ 题目数据将在切换题库或进入练习时按需加载
        
        // 缓存次要数据（10分钟）
        setCachedData(CACHE_KEYS.PRACTICE_RECORDS, parsedPracticeRecords, 10 * 60 * 1000);
        setCachedData(CACHE_KEYS.FAVORITES, favoritesData, 10 * 60 * 1000);
        setCachedData(CACHE_KEYS.EXAMS, examsData, 10 * 60 * 1000);
        // ❌ 不再缓存所有题目
        
        console.log('[refreshAll] 阶段2完成');
      }, 100);

      // ========== 阶段 3: 管理员数据（后台加载）==========
      if (userProfile.role === 'ADMIN') {
        setTimeout(async () => {
          console.log('[refreshAll] 阶段3: 后台加载管理员数据...');
          const [students, admins, loginLogs, auditLogs, allProgress] = await Promise.all([
            fetchApi('/admin/students').catch(() => []),
            fetchApi('/admin/admins').catch(() => []),
            fetchApi('/admin/login-logs').catch(() => []),
            fetchApi('/admin/audit-logs').catch(() => []),
            fetchApi('/admin/all-progress').catch(() => []),
          ]);

          console.log('[refreshAll] 管理员数据:', admins);
          console.log('[refreshAll] 管理员数量:', admins?.length);
          console.log('[refreshAll] 登录日志数量:', loginLogs?.length);
          console.log('[refreshAll] 审计日志数量:', auditLogs?.length);
          if (admins && admins.length > 0) {
            admins.forEach((admin: any, index: number) => {
              console.log(`[refreshAll] 管理员 ${index + 1}:`, {
                id: admin.id,
                phone: admin.phone,
                realName: admin.realName || admin.real_name,
                permissions: admin.permissions,
                permissionsType: typeof admin.permissions,
                isArray: Array.isArray(admin.permissions)
              });
            });
          }

          setStudents(students || []);
          setAdmins(admins || []);
          setLoginLogs(loginLogs || []);
          setAuditLogs(auditLogs || []);
          setAllProgress(allProgress || []);
          console.log('[refreshAll] 阶段3完成');
        }, 200);
      }

      // ========== 阶段 4: 其他功能数据（后台加载）==========
      setTimeout(async () => {
        console.log('[refreshAll] 阶段4: 后台加载其他数据...');
        const promises = [
          fetchApi('/practical/tasks').catch(() => []),
          fetchApi('/practical/records').catch(() => []),
          fetchApi('/srs/records').catch(() => []),
          fetchApi('/mistakes').catch(() => []),
        ];

        // 考试历史
        if (userProfile.role === 'ADMIN') {
          promises.push(fetchApi('/admin/exam-history').catch(() => []));
        } else {
          promises.push(fetchApi('/exams/history').catch(() => []));
        }

        const [pTasks, pRecs, srs, mist, eHist] = await Promise.all(promises);

        setPracticalTasks(pTasks || []);
        setPracticalRecords(pRecs || []);
        setSrsRecords(srs || []);
        setMistakes(mist || []);
        setExamHistory(eHist || []);

        // 加载在线课程数据
        try {
          if (userProfile.role === 'ADMIN') {
            const [allCourses, allGroups] = await Promise.all([
              fetchApi('/courses').catch(() => []),
              fetchApi('/groups').catch(() => [])
            ]);
            setCourses(allCourses || []);
            setGroupList(allGroups || []);
          } else {
            const [myCourses, myEnrollments] = await Promise.all([
              fetchApi('/courses/my/accessible').catch(() => []),
              fetchApi('/courses/my/enrollments').catch(() => [])
            ]);
            setCourses(myCourses || []);
            setEnrollments(myEnrollments || []);
          }
        } catch (e) {
          console.warn('[refreshAll] 课程数据加载失败:', e);
        }
        console.log('[refreshAll] 阶段4完成，所有数据加载完毕');
      }, 300);

    } catch (err) {
      console.error("Refresh failed", err);
      setIsLoading(false);
    }
  }, []); // 移除 activeBank 依赖，避免无限循环

  // 按需加载题库题目（简化版：仅使用内存缓存）
  const loadBankQuestions = useCallback(async (bankId: string, forceReload: boolean = false) => {
    try {
      // 立即设置加载状态
      setIsLoadingQuestions(true);
      
      // 检查内存缓存（除非强制重新加载）
      if (!forceReload) {
        const memoryCache = questionsMemoryCache.get(bankId);
        if (memoryCache) {
          console.log(`[loadBankQuestions] 内存缓存命中: ${bankId} (${memoryCache.data.length} 题)`);
          // 从缓存加载时，添加短暂延迟以显示加载状态（提升用户体验）
          await new Promise(resolve => setTimeout(resolve, 300));
          setQuestions(memoryCache.data);
          setIsLoadingQuestions(false);
          return memoryCache.data;
        }
      }
      
      // 从服务器加载
      console.log(`[loadBankQuestions] 从服务器加载: ${bankId}${forceReload ? ' (强制刷新)' : ''}`);
      const questions = await fetchApi(`/questions?bankId=${bankId}`);
      
      console.log(`[loadBankQuestions] 加载成功: ${bankId} (${questions.length} 题)`);
      
      // 更新内存缓存
      questionsMemoryCache.set(bankId, { data: questions, timestamp: Date.now() });
      
      // 清理内存缓存（保留最近5个题库）
      if (questionsMemoryCache.size > 5) {
        const entries = Array.from(questionsMemoryCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toDelete = entries.slice(0, entries.length - 5);
        toDelete.forEach(([key]) => {
          console.log(`[loadBankQuestions] 清理内存缓存: ${key}`);
          questionsMemoryCache.delete(key);
        });
      }
      
      // 关键修复：确保状态更新
      setQuestions(questions);
      setIsLoadingQuestions(false);
      
      return questions;
    } catch (error) {
      console.error('[loadBankQuestions] 加载失败:', error);
      // 加载失败时不清空现有题目，保持UI稳定
      setIsLoadingQuestions(false);
      throw error; // 抛出错误让调用者处理
    }
  }, []);

  // 修改 setActiveBank 以支持按需加载
  const handleSetActiveBank = useCallback(async (bank: QuestionBank | null) => {
    console.log('[handleSetActiveBank] 切换题库:', bank?.name, bank?.id);
    
    // 先清空当前题目，避免显示旧题库的题目
    setQuestions([]);
    setActiveBank(bank);
    
    // 切换题库时加载该题库的题目
    if (bank && bank.id) {
      // 立即设置加载状态，确保UI能及时响应
      setIsLoadingQuestions(true);
      try {
        await loadBankQuestions(bank.id);
      } catch (error) {
        console.error('[handleSetActiveBank] 加载题目失败:', error);
        // 加载失败时保持题目为空数组
        setQuestions([]);
        // 确保加载状态被清除
        setIsLoadingQuestions(false);
      }
    }
  }, [loadBankQuestions]);

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

  // 练习记录更新: 移除防抖,直接保存
  // 原因: 练习进度数据重要,不能因为防抖延迟而丢失
  // 每次切题时才保存,频率不高,不需要防抖
  const updatePracticeRecordDirect = useCallback(async (id: string, data: any) => {
    console.log('[保存进度] 开始保存:', { id, data });
    try {
      const response = await fetchApi(`/practice/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      console.log('[保存进度] 保存成功:', response);
      await refreshPracticeRecords();
    } catch (error) {
      console.error('[保存进度] 保存失败:', error);
      throw error;
    }
  }, [refreshPracticeRecords]);

  // 自动初始化 activeBank（当用户登录且有题库时）
  useEffect(() => {
    if (currentUser && banks.length > 0 && !activeBank) {
      console.log('[Store] 自动初始化 activeBank:', banks[0].name);
      handleSetActiveBank(banks[0]);
    }
  }, [currentUser, banks.length, activeBank]);

  // 题库更新检测状态
  const [bankUpdates, setBankUpdates] = useState<Record<string, string>>({});  // bankId -> updatedAt
  const [hasUpdate, setHasUpdate] = useState(false);

  // 检查题库是否有更新
  const checkBankUpdates = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'STUDENT') return;
    
    try {
      console.log('[checkBankUpdates] 开始检查题库更新...');
      const latestBanks = await fetchApi('/banks');
      
      const updates: Record<string, string> = {};
      let hasNewUpdate = false;
      
      latestBanks.forEach((bank: QuestionBank & { updatedAt?: string }) => {
        if (bank.updatedAt) {
          const cachedBank = banks.find(b => b.id === bank.id);
          const cachedUpdatedAt = (cachedBank as any)?.updatedAt;
          
          // 如果有缓存的更新时间，且服务器的更新时间更新
          if (cachedUpdatedAt && bank.updatedAt > cachedUpdatedAt) {
            updates[bank.id] = bank.updatedAt;
            hasNewUpdate = true;
            console.log(`[checkBankUpdates] 检测到题库更新: ${bank.name}`);
          }
        }
      });
      
      if (hasNewUpdate) {
        setBankUpdates(updates);
        setHasUpdate(true);
      }
      
      console.log('[checkBankUpdates] 检查完成，有更新:', hasNewUpdate);
    } catch (error) {
      console.error('[checkBankUpdates] 检查失败:', error);
    }
  }, [currentUser, banks]);

  // 手动刷新题库
  const refreshBank = useCallback(async (bankId: string) => {
    try {
      console.log(`[refreshBank] 手动刷新题库: ${bankId}`);
      
      // 清除内存缓存
      questionsMemoryCache.delete(bankId);
      
      // 强制重新加载
      await loadBankQuestions(bankId, true);
      
      // 清除更新标记
      setBankUpdates(prev => {
        const next = { ...prev };
        delete next[bankId];
        return next;
      });
      
      // 如果没有其他更新了，清除总标记
      if (Object.keys(bankUpdates).length === 1 && bankUpdates[bankId]) {
        setHasUpdate(false);
      }
      
      console.log(`[refreshBank] 刷新完成: ${bankId}`);
      return true;
    } catch (error) {
      console.error(`[refreshBank] 刷新失败:`, error);
      return false;
    }
  }, [loadBankQuestions, bankUpdates]);

  // 登录时检查更新
  useEffect(() => {
    if (currentUser && currentUser.role === 'STUDENT' && banks.length > 0) {
      checkBankUpdates();
    }
  }, [currentUser?.id, banks.length]);

  // 每小时检查一次更新
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'STUDENT') return;
    
    const interval = setInterval(() => {
      checkBankUpdates();
    }, 60 * 60 * 1000); // 1小时
    
    return () => clearInterval(interval);
  }, [currentUser, checkBankUpdates]);

  const storeValue = useMemo(() => ({
    isLoading, 
    isLoadingQuestions,  // 导出题目加载状态
    currentUser, banks, questions, exams, practiceRecords, examHistory, systemConfig, mistakes, favorites, srsRecords,
    students, admins, loginLogs, auditLogs, practicalTasks, practicalRecords, customFieldSchema, allProgress,
    courses, enrollments, groupList,
    activeBank: activeBank || banks[0], 
    setActiveBank: handleSetActiveBank,  // 使用新的处理函数，支持按需加载题目
    loadBankQuestions,  // 导出按需加载函数
    bankUpdates,  // 导出题库更新状态
    hasUpdate,  // 导出是否有更新的标记
    checkBankUpdates,  // 导出检查更新函数
    refreshBank,  // 导出手动刷新函数
    
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

    logout: async () => {
      // 先调用后端登出接口，记录登出时间和累加在线时长
      try {
        const token = localStorage.getItem('edu_token');
        if (token) {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
      } catch (e) {
        console.debug('[Logout] 记录登出失败:', e);
        // 即使失败也继续登出流程
      }
      
      // 清除 token
      localStorage.removeItem('edu_token');
      
      // 清除所有缓存
      clearAllCache();
      
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
        const found = allRecords.find((r: PracticeRecord) => 
          r.bankId === bankId && r.mode === mode && (isCustom ? r.isCustom : !r.isCustom)
        );
        
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
        console.warn('[getPracticeRecord] API调用失败，使用缓存', e);
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
      return await updatePracticeRecordDirect(id, data);
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
      // 清理该题库的缓存
      if (q.bankId) {
        const cacheKey = `questions_bank_${q.bankId}`;
        removeCachedData(cacheKey);
        questionsMemoryCache.delete(q.bankId);
        console.log(`[addQuestion] 已清理题库 ${q.bankId} 的缓存`);
        // 重新加载该题库的题目
        await loadBankQuestions(q.bankId);
      }
      // 刷新题库列表（更新题目数量）
      try {
        const banksData = await fetchApi('/banks');
        const normalizedBanks = (banksData || []).map((bank: any) => ({
          ...bank,
          scoreConfig: typeof bank.scoreConfig === 'string' ? JSON.parse(bank.scoreConfig) : bank.scoreConfig
        }));
        setBanks(normalizedBanks);
      } catch (err) {
        console.error('[addQuestion] 刷新题库列表失败:', err);
      }
      return res;
    },
    updateQuestion: async (id: string, data: Partial<Question>) => {
      await fetchApi(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      // 清理该题库的缓存
      if (data.bankId) {
        const cacheKey = `questions_bank_${data.bankId}`;
        removeCachedData(cacheKey);
        questionsMemoryCache.delete(data.bankId);
        console.log(`[updateQuestion] 已清理题库 ${data.bankId} 的缓存`);
        // 重新加载该题库的题目
        await loadBankQuestions(data.bankId);
      }
    },
    deleteQuestion: async (id: string) => {
      // 先获取当前题目所属的题库
      const question = questions.find(q => q.id === id);
      await fetchApi(`/questions/${id}`, { method: 'DELETE' });
      // 清理该题库的缓存
      if (question?.bankId) {
        const cacheKey = `questions_bank_${question.bankId}`;
        removeCachedData(cacheKey);
        questionsMemoryCache.delete(question.bankId);
        console.log(`[deleteQuestion] 已清理题库 ${question.bankId} 的缓存`);
        // 重新加载该题库的题目
        await loadBankQuestions(question.bankId);
      }
      // 刷新题库列表（更新题目数量）
      try {
        const banksData = await fetchApi('/banks');
        const normalizedBanks = (banksData || []).map((bank: any) => ({
          ...bank,
          scoreConfig: typeof bank.scoreConfig === 'string' ? JSON.parse(bank.scoreConfig) : bank.scoreConfig
        }));
        setBanks(normalizedBanks);
      } catch (err) {
        console.error('[deleteQuestion] 刷新题库列表失败:', err);
      }
    },
    deleteQuestions: async (bankId: string, ids: string[]) => {
      await fetchApi('/questions/batch-delete', { method: 'POST', body: JSON.stringify({ bankId, ids }) });
      // 清理该题库的缓存
      const cacheKey = `questions_bank_${bankId}`;
      removeCachedData(cacheKey);
      questionsMemoryCache.delete(bankId);
      console.log(`[deleteQuestions] 已清理题库 ${bankId} 的缓存`);
      // 重新加载该题库的题目
      await loadBankQuestions(bankId);
      // 刷新题库列表（更新题目数量）
      try {
        const banksData = await fetchApi('/banks');
        const normalizedBanks = (banksData || []).map((bank: any) => ({
          ...bank,
          scoreConfig: typeof bank.scoreConfig === 'string' ? JSON.parse(bank.scoreConfig) : bank.scoreConfig
        }));
        setBanks(normalizedBanks);
      } catch (err) {
        console.error('[deleteQuestions] 刷新题库列表失败:', err);
      }
    },
    importQuestions: async (bankId: string, qs: Question[]) => {
      const res = await fetchApi(`/banks/${bankId}/import`, { method: 'POST', body: JSON.stringify({ questions: qs }) });
      // 清理该题库的缓存
      const cacheKey = `questions_bank_${bankId}`;
      removeCachedData(cacheKey);
      questionsMemoryCache.delete(bankId);
      console.log(`[importQuestions] 已清理题库 ${bankId} 的缓存`);
      // 重新加载该题库的题目
      await loadBankQuestions(bankId);
      // 刷新题库列表（更新题目数量）
      try {
        const banksData = await fetchApi('/banks');
        const normalizedBanks = (banksData || []).map((bank: any) => ({
          ...bank,
          scoreConfig: typeof bank.scoreConfig === 'string' ? JSON.parse(bank.scoreConfig) : bank.scoreConfig
        }));
        setBanks(normalizedBanks);
      } catch (err) {
        console.error('[importQuestions] 刷新题库列表失败:', err);
      }
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
      await fetchApi('/admin/students/batch-perms', { method: 'POST', body: JSON.stringify(data) });
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
      // 优先使用 localStorage 缓存（30分钟）
      if (!forceRefresh) {
        const cached = getCachedData<any[]>(CACHE_KEYS.TAGS);
        if (cached && cached.length >= 0) {
          console.log('[fetchTags] 使用 localStorage 缓存');
          return cached;
        }
      }
      
      try {
        console.log('[fetchTags] 从服务器加载');
        const result = await fetchApi('/tags');
        const tags = result.tags || [];
        
        // 缓存到 localStorage（30分钟）
        setCachedData(CACHE_KEYS.TAGS, tags, 30 * 60 * 1000);
        
        return tags;
      } catch (e: any) {
        console.error('[fetchTags] Failed:', e);
        // 如果请求失败，尝试使用过期的缓存
        const cached = getCachedData<any[]>(CACHE_KEYS.TAGS);
        if (cached) {
          console.log('[fetchTags] 请求失败，使用缓存数据');
          return cached;
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
        removeCachedData(CACHE_KEYS.TAGS);
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
        removeCachedData(CACHE_KEYS.TAGS);
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
        removeCachedData(CACHE_KEYS.TAGS);
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
        removeCachedData(CACHE_KEYS.TAGS);
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
      const cacheKey = `${CACHE_KEYS.DISCUSSIONS}_${JSON.stringify(params || {})}`;
      
      // 优先使用 localStorage 缓存（30分钟）
      if (!forceRefresh) {
        const cached = getCachedData<any[]>(cacheKey);
        if (cached && cached.length >= 0) {
          console.log('[fetchDiscussions] 使用 localStorage 缓存');
          return cached;
        }
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
        
        // 缓存到 localStorage（30分钟）
        setCachedData(cacheKey, discussions, 30 * 60 * 1000);
        
        return discussions;
      } catch (e: any) {
        console.error('[fetchDiscussions] Failed:', e);
        // 如果请求失败，尝试使用过期的缓存
        const cached = getCachedData<any[]>(cacheKey);
        if (cached) {
          console.log('[fetchDiscussions] 请求失败，使用缓存数据');
          return cached;
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
        // 清除所有讨论缓存
        removeCachedDataByPrefix(CACHE_KEYS.DISCUSSIONS);
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
        // 清除所有讨论缓存
        removeCachedDataByPrefix(CACHE_KEYS.DISCUSSIONS);
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
        // 清除所有讨论缓存
        removeCachedDataByPrefix(CACHE_KEYS.DISCUSSIONS);
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
        // 清除所有讨论缓存
        removeCachedDataByPrefix(CACHE_KEYS.DISCUSSIONS);
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
        // 清除所有讨论缓存
        removeCachedDataByPrefix(CACHE_KEYS.DISCUSSIONS);
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
    },

    // ========== 分组管理（新） ==========
    listGroups: async () => {
      return await fetchApi('/groups');
    },
    createGroup: async (data: any) => {
      await fetchApi('/groups', { method: 'POST', body: JSON.stringify(data) });
      await refreshAll();
    },
    updateGroup: async (id: string, data: any) => {
      await fetchApi(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      await refreshAll();
    },
    deleteGroup: async (id: string) => {
      await fetchApi(`/groups/${id}`, { method: 'DELETE' });
      await refreshAll();
    },
    updateGroupPermissions: async (id: string, permissions: any) => {
      const result = await fetchApi(`/groups/${id}/permissions`, { method: 'PUT', body: JSON.stringify(permissions) });
      await refreshAll();
      return result;
    },
    getGroupStudents: async (groupId: string) => {
      return await fetchApi(`/groups/${groupId}/students`);
    },
    addStudentsToGroup: async (groupId: string, userIds: string[]) => {
      return await fetchApi(`/groups/${groupId}/students`, { method: 'POST', body: JSON.stringify({ userIds }) });
    },
    setStudentGroup: async (studentId: string, groupId: string | null) => {
      await fetchApi(`/admin/students/${studentId}/group`, { method: 'PUT', body: JSON.stringify({ groupId }) });
    },

    // ========== 在线课程管理（新） ==========
    // 分类
    listCourseCategories: async (type?: string) => {
      return await fetchApi(`/courses/categories${type ? '?type=' + type : ''}`);
    },
    createCourseCategory: async (data: any) => {
      return await fetchApi('/courses/categories', { method: 'POST', body: JSON.stringify(data) });
    },
    deleteCourseCategory: async (id: string) => {
      return await fetchApi(`/courses/categories/${id}`, { method: 'DELETE' });
    },

    // 课程
    listCourses: async (filters?: { type?: string; category?: string; status?: string; search?: string }) => {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      const query = params.toString();
      return await fetchApi(`/courses${query ? '?' + query : ''}`);
    },
    getCourse: async (id: string) => {
      return await fetchApi(`/courses/${id}`);
    },
    createCourse: async (data: any) => {
      const result = await fetchApi('/courses', { method: 'POST', body: JSON.stringify(data) });
      await refreshAll();
      return result;
    },
    updateCourse: async (id: string, data: any) => {
      const result = await fetchApi(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      await refreshAll();
      return result;
    },
    deleteCourse: async (id: string) => {
      await fetchApi(`/courses/${id}`, { method: 'DELETE' });
      await refreshAll();
    },
    updateCourseStatus: async (id: string, status: string) => {
      const result = await fetchApi(`/courses/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      await refreshAll();
      return result;
    },

    // 章节
    getChapters: async (courseId: string) => {
      return await fetchApi(`/courses/${courseId}/chapters`);
    },
    createChapter: async (courseId: string, data: any) => {
      return await fetchApi(`/courses/${courseId}/chapters`, { method: 'POST', body: JSON.stringify(data) });
    },
    updateChapter: async (id: string, data: any) => {
      return await fetchApi(`/courses/chapters/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    deleteChapter: async (id: string) => {
      return await fetchApi(`/courses/chapters/${id}`, { method: 'DELETE' });
    },
    reorderChapters: async (orderedIds: string[]) => {
      return await fetchApi('/courses/chapters/reorder', { method: 'PUT', body: JSON.stringify({ orderedIds }) });
    },

    // 课时
    createLesson: async (chapterId: string, data: any) => {
      return await fetchApi(`/courses/chapters/${chapterId}/lessons`, { method: 'POST', body: JSON.stringify(data) });
    },
    updateLesson: async (id: string, data: any) => {
      return await fetchApi(`/courses/lessons/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    deleteLesson: async (id: string) => {
      return await fetchApi(`/courses/lessons/${id}`, { method: 'DELETE' });
    },
    reorderLessons: async (orderedIds: string[]) => {
      return await fetchApi('/courses/lessons/reorder', { method: 'PUT', body: JSON.stringify({ orderedIds }) });
    },

    // 直播场次
    listSessions: async (courseId: string) => {
      return await fetchApi(`/courses/${courseId}/sessions`);
    },
    createSession: async (courseId: string, data: any) => {
      return await fetchApi(`/courses/${courseId}/sessions`, { method: 'POST', body: JSON.stringify(data) });
    },
    updateSession: async (id: string, data: any) => {
      return await fetchApi(`/courses/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    deleteSession: async (id: string) => {
      return await fetchApi(`/courses/sessions/${id}`, { method: 'DELETE' });
    },
    updateSessionStatus: async (id: string, status: string) => {
      return await fetchApi(`/courses/sessions/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    },

    // 学员学习记录
    getMyEnrollments: async () => {
      return await fetchApi('/courses/my/enrollments');
    },
    getStudentCourses: async (type?: string) => {
      return await fetchApi(`/courses/my/accessible${type ? '?type=' + type : ''}`);
    },
    getMyProgress: async (courseId: string) => {
      return await fetchApi(`/courses/${courseId}/progress`);
    },
    enrollCourse: async (courseId: string) => {
      return await fetchApi(`/courses/${courseId}/enroll`, { method: 'POST' });
    },
    updateProgress: async (courseId: string, data: any) => {
      return await fetchApi(`/courses/${courseId}/progress`, { method: 'PUT', body: JSON.stringify(data) });
    }
  }), [isLoading, currentUser, banks, questions, exams, practiceRecords, examHistory, systemConfig, mistakes, favorites, srsRecords, students, admins, loginLogs, auditLogs, practicalTasks, practicalRecords, customFieldSchema, courses, enrollments, groupList, refreshAll, handleSetActiveBank, loadBankQuestions]);

  return storeValue;
};
