
import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from './store';
import { UserRole, PracticeMode, QuestionType, ExamRecord, Question, QuestionBank, Course } from './types';
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
import LogManagement from './pages/Admin/LogManagement';
import PracticalManager from './pages/Admin/PracticalManager';
import TagManager from './components/TagManager';
import Discussions from './pages/Student/Discussions';
import DiscussionManager from './pages/Admin/DiscussionManager';
import AiAnalysisViewer from './pages/Admin/AiAnalysisViewer';
import QuestionBankConverter from './pages/Admin/QuestionBankConverter';
import ImportManager from './pages/Admin/ImportManager';
import SimpleImportManager from './pages/Admin/SimpleImportManager';
import RegistrationMaterials from './pages/Admin/RegistrationMaterials';
import MajorForms from './pages/Admin/MajorForms';
import OccupationManagement from './pages/Admin/OccupationManagement';
import GroupManager from './pages/Admin/GroupManager';
import CourseManager from './pages/Admin/CourseManager';
import ContentManager from './pages/Admin/ContentManager';
import SecurityManager from './pages/Admin/SecurityManager';
import VodCourseEditor from './pages/Admin/VodCourseEditor';
import LiveCourseManager from './pages/Admin/LiveCourseManager';
import ArticleCourseEditor from './pages/Admin/ArticleCourseEditor';
import ArticleImport from './pages/Admin/ArticleImport';
import InteractiveCourseManager from './pages/Admin/InteractiveCourseManager';
import CourseCatalog from './pages/Student/CourseCatalog';
import VodCourseDetail from './pages/Student/VodCourseDetail';
import LiveCourseDetail from './pages/Student/LiveCourseDetail';
import ArticleCourseDetail from './pages/Student/ArticleCourseDetail';
import InteractiveCourseViewer from './pages/Student/InteractiveCourseViewer';
import { 
  RegistrationTypeSelector, 
  EducationRegistrationForm, 
  VocationalRegistrationForm 
} from './pages/Registration';

