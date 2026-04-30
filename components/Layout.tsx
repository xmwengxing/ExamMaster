
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  hasSubmenu?: boolean;
  submenu?: Array<{
    id: string;
    icon: string;
    label: string;
  }>;
}

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
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['banks', 'students']); // 默认展开题库管理和学员管理
  const [mobileSubmenu, setMobileSubmenu] = useState<{ parent: MenuItem; items: MenuItem['submenu'] } | null>(null);
  
  // 确保themeConfig不为null或undefined
  const config = themeConfig || {};
  const logoIcon = config.logoIcon || 'fa-graduation-cap';
  const logoText = config.logoText || 'EduMaster';
  const logoImage = config.logoImage || '';

  const studentTabs: MenuItem[] = [
    { id: 'home', icon: 'fa-house', label: '首页' },
    { id: 'practice', icon: 'fa-book-open', label: '练习' },
    { id: 'exams', icon: 'fa-file-lines', label: '考试' },
    { id: 'mistakes', icon: 'fa-triangle-exclamation', label: '错题' },
    { id: 'discussions', icon: 'fa-comments', label: '讨论' },
    { id: 'courses', icon: 'fa-graduation-cap', label: '课程' },
  ];

  const adminTabs: MenuItem[] = [
    { id: 'dashboard', icon: 'fa-chart-line', label: '数据看板' },
    { id: 'admin-user', icon: 'fa-user-gear', label: '权限管理' },
    { 
      id: 'students', 
      icon: 'fa-users', 
      label: '学员管理',
      hasSubmenu: true,
      submenu: [
        { id: 'students', icon: 'fa-user', label: '账号管理' },
        { id: 'groups', icon: 'fa-layer-group', label: '分组管理' },
        { id: 'registration-materials', icon: 'fa-file-alt', label: '报名材料' },
        { id: 'supervisor', icon: 'fa-user-check', label: '督学管理' },
      ]
    },
    { 
      id: 'banks', 
      icon: 'fa-folder-tree', 
      label: '题库管理',
      hasSubmenu: true,
      submenu: [
        { id: 'banks', icon: 'fa-database', label: '题库列表' },
        { id: 'question-bank-converter', icon: 'fa-file-import', label: '题库转换' },
        { id: 'import-manager', icon: 'fa-cloud-arrow-up', label: '导入管理' },
        { id: 'tags', icon: 'fa-tags', label: '标签管理' },
        { id: 'ai-analysis', icon: 'fa-wand-magic-sparkles', label: 'AI解析' },
      ]
    },
    { id: 'admin-exams', icon: 'fa-paper-plane', label: '考试发布' },
    { id: 'practical-center', icon: 'fa-keyboard', label: '实操发布' },
    { 
      id: 'courses-admin', 
      icon: 'fa-video', 
      label: '在线课程',
      hasSubmenu: true,
      submenu: [
        { id: 'vod-course-editor', icon: 'fa-film', label: '录播课管理' },
        { id: 'live-course-manager', icon: 'fa-broadcast-tower', label: '直播课管理' },
      ]
    },
    { 
      id: 'vocational', 
      icon: 'fa-briefcase', 
      label: '职业技能',
      hasSubmenu: true,
      submenu: [
        { id: 'major-forms', icon: 'fa-table', label: '专业表单' },
        { id: 'occupation-management', icon: 'fa-briefcase', label: '职业工种管理' },
      ]
    },
    { id: 'discussion-manager', icon: 'fa-comments', label: '讨论管理' },
    { 
      id: 'settings', 
      icon: 'fa-gears', 
      label: '系统设置',
      hasSubmenu: true,
      submenu: [
        { id: 'settings', icon: 'fa-cog', label: '系统配置' },
        { id: 'settings-content', icon: 'fa-layer-group', label: '内容管理' },
        { id: 'settings-security', icon: 'fa-shield-halved', label: '系统安全' },
        { id: 'logs', icon: 'fa-clipboard-list', label: '日志管理' },
      ]
    },
  ];

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  let currentTabs = studentTabs;
  if (!isStudent) {
    if (isSuperAdmin) {
      currentTabs = adminTabs;
    } else {
      currentTabs = adminTabs.filter(tab => {
        // 权限管理：只有拥有"学员权限管理"权限的管理员才能访问
        if (tab.id === 'admin-user') {
          return user.permissions?.includes('student-perms');
        }
        // 数据看板：所有管理员都可以访问
        if (tab.id === 'dashboard') return true;
        // 其他功能：根据permissions判断
        return user.permissions?.includes(tab.id);
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <aside className="hidden md:flex flex-col w-64 bg-white border-r sticky top-0 h-screen shadow-sm z-30">
        {/* Logo区域 - 固定不滚动 */}
        <div className="flex items-center gap-3 p-4 px-6 border-b shrink-0">
          {logoImage ? (
            <img src={logoImage} alt="Logo" className="w-10 h-10 object-contain" />
          ) : (
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <i className={`fa-solid ${logoIcon} text-white text-xl`}></i>
            </div>
          )}
          {logoText && <span className="font-bold text-xl tracking-tight">{logoText}</span>}
        </div>
        
        {/* 导航区域 - 可滚动 */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-1 custom-scrollbar">
          {currentTabs.map(tab => (
            <div key={tab.id}>
              {tab.hasSubmenu ? (
                <>
                  {/* 父菜单 */}
                  <button
                    onClick={() => toggleMenu(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      (tab.id === 'banks' && ['banks', 'question-bank-converter', 'import-manager', 'tags', 'ai-analysis'].includes(activeTab)) ||
                      (tab.id === 'students' && ['students', 'groups', 'registration-materials', 'supervisor'].includes(activeTab)) ||
                      (tab.id === 'courses-admin' && ['vod-course-editor', 'live-course-manager'].includes(activeTab)) ||
                      (tab.id === 'vocational' && ['major-forms', 'occupation-management'].includes(activeTab)) ||
                      (tab.id === 'settings' && ['settings', 'settings-content', 'settings-security', 'logs'].includes(activeTab))
                        ? 'bg-indigo-50 text-indigo-600 font-bold' 
                        : 'text-gray-500 hover:bg-gray-100 font-medium'
                    }`}
                  >
                    <i className={`fa-solid ${tab.icon} w-6 text-center text-lg`}></i>
                    <span className="flex-1 text-left">{tab.label}</span>
                    <i className={`fa-solid fa-chevron-${expandedMenus.includes(tab.id) ? 'down' : 'right'} text-xs`}></i>
                  </button>
                  
                  {/* 子菜单 */}
                  {expandedMenus.includes(tab.id) && tab.submenu && (
                    <div className="ml-4 mt-1 space-y-1">
                      {tab.submenu.map(subItem => (
                        <button
                          key={subItem.id}
                          onClick={() => onTabChange(subItem.id)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm ${
                            activeTab === subItem.id 
                              ? 'bg-indigo-100 text-indigo-700 font-bold' 
                              : 'text-gray-500 hover:bg-gray-50 font-medium'
                          }`}
                        >
                          <i className={`fa-solid ${subItem.icon} w-5 text-center`}></i>
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* 普通菜单项 */
                <button
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
              )}
            </div>
          ))}
        </nav>
        
        {/* 退出按钮 - 固定在底部 */}
        <div className="p-4 border-t shrink-0">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold"
          >
            <i className="fa-solid fa-right-from-bracket w-6 text-center"></i>
            退出登录
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-0 relative">
        {/* 移动端顶部导航栏 - 仅管理员显示 */}
        {!isStudent && (
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
        )}
        
        <div className={`flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden pb-24 md:pb-8 w-full max-w-full ${isStudent ? 'pt-4' : ''}`}>
          <div className="w-full max-w-full">
            {children}
          </div>
        </div>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t h-16 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center h-full overflow-x-auto px-1">
            {currentTabs.map(tab => {
              const hasChildren = tab.hasSubmenu && tab.submenu;
              const isActive = hasChildren 
                ? tab.submenu!.some(s => s.id === activeTab) || activeTab === tab.id
                : activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (hasChildren) {
                      setMobileSubmenu({ parent: tab, items: tab.submenu! });
                    } else {
                      onTabChange(tab.id);
                    }
                  }}
                  className={`flex flex-col items-center justify-center gap-0.5 h-14 px-2 flex-shrink-0 rounded-xl transition-all ${
                    isActive ? 'text-indigo-600' : 'text-gray-400'
                  }`}
                >
                  <i className={`fa-solid ${tab.icon} text-lg`}></i>
                  <span className="text-[9px] font-bold leading-tight whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Mobile Submenu Drawer */}
        {mobileSubmenu && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileSubmenu(null)}></div>
            <div className="relative bg-white rounded-t-[2rem] p-6 animate-in slide-in-from-bottom duration-300 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-gray-900">
                  <i className={`fa-solid ${mobileSubmenu.parent.icon} mr-2 text-indigo-500`}></i>
                  {mobileSubmenu.parent.label}
                </h3>
                <button onClick={() => setMobileSubmenu(null)} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {mobileSubmenu.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { onTabChange(item.id); setMobileSubmenu(null); }}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${
                      activeTab === item.id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <i className={`fa-solid ${item.icon} w-5 text-center`}></i>
                    {item.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { onTabChange(mobileSubmenu.parent.id); setMobileSubmenu(null); }}
                className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm"
              >
                返回首页菜单
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Layout;
