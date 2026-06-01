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

function normalizePermissions(perms: any): GroupPermissions {
  const base = perms || {};
  let banks = base.banks;
  if (Array.isArray(banks)) {
    banks = banks.length === 0 ? { mode: 'none', banks: [] } : { mode: 'specific', banks };
  } else if (!banks || typeof banks !== 'object') {
    banks = { mode: 'all', banks: [] };
  }
  return {
    banks,
    exams: Array.isArray(base.exams) ? base.exams : [],
    vod_courses: base.vod_courses || { mode: 'all', categories: [], courses: [] },
    live_courses: base.live_courses || { mode: 'all', categories: [], courses: [] },
    article_courses: base.article_courses || { mode: 'all', categories: [], courses: [] },
    interactive_courses: base.interactive_courses || { mode: 'all', courses: [] }
  };
}

const defaultPermissions: GroupPermissions = {
  banks: { mode: 'all', banks: [] },
  exams: [],
  vod_courses: { mode: 'all', categories: [], courses: [] },
  live_courses: { mode: 'all', categories: [], courses: [] },
  article_courses: { mode: 'all', categories: [], courses: [] },
  interactive_courses: { mode: 'all', courses: [] }
};

const GroupManager: React.FC<GroupManagerProps> = ({ groups, students, banks, courses, listGroups, createGroup, updateGroup, deleteGroup, updateGroupPermissions, addStudentsToGroup, setStudentGroup, refreshAll }) => {
  const [localGroups, setLocalGroups] = useState<UserGroup[]>(groups || []);
  const [showModal, setShowModal] = useState<{ mode: 'create' | 'edit' | 'perms' | 'members' } | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [permData, setPermData] = useState<GroupPermissions>(defaultPermissions);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [memberClassFilter, setMemberClassFilter] = useState('ALL');
  const [memberPage, setMemberPage] = useState(1);
  const [memberPageSize, setMemberPageSize] = useState(20);
  const [membersTab, setMembersTab] = useState<'in-group' | 'all'>('in-group');
  const [selectedForGroup, setSelectedForGroup] = useState<Set<string>>(new Set());
  const [selectedForRemove, setSelectedForRemove] = useState<Set<string>>(new Set());

  const allMemberClasses = useMemo(() => {
    const classes = students.filter(s => s.role === 'STUDENT').map(s => s.className).filter(c => c && c.trim()).filter((v, i, a) => a.indexOf(v) === i).sort();
    return classes;
  }, [students]);

  const filteredMembers = useMemo(() => {
    const term = memberSearchTerm.toLowerCase();
    const inGroup = membersTab === 'in-group';
    return students.filter(s => {
      if (s.role !== 'STUDENT') return false;
      const inThisGroup = s.groupId === editId;
      if (inGroup && !inThisGroup) return false;
      if (!inGroup && inThisGroup) return false;
      const matchSearch = s.realName?.toLowerCase().includes(term) || s.phone?.includes(term) || s.company?.toLowerCase().includes(term);
      const matchClass = memberClassFilter === 'ALL' || s.className === memberClassFilter;
      return matchSearch && matchClass;
    });
  }, [students, memberSearchTerm, memberClassFilter, membersTab, editId]);

  const totalMemberPages = Math.ceil(filteredMembers.length / memberPageSize);
  const paginatedMembers = useMemo(() => {
    const start = (memberPage - 1) * memberPageSize;
    return filteredMembers.slice(start, start + memberPageSize);
  }, [filteredMembers, memberPage, memberPageSize]);

  const paginatedIdsInGroup = useMemo(() => new Set(paginatedMembers.filter(s => s.groupId === editId).map(s => s.id)), [paginatedMembers, editId]);
  const paginatedIdsNotInGroup = useMemo(() => new Set(paginatedMembers.filter(s => s.groupId !== editId).map(s => s.id)), [paginatedMembers, editId]);

  const allInGroupSelected = useMemo(() => paginatedIdsInGroup.size > 0 && [...paginatedIdsInGroup].every(id => selectedForRemove.has(id)), [paginatedIdsInGroup, selectedForRemove]);
  const allNotInGroupSelected = useMemo(() => paginatedIdsNotInGroup.size > 0 && [...paginatedIdsNotInGroup].every(id => selectedForGroup.has(id)), [paginatedIdsNotInGroup, selectedForGroup]);

  const toggleMemberSelect = (id: string, willAdd: boolean) => {
    if (willAdd) {
      setSelectedForGroup(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
      setSelectedForRemove(prev => { const n = new Set(prev); n.delete(id); return n; });
    } else {
      setSelectedForRemove(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
      setSelectedForGroup(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const toggleAllNotInGroupPage = () => {
    setSelectedForGroup(prev => {
      const n = new Set(prev);
      if (allNotInGroupSelected) { [...paginatedIdsNotInGroup].forEach(id => n.delete(id)); }
      else { [...paginatedIdsNotInGroup].forEach(id => n.add(id)); }
      return n;
    });
  };

  const toggleAllInGroupPage = () => {
    setSelectedForRemove(prev => {
      const n = new Set(prev);
      if (allInGroupSelected) { [...paginatedIdsInGroup].forEach(id => n.delete(id)); }
      else { [...paginatedIdsInGroup].forEach(id => n.add(id)); }
      return n;
    });
  };

  const handleSaveMembers = async () => {
    if (!editId) return;
    const addIds = [...selectedForGroup];
    const removeIds = [...selectedForRemove];
    try {
      const removePromises = removeIds.map(id => setStudentGroup(id, null));
      const addPromises = addIds.map(id => setStudentGroup(id, editId));
      await Promise.all([...removePromises, ...addPromises]);
      if (addIds.length > 0) alert(`已添加 ${addIds.length} 名学员`);
      if (removeIds.length > 0) alert(`已移除 ${removeIds.length} 名学员`);
      setSelectedForGroup(new Set());
      setSelectedForRemove(new Set());
    } catch(e) { console.error(e); alert('操作失败'); }
  };

  const handleCloseModal = () => {
    setShowModal(null);
    setSelectedForGroup(new Set());
    setSelectedForRemove(new Set());
    setMemberPage(1);
  };

  const totalSelected = selectedForGroup.size + selectedForRemove.size;

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

  const articleCategories = useMemo(() => {
    const cats = new Set<string>();
    (courses || []).filter((c: any) => c.courseType === 'article').forEach((c: any) => c.category && cats.add(c.category));
    return Array.from(cats);
  }, [courses]);

  const handleCreate = async () => {
    await createGroup(formData);
    setShowModal(null);
    setFormData({ name: '', description: '' });
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
  };

  const openPermsModal = (group: UserGroup) => {
    setEditId(group.id);
    setPermData(normalizePermissions(group.permissions));
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
      if (key === 'banks') {
        const cur = prev.banks?.banks || [];
        const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
        return { ...prev, banks: { ...prev.banks, mode: 'specific', banks: next } };
      }
      const arr = prev[key] || [];
      return { ...prev, [key]: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id] };
    });
  };

  const setBanksMode = (mode: 'all' | 'specific' | 'none') => {
    setPermData(prev => ({ ...prev, banks: { mode, banks: prev.banks?.banks || [] } }));
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

  const setArticleMode = (mode: GroupPermissions['article_courses']['mode']) => {
    setPermData(prev => ({ ...prev, article_courses: { ...prev.article_courses, mode } }));
  };

  const toggleArticleCategory = (cat: string) => {
    setPermData(prev => {
      const cats = prev.article_courses.categories || [];
      return { ...prev, article_courses: { ...prev.article_courses, categories: cats.includes(cat) ? cats.filter(c => c !== cat) : [...cats, cat] } };
    });
  };

  const toggleVodCourse = (courseId: string) => {
    setPermData(prev => {
      const courses = prev.vod_courses.courses || [];
      return { ...prev, vod_courses: { ...prev.vod_courses, courses: courses.includes(courseId) ? courses.filter(c => c !== courseId) : [...courses, courseId] } };
    });
  };

  const toggleLiveCourse = (courseId: string) => {
    setPermData(prev => {
      const courses = prev.live_courses.courses || [];
      return { ...prev, live_courses: { ...prev.live_courses, courses: courses.includes(courseId) ? courses.filter(c => c !== courseId) : [...courses, courseId] } };
    });
  };

  const toggleArticleCourse = (courseId: string) => {
    setPermData(prev => {
      const courses = prev.article_courses.courses || [];
      return { ...prev, article_courses: { ...prev.article_courses, courses: courses.includes(courseId) ? courses.filter(c => c !== courseId) : [...courses, courseId] } };
    });
  };

  const setInteractiveMode = (mode: GroupPermissions['interactive_courses']['mode']) => {
    setPermData(prev => ({ ...prev, interactive_courses: { ...prev.interactive_courses, mode } }));
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
                  {g.createdAt && <p className="text-[10px] text-gray-300 mt-1">创建于 {new Date(g.createdAt).toLocaleDateString('zh-CN')}</p>}
                  <div className="flex gap-2 mt-3">
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
                      题库: {g.permissions?.banks?.mode === 'all' ? '全部' : g.permissions?.banks?.mode === 'specific' ? `${g.permissions?.banks?.banks?.length || 0} 个` : '无'}
                    </span>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
                      录播: {g.permissions?.vod_courses?.mode || '未设置'}
                    </span>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
                      直播: {g.permissions?.live_courses?.mode || '未设置'}
                    </span>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
                      图文: {g.permissions?.article_courses?.mode || '未设置'}
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
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl p-8 animate-in zoom-in-95 duration-200 shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '85vh' }}>
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <h3 className="text-2xl font-black text-gray-900">{modalTitle}</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
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
                  <button onClick={handleCloseModal} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black">取消</button>
                  <button onClick={showModal.mode === 'create' ? handleCreate : handleUpdate} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100">确认保存</button>
                </div>
              </div>
            )}

            {showModal.mode === 'perms' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-black text-sm text-gray-700 mb-3"><i className="fa-solid fa-database mr-2 text-indigo-500"></i>题库练习权限</h4>
                  <div className="flex gap-2 mb-3">
                    {(['all', 'specific', 'none'] as const).map(m => (
                      <button key={m} onClick={() => setBanksMode(m)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${(permData.banks?.mode || 'all') === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {m === 'all' ? '全部' : m === 'specific' ? '指定' : '无'}
                      </button>
                    ))}
                  </div>
                  {permData.banks?.mode === 'specific' && (
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {(banks || []).map((b: any) => (
                        <label key={b.id} className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer border-2 transition-all ${(permData.banks?.banks || []).includes(b.id) ? 'border-indigo-600 bg-indigo-50' : 'border-gray-50 hover:border-gray-100'}`}>
                          <input type="checkbox" checked={(permData.banks?.banks || []).includes(b.id)} onChange={() => togglePerm('banks', b.id)} className="w-4 h-4 rounded text-indigo-600" />
                          <span className="text-xs font-bold truncate">{b.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
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
                  {permData.vod_courses?.mode === 'specific' && (
                    <div className="flex flex-wrap gap-2">
                      {(courses || []).filter((c: any) => c.courseType === 'vod').map(c => (
                        <label key={c.id} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg cursor-pointer border-2 transition-all text-xs font-bold ${(permData.vod_courses.courses || []).includes(c.id) ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 text-gray-500'}`}>
                          <input type="checkbox" checked={(permData.vod_courses.courses || []).includes(c.id)} onChange={() => toggleVodCourse(c.id)} className="w-3 h-3 rounded" /> {c.title || c.name}
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
                  {permData.live_courses?.mode === 'specific' && (
                    <div className="flex flex-wrap gap-2">
                      {(courses || []).filter((c: any) => c.courseType === 'live').map(c => (
                        <label key={c.id} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg cursor-pointer border-2 transition-all text-xs font-bold ${(permData.live_courses.courses || []).includes(c.id) ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 text-gray-500'}`}>
                          <input type="checkbox" checked={(permData.live_courses.courses || []).includes(c.id)} onChange={() => toggleLiveCourse(c.id)} className="w-3 h-3 rounded" /> {c.title || c.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-black text-sm text-gray-700 mb-3"><i className="fa-solid fa-file-alt mr-2 text-indigo-500"></i>图文课权限</h4>
                  <div className="flex gap-2 mb-3">
                    {(['all', 'category', 'specific', 'none'] as const).map(m => (
                      <button key={m} onClick={() => setArticleMode(m)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${permData.article_courses?.mode === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {m === 'all' ? '全部' : m === 'category' ? '按分类' : m === 'specific' ? '指定课程' : '无'}
                      </button>
                    ))}
                  </div>
                  {permData.article_courses?.mode === 'category' && (
                    <div className="flex flex-wrap gap-2">
                      {articleCategories.map(cat => (
                        <label key={cat} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg cursor-pointer border-2 transition-all text-xs font-bold ${(permData.article_courses.categories || []).includes(cat) ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 text-gray-500'}`}>
                          <input type="checkbox" checked={(permData.article_courses.categories || []).includes(cat)} onChange={() => toggleArticleCategory(cat)} className="w-3 h-3 rounded" /> {cat}
                        </label>
                      ))}
                    </div>
                  )}
                  {permData.article_courses?.mode === 'specific' && (
                    <div className="flex flex-wrap gap-2">
                      {(courses || []).filter((c: any) => c.courseType === 'article').map(c => (
                        <label key={c.id} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg cursor-pointer border-2 transition-all text-xs font-bold ${(permData.article_courses.courses || []).includes(c.id) ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 text-gray-500'}`}>
                          <input type="checkbox" checked={(permData.article_courses.courses || []).includes(c.id)} onChange={() => toggleArticleCourse(c.id)} className="w-3 h-3 rounded" /> {c.title || c.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-black text-sm text-gray-700 mb-3"><i className="fa-solid fa-comments mr-2 text-indigo-500"></i>互动课权限</h4>
                  <div className="flex gap-2 mb-3">
                    {(['all', 'none'] as const).map(m => (
                      <button key={m} onClick={() => setInteractiveMode(m)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${permData.interactive_courses?.mode === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {m === 'all' ? '全部可访问' : '无'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowModal(null)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black">取消</button>
                  <button onClick={handleSavePerms} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100">保存权限</button>
                </div>
              </div>
            )}
            </div>

            {showModal.mode === 'members' && (
              <div className="space-y-4">
                <div className="flex gap-2 mb-2">
                  <button onClick={() => { setMembersTab('in-group'); setMemberPage(1); setSelectedForGroup(new Set()); setSelectedForRemove(new Set()); }} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${membersTab === 'in-group' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    本组成员 ({students.filter(s => s.role === 'STUDENT' && s.groupId === editId).length})
                  </button>
                  <button onClick={() => { setMembersTab('all'); setMemberPage(1); setSelectedForGroup(new Set()); setSelectedForRemove(new Set()); }} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${membersTab === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    所有学员
                  </button>
                </div>
                <div className="flex gap-2">
                  <input value={memberSearchTerm} onChange={e => { setMemberSearchTerm(e.target.value); setMemberPage(1); }} placeholder="搜索姓名/手机/单位" className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600/20" />
                  <select value={memberClassFilter} onChange={e => { setMemberClassFilter(e.target.value); setMemberPage(1); }} className="bg-gray-50 border-none rounded-xl px-3 py-2 text-sm font-bold outline-none">
                    <option value="ALL">全部班级</option>
                    {allMemberClasses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="max-h-[calc(60vh)] overflow-y-auto border border-gray-100 rounded-xl">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/80 text-[9px] font-black text-gray-400 uppercase sticky top-0">
                      <tr>
                        <th className="px-3 py-2 w-8">
                          {membersTab === 'all' ? (
                            <input type="checkbox" checked={allNotInGroupSelected} onChange={toggleAllNotInGroupPage} className="w-4 h-4 rounded" />
                          ) : (
                            <input type="checkbox" checked={allInGroupSelected} onChange={toggleAllInGroupPage} className="w-4 h-4 rounded" />
                          )}
                        </th>
                        <th className="px-3 py-2">学员信息</th>
                        <th className="px-3 py-2 text-center">班级</th>
                        <th className="px-3 py-2 text-center">单位</th>
                        <th className="px-3 py-2 text-center">当前状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginatedMembers.map(s => {
                        const inGroup = s.groupId === editId;
                        const isAdding = selectedForGroup.has(s.id);
                        const isRemoving = selectedForRemove.has(s.id);
                        return (
                          <tr key={s.id} className={`hover:bg-indigo-50/20 ${isAdding ? 'bg-emerald-50' : isRemoving ? 'bg-rose-50' : ''}`}>
                            <td className="px-3 py-2">
                              <input type="checkbox" checked={inGroup ? isRemoving : isAdding} onChange={() => toggleMemberSelect(s.id, !inGroup)} className="w-4 h-4 rounded" />
                            </td>
                            <td className="px-3 py-2">
                              <div className="text-sm font-bold text-gray-700">{s.realName}</div>
                              <div className="text-[9px] text-gray-400">{s.phone}</div>
                            </td>
                            <td className="px-3 py-2 text-center text-xs text-gray-500">{s.className || '—'}</td>
                            <td className="px-3 py-2 text-center text-xs text-gray-400">{s.company || '通用单位'}</td>
                            <td className="px-3 py-2 text-center">
                              {isAdding ? (
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">待添加</span>
                              ) : isRemoving ? (
                                <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded">待移除</span>
                              ) : inGroup ? (
                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">已分组</span>
                              ) : (
                                <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-0.5 rounded">未分组</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {paginatedMembers.length === 0 && (
                        <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-xs">无学员</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-400">共 {filteredMembers.length} 人 | 已选 {totalSelected} 人</span>
                  <div className="flex items-center gap-2">
                    <select value={memberPageSize} onChange={e => { setMemberPageSize(Number(e.target.value)); setMemberPage(1); }} className="bg-gray-50 border-none rounded-lg px-2 py-1 text-xs font-bold">
                      <option value={20}>20条/页</option>
                      <option value={50}>50条/页</option>
                      <option value={100}>100条/页</option>
                    </select>
                    <button disabled={memberPage === 1} onClick={() => setMemberPage(p => p - 1)} className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 text-xs disabled:opacity-30"><i className="fa-solid fa-chevron-left"></i></button>
                    <span className="text-xs">{memberPage}/{totalMemberPages}</span>
                    <button disabled={memberPage === totalMemberPages} onClick={() => setMemberPage(p => p + 1)} className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 text-xs disabled:opacity-30"><i className="fa-solid fa-chevron-right"></i></button>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={handleCloseModal} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all">取消</button>
                  <button onClick={handleSaveMembers} disabled={totalSelected === 0} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-100 disabled:opacity-30 hover:bg-indigo-700 transition-all">保存</button>
                  <button onClick={async () => { await handleSaveMembers(); handleCloseModal(); }} disabled={totalSelected === 0} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-100 disabled:opacity-30 hover:bg-emerald-700 transition-all">保存并关闭</button>
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
