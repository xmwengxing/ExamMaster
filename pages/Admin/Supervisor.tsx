
import React, { useState, useMemo } from 'react';
import { User, LoginLog } from '../../types';

interface SupervisorProps {
  students: User[];
  logs: LoginLog[];
}

const Supervisor: React.FC<SupervisorProps> = ({ students, logs }) => {
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('ALL'); // 新增：班级筛选
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const formatDuration = (seconds: number = 0) => {
    const minutes = Math.floor(seconds / 60);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
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
    const headers = ['姓名', '手机号', '班级', '工作单位', '状态', '最后活跃时间', '累计在线时长(分钟)'];
    const rows = filteredStudents.map(s => [
      s.realName,
      s.phone,
      s.className || '--',
      s.company || '通用部门',
      s.isOnline ? '在线' : '离线',
      s.lastLogin || '--',
      Math.floor((s.totalOnlineTime || 0) / 60) // 转换为分钟
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
                    {selectedStudent.loginHistory?.length ? [...selectedStudent.loginHistory].reverse().map((time, i) => (
                      <div key={i} className="flex gap-4 group">
                         <div className="flex flex-col items-center shrink-0">
                           <div className="w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-indigo-50"></div>
                           {i !== selectedStudent.loginHistory!.length - 1 && <div className="w-0.5 h-full bg-indigo-50"></div>}
                         </div>
                         <div className="pb-4">
                           <div className="text-[10px] text-gray-400 font-bold">{time.split(' ')[0]}</div>
                           <div className="text-xs font-black text-gray-700 mt-0.5">{time.split(' ')[1]} 进入系统</div>
                         </div>
                      </div>
                    )) : (
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
    </div>
  );
};

export default Supervisor;
