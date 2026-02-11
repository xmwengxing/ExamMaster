
import React, { useMemo, useState } from 'react';
import { Question, QuestionType, QuestionBank, PracticeMode, SrsRecord } from '../../types';
import { useAppStore } from '../../store';

interface MistakesProps {
  mistakes: Question[];
  banks: QuestionBank[];
  onStart: (mode: PracticeMode, params?: any) => void;
}

const Mistakes: React.FC<MistakesProps> = ({ mistakes, banks, onStart }) => {
  const store = useAppStore();
  const srsRecords = store.srsRecords || [];
  
  // 题库选择状态（null 表示"全部题库"）
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  
  // 题目预览弹窗状态
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // 根据选择的题库过滤错题
  const filteredMistakes = useMemo(() => {
    if (!selectedBankId) {
      return mistakes; // 全部题库
    }
    return mistakes.filter(m => m.bankId === selectedBankId);
  }, [mistakes, selectedBankId]);

  // 按题库统计错题数量
  const bankStats = useMemo(() => {
    const stats = new Map<string, number>();
    mistakes.forEach(m => {
      stats.set(m.bankId, (stats.get(m.bankId) || 0) + 1);
    });
    return stats;
  }, [mistakes]);

  // 核心逻辑：计算待复习题目（基于当前选择的题库）
  const reviewStats = useMemo(() => {
    console.log('[Mistakes] 计算 reviewStats', { 
      mistakesCount: filteredMistakes?.length || 0, 
      srsRecordsCount: srsRecords?.length || 0,
      selectedBankId,
      today 
    });
    
    // 确保数据存在
    const safeMistakes = filteredMistakes || [];
    const safeSrsRecords = srsRecords || [];
    
    // 待复习：在 srsRecords 中 nextReviewDate <= today 的题目，或者是从未在 srsRecords 里的错题
    const reviewedIds = safeSrsRecords.map(r => r.questionId);
    const pendingSrs = safeSrsRecords.filter(r => r.nextReviewDate <= today).map(r => r.questionId);
    const neverReviewed = safeMistakes.filter(m => !reviewedIds.includes(m.id)).map(m => m.id);
    
    const allPendingIds = Array.from(new Set([...pendingSrs, ...neverReviewed]));
    const pendingQuestions = safeMistakes.filter(m => allPendingIds.includes(m.id));

    const stats = {
      pendingQuestions,
      pendingCount: pendingQuestions.length,
      masteredCount: safeSrsRecords.filter(r => r.status === 'MASTERED').length,
      totalMistakes: safeMistakes.length
    };
    
    console.log('[Mistakes] reviewStats 计算完成', stats);
    return stats;
  }, [filteredMistakes, srsRecords, selectedBankId, today]);

  const getBankName = (bankId: string) => {
    return banks.find(b => b.id === bankId)?.name || '未知题库';
  };
  
  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case QuestionType.SINGLE: return '单选题';
      case QuestionType.MULTIPLE: return '多选题';
      case QuestionType.JUDGE: return '判断题';
      case QuestionType.FILL_IN_BLANK: return '填空题';
      case QuestionType.SHORT_ANSWER: return '简答题';
      default: return '未知';
    }
  };

  // 分页计算（基于过滤后的错题）
  const totalPages = Math.ceil(filteredMistakes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMistakes = filteredMistakes.slice(startIndex, endIndex);

  // 切换题库时重置分页
  const handleBankChange = (bankId: string | null) => {
    setSelectedBankId(bankId);
    setCurrentPage(1); // 重置到第一页
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

  console.log('[Mistakes] 渲染组件', { 
    reviewStats, 
    mistakesLength: mistakes?.length || 0,
    banksLength: banks?.length || 0,
    srsRecordsLength: srsRecords?.length || 0
  });

  // 🔍 调试：检查数据是否正常
  if (!mistakes || !Array.isArray(mistakes)) {
    console.error('[Mistakes] mistakes 数据异常:', mistakes);
  }
  if (!srsRecords || !Array.isArray(srsRecords)) {
    console.error('[Mistakes] srsRecords 数据异常:', srsRecords);
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">智能复习中心</h2>
          <p className="text-xs text-gray-400 mt-1 font-bold italic uppercase tracking-widest">基于艾宾浩斯记忆曲线算法</p>
        </div>
        <button 
          onClick={handleStartSmartReview}
          className="w-full md:w-auto bg-indigo-600 text-white px-8 md:px-10 py-3 md:py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3"
          style={{ display: 'flex !important', visibility: 'visible !important', opacity: '1 !important' }}
        >
          <i className="fa-solid fa-brain"></i> 启动今日智能复习
        </button>
      </div>

      {/* 题库选择器 */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <i className="fa-solid fa-filter text-indigo-600"></i>
          <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest">题库筛选</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* 全部题库按钮 */}
          <button
            onClick={() => handleBankChange(null)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              selectedBankId === null
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <i className="fa-solid fa-layer-group mr-2"></i>
            全部题库
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
              {mistakes.length}
            </span>
          </button>
          
          {/* 各个题库按钮 */}
          {banks.map(bank => {
            const count = bankStats.get(bank.id) || 0;
            if (count === 0) return null; // 没有错题的题库不显示
            
            return (
              <button
                key={bank.id}
                onClick={() => handleBankChange(bank.id)}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                  selectedBankId === bank.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <i className="fa-solid fa-book mr-2"></i>
                {bank.name}
                <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* 当前选择提示 */}
        {selectedBankId && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              <i className="fa-solid fa-info-circle mr-1"></i>
              当前显示：<span className="font-bold text-indigo-600">{getBankName(selectedBankId)}</span> 的错题
            </p>
          </div>
        )}
      </div>

      {/* SRS 概览面板 */}
      <div className="grid gap-3 md:gap-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)', display: 'grid !important' }}>
        <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border-2 border-indigo-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
             <i className="fa-solid fa-calendar-day text-4xl md:text-6xl"></i>
          </div>
          <div className="text-3xl md:text-4xl font-black text-indigo-600 mb-1">{reviewStats.pendingCount}</div>
          <div className="text-xs font-black text-gray-400 uppercase tracking-widest">今日待巩固</div>
          <p className="text-[10px] text-gray-400 mt-2 md:mt-4 leading-relaxed font-medium">包含新发现的错题以及按曲线计算已到复习节点的题目。</p>
        </div>
        
        <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
             <i className="fa-solid fa-graduation-cap text-4xl md:text-6xl"></i>
          </div>
          <div className="text-3xl md:text-4xl font-black text-emerald-500 mb-1">{reviewStats.masteredCount}</div>
          <div className="text-xs font-black text-gray-400 uppercase tracking-widest">已完全掌握</div>
          <p className="text-[10px] text-gray-400 mt-2 md:mt-4 leading-relaxed font-medium">连续通过多轮复习，预测记忆周期已超过 21 天的优质题目。</p>
        </div>

        <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
             <i className="fa-solid fa-fire text-4xl md:text-6xl"></i>
          </div>
          <div className="text-3xl md:text-4xl font-black text-rose-500 mb-1">{reviewStats.totalMistakes}</div>
          <div className="text-xs font-black text-gray-400 uppercase tracking-widest">历史错题总计</div>
          <p className="text-[10px] text-gray-400 mt-2 md:mt-4 leading-relaxed font-medium">所有在系统练习和模拟考试中产生过的错误记录。</p>
        </div>
      </div>

      {/* 待复习列表 */}
      <div className="space-y-3 md:space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
            最近复习轨迹
            {selectedBankId && (
              <span className="ml-2 text-indigo-600">
                [{getBankName(selectedBankId)}]
              </span>
            )}
            {filteredMistakes.length > 0 && (
              <span className="ml-2 text-indigo-600">
                ({startIndex + 1}-{Math.min(endIndex, filteredMistakes.length)} / {filteredMistakes.length})
              </span>
            )}
          </h3>
          <div className="flex items-center gap-1">
             <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
             <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">算法生效中</span>
          </div>
        </div>
        
        <div className="space-y-1.5 md:space-y-2">
          {filteredMistakes.length > 0 ? currentMistakes.map((q) => {
            const srs = srsRecords.find(r => r.questionId === q.id);
            return (
              <div 
                key={q.id} 
                className="bg-white p-3 md:p-5 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 md:gap-4 transition-all hover:border-indigo-100 group"
              >
                <div className="flex-1 space-y-1.5 md:space-y-2">
                  <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
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
                  <h4 className="text-gray-800 font-bold leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all text-sm">{q.content}</h4>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => setPreviewQuestion(q)}
                    className="w-9 h-9 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-inner"
                    title="查看解析"
                  >
                    <i className="fa-solid fa-eye text-sm"></i>
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
        </div>
        
        {/* 分页控件 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 disabled:hover:text-gray-600"
            >
              <i className="fa-solid fa-chevron-left text-sm"></i>
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // 显示逻辑：始终显示第1页、最后1页、当前页及其前后各1页
                const showPage = 
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1);
                
                const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
                const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;
                
                if (!showPage && !showEllipsisBefore && !showEllipsisAfter) {
                  return null;
                }
                
                if (showEllipsisBefore || showEllipsisAfter) {
                  return (
                    <span key={`ellipsis-${page}`} className="px-2 text-gray-400 font-bold">
                      ...
                    </span>
                  );
                }
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[40px] h-10 px-3 rounded-xl font-bold transition-all ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 disabled:hover:text-gray-600"
            >
              <i className="fa-solid fa-chevron-right text-sm"></i>
            </button>
          </div>
        )}
      </div>
      
      {/* 题目预览弹窗 */}
      {previewQuestion && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewQuestion(null)}
        >
          <div 
            className="bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className="p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <i className="fa-solid fa-book-open text-indigo-600"></i>
                  题目解析
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {getQuestionTypeLabel(previewQuestion.type)} · {getBankName(previewQuestion.bankId)}
                </p>
              </div>
              <button
                onClick={() => setPreviewQuestion(null)}
                className="w-10 h-10 rounded-full bg-white/50 hover:bg-white flex items-center justify-center text-gray-600 transition-all"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            {/* 弹窗内容 */}
            <div className="p-6 md:p-8 overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar">
              {/* 题目内容 */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-black">
                    题目
                  </span>
                </div>
                <h4 className="text-lg md:text-xl font-bold text-gray-900 leading-relaxed">
                  {previewQuestion.content}
                </h4>
              </div>
              
              {/* 选项（单选、多选、判断题） */}
              {(previewQuestion.type === QuestionType.SINGLE || 
                previewQuestion.type === QuestionType.MULTIPLE || 
                previewQuestion.type === QuestionType.JUDGE) && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-purple-600 text-white px-3 py-1 rounded-lg text-xs font-black">
                      选项
                    </span>
                  </div>
                  <div className="space-y-3">
                    {previewQuestion.options.map((opt, idx) => {
                      const optLabel = String.fromCharCode(65 + idx);
                      const isCorrect = previewQuestion.type === QuestionType.MULTIPLE
                        ? (previewQuestion.answer as string[]).includes(optLabel)
                        : previewQuestion.answer === optLabel;
                      
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-500'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              {optLabel}
                            </span>
                            <span className={`flex-1 font-medium ${
                              isCorrect ? 'text-emerald-900' : 'text-gray-700'
                            }`}>
                              {opt}
                            </span>
                            {isCorrect && (
                              <i className="fa-solid fa-check-circle text-emerald-500 text-lg"></i>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* 填空题答案 */}
              {previewQuestion.type === QuestionType.FILL_IN_BLANK && previewQuestion.blanks && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-black">
                      参考答案
                    </span>
                  </div>
                  <div className="space-y-3">
                    {previewQuestion.blanks.map((blank, idx) => (
                      <div key={blank.id} className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-200">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-emerald-700">
                            空白 {blank.position}:
                          </span>
                          <span className="text-sm font-medium text-emerald-900">
                            {blank.acceptedAnswers.join(' / ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 简答题参考答案 */}
              {previewQuestion.type === QuestionType.SHORT_ANSWER && previewQuestion.referenceAnswer && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-black">
                      参考答案
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-200">
                    <p className="text-sm font-medium text-emerald-900 leading-relaxed whitespace-pre-wrap">
                      {previewQuestion.referenceAnswer}
                    </p>
                  </div>
                </div>
              )}
              
              {/* 正确答案（单选、多选、判断题） */}
              {(previewQuestion.type === QuestionType.SINGLE || 
                previewQuestion.type === QuestionType.MULTIPLE || 
                previewQuestion.type === QuestionType.JUDGE) && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-black">
                      正确答案
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-500">
                    <p className="text-lg font-black text-emerald-900">
                      {Array.isArray(previewQuestion.answer)
                        ? previewQuestion.answer.join(', ')
                        : previewQuestion.answer}
                    </p>
                  </div>
                </div>
              )}
              
              {/* 题目解析 */}
              {previewQuestion.explanation && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-amber-600 text-white px-3 py-1 rounded-lg text-xs font-black">
                      题目解析
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-200">
                    <p className="text-sm font-medium text-amber-900 leading-relaxed whitespace-pre-wrap">
                      {previewQuestion.explanation}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* 弹窗底部 */}
            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => setPreviewQuestion(null)}
                className="flex-1 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  setPreviewQuestion(null);
                  onStart(PracticeMode.MEMORY, { questions: [previewQuestion] });
                }}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
              >
                <i className="fa-solid fa-brain mr-2"></i>
                进入背题模式
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mistakes;
