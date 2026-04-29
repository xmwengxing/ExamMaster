import React, { useState, useEffect, useMemo } from 'react';
import { Course } from '../../types';

interface CourseManagerProps {
  courses: Course[];
  listCourses: (filters?: any) => Promise<Course[]>;
  createCourse: (data: any) => Promise<any>;
  updateCourse: (id: string, data: any) => Promise<any>;
  deleteCourse: (id: string) => Promise<any>;
  updateCourseStatus: (id: string, status: string) => Promise<any>;
  createSession: (courseId: string, data: any) => Promise<any>;
  onEditVod?: (courseId: string) => void;
  onEditLive?: (courseId: string) => void;
  refreshAll: () => Promise<void>;
  presetType?: 'vod' | 'live';
}

const CourseManager: React.FC<CourseManagerProps> = ({ courses, listCourses, createCourse, updateCourse, deleteCourse, updateCourseStatus, createSession, onEditVod, onEditLive, refreshAll, presetType }) => {
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>(presetType || '');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [form, setForm] = useState({
    title: '', description: '', courseType: 'vod' as 'vod' | 'live',
    category: '', teacherName: '', teacherIntro: '', price: 0, sortOrder: 0, coverUrl: ''
  });

  const [localCourses, setLocalCourses] = useState<Course[]>(courses || []);

  useEffect(() => { setLocalCourses(courses || []); }, [courses]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await listCourses();
        if (data && data.length > 0) setLocalCourses(data);
      } catch (e) { console.error('CourseManager load failed:', e); }
    };
    fetchCourses();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    (localCourses || []).forEach(c => c.category && cats.add(c.category));
    return Array.from(cats);
  }, [localCourses]);

  const filteredCourses = useMemo(() => {
    return (localCourses || []).filter(c => {
      const effectiveType = presetType || filterType;
      if (effectiveType && c.courseType !== effectiveType) return false;
      if (filterCategory && c.category !== filterCategory) return false;
      if (filterStatus && c.status !== filterStatus) return false;
      return true;
    });
  }, [localCourses, filterType, filterCategory, filterStatus, presetType]);

  const openCreate = () => {
    setEditId(null);
    setForm({ title: '', description: '', courseType: presetType || 'vod', category: '', teacherName: '', teacherIntro: '', price: 0, sortOrder: 0, coverUrl: '' });
    setShowModal(true);
  };

  const openEdit = (c: Course) => {
    setEditId(c.id);
    setForm({ title: c.title, description: c.description || '', courseType: c.courseType, category: c.category || '', teacherName: c.teacherName || '', teacherIntro: c.teacherIntro || '', price: c.price || 0, sortOrder: c.sortOrder || 0, coverUrl: c.coverUrl || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (editId) {
      await updateCourse(editId, form);
    } else {
      const result = await createCourse(form);
      // 直播课：自动创建首场直播场次
      if (form.courseType === 'live' && result?.id) {
        const { meetingNumber, meetingUrl, meetingPassword, liveStartTime, liveDuration } = form as any;
        if (meetingNumber || meetingUrl) {
          const endTime = liveStartTime ? new Date(new Date(liveStartTime).getTime() + (parseInt(liveDuration) || 120) * 60000).toISOString().slice(0, 16) : '';
          await createSession(result.id, {
            title: form.title,
            meetingNumber: meetingNumber || '',
            meetingUrl: meetingUrl || '',
            meetingPassword: meetingPassword || '',
            startTime: liveStartTime || null,
            endTime: endTime || null,
            status: 'scheduled'
          }).catch(e => console.warn('Auto-create session failed:', e));
        }
      }
    }
    setShowModal(false);
    await refreshAll();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateCourseStatus(id, status);
    await refreshAll();
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除该课程吗？此操作不可恢复。')) {
      await deleteCourse(id);
      await refreshAll();
    }
  };

  const statusLabel = (s: string) => {
    switch (s) { case 'draft': return { text: '草稿', cls: 'bg-gray-100 text-gray-600' }; case 'published': return { text: '已发布', cls: 'bg-emerald-100 text-emerald-700' }; case 'archived': return { text: '已归档', cls: 'bg-amber-100 text-amber-700' }; default: return { text: s, cls: 'bg-gray-100 text-gray-600' }; }
  };

  const typeLabel = (t: string) => t === 'vod' ? '📹 录播课' : '🔴 直播课';

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900">{presetType === 'vod' ? '录播课管理' : presetType === 'live' ? '直播课管理' : '课程管理'}</h2>
          <p className="text-sm text-gray-400 mt-1 font-bold">{presetType ? (presetType === 'vod' ? '管理录播课程、章节与课时' : '管理直播课程与腾讯会议场次') : '管理所有在线课程'}</p>
        </div>
        <button onClick={openCreate} className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
          <i className="fa-solid fa-plus mr-2"></i> 新建课程
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        {presetType ? (
          <span className="bg-indigo-50 text-indigo-600 border-none rounded-xl px-4 py-2.5 text-sm font-bold">
            {presetType === 'vod' ? '📹 录播课' : '🔴 直播课'}
          </span>
        ) : (
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold outline-none">
            <option value="">全部类型</option>
            <option value="vod">录播课</option>
            <option value="live">直播课</option>
          </select>
        )}
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold outline-none">
          <option value="">全部分类</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold outline-none">
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
          <option value="archived">已归档</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.map(c => {
          const st = statusLabel(c.status);
          return (
            <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-full h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                {c.coverUrl ? <img src={c.coverUrl} alt="" className="w-full h-full object-cover" /> : <i className={`${c.courseType === 'vod' ? 'fa-film' : 'fa-broadcast-tower'} text-4xl text-indigo-300`}></i>}
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${st.cls}`}>{st.text}</span>
                <span className="text-[10px] font-bold text-gray-400">{typeLabel(c.courseType)}</span>
              </div>
              <h3 className="font-black text-gray-900 mb-1 truncate">{c.title}</h3>
              {c.category && <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{c.category}</span>}
              <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-400 font-bold">
                <span><i className="fa-solid fa-user mr-1"></i>{c.studentCount || 0} 学员</span>
              </div>
              <div className="flex gap-1 mt-3">
                <button onClick={() => openEdit(c)} className="flex-1 py-2 rounded-xl text-[10px] font-black bg-gray-50 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all">编辑</button>
                {c.courseType === 'vod' && <button onClick={() => onEditVod?.(c.id)} className="flex-1 py-2 rounded-xl text-[10px] font-black bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all">章节</button>}
                {c.courseType === 'live' && <button onClick={() => onEditLive?.(c.id)} className="flex-1 py-2 rounded-xl text-[10px] font-black bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all">场次</button>}
                {c.status !== 'published' ? (
                  <button onClick={() => handleStatusChange(c.id, 'published')} className="flex-1 py-2 rounded-xl text-[10px] font-black bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all">发布</button>
                ) : (
                  <button onClick={() => handleStatusChange(c.id, 'draft')} className="flex-1 py-2 rounded-xl text-[10px] font-black bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all">下架</button>
                )}
                <button onClick={() => handleDelete(c.id)} className="w-9 h-9 rounded-xl text-[10px] font-black bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all"><i className="fa-solid fa-trash text-xs"></i></button>
              </div>
            </div>
          );
        })}
        {filteredCourses.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <i className="fa-solid fa-video text-5xl mb-4 opacity-20"></i>
            <p className="font-black text-lg">暂无课程</p>
            <p className="text-sm mt-1">点击「新建课程」创建第一个在线课程</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 animate-in zoom-in-95 duration-200 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-900">{editId ? '编辑课程' : '新建课程'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">课程标题 *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600/20" placeholder="课程标题" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">课程类型 *</label>
                  {presetType ? (
                    <div className="w-full bg-gray-100 border-none rounded-2xl px-5 py-4 font-bold text-gray-500 select-none">
                      {presetType === 'vod' ? '📹 录播课' : '🔴 直播课'}
                    </div>
                  ) : (
                    <select value={form.courseType} onChange={e => setForm({...form, courseType: e.target.value as 'vod'|'live'})} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600/20">
                      <option value="vod">录播课</option>
                      <option value="live">直播课</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">分类</label>
                  <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600/20" placeholder="如: 编程基础" list="cat-suggestions" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">封面图地址</label>
                <input value={form.coverUrl} onChange={e => setForm({...form, coverUrl: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600/20" placeholder="https://... 或留空" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">讲师姓名</label>
                <input value={form.teacherName} onChange={e => setForm({...form, teacherName: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600/20" placeholder="讲师姓名" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">课程简介</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600/20" rows={3} placeholder="课程简介..." />
              </div>

              {/* 直播课专属设置 */}
              {form.courseType === 'live' && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-rose-700 font-black text-sm">
                    <i className="fa-solid fa-broadcast-tower"></i> 腾讯会议配置（首场直播）
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">会议号</label>
                    <input 
                      value={(form as any).meetingNumber || ''} 
                      onChange={e => setForm({...form, meetingNumber: e.target.value} as any)} 
                      className="w-full bg-white border border-rose-100 rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-rose-300" 
                      placeholder="123-456-789" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">腾讯会议链接</label>
                      <input 
                        value={(form as any).meetingUrl || ''} 
                        onChange={e => setForm({...form, meetingUrl: e.target.value} as any)} 
                        className="w-full bg-white border border-rose-100 rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-rose-300" 
                        placeholder="https://meeting.tencent.com/dm/xxxx" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">会议密码</label>
                      <input 
                        value={(form as any).meetingPassword || ''} 
                        onChange={e => setForm({...form, meetingPassword: e.target.value} as any)} 
                        className="w-full bg-white border border-rose-100 rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-rose-300" 
                        placeholder="选填" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">首场直播时间</label>
                      <input 
                        type="datetime-local" 
                        value={(form as any).liveStartTime || ''} 
                        onChange={e => setForm({...form, liveStartTime: e.target.value} as any)} 
                        className="w-full bg-white border border-rose-100 rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-rose-300" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">预计时长（分钟）</label>
                      <input 
                        type="number" 
                        placeholder="如: 120" 
                        value={(form as any).liveDuration || ''} 
                        onChange={e => setForm({...form, liveDuration: e.target.value} as any)} 
                        className="w-full bg-white border border-rose-100 rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-rose-300" 
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-rose-500 font-bold">
                    <i className="fa-solid fa-circle-info mr-1"></i>
                    此处配置首场直播的腾讯会议信息。发布后可继续在「直播课管理」中添加更多场次和回放。
                  </p>
                </div>
              )}

              {/* 录播课专属提示 */}
              {form.courseType === 'vod' && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3">
                  <p className="text-[11px] text-indigo-600 font-bold">
                    <i className="fa-solid fa-circle-info mr-1"></i>
                    发布课程后，可在「录播课管理」中添加章节和课时，上传或关联视频。
                  </p>
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black">取消</button>
                <button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100">确认保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManager;
