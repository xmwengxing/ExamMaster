import React, { useState, useMemo } from 'react';
import { User, QuestionBank } from '../../types';

interface AdminUserMgtProps {
  currentUser: User;
  admins: User[];
  students: User[];
  banks: QuestionBank[];
  onAddAdmin: (a: any) => void;
  onUpdateAdmin: (id: string, data: any) => void;
  onDeleteAdmin: (id: string) => void;
}

const AdminUserMgt: React.FC<AdminUserMgtProps> = ({ currentUser, admins, students, banks, onAddAdmin, onUpdateAdmin, onDeleteAdmin }) => {
  const safeAdmins = admins || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const isSuperAdmin = currentUser.phone === 'admin';

  const menuOptions = [
    { id: 'dashboard', label: '数据看板' },
    { id: 'students', label: '学员管理' },
    { id: 'student-perms', label: '学员权限管理' },
    { id: 'banks', label: '题库管理' },
    { id: 'admin-exams', label: '考试发布' },
    { id: 'practical-center', label: '实操发布' },
    { id: 'courses-admin', label: '在线课程' },
    { id: 'vocational', label: '职业技能' },
    { id: 'discussion-manager', label: '讨论管理' },
    { id: 'settings', label: '系统设置' },
  ];

  const filteredAdmins = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return safeAdmins.filter(a => {
      const matchSearch = a.realName?.toLowerCase().includes(term) ||
        a.phone?.includes(term);
      return matchSearch;
    });
  }, [safeAdmins, searchTerm]);

  const totalPages = Math.ceil(filteredAdmins.length / pageSize);
  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAdmins.slice(start, start + pageSize);
  }, [filteredAdmins, currentPage]);

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

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8 bg-white rounded-3xl border border-rose-100 animate-in fade-in duration-300">
        <i className="fa-solid fa-lock text-5xl text-rose-500 mb-4"></i>
        <h3 className="text-xl font-bold text-gray-800">仅超级管理员可见</h3>
        <p className="text-gray-400 mt-2">二级管理员无法访问管理员账号管理。如需调整，请联系上级。</p>
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden animate-in fade-in duration-300">
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
          <span className="font-bold text-gray-700">二级管理员列表</span>
          <button onClick={() => { setEditingAdmin(null); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"><i className="fa-solid fa-plus mr-1"></i> 新增管理员</button>
        </div>

        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3 font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
              placeholder="搜索管理员姓名/账号..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
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
            {paginatedAdmins.filter(a => a.phone !== 'admin').map(a => (
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 bg-gray-50/30 rounded-2xl m-4">
            <div className="text-xs font-bold text-gray-400">
              共 {filteredAdmins.length} 名管理员，每页 {pageSize} 条，当前第 {currentPage} / {totalPages} 页
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
    </div>
  );
};

export default AdminUserMgt;