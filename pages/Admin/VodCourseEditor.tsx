import React, { useState, useEffect, useCallback } from 'react';
import { Course, CourseChapter, CourseLesson } from '../../types';

interface VodCourseEditorProps {
  course: Course | null;
  chapters: CourseChapter[];
  onBack: () => void;
  getCourse: (id: string) => Promise<Course>;
  getChapters: (courseId: string) => Promise<CourseChapter[]>;
  createChapter: (courseId: string, data: any) => Promise<any>;
  updateChapter: (id: string, data: any) => Promise<any>;
  deleteChapter: (id: string) => Promise<any>;
  reorderChapters: (orderedIds: string[]) => Promise<any>;
  createLesson: (chapterId: string, data: any) => Promise<any>;
  updateLesson: (id: string, data: any) => Promise<any>;
  deleteLesson: (id: string) => Promise<any>;
  reorderLessons: (orderedIds: string[]) => Promise<any>;
  refreshAll: () => Promise<void>;
}

const VodCourseEditor: React.FC<VodCourseEditorProps> = ({ course, chapters, onBack, getCourse, getChapters, createChapter, updateChapter, deleteChapter, reorderChapters, createLesson, updateLesson, deleteLesson, reorderLessons }) => {
  const [localChapters, setLocalChapters] = useState<CourseChapter[]>(chapters || []);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [showNewChapter, setShowNewChapter] = useState(false);
  const [lessonForm, setLessonForm] = useState({
    title: '', videoType: 'upload' as 'upload' | 'embed' | 'link',
    videoUrl: '', duration: 0, isFreePreview: false
  });
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [showNewLesson, setShowNewLesson] = useState<string | null>(null); // chapterId

  useEffect(() => { setLocalChapters(chapters || []); }, [chapters]);

  const refreshChapters = useCallback(async () => {
    if (!course) return;
    const updated = await getChapters(course.id);
    setLocalChapters(updated || []);
  }, [course, getChapters]);

  useEffect(() => { refreshChapters(); }, [refreshChapters]);

  // Video type label
  const videoTypeLabel = (t: string) => { switch (t) { case 'upload': return '📤 上传'; case 'embed': return '🌐 嵌入'; case 'link': return '🔗 外链'; default: return t; } };

  // Duration formatter
  const formatDuration = (secs: number) => {
    if (!secs) return '--:--';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
  };

  const handleAddChapter = async () => {
    if (!course || !newChapterTitle.trim()) return;
    await createChapter(course.id, { title: newChapterTitle.trim(), sortOrder: localChapters.length });
    setNewChapterTitle('');
    setShowNewChapter(false);
    await refreshChapters();
  };

  const handleAddLesson = async (chapterId: string) => {
    if (!lessonForm.title.trim()) return;
    await createLesson(chapterId, { ...lessonForm, sortOrder: (localChapters.find(c => c.id === chapterId)?.lessons?.length || 0) });
    setLessonForm({ title: '', videoType: 'upload', videoUrl: '', duration: 0, isFreePreview: false });
    setShowNewLesson(null);
    await refreshChapters();
  };

  const handleUpdateLesson = async () => {
    if (!editingLessonId) return;
    await updateLesson(editingLessonId, lessonForm);
    setEditingLessonId(null);
    setSelectedLesson(null);
    await refreshChapters();
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm('确定要删除该课时吗？')) return;
    await deleteLesson(id);
    setSelectedLesson(null);
    await refreshChapters();
  };

  const handleDeleteChapter = async (id: string) => {
    if (!confirm('确定要删除该章节及其下所有课时吗？')) return;
    await deleteChapter(id);
    await refreshChapters();
  };

  const openEditLesson = (lesson: CourseLesson) => {
    setEditingLessonId(lesson.id);
    setSelectedLesson(lesson);
    setLessonForm({
      title: lesson.title, videoType: lesson.videoType || 'upload',
      videoUrl: lesson.videoUrl || '', duration: lesson.duration || 0,
      isFreePreview: lesson.isFreePreview || false
    });
  };

  const newLessonMode = () => {
    setEditingLessonId(null);
    setSelectedLesson(null);
    setLessonForm({ title: '', videoType: 'upload', videoUrl: '', duration: 0, isFreePreview: false });
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all text-gray-500">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h2 className="text-2xl font-black text-gray-900">编辑录播课</h2>
            <p className="text-sm text-gray-400 font-bold">{course?.title || '加载中...'}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left: Chapter/Lesson Tree */}
        <div className="w-80 shrink-0">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <h3 className="font-black text-sm text-gray-700 mb-3 flex items-center gap-2">
              <i className="fa-solid fa-list-tree text-indigo-500"></i> 章节与课时
            </h3>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {localChapters.map(ch => (
                <div key={ch.id}>
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 group">
                    <span className="text-sm font-bold text-gray-700 truncate">{ch.title}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setShowNewLesson(ch.id)} className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center" title="添加课时"><i className="fa-solid fa-plus text-[10px]"></i></button>
                      <button onClick={() => handleDeleteChapter(ch.id)} className="w-6 h-6 rounded-lg bg-red-50 text-red-400 flex items-center justify-center" title="删除章节"><i className="fa-solid fa-trash text-[10px]"></i></button>
                    </div>
                  </div>
                  <div className="ml-2 mt-1 space-y-0.5">
                    {(ch.lessons || []).map(ls => (
                      <button
                        key={ls.id}
                        onClick={() => openEditLesson(ls)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all truncate ${
                          selectedLesson?.id === ls.id 
                            ? 'bg-indigo-100 text-indigo-700' 
                            : 'hover:bg-gray-50 text-gray-500'
                        }`}
                      >
                        {ls.isFreePreview && <span className="text-[10px] bg-green-100 text-green-600 px-1 py-0.5 rounded mr-1">试看</span>}
                        {ls.title}
                      </button>
                    ))}
                    {showNewLesson === ch.id && (
                      <div className="px-2 py-2">
                        <input
                          autoFocus
                          value={lessonForm.title}
                          onChange={e => setLessonForm({...lessonForm, title: e.target.value})}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddLesson(ch.id); if (e.key === 'Escape') setShowNewLesson(null); }}
                          placeholder="新课标题（回车创建）"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {showNewChapter ? (
              <div className="mt-3 flex gap-2">
                <input autoFocus value={newChapterTitle} onChange={e => setNewChapterTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddChapter(); if (e.key === 'Escape') setShowNewChapter(false); }} placeholder="章节标题" className="flex-1 text-xs px-3 py-2 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-300" />
                <button onClick={handleAddChapter} className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black">添加</button>
              </div>
            ) : (
              <button onClick={() => setShowNewChapter(true)} className="w-full mt-3 py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-all">
                <i className="fa-solid fa-plus mr-1"></i> 新增章节
              </button>
            )}
          </div>
        </div>

        {/* Right: Lesson Editor */}
        <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          {selectedLesson || editingLessonId ? (
            <div className="space-y-5">
              <h3 className="font-black text-lg text-gray-900">{editingLessonId ? '编辑课时' : '新建课时'}</h3>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">课时标题</label>
                <input value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">视频类型</label>
                  <select value={lessonForm.videoType} onChange={e => setLessonForm({...lessonForm, videoType: e.target.value as any})} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600/20">
                    <option value="upload">📤 上传视频</option>
                    <option value="embed">🌐 嵌入链接</option>
                    <option value="link">🔗 外链地址</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">视频时长（秒）</label>
                  <input type="number" value={lessonForm.duration} onChange={e => setLessonForm({...lessonForm, duration: parseInt(e.target.value) || 0})} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600/20" placeholder="如: 930 (15分30秒)" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">视频地址</label>
                <input value={lessonForm.videoUrl} onChange={e => setLessonForm({...lessonForm, videoUrl: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600/20" placeholder={lessonForm.videoType === 'upload' ? '/uploads/videos/xxx.mp4' : lessonForm.videoType === 'embed' ? 'https://player.bilibili.com/...' : 'https://example.com/video.mp4'} />
                <p className="text-[10px] text-gray-400 mt-1 ml-2">
                  {lessonForm.videoType === 'upload' && '上传文件到 ./uploads/videos/ 后填写路径'}
                  {lessonForm.videoType === 'embed' && 'B站/腾讯视频/优酷等的嵌入地址 (iframe src)'}
                  {lessonForm.videoType === 'link' && '直链 .mp4/.m3u8 地址'}
                </p>
              </div>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={lessonForm.isFreePreview} onChange={e => setLessonForm({...lessonForm, isFreePreview: e.target.checked})} className="w-5 h-5 rounded-lg text-indigo-600" />
                <div>
                  <div className="font-black text-sm text-gray-700">免费试看</div>
                  <div className="text-[10px] text-gray-400">未登录/无权限学员也可以观看此课时</div>
                </div>
              </label>
              <div className="flex gap-3 pt-4">
                {editingLessonId && <button onClick={() => handleDeleteLesson(editingLessonId)} className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-sm hover:bg-red-100">删除课时</button>}
                <div className="flex-1" />
                <button onClick={() => { setEditingLessonId(null); setSelectedLesson(null); }} className="px-6 py-3 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm">取消</button>
                <button onClick={editingLessonId ? handleUpdateLesson : () => {}} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-100">{editingLessonId ? '保存课时' : '添加课时'}</button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <i className="fa-solid fa-film text-5xl mb-4 opacity-20"></i>
              <p className="font-black text-lg">选择或新建一个课时</p>
              <p className="text-sm mt-1">在左侧章节中点击课时编辑，或点击章节旁的 + 按钮新增课时</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VodCourseEditor;
