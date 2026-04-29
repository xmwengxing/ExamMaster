import React, { useState, useEffect, useMemo } from 'react';
import { Course, CourseEnrollment } from '../../types';

interface CourseCatalogProps {
  courses: Course[];
  enrollments: CourseEnrollment[];
  hasVideo?: boolean;
  onSelectCourse: (course: Course) => void;
  onSelectLiveCourse: (course: Course) => void;
  getStudentCourses: (type?: string) => Promise<Course[]>;
  getMyEnrollments: () => Promise<CourseEnrollment[]>;
}

const CourseCatalog: React.FC<CourseCatalogProps> = ({ courses, enrollments, hasVideo = true, onSelectCourse, onSelectLiveCourse, getStudentCourses, getMyEnrollments }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'vod' | 'live'>('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [showMy, setShowMy] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    courses.forEach(c => c.category && cats.add(c.category));
    return Array.from(cats);
  }, [courses]);

  const filtered = useMemo(() => {
    let list = courses;
    // High-priority VIDEO check: if unchecked, hide all VOD courses
    if (!hasVideo) list = list.filter(c => c.courseType !== 'vod');
    if (activeTab !== 'all') list = list.filter(c => c.courseType === activeTab);
    if (filterCategory) list = list.filter(c => c.category === filterCategory);
    if (showMy) {
      const enrolledIds = new Set(enrollments.map(e => e.courseId));
      list = list.filter(c => enrolledIds.has(c.id));
    }
    return list;
  }, [courses, activeTab, filterCategory, showMy, enrollments, hasVideo]);

  const getProgress = (courseId: string) => {
    const e = enrollments.find(en => en.courseId === courseId);
    return e ? e.progressPercent : 0;
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900">在线课程</h2>
        <p className="text-sm text-gray-400 mt-1 font-bold">学习录播课程与参加直播课程</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
          {(['all', 'vod', 'live'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'all' ? '全部' : tab === 'vod' ? '📹 录播课' : '🔴 直播课'}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold outline-none">
            <option value="">全部分类</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => setShowMy(!showMy)} className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all ${showMy ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-500'}`}>
            <i className="fa-solid fa-bookmark mr-1"></i> 我的课程
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(c => {
          const progress = getProgress(c.id);
          const isEnrolled = progress > 0;
          return (
            <div
              key={c.id}
              onClick={() => {
                if (c.courseType === 'vod') onSelectCourse(c);
                else onSelectLiveCourse(c);
              }}
              className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1"
            >
              <div className="w-full h-36 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl mb-3 flex items-center justify-center overflow-hidden relative">
                {c.coverUrl ? <img src={c.coverUrl} alt="" className="w-full h-full object-cover" /> : (
                  <i className={`${c.courseType === 'vod' ? 'fa-film' : 'fa-broadcast-tower'} text-4xl text-indigo-300`}></i>
                )}
                <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-[10px] font-black px-2 py-1 rounded-full shadow-sm">
                  {c.courseType === 'vod' ? '📹 录播' : '🔴 直播'}
                </span>
                {isEnrolled && c.courseType === 'vod' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200">
                    <div className="h-full bg-indigo-500 rounded-r-full transition-all" style={{ width: `${progress}%` }}></div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mb-1">
                {c.category && <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{c.category}</span>}
                {c.teacherName && <span className="text-[10px] text-gray-400 font-bold">{c.teacherName}</span>}
              </div>
              <h3 className="font-black text-gray-900 mb-1 truncate">{c.title}</h3>
              <p className="text-xs text-gray-400 line-clamp-2 mb-3">{c.description || '暂无简介'}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-bold"><i className="fa-solid fa-user mr-1"></i>{c.studentCount || 0} 人学习</span>
                {c.courseType === 'vod' && isEnrolled && (
                  <span className="text-[10px] font-black text-indigo-600">{progress}%</span>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <i className="fa-solid fa-graduation-cap text-5xl mb-4 opacity-20"></i>
            <p className="font-black text-lg">{showMy ? '你还未报名任何课程' : '暂无可选课程'}</p>
            <p className="text-sm mt-1">{showMy ? '浏览并开始你的第一节课程吧' : '管理员还未发布课程，请稍后查看'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCatalog;
