
import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from './store';
import { UserRole, PracticeMode, QuestionType, ExamRecord, Question, QuestionBank } from './types';
import Layout from './components/Layout';
import StudentHome from './pages/Student/Home';
import PracticeModeView from './pages/Student/PracticeMode';
import PracticeList from './pages/Student/Practice';
import Profile from './pages/Student/Profile';
import Exams from './pages/Student/Exams';
import Favorites from './pages/Student/Favorites';
import Mistakes from './pages/Student/Mistakes';
import AccountSettings from './pages/Student/AccountSettings';
import VideoList from './pages/Student/VideoList';
import BannerDetail from './pages/Student/BannerDetail';
import PracticalPractice from './pages/Student/PracticalPractice';
import AdminDashboard from './pages/Admin/Dashboard';
import StudentManager from './pages/Admin/StudentManager';
import BankManager from './pages/Admin/BankManager';
import ExamPublisher from './pages/Admin/ExamPublisher';
import SystemSettings from './pages/Admin/SystemSettings';
import Supervisor from './pages/Admin/Supervisor';
import AdminUserMgt from './pages/Admin/AdminUserMgt';
import PracticalManager from './pages/Admin/PracticalManager';
import TagManager from './components/TagManager';
import Discussions from './pages/Student/Discussions';
import DiscussionManager from './pages/Admin/DiscussionManager';

