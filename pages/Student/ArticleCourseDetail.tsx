import React, { useState, useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Course, CourseChapter, CourseLesson, CourseEnrollment } from '../../types';

interface ArticleCourseDetailProps {
  course: Course;
  onBack: () => void;
  getChapters: (courseId: string) => Promise<CourseChapter[]>;
  getMyProgress: (courseId: string) => Promise<CourseEnrollment | null>;
  updateProgress: (courseId: string, data: any) => Promise<any>;
  enrollCourse: (courseId: string) => Promise<any>;
  refreshAll: () => Promise<void>;
}

const ArticleCourseDetail: React.FC<ArticleCourseDetailProps> = ({
  course, onBack, getChapters, getMyProgress, updateProgress, enrollCourse, refreshAll
}) => {
  const [chapters, setChapters] = useState<CourseChapter[]>([]);
  const [currentLesson, setCurrentLesson] = useState<CourseLesson | null>(null);
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageLightbox, setImageLightbox] = useState<string | null>(null);

  useEffect(() => { loadData(); }, [course.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ch, prog] = await Promise.all([
        getChapters(course.id),
        getMyProgress(course.id)
      ]);
      setChapters(ch || []);
      setEnrollment(prog);

      // Restore last lesson or select first
      if (prog?.lastLessonId) {
        for (const chapter of (ch || [])) {
          const lesson = chapter.lessons?.find(l => l.id === prog.lastLessonId);
          if (lesson) { setCurrentLesson(lesson); break; }
        }
      }
      if (!currentLesson) {
        const firstLesson = (ch || [])[0]?.lessons?.[0];
        if (firstLesson) setCurrentLesson(firstLesson);
      }
    } catch (e) {
      console.error('Failed to load course:', e);
    }
    setLoading(false);
  };

  const selectLesson = async (lesson: CourseLesson) => {
    if (currentLesson && enrollment) {
      await updateProgress(course.id, {
        lastLessonId: currentLesson.id,
        lastPosition: 0
      }).catch(() => {});
    }
    setCurrentLesson(lesson);

    if (!enrollment) {
      const enr = await enrollCourse(course.id);
      setEnrollment(enr);
      await refreshAll();
    }
  };

  const handlePrevLesson = () => {
    const allLessons = chapters.flatMap(c => (c.lessons || []).map(l => l));
    const idx = allLessons.findIndex(l => l.id === currentLesson?.id);
    if (idx > 0) selectLesson(allLessons[idx - 1]);
  };

  const handleNextLesson = () => {
    const allLessons = chapters.flatMap(c => (c.lessons || []).map(l => l));
    const idx = allLessons.findIndex(l => l.id === currentLesson?.id);
    if (idx < allLessons.length - 1) selectLesson(allLessons[idx + 1]);
  };

  const allLessons = useMemo(() => chapters.flatMap(c => c.lessons || []), [chapters]);
  const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
  const progress = allLessons.length > 0 ? Math.round(((currentIndex + 1) / allLessons.length) * 100) : 0;

  // Render markdown content safely
  const renderedContent = useMemo(() => {
    if (!currentLesson?.content) return '';
    const marked = (window as any).marked;
    if (!marked) return `<pre>${DOMPurify.sanitize(currentLesson.content)}</pre>`;
    const rawHtml = marked.parse(currentLesson.content);
    return DOMPurify.sanitize(rawHtml, {
      ADD_ATTR: ['target', 'rel'],
      ADD_TAGS: ['iframe']
    });
  }, [currentLesson?.content]);

  // Handle image clicks in rendered content for lightbox
  useEffect(() => {
    if (!currentLesson) return;
    const container = document.getElementById('article-content');
    if (!container) return;

    const handleImgClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        setImageLightbox((target as HTMLImageElement).src);
      }
    };
    container.addEventListener('click', handleImgClick);
    return () => container.removeEventListener('click', handleImgClick);
  }, [currentLesson?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="fa-solid fa-spinner fa-spin text-3xl text-amber-400 mb-4"></i>
          <p className="text-gray-400 font-bold">加载课程中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all text-gray-500">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <div>
          <h2 className="text-2xl font-black text-gray-900">{course.title}</h2>
          {course.teacherName && <p className="text-sm text-gray-400 font-bold">{course.teacherName}</p>}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Content Area */}
        <div className="flex-1">
          {currentLesson ? (
            <>
              <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                <h1 className="text-xl font-black text-gray-900 mb-6">{currentLesson.title}</h1>
                {/* Markdown rendered content with typography styling */}
                <div
                  id="article-content"
                  className="article-prose prose max-w-none"
                  style={{
                    fontFamily: 'Georgia, "Noto Serif SC", serif',
                    fontSize: '16px',
                    lineHeight: '1.85',
                    color: '#374151'
                  }}
                  dangerouslySetInnerHTML={{ __html: renderedContent }}
                />
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={handlePrevLesson}
                  disabled={currentIndex <= 0}
                  className="px-4 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-sm font-black disabled:opacity-30 hover:bg-gray-200 transition-all"
                >
                  <i className="fa-solid fa-chevron-left mr-1"></i> 上一课时
                </button>
                <div className="text-xs text-gray-400 font-bold">进度: {progress}%</div>
                <button
                  onClick={handleNextLesson}
                  disabled={currentIndex >= allLessons.length - 1}
                  className="px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-black disabled:opacity-30 hover:bg-amber-700 transition-all"
                >
                  下一课时 <i className="fa-solid fa-chevron-right ml-1"></i>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <i className="fa-solid fa-file-alt text-5xl mb-4 opacity-20"></i>
              <p className="font-black text-lg">暂无课时内容</p>
            </div>
          )}
        </div>

        {/* Chapter Sidebar */}
        <div className="w-72 shrink-0">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm sticky top-4">
            <h3 className="font-black text-sm text-gray-700 mb-3 flex items-center gap-2">
              <i className="fa-solid fa-list text-amber-500"></i> 课程目录
              <span className="text-[10px] text-gray-400 font-normal ml-auto">{allLessons.length} 课时</span>
            </h3>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {chapters.map(ch => {
                const isCurrentChapter = ch.lessons?.some(l => l.id === currentLesson?.id);
                return (
                  <div key={ch.id}>
                    <div className={`text-xs font-black mb-1 flex items-center gap-1 ${isCurrentChapter ? 'text-amber-600' : 'text-gray-500'}`}>
                      <i className={`fa-solid ${isCurrentChapter ? 'fa-folder-open' : 'fa-folder'} text-[10px] text-amber-400`}></i>
                      {ch.title}
                    </div>
                    <div className="space-y-0.5 ml-1">
                      {(ch.lessons || []).map(ls => {
                        const isActive = currentLesson?.id === ls.id;
                        return (
                          <button
                            key={ls.id}
                            onClick={() => selectLesson(ls)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all truncate flex items-center gap-2 ${
                              isActive ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span className="w-4 text-center text-[10px]">{isActive ? '▶' : '○'}</span>
                            <span className="truncate flex-1">{ls.title}</span>
                            {ls.isFreePreview && <span className="text-[9px] bg-green-100 text-green-600 px-1 py-0.5 rounded shrink-0">试看</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {imageLightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 cursor-zoom-out"
          onClick={() => setImageLightbox(null)}
        >
          <img
            src={imageLightbox}
            alt=""
            className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain"
          />
          <button
            onClick={() => setImageLightbox(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-all"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {/* Article content styling */}
      <style>{`
        .article-prose h2 { font-size: 1.5rem; font-weight: 800; color: #1f2937; margin-top: 2rem; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 2px solid #f59e0b20; }
        .article-prose h3 { font-size: 1.2rem; font-weight: 700; color: #374151; margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .article-prose p { margin-bottom: 1rem; }
        .article-prose code { background: #f3f4f6; padding: 0.15em 0.4em; border-radius: 0.3em; font-size: 0.9em; font-family: "JetBrains Mono", "Source Code Pro", monospace; }
        .article-prose pre { background: #1e293b; color: #e2e8f0; padding: 1.25rem 1.5rem; border-radius: 1rem; overflow-x: auto; margin: 1.25rem 0; font-size: 0.875rem; line-height: 1.6; }
        .article-prose pre code { background: none; padding: 0; border-radius: 0; font-size: inherit; color: inherit; }
        .article-prose img { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1rem 0; cursor: zoom-in; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .article-prose table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9em; }
        .article-prose th, .article-prose td { border: 1px solid #e5e7eb; padding: 0.5rem 0.75rem; text-align: left; }
        .article-prose th { background: #f9fafb; font-weight: 700; }
        .article-prose blockquote { border-left: 3px solid #f59e0b; margin: 1rem 0; padding: 0.5rem 1rem; background: #fffbeb; border-radius: 0 0.5rem 0.5rem 0; color: #92400e; }
        .article-prose ul, .article-prose ol { margin: 0.75rem 0; padding-left: 1.5rem; }
        .article-prose li { margin-bottom: 0.25rem; }
        .article-prose a { color: #d97706; text-decoration: underline; text-underline-offset: 2px; }
        .article-prose hr { border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0; }
      `}</style>
    </div>
  );
};

export default ArticleCourseDetail;