const App: React.FC = () => {
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState('home');
  const [loginForm, setLoginForm] = useState({ phone: '', password: '', role: UserRole.STUDENT });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeParams, setActiveParams] = useState<any>(null);
  const [pendingPractice, setPendingPractice] = useState<{ mode: PracticeMode, params: any, existingRecord: any } | null>(null);
  const [adminEditVodCourse, setAdminEditVodCourse] = useState<string | null>(null);
  const [adminEditLiveCourse, setAdminEditLiveCourse] = useState<string | null>(null);
  const [adminEditArticleCourse, setAdminEditArticleCourse] = useState<Course | null>(null);

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

  // 页面关闭或刷新时记录登出
  useEffect(() => {
    const handleBeforeUnload = () => {
      const token = localStorage.getItem('edu_token');
      if (token && store.currentUser) {
        // 使用 sendBeacon 发送登出请求（即使页面关闭也能发送）
        const blob = new Blob([JSON.stringify({})], { type: 'application/json' });
        navigator.sendBeacon('/api/auth/logout', blob);
        
        // 备用方案：使用同步 XMLHttpRequest（某些浏览器可能不支持 sendBeacon）
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/auth/logout', false); // false = 同步请求
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.send();
        } catch (e) {
          console.debug('[App] 同步登出请求失败:', e);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [store.currentUser]);

  // 自动加载题目：当切换到需要题目的页面时
  useEffect(() => {
    // 移除学员端自动加载逻辑，由各页面自己控制加载时机
    // 这样可以避免与 Practice.tsx 的加载逻辑冲突
    
    // 管理员页面：需要加载所有题目
    const adminNeedsAllQuestions = ['banks', 'admin-exams'];
    
    if (adminNeedsAllQuestions.includes(activeTab) && store.currentUser?.role === UserRole.ADMIN) {
      // 检查是否已加载所有题目
      if (store.questions.length === 0) {
        console.log('[App] 管理员页面加载所有题目');
        // 加载所有题库的题目
        Promise.all(
          store.banks.map(bank => store.loadBankQuestions(bank.id))
        ).then(() => {
          console.log('[App] 所有题目加载完成，共', store.questions.length, '题');
        }).catch(err => {
          console.error('[App] 加载所有题目失败:', err);
        });
      }
    }
  }, [activeTab, store.activeBank?.id, store.questions.length, store.currentUser?.role, store.banks.length]);

  // 预加载机制已移除
  // 原因：与 Practice.tsx 的加载逻辑冲突，导致重复加载和状态不一致
  // 现在由 Practice.tsx 统一管理题目加载

  const handleNavigate = (tab: string, params: any = null) => {
    setActiveTab(tab);
    setActiveParams(params);
  };

  const checkPracticeSession = async (mode: PracticeMode, params: any) => {
    const isCustom = params?.isCustom === true;
    const bankId = params?.bankId || store.activeBank?.id;

    // 如果传递了skipCheck标志，直接开始练习，不检查历史进度
    if (params?.skipCheck) {
      console.log('[继续练习检查] skipCheck=true，跳过检查，直接开始');
      return handleNavigate('practice-mode', { mode, ...params });
    }

    // 当前没有明确题库时，直接进入练习
    if (!bankId) return handleNavigate('practice-mode', { mode, ...params });

    // 关键修复：在检查进度前，先确保题目已加载
    console.log('[继续练习检查] 开始加载题目:', bankId);
    try {
      const questions = await store.loadBankQuestions(bankId);
      console.log('[继续练习检查] 题目加载完成:', questions.length, '题');
    } catch (error) {
      console.error('[继续练习检查] 题目加载失败:', error);
      alert('题目加载失败，请重试');
      return;
    }

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
    // Banks are now controlled by group permissions (server returns already-filtered list)
    // Server-side getEffectiveBankIds handles direct + group permissions
    return store.banks;
  }, [store.currentUser, store.banks]);

  if (store.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 顶部导航骨架 */}
        <div className="h-16 bg-white border-b flex items-center px-6 shadow-sm">
          <div className="w-32 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="flex-1"></div>
          <div className="w-24 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        
        {/* 内容骨架 */}
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Banner 骨架 */}
          <div className="h-48 bg-white rounded-2xl shadow-sm animate-pulse"></div>
          
          {/* 功能卡片骨架 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-white rounded-2xl shadow-sm animate-pulse"></div>
            ))}
          </div>
          
          {/* 统计数据骨架 */}
          <div className="h-64 bg-white rounded-2xl shadow-sm animate-pulse"></div>
        </div>
        
        {/* 加载提示 */}
        <div className="fixed bottom-6 right-6 bg-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-gray-600">正在加载...</span>
        </div>
      </div>
    );
  }

  if (!store.currentUser) {
    // 未登录状态下，如果访问报名页面，直接显示报名页面
    console.log('[App] 未登录状态，当前 activeTab:', activeTab);
    
    if (activeTab === 'registration') {
      console.log('[App] 渲染报名类型选择页面');
      return <RegistrationTypeSelector onNavigate={setActiveTab} />;
    }
    if (activeTab === 'registration-education') {
      console.log('[App] 渲染学历教育报名表单');
      return <EducationRegistrationForm onNavigate={setActiveTab} />;
    }
    if (activeTab === 'registration-vocational') {
      console.log('[App] 渲染职业技能报名表单');
      return <VocationalRegistrationForm onNavigate={setActiveTab} />;
    }

    // 否则显示登录页面
    console.log('[App] 渲染登录页面');
    const themeConfig = store.systemConfig || {};
    const logoIcon = themeConfig.logoIcon || 'fa-graduation-cap';
    const logoText = themeConfig.logoText || 'EduMaster';
    const logoImage = themeConfig.logoImage || '';
    const loginTitle = themeConfig.loginTitle || logoText; // 登录页标题，默认使用 Logo 文字
    const loginSlogan = themeConfig.loginSlogan || '一站式智能学习与模拟考试管理平台';
    const loginSloganMobile = themeConfig.loginSloganMobile || '智能学习，轻松备考';
    
    return (
      <div className="min-h-screen bg-white flex flex-col md:flex-row">
        <div className="hidden md:flex flex-1 bg-indigo-600 items-center justify-center p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          </div>
          <div className="max-w-md relative z-10 text-center md:text-left">
            <h1 className="text-6xl font-black mb-6 tracking-tight">{loginTitle}</h1>
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
            
            {/* 报名登记入口 */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center mb-3 font-medium">还没有账号？</p>
              <button 
                onClick={() => {
                  console.log('[App] 点击报名登记按钮，切换到 registration 页面');
                  setActiveTab('registration');
                }}
                className="w-full bg-emerald-50 text-emerald-600 py-4 rounded-[1.5rem] font-black shadow-sm hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-user-plus"></i>
                报名登记
              </button>
            </div>
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
        case 'registration-materials': return <RegistrationMaterials />;
        case 'major-forms': return <MajorForms />;
        case 'occupation-management': return <OccupationManagement />;
        case 'banks': return (
          <BankManager banks={store.banks} allQuestions={store.questions}
            onAdd={store.addBank} onUpdate={store.updateBank} onDelete={store.deleteBank} onUpdateScore={store.updateBankScore}
            onAddQuestion={store.addQuestion} onUpdateQuestion={store.updateQuestion} onDeleteQuestion={store.deleteQuestion} onDeleteQuestions={store.deleteQuestions} onImportQuestions={store.importQuestions}
          />
        );
        case 'question-bank-converter': return <QuestionBankConverter />;
        case 'import-manager': return <SimpleImportManager />;
        case 'admin-exams': return <ExamPublisher banks={store.banks} exams={store.exams} allQuestions={store.questions} examHistory={store.examHistory} students={store.students} onPublish={store.publishExam} onUpdate={store.updateExam} onDelete={store.deleteExam} onToggleVisibility={store.toggleExamVisibility} />;
        case 'practical-center': return <PracticalManager />;
        case 'tags': return <TagManager />;
        case 'discussion-manager': return <DiscussionManager />;
        case 'ai-analysis': return <AiAnalysisViewer />;
        case 'supervisor': return <Supervisor students={store.students} logs={store.loginLogs} />;
        case 'logs': return <LogManagement loginLogs={store.loginLogs} auditLogs={store.auditLogs} />;
        case 'settings': return <SystemSettings config={store.systemConfig} onUpdate={store.updateSystemSettings} onChangeAdminPass={store.changeAdminPassword} defaultTab={activeParams?.tab} />;
        case 'settings-content': return <ContentManager config={store.systemConfig} onUpdate={store.updateSystemSettings} />;
        case 'settings-security': return <SecurityManager onChangeAdminPass={store.changeAdminPassword} />;
        case 'admin-user': return <AdminUserMgt currentUser={store.currentUser!} admins={store.admins} students={store.students} banks={store.banks} onAddAdmin={store.addAdmin} onUpdateAdmin={store.updateAdmin} onDeleteAdmin={store.deleteAdmin} />;
        case 'groups': return <GroupManager groups={store.groupList || []} students={store.students} banks={store.banks} courses={store.courses || []} listGroups={store.listGroups} createGroup={store.createGroup} updateGroup={store.updateGroup} deleteGroup={store.deleteGroup} updateGroupPermissions={store.updateGroupPermissions} addStudentsToGroup={store.addStudentsToGroup} setStudentGroup={store.setStudentGroup} refreshAll={store.refreshAll} />;
        case 'vod-course-editor': {
          if (adminEditVodCourse) {
            const vodCourse = (store.courses || []).find(c => c.id === adminEditVodCourse);
            if (vodCourse) return <VodCourseEditor course={vodCourse} chapters={[]} onBack={() => setAdminEditVodCourse(null)} getCourse={store.getCourse} getChapters={store.getChapters} createChapter={store.createChapter} updateChapter={store.updateChapter} deleteChapter={store.deleteChapter} reorderChapters={store.reorderChapters} createLesson={store.createLesson} updateLesson={store.updateLesson} deleteLesson={store.deleteLesson} reorderLessons={store.reorderLessons} />;
          }
          return <CourseManager courses={store.courses || []} listCourses={store.listCourses} createCourse={store.createCourse} updateCourse={store.updateCourse} deleteCourse={store.deleteCourse} updateCourseStatus={store.updateCourseStatus} createSession={store.createSession} onEditVod={(id) => setAdminEditVodCourse(id)} onEditLive={(id) => setAdminEditLiveCourse(id)} refreshAll={store.refreshAll} presetType="vod" />;
        }
        case 'live-course-manager': {
          if (adminEditLiveCourse) {
            const liveCourse = (store.courses || []).find(c => c.id === adminEditLiveCourse);
            if (liveCourse) return <LiveCourseManager course={liveCourse} sessions={[]} onBack={() => setAdminEditLiveCourse(null)} listSessions={store.listSessions} createSession={store.createSession} updateSession={store.updateSession} deleteSession={store.deleteSession} updateSessionStatus={store.updateSessionStatus} />;
          }
          return <CourseManager courses={store.courses || []} listCourses={store.listCourses} createCourse={store.createCourse} updateCourse={store.updateCourse} deleteCourse={store.deleteCourse} updateCourseStatus={store.updateCourseStatus} createSession={store.createSession} onEditVod={(id) => setAdminEditVodCourse(id)} onEditLive={(id) => setAdminEditLiveCourse(id)} refreshAll={store.refreshAll} presetType="live" />;
        }
        case 'article-course-editor': {
          if (adminEditArticleCourse) {
            return <ArticleCourseEditor course={adminEditArticleCourse} chapters={[]} onBack={() => setAdminEditArticleCourse(null)} getCourse={store.getCourse} getChapters={store.getChapters} createChapter={store.createChapter} updateChapter={store.updateChapter} deleteChapter={store.deleteChapter} reorderChapters={store.reorderChapters} createLesson={store.createLesson} updateLesson={store.updateLesson} deleteLesson={store.deleteLesson} reorderLessons={store.reorderLessons} />;
          }
          return <CourseManager courses={store.courses || []} listCourses={store.listCourses} createCourse={store.createCourse} updateCourse={store.updateCourse} deleteCourse={store.deleteCourse} updateCourseStatus={store.updateCourseStatus} createSession={store.createSession} onEditVod={(id) => setAdminEditVodCourse(id)} onEditLive={(id) => setAdminEditLiveCourse(id)} onEditArticle={(c) => setAdminEditArticleCourse(c)} refreshAll={store.refreshAll} presetType="article" />;
        }
        case 'interactive-course-manager':
          return <InteractiveCourseManager />;
        case 'article-import':
          return <ArticleImport onBack={() => setActiveTab('article-course-editor')} refreshAll={store.refreshAll} />;
        default: return <AdminDashboard />;
      }
    }

    switch (activeTab) {
      case 'home': return <StudentHome user={store.currentUser!} banks={studentBanks} activeBank={currentActiveBank as any} banners={store.systemConfig?.banners || []} announcement={store.systemConfig?.announcement || '欢迎使用'} announcementDuration={store.systemConfig?.announcementDuration ?? 20} onBankChange={store.setActiveBank} onNavigate={(tab, params) => {
        if (tab === 'practice-mode') checkPracticeSession(params.mode, params);
        else handleNavigate(tab, params);
      }} onLogout={store.logout} hasBank={true} hasVideo={true} hasPractical={true} questionCounts={{[QuestionType.SINGLE]:0,[QuestionType.MULTIPLE]:0,[QuestionType.JUDGE]:0}} />;
      case 'banner-detail': return <BannerDetail banner={activeParams?.banner} onBack={() => setActiveTab('home')} />;
      case 'practice': return <PracticeList banks={studentBanks} activeBank={currentActiveBank as any} history={store.practiceRecords} onStart={(m, p) => checkPracticeSession(m, p)} onAddRecord={store.addPracticeRecord} onDeleteRecord={store.deletePracticeRecord} onNavigate={setActiveTab} />;
      case 'favorites': return <Favorites favorites={store.favorites} banks={studentBanks} onStart={(qs) => handleNavigate('practice-mode', { questions: qs, mode: PracticeMode.SEQUENTIAL })} onToggleFavorite={store.toggleFavorite} onBack={() => setActiveTab('practice')} />;
      case 'mistakes': return <Mistakes mistakes={store.mistakes} banks={studentBanks} onStart={(m, p) => checkPracticeSession(m, p)} />;
      case 'discussions': return <Discussions />;
      case 'profile': return <Profile user={store.currentUser!} customFieldSchema={store.customFieldSchema} onUpdate={store.updateProfile} onBack={() => setActiveTab('home')} />;
      case 'exams': return <Exams initialView={activeParams?.view} exams={store.exams} history={store.examHistory} banks={studentBanks} allQuestions={store.questions} hasPermission={true} onStartExam={async (e) => {
        // 检查是否已经交卷
        const existingRecord = store.examHistory.find(h => h.examId === e.id && h.userId === store.currentUser?.id && h.isFinished);
        if (existingRecord && !e.initialIndex) {
          alert('您已经交卷完成此考试，无法再次参加。如需重新考试，请联系管理员。');
          return;
        }
        
        // 如果已经传递了 questions，直接使用
        if (e.questions && e.questions.length > 0) {
          console.log('[App] 系统考试使用传递的题目:', e.questions.length);
          handleNavigate('practice-mode', { mode: PracticeMode.MOCK, exam: e, questions: e.questions, initialIndex: e.initialIndex, existingAnswers: e.existingAnswers, orderedQuestionIds: e.orderedQuestionIds, recordId: e.recordId });
          return;
        }
        
        // 否则加载题目
        console.log('[App] 系统考试加载题目，bankId:', e.bankId);
        const bankQuestions = await store.loadBankQuestions(e.bankId);
        console.log('[App] 题目加载完成:', bankQuestions.length);
        
        // 根据考试配置生成题目列表
        let finalQuestions = [];
        if (e.questionIds && e.questionIds.length > 0) {
          finalQuestions = e.questionIds
            .map((id: string) => bankQuestions.find(q => q.id === id))
            .filter(Boolean) as Question[];
          console.log('[App] 根据 questionIds 生成题目:', finalQuestions.length);
        } else {
          const singles = bankQuestions.filter(q => q.type === QuestionType.SINGLE).sort(() => Math.random() - 0.5).slice(0, e.singleCount || 0);
          const multiples = bankQuestions.filter(q => q.type === QuestionType.MULTIPLE).sort(() => Math.random() - 0.5).slice(0, e.multipleCount || 0);
          const judges = bankQuestions.filter(q => q.type === QuestionType.JUDGE).sort(() => Math.random() - 0.5).slice(0, e.judgeCount || 0);
          finalQuestions = [...singles, ...multiples, ...judges];
          console.log('[App] 随机生成题目:', finalQuestions.length);
        }
        
        handleNavigate('practice-mode', { mode: PracticeMode.MOCK, exam: e, questions: finalQuestions });
      }} onStartMock={(c) => handleNavigate('practice-mode', { mode: PracticeMode.MOCK, ...c })} onDeleteHistory={store.deleteExamHistory} />;
      case 'videos': return <VideoList videos={store.currentUser!.studentPerms?.includes('VIDEO') ? (store.systemConfig?.videos || []) : []} onBack={() => setActiveTab('home')} />;
      case 'courses': return <CourseCatalog courses={store.courses || []} enrollments={store.enrollments || []} hasVideo={store.currentUser?.studentPerms?.includes('VIDEO')} onSelectCourse={(c) => handleNavigate('vod-course-detail', { courseId: c.id })} onSelectLiveCourse={(c) => handleNavigate('live-course-detail', { courseId: c.id })} onSelectArticleCourse={(c) => handleNavigate('article-course-detail', { courseId: c.id })} onSelectInteractive={() => setActiveTab('interactive-courses')} getStudentCourses={store.getStudentCourses} getMyEnrollments={store.getMyEnrollments} />;
      case 'vod-course-detail': {
        const vodCourse = (store.courses || []).find(c => c.id === activeParams?.courseId);
        if (!vodCourse) return <CourseCatalog courses={store.courses || []} enrollments={store.enrollments || []} onSelectCourse={(c) => handleNavigate('vod-course-detail', { courseId: c.id })} onSelectLiveCourse={(c) => handleNavigate('live-course-detail', { courseId: c.id })} getStudentCourses={store.getStudentCourses} getMyEnrollments={store.getMyEnrollments} />;
        return <VodCourseDetail course={vodCourse} onBack={() => setActiveTab('courses')} getChapters={store.getChapters} getMyProgress={store.getMyProgress} updateProgress={store.updateProgress} enrollCourse={store.enrollCourse} refreshAll={store.refreshAll} />;
      }
      case 'live-course-detail': {
        const liveCourse = (store.courses || []).find(c => c.id === activeParams?.courseId);
        if (!liveCourse) return <CourseCatalog courses={store.courses || []} enrollments={store.enrollments || []} onSelectCourse={(c) => handleNavigate('vod-course-detail', { courseId: c.id })} onSelectLiveCourse={(c) => handleNavigate('live-course-detail', { courseId: c.id })} getStudentCourses={store.getStudentCourses} getMyEnrollments={store.getMyEnrollments} />;
        return <LiveCourseDetail course={liveCourse} onBack={() => setActiveTab('courses')} listSessions={store.listSessions} getMyProgress={store.getMyProgress} enrollCourse={store.enrollCourse} refreshAll={store.refreshAll} />;
      }
      case 'article-course-detail': {
        const articleCourse = (store.courses || []).find(c => c.id === activeParams?.courseId);
        if (!articleCourse) return <CourseCatalog courses={store.courses || []} enrollments={store.enrollments || []} onSelectCourse={(c) => handleNavigate('vod-course-detail', { courseId: c.id })} onSelectLiveCourse={(c) => handleNavigate('live-course-detail', { courseId: c.id })} onSelectArticleCourse={(c) => handleNavigate('article-course-detail', { courseId: c.id })} getStudentCourses={store.getStudentCourses} getMyEnrollments={store.getMyEnrollments} />;
        return <ArticleCourseDetail course={articleCourse} onBack={() => setActiveTab('courses')} getChapters={store.getChapters} getMyProgress={store.getMyProgress} updateProgress={store.updateProgress} enrollCourse={store.enrollCourse} refreshAll={store.refreshAll} />;
      }
      case 'interactive-courses':
        return <InteractiveCourseViewer />;
      case 'account': return <AccountSettings onBack={() => setActiveTab('home')} onChangePassword={store.changePassword} onResetData={store.resetUserData} onLogout={store.logout} onDeleteAccount={store.logout} currentUser={store.currentUser} onUpdateApiKey={async (apiKey) => { await store.updateProfile({ deepseekApiKey: apiKey }); }} />;
      case 'practical-practice': return <PracticalPractice onBackToPractice={() => setActiveTab('practice')} />;
      case 'registration': return <RegistrationTypeSelector onNavigate={setActiveTab} />;
      case 'registration-education': return <EducationRegistrationForm onNavigate={setActiveTab} />;
      case 'registration-vocational': return <VocationalRegistrationForm onNavigate={setActiveTab} />;
      case 'practice-mode': {
        const activeBankId = activeParams?.bankId || currentActiveBank.id;
        const activeBank = store.banks.find(b => b.id === activeBankId) || currentActiveBank;
        let questionsToLoad: Question[] | undefined = activeParams?.questions;
        const isMock = activeParams?.mode === PracticeMode.MOCK;
        const isMistake = activeParams?.mode === PracticeMode.MISTAKE;
        const isCustom = activeParams?.isCustom === true;
        const mockConfig = activeParams?.exam || activeParams?.config || activeParams;
        const orderedQuestionIds = activeParams?.orderedQuestionIds;
        const customCounts = activeParams?.customCounts;
        const selectedChapters = activeParams?.selectedChapters || mockConfig?.selectedChapters;

        if (isMistake) {
          questionsToLoad = store.mistakes.filter(q => q.bankId === activeBank.id);
          if (activeParams?.type) {
            questionsToLoad = questionsToLoad.filter(q => q.type === activeParams.type);
          }
        } else if (!questionsToLoad && customCounts) {
          // 只有在没有传递 questions 时才根据 customCounts 生成题目
          console.log('[App] 处理自定义练习:', { customCounts, selectedChapters, bankId: activeBank.id });
          let bankQs = store.questions.filter(q => q.bankId === activeBank.id);
          console.log('[App] 题库题目总数:', bankQs.length);
          
          // 如果选择了章节，先按章节过滤
          if (selectedChapters && selectedChapters.length > 0) {
            bankQs = bankQs.filter(q => q.chapter && selectedChapters.includes(q.chapter));
            console.log('[App] 章节过滤后题目数:', bankQs.length);
          }
          
          const singles = bankQs.filter(q => q.type === QuestionType.SINGLE).sort(() => Math.random() - 0.5).slice(0, customCounts[QuestionType.SINGLE] || 0);
          const multiples = bankQs.filter(q => q.type === QuestionType.MULTIPLE).sort(() => Math.random() - 0.5).slice(0, customCounts[QuestionType.MULTIPLE] || 0);
          const judges = bankQs.filter(q => q.type === QuestionType.JUDGE).sort(() => Math.random() - 0.5).slice(0, customCounts[QuestionType.JUDGE] || 0);
          const fillInBlanks = bankQs.filter(q => q.type === QuestionType.FILL_IN_BLANK).sort(() => Math.random() - 0.5).slice(0, customCounts[QuestionType.FILL_IN_BLANK] || 0);
          const shortAnswers = bankQs.filter(q => q.type === QuestionType.SHORT_ANSWER).sort(() => Math.random() - 0.5).slice(0, customCounts[QuestionType.SHORT_ANSWER] || 0);
          questionsToLoad = [...singles, ...multiples, ...judges, ...fillInBlanks, ...shortAnswers];
          console.log('[App] 最终生成题目数:', questionsToLoad.length, {
            单选: singles.length,
            多选: multiples.length,
            判断: judges.length,
            填空: fillInBlanks.length,
            简答: shortAnswers.length
          });
        } else if (!questionsToLoad && isMock && mockConfig) {
          // 只有在没有传递 questions 时才根据 mockConfig 生成题目
          let bankQs = store.questions.filter(q => q.bankId === (mockConfig.bankId || activeBank.id));
          
          console.log('[App] 处理模拟考试，bankQs 数量:', bankQs.length);
          
          // 如果选择了章节，先按章节过滤
          if (selectedChapters && selectedChapters.length > 0) {
            bankQs = bankQs.filter(q => q.chapter && selectedChapters.includes(q.chapter));
          }
          
          if (orderedQuestionIds) {
            questionsToLoad = orderedQuestionIds.map((id: string) => bankQs.find(q => q.id === id)).filter(Boolean) as Question[];
            console.log('[App] 根据 orderedQuestionIds 生成题目:', questionsToLoad.length, '/ 期望:', orderedQuestionIds.length);
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
                // 判断是系统考试还是模拟考试
                const isSystemExam = mockConfig?.id && !mockConfig.id.startsWith('mock-');
                const recordId = activeParams?.recordId || (isSystemExam ? `exam-${Date.now()}` : `mock-${Date.now()}`);
                const examId = mockConfig?.id || `mock-${Date.now()}`;
                
                store.addExamHistory({
                  id: recordId,
                  examId: examId,
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
                handleNavigate('exams', { view: isSystemExam ? 'system' : 'history' });
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
    <Layout user={store.currentUser!} activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setActiveParams(null); }} onLogout={store.logout} themeConfig={store.systemConfig || {}}>
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
