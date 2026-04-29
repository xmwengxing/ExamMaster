import React, { useState, useEffect, useMemo } from 'react';
import { UserGroup, GroupPermissions, User } from '../../types';

interface GroupManagerProps {
  groups: UserGroup[];
  students: User[];
  banks: any[];
  courses: any[];
  listGroups: () => Promise<UserGroup[]>;
  createGroup: (data: any) => Promise<any>;
  updateGroup: (id: string, data: any) => Promise<any>;
  deleteGroup: (id: string) => Promise<any>;
  updateGroupPermissions: (id: string, permissions: GroupPermissions) => Promise<any>;
  addStudentsToGroup: (groupId: string, userIds: string[]) => Promise<any>;
  setStudentGroup: (studentId: string, groupId: string | null) => Promise<any>;
  refreshAll: () => Promise<void>;
}

const defaultPermissions: GroupPermissions = {
  banks: [],
  exams: [],
  vod_courses: { mode: 'all', categories: [], courses: [] },
  live_courses: { mode: 'all', categories: [], courses: [] }
};

const GroupManager: React.FC<GroupManagerProps> = ({ groups, students, banks, courses, listGroups, createGroup, updateGroup, deleteGroup, updateGroupPermissions, addStudentsToGroup, setStudentGroup, refreshAll }) => {
  const [localGroups, setLocalGroups] = useState<UserGroup[]>(groups || []);
  const [showModal, setShowModal] = useState<{ mode: 'create' | 'edit' | 'perms' | 'members' } | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [permData, setPermData] = useState<GroupPermissions>(defaultPermissions);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { setLocalGroups(groups || []); }, [groups]);

  // 首次加载时主动拉取分组列表
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await listGroups();
        if (data && data.length > 0) setLocalGroups(data);
      } catch (e) { console.error('GroupManager load failed:', e); }
    };
    fetchGroups();
  }, []);

  const vodCategories = useMemo(() => {
    const cats = new Set<string>();
    (courses || []).filter((c: any) => c.courseType === 'vod').forEach((c: any) => c.category && cats.add(c.category));
    return Array.from(cats);
  }, [courses]);

  const liveCategories = useMemo(() => {
    const cats = new Set<string>();
    (courses || []).filter((c: any) => c.courseType === 'live').forEach((c: any) => c.category && cats.add(c.category));
    return Array.from(cats);
  }, [courses]);

  const handleCreate = async () => {
    await createGroup(formData);
    setShowModal(null);
    setFormData({ name: '', description: '' });
    await refreshAll();
  };

  const handleUpdate = async () => {
    if (!editId) return;
    await updateGroup(editId, formData);
    setShowModal(null);
    setEditId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除该分组吗？分组内的学员将恢复为未分组状态。')) {
      await deleteGroup(id);
      await refreshAll();
    }
  };

  const handleSavePerms = async () => {
    if (!editId) return;
    await updateGroupPermissions(editId, permData);
    setShowModal(null);
    setEditId(null);
    await refreshAll();
  };

  const handleSaveMembers = async () => {
    if (!editId) return;
    await addStudentsToGroup(editId, selectedStudents);
    setShowModal(null);
    setEditId(null);
    await refreshAll();
  };

  const openPermsModal = (group: UserGroup) => {
    setEditId(group.id);
    setPermData(group.permissions || defaultPermissions);
    setShowModal({ mode: 'perms' });
  };

  const openMembersModal = (group: UserGroup) => {
    setEditId(group.id);
    setShowModal({ mode: 'members' });
    setSelectedStudents([]);
  };

  const groupStudents = (groupId: string) => students.filter(s => s.groupId === groupId);

  const togglePerm = (key: 'banks' | 'exams', id: string) => {
    setPermData(prev => {
      const arr = prev[key] || [];
      return { ...prev, [key]: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id] };
    });
  };

  const setVodMode = (mode: GroupPermissions['vod_courses']['mode']) => {
    setPermData(prev => ({ ...prev, vod_courses: { ...prev.vod_courses, mode } }));
  };

  const toggleVodCategory = (cat: string) => {
    setPermData(prev => {
      const cats = prev.vod_courses.categories || [];
      return { ...prev, vod_courses: { ...prev.vod_courses, categories: cats.includes(cat) ? cats.filter(c => c !== cat) : [...cats, cat] } };
    });
  };

  const setLiveMode = (mode: GroupPermissions['live_courses']['mode']) => {
    setPermData(prev => ({ ...prev, live_courses: { ...prev.live_courses, mode } }));
  };

  const toggleLiveCategory = (cat: string) => {
    setPermData(prev => {
      const cats = prev.live_courses.categories || [];
      return { ...prev, live_courses: { ...prev.live_courses, categories: cats.includes(cat) ? cats.filter(c => c !== cat) : [...cats, cat] } };
    });
  };

  const modalTitle = showModal?.mode === 'create' ? '新建分组' : showModal?.mode === 'edit' ? '编辑分组' : showModal?.mode === 'perms' ? '编辑分组权限' : '管理分组学员';

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900">分组管理</h2>
          <p className="text-sm text-gray-400 mt-1 font-bold">管理学员分组与权限分配</p>
        </div>
        <button
          onClick={() => { setShowModal({ mode: 'create' }); setFormData({ name: '', description: '' }); }}
          className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <i className="fa-solid fa-plus mr-2"></i> 新建分组
        </button>
      </div>

      <div className="grid gap-4">
        {(localGroups || []).map(g => {
          const memberCount = groupStudents(g.id).length || g.memberCount || 0;
          return (
            <div key={g.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-black text-gray-900">{g.name}</h3>
                    <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">{memberCount} 名学员</span>
                  </div>
                  {g.description && <p className="text-sm text-gray-400 mt-1">{g.description}</p>}
                  <div className="flex gap-2 mt-3">
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
                      题库: {g.permissions?.banks?.length || 0} 个
                    </span>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
                      录播: {g.permissions?.vod_courses?.mode || '未设置'}
                    </span>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
                      直播: {g.permissions?.live_courses?.mode || '未设置'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openMembersModal(g)} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center transition-all"><i className="fa-solid fa-users"></i></button>
                  <button onClick={() => openPermsModal(g)} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 hover:bg-amber-50 hover:text-amber-600 flex items-center justify-center transition-all"><i className="fa-solid fa-shield-halved"></i></button>
                  <button onClick={() => { setShowModal({ mode: 'edit' }); setEditId(g.id); setFormData({ name: g.name, description: g.description || '' }); }} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center transition-all"><i className="fa-solid fa-pen-to-square"></i></button>
                  <button onClick={() => handleDelete(g.id)} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all"><i className="fa-solid fa-trash"></i></button>
                </div>
              </div>
            </div>
          );
        })}
        {(!localGroups || localGroups.length === 0) && (
          <div className="text-center py-16 text-gray-400">
            <i className="fa-solid fa-layer-group text-5xl mb-4 opacity-20"></i>
            <p className="font-black text-lg">暂无分组</p>
            <p className="text-sm mt-1">点击「新建分组」创建第一个学员分组</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 animate-in zoom-in-95 duration-200 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-900">{modalTitle}</h3>
              <button onClick={() => setShowModal(null)} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>

            {(showModal.mode === 'create' || showModal.mode === 'edit') && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">分组名称</label>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600/20" placeholder="如: 2025春季班" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">分组描述</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600/20" rows={3} placeholder="分组说明（可选）" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowModal(null)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black">取消</button>
                  <button onClick={showModal.mode === 'create' ? handleCreate : handleUpdate} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100">确认保存</button>
                </div>
              </div>
            )}

            {showModal.mode === 'perms' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-black text-sm text-gray-700 mb-3"><i className="fa-solid fa-database mr-2 text-indigo-500"></i>题库练习权限</h4>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {(banks || []).map((b: any) => (
                      <label key={b.id} className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer border-2 transition-all ${(permData.banks || []).includes(b.id) ? 'border-indigo-600 bg-indigo-50' : 'border-gray-50 hover:border-gray-100'}`}>
                        <input type="checkbox" checked={(permData.banks || []).includes(b.id)} onChange={() => togglePerm('banks', b.id)} className="w-4 h-4 rounded text-indigo-600" />
                        <span className="text-xs font-bold truncate">{b.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-black text-sm text-gray-700 mb-3"><i className="fa-solid fa-film mr-2 text-indigo-500"></i>录播课权限</h4>
                  <div className="flex gap-2 mb-3">
                    {(['all', 'category', 'specific', 'none'] as const).map(m => (
                      <button key={m} onClick={() => setVodMode(m)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${permData.vod_courses?.mode === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {m === 'all' ? '全部' : m === 'category' ? '按分类' : m === 'specific' ? '指定课程' : '无'}
                      </button>
                    ))}
                  </div>
                  {permData.vod_courses?.mode === 'category' && (
                    <div className="flex flex-wrap gap-2">
                      {vodCategories.map(cat => (
                        <label key={cat} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg cursor-pointer border-2 transition-all text-xs font-bold ${(permData.vod_courses.categories || []).includes(cat) ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 text-gray-500'}`}>
                          <input type="checkbox" checked={(permData.vod_courses.categories || []).includes(cat)} onChange={() => toggleVodCategory(cat)} className="w-3 h-3 rounded" /> {cat}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-black text-sm text-gray-700 mb-3"><i className="fa-solid fa-broadcast-tower mr-2 text-indigo-500"></i>直播课权限</h4>
                  <div className="flex gap-2 mb-3">
                    {(['all', 'category', 'specific', 'none'] as const).map(m => (
                      <button key={m} onClick={() => setLiveMode(m)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${permData.live_courses?.mode === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {m === 'all' ? '全部' : m === 'category' ? '按分类' : m === 'specific' ? '指定课程' : '无'}
                      </button>
                    ))}
                  </div>
                  {permData.live_courses?.mode === 'category' && (
                    <div className="flex flex-wrap gap-2">
                      {liveCategories.map(cat => (
                        <label key={cat} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg cursor-pointer border-2 transition-all text-xs font-bold ${(permData.live_courses.categories || []).includes(cat) ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 text-gray-500'}`}>
                          <input type="checkbox" checked={(permData.live_courses.categories || []).includes(cat)} onChange={() => toggleLiveCategory(cat)} className="w-3 h-3 rounded" /> {cat}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowModal(null)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black">取消</button>
                  <button onClick={handleSavePerms} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100">保存权限</button>
                </div>
              </div>
            )}

            {showModal.mode === 'members' && (
              <div className="space-y-4">
                <p className="text-xs text-gray-400 font-bold">勾选学员以添加到该分组（已在此分组的学员将自动勾选）</p>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {students.filter(s => s.role === 'STUDENT').map(s => (
                    <label key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-50 hover:border-indigo-100 cursor-pointer">
                      <input type="checkbox" checked={s.groupId === editId} onChange={async () => { await setStudentGroup(s.id, s.groupId === editId ? null : editId); await refreshAll(); }} className="w-4 h-4 rounded text-indigo-600" />
                      <div>
                        <div className="text-sm font-bold text-gray-700">{s.realName}</div>
                        <div className="text-[10px] text-gray-400">{s.phone}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowModal(null)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black">完成</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupManager;
