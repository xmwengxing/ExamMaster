import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Course, LiveSession } from '../../types';

interface LiveCourseManagerProps {
  course: Course | null;
  sessions: LiveSession[];
  onBack: () => void;
  listSessions: (courseId: string) => Promise<LiveSession[]>;
  createSession: (courseId: string, data: any) => Promise<any>;
  updateSession: (id: string, data: any) => Promise<any>;
  deleteSession: (id: string) => Promise<any>;
  updateSessionStatus: (id: string, status: string) => Promise<any>;
}

const LiveCourseManager: React.FC<LiveCourseManagerProps> = ({ course, sessions, onBack, listSessions, createSession, updateSession, deleteSession, updateSessionStatus }) => {
  const [localSessions, setLocalSessions] = useState<LiveSession[]>(sessions || []);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', meetingNumber: '', meetingUrl: '', meetingPassword: '',
    startTime: '', endTime: '', status: 'scheduled' as string, replayUrl: ''
  });

  useEffect(() => { setLocalSessions(sessions || []); }, [sessions]);

  const refresh = useCallback(async () => {
    if (!course) return;
    const updated = await listSessions(course.id);
    setLocalSessions(updated || []);
  }, [course, listSessions]);

  const openCreate = () => {
    setEditId(null);
    setForm({ title: '', meetingNumber: '', meetingUrl: '', meetingPassword: '', startTime: '', endTime: '', status: 'scheduled', replayUrl: '' });
    setShowModal(true);
  };

  const openEdit = (s: LiveSession) => {
    setEditId(s.id);
    setForm({
      title: s.title || '', meetingNumber: s.meetingNumber || '', meetingUrl: s.meetingUrl || '',
      meetingPassword: s.meetingPassword || '', startTime: s.startTime ? s.startTime.slice(0, 16) : '',
      endTime: s.endTime ? s.endTime.slice(0, 16) : '', status: s.status, replayUrl: s.replayUrl || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!course) return;
    if (editId) {
      await updateSession(editId, form);
    } else {
      await createSession(course.id, form);
    }
    setShowModal(false);
    await refresh();
  };

  const handleStatus = async (id: string, status: string) => {
    await updateSessionStatus(id, status);
    await refresh();
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除该直播场次吗？')) {
      await deleteSession(id);
      await refresh();
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case 'scheduled': return { text: '🔔 预约中', cls: 'bg-blue-100 text-blue-700' };
      case 'living': return { text: '🔴 直播中', cls: 'bg-red-100 text-red-700' };
      case 'ended': return { text: '✅ 已结束', cls: 'bg-gray-100 text-gray-600' };
      default: return { text: s, cls: 'bg-gray-100 text-gray-600' };
    }
  };

  const upcoming = useMemo(() => localSessions.filter(s => s.status === 'scheduled'), [localSessions]);
  const ended = useMemo(() => localSessions.filter(s => s.status === 'ended'), [localSessions]);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all text-gray-500">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h2 className="text-2xl font-black text-gray-900">管理直播课</h2>
            <p className="text-sm text-gray-400 font-bold">{course?.title || '加载中...'}</p>
          </div>
        </div>
        <button onClick={openCreate} className="bg-rose-600 text-white px-5 py-3 rounded-2xl font-black text-sm shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all active:scale-95">
          <i className="fa-solid fa-plus mr-2"></i> 新建直播场次
        </button>
      </div>

      <div className="space-y-6">
        {localSessions.length === 0 && (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <i className="fa-solid fa-broadcast-tower text-5xl mb-4 opacity-20"></i>
            <p className="font-black text-lg">暂无直播场次</p>
            <p className="text-sm mt-1">点击「新建直播场次」安排第一场直播</p>
          </div>
        )}

        {upcoming.length > 0 && (
          <div>
            <h3 className="font-black text-sm text-gray-500 mb-3 uppercase tracking-wider">即将开始</h3>
            {upcoming.map(s => {
              const st = statusLabel(s.status);
              return (
                <div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-black text-gray-900">{s.title || '未命名场次'}</h4>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${st.cls}`}>{st.text}</span>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-400 font-bold">
                        {s.startTime && <span><i className="fa-solid fa-calendar mr-1"></i>{new Date(s.startTime).toLocaleString('zh-CN')}</span>}
                        {s.meetingNumber && <span><i className="fa-solid fa-hashtag mr-1"></i>{s.meetingNumber}</span>}
                        {s.meetingPassword && <span><i className="fa-solid fa-key mr-1"></i>{s.meetingPassword}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleStatus(s.id, 'living')} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-black hover:bg-red-100">开始直播</button>
                      <button onClick={() => openEdit(s)} className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 text-gray-500"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                      <button onClick={() => handleDelete(s.id)} className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-red-50 hover:text-red-500 text-gray-400"><i className="fa-solid fa-trash text-xs"></i></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {ended.length > 0 && (
          <div>
            <h3 className="font-black text-sm text-gray-500 mb-3 uppercase tracking-wider">往期场次</h3>
            {ended.map(s => (
              <div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-3 opacity-75">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-700">{s.title || '未命名场次'}</h4>
                      <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">已结束</span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-400 font-bold">
                      {s.startTime && <span><i className="fa-solid fa-calendar mr-1"></i>{new Date(s.startTime).toLocaleString('zh-CN')}</span>}
                      {s.replayUrl && <span className="text-indigo-500"><i className="fa-solid fa-play mr-1"></i>已有回放</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(s)} className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 text-gray-400"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 animate-in zoom-in-95 duration-200 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-900">{editId ? '编辑直播场次' : '新建直播场次'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">场次名称</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600/20" placeholder="如: 第一期 - Java基础" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">腾讯会议号</label>
                <input value={form.meetingNumber} onChange={e => setForm({...form, meetingNumber: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600/20" placeholder="123-456-789" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">腾讯会议链接</label>
                <input value={form.meetingUrl} onChange={e => setForm({...form, meetingUrl: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600/20" placeholder="https://meeting.tencent.com/dm/xxxxx" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">会议密码</label>
                  <input value={form.meetingPassword} onChange={e => setForm({...form, meetingPassword: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600/20" placeholder="选填" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">回放地址</label>
                  <input value={form.replayUrl} onChange={e => setForm({...form, replayUrl: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600/20" placeholder="选填" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">开始时间</label>
                  <input type="datetime-local" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600/20" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">结束时间</label>
                  <input type="datetime-local" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600/20" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black">取消</button>
                <button onClick={handleSave} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-100">{editId ? '保存修改' : '创建场次'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveCourseManager;
