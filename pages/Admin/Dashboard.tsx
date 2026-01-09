
import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useAppStore } from '../../store';

const AdminDashboard: React.FC = () => {
  const { students, exams, loginLogs, examHistory, banks, auditLogs, allProgress } = useAppStore();
  const [showPracticeHistory, setShowPracticeHistory] = useState(false);
  const [showQuestionStats, setShowQuestionStats] = useState(false);
  const [showExamList, setShowExamList] = useState(false);

  const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  // 辅助函数：格式化日期 YYYY-MM-DD
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return dateStr.split(' ')[0];
    }
  };

  // 计算今日练习人数（从 daily_progress 表统计，count > 0 的去重用户）
  const todayStr = formatDate(new Date().toISOString());
  const todayPracticeCount = useMemo(() => {
    const todayRecords = allProgress.filter(p => p.date === todayStr && p.count > 0);
    return new Set(todayRecords.map(p => p.userId)).size;
  }, [allProgress, todayStr]);

  // 计算全站题目总数
  const totalQuestions = useMemo(() => {
    return banks.reduce((acc, bank) => acc + (bank.questionCount || 0), 0);
  }, [banks]);

  // 计算近30天每日练习数据（从 daily_progress 统计）
  const last30DaysPractice = useMemo(() => {
    const results = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = formatDate(d.toISOString());
      
      const dayRecords = allProgress.filter(p => p.date === dStr && p.count > 0);
      const count = new Set(dayRecords.map(p => p.userId)).size;
      
      results.push({ date: dStr, count });
    }
    return results;
  }, [allProgress]);

  // 题库热度统计 (真实数据)
  const bankHeatData = useMemo(() => {
    return banks
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 5)
      .map(b => ({ name: b.name.substring(0, 6), value: b.usageCount || 0 }));
  }, [banks]);

  // 活跃趋势（近7日登录人数）
  const chartData = useMemo(() => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = formatDate(d.toISOString());
      const count = new Set(
        loginLogs.filter(log => {
          const logDate = formatDate(log.loginTime);
          return logDate === dStr;
        }).map(log => log.userId)
      ).size;
      result.push({ name: days[d.getDay()], value: count });
    }
    return result;
  }, [loginLogs]);

  const stats = [
    { id: 'online', label: '在线学员', value: students.filter(s => s.isOnline).length, sub: '实时监控', icon: 'fa-user-check', color: 'indigo' },
    { id: 'questions', label: '题目总量', value: totalQuestions, sub: '全站题目总计', icon: 'fa-database', color: 'emerald', clickable: true },
    { id: 'practice', label: '每日练习', value: todayPracticeCount, sub: '今日去重人数', icon: 'fa-fire', color: 'rose', clickable: true },
    { id: 'exams', label: '系统考场', value: exams.length, sub: '有效场次', icon: 'fa-stopwatch', color: 'amber', clickable: true },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">管理概览大屏</h1>
          <p className="text-gray-500 text-sm font-medium">数据驱动决策 · 实时学情监控</p>
        </div>
        <div className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          最后更新: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div 
            key={i} 
            onClick={() => {
              if (stat.id === 'practice') setShowPracticeHistory(true);
              if (stat.id === 'questions') setShowQuestionStats(true);
              if (stat.id === 'exams') setShowExamList(true);
            }}
            className={`bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group ${stat.clickable ? 'cursor-pointer border-indigo-100 bg-indigo-50/10' : ''}`}
          >
            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600 mb-4 shadow-inner group-hover:scale-110 transition-transform`}>
              <i className={`fa-solid ${stat.icon} text-xl`}></i>
            </div>
            <div className="flex justify-between items-center mb-1">
              <div className="text-xs font-black text-gray-400 uppercase tracking-widest">{stat.label}</div>
              {stat.clickable && <i className="fa-solid fa-circle-chevron-right text-gray-300 text-xs"></i>}
            </div>
            <div className="text-3xl font-black text-gray-900 tracking-tighter">{stat.value}</div>
            <div className="text-[10px] text-gray-400 font-bold mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 趋势图 */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border shadow-sm">
          <h3 className="font-black text-lg text-gray-800 mb-8">活跃学员趋势 (近7日)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={4} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 题库排行 */}
        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
          <h3 className="font-black text-lg text-gray-800 mb-8">热门题库 Top 5</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bankHeatData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontWeight: 'bold', fontSize: 10}} width={60} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
                  {bankHeatData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 审计日志 */}
      <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="font-black text-lg text-gray-800">系统审计日志 (最近100条)</h3>
          <i className="fa-solid fa-shield-halved text-gray-300"></i>
        </div>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest sticky top-0">
              <tr>
                <th className="px-6 py-3">时间</th>
                <th className="px-6 py-3">操作员</th>
                <th className="px-6 py-3">行为</th>
                <th className="px-6 py-3">目标对象</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3 font-mono text-gray-400">{log.timestamp}</td>
                  <td className="px-6 py-3 font-bold">{log.operatorName}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded-full font-black text-[9px] ${
                      log.action.includes('删除') ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>{log.action}</span>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{log.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 题目分布弹窗 */}
      {showQuestionStats && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowQuestionStats(false)}>
          <div 
            className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div>
                <h3 className="text-xl font-black text-gray-900">全站题目分布明细</h3>
                <p className="text-xs text-gray-400 font-bold mt-1">按题库统计题目数量</p>
              </div>
              <button onClick={() => setShowQuestionStats(false)} className="text-gray-300 hover:text-indigo-600 transition-colors">
                <i className="fa-solid fa-circle-xmark text-2xl"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
               {banks.map((bank, idx) => (
                 <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-indigo-50 transition-colors group">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                          {bank.name[0]}
                       </div>
                       <div className="max-w-[180px]">
                          <div className="text-sm font-bold text-gray-800 truncate">{bank.name}</div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{bank.category}</div>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="text-xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{bank.questionCount} <span className="text-[10px] text-gray-400">题</span></div>
                       <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full" 
                            style={{ width: `${Math.min(100, (bank.questionCount / (totalQuestions || 1)) * 100)}%` }}
                          ></div>
                       </div>
                    </div>
                 </div>
               ))}
               {banks.length === 0 && (
                 <div className="py-20 text-center text-gray-300">
                    <i className="fa-solid fa-folder-open text-4xl mb-4 opacity-20"></i>
                    <p className="font-bold">暂无题库数据</p>
                 </div>
               )}
            </div>

            <button 
              onClick={() => setShowQuestionStats(false)}
              className="mt-6 w-full py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-xl active:scale-95"
            >
              返回看板
            </button>
          </div>
        </div>
      )}

      {/* 历史练习人数弹窗 */}
      {showPracticeHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowPracticeHistory(false)}>
          <div 
            className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div>
                <h3 className="text-xl font-black text-gray-900">近30日练习活跃记录</h3>
                <p className="text-xs text-gray-400 font-bold mt-1">统计每日点击进入练习的去重人数</p>
              </div>
              <button onClick={() => setShowPracticeHistory(false)} className="text-gray-300 hover:text-rose-500 transition-colors">
                <i className="fa-solid fa-circle-xmark text-2xl"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
               {last30DaysPractice.map((day, idx) => (
                 <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-rose-50 transition-colors group">
                    <div className="flex items-center gap-4">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${day.count > 0 ? 'bg-rose-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                          {day.date.split('-')[2]}
                       </div>
                       <div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{day.date.split('-').slice(0,2).join('-')}</div>
                          <div className="text-sm font-bold text-gray-800">{day.date === todayStr ? '今天' : '历史日期'}</div>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="text-xl font-black text-gray-900 group-hover:text-rose-600 transition-colors">{day.count} <span className="text-[10px] text-gray-400">人练习</span></div>
                       <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div 
                            className="h-full bg-rose-500 rounded-full" 
                            style={{ width: `${Math.min(100, (day.count / (students.length || 1)) * 100)}%` }}
                          ></div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>

            <button 
              onClick={() => setShowPracticeHistory(false)}
              className="mt-6 w-full py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-xl active:scale-95"
            >
              关闭视图
            </button>
          </div>
        </div>
      )}

      {/* 系统考场明细弹窗 */}
      {showExamList && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowExamList(false)}>
          <div 
            className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div>
                <h3 className="text-xl font-black text-gray-900">系统考试场次明细</h3>
                <p className="text-xs text-gray-400 font-bold mt-1">当前已发布的系统考试列表</p>
              </div>
              <button onClick={() => setShowExamList(false)} className="text-gray-300 hover:text-amber-500 transition-colors">
                <i className="fa-solid fa-circle-xmark text-2xl"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
               {exams.map((exam, idx) => (
                 <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-amber-50 transition-colors group">
                    <div className="flex items-center gap-4">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${exam.isVisible ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                          <i className="fa-solid fa-file-invoice"></i>
                       </div>
                       <div className="max-w-[200px]">
                          <div className="text-sm font-bold text-gray-800 truncate">{exam.title}</div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {exam.duration} 分钟 · 总分 {exam.totalScore}
                          </div>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${exam.isVisible ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-100 text-gray-400'}`}>
                          {exam.isVisible ? '展示中' : '已隐藏'}
                       </div>
                    </div>
                 </div>
               ))}
               {exams.length === 0 && (
                 <div className="py-20 text-center text-gray-300">
                    <i className="fa-solid fa-calendar-xmark text-4xl mb-4 opacity-20"></i>
                    <p className="font-bold">暂无系统考试数据</p>
                 </div>
               )}
            </div>

            <button 
              onClick={() => setShowExamList(false)}
              className="mt-6 w-full py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-xl active:scale-95"
            >
              返回看板
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
