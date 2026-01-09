
import React, { useMemo } from 'react';
import { Question, QuestionType, QuestionBank, PracticeMode, SrsRecord } from '../../types';
import { useAppStore } from '../../store';

interface MistakesProps {
  mistakes: Question[];
  banks: QuestionBank[];
  onStart: (mode: PracticeMode, params?: any) => void;
}

const Mistakes: React.FC<MistakesProps> = ({ mistakes, banks, onStart }) => {
  const store = useAppStore();
  const srsRecords = store.srsRecords;

  const today = new Date().toISOString().split('T')[0];

  // 核心逻辑：计算待复习题目
  const reviewStats = useMemo(() => {
    // 待复习：在 srsRecords 中 nextReviewDate <= today 的题目，或者是从未在 srsRecords 里的错题
    const reviewedIds = srsRecords.map(r => r.questionId);
    const pendingSrs = srsRecords.filter(r => r.nextReviewDate <= today).map(r => r.questionId);
    const neverReviewed = mistakes.filter(m => !reviewedIds.includes(m.id)).map(m => m.id);
    
    const allPendingIds = Array.from(new Set([...pendingSrs, ...neverReviewed]));
    const pendingQuestions = mistakes.filter(m => allPendingIds.includes(m.id));

    return {
      pendingQuestions,
      pendingCount: pendingQuestions.length,
      masteredCount: srsRecords.filter(r => r.status === 'MASTERED').length,
      totalMistakes: mistakes.length
    };
  }, [mistakes, srsRecords, today]);

  const getBankName = (bankId: string) => {
    return banks.find(b => b.id === bankId)?.name || '未知题库';
  };

  const handleStartSmartReview = () => {
    if (reviewStats.pendingCount === 0) {
      alert('今日暂无待复习题目，您可以先去练习新题目。');
      return;
    }
    // 启动智能复习：传入特定题目集并设置模式为 SMART_REVIEW
    onStart(PracticeMode.SMART_REVIEW, { 
      questions: reviewStats.pendingQuestions,
      isCustom: true
    });
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">智能复习中心</h2>
          <p className="text-xs text-gray-400 mt-1 font-bold italic uppercase tracking-widest">基于艾宾浩斯记忆曲线算法</p>
        </div>
        <button 
          onClick={handleStartSmartReview}
          className="w-full md:w-auto bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <i className="fa-solid fa-brain"></i> 启动今日智能复习
        </button>
      </div>

      {/* SRS 概览面板 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
             <i className="fa-solid fa-calendar-day text-6xl"></i>
          </div>
          <div className="text-4xl font-black text-indigo-600 mb-1">{reviewStats.pendingCount}</div>
          <div className="text-xs font-black text-gray-400 uppercase tracking-widest">今日待巩固</div>
          <p className="text-[10px] text-gray-400 mt-4 leading-relaxed font-medium">包含新发现的错题以及按曲线计算已到复习节点的题目。</p>
        </div>
        
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
             <i className="fa-solid fa-graduation-cap text-6xl"></i>
          </div>
          <div className="text-4xl font-black text-emerald-500 mb-1">{reviewStats.masteredCount}</div>
          <div className="text-xs font-black text-gray-400 uppercase tracking-widest">已完全掌握</div>
          <p className="text-[10px] text-gray-400 mt-4 leading-relaxed font-medium">连续通过多轮复习，预测记忆周期已超过 21 天的优质题目。</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
             <i className="fa-solid fa-fire text-6xl"></i>
          </div>
          <div className="text-4xl font-black text-rose-500 mb-1">{reviewStats.totalMistakes}</div>
          <div className="text-xs font-black text-gray-400 uppercase tracking-widest">历史错题总计</div>
          <p className="text-[10px] text-gray-400 mt-4 leading-relaxed font-medium">所有在系统练习和模拟考试中产生过的错误记录。</p>
        </div>
      </div>

      {/* 待复习列表 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">最近复习轨迹</h3>
          <div className="flex items-center gap-1">
             <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
             <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">算法生效中</span>
          </div>
        </div>
        
        <div className="space-y-3">
          {mistakes.length > 0 ? mistakes.slice(0, 10).map((q) => {
            const srs = srsRecords.find(r => r.questionId === q.id);
            return (
              <div 
                key={q.id} 
                className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 transition-all hover:border-indigo-100 group"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-black uppercase">{q.type}</span>
                    <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold">{getBankName(q.bankId)}</span>
                    {srs ? (
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${
                        srs.status === 'MASTERED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        srs.nextReviewDate <= today ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' :
                        'bg-gray-50 text-gray-400 border-gray-100'
                      }`}>
                        {srs.status === 'MASTERED' ? '已掌握' : (srs.nextReviewDate <= today ? '今日复习' : `${srs.nextReviewDate}复习`)}
                      </span>
                    ) : (
                      <span className="text-[9px] font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100 uppercase">等待首轮复习</span>
                    )}
                  </div>
                  <h4 className="text-gray-800 font-bold leading-relaxed line-clamp-1 group-hover:line-clamp-none transition-all">{q.content}</h4>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button 
                    onClick={() => onStart(PracticeMode.MEMORY, { questions: [q] })}
                    className="w-10 h-10 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-inner"
                  >
                    <i className="fa-solid fa-magnifying-glass text-sm"></i>
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="bg-white py-24 rounded-[3rem] border border-dashed border-gray-100 text-center space-y-4">
               <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full mx-auto flex items-center justify-center text-4xl shadow-inner">
                  <i className="fa-solid fa-shield-check"></i>
               </div>
               <div>
                  <h4 className="text-xl font-black text-gray-800">所有知识点已扫描！</h4>
                  <p className="text-gray-400 text-sm font-medium mt-1">目前没有需要紧急复习的题目，保持这个状态。</p>
               </div>
            </div>
          )}
          {mistakes.length > 10 && (
            <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest pt-4">列表仅展示最近 10 条错题</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Mistakes;
