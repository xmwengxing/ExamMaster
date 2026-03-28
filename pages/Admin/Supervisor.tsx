
import React, { useState, useMemo } from 'react';
import { User, LoginLog, LoginSession } from '../../types';

interface SupervisorProps {
  students: User[];
  logs: LoginLog[];
}

const Supervisor: React.FC<SupervisorProps> = ({ students, logs }) => {
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('ALL'); // 新增：班级筛选
  const [currentPage, setCurrentPage] = useState(1);
  const [practiceStatsStudent, setPracticeStatsStudent] = useState<User | null>(null); // 练习统计弹窗
  const [practiceStats, setPracticeStats] = useState<any[]>([]); // 练习统计数据
  const [loadingStats, setLoadingStats] = useState(false); // 加载状态
  const pageSize = 20;

  const formatDuration = (seconds: number = 0) => {
    const minutes = Math.floor(seconds / 60);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m}m`;
  };

  // 获取学员练习统计
  const fetchPracticeStats = async (student: User) => {
    setPracticeStatsStudent(student);
    setLoadingStats(true);
    
    try {
      // 修复：使用正确的 token 键名 'edu_token'
      const token = localStorage.getItem('edu_token');
      const response = await fetch(`/api/admin/students/${student.id}/practice-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPracticeStats(data);
      } else {
        console.error('获取练习统计失败:', response.status, response.statusText);
        setPracticeStats([]);
      }
    } catch (error) {
      console.error('获取练习统计错误:', error);
      setPracticeStats([]);
    } finally {
      setLoadingStats(false);
    }
  };

  // 关闭练习统计弹窗
  const closePracticeStats = () => {
    setPracticeStatsStudent(null);
    setPracticeStats([]);
  };

  // 获取所有班级列表（去重）
  const allClasses = useMemo(() => {
    const classes = students
      .map(s => s.className)
      .filter(c => c && c.trim())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
    return classes;
  }, [students]);

  const filteredStudents = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return students.filter(s => {
      const matchSearch = s.realName?.toLowerCase().includes(term) || 
        s.phone?.includes(term) ||
        s.company?.toLowerCase().includes(term);
      const matchClass = classFilter === 'ALL' || s.className === classFilter;
      return matchSearch && matchClass;
    });
  }, [students, searchTerm, classFilter]);

  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage]);

  const handleExport = () => {
    const headers = ['姓名', '手机号', '班级', '工作单位', '状态', '最后活跃时间', '累计在线时长'];
    const rows = filteredStudents.map(s => [
      s.realName,
      s.phone,
      s.className || '--',
      s.company || '通用部门',
      s.isOnline ? '在线' : '离线',
      s.lastLogin || '--',
      formatDuration(s.totalOnlineTime) // 使用小时+分钟格式
    ]);

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const classLabel = classFilter === 'ALL' ? '全部' : classFilter;
    link.download = `学习状态导出_${classLabel}_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">学情监察与分析</h2>
          <p className="text-sm text-gray-500 font-medium">深度监控学员在线动态、活跃时间及学习轨迹</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-emerald-50 text-emerald-600 px-5 py-3 rounded-2xl font-black text-sm border border-emerald-100 shadow-sm">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            当前在线: {students.filter(s => s.isOnline).length} 名学员
          </div>
          <select 
            value={classFilter}
            onChange={(e) => { setClassFilter(e.target.value); setCurrentPage(1); }}
            className="bg-white border border-gray-200 px-4 py-3 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="ALL">全部班级</option>
            {allClasses.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          <button 
            onClick={handleExport}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <i className="fa-solid fa-file-export"></i> 批量导出 (Excel)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 bg-gray-50/50 border-b flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="font-bold text-gray-700">全站学员学习状态列表</h3>
            <div className="relative w-full md:w-80">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input 
                type="text"
                placeholder="搜索姓名、手机号或单位..."
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                <tr>
                  <th className="px-8 py-5">学员基本信息</th>
                  <th className="px-8 py-5">班级</th>
                  <th className="px-8 py-5">单位 / 部门</th>
                  <th className="px-8 py-5">当前状态</th>
                  <th className="px-8 py-5">最后活跃时间</th>
                  <th className="px-8 py-5">累计在线时长</th>
                  <th className="px-8 py-5">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedStudents.map(s => (
                  <tr 
                    key={s.id} 
                    onClick={() => setSelectedStudent(s)} 
                    className={`cursor-pointer transition-all ${selectedStudent?.id === s.id ? 'bg-indigo-50/50' : 'hover:bg-gray-50/30'}`}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        {s.avatar ? (
                          <img src={s.avatar} className="w-10 h-10 rounded-2xl shadow-sm border border-white" />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl shadow-sm border border-white bg-gray-100 flex items-center justify-center text-indigo-600 font-black">{(s.realName || s.nickname || '学')[0]}</div>
                        )}
                        <div>
                          <div className="font-black text-gray-800">{s.realName}</div>
                          <div className="text-[10px] text-gray-400 font-bold">{s.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-indigo-600">{s.className || '--'}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm font-bold text-gray-600">{s.company || '通用部门'}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{s.customFields?.['岗位'] || '未设置岗位'}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black ${s.isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                        {s.isOnline ? '在线ING' : '离线休息'}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-xs text-gray-400 font-mono font-medium">{s.lastLogin || '--'}</td>
                    <td className="px-8 py-5">
                      <span className="text-lg font-black text-gray-800">{formatDuration(s.totalOnlineTime)}</span>
                    </td>
                    <td className="px-8 py-5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchPracticeStats(s);
                        }}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2"
                      >
                        <i className="fa-solid fa-chart-line"></i>
                        练习明细
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页控制 */}
          {totalPages > 1 && (
            <div className="p-6 bg-gray-50/30 border-t flex items-center justify-between">
              <div className="text-xs font-bold text-gray-400">共 {filteredStudents.length} 条数据，每页 {pageSize} 条</div>
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-gray-400 disabled:opacity-30 hover:bg-gray-50 transition-all"
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                        currentPage === page 
                          ? 'bg-indigo-600 text-white shadow-lg' 
                          : 'bg-white border text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )).filter((_, i) => Math.abs(i + 1 - currentPage) < 2 || i === 0 || i === totalPages - 1)}
                </div>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-gray-400 disabled:opacity-30 hover:bg-gray-50 transition-all"
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 flex flex-col relative overflow-hidden h-fit sticky top-8">
           {selectedStudent ? (
             <div className="animate-in fade-in slide-in-from-right-8 duration-500 flex flex-col h-full">
               <div className="text-center mb-8 pb-8 border-b border-dashed">
                 <div className="relative inline-block mb-4">
                    {selectedStudent.avatar ? (
                      <img src={selectedStudent.avatar} className="w-24 h-24 rounded-[2rem] mx-auto shadow-2xl border-4 border-white" />
                    ) : (
                      <div className="w-24 h-24 rounded-[2rem] mx-auto shadow-2xl border-4 border-white bg-gray-100 flex items-center justify-center text-indigo-600 font-black text-3xl">
                        {(selectedStudent.realName || selectedStudent.nickname || '学')[0]}
                      </div>
                    )}
                    {selectedStudent.isOnline && (
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full"></span>
                    )}
                 </div>
                 <h3 className="font-black text-2xl text-gray-900">{selectedStudent.realName}</h3>
                 <p className="text-xs text-indigo-600 font-bold mt-1 uppercase tracking-widest">学习档案明细</p>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-indigo-50 p-5 rounded-3xl text-center">
                    <div className="text-2xl font-black text-indigo-600">{selectedStudent.loginHistory?.length || 0}</div>
                    <div className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">登录总计(次)</div>
                  </div>
                  <div className="bg-amber-50 p-5 rounded-3xl text-center">
                    <div className="text-2xl font-black text-amber-600">{formatDuration(selectedStudent.totalOnlineTime)}</div>
                    <div className="text-[10px] text-amber-400 font-black uppercase tracking-widest mt-1">在线总时长</div>
                  </div>
               </div>

               <div className="flex-1 overflow-hidden flex flex-col">
                 <h4 className="font-black text-xs text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <i className="fa-solid fa-timeline text-indigo-500"></i> 最近登录轨迹
                 </h4>
                 <div className="max-h-64 overflow-y-auto pr-4 space-y-4 custom-scrollbar">
                    {selectedStudent.loginHistory?.length ? (() => {
                      // 处理登录历史数据，支持新旧格式
                      const sessions = selectedStudent.loginHistory.map((item, index) => {
                        if (typeof item === 'string') {
                          // 旧格式：字符串
                          return { loginTime: item, logoutTime: undefined, duration: undefined };
                        } else if (item && typeof item === 'object') {
                          // 新格式：对象
                          return item;
                        } else {
                          // 无效数据，返回空对象
                          return { loginTime: '', logoutTime: undefined, duration: undefined };
                        }
                      }).filter(session => session.loginTime); // 过滤掉空数据
                      
                      return [...sessions].reverse().map((session, i) => {
                        // 安全地分割时间字符串
                        const loginParts = (session.loginTime || '').split(' ');
                        const loginDate = loginParts[0] || '';
                        const loginTime = loginParts[1] || '';
                        
                        const logoutParts = (session.logoutTime || '').split(' ');
                        const logoutTime = logoutParts[1] || undefined;
                        
                        const duration = session.duration ? formatDuration(session.duration) : undefined;
                        
                        // 如果没有有效的登录时间，跳过这条记录
                        if (!loginDate && !loginTime) return null;
                        
                        return (
                          <div key={i} className="flex gap-4 group">
                            <div className="flex flex-col items-center shrink-0">
                              <div className="w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-indigo-50"></div>
                              {i !== sessions.length - 1 && <div className="w-0.5 h-full bg-indigo-50"></div>}
                            </div>
                            <div className="pb-4 flex-1">
                              <div className="text-[10px] text-gray-400 font-bold">{loginDate || '未知日期'}</div>
                              <div className="text-xs font-black text-gray-700 mt-0.5">
                                {loginTime || '未知时间'} 进入系统
                              </div>
                              {logoutTime && (
                                <div className="text-xs font-medium text-gray-500 mt-1">
                                  {logoutTime} 退出系统
                                </div>
                              )}
                              {duration && (
                                <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold">
                                  <i className="fa-solid fa-clock"></i>
                                  本次时长: {duration}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }).filter(Boolean); // 过滤掉 null 值
                    })() : (
                      <div className="text-center py-12 text-gray-300">
                        <i className="fa-solid fa-ghost text-3xl mb-2 opacity-20"></i>
                        <p className="text-[10px] font-bold">暂无登录历史</p>
                      </div>
                    )}
                 </div>
               </div>

               <button 
                onClick={() => setSelectedStudent(null)}
                className="mt-8 py-4 bg-gray-50 text-gray-400 rounded-2xl text-xs font-black hover:bg-gray-100 transition-colors"
               >
                 关闭详情视图
               </button>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-center p-6 py-12">
                <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-200 mb-6 border-2 border-dashed border-gray-100">
                  <i className="fa-solid fa-fingerprint text-4xl"></i>
                </div>
                <h4 className="font-black text-gray-400 uppercase tracking-widest mb-2">选择学员查看档案</h4>
                <p className="text-xs text-gray-300 leading-relaxed font-medium">点击列表中的学员条目，即可在此处查看该学员的详细登录记录、总活跃时长及行为轨迹。</p>
             </div>
           )}
        </aside>
      </div>

      {/* 练习统计弹窗 */}
      {practiceStatsStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closePracticeStats}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* 弹窗头部 */}
            <div className="p-8 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {practiceStatsStudent.avatar ? (
                    <img src={practiceStatsStudent.avatar} className="w-16 h-16 rounded-2xl shadow-lg border-4 border-white" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl shadow-lg border-4 border-white bg-gray-100 flex items-center justify-center text-indigo-600 font-black text-2xl">
                      {(practiceStatsStudent.realName || practiceStatsStudent.nickname || '学')[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-black text-gray-900">{practiceStatsStudent.realName}</h3>
                    <p className="text-sm text-gray-500 font-bold mt-1">近30天练习统计</p>
                  </div>
                </div>
                <button
                  onClick={closePracticeStats}
                  className="w-12 h-12 rounded-2xl bg-white hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all shadow-sm"
                >
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
            </div>

            {/* 弹窗内容 */}
            <div className="flex-1 overflow-y-auto p-8">
              {loadingStats ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <i className="fa-solid fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
                    <p className="text-sm text-gray-400 font-bold">加载中...</p>
                  </div>
                </div>
              ) : practiceStats.length === 0 ? (
                <div className="text-center py-20">
                  <i className="fa-solid fa-inbox text-6xl text-gray-200 mb-4"></i>
                  <p className="text-sm text-gray-400 font-bold">暂无练习数据</p>
                </div>
              ) : (
                <div>
                  {/* 统计概览 */}
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-3xl">
                      <div className="text-3xl font-black text-blue-600 mb-2">
                        {practiceStats.reduce((sum, day) => sum + day.count, 0)}
                      </div>
                      <div className="text-xs text-blue-400 font-black uppercase tracking-widest">总练习题数</div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-3xl">
                      <div className="text-3xl font-black text-emerald-600 mb-2">
                        {practiceStats.filter(day => day.count > 0).length}
                      </div>
                      <div className="text-xs text-emerald-400 font-black uppercase tracking-widest">练习天数</div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-3xl">
                      <div className="text-3xl font-black text-amber-600 mb-2">
                        {Math.round(practiceStats.reduce((sum, day) => sum + day.count, 0) / practiceStats.filter(day => day.count > 0).length) || 0}
                      </div>
                      <div className="text-xs text-amber-400 font-black uppercase tracking-widest">日均题数</div>
                    </div>
                  </div>

                  {/* 每日练习列表 */}
                  <div className="space-y-3">
                    <h4 className="font-black text-xs text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <i className="fa-solid fa-calendar-days text-indigo-500"></i> 每日练习明细
                    </h4>
                    <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                      {practiceStats.map((day, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                            day.count > 0
                              ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100'
                              : 'bg-gray-50 border border-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm ${
                              day.count > 0 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'
                            }`}>
                              {day.displayDate}
                            </div>
                            <div>
                              <div className="text-sm font-black text-gray-700">{day.date}</div>
                              {day.count > 0 && Object.keys(day.modes).length > 0 && (
                                <div className="flex gap-2 mt-1">
                                  {Object.entries(day.modes).map(([mode, count]) => (
                                    <span key={mode} className="text-[10px] px-2 py-0.5 bg-white rounded-lg text-gray-500 font-bold">
                                      {mode === 'SEQUENTIAL' ? '顺序' : mode === 'MEMORY' ? '记忆' : '错题'}: {count}题
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className={`text-2xl font-black ${day.count > 0 ? 'text-indigo-600' : 'text-gray-300'}`}>
                            {day.count}
                            <span className="text-xs ml-1">题</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Supervisor;
