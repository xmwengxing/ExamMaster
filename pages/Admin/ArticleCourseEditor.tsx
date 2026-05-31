import React, { useState, useEffect, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { Course, CourseChapter, CourseLesson } from '../../types';

interface ArticleCourseEditorProps {
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
}

const ArticleCourseEditor: React.FC<ArticleCourseEditorProps> = ({
  course, chapters, onBack, getCourse, getChapters,
  createChapter, updateChapter, deleteChapter, reorderChapters,
  createLesson, updateLesson, deleteLesson, reorderLessons
}) => {
  const [localChapters, setLocalChapters] = useState<CourseChapter[]>(chapters || []);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [showNewChapter, setShowNewChapter] = useState(false);
  const [lessonForm, setLessonForm] = useState({
    title: '', content: '', isFreePreview: false
  });
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [showNewLesson, setShowNewLesson] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'edit' | 'live' | 'split'>('split');
  const [saving, setSaving] = useState(false);

  useEffect(() => { setLocalChapters(chapters || []); }, [chapters]);

  const refreshChapters = useCallback(async () => {
    if (!course) return;
    const updated = await getChapters(course.id);
    setLocalChapters(updated || []);
  }, [course, getChapters]);

  useEffect(() => { refreshChapters(); }, [refreshChapters]);

  const handleAddChapter = async () => {
    if (!course || !newChapterTitle.trim()) return;
    await createChapter(course.id, { title: newChapterTitle.trim(), sortOrder: localChapters.length });
    setNewChapterTitle('');
    setShowNewChapter(false);
    await refreshChapters();
  };

  const handleAddLesson = async (chapterId: string) => {
    if (!lessonForm.title.trim()) return;
    const data = {
      title: lessonForm.title.trim(),
      lessonType: 'article',
      content: lessonForm.content,
      isFreePreview: lessonForm.isFreePreview,
      sortOrder: (localChapters.find(c => c.id === chapterId)?.lessons?.length || 0)
    };
    await createLesson(chapterId, data);
    setLessonForm({ title: '', content: '', isFreePreview: false });
    setShowNewLesson(null);
    await refreshChapters();
  };

  const handleSaveLesson = async () => {
    if (!editingLessonId || saving) return;
    setSaving(true);
    try {
      await updateLesson(editingLessonId, {
        title: lessonForm.title,
        content: lessonForm.content,
        isFreePreview: lessonForm.isFreePreview
      });
      setEditingLessonId(null);
      setSelectedLesson(null);
      await refreshChapters();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm('确定要删除该课时吗？')) return;
    await deleteLesson(id);
    setSelectedLesson(null);
    setEditingLessonId(null);
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
      title: lesson.title,
      content: lesson.content || '',
      isFreePreview: lesson.isFreePreview || false
    });
  };

  const newLessonMode = () => {
    setEditingLessonId(null);
    setSelectedLesson(null);
    setLessonForm({ title: '', content: '', isFreePreview: false });
  };

  // Upload image callback for MDEditor
  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/courses/upload-image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      return data.url;
    } catch (e) {
      alert('图片上传失败: ' + (e as Error).message);
      throw e;
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all text-gray-500">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h2 className="text-2xl font-black text-gray-900">编辑图文课程</h2>
            <p className="text-sm text-gray-400 font-bold">{course?.title || '加载中...'}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left: Chapter/Lesson Tree */}
        <div className="w-80 shrink-0">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <h3 className="font-black text-sm text-gray-700 mb-3 flex items-center gap-2">
              <i className="fa-solid fa-list-tree text-amber-500"></i> 章节与课时
            </h3>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {localChapters.map(ch => (
                <div key={ch.id}>
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 group">
                    <span className="text-sm font-bold text-gray-700 truncate">{ch.title}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setShowNewLesson(ch.id); newLessonMode(); }} className="w-6 h-6 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center" title="添加课时">
                        <i className="fa-solid fa-plus text-[10px]"></i>
                      </button>
                      <button onClick={() => handleDeleteChapter(ch.id)} className="w-6 h-6 rounded-lg bg-red-50 text-red-400 flex items-center justify-center" title="删除章节">
                        <i className="fa-solid fa-trash text-[10px]"></i>
                      </button>
                    </div>
                  </div>
                  <div className="ml-2 mt-1 space-y-0.5">
                    {(ch.lessons || []).map(ls => (
                      <button
                        key={ls.id}
                        onClick={() => openEditLesson(ls)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all truncate ${
                          selectedLesson?.id === ls.id
                            ? 'bg-amber-100 text-amber-700'
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
                          onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleAddLesson(ch.id);
                            if (e.key === 'Escape') setShowNewLesson(null);
                          }}
                          placeholder="新课标题（回车创建）"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-amber-200 outline-none focus:ring-2 focus:ring-amber-300"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {showNewChapter ? (
              <div className="mt-3 flex gap-2">
                <input autoFocus value={newChapterTitle} onChange={e => setNewChapterTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddChapter(); if (e.key === 'Escape') setShowNewChapter(false); }}
                  placeholder="章节标题" className="flex-1 text-xs px-3 py-2 rounded-xl border border-amber-200 outline-none focus:ring-2 focus:ring-amber-300" />
                <button onClick={handleAddChapter} className="px-3 py-2 bg-amber-600 text-white rounded-xl text-xs font-black">添加</button>
              </div>
            ) : (
              <button onClick={() => setShowNewChapter(true)} className="w-full mt-3 py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-400 hover:border-amber-300 hover:text-amber-500 transition-all">
                <i className="fa-solid fa-plus mr-1"></i> 新增章节
              </button>
            )}
          </div>
        </div>

        {/* Right: Content Editor */}
        <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          {selectedLesson || editingLessonId || showNewLesson ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-lg text-gray-900">
                  {editingLessonId ? '编辑课时' : '新建课时'}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditorMode('edit')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${editorMode === 'edit' ? 'bg-gray-200 text-gray-800' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                  >编辑</button>
                  <button
                    onClick={() => setEditorMode('split')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${editorMode === 'split' ? 'bg-gray-200 text-gray-800' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                  >分屏</button>
                  <button
                    onClick={() => setEditorMode('live')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${editorMode === 'live' ? 'bg-gray-200 text-gray-800' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                  >预览</button>
                </div>
              </div>

              {/* Lesson Title */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">课时标题</label>
                <input
                  value={lessonForm.title}
                  onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 font-bold outline-none focus:ring-2 focus:ring-amber-600/20"
                  placeholder="课时标题"
                />
              </div>

              {/* Markdown Editor */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">图文内容 (Markdown)</label>
                <div data-color-mode="light" className="mt-1">
                  <MDEditor
                    value={lessonForm.content}
                    onChange={(val) => setLessonForm({ ...lessonForm, content: val || '' })}
                    height={420}
                    visibleDragbar={false}
                    preview={editorMode === 'live' ? 'live' : editorMode === 'edit' ? 'edit' : 'live'}
                  />
                </div>
              </div>

              {/* Free Preview */}
              <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lessonForm.isFreePreview}
                  onChange={e => setLessonForm({ ...lessonForm, isFreePreview: e.target.checked })}
                  className="w-5 h-5 rounded-lg text-amber-600"
                />
                <div>
                  <div className="font-black text-sm text-gray-700">免费试看</div>
                  <div className="text-[10px] text-gray-400">未登录/无权限学员也可以查看此课时</div>
                </div>
              </label>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                {editingLessonId && (
                  <button onClick={() => handleDeleteLesson(editingLessonId)} className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-sm hover:bg-red-100">
                    删除课时
                  </button>
                )}
                <div className="flex-1" />
                <button onClick={() => { setEditingLessonId(null); setSelectedLesson(null); setShowNewLesson(null); }}
                  className="px-6 py-3 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm">
                  取消
                </button>
                <button
                  onClick={editingLessonId ? handleSaveLesson : () => showNewLesson && handleAddLesson(showNewLesson)}
                  disabled={saving}
                  className="px-6 py-3 bg-amber-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-amber-100 hover:bg-amber-700 disabled:opacity-50"
                >
                  {saving ? '保存中...' : editingLessonId ? '保存课时' : '添加课时'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <i className="fa-solid fa-file-alt text-5xl mb-4 opacity-20"></i>
              <p className="font-black text-lg">选择或新建一个课时</p>
              <p className="text-sm mt-1">在左侧章节中点击课时编辑，或点击章节旁的 + 按钮新增课时</p>
              <p className="text-xs mt-4 text-gray-300">图文课时使用 Markdown 格式编辑，支持代码高亮、图片、表格等</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleCourseEditor;
