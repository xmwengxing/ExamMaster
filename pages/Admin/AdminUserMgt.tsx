
import React, { useState, useEffect, useMemo } from 'react';
import { User, StudentPermission, QuestionBank } from '../../types';

interface AdminUserMgtProps {
  currentUser: User;
  admins: User[];
  students: User[];
  banks: QuestionBank[];
  onAddAdmin: (a: any) => void;
  onUpdateAdmin: (id: string, data: any) => void;
  onDeleteAdmin: (id: string) => void;
  onBatchStudentPerms: (data: Record<string, { studentPerms: StudentPermission[], allowedBankIds: string[] }>) => void;
  onUpdateStudentPerms: (id: string, perms: StudentPermission[], bankIds?: string[]) => void;
}

const AdminUserMgt: React.FC<AdminUserMgtProps> = ({ currentUser, admins, students, banks, onAddAdmin, onUpdateAdmin, onDeleteAdmin, onBatchStudentPerms, onUpdateStudentPerms }) => {
  // 安全检查：确保所有数组props都有默认值
  const safeAdmins = admins || [];
  const safeStudents = students || [];
  const safeBanks = banks || [];
  
  const [tab, setTab] = useState<'admin' | 'student'>('admin');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);

  // 搜索与分页状态
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('ALL'); // 新增：班级筛选
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const isSuperAdmin = currentUser.phone === 'admin';
  const hasStudentPermsAccess = isSuperAdmin || currentUser.permissions?.includes('student-perms');

  // 初始化标签页：二级管理员默认显示学员权限管理
  useEffect(() => {
    if (!isSuperAdmin && hasStudentPermsAccess) {
      setTab('student');
    }
  }, [isSuperAdmin, hasStudentPermsAccess]);

  // Local state for pending permission changes
  const [pendingPerms, setPendingPerms] = useState<Record<string, StudentPermission[]>>({});

  const menuOptions = [
    { id: 'dashboard', label: '数据看板' },
    { id: 'students', label: '学员管理' },
    { id: 'student-perms', label: '学员权限管理' },
    { id: 'banks', label: '题库管理' },
    { id: 'admin-exams', label: '考试发布' },
    { id: 'practical-center', label: '实操发布' },
    { id: 'supervisor', label: '督学管理' },
    { id: 'logs', label: '日志管理' },
    { id: 'vocational', label: '职业技能' },
    { id: 'discussion-manager', label: '讨论管理' },
    { id: 'settings', label: '系统设置' },
    { id: 'courses-admin', label: '在线课程' },
  ];

  // 获取所有班级列表（去重）
  const allClasses = useMemo(() => {
    const classes = safeStudents
      .map(s => s.className)
      .filter(c => c && c.trim())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
    return classes;
  }, [safeStudents]);

  // 学员列表搜索过滤逻辑（包含班级筛选）
  const filteredStudents = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return safeStudents.filter(s => {
      const matchSearch = s.realName?.toLowerCase().includes(term) || 
        s.phone?.includes(term) ||
        s.company?.toLowerCase().includes(term);
      const matchClass = classFilter === 'ALL' || s.className === classFilter;
      return matchSearch && matchClass;
    });
  }, [safeStudents, searchTerm, classFilter]);

  // 分页计算
  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage]);

  // Sync pending perms with students when entering the tab
  useEffect(() => {
    const initialPerms: Record<string, StudentPermission[]> = {};
    safeStudents.forEach(s => {
      initialPerms[s.id] = s.studentPerms || [];
    });
    setPendingPerms(initialPerms);
    console.log('[AdminUserMgt useEffect] Sync complete. Total students:', safeStudents.length);
  }, [safeStudents, tab]);

  // 权限检查：如果用户既不是超级管理员，也没有学员权限管理权限，则无法访问
  if (!isSuperAdmin && !hasStudentPermsAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8 bg-white rounded-3xl border border-rose-100 animate-in fade-in duration-300">
        <i className="fa-solid fa-ban text-5xl text-rose-500 mb-4"></i>
        <h3 className="text-xl font-bold text-gray-800">无访问权限</h3>
        <p className="text-gray-400 mt-2">您没有权限访问权限管理功能。如需开通，请联系超级管理员。</p>
      </div>
    );
  }

  if (tab === 'admin' && !isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8 bg-white rounded-3xl border border-rose-100 animate-in fade-in duration-300">
        <i className="fa-solid fa-lock text-5xl text-rose-500 mb-4"></i>
        <h3 className="text-xl font-bold text-gray-800">仅超级管理员可见</h3>
        <p className="text-gray-400 mt-2">二级管理员无法访问管理员账号管理。如需调整，请联系上级。</p>
        {hasStudentPermsAccess && (
          <button onClick={() => setTab('student')} className="mt-6 text-indigo-600 font-bold hover:underline">
            切换到学员权限管理
          </button>
        )}
      </div>
    );
  }

  const handleAdminSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const perms = menuOptions.map(m => m.id).filter(id => formData.get(id));
    
    console.log('[AdminUserMgt] 表单数据:', {
      phone: formData.get('phone'),
      realName: formData.get('realName'),
      permissions: perms,
      allFormData: Array.from(formData.entries())
    });
    
    const password = formData.get('password') as string;
    
    const data: any = {
      phone: formData.get('phone'),
      realName: formData.get('realName'),
      permissions: perms,
    };

    if (password) {
      data.password = password;
    }

    console.log('[AdminUserMgt] 提交数据:', data);

    if (editingAdmin) {
      onUpdateAdmin(editingAdmin.id, data);
    } else {
      onAddAdmin({ 
        ...data, 
        id: Date.now().toString(), 
        role: 'ADMIN', 
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.phone}`,
        nickname: data.realName
      });
    }
    setIsModalOpen(false);
  };

  const handleDeleteAdmin = (id: string, name: string) => {
    if (confirm(`确定要彻底删除二级管理员「${name}」吗？此操作无法撤销。`)) {
      onDeleteAdmin(id);
    }
  };

  const handleBatchImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('批量导入功能需要配合后端 API 或文件解析器。当前已模拟解析并触发权限更新。');
    const mockData: Record<string, { studentPerms: StudentPermission[], allowedBankIds: string[] }> = {
      '13800138000': { studentPerms: ['BANK', 'VIDEO', 'EXAM'], allowedBankIds: safeBanks[0]?.id ? [safeBanks[0].id] : [] }
    };
    onBatchStudentPerms(mockData);
    setIsBatchModalOpen(false);
  };

  const handleDownloadPermTemplate = () => {
    const headers = ['手机号*', '权限列表(用半角逗号分隔: BANK,EXAM,VIDEO)'].join(',');
    const example = ['13800138000', 'BANK,VIDEO,EXAM', safeBanks[0]?.id || 'bank-id-1'].join(',');
    const blob = new Blob([`\uFEFF${headers}\n${example}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "EduMaster_学员权限导入模板.csv";
    link.click();
  };

  const handlePermChange = (studentId: string, type: StudentPermission) => {
    setPendingPerms(prev => {
      const current = prev[studentId] || [];
      let next: StudentPermission[];
      if (current.includes(type)) {
        next = current.filter(p => p !== type);
      } else {
        next = [...current, type];
      }
      return { ...prev, [studentId]: next };
    });
  };

  const handleConfirmChanges = async () => {
    const changes: Record<string, { studentPerms: StudentPermission[], allowedBankIds: string[] }> = {};
    
    Object.entries(pendingPerms).forEach(([id, perms]) => {
      const student = safeStudents.find(s => s.id === id);
      const changed = JSON.stringify(student?.studentPerms || []) !== JSON.stringify(perms);
      if (changed) {
        changes[id] = { studentPerms: perms, allowedBankIds: student?.allowedBankIds || [] };
      }
    });
    
    if (Object.keys(changes).length === 0) { alert('未检测到变更'); return; }
    try {
      await onBatchStudentPerms(changes);
      alert('权限修改已确认生效！');
    } catch (error) {
      console.error('[handleConfirmChanges] Batch update failed:', error);
      alert('权限修改失败，请检查网络或后端日志');
    }
  };

  const hasPendingChanges = safeStudents.some(s => 
    JSON.stringify(s.studentPerms || []) !== JSON.stringify(pendingPerms[s.id] || [])
  );

  // 安全检查：如果currentUser为空，显示加载状态
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-bold">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标签页切换 - 只有超级管理员才能看到"管理员账号"标签 */}
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border self-start w-fit">
        {isSuperAdmin && (
          <button 
            onClick={() => setTab('admin')} 
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            管理员账号管理
          </button>
        )}
        {hasStudentPermsAccess && (
          <button 
            onClick={() => setTab('student')} 
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'student' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            学员权限管理
          </button>
        )}
      </div>

      {tab === 'admin' ? (
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <span className="font-bold text-gray-700">二级管理员列表</span>
            <button onClick={() => { setEditingAdmin(null); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"><i className="fa-solid fa-plus mr-1"></i> 新增管理员</button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">姓名/账号</th>
                <th className="px-6 py-4">已分配权限模块</th>
                <th className="px-6 py-4">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {safeAdmins.filter(a => a.phone !== 'admin').map(a => (
                <tr key={a.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-800">{a.realName}</div>
                    <div className="text-xs text-gray-400 font-mono">{a.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(a.permissions) && a.permissions.map(p => (
                        <span key={p} className="bg-indigo-50 text-indigo-600 text-[10px] px-2 py-0.5 rounded font-bold border border-indigo-100">
                          {menuOptions.find(m => m.id === p)?.label}
                        </span>
                      ))}
                      {(!a.permissions || !Array.isArray(a.permissions) || a.permissions.length === 0) && <span className="text-gray-300 text-[10px] italic">未分配权限</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setEditingAdmin(a); setIsModalOpen(true); }} className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center gap-1 transition-colors"><i className="fa-solid fa-pen-to-square"></i> 编辑</button>
                      <button onClick={() => handleDeleteAdmin(a.id, a.realName)} className="text-rose-500 hover:text-rose-700 text-sm font-bold flex items-center gap-1 transition-colors"><i className="fa-solid fa-trash-can"></i> 删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none md:w-64">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3 font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
                  placeholder="搜索学员姓名/手机号/单位..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <select 
                value={classFilter}
                onChange={(e) => { setClassFilter(e.target.value); setCurrentPage(1); }}
                className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
              >
                <option value="ALL">全部班级</option>
                {allClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button onClick={() => setIsBatchModalOpen(true)} className="flex-1 md:flex-none bg-gray-100 text-gray-600 px-5 py-3 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors">
                <i className="fa-solid fa-file-excel mr-1"></i> 批量导入权限
              </button>
              <button 
                onClick={handleConfirmChanges}
                disabled={!hasPendingChanges}
                className={`flex-1 md:flex-none px-5 py-3 rounded-xl text-xs font-black shadow-lg transition-all flex items-center gap-2 justify-center ${
                  hasPendingChanges 
                    ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 active:scale-95' 
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
                }`}
              >
                <i className="fa-solid fa-check-circle"></i> 确认并应用修改
              </button>
            </div>
          </div>
          
          <div className="border border-gray-100 rounded-2xl overflow-x-auto shadow-sm">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-gray-50/80 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b">
                <tr>
                  <th className="px-6 py-4">学员基本信息 (姓名/手机/单位)</th>
                  <th className="px-6 py-4 text-center">所属分组</th>
                  <th className="px-6 py-4 text-center"><span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[9px]">高优</span> 题库</th>
                  <th className="px-6 py-4 text-center">系统考试</th>
                  <th className="px-6 py-4 text-center"><span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[9px]">高优</span> 视频课程</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedStudents.map(s => {
                  const current = pendingPerms[s.id] || [];
                  const isBank = current.includes('BANK');
                  const isExam = current.includes('EXAM');
                  const isVideo = current.includes('VIDEO');
                  
                  return (
                    <tr key={s.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{s.realName}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{s.phone}</div>
                        <div className="text-[10px] text-indigo-500 font-bold mt-1 truncate max-w-[200px]">
                          {s.className && <span className="bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 mr-2">{s.className}</span>}
                          {s.company || '通用单位'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${s.groupId ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                          {s.groupId ? (s as any).groupName || '已分组' : '未分组'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded-lg border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                          checked={isBank} 
                          onChange={() => handlePermChange(s.id, 'BANK')}
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          checked={isExam} 
                          onChange={() => handlePermChange(s.id, 'EXAM')}
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded-lg border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                          checked={isVideo} 
                          onChange={() => handlePermChange(s.id, 'VIDEO')}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 分页控制组件 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4 bg-gray-50/30 rounded-2xl">
              <div className="text-xs font-bold text-gray-400">
                共 {filteredStudents.length} 名学员，每页 {pageSize} 条，当前第 {currentPage} / {totalPages} 页
              </div>
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-gray-400 disabled:opacity-30 hover:bg-gray-50 transition-all shadow-sm"
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                      currentPage === page 
                        ? 'bg-indigo-600 text-white shadow-lg' 
                        : 'bg-white border text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                )).filter((_, i) => Math.abs(i + 1 - currentPage) < 3 || i === 0 || i === totalPages - 1)}
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-gray-400 disabled:opacity-30 hover:bg-gray-50 transition-all shadow-sm"
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAdminSave} className="bg-white rounded-3xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-black text-gray-900 mb-6">{editingAdmin ? '编辑管理员权限' : '新增二级管理员'}</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">管理员姓名</label>
                <input required name="realName" className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600/20" placeholder="请输入姓名" defaultValue={editingAdmin?.realName} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">登录账号/手机号</label>
                <input required name="phone" className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600/20" placeholder="请输入账号" defaultValue={editingAdmin?.phone} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  {editingAdmin ? '登录密码 (留空则不修改)' : '设置登录密码'}
                </label>
                <input 
                  required={!editingAdmin} 
                  name="password" 
                  type="password" 
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600/20" 
                  placeholder={editingAdmin ? '••••••••' : '请输入登录密码'} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3 ml-1">分配功能模块权限</label>
                <div className="grid grid-cols-2 gap-3">
                  {menuOptions.map(m => (
                    <label key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl cursor-pointer hover:bg-indigo-50 transition-colors border-2 border-transparent has-[:checked]:border-indigo-600/20 has-[:checked]:bg-indigo-50/50">
                      <input type="checkbox" name={m.id} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" defaultChecked={editingAdmin?.permissions?.includes(m.id)} />
                      <span className="text-sm font-bold text-gray-700">{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-4 pt-8">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black hover:bg-gray-200 transition-colors">取消</button>
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">确认保存</button>
            </div>
          </form>
        </div>
      )}

      {/* Batch Import Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 animate-in zoom-in-95 duration-200 shadow-2xl">
            <h3 className="text-2xl font-black text-gray-900 mb-2">批量设置功能权限</h3>
            <p className="text-xs text-gray-400 mb-8">上传 Excel 表格以快速更新多名学员的功能开关及题库授权状态。</p>
            
            <div className="space-y-6">
              <div className="bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-3xl p-8 text-center cursor-pointer hover:bg-indigo-50 transition-colors group">
                <i className="fa-solid fa-cloud-arrow-up text-4xl text-indigo-400 mb-4 group-hover:scale-110 transition-transform"></i>
                <div className="text-sm font-bold text-indigo-600">点击此处上传设置文件</div>
                <div className="text-[10px] text-gray-400 mt-2">支持标准 Excel (.xlsx, .xls)</div>
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">填写规范说明</h4>
                <ul className="text-[11px] text-amber-700/80 space-y-1.5 list-disc pl-4">
                  <li>权限标识符: <strong>BANK</strong>（题库）, <strong>EXAM</strong>（系统考试）, <strong>VIDEO</strong>（视频课程）</li>
                  <li>多个权限用半角逗号分隔，如: BANK,EXAM,VIDEO</li>
                  <li><strong>题库</strong>和<strong>视频课程</strong>为高优先级：取消勾选后，无论分组如何配置，学员都无法访问</li>
                </ul>
              </div>

              <button 
                onClick={handleDownloadPermTemplate}
                className="w-full py-4 border-2 border-gray-100 text-gray-500 rounded-2xl text-xs font-black hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-download"></i> 获取 Excel 填写模板
              </button>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsBatchModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black">取消</button>
                <button onClick={handleBatchImportSubmit} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">确认并导入</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserMgt;
