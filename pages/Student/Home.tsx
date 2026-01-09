
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, QuestionBank, QuestionType, PracticeMode, BannerItem, DailyProgress } from '../../types';
import { useAppStore } from '../../store';

interface HomeProps {
  user: User;
  banks: QuestionBank[];
  activeBank: QuestionBank;
  banners: BannerItem[];
  announcement: string;
  onBankChange: (bank: QuestionBank) => void;
  onNavigate: (page: string, params?: any) => void;
  hasBank?: boolean;
  hasVideo?: boolean;
  hasPractical?: boolean;
  mistakeCount?: number;
  questionCounts: Record<QuestionType, number>;
}

const StudentHome: React.FC<HomeProps> = ({ 
  user, banks, activeBank, banners, announcement, onBankChange, onNavigate, hasBank = true, hasVideo = true, hasPractical = false, mistakeCount = 0, questionCounts 
}) => {
  const store = useAppStore();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [dailyProgress, setDailyProgress] = useState(0);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [tempGoal, setTempGoal] = useState(user.dailyGoal || 20);
  const [historyData, setHistoryData] = useState<DailyProgress[]>([]);

  // 计算当前题库的题目总数
  const currentBankQuestionCount = useMemo(() => {
    if (!activeBank) return 0;
    return store.questions.filter(q => q.bankId === activeBank.id).length;
  }, [activeBank, store.questions]);

  // 季度热力图相关计算（90天）
  const heatmapData = useMemo(() => {
    const today = new Date();
    const result = [];
    // 显示过去 90 天的数据（一个季度）
    const daysToShow = 90;
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const record = historyData.find(h => h.date === dateStr);
      result.push({
        date: dateStr,
        count: record?.count || 0,
        dayOfWeek: d.getDay() // 0=周日, 1=周一, ..., 6=周六
      });
    }
    return result;
  }, [historyData]);

  const getHeatColor = (count: number) => {
    if (count === 0) return 'bg-gray-100';
    if (count < 10) return 'bg-emerald-100';
    if (count < 30) return 'bg-emerald-300';
    if (count < 60) return 'bg-emerald-500';
    return 'bg-emerald-700';
  };

  const fetchProgress = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const history = await store.getDailyProgress();
    const todayRecord = history.find(h => h.date === today);
    setDailyProgress(todayRecord?.count || 0);
    setHistoryData([...history].sort((a, b) => b.date.localeCompare(a.date)));
  }, [store]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  useEffect(() => {
    if (!banners.length) return;
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const safeDailyGoal = Math.max(1, user?.dailyGoal || 20);
  const progressPercent = Math.min(100, Math.floor((dailyProgress / safeDailyGoal) * 100)) || 0;

  const handleUpdateGoal = async () => {
    await store.updateProfile({ dailyGoal: tempGoal });
    setShowGoalModal(false);
  };

  const actions = [
    { id: PracticeMode.SEQUENTIAL, label: '顺序练习', icon: 'fa-layer-group', color: 'indigo', desc: '筑牢基础', show: hasBank },
    { id: PracticeMode.MEMORY, label: '背题模式', icon: 'fa-brain', color: 'emerald', desc: '快速提分', show: hasBank },
    { id: 'MOCK_EXAM', label: '模拟考试', icon: 'fa-stopwatch', color: 'amber', desc: '全真演练', show: hasBank },
    { id: 'mistakes', label: '错题本', icon: 'fa-fire', color: 'rose', desc: '攻坚难点', show: hasBank },
    { id: 'practical', label: '实操模拟', icon: 'fa-laptop-code', color: 'cyan', desc: '实战演练', show: hasPractical },
    { id: 'videos', label: '视频课程', icon: 'fa-video', color: 'purple', desc: '名师讲堂', show: hasVideo },
  ].filter(a => a.show !== false);

  const handleActionClick = (id: string) => {
    if (id === 'MOCK_EXAM') {
      onNavigate('exams', { view: 'mock' });
    } else if (id === 'mistakes') {
      onNavigate('mistakes');
    } else if (id === 'videos') {
      onNavigate('videos');
    } else if (id === 'practical') {
      onNavigate('practical-practice');
    } else {
      // 进入顺序练习 / 背题模式时，始终带上当前题库 ID，避免后续切换题库导致进度错乱
      onNavigate('practice-mode', { mode: id, bankId: activeBank?.id });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-4 animate-in fade-in duration-500 w-full max-w-full overflow-x-hidden">
      {/* 公告栏 - 移到最顶部 */}
      <div className="bg-amber-50 text-amber-600 px-4 py-3 rounded-2xl border border-amber-100 flex items-center gap-3 overflow-hidden">
        <i className="fa-solid fa-bullhorn shrink-0 text-amber-500"></i>
        <div className="flex-1 overflow-hidden font-black text-xs animate-marquee">{announcement}</div>
      </div>

      {/* 顶部个人资料看板 */}
      <div className="bg-white rounded-[2.5rem] p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            {user.avatar ? (
              <img src={user.avatar} className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] object-cover border-4 border-indigo-50 shadow-sm" alt="Avatar" />
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] object-cover border-4 border-indigo-50 shadow-sm bg-gray-100 flex items-center justify-center text-indigo-600 font-black text-2xl">{(user.realName || user.nickname || '学员')[0]}</div>
            )}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full"></div>
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900">{user.realName || user.nickname}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest">学员账号</span>
              <span className="text-[10px] font-bold text-gray-400">{user.phone}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => onNavigate('profile')} className="flex items-center gap-2 bg-gray-50 text-gray-600 px-4 md:px-5 py-2 md:py-3 rounded-2xl text-xs font-black hover:bg-gray-100 transition-all border border-gray-100">
            <i className="fa-solid fa-user-pen"></i> 个人档案
          </button>
          <button onClick={() => onNavigate('account')} className="flex items-center gap-2 bg-gray-900 text-white px-4 md:px-5 py-2 md:py-3 rounded-2xl text-xs font-black hover:bg-black transition-all shadow-lg">
            <i className="fa-solid fa-gears"></i> 系统设置
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
          <i className="fa-solid fa-folder-open"></i> 当前题库: {activeBank ? `${activeBank.name} (${currentBankQuestionCount}题)` : '未选择'}
        </div>
        <select value={activeBank ? activeBank.id : ''} onChange={(e) => { const b = banks.find(x => x.id === e.target.value); if(b) onBankChange(b); }} className="text-xs bg-gray-50 px-2 py-1 rounded-lg outline-none font-bold text-gray-500">
          {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 relative h-48 md:h-64 rounded-3xl overflow-hidden shadow-xl group cursor-pointer">
          {banners.length > 0 ? banners.map((b, i) => (
            <div key={b.id} className={`absolute inset-0 transition-opacity duration-1000 ${i === currentBanner ? 'opacity-100 z-10' : 'opacity-0'}`} onClick={() => onNavigate('banner-detail', { banner: b })}>
              <img src={b.image} className="w-full h-full object-cover" alt="Banner" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 flex flex-col justify-end text-white">
                <div className="text-2xl font-black mb-2">{b.content}</div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-80">
                  <i className="fa-solid fa-circle-info"></i> 点击查看详情
                </div>
              </div>
            </div>
          )) : (
            <div className="absolute inset-0 bg-indigo-600 flex items-center justify-center text-white font-black">EduMaster 系统已就绪</div>
          )}
        </div>

        {/* 每日进度卡片 */}
        <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex flex-col items-center justify-center text-center space-y-4 relative group/card">
          <div className="absolute top-6 right-6 flex gap-2">
            <button 
              onClick={() => setShowHistoryModal(true)}
              className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center transition-all"
              title="学习历史"
            >
              <i className="fa-solid fa-calendar-check text-xs"></i>
            </button>
            <button 
              onClick={() => { setTempGoal(user.dailyGoal || 20); setShowGoalModal(true); }}
              className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center transition-all"
              title="设置目标"
            >
              <i className="fa-solid fa-cog text-xs"></i>
            </button>
          </div>

          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90">
              <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-gray-50" />
              <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={301.6} strokeDashoffset={301.6 - (301.6 * progressPercent) / 100} strokeLinecap="round" className="text-indigo-600 transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-indigo-600">{progressPercent}%</span>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">今日进度</span>
            </div>
          </div>
          <div>
            <h4 className="font-black text-gray-800">每日学习目标</h4>
            <p className="text-[10px] text-gray-400 mt-1 font-bold">今日已刷 {dailyProgress} / {safeDailyGoal} 题</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {actions.map(a => {
          const colorClasses: Record<string, string> = {
            indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600',
            emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600',
            amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600',
            rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600',
            cyan: 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600',
            purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-600'
          };

          return (
            <button key={a.id} onClick={() => handleActionClick(a.id)} className="p-4 md:p-6 bg-white rounded-[2.5rem] border border-gray-100 hover:shadow-xl hover:border-indigo-100 transition-all text-left flex flex-col gap-4 group min-w-0">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:text-white ${colorClasses[a.color] || 'bg-gray-50 text-gray-600'}`}>
                <i className={`fa-solid ${a.icon} text-xl`}></i>
              </div>
              <div>
                <div className="font-black text-gray-800">{a.label}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{a.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 季度学习热力图 - 移到最底部，横向排列自动换行 */}
      <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-2">
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
            <i className="fa-solid fa-fire-flame-curved text-orange-500"></i> 季度学习热力图
          </h3>
          <div className="flex items-center gap-1">
             <span className="text-[8px] text-gray-400 font-bold">少</span>
             <div className="flex gap-1">
                <div className="w-2 h-2 rounded-sm bg-gray-100"></div>
                <div className="w-2 h-2 rounded-sm bg-emerald-100"></div>
                <div className="w-2 h-2 rounded-sm bg-emerald-300"></div>
                <div className="w-2 h-2 rounded-sm bg-emerald-500"></div>
                <div className="w-2 h-2 rounded-sm bg-emerald-700"></div>
             </div>
             <span className="text-[8px] text-gray-400 font-bold">多</span>
          </div>
        </div>
        
        {/* 横向排列，自动换行 */}
        <div className="flex flex-wrap gap-1.5 justify-start px-2">
          {heatmapData.map((day, idx) => (
            <div 
              key={idx}
              className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm transition-all hover:scale-125 cursor-help ${getHeatColor(day.count)}`}
              title={`${day.date}: ${day.count} 题`}
            ></div>
          ))}
        </div>
        
        <p className="text-[10px] text-gray-400 font-medium italic text-right pr-2">
          * 统计过去 90 天的学习轨迹，坚持是一种力量。
        </p>
      </div>

      {/* 目标设置弹窗 */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-sm:max-w-xs max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-2xl">
                <i className="fa-solid fa-bullseye"></i>
              </div>
              <h3 className="text-xl font-black text-gray-900">设定刷题目标</h3>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">给自己设定一个小目标，坚持每天进步一点点。</p>
              
              <div className="flex items-center gap-4 py-4">
                <button onClick={() => setTempGoal(Math.max(1, tempGoal - 5))} className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all">
                  <i className="fa-solid fa-minus"></i>
                </button>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={tempGoal}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setTempGoal(Math.max(1, Math.min(1000, val)));
                  }}
                  className="flex-1 text-4xl font-black text-indigo-600 text-center bg-transparent border-none outline-none focus:ring-0"
                  style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                />
                <button onClick={() => setTempGoal(Math.min(1000, tempGoal + 5))} className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all">
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowGoalModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black">取消</button>
                <button onClick={handleUpdateGoal} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100">保存设置</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 历史成就弹窗 */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-900">历史达成情况</h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-300 hover:text-gray-600 transition-colors">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            <div className="overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {historyData.length > 0 ? historyData.slice(0, 15).map((item, idx) => {
                const isGoalReached = item.count >= safeDailyGoal;
                return (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 bg-gray-50/30">
                    <div>
                      <div className="text-xs font-black text-gray-400 uppercase tracking-widest">{item.date}</div>
                      <div className="text-sm font-bold text-gray-800 mt-0.5">完成 {item.count} 题</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      isGoalReached ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                    }`}>
                      {isGoalReached ? '已达标' : '未达标'}
                    </div>
                  </div>
                );
              }) : (
                <div className="py-20 text-center text-gray-300">
                  <i className="fa-solid fa-ghost text-4xl mb-4 opacity-20"></i>
                  <p className="font-bold">暂无历史数据</p>
                </div>
              )}
            </div>

            <button onClick={() => setShowHistoryModal(false)} className="w-full mt-6 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">我知晓了</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentHome;
