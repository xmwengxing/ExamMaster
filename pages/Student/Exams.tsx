
import React, { useState, useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Exam, ExamRecord, QuestionBank, PracticeMode, QuestionType, Question } from '../../types';
import { useAppStore } from '../../store';
import { getEffectiveApiKey, hasApiKey, getApiKeyMissingMessage, generateQuestionAnalysis } from '../../utils/deepseek';

// Definition for question review item props
const QuestionReviewItem: React.FC<{ question: Question, userAnswer: string[], idx: number }> = ({ question, userAnswer, idx }) => {
  const store = useAppStore();
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [groundingChunks, setGroundingChunks] = useState<any[]>([]);

  const handleAIExplain = async () => {
    if (isAiLoading) return;
    
    // 获取有效的 API Key
    const apiKey = getEffectiveApiKey({
      userApiKey: store.currentUser?.deepseekApiKey,
      adminApiKey: store.systemConfig?.deepseekApiKey
    });
    
    if (!apiKey) {
      alert(getApiKeyMissingMessage());
      return;
    }
    
    setIsAiLoading(true);
    try {
      const analysis = await generateQuestionAnalysis({
        apiKey,
        question: question.content,
        options: question.options,
        answer: question.answer,
        explanation: question.explanation
      });
      
      // 添加学生答案分析
      const userStr = userAnswer.join('') || '未作答';
      const correctStr = Array.isArray(question.answer) ? question.answer.join('') : question.answer;
      const additionalInfo = `\n\n---\n\n**您的答案**: ${userStr}\n**正确答案**: ${correctStr}\n\n${userStr !== correctStr ? '**提示**: 请仔细对比您的答案与正确答案，找出差异所在。' : '**恭喜**: 您答对了！'}`;
      
      setAiAnalysis(analysis + additionalInfo);
      setGroundingChunks([]); // DeepSeek 不提供 grounding chunks
    } catch (e: any) { 
      console.error('[AI Analysis Error]', e);
      setAiAnalysis(`AI 解析加载失败：${e.message || '未知错误'}`); 
    } finally { 
      setIsAiLoading(false); 
    }
  };

  const correctStr = Array.isArray(question.answer) ? question.answer.join('') : question.answer;
  const userStr = userAnswer.join('') || '未作答';

  return (
    <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex gap-2">
          <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">第 {idx + 1} 题</span>
          <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-black">{question.type === QuestionType.SINGLE ? '单选' : question.type === QuestionType.MULTIPLE ? '多选' : '判断'}</span>
        </div>
        <button 
          onClick={handleAIExplain}
          disabled={isAiLoading}
          className="bg-indigo-900 text-white px-4 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 transition-all"
        >
          {isAiLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
          AI 深度讲评
        </button>
      </div>

      <h4 className="font-bold text-gray-800 leading-relaxed">{question.content}</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {question.options.map((opt, i) => {
          const label = String.fromCharCode(65 + i);
          const isCorrect = Array.isArray(question.answer) ? question.answer.includes(label) : question.answer === label;
          const isUser = userAnswer.includes(label);
          
          return (
            <div key={i} className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-3 ${
              isCorrect ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 
              isUser ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-gray-50 border-transparent text-gray-500'
            }`}>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black ${
                isCorrect ? 'bg-emerald-500 text-white' : isUser ? 'bg-rose-500 text-white' : 'bg-white text-gray-400'
              }`}>{label}</div>
              {opt}
            </div>
          );
        })}
      </div>

      <div className="flex gap-6 pt-2">
        <div className="text-[10px] font-black">
          <span className="text-gray-400 uppercase tracking-widest mr-2">你的答案:</span>
          <span className="text-rose-500">{userStr}</span>
        </div>
        <div className="text-[10px] font-black">
          <span className="text-gray-400 uppercase tracking-widest mr-2">正确答案:</span>
          <span className="text-emerald-600">{correctStr}</span>
        </div>
      </div>

      {aiAnalysis && (
        <div className="mt-4 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-in slide-in-from-top-2">
          <div className="markdown-body text-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((window as any).marked.parse(aiAnalysis) as string) }} />
          {groundingChunks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-indigo-100 flex flex-wrap gap-2">
              {groundingChunks.map((chunk, i) => chunk.web && (
                <a key={i} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-white border rounded-lg text-[9px] font-bold text-indigo-600">
                  <i className="fa-solid fa-link"></i> {chunk.web.title}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Added: Defining missing ExamsProps interface
interface ExamsProps {
  exams: Exam[];
  history: ExamRecord[];
  banks: QuestionBank[];
  allQuestions: Question[];
  onStartExam: (exam: Exam) => void;
  onStartMock: (config: any) => void;
  onDeleteHistory: (id: string) => void;
  initialView?: 'system' | 'mock' | 'history' | 'review_wrong';
  hasPermission?: boolean;
}

const Exams: React.FC<ExamsProps> = ({ exams, history, banks, allQuestions, onStartExam, onStartMock, onDeleteHistory, initialView, hasPermission = true }) => {
  const store = useAppStore();
  const [view, setView] = useState<'system' | 'mock' | 'history' | 'review_wrong'>(initialView || 'system');
  const [reviewRecord, setReviewRecord] = useState<ExamRecord | null>(null);
  const [passScorePercent] = useState(60); // 默认及格比例
  
  const [mockConfig, setMockConfig] = useState({
    bankId: banks[0]?.id || '',
    singleCount: 70,
    multipleCount: 10,
    judgeCount: 10,
    fillInBlankCount: 0,
    shortAnswerCount: 0,
    selectedChapters: [] as string[], // 选中的章节
    strategy: 'RANDOM' as 'RANDOM' | 'MANUAL'
  });

  const selectedBank = useMemo(() => banks.find(b => b.id === mockConfig.bankId) || banks[0], [banks, mockConfig.bankId]);
  
  // 获取选中题库的所有章节（去重）
  const availableChapters = useMemo(() => {
    if (!mockConfig.bankId) return [];
    const bankQs = allQuestions.filter(q => q.bankId === mockConfig.bankId);
    const chapters = bankQs
      .map(q => q.chapter)
      .filter((c): c is string => !!c && c.trim() !== '');
    return Array.from(new Set(chapters)).sort();
  }, [allQuestions, mockConfig.bankId]);
  
  const visibleSystemExams = useMemo(() => {
    const now = new Date();
    return exams.filter(e => {
      if (e.isVisible === false) return false;
      if (e.startTime && new Date(e.startTime) > now) return false;
      if (e.endTime && new Date(e.endTime) < now) return false;
      return true;
    });
  }, [exams]);

  const totalScore = useMemo(() => {
    if (!selectedBank) return 0;
    const config = selectedBank.scoreConfig;
    return (
      (mockConfig.singleCount * (config[QuestionType.SINGLE] || 0)) +
      (mockConfig.multipleCount * (config[QuestionType.MULTIPLE] || 0)) +
      (mockConfig.judgeCount * (config[QuestionType.JUDGE] || 0)) +
      (mockConfig.fillInBlankCount * (config[QuestionType.FILL_IN_BLANK] || 0)) +
      (mockConfig.shortAnswerCount * (config[QuestionType.SHORT_ANSWER] || 0))
    );
  }, [selectedBank, mockConfig]);

  useEffect(() => { if (initialView) setView(initialView); }, [initialView]);

  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl border border-indigo-50 flex items-center justify-center text-indigo-600 mb-8 relative">
           <i className="fa-solid fa-lock text-4xl"></i>
           <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-rose-500 rounded-full border-4 border-white flex items-center justify-center text-white">
              <i className="fa-solid fa-xmark text-xs font-black"></i>
           </div>
        </div>
         <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">暂无系统考试权限</h3>
         <p className="text-sm text-gray-400 font-medium max-w-sm leading-relaxed mb-10">
           您的账号尚未开通系统考试访问权限。模拟考试仍可正常使用。如需参加系统发布的考试，请联系管理员授权。
         </p>
        <div className="flex gap-3">
          <div className="bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
             系统已锁定
          </div>
        </div>
      </div>
    );
  }

  const renderWrongReview = () => {
    if (!reviewRecord) return null;
    
    const wrongQuestions = (reviewRecord.wrongQuestionIds || [])
      .map(id => allQuestions.find(q => q.id === id))
      .filter(Boolean) as Question[];

    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-10">
           <div className="flex items-center gap-4">
             <button onClick={() => setView('history')} className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-all active:scale-90">
                <i className="fa-solid fa-arrow-left"></i>
             </button>
             <div>
               <h3 className="text-xl font-black text-gray-800">{reviewRecord.examTitle}</h3>
               <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest mt-0.5">错题深度复盘报告</p>
             </div>
           </div>
           <div className="flex items-center gap-3">
              <div className="text-center px-4 border-r">
                <div className="text-lg font-black text-rose-500">{wrongQuestions.length}</div>
                <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">错题数</div>
              </div>
              <div className="text-center px-4">
                <div className="text-lg font-black text-indigo-600">{reviewRecord.score === -1 ? '--' : reviewRecord.score}</div>
                <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">考试得分</div>
              </div>
           </div>
        </div>

        <div className="space-y-6">
          {wrongQuestions.length > 0 ? wrongQuestions.map((q, idx) => (
            <QuestionReviewItem 
              key={q.id} 
              question={q} 
              userAnswer={reviewRecord.userAnswers?.[q.id] || []} 
              idx={idx} 
            />
          )) : (
            <div className="py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-emerald-100">
               <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                 <i className="fa-solid fa-face-smile-wink text-2xl"></i>
               </div>
               <h4 className="text-lg font-black text-emerald-800">满分选手，无错题可看！</h4>
               <p className="text-xs text-gray-400 font-medium">您可以继续保持，或者尝试挑战更高难度的题库。</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 区分系统考试历史和模拟考试历史
  const systemHistory = useMemo(() => history.filter(h => h.examId && !h.id.startsWith('mock')), [history]);
  const mockHistory = useMemo(() => history.filter(h => h.id.startsWith('mock')), [history]);

  return (
    <div className="space-y-6">
      {view !== 'review_wrong' && (
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border self-start">
          {(['system', 'mock', 'history'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                view === v ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {v === 'system' ? '系统考试' : v === 'mock' ? '自主模拟' : '考绩查询'}
            </button>
          ))}
        </div>
      )}

      {view === 'system' && (
        <div className="space-y-6">
          {/* 系统考试列表 */}
          <div className="grid gap-4">
            {visibleSystemExams.length > 0 ? visibleSystemExams.map(exam => {
              // 检查是否已经参加过此考试
              const existingRecord = systemHistory.find(h => h.examId === exam.id && h.isFinished);
              const hasStarted = systemHistory.find(h => h.examId === exam.id);
              
              return (
                <div key={exam.id} className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600"><i className="fa-solid fa-file-signature text-xl"></i></div>
                    <div>
                      <h4 className="font-bold text-lg">{exam.title}</h4>
                      <div className="text-xs text-gray-400 flex flex-wrap gap-4 mt-1">
                        <span><i className="fa-regular fa-clock mr-1"></i> {exam.duration} 分钟</span>
                        <span><i className="fa-solid fa-star mr-1"></i> 总分 {exam.totalScore}</span>
                        {exam.endTime && <span className="text-rose-500 font-bold">截止: {exam.endTime.replace('T', ' ')}</span>}
                      </div>
                      {existingRecord && (
                        <div className="mt-2 text-xs font-bold text-emerald-600">
                          <i className="fa-solid fa-check-circle mr-1"></i>
                          已完成 (得分: {existingRecord.score})
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {existingRecord ? (
                      <button 
                        onClick={() => {
                          alert('您已经交卷完成此考试，无法再次参加。如需重新考试，请联系管理员。');
                        }}
                        className="w-full md:w-auto px-8 py-3 bg-gray-100 text-gray-400 rounded-2xl font-bold"
                        disabled
                      >
                        已完成
                      </button>
                    ) : hasStarted && !hasStarted.isFinished ? (
                      <button 
                        onClick={async () => {
                          console.log('[Exams] 继续系统考试，记录:', hasStarted);
                          
                          // 先加载题目
                          const bankId = exam.bankId;
                          let bankQuestions = [];
                          if (bankId) {
                            console.log('[Exams] 加载题库题目:', bankId);
                            bankQuestions = await store.loadBankQuestions(bankId);
                            console.log('[Exams] 题目加载完成:', bankQuestions.length);
                          }
                          
                          // 根据 orderedQuestionIds 生成题目列表
                          let finalQuestions = [];
                          if (hasStarted.orderedQuestionIds && hasStarted.orderedQuestionIds.length > 0) {
                            finalQuestions = hasStarted.orderedQuestionIds
                              .map((id: string) => bankQuestions.find(q => q.id === id))
                              .filter(Boolean) as Question[];
                            console.log('[Exams] 根据 orderedQuestionIds 生成题目:', finalQuestions.length);
                          }
                          
                          onStartExam({
                            ...exam,
                            initialIndex: hasStarted.currentIndex,
                            existingAnswers: hasStarted.userAnswers,
                            orderedQuestionIds: hasStarted.orderedQuestionIds,
                            recordId: hasStarted.id,
                            questions: finalQuestions
                          });
                        }}
                        className="w-full md:w-auto px-8 py-3 bg-amber-500 text-white rounded-2xl font-bold shadow-lg shadow-amber-100"
                      >
                        继续考试
                      </button>
                    ) : (
                      <button 
                        onClick={async () => {
                          console.log('[Exams] 开始系统考试:', exam);
                          
                          // 先加载题目
                          const bankId = exam.bankId;
                          let bankQuestions = [];
                          if (bankId) {
                            console.log('[Exams] 加载题库题目:', bankId);
                            bankQuestions = await store.loadBankQuestions(bankId);
                            console.log('[Exams] 题目加载完成:', bankQuestions.length);
                          }
                          
                          // 根据考试配置生成题目列表
                          let finalQuestions = [];
                          if (exam.questionIds && exam.questionIds.length > 0) {
                            // 如果考试指定了题目ID列表
                            finalQuestions = exam.questionIds
                              .map((id: string) => bankQuestions.find(q => q.id === id))
                              .filter(Boolean) as Question[];
                            console.log('[Exams] 根据 questionIds 生成题目:', finalQuestions.length);
                          } else {
                            // 否则随机抽题
                            const singles = bankQuestions.filter(q => q.type === QuestionType.SINGLE).sort(() => Math.random() - 0.5).slice(0, exam.singleCount || 0);
                            const multiples = bankQuestions.filter(q => q.type === QuestionType.MULTIPLE).sort(() => Math.random() - 0.5).slice(0, exam.multipleCount || 0);
                            const judges = bankQuestions.filter(q => q.type === QuestionType.JUDGE).sort(() => Math.random() - 0.5).slice(0, exam.judgeCount || 0);
                            finalQuestions = [...singles, ...multiples, ...judges];
                            console.log('[Exams] 随机生成题目:', finalQuestions.length);
                          }
                          
                          onStartExam({
                            ...exam,
                            questions: finalQuestions
                          });
                        }}
                        className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100"
                      >
                        开始考试
                      </button>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="py-20 text-center text-gray-300">
                 <i className="fa-solid fa-calendar-xmark text-4xl mb-4 opacity-20"></i>
                 <p className="font-bold">当前暂无正在进行的考试</p>
              </div>
            )}
          </div>
          
          {/* 系统考试历史记录 */}
          {systemHistory.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-black text-gray-400 text-xs uppercase tracking-widest ml-1">系统考试历史记录</h3>
              <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {systemHistory.map(record => (
                    <div key={record.id} className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${record.isFinished ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          <i className={`fa-solid ${record.isFinished ? 'fa-check-double' : 'fa-hourglass-half'}`}></i>
                        </div>
                        <div>
                          <div className="font-bold text-gray-800">{record.examTitle}</div>
                          <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                            <span>得分: <span className="font-black text-gray-600">{record.isFinished ? record.score : '未完成'}</span></span>
                            <span>|</span>
                            <span>{record.submitTime}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {record.isFinished ? (
                          <button onClick={() => { setReviewRecord(record); setView('review_wrong'); }} className="px-4 py-2 bg-white border text-indigo-600 rounded-xl text-xs font-bold">查阅</button>
                        ) : (
                          <button 
                            onClick={async () => {
                              console.log('[Exams] 继续系统考试，记录:', record);
                              
                              // 先加载题目
                              const bankId = record.bankId;
                              let bankQuestions = [];
                              if (bankId) {
                                console.log('[Exams] 加载题库题目:', bankId);
                                bankQuestions = await store.loadBankQuestions(bankId);
                                console.log('[Exams] 题目加载完成:', bankQuestions.length);
                              }
                              
                              // 根据 orderedQuestionIds 生成题目列表
                              let finalQuestions = [];
                              if (record.orderedQuestionIds && record.orderedQuestionIds.length > 0) {
                                finalQuestions = record.orderedQuestionIds
                                  .map((id: string) => bankQuestions.find(q => q.id === id))
                                  .filter(Boolean) as Question[];
                                console.log('[Exams] 根据 orderedQuestionIds 生成题目:', finalQuestions.length);
                              }
                              
                              // 找到对应的考试配置
                              const exam = exams.find(e => e.id === record.examId);
                              if (exam) {
                                onStartExam({
                                  ...exam,
                                  initialIndex: record.currentIndex,
                                  existingAnswers: record.userAnswers,
                                  orderedQuestionIds: record.orderedQuestionIds,
                                  recordId: record.id,
                                  questions: finalQuestions
                                });
                              }
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100"
                          >
                            继续考试
                          </button>
                        )}
                        <button onClick={() => { if(confirm('确认删除记录？')) onDeleteHistory(record.id); }} className="p-2 text-rose-300 hover:text-rose-600"><i className="fa-solid fa-trash-can"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'mock' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border shadow-sm max-w-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><i className="fa-solid fa-wand-magic-sparkles text-indigo-500"></i> 自定义模拟试卷</h3>
            <div className="space-y-5">
              <select className="w-full bg-gray-50 border-none rounded-xl px-4 py-4 font-bold outline-none" value={mockConfig.bankId} onChange={e => setMockConfig({...mockConfig, bankId: e.target.value, selectedChapters: []})}>
                {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              
              {/* 章节选择器 */}
              {availableChapters.length > 0 && (
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">
                    单元/章节筛选 <span className="text-gray-300">(可选，不选则从全部章节抽题)</span>
                  </label>
                  <div className="bg-gray-50 rounded-2xl p-4 max-h-48 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {availableChapters.map(chapter => (
                        <button
                          key={chapter}
                          onClick={() => {
                            const isSelected = mockConfig.selectedChapters.includes(chapter);
                            setMockConfig({
                              ...mockConfig,
                              selectedChapters: isSelected
                                ? mockConfig.selectedChapters.filter(c => c !== chapter)
                                : [...mockConfig.selectedChapters, chapter]
                            });
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                            mockConfig.selectedChapters.includes(chapter)
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-indigo-300'
                          }`}
                        >
                          {mockConfig.selectedChapters.includes(chapter) && <i className="fa-solid fa-check mr-1"></i>}
                          {chapter}
                        </button>
                      ))}
                    </div>
                    {mockConfig.selectedChapters.length > 0 && (
                      <button
                        onClick={() => setMockConfig({ ...mockConfig, selectedChapters: [] })}
                        className="mt-3 text-xs text-gray-400 hover:text-rose-500 font-bold"
                      >
                        <i className="fa-solid fa-xmark mr-1"></i> 清空选择
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block text-center">单选</label><input type="number" min="0" className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-center font-bold" value={mockConfig.singleCount} onChange={e => setMockConfig({...mockConfig, singleCount: Number(e.target.value)})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase block text-center">多选</label><input type="number" min="0" className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-center font-bold" value={mockConfig.multipleCount} onChange={e => setMockConfig({...mockConfig, multipleCount: Number(e.target.value)})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase block text-center">判断</label><input type="number" min="0" className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-center font-bold" value={mockConfig.judgeCount} onChange={e => setMockConfig({...mockConfig, judgeCount: Number(e.target.value)})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase block text-center">填空</label><input type="number" min="0" className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-center font-bold" value={mockConfig.fillInBlankCount} onChange={e => setMockConfig({...mockConfig, fillInBlankCount: Number(e.target.value)})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase block text-center">简答</label><input type="number" min="0" className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-center font-bold" value={mockConfig.shortAnswerCount} onChange={e => setMockConfig({...mockConfig, shortAnswerCount: Number(e.target.value)})} /></div>
              </div>
              <div className="bg-indigo-50/50 p-4 rounded-2xl flex items-center justify-between border border-indigo-100"><span className="text-sm font-bold text-indigo-600">总分</span><span className="text-2xl font-black text-indigo-600">{totalScore}</span></div>
              <button 
                onClick={async () => {
                  console.log('[Exams] 生成模拟试卷，配置:', mockConfig);
                  
                  // 先加载题目
                  let bankQuestions = [];
                  if (mockConfig.bankId) {
                    console.log('[Exams] 加载题库题目:', mockConfig.bankId);
                    bankQuestions = await store.loadBankQuestions(mockConfig.bankId);
                    console.log('[Exams] 题目加载完成:', bankQuestions.length);
                  }
                  
                  // 根据配置生成题目列表
                  const singles = bankQuestions.filter(q => q.type === QuestionType.SINGLE).sort(() => Math.random() - 0.5).slice(0, mockConfig.singleCount || 0);
                  const multiples = bankQuestions.filter(q => q.type === QuestionType.MULTIPLE).sort(() => Math.random() - 0.5).slice(0, mockConfig.multipleCount || 0);
                  const judges = bankQuestions.filter(q => q.type === QuestionType.JUDGE).sort(() => Math.random() - 0.5).slice(0, mockConfig.judgeCount || 0);
                  const fillInBlanks = bankQuestions.filter(q => q.type === QuestionType.FILL_IN_BLANK).sort(() => Math.random() - 0.5).slice(0, mockConfig.fillInBlankCount || 0);
                  const shortAnswers = bankQuestions.filter(q => q.type === QuestionType.SHORT_ANSWER).sort(() => Math.random() - 0.5).slice(0, mockConfig.shortAnswerCount || 0);
                  
                  const finalQuestions = [...singles, ...multiples, ...judges, ...fillInBlanks, ...shortAnswers];
                  console.log('[Exams] 生成题目列表:', finalQuestions.length);
                  
                  // 传递题目列表
                  onStartMock({ 
                    ...mockConfig, 
                    totalScore, 
                    passScore: Math.floor(totalScore * (passScorePercent / 100)),
                    questions: finalQuestions
                  });
                }} 
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl"
              >
                生成随机模拟试卷
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-gray-400 text-xs uppercase tracking-widest ml-1">模拟考试历史记录</h3>
            <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
               {mockHistory.length > 0 ? (
                 <div className="divide-y divide-gray-50">
                   {mockHistory.map(record => (
                     <div key={record.id} className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${record.isFinished ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}><i className={`fa-solid ${record.isFinished ? 'fa-check-double' : 'fa-hourglass-half'}`}></i></div>
                          <div>
                            <div className="font-bold text-gray-800">{record.examTitle}</div>
                            <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                              <span>得分: <span className="font-black text-gray-600">{record.isFinished ? record.score : '未完成'}</span></span>
                              <span>|</span>
                              <span>{record.submitTime}</span>
                            </div>
                          </div>
                       </div>
                       <div className="flex gap-2">
                         {record.isFinished ? (
                            <>
                              <button onClick={() => onStartMock({ ...record.examConfig, retest: true })} className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-xs font-bold">重考</button>
                              <button onClick={() => { setReviewRecord(record); setView('review_wrong'); }} className="px-4 py-2 bg-white border text-indigo-600 rounded-xl text-xs font-bold">查阅</button>
                            </>
                         ) : (
                            <button 
                              onClick={async () => {
                                console.log('[Exams] 继续考试，记录:', record);
                                console.log('[Exams] orderedQuestionIds:', record.orderedQuestionIds);
                                
                                // 先加载题目
                                const bankId = record.examConfig?.bankId || banks[0]?.id;
                                let bankQuestions = [];
                                if (bankId) {
                                  console.log('[Exams] 加载题库题目:', bankId);
                                  bankQuestions = await store.loadBankQuestions(bankId);
                                  console.log('[Exams] 题目加载完成:', bankQuestions.length);
                                }
                                
                                // 根据 orderedQuestionIds 生成题目列表
                                let finalQuestions = [];
                                if (record.orderedQuestionIds && record.orderedQuestionIds.length > 0) {
                                  finalQuestions = record.orderedQuestionIds
                                    .map((id: string) => bankQuestions.find(q => q.id === id))
                                    .filter(Boolean) as Question[];
                                  console.log('[Exams] 根据 orderedQuestionIds 生成题目:', finalQuestions.length);
                                }
                                
                                onStartMock({ 
                                  config: record.examConfig, 
                                  initialIndex: record.currentIndex, 
                                  existingAnswers: record.userAnswers, 
                                  orderedQuestionIds: record.orderedQuestionIds,
                                  recordId: record.id,
                                  questions: finalQuestions
                                });
                              }} 
                              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100"
                            >
                              继续考试
                            </button>
                         )}
                         <button onClick={() => { if(confirm('确认删除记录？')) onDeleteHistory(record.id); }} className="p-2 text-rose-300 hover:text-rose-600"><i className="fa-solid fa-trash-can"></i></button>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="py-12 text-center text-gray-300"><i className="fa-solid fa-ghost text-3xl mb-2 opacity-20"></i><p className="text-xs font-bold">暂无模拟历史</p></div>
               )}
            </div>
          </div>
        </div>
      )}

      {view === 'history' && (
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden animate-in fade-in duration-300">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b"><tr><th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">考试名称</th><th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">得分</th><th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">用时</th><th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">操作</th></tr></thead>
            <tbody className="divide-y">
              {history.map(record => (
                <tr key={record.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4"><div className="font-bold text-gray-800">{record.examTitle}</div><div className="text-[10px] text-gray-400 uppercase font-black">{record.isFinished ? '已完成' : '进行中'}</div></td>
                  <td className="px-6 py-4"><span className={`font-black text-lg ${record.score >= record.passScore ? 'text-emerald-50' : 'text-rose-500'}`}>{record.isFinished ? record.score : '--'}</span></td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{Math.floor(record.timeUsed / 60)}分</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button onClick={() => { setReviewRecord(record); setView('review_wrong'); }} className="text-indigo-600 font-bold text-xs hover:underline">查阅</button>
                      <button onClick={() => onDeleteHistory(record.id)} className="text-rose-400 hover:text-rose-600"><i className="fa-solid fa-trash-can"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {view === 'review_wrong' && renderWrongReview()}
    </div>
  );
};

export default Exams;
