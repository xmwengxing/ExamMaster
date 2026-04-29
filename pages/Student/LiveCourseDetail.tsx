import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Course, LiveSession, CourseEnrollment } from '../../types';

interface LiveCourseDetailProps {
  course: Course;
  onBack: () => void;
  listSessions: (courseId: string) => Promise<LiveSession[]>;
  getMyProgress: (courseId: string) => Promise<CourseEnrollment | null>;
  enrollCourse: (courseId: string) => Promise<any>;
  refreshAll: () => Promise<void>;
}

const LiveCourseDetail: React.FC<LiveCourseDetailProps> = ({ course, onBack, listSessions, getMyProgress, enrollCourse, refreshAll }) => {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'ended'>('upcoming');
  const [showMeeting, setShowMeeting] = useState(false);
  const [meetingSession, setMeetingSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [course.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sess, prog] = await Promise.all([
        listSessions(course.id),
        getMyProgress(course.id)
      ]);
      setSessions(sess || []);

      // Auto-enroll
      if (!prog) {
        await enrollCourse(course.id);
        await refreshAll();
      }
    } catch (e) {
      console.error('Failed to load live course:', e);
    }
    setLoading(false);
  };

  const upcomingSessions = useMemo(() => sessions.filter(s => s.status === 'scheduled' || s.status === 'living'), [sessions]);
  const endedSessions = useMemo(() => sessions.filter(s => s.status === 'ended'), [sessions]);
  const currentSession = useMemo(() => sessions.find(s => s.status === 'living'), [sessions]);

  const statusLabel = (s: string) => {
    switch (s) {
      case 'scheduled': return { text: '预约中', cls: 'bg-blue-100 text-blue-700', icon: 'fa-clock' };
      case 'living': return { text: '🔴 直播中', cls: 'bg-red-100 text-red-700', icon: 'fa-circle' };
      case 'ended': return { text: '已结束', cls: 'bg-gray-100 text-gray-600', icon: 'fa-check-circle' };
      default: return { text: s, cls: 'bg-gray-100 text-gray-600', icon: 'fa-question' };
    }
  };

  const copyMeetingInfo = (s: LiveSession) => {
    const text = `会议号: ${s.meetingNumber}\n链接: ${s.meetingUrl}\n密码: ${s.meetingPassword || '无'}`;
    navigator.clipboard.writeText(text).then(() => alert('已复制会议信息'));
  };

  const openInApp = (s: LiveSession) => {
    if (s.meetingUrl) {
      window.open(s.meetingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const embedMeeting = (s: LiveSession) => {
    setMeetingSession(s);
    setShowMeeting(true);
  };

  // Try to convert Tencent Meeting link to embed format
  const getEmbedUrl = (s: LiveSession) => {
    if (!s.meetingUrl) return null;
    // Tencent meeting: https://meeting.tencent.com/dm/xxx -> embed
    if (s.meetingUrl.includes('meeting.tencent.com')) {
      // Try to use the iframe embed format
      return s.meetingUrl.replace('/dm/', '/embed/');
    }
    return s.meetingUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="fa-solid fa-spinner fa-spin text-3xl text-indigo-400 mb-4"></i>
          <p className="text-gray-400 font-bold">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all text-gray-500">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <div>
          <h2 className="text-2xl font-black text-gray-900">{course.title}</h2>
          <p className="text-sm text-gray-400 font-bold">{course.teacherName || '直播课'}</p>
        </div>
      </div>

      {/* Course Info Banner */}
      <div className="bg-gradient-to-br from-rose-50 to-indigo-50 border border-rose-100 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
            <i className="fa-solid fa-broadcast-tower text-2xl text-rose-500"></i>
          </div>
          <div>
            {currentSession ? (
              <div>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded-full text-xs font-black animate-pulse">
                  <i className="fa-solid fa-circle text-[6px]"></i> 直播进行中
                </span>
                <p className="text-sm text-gray-600 mt-2 font-bold">{currentSession.title}</p>
              </div>
            ) : upcomingSessions.length > 0 ? (
              <div>
                <span className="text-sm font-black text-gray-600">下一场直播</span>
                <p className="text-lg font-black text-gray-900 mt-1">{upcomingSessions[0].title}</p>
                {upcomingSessions[0].startTime && (
                  <p className="text-sm text-gray-500 mt-1">
                    <i className="fa-regular fa-calendar mr-1"></i>
                    {new Date(upcomingSessions[0].startTime).toLocaleString('zh-CN')}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <span className="text-sm font-black text-gray-600">暂无直播场次</span>
                <p className="text-sm text-gray-400 mt-1">等待管理员安排直播</p>
              </div>
            )}
          </div>
        </div>
        {course.description && <p className="text-sm text-gray-500 mt-4">{course.description}</p>}
      </div>

      {/* Live Sessions */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b">
          <button onClick={() => setActiveTab('upcoming')} className={`flex-1 py-4 text-sm font-black transition-all ${activeTab === 'upcoming' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}>
            即将开始 {upcomingSessions.length > 0 && `(${upcomingSessions.length})`}
          </button>
          <button onClick={() => setActiveTab('ended')} className={`flex-1 py-4 text-sm font-black transition-all ${activeTab === 'ended' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}>
            往期场次 {endedSessions.length > 0 && `(${endedSessions.length})`}
          </button>
        </div>

        <div className="p-4 space-y-3">
          {(activeTab === 'upcoming' ? upcomingSessions : endedSessions).map(s => {
            const st = statusLabel(s.status);
            return (
              <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-black text-gray-900">{s.title}</h4>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${st.cls}`}>{st.text}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400 font-bold">
                    {s.startTime && <span><i className="fa-solid fa-calendar mr-1"></i>{new Date(s.startTime).toLocaleString('zh-CN')}</span>}
                    {s.meetingNumber && <span><i className="fa-solid fa-hashtag mr-1"></i>{s.meetingNumber}</span>}
                    {s.meetingPassword && <span><i className="fa-solid fa-key mr-1"></i>{s.meetingPassword}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {s.status === 'ended' && s.replayUrl ? (
                    <button onClick={() => window.open(s.replayUrl, '_blank')} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-100">
                      <i className="fa-solid fa-play mr-1"></i> 观看回放
                    </button>
                  ) : s.status === 'living' ? (
                    <>
                      <button onClick={() => embedMeeting(s)} className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-black hover:bg-red-600">
                        <i className="fa-solid fa-play mr-1"></i> 进入直播
                      </button>
                      <button onClick={() => openInApp(s)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-black hover:bg-gray-200">
                        <i className="fa-solid fa-external-link mr-1"></i> App打开
                      </button>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => copyMeetingInfo(s)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-black hover:bg-gray-200">
                        <i className="fa-solid fa-copy mr-1"></i> 复制会议信息
                      </button>
                      {s.meetingUrl && (
                        <button onClick={() => openInApp(s)} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-100">
                          <i className="fa-solid fa-external-link mr-1"></i> 打开腾讯会议
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {(activeTab === 'upcoming' ? upcomingSessions : endedSessions).length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="font-bold text-sm">
                {activeTab === 'upcoming' ? '暂无即将开始的直播' : '暂无往期场次'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Meeting Embed Modal */}
      {showMeeting && meetingSession && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
            <div>
              <p className="font-black text-sm">{meetingSession.title}</p>
              <p className="text-xs text-gray-400">腾讯会议 · {meetingSession.meetingNumber}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => copyMeetingInfo(meetingSession)} className="px-3 py-1.5 bg-gray-700 rounded-lg text-xs font-bold hover:bg-gray-600">
                <i className="fa-solid fa-copy mr-1"></i> 复制
              </button>
              <button onClick={() => openInApp(meetingSession)} className="px-3 py-1.5 bg-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-500">
                <i className="fa-solid fa-external-link mr-1"></i> App打开
              </button>
              <button onClick={() => { setShowMeeting(false); setMeetingSession(null); }} className="px-3 py-1.5 bg-red-600 rounded-lg text-xs font-bold hover:bg-red-500">
                <i className="fa-solid fa-xmark mr-1"></i> 关闭
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black">
            {getEmbedUrl(meetingSession) ? (
              <iframe
                src={getEmbedUrl(meetingSession)!}
                className="w-full h-full border-0"
                allow="camera;microphone;fullscreen;display-capture"
                title="腾讯会议"
              ></iframe>
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <i className="fa-solid fa-link text-4xl mb-4 opacity-50"></i>
                  <p className="font-bold">无法嵌入直播</p>
                  <p className="text-sm text-gray-400 mt-2">请点击「App打开」在腾讯会议中观看</p>
                  <button onClick={() => openInApp(meetingSession)} className="mt-4 px-6 py-3 bg-indigo-600 rounded-xl text-white font-black">
                    <i className="fa-solid fa-external-link mr-2"></i> 打开腾讯会议
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveCourseDetail;
