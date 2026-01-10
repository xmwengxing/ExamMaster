
import React from 'react';
import { User, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  themeConfig?: any;
}

const Layout: React.FC<LayoutProps> = ({ children, user, activeTab, onTabChange, onLogout, themeConfig }) => {
  const isStudent = user.role === UserRole.STUDENT;
  const isSuperAdmin = user.phone === 'admin';
  
  // 确保themeConfig不为null或undefined
  const config = themeConfig || {};
  const logoIcon = config.logoIcon || 'fa-graduation-cap';
  const logoText = config.logoText || 'EduMaster';
  const logoImage = config.logoImage || '';

  const studentTabs = [
    { id: 'home', icon: 'fa-house', label: '首页' },
    { id: 'practice', icon: 'fa-book-open', label: '练习' },
    { id: 'exams', icon: 'fa-file-lines', label: '考试' },
    { id: 'mistakes', icon: 'fa-triangle-exclamation', label: '错题' },
    { id: 'discussions', icon: 'fa-comments', label: '讨论' },
  ];

  const adminTabs = [
    { id: 'dashboard', icon: 'fa-chart-line', label: '数据看板' },
    { id: 'admin-user', icon: 'fa-user-gear', label: '权限管理' },
    { id: 'students', icon: 'fa-users', label: '学员管理' },
    { id: 'banks', icon: 'fa-folder-tree', label: '题库管理' },
    { id: 'admin-exams', icon: 'fa-paper-plane', label: '考试发布' },
    { id: 'practical-center', icon: 'fa-keyboard', label: '实操发布' },
    { id: 'supervisor', icon: 'fa-user-check', label: '督学管理' },
    { id: 'discussion-manager', icon: 'fa-comments', label: '讨论管理' },
    { id: 'tags', icon: 'fa-tags', label: '标签管理' },
    { id: 'ai-analysis', icon: 'fa-wand-magic-sparkles', label: 'AI解析' },
    { id: 'settings', icon: 'fa-gears', label: '系统设置' },
  ];

  let currentTabs = studentTabs;
  if (!isStudent) {
    if (isSuperAdmin) {
      currentTabs = adminTabs;
    } else {
      currentTabs = adminTabs.filter(tab => {
        if (tab.id === 'admin-user') return false;
        if (tab.id === 'dashboard') return true;
        return user.permissions?.includes(tab.id);
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <aside className="hidden md:flex flex-col w-64 bg-white border-r sticky top-0 h-screen p-4 shadow-sm z-30">
        <div className="flex items-center gap-3 mb-8 px-2">
          {logoImage ? (
            <img src={logoImage} alt="Logo" className="w-10 h-10 object-contain" />
          ) : (
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <i className={`fa-solid ${logoIcon} text-white text-xl`}></i>
            </div>
          )}
          {logoText && <span className="font-bold text-xl tracking-tight">{logoText}</span>}
        </div>
        <nav className="flex-1 space-y-1">
          {currentTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === tab.id 
                  ? 'bg-indigo-50 text-indigo-600 font-bold' 
                  : 'text-gray-500 hover:bg-gray-100 font-medium'
              }`}
            >
              <i className={`fa-solid ${tab.icon} w-6 text-center text-lg`}></i>
              {tab.label}
            </button>
          ))}
        </nav>
        <button 
          onClick={onLogout}
          className="mt-auto flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold"
        >
          <i className="fa-solid fa-right-from-bracket w-6 text-center"></i>
          退出登录
        </button>
      </aside>

      <main className="flex-1 flex flex-col min-h-0 relative">
        <header className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2">
            {logoImage ? (
              <img src={logoImage} alt="Logo" className="w-8 h-8 object-contain" />
            ) : (
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <i className={`fa-solid ${logoIcon} text-white text-sm`}></i>
              </div>
            )}
            {logoText && <span className="font-bold text-lg">{logoText}</span>}
          </div>
          <button onClick={onLogout} className="text-gray-400">
            <i className="fa-solid fa-power-off"></i>
          </button>
        </header>
        
        <div className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden pb-24 md:pb-8 w-full max-w-full">
          <div className="w-full max-w-full">
            {children}
          </div>
        </div>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t h-16 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <div className={`flex items-center h-full ${isStudent ? 'justify-around px-2' : 'overflow-x-auto'}`}>
            <div className={`flex items-center h-full ${isStudent ? 'w-full justify-around' : 'px-2 min-w-max'}`}>
              {currentTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex flex-col items-center justify-center gap-1 h-full transition-all whitespace-nowrap ${
                    isStudent ? 'flex-1' : 'px-4'
                  } ${activeTab === tab.id ? 'text-indigo-600 scale-105' : 'text-gray-400'}`}
                >
                  <i className={`fa-solid ${tab.icon} text-lg`}></i>
                  <span className="text-[10px] font-bold">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>
      </main>
    </div>
  );
};

export default Layout;
