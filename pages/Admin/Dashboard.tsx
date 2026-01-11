
import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useAppStore } from '../../store';

const AdminDashboard: React.FC = () => {
  const { students, exams, loginLogs, examHistory, banks, auditLogs, allProgress } = useAppStore();
  const [showPracticeHistory, setShowPracticeHistory] = useState(false);
  const [showQuestionStats, setShowQuestionStats] = useState(false);
  const [showExamList, setShowExamList] = useState(false);
  const [showTopScores, setShowTopScores] = useState(false);
  const [topScoresTab, setTopScoresTab] = useState<'recent' | 'all'>('recent');

  const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  // 辅助函数：格式化日期 YYYY-MM-DD
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      // 检查日期是否有效
      if (isNaN(d.getTime())) {
        // 尝试解析中文格式 YYYY/MM/DD HH:mm:ss
        const parts = dateStr.split(/[\/\s:]/);
        if (parts.length >= 3) {
          return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
        return dateStr.split(' ')[0];
      }
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

  // 高分榜TOP10（近30天）
  const topScoresRecent = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return examHistory
      .filter(record => {
        // 只统计已完成的考试
        if (!record.isFinished || record.score < 0) return false;
        // 过滤近30天的记录
        try {
          const recordDate = new Date(record.submitTime);
          return recordDate >= thirtyDaysAgo;
        } catch {
          return false;
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((record, index) => {
        const student = students.find(s => s.id === record.userId);
        return {
          rank: index + 1,
          name: student?.realName || student?.nickname || '未知学员',
          score: record.score,
          totalScore: record.totalScore,
          examTitle: record.examTitle,
          submitTime: record.submitTime
        };
      });
  }, [examHistory, students]);

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
          // 使用 log.time 字段（ISO格式）
          const logDate = formatDate(log.time || log.loginTime || '');
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <div 
            key={i} 
            onClick={() => {
              if (stat.id === 'practice') setShowPracticeHistory(true);
              if (stat.id === 'questions') setShowQuestionStats(true);
              if (stat.id === 'exams') setShowExamList(true);
            }}
            className={`bg-white p-4 md:p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group ${stat.clickable ? 'cursor-pointer border-indigo-100 bg-indigo-50/10' : ''}`}
          >
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600 mb-3 md:mb-4 shadow-inner group-hover:scale-110 transition-transform`}>
              <i className={`fa-solid ${stat.icon} text-lg md:text-xl`}></i>
            </div>
            <div className="flex justify-between items-center mb-1">
              <div className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">{stat.label}</div>
              {stat.clickable && <i className="fa-solid fa-circle-chevron-right text-gray-300 text-xs"></i>}
            </div>
            <div className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter">{stat.value}</div>
            <div className="text-[9px] md:text-[10px] text-gray-400 font-bold mt-1">{stat.sub}</div>
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

        {/* 高分榜TOP */}
        <div 
          className="bg-white p-8 rounded-[2.5rem] border shadow-sm cursor-pointer hover:shadow-xl transition-all group"
          onClick={() => setShowTopScores(true)}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
              <i className="fa-solid fa-trophy text-amber-500"></i>
              高分榜 TOP
            </h3>
            <span className="text-xs font-bold text-indigo-600 group-hover:text-indigo-800 flex items-center gap-1">
              查看详情 <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </span>
          </div>
          
          <div className="space-y-3">
            {topScoresRecent.length > 0 ? (
              topScoresRecent.map((record) => (
                <div key={`${record.rank}-${record.submitTime}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                    record.rank === 1 ? 'bg-amber-500 text-white' :
                    record.rank === 2 ? 'bg-gray-400 text-white' :
                    record.rank === 3 ? 'bg-orange-600 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {record.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-gray-800 truncate">{record.name}</div>
                    <div className="text-xs text-gray-400 truncate">{record.examTitle}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-lg text-indigo-600">{record.score}</div>
                    <div className="text-[10px] text-gray-400">/{record.totalScore}分</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <i className="fa-solid fa-trophy text-4xl mb-2 opacity-20"></i>
                <p className="text-xs font-medium">暂无考试记录</p>
              </div>
            )}
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

      {/* 高分榜详情弹窗 */}
      {showTopScores && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                    <i className="fa-solid fa-trophy text-amber-500"></i>
                    高分榜
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">系统考试和自主模拟考试得分排名</p>
                </div>
                <button
                  onClick={() => setShowTopScores(false)}
                  className="w-10 h-10 rounded-full bg-white/50 hover:bg-white flex items-center justify-center text-gray-600 transition-all"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* 标签切换 */}
              <div className="flex gap-2 mb-6">
                <button 
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                    topScoresTab === 'recent'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => setTopScoresTab('recent')}
                >
                  <i className="fa-solid fa-calendar-days mr-2"></i>
                  近30天排名
                </button>
                <button 
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                    topScoresTab === 'all'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => setTopScoresTab('all')}
                >
                  <i className="fa-solid fa-clock-rotate-left mr-2"></i>
                  历史总排名
                </button>
              </div>

              {/* 排名列表 */}
              <div className="space-y-3">
                {(() => {
                  let topRecords;
                  
                  if (topScoresTab === 'recent') {
                    // 近30天排名
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    
                    topRecords = examHistory
                      .filter(record => {
                        if (!record.isFinished || record.score < 0) return false;
                        try {
                          const recordDate = new Date(record.submitTime);
                          return recordDate >= thirtyDaysAgo;
                        } catch {
                          return false;
                        }
                      })
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 30);
                  } else {
                    // 历史总排名
                    topRecords = examHistory
                      .filter(record => record.isFinished && record.score >= 0)
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 30);
                  }

                  const formattedRecords = topRecords.map((record, index) => {
                    const student = students.find(s => s.id === record.userId);
                    return {
                      rank: index + 1,
                      name: student?.realName || student?.nickname || '未知学员',
                      phone: student?.phone || '',
                      score: record.score,
                      totalScore: record.totalScore,
                      percentage: ((record.score / record.totalScore) * 100).toFixed(1),
                      examTitle: record.examTitle,
                      submitTime: record.submitTime
                    };
                  });

                  return formattedRecords.length > 0 ? (
                    formattedRecords.map((record) => (
                      <div 
                        key={`${record.rank}-${record.submitTime}`}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                          record.rank <= 3 
                            ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200' 
                            : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                        }`}
                      >
                        {/* 排名 */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shrink-0 ${
                          record.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg' :
                          record.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg' :
                          record.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg' :
                          'bg-white border-2 border-gray-200 text-gray-600'
                        }`}>
                          {record.rank <= 3 ? (
                            <i className="fa-solid fa-crown"></i>
                          ) : (
                            record.rank
                          )}
                        </div>

                        {/* 学员信息 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-800">{record.name}</span>
                            <span className="text-xs text-gray-400 font-mono">{record.phone}</span>
                          </div>
                          <div className="text-xs text-gray-500 truncate">{record.examTitle}</div>
                          <div className="text-[10px] text-gray-400 mt-1">{record.submitTime}</div>
                        </div>

                        {/* 分数 */}
                        <div className="text-right shrink-0">
                          <div className="font-black text-2xl text-indigo-600">{record.score}</div>
                          <div className="text-xs text-gray-400">/{record.totalScore}分</div>
                          <div className={`text-[10px] font-bold mt-1 ${
                            parseFloat(record.percentage) >= 90 ? 'text-emerald-600' :
                            parseFloat(record.percentage) >= 60 ? 'text-amber-600' :
                            'text-rose-600'
                          }`}>
                            {record.percentage}%
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 text-gray-400">
                      <i className="fa-solid fa-trophy text-5xl mb-4 opacity-20"></i>
                      <p className="font-bold">
                        {topScoresTab === 'recent' ? '近30天暂无考试记录' : '暂无考试记录'}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <button 
                onClick={() => setShowTopScores(false)}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-xl active:scale-95"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
