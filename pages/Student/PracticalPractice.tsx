
import React, { useState, useEffect, useRef } from 'react';
import { PracticalTask, PracticalPartType, PracticalTaskRecord } from '../../types';
import { useAppStore } from '../../store';
import { getEffectiveApiKey, hasApiKey, getApiKeyMissingMessage, generatePracticalEvaluation } from '../../utils/deepseek';

interface PracticalPracticeProps {
  onBackToPractice: () => void;
}

const PracticalPractice: React.FC<PracticalPracticeProps> = ({ onBackToPractice }) => {
  const store = useAppStore();
  const [selectedTask, setSelectedTask] = useState<PracticalTask | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [existingRecord, setExistingRecord] = useState<PracticalTaskRecord | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<PracticalTaskRecord | null>(null);
  
  // AI Evaluation states
  const [isAiEvaluating, setIsAiEvaluating] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState<{ score: number; content: string } | null>(null);
  
  const handleStartTask = (task: PracticalTask) => {
    setSelectedTask(task);
    setExistingRecord(null);
    setIsSubmitted(false);
    setShowResultModal(false);
    setAiEvaluation(null);
    
    const initial: Record<string, string> = {};
    task.parts.forEach(p => {
      if (p.type === PracticalPartType.BLANK) initial[p.id] = '';
    });
    setUserAnswers(initial);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateAnswer = (partId: string, value: string) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [partId]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedTask) return;
    if (confirm('确认提交吗？提交后将进入【比对复盘模式】，您可以查看正确答案并对照自己的作答进行学习。')) {
      const record: PracticalTaskRecord = {
        id: `ptr-${Date.now()}`,
        userId: store.currentUser!.id,
        taskId: selectedTask.id,
        answers: userAnswers,
        submittedAt: new Date().toLocaleString()
      };
      await store.savePracticalRecord(record);
      setIsSubmitted(true);
      setExistingRecord(record);
      setShowResultModal(true); // 触发弹出页面
    }
  };

  const handleExit = () => {
    setSelectedTask(null);
    setUserAnswers({});
    setIsSubmitted(false);
    setShowResultModal(false);
    setAiEvaluation(null);
    setViewingRecord(null);
    // 不调用 onBackToPractice()，直接返回实操练习中心
  };

  const handleViewHistory = () => {
    setShowHistoryModal(true);
  };

  const handleViewRecord = (record: PracticalTaskRecord) => {
    const task = store.practicalTasks.find(t => t.id === record.taskId);
    if (!task) {
      alert('找不到对应的实操题目');
      return;
    }
    setSelectedTask(task);
    setUserAnswers(record.answers);
    setIsSubmitted(true);
    setExistingRecord(record);
    setViewingRecord(record);
    setShowHistoryModal(false);
    setShowResultModal(true);
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (confirm('确定删除这条实操记录吗？')) {
      await store.deletePracticalRecord(recordId);
    }
  };

  const handleAiEvaluate = async () => {
    if (!selectedTask || isAiEvaluating) return;
    
    // 获取有效的 API Key
    const apiKey = getEffectiveApiKey({
      userApiKey: store.currentUser?.deepseekApiKey,
      adminApiKey: store.systemConfig?.deepseekApiKey
    });
    
    if (!apiKey) {
      alert(getApiKeyMissingMessage());
      return;
    }
    
    setIsAiEvaluating(true);
    setAiEvaluation(null);

    try {
      // 准备任务要求和答案
      let requirements = '';
      let userAnswer = '';
      let referenceAnswer = '';
      
      selectedTask.parts.forEach(p => {
        if (p.type === PracticalPartType.STEM) {
          requirements += p.content + '\n\n';
        } else if (p.type === PracticalPartType.BLANK) {
          userAnswer += (userAnswers[p.id] || '(未作答)') + '\n\n';
        } else if (p.type === PracticalPartType.ANSWER) {
          referenceAnswer += p.content + '\n\n';
        }
      });

      const result = await generatePracticalEvaluation({
        apiKey,
        taskTitle: selectedTask.title,
        requirements,
        userAnswer,
        referenceAnswer
      });
      
      setAiEvaluation(result);
    } catch (e: any) {
      console.error('[AI Evaluation Error]', e);
      alert(`AI 评价失败：${e.message || '未知错误'}\n\n请检查 API Key 配置是否正确。`);
    } finally {
      setIsAiEvaluating(false);
    }
  };

  if (selectedTask) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32 px-2 md:px-0">
        {/* 顶部悬浮头 - 移除提交按钮 */}
        <div className="flex items-center justify-between bg-white p-3 md:p-6 rounded-2xl md:rounded-3xl border shadow-sm sticky top-4 z-20 transition-all">
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={handleExit} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all active:scale-90 shrink-0">
              <i className="fa-solid fa-arrow-left text-sm md:text-base"></i>
            </button>
            <div>
              <h2 className="text-base md:text-xl font-black text-gray-900 line-clamp-1">{selectedTask.title}</h2>
              <span className="text-[9px] md:text-[10px] text-gray-400 font-bold mt-0.5 md:mt-1 block">
                {viewingRecord ? '查看历史记录' : '实操练习进行中'}
              </span>
            </div>
          </div>
          {isSubmitted && (
            <button onClick={() => setShowResultModal(true)} className="bg-indigo-900 text-white px-3 py-2 md:px-8 md:py-3 rounded-xl md:rounded-2xl font-black text-xs md:text-base shadow-lg active:scale-95 transition-all shrink-0">
              查看报告
            </button>
          )}
        </div>

        {/* 练习作答区域 - 优化移动端页边距 */}
        <div className="space-y-4 md:space-y-6">
          {selectedTask.parts.map((part, index) => {
            // 在主练习界面不显示参考答案，仅在提交后的弹窗中显示
            if (part.type === PracticalPartType.ANSWER) return null;

            return (
              <div 
                key={part.id} 
                className={`p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] border shadow-sm transition-all duration-500 ${
                  part.type === PracticalPartType.STEM ? 'bg-white border-gray-100' : 'bg-white border-indigo-100 ring-2 md:ring-4 ring-indigo-50/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-4 md:mb-6">
                  <span className={`text-[9px] md:text-[10px] font-black uppercase px-2 md:px-3 py-0.5 md:py-1 rounded-full ${
                    part.type === PracticalPartType.STEM ? 'bg-gray-100 text-gray-500' : 'bg-indigo-600 text-white shadow-md'
                  }`}>
                    {part.type === PracticalPartType.STEM ? `任务要求` : '你的作答区'}
                  </span>
                </div>

                {part.type === PracticalPartType.STEM ? (
                  <div className="text-gray-800 text-sm md:text-lg font-medium leading-relaxed markdown-body whitespace-pre-wrap overflow-x-auto" 
                       dangerouslySetInnerHTML={{ __html: (window as any).marked.parse(part.content) }} />
                ) : (
                  <div className="space-y-3">
                    <textarea 
                      className={`w-full rounded-xl md:rounded-2xl p-3 md:p-6 text-sm md:text-base font-medium h-48 md:h-64 outline-none border-2 transition-all ${
                        isSubmitted 
                          ? 'bg-gray-50 border-transparent text-gray-500 cursor-not-allowed shadow-inner' 
                          : 'bg-white border-gray-100 focus:border-indigo-400 shadow-sm'
                      }`}
                      value={userAnswers[part.id] || ''}
                      readOnly={isSubmitted}
                      onChange={e => handleUpdateAnswer(part.id, e.target.value)}
                      placeholder="请详细录入你的答案、代码实现或操作步骤说明..."
                    />
                    {isSubmitted && (
                      <p className="text-xs text-indigo-400 font-bold flex items-center gap-2">
                        <i className="fa-solid fa-lock"></i> 答案已锁定
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 底部提交按钮 - 新增 */}
        {!isSubmitted && (
          <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border shadow-sm sticky bottom-4 z-20">
            <button 
              onClick={handleSubmit} 
              className="w-full bg-indigo-600 text-white py-4 rounded-xl md:rounded-2xl font-black text-base md:text-lg shadow-lg shadow-indigo-100 active:scale-95 transition-all hover:bg-indigo-700 flex items-center justify-center gap-3"
            >
              <i className="fa-solid fa-paper-plane"></i>
              提交答案并比对
            </button>
          </div>
        )}

        {/* 比对复盘弹出页面 (模态框) - 优化移动端显示 */}
        {showResultModal && (
          <div className="fixed inset-0 z-[100] bg-gray-900/90 backdrop-blur-md flex items-center justify-center p-2 md:p-8 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-5xl h-full max-h-[95vh] md:max-h-[90vh] rounded-2xl md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
              {/* 弹窗头部 - 优化移动端 */}
              <div className="p-4 md:p-8 border-b flex justify-between items-center bg-gray-50/50 shrink-0">
                <div>
                  <h3 className="text-lg md:text-2xl font-black text-gray-900">实操比对复盘报告</h3>
                  <p className="text-[9px] md:text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">对照标准答案，分析作答优劣</p>
                </div>
                <div className="flex gap-2 md:gap-4">
                  {!viewingRecord && (
                    <button 
                      onClick={handleAiEvaluate}
                      disabled={isAiEvaluating}
                      className="bg-indigo-600 text-white px-3 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl font-black text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-50"
                    >
                      {isAiEvaluating ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                      <span className="hidden md:inline">AI 智能评价</span>
                      <span className="md:hidden">AI</span>
                    </button>
                  )}
                  <button 
                    onClick={() => setShowResultModal(false)}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white border shadow-sm text-gray-400 hover:text-indigo-600 flex items-center justify-center transition-all active:scale-90"
                  >
                    <i className="fa-solid fa-xmark text-lg md:text-xl"></i>
                  </button>
                </div>
              </div>

              {/* 弹窗内容滚动区 - 优化移动端页边距 */}
              <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-6 md:space-y-10 custom-scrollbar bg-gray-50/20">
                {/* AI 评价显示区 - 优化移动端 */}
                {aiEvaluation && (
                  <div className="p-4 md:p-8 bg-indigo-900 text-white rounded-2xl md:rounded-[2.5rem] shadow-2xl border-2 md:border-4 border-indigo-500 animate-ai-box">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-start gap-4 mb-4 md:mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center">
                          <i className="fa-solid fa-wand-magic-sparkles text-xl md:text-2xl text-indigo-300"></i>
                        </div>
                        <div>
                          <h4 className="text-base md:text-xl font-black">AI 智能测评结论</h4>
                          <p className="text-[9px] md:text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-0.5">由 Gemini 3.0 Pro 强力驱动</p>
                        </div>
                      </div>
                      <div className="text-left md:text-right">
                        <div className="text-3xl md:text-4xl font-black text-emerald-400 leading-none">{aiEvaluation.score}%</div>
                        <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest mt-2 opacity-60">契合度评分</div>
                      </div>
                    </div>
                    <div className="w-full h-px bg-white/10 mb-4 md:mb-6"></div>
                    <div 
                      className="markdown-body prose prose-invert max-w-none text-xs md:text-sm leading-relaxed overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: (window as any).marked.parse(aiEvaluation.content) }}
                    />
                  </div>
                )}

                {selectedTask.parts.map((part, index) => {
                  // 判断是否包含代码（简单检测：包含常见代码关键字或符号）
                  const isCodeContent = part.type === PracticalPartType.ANSWER && 
                    (part.content.includes('```') || 
                     part.content.includes('function') || 
                     part.content.includes('const ') ||
                     part.content.includes('let ') ||
                     part.content.includes('var ') ||
                     part.content.includes('import ') ||
                     part.content.includes('class ') ||
                     part.content.includes('{') && part.content.includes('}'));
                  
                  const isUserCodeAnswer = part.type === PracticalPartType.BLANK && 
                    (userAnswers[part.id]?.includes('function') ||
                     userAnswers[part.id]?.includes('const ') ||
                     userAnswers[part.id]?.includes('let ') ||
                     userAnswers[part.id]?.includes('{') && userAnswers[part.id]?.includes('}'));

                  return (
                    <div key={part.id} className={`p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] border shadow-sm transition-all ${
                      part.type === PracticalPartType.STEM ? 'bg-white' :
                      part.type === PracticalPartType.BLANK ? 'bg-indigo-50/30 border-indigo-100' :
                      'bg-amber-50 border-amber-200 border-2 border-dashed'
                    }`}>
                      <div className="flex items-center gap-2 mb-3 md:mb-4">
                        <span className={`text-[9px] md:text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${
                          part.type === PracticalPartType.STEM ? 'bg-gray-100 text-gray-500' :
                          part.type === PracticalPartType.BLANK ? 'bg-indigo-600 text-white' :
                          'bg-amber-600 text-white'
                        }`}>
                          {part.type === PracticalPartType.STEM ? `环节描述` :
                           part.type === PracticalPartType.BLANK ? '你的最终作答' : '标准参考答案'}
                        </span>
                      </div>

                      {part.type === PracticalPartType.STEM ? (
                        <div className="text-gray-700 text-sm md:text-base font-medium leading-relaxed markdown-body overflow-x-auto" 
                             dangerouslySetInnerHTML={{ __html: (window as any).marked.parse(part.content) }} />
                      ) : part.type === PracticalPartType.BLANK ? (
                        <div className={`p-3 md:p-6 bg-white rounded-xl md:rounded-2xl border border-indigo-50 text-indigo-900 font-medium text-xs md:text-sm leading-relaxed shadow-inner ${
                          isUserCodeAnswer ? 'overflow-x-auto' : 'whitespace-pre-wrap break-words'
                        }`}>
                          {userAnswers[part.id] || <span className="italic text-gray-300">未作答</span>}
                        </div>
                      ) : (
                        <div className={`p-3 md:p-6 bg-white/80 rounded-xl md:rounded-2xl border border-amber-100 text-amber-950 font-medium text-xs md:text-sm markdown-body leading-relaxed ${
                          isCodeContent ? 'overflow-x-auto' : ''
                        }`}>
                          <div dangerouslySetInnerHTML={{ __html: (window as any).marked.parse(part.content) }} />
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="pt-6 md:pt-10 pb-4 md:pb-6 text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 text-xl md:text-2xl">
                    <i className="fa-solid fa-check-double"></i>
                  </div>
                  <h4 className="text-base md:text-lg font-black text-gray-800">复盘结束</h4>
                  <p className="text-xs text-gray-400 mt-2">您可以关闭此窗口返回练习中心，或再次点击【查看比对报告】。</p>
                </div>
              </div>

              {/* 弹窗底部 - 优化移动端 */}
              <div className="p-3 md:p-6 border-t bg-white flex gap-2 md:gap-4 shrink-0">
                <button 
                  onClick={() => setShowResultModal(false)}
                  className="flex-1 py-3 md:py-4 bg-gray-100 text-gray-500 rounded-xl md:rounded-2xl text-sm md:text-base font-black hover:bg-gray-200 transition-all"
                >
                  继续浏览
                </button>
                <button 
                  onClick={handleExit}
                  className="flex-1 py-3 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl text-sm md:text-base font-black shadow-xl hover:bg-indigo-700 transition-all active:scale-95"
                >
                  完成并退出
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 px-2 md:px-0">
      <div className="bg-white p-4 md:p-10 rounded-2xl md:rounded-[3rem] border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
          <button onClick={onBackToPractice} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all active:scale-90 shrink-0">
            <i className="fa-solid fa-arrow-left text-sm md:text-base"></i>
          </button>
          <div className="flex-1">
            <h2 className="text-xl md:text-3xl font-black text-gray-900 mb-1 md:mb-2">实操练习中心</h2>
            <p className="text-xs md:text-sm text-gray-400 font-medium">在模拟真实场景的任务中提升实践能力。提交答案后可立即开启全屏参考答案比对模式。</p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={handleViewHistory}
            className="flex-1 md:flex-none bg-gray-100 text-gray-600 px-4 md:px-6 py-3 rounded-xl md:rounded-2xl font-black text-sm md:text-base hover:bg-gray-200 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-clock-rotate-left"></i>
            <span>历史记录</span>
          </button>
          <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-50 text-indigo-600 rounded-2xl md:rounded-3xl flex items-center justify-center text-2xl md:text-3xl shadow-inner shrink-0">
            <i className="fa-solid fa-keyboard"></i>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {store.practicalTasks.map(task => {
          const isDone = store.practicalRecords.some(r => r.taskId === task.id && r.userId === store.currentUser?.id);
          return (
            <button 
              key={task.id} 
              onClick={() => handleStartTask(task)}
              className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all text-left flex flex-col group relative overflow-hidden"
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl transition-all mb-6 md:mb-8 ${
                isDone ? 'bg-emerald-50 text-emerald-600 shadow-emerald-50' : 'bg-indigo-50 text-indigo-600 shadow-indigo-50'
              }`}>
                <i className={`fa-solid ${isDone ? 'fa-clipboard-check' : 'fa-code'}`}></i>
              </div>
              <h3 className="text-lg md:text-xl font-black text-gray-800 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-tight">{task.title}</h3>
              <div className="mt-auto pt-4 md:pt-6 flex items-center justify-between">
                <span className="text-[9px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest">
                  {task.parts.length} 个操作环节
                </span>
                {isDone && (
                  <span className="text-[9px] md:text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">已提交</span>
                )}
              </div>
            </button>
          );
        })}
        {store.practicalTasks.length === 0 && (
          <div className="col-span-full py-16 md:py-24 text-center bg-white rounded-2xl md:rounded-[3rem] border-2 border-dashed border-gray-100">
            <i className="fa-solid fa-ghost text-4xl md:text-5xl mb-4 md:mb-6 text-gray-200"></i>
            <p className="font-bold text-gray-400 text-sm md:text-base">管理端暂无发布的实操题</p>
          </div>
        )}
      </div>

      {/* 实操历史记录弹窗 */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2 md:p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl md:rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] md:max-h-[85vh] shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 md:p-8 border-b shrink-0">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-gray-900">实操历史记录</h3>
                <p className="text-[9px] md:text-xs text-gray-400 font-bold mt-1">查看您提交过的所有实操练习</p>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)} 
                className="text-gray-300 hover:text-gray-600 transition-colors w-10 h-10 flex items-center justify-center"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 md:p-8 space-y-3 md:space-y-4 custom-scrollbar">
              {store.practicalRecords
                .filter(r => r.userId === store.currentUser?.id)
                .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                .map((record) => {
                  const task = store.practicalTasks.find(t => t.id === record.taskId);
                  if (!task) return null;
                  
                  return (
                    <div 
                      key={record.id} 
                      className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-6 rounded-xl md:rounded-2xl border border-gray-100 bg-gray-50/30 hover:bg-indigo-50/30 hover:border-indigo-100 transition-all group"
                    >
                      <div className="flex items-start gap-3 md:gap-4 flex-1 mb-3 md:mb-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <i className="fa-solid fa-clipboard-check text-base md:text-lg"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-gray-800 text-sm md:text-base mb-1 line-clamp-1">{task.title}</h4>
                          <div className="flex flex-wrap items-center gap-2 text-[9px] md:text-[10px] text-gray-400 font-bold">
                            <span className="flex items-center gap-1">
                              <i className="fa-solid fa-clock"></i>
                              {record.submittedAt}
                            </span>
                            <span className="hidden md:inline">·</span>
                            <span className="flex items-center gap-1">
                              <i className="fa-solid fa-list-check"></i>
                              {Object.keys(record.answers).length} 项作答
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <button
                          onClick={() => handleViewRecord(record)}
                          className="flex-1 md:flex-none bg-indigo-600 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-black text-xs md:text-sm hover:bg-indigo-700 transition-all active:scale-95"
                        >
                          查看比对
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="bg-rose-50 text-rose-500 px-3 md:px-4 py-2 md:py-2.5 rounded-xl font-black text-xs md:text-sm hover:bg-rose-100 transition-all active:scale-95"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              
              {store.practicalRecords.filter(r => r.userId === store.currentUser?.id).length === 0 && (
                <div className="py-16 md:py-20 text-center text-gray-300">
                  <i className="fa-solid fa-ghost text-4xl md:text-5xl mb-4 opacity-20"></i>
                  <p className="font-bold text-sm md:text-base">暂无实操历史记录</p>
                  <p className="text-xs md:text-sm mt-2">完成实操练习后，记录将显示在这里</p>
                </div>
              )}
            </div>

            <div className="p-4 md:p-6 border-t shrink-0">
              <button 
                onClick={() => setShowHistoryModal(false)} 
                className="w-full py-3 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-sm md:text-base shadow-lg hover:bg-indigo-700 transition-all"
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

export default PracticalPractice;