const App: React.FC = () => {
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState('home');
  const [loginForm, setLoginForm] = useState({ phone: '', password: '', role: UserRole.STUDENT });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeParams, setActiveParams] = useState<any>(null);
  const [pendingPractice, setPendingPractice] = useState<{ mode: PracticeMode, params: any, existingRecord: any } | null>(null);

  // 动态更新页面标题
  useEffect(() => {
    const pageTitle = store.systemConfig?.pageTitle || 'EduMaster - 刷题与模拟考试系统';
    document.title = pageTitle;
  }, [store.systemConfig?.pageTitle]);

  // Notifications (non-blocking)
  const [notifications, setNotifications] = useState<Array<{ id: string; type: 'info' | 'success' | 'warning' | 'error'; title?: string; message: string; count?: number }>>([]);
  const addNotification = (n: { type: 'info' | 'success' | 'warning' | 'error'; title?: string; message: string }, timeout = 5000) => {
    // 检查是否已存在相同的错误消息
    const existing = notifications.find(
      notif => notif.type === n.type && 
               notif.title === n.title && 
               notif.message === n.message
    );
    
    if (existing) {
      // 如果已存在，增加计数器而不是创建新通知
      setNotifications(prev => prev.map(notif => 
        notif.id === existing.id 
          ? { ...notif, count: (notif.count || 1) + 1 }
          : notif
      ));
      return;
    }
    
    // 创建新通知
    const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    setNotifications(prev => [...prev, { id, ...n, count: 1 }]);
    if (timeout > 0) setTimeout(() => setNotifications(prev => prev.filter(x => x.id !== id)), timeout);
  };

  useEffect(() => {
    const authHandler = (e: any) => {
      const detail = e?.detail || {};
      const status = detail.status;
      const message = detail.message || '认证失败';
      addNotification({ type: 'error', title: `认证错误 ${status}`, message: message || '请手动重新登录（为调试保留 token）。' }, 0);
    };
    window.addEventListener('edu:auth-error', authHandler as any);
    return () => window.removeEventListener('edu:auth-error', authHandler as any);
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail || {};
      const endpoint = detail.endpoint || '';
      const message = detail.message || '网络错误';
      console.warn(`[edu:network-error] ${endpoint} -> ${message}`);
      addNotification({ type: 'warning', title: '网络连接异常', message: `${endpoint}：${message}` }, 5000);
    };
    window.addEventListener('edu:network-error', handler as any);
    return () => window.removeEventListener('edu:network-error', handler as any);
  }, []);

  // 监听其他标签页的退出登录事件
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // 当其他标签页退出登录时，当前标签页也退出
      if (e.key === 'edu_logout_event') {
        console.log('[App] 检测到其他标签页退出登录，当前标签页也退出');
        store.logout();
        window.location.reload(); // 刷新页面回到登录界面
      }
      // 当其他标签页登录时，当前标签页刷新
      if (e.key === 'edu_token' && e.newValue && !e.oldValue) {
        console.log('[App] 检测到其他标签页登录，刷新当前页面');
        window.location.reload();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [store]);

  const handleNavigate = (tab: string, params: any = null) => {
    setActiveTab(tab);
    setActiveParams(params);
  };

  const checkPracticeSession = async (mode: PracticeMode, params: any) => {
    const isCustom = params?.isCustom === true;
    const bankId = params?.bankId || store.activeBank?.id;

    // 当前没有明确题库时，直接进入练习
    if (!bankId) return handleNavigate('practice-mode', { mode, ...params });

    // 规范化参数：始终带上 bankId，避免后续切换题库导致进度与题库不匹配
    const normalizedParams = { ...params, bankId };

    // 1. 查询数据库记录（按 bankId + mode + isCustom 精确命中）
    const existing = await store.getPracticeRecord(bankId, mode, isCustom);
    
    console.log('[继续练习检查]', {
      bankId,
      mode,
      isCustom,
      existing,
      hasExisting: !!existing,
      currentIndex: existing?.currentIndex,
      userAnswersCount: existing?.userAnswers ? Object.keys(existing.userAnswers).length : 0
    });
    
    // 2. 统一处理所有练习类型：如果发现有进度，拦截并弹出对话框
    // 修改判断逻辑：只要有答案记录就认为有进度（即使 currentIndex 为 0）
    const hasAnswers = existing && existing.userAnswers && Object.keys(existing.userAnswers).length > 0;
    const hasProgress = existing && (existing.currentIndex > 0 || hasAnswers);
    
    console.log('[继续练习检查] 判断结果:', { hasAnswers, hasProgress });
    
    if (hasProgress) {
      console.log('[继续练习检查] 发现进度，弹出对话框');
      setPendingPractice({ mode, params: normalizedParams, existingRecord: existing });
    } else {
      console.log('[继续练习检查] 无进度，直接开始');
      handleNavigate('practice-mode', { mode, ...normalizedParams });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginForm.phone || !loginForm.password) {
      setLoginError('请填入账号和密码');
      return;
    }
    const success = await store.login(loginForm.phone, loginForm.password, loginForm.role);
    if (success) {
      setActiveTab(loginForm.role === UserRole.ADMIN ? 'dashboard' : 'home');
    } else {
      setLoginError('账号或者密码错误');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setLoginError(null);
    setLoginForm(prev => ({ ...prev, [field]: value }));
  };

  const filteredBanksForStudent = useMemo(() => {
    if (!store.currentUser || store.currentUser.role === UserRole.ADMIN) return store.banks;
    if (store.currentUser.studentPerms?.includes('NONE')) return [];
    if (!store.currentUser.studentPerms?.includes('BANK')) return [];
    const allowedIds = store.currentUser.allowedBankIds || [];
    return store.banks.filter(b => allowedIds.includes(b.id));
  }, [store.currentUser, store.banks]);

  if (store.isLoading) {
    return (
      <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
        <p className="font-black tracking-widest animate-pulse">EDU MASTER 正在启动数据库...</p>
      </div>
    );
  }

  if (!store.currentUser) {
    const themeConfig = store.systemConfig || {};
    const logoIcon = themeConfig.logoIcon || 'fa-graduation-cap';
    const logoText = themeConfig.logoText || 'EduMaster';
    const logoImage = themeConfig.logoImage || '';
    const loginSlogan = themeConfig.loginSlogan || '一站式智能学习与模拟考试管理平台';
    const loginSloganMobile = themeConfig.loginSloganMobile || '智能学习，轻松备考';
    
    return (
      <div className="min-h-screen bg-white flex flex-col md:flex-row">
        <div className="hidden md:flex flex-1 bg-indigo-600 items-center justify-center p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          </div>
          <div className="max-w-md relative z-10 text-center md:text-left">
            <h1 className="text-6xl font-black mb-6 tracking-tight">{logoText}</h1>
            <p className="text-xl text-indigo-100 mb-8 font-light leading-relaxed">{loginSlogan}</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 md:bg-white">
          <div className="w-full max-sm:max-w-xs max-w-sm">
            {/* 移动端标语 */}
            <div className="md:hidden mb-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                {logoImage ? (
                  <img src={logoImage} alt="Logo" className="w-12 h-12 object-contain" />
                ) : (
                  <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                    <i className={`fa-solid ${logoIcon} text-white text-2xl`}></i>
                  </div>
                )}
                {logoText && <h1 className="text-3xl font-black text-gray-900">{logoText}</h1>}
              </div>
              <p className="text-sm text-gray-500 font-medium">{loginSloganMobile}</p>
            </div>
            
            <h2 className="text-3xl font-black mb-2 text-gray-900">欢迎回来</h2>
            {loginError && <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 font-bold">{loginError}</div>}
            <form onSubmit={handleLogin} className="space-y-4">
              <select className="w-full bg-gray-100 p-4 rounded-2xl font-bold" value={loginForm.role} onChange={e => handleInputChange('role', e.target.value as any)}>
                <option value={UserRole.STUDENT}>学员入口</option>
                <option value={UserRole.ADMIN}>管理平台</option>
              </select>
              <input className="w-full bg-gray-100 p-4 rounded-2xl font-bold" placeholder="账号/手机号" value={loginForm.phone} onChange={e => handleInputChange('phone', e.target.value)} />
              <input className="w-full bg-gray-100 p-4 rounded-2xl font-bold" type="password" placeholder="请输入密码" value={loginForm.password} onChange={e => handleInputChange('password', e.target.value)} />
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-[1.5rem] font-black shadow-xl mt-4 text-lg">立即登录</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = store.currentUser.role === UserRole.ADMIN;

  const renderContent = () => {
    const studentBanks = filteredBanksForStudent;
    const currentActiveBank = studentBanks.find(b => b.id === store.activeBank?.id) || studentBanks[0] || { id: '', name: '暂无题库' };

    if (isAdmin) {
      switch (activeTab) {
        case 'dashboard': return <AdminDashboard />;
        case 'students': return <StudentManager students={store.students} customFields={store.customFieldSchema} onAdd={store.addStudent} onUpdate={store.updateStudent} onDelete={store.deleteStudents} onAddField={store.addCustomField} onRemoveField={store.removeCustomField} />;
        case 'banks': return (
          <BankManager banks={store.banks} allQuestions={store.questions}
            onAdd={store.addBank} onUpdate={store.updateBank} onDelete={store.deleteBank} onUpdateScore={store.updateBankScore}
            onAddQuestion={store.addQuestion} onUpdateQuestion={store.updateQuestion} onDeleteQuestion={store.deleteQuestion} onDeleteQuestions={store.deleteQuestions} onImportQuestions={store.importQuestions}
          />
        );
        case 'admin-exams': return <ExamPublisher banks={store.banks} exams={store.exams} allQuestions={store.questions} examHistory={store.examHistory} students={store.students} onPublish={store.publishExam} onUpdate={store.updateExam} onDelete={store.deleteExam} onToggleVisibility={store.toggleExamVisibility} />;
        case 'practical-center': return <PracticalManager />;
        case 'tags': return <TagManager />;
        case 'discussion-manager': return <DiscussionManager />;
        case 'supervisor': return <Supervisor students={store.students} logs={store.loginLogs} />;
        case 'settings': return <SystemSettings config={store.systemConfig} onUpdate={store.updateSystemSettings} onChangeAdminPass={store.changeAdminPassword} />;
        case 'admin-user': return <AdminUserMgt currentUser={store.currentUser!} admins={store.admins} students={store.students} banks={store.banks} onAddAdmin={store.addAdmin} onUpdateAdmin={store.updateAdmin} onDeleteAdmin={store.deleteAdmin} onBatchStudentPerms={store.batchSetStudentPerms} onUpdateStudentPerms={store.updateStudentPerms} />;
        default: return <AdminDashboard />;
      }
    }

    switch (activeTab) {
      case 'home': return <StudentHome user={store.currentUser!} banks={studentBanks} activeBank={currentActiveBank as any} banners={store.systemConfig?.banners || []} announcement={store.systemConfig?.announcement || '欢迎使用'} onBankChange={store.setActiveBank} onNavigate={(tab, params) => {
        if (tab === 'practice-mode') checkPracticeSession(params.mode, params);
        else handleNavigate(tab, params);
      }} hasBank={store.currentUser?.studentPerms?.includes('BANK')} hasVideo={store.currentUser?.studentPerms?.includes('VIDEO')} hasPractical={true} questionCounts={{[QuestionType.SINGLE]:0,[QuestionType.MULTIPLE]:0,[QuestionType.JUDGE]:0}} />;
      case 'banner-detail': return <BannerDetail banner={activeParams?.banner} onBack={() => setActiveTab('home')} />;
      case 'practice': return <PracticeList banks={studentBanks} activeBank={currentActiveBank as any} history={store.practiceRecords} onStart={(m, p) => checkPracticeSession(m, p)} onAddRecord={store.addPracticeRecord} onDeleteRecord={store.deletePracticeRecord} onNavigate={setActiveTab} />;
      case 'favorites': return <Favorites favorites={store.favorites} banks={studentBanks} onStart={(qs) => handleNavigate('practice-mode', { questions: qs, mode: PracticeMode.SEQUENTIAL })} onToggleFavorite={store.toggleFavorite} />;
      case 'mistakes': return <Mistakes mistakes={store.mistakes} banks={studentBanks} onStart={(m, p) => checkPracticeSession(m, p)} />;
      case 'profile': return <Profile user={store.currentUser!} customFieldSchema={store.customFieldSchema} onUpdate={store.updateProfile} onBack={() => setActiveTab('home')} />;
      case 'exams': return <Exams initialView={activeParams?.view} exams={store.exams.filter(e => store.currentUser?.allowedBankIds?.includes(e.bankId))} history={store.examHistory} banks={studentBanks} allQuestions={store.questions} hasPermission={store.currentUser?.studentPerms?.includes('EXAM')} onStartExam={(e) => handleNavigate('practice-mode', { mode: PracticeMode.MOCK, exam: e })} onStartMock={(c) => handleNavigate('practice-mode', { mode: PracticeMode.MOCK, ...c })} onDeleteHistory={store.deleteExamHistory} />;
      case 'videos': return <VideoList videos={store.currentUser!.studentPerms?.includes('VIDEO') ? (store.systemConfig?.videos || []) : []} onBack={() => setActiveTab('home')} />;
      case 'discussions': return <Discussions questionId={activeParams?.questionId} />;
      case 'account': return <AccountSettings onBack={() => setActiveTab('home')} onChangePassword={store.changeAdminPassword} onResetData={store.resetUserData} onLogout={store.logout} onDeleteAccount={store.logout} currentUser={store.currentUser} onUpdateApiKey={async (apiKey) => { await store.updateProfile({ deepseekApiKey: apiKey }); }} />;
      case 'practical-practice': return <PracticalPractice onBackToPractice={() => setActiveTab('practice')} />;
      case 'practice-mode': {
        const activeBankId = activeParams?.bankId || currentActiveBank.id;
        const activeBank = store.banks.find(b => b.id === activeBankId) || currentActiveBank;
        let questionsToLoad: Question[] | undefined = activeParams?.questions;
        const isMock = activeParams?.mode === PracticeMode.MOCK;
        const isMistake = activeParams?.mode === PracticeMode.MISTAKE;
        const isCustom = activeParams?.isCustom === true;
        const mockConfig = activeParams?.exam || activeParams?.config || activeParams;
        const orderedQuestionIds = activeParams?.orderedQuestionIds;

        if (isMistake) {
          questionsToLoad = store.mistakes.filter(q => q.bankId === activeBank.id);
          if (activeParams?.type) {
            questionsToLoad = questionsToLoad.filter(q => q.type === activeParams.type);
          }
        } else if (isMock && mockConfig) {
          const bankQs = store.questions.filter(q => q.bankId === (mockConfig.bankId || activeBank.id));
          if (orderedQuestionIds) {
            questionsToLoad = orderedQuestionIds.map((id: string) => bankQs.find(q => q.id === id)).filter(Boolean) as Question[];
          } else if (mockConfig.strategy === 'MANUAL' && mockConfig.selectedQuestionIds) {
            questionsToLoad = bankQs.filter(q => mockConfig.selectedQuestionIds.includes(q.id));
          } else {
            const singles = bankQs.filter(q => q.type === QuestionType.SINGLE).sort(() => Math.random() - 0.5).slice(0, mockConfig.singleCount || 0);
            const multiples = bankQs.filter(q => q.type === QuestionType.MULTIPLE).sort(() => Math.random() - 0.5).slice(0, mockConfig.multipleCount || 0);
            const judges = bankQs.filter(q => q.type === QuestionType.JUDGE).sort(() => Math.random() - 0.5).slice(0, mockConfig.judgeCount || 0);
            const fillInBlanks = bankQs.filter(q => q.type === QuestionType.FILL_IN_BLANK).sort(() => Math.random() - 0.5).slice(0, mockConfig.fillInBlankCount || 0);
            const shortAnswers = bankQs.filter(q => q.type === QuestionType.SHORT_ANSWER).sort(() => Math.random() - 0.5).slice(0, mockConfig.shortAnswerCount || 0);
            questionsToLoad = [...singles, ...multiples, ...judges, ...fillInBlanks, ...shortAnswers];
          }
        }

        if (!questionsToLoad && activeBank.id) {
          questionsToLoad = store.questions.filter(q => q.bankId === activeBank.id);
          
          // 修正：优先使用原始枚举过滤值，其次才是 localized type
          const rawFilter = activeParams?.questionTypeFilter || activeParams?.type;
          if (rawFilter && rawFilter !== 'ALL') {
            questionsToLoad = questionsToLoad.filter(q => q.type === rawFilter);
          }
        }

        if (questionsToLoad && !orderedQuestionIds) {
           const shouldShuffle = activeParams?.isRandom || (isCustom && activeParams?.strategy === 'RANDOM');
           if (shouldShuffle) {
             questionsToLoad = [...questionsToLoad].sort(() => Math.random() - 0.5);
           } else {
              const priority: Record<string, number> = { [QuestionType.SINGLE]: 1, [QuestionType.MULTIPLE]: 2, [QuestionType.JUDGE]: 3 };
              questionsToLoad = [...questionsToLoad].sort((a, b) => {
                if (a.type !== b.type) return priority[a.type] - priority[b.type];
                return a.id.localeCompare(b.id);
              });
           }
        }

        return (
          <PracticeModeView 
            mode={activeParams?.mode || PracticeMode.SEQUENTIAL} questions={questionsToLoad || []} bank={activeBank.id ? activeBank as QuestionBank : undefined} exam={activeParams} favorites={store.favorites} 
            initialIndex={activeParams?.initialIndex || 0} initialAnswers={activeParams?.existingAnswers || {}}
            onFinish={(result) => {
              if (isMock && result && typeof result.score === 'number') {
                store.addExamHistory({
                  id: activeParams?.recordId || `mock-${Date.now()}`,
                  examId: mockConfig?.id || `mock-${Date.now()}`,
                  examTitle: mockConfig?.title || '自主模拟考试',
                  score: result.isFinished ? result.score : -1,
                  totalScore: result.totalScore,
                  passScore: result.passScore,
                  passed: result.passed,
                  timeUsed: result.timeUsed,
                  submitTime: new Date().toLocaleString(),
                  bankId: activeBank.id,
                  wrongQuestionIds: result.wrongQuestionIds,
                  userAnswers: result.userAnswers,
                  currentIndex: result.currentIndex,
                  isFinished: result.isFinished,
                  examConfig: mockConfig,
                  orderedQuestionIds: result.orderedQuestionIds
                });
                handleNavigate('exams', { view: 'history' });
              } else if (result && result.returnToMistakes) {
                // 从错题本或智能复习退出，返回到错题本页面
                setActiveTab('mistakes');
              } else if (isMistake) {
                setActiveTab('mistakes');
              } else {
                setActiveTab('practice');
              }
            }} 
            onCorrect={() => {}} onWrong={store.addToMistakes} onToggleFavorite={store.toggleFavorite} 
          />
        );
      }
      default: return null;
    }
  };

  return (
    <Layout user={store.currentUser!} activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setActiveParams(null); }} onLogout={store.logout} themeConfig={store.systemConfig}>
      {renderContent()}
      {pendingPractice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-sm:max-w-xs max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-2xl mb-4"><i className="fa-solid fa-clock-rotate-left"></i></div>
            <h3 className="text-xl font-black text-gray-900 mb-2">发现历史进度</h3>
            <p className="text-xs text-gray-400 font-medium leading-relaxed mb-8">您在此练习中有未完成的进度，是否继续？</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { 
                const { mode, params, existingRecord } = pendingPractice; 
                handleNavigate('practice-mode', { 
                  mode, 
                  ...params, 
                  initialIndex: existingRecord.currentIndex, 
                  existingAnswers: existingRecord.userAnswers 
                }); 
                setPendingPractice(null); 
              }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100">继续练习</button>
              
              <button onClick={async () => { 
                const { existingRecord, mode, params } = pendingPractice; 
                await store.updatePracticeRecord(existingRecord.id, { currentIndex: 0, userAnswers: {} }); 
                handleNavigate('practice-mode', { mode, ...params }); 
                setPendingPractice(null); 
              }} className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black hover:bg-gray-100">重新开始 (重置进度)</button>
              
              <button onClick={() => setPendingPractice(null)} className="text-xs text-gray-300 font-bold mt-2">取消</button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3">
        {notifications.map(n => (
          <div key={n.id} className={`max-w-sm w-full p-4 rounded-xl shadow-lg border ${n.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : n.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-white border-gray-100 text-gray-900'}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="font-bold text-sm flex items-center gap-2">
                  {n.title}
                  {n.count && n.count > 1 && (
                    <span className="bg-rose-600 text-white text-xs px-2 py-0.5 rounded-full">
                      ×{n.count}
                    </span>
                  )}
                </div>
                <div className="text-xs mt-1">{n.message}</div>
              </div>
              <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className="text-xs text-gray-400">关闭</button>
            </div>
          </div>
        ))}
      </div>

    </Layout>
  );
};

export default App;
