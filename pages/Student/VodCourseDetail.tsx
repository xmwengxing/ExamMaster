import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Course, CourseChapter, CourseLesson, CourseEnrollment } from '../../types';

interface VodCourseDetailProps {
  course: Course;
  onBack: () => void;
  getChapters: (courseId: string) => Promise<CourseChapter[]>;
  getMyProgress: (courseId: string) => Promise<CourseEnrollment | null>;
  updateProgress: (courseId: string, data: any) => Promise<any>;
  enrollCourse: (courseId: string) => Promise<any>;
  refreshAll: () => Promise<void>;
}

const VodCourseDetail: React.FC<VodCourseDetailProps> = ({ course, onBack, getChapters, getMyProgress, updateProgress, enrollCourse, refreshAll }) => {
  const [chapters, setChapters] = useState<CourseChapter[]>([]);
  const [currentLesson, setCurrentLesson] = useState<CourseLesson | null>(null);
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [course.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ch, prog] = await Promise.all([
        getChapters(course.id),
        getMyProgress(course.id)
      ]);
      setChapters(ch || []);
      setEnrollment(prog);

      // Auto-select last lesson or first
      if (prog?.lastLessonId) {
        for (const chapter of ch) {
          const lesson = chapter.lessons?.find(l => l.id === prog.lastLessonId);
          if (lesson) { setCurrentLesson(lesson); break; }
        }
      }
      if (!prog?.lastLessonId || !currentLesson) {
        const firstChapter = ch[0];
        const firstLesson = firstChapter?.lessons?.[0];
        if (firstLesson) setCurrentLesson(firstLesson);
      }
    } catch (e) {
      console.error('Failed to load course data:', e);
    }
    setLoading(false);
  };

  const selectLesson = async (lesson: CourseLesson) => {
    // Save current progress before switching
    if (currentLesson && enrollment) {
      await updateProgress(course.id, {
        lastLessonId: currentLesson.id,
        lastPosition: 0
      }).catch(() => {});
    }
    setCurrentLesson(lesson);
    setVideoError(null);

    // Auto enroll
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

  const completedLessonIds = useMemo(() => {
    // Simple: all lessons before current are "completed"
    const allLessons = chapters.flatMap(c => (c.lessons || []).map(l => l));
    const currentIdx = allLessons.findIndex(l => l.id === currentLesson?.id);
    return new Set(allLessons.slice(0, currentIdx).map(l => l.id));
  }, [chapters, currentLesson]);

  const allLessons = useMemo(() => chapters.flatMap(c => c.lessons || []), [chapters]);
  const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
  const progress = allLessons.length > 0 ? Math.round(((currentIndex + 1) / allLessons.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="fa-solid fa-spinner fa-spin text-3xl text-indigo-400 mb-4"></i>
          <p className="text-gray-400 font-bold">加载课程中...</p>
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
          {course.teacherName && <p className="text-sm text-gray-400 font-bold">{course.teacherName}</p>}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Video Player */}
        <div className="flex-1">
          <div className="bg-black rounded-2xl overflow-hidden mb-4" style={{ minHeight: 360 }}>
            {currentLesson ? (
              <>
                {currentLesson.videoType === 'upload' || currentLesson.videoType === 'link' ? (
                  videoError ? (
                    <div className="flex items-center justify-center h-64 bg-gray-900 text-gray-400">
                      <div className="text-center">
                        <i className="fa-solid fa-exclamation-triangle text-4xl mb-3"></i>
                        <p className="font-bold">{videoError}</p>
                        {currentLesson.videoUrl && (
                          <a href={currentLesson.videoUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 text-sm underline mt-2 inline-block">
                            在新窗口打开 <i className="fa-solid fa-external-link ml-1"></i>
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <video
                      key={currentLesson.id}
                      controls
                      className="w-full"
                      style={{ maxHeight: '60vh' }}
                      src={currentLesson.videoUrl}
                      onError={() => setVideoError('视频加载失败，请尝试在新窗口打开')}
                      onLoadedMetadata={async (e) => {
                        const dur = Math.floor((e.target as HTMLVideoElement).duration);
                        if (dur > 0 && !currentLesson.duration) {
                          // Could update duration server-side but skip for simplicity
                        }
                      }}
                    >
                      您的浏览器不支持视频播放
                    </video>
                  )
                ) : currentLesson.videoType === 'embed' && currentLesson.videoUrl ? (
                  <iframe
                    src={currentLesson.videoUrl}
                    className="w-full"
                    style={{ height: '60vh', border: 'none' }}
                    allowFullScreen
                    title={currentLesson.title}
                    onError={() => setVideoError('嵌入视频加载失败')}
                  ></iframe>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-400">
                    <div className="text-center">
                      <i className="fa-solid fa-film text-4xl mb-3"></i>
                      <p className="font-bold">视频地址未配置</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <p className="font-bold">暂无课时内容</p>
              </div>
            )}
          </div>

          {/* Lesson info */}
          {currentLesson && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-black text-gray-900">{currentLesson.title}</h3>
                <span className="text-xs text-gray-400 font-bold">
                  {currentLesson.duration > 0 ? `${Math.floor(currentLesson.duration / 60)}分${currentLesson.duration % 60}秒` : ''}
                </span>
              </div>
              <p className="text-sm text-gray-400">{course.description}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <button onClick={handlePrevLesson} disabled={currentIndex <= 0} className="px-4 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-sm font-black disabled:opacity-30 hover:bg-gray-200 transition-all">
              <i className="fa-solid fa-chevron-left mr-1"></i> 上一课时
            </button>
            <div className="text-xs text-gray-400 font-bold">进度: {progress}%</div>
            <button onClick={handleNextLesson} disabled={currentIndex >= allLessons.length - 1} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-black disabled:opacity-30 hover:bg-indigo-700 transition-all">
              下一课时 <i className="fa-solid fa-chevron-right ml-1"></i>
            </button>
          </div>
        </div>

        {/* Chapter Sidebar */}
        <div className="w-72 shrink-0">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm sticky top-4">
            <h3 className="font-black text-sm text-gray-700 mb-3 flex items-center gap-2">
              <i className="fa-solid fa-list text-indigo-500"></i> 课程目录
              <span className="text-[10px] text-gray-400 font-normal ml-auto">{allLessons.length} 课时</span>
            </h3>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {chapters.map(ch => (
                <div key={ch.id}>
                  <div className="text-xs font-black text-gray-500 mb-1 flex items-center gap-1">
                    <i className="fa-solid fa-folder text-[10px] text-amber-400"></i> {ch.title}
                  </div>
                  <div className="space-y-0.5 ml-1">
                    {(ch.lessons || []).map(ls => {
                      const isActive = currentLesson?.id === ls.id;
                      const isCompleted = completedLessonIds.has(ls.id);
                      return (
                        <button
                          key={ls.id}
                          onClick={() => selectLesson(ls)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all truncate flex items-center gap-2 ${
                            isActive ? 'bg-indigo-100 text-indigo-700' : isCompleted ? 'text-gray-400 hover:bg-gray-50' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className="w-4 text-center text-[10px]">
                            {isActive ? '▶' : isCompleted ? '✓' : '○'}
                          </span>
                          <span className="truncate flex-1">{ls.title}</span>
                          {ls.isFreePreview && <span className="text-[9px] bg-green-100 text-green-600 px-1 py-0.5 rounded shrink-0">试看</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VodCourseDetail;
