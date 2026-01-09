
import React, { useState, useMemo, useEffect } from 'react';
import { QuestionBank, Exam, QuestionType, Question, ExamRecord, User } from '../../types';

interface ExamPublisherProps {
  banks: QuestionBank[];
  exams: Exam[];
  allQuestions: Question[];
  examHistory: ExamRecord[];
  students: User[];
  onPublish: (exam: Exam) => void;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

const ExamPublisher: React.FC<ExamPublisherProps> = ({ banks, exams, allQuestions, examHistory, students, onPublish, onUpdate, onDelete, onToggleVisibility }) => {
  const [view, setView] = useState<'list' | 'publish' | 'results'>('list');
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [selectedExamIdForResults, setSelectedExamIdForResults] = useState<string | null>(null);
  const [qSearch, setQSearch] = useState('');
  const [qTypeFilterMan, setQTypeFilterMan] = useState<string>('ALL');
  const [currentPageMan, setCurrentPageMan] = useState(1);
  const pageSizeMan = 20;
  
  const [form, setForm] = useState({
    title: '', 
    bankId: banks[0]?.id || '', 
    duration: 60, 
    strategy: 'RANDOM' as 'RANDOM' | 'MANUAL',
    startTime: '', 
    endTime: '',
    singleCount: 10, 
    multipleCount: 5, 
    judgeCount: 5,
    fillBlankCount: 0,
    shortAnswerCount: 0,
    passScorePercent: 60,
    selectedQuestionIds: [] as string[]
  });

  const selectedBank = useMemo(() => banks.find(b => b.id === form.bankId), [banks, form.bankId]);
  
  const bankQuestions = useMemo(() => 
    allQuestions.filter(q => q.bankId === form.bankId), 
  [allQuestions, form.bankId]);

  const filteredQuestions = useMemo(() => 
    bankQuestions.filter(q => 
      q.content.toLowerCase().includes(qSearch.toLowerCase()) &&
      (qTypeFilterMan === 'ALL' || q.type === qTypeFilterMan)
    ), 
  [bankQuestions, qSearch, qTypeFilterMan]);

  const paginatedQuestionsMan = useMemo(() => 
    filteredQuestions.slice((currentPageMan - 1) * pageSizeMan, currentPageMan * pageSizeMan)
  , [filteredQuestions, currentPageMan]);

  const totalPagesMan = Math.ceil(filteredQuestions.length / pageSizeMan);

  const calculatedTotalScore = useMemo(() => {
    if (!selectedBank) return 0;
    const scores = selectedBank.scoreConfig;
    if (form.strategy === 'MANUAL') {
      return form.selectedQuestionIds.reduce((acc, id) => {
        const q = bankQuestions.find(x => x.id === id);
        if (!q) return acc;
        return acc + (scores[q.type] || 0);
      }, 0);
    }
    return (
      form.singleCount * (scores[QuestionType.SINGLE] || 0) +
      form.multipleCount * (scores[QuestionType.MULTIPLE] || 0) +
      form.judgeCount * (scores[QuestionType.JUDGE] || 0) +
      form.fillBlankCount * (scores[QuestionType.FILL_IN_BLANK] || 0) +
      form.shortAnswerCount * (scores[QuestionType.SHORT_ANSWER] || 0)
    );
  }, [selectedBank, form, bankQuestions]);

  const calculatedPassScore = useMemo(() => 
    Math.floor(calculatedTotalScore * (form.passScorePercent / 100))
  , [calculatedTotalScore, form.passScorePercent]);

  // 获取特定考试的成绩列表
  const examResults = useMemo(() => {
    if (!selectedExamIdForResults) return [];
    return examHistory.filter(h => h.examId === selectedExamIdForResults);
  }, [examHistory, selectedExamIdForResults]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.strategy === 'MANUAL' && form.selectedQuestionIds.length === 0) {
      alert('请至少选择一道题目！');
      return;
    }

    const data = { 
      ...form, 
      status: 'ONGOING', 
      isVisible: true,
      totalScore: calculatedTotalScore,
      passScore: calculatedPassScore
    } as any;

    if (editingExamId) {
      onUpdate(editingExamId, data);
    } else {
      onPublish({ ...data, id: Date.now().toString() });
    }
    
    setView('list');
    setEditingExamId(null);
    resetForm();
  };

  const resetForm = () => {
    setForm({
      title: '', bankId: banks[0]?.id || '', duration: 60, strategy: 'RANDOM',
      startTime: '', endTime: '',
      singleCount: 10, multipleCount: 5, judgeCount: 5,
      fillBlankCount: 0, shortAnswerCount: 0,
      passScorePercent: 60,
      selectedQuestionIds: []
    });
    setQSearch('');
    setQTypeFilterMan('ALL');
    setCurrentPageMan(1);
  };

  const handleEdit = (exam: Exam) => {
    const hasStarted = exam.startTime && new Date(exam.startTime) <= new Date();
    if (hasStarted) {
      alert('该考试已到达开始时间，为了保证考试公平性，禁止修改考试内容。');
      return;
    }
    setEditingExamId(exam.id);
    setForm({
      title: exam.title,
      bankId: exam.bankId,
      duration: exam.duration,
      strategy: exam.strategy,
      startTime: exam.startTime || '',
      endTime: exam.endTime || '',
      singleCount: exam.singleCount || 0,
      multipleCount: exam.multipleCount || 0,
      judgeCount: exam.judgeCount || 0,
      fillBlankCount: exam.fillBlankCount || 0,
      shortAnswerCount: exam.shortAnswerCount || 0,
      passScorePercent: exam.passScorePercent || 60,
      selectedQuestionIds: exam.selectedQuestionIds || []
    });
    setView('publish');
  };

  const toggleQuestion = (id: string) => {
    setForm(prev => ({
      ...prev,
      selectedQuestionIds: prev.selectedQuestionIds.includes(id)
        ? prev.selectedQuestionIds.filter(x => x !== id)
        : [...prev.selectedQuestionIds, id]
    }));
  };

  const handleSelectAllFiltered = () => {
    const currentPageIds = paginatedQuestionsMan.map(q => q.id);
    const areAllPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => form.selectedQuestionIds.includes(id));
    
    if (areAllPageSelected) {
      setForm(prev => ({
        ...prev,
        selectedQuestionIds: prev.selectedQuestionIds.filter(id => !currentPageIds.includes(id))
      }));
    } else {
      setForm(prev => ({
        ...prev,
        selectedQuestionIds: Array.from(new Set([...prev.selectedQuestionIds, ...currentPageIds]))
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-5 rounded-3xl border shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-800">考试发布中心</h2>
          <p className="text-xs text-gray-400 font-medium">定制化在线测评与分值策略管理</p>
        </div>
        {view === 'list' ? (
          <button onClick={() => { setEditingExamId(null); resetForm(); setView('publish'); }} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg text-sm active:scale-95 transition-all"><i className="fa-solid fa-plus mr-2"></i> 发布新考试</button>
        ) : (
          <button onClick={() => { setView('list'); setEditingExamId(null); setSelectedExamIdForResults(null); resetForm(); }} className="text-gray-500 font-bold text-sm flex items-center gap-2 hover:text-indigo-600 transition-colors">
            <i className="fa-solid fa-arrow-left"></i> 取消并返回列表
          </button>
        )}
      </div>

      {view === 'results' ? (
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div className="p-6 bg-gray-50/50 border-b flex justify-between items-center">
            <div>
               <h3 className="text-lg font-black text-gray-800">考试成绩明细：{exams.find(e => e.id === selectedExamIdForResults)?.title}</h3>
               <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">共 {examResults.length} 名学员参加</p>
            </div>
            <button onClick={() => { setView('list'); setSelectedExamIdForResults(null); }} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50">返回列表</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-4">学员姓名 / 账号</th>
                  <th className="px-6 py-4">交卷时间</th>
                  <th className="px-6 py-4">得分</th>
                  <th className="px-6 py-4">结果</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {examResults.map(record => {
                  const student = students.find(s => s.id === record.userId);
                  const isPassed = record.score >= record.passScore;
                  return (
                    <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{student?.realName || '未知学员'}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{student?.phone || '--'}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-gray-500">{record.submitTime}</td>
                      <td className="px-6 py-4">
                        <div className={`text-lg font-black ${record.score === -1 ? 'text-gray-300' : (isPassed ? 'text-emerald-600' : 'text-rose-600')}`}>
                          {record.score === -1 ? '正在考试' : record.score}
                          {record.score !== -1 && <span className="text-[10px] text-gray-300 font-bold ml-1">/ {record.totalScore}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {record.score !== -1 && (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            isPassed ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            {isPassed ? '及格' : '不及格'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {examResults.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-200">
                        <i className="fa-solid fa-ghost text-2xl"></i>
                      </div>
                      <p className="text-sm font-bold text-gray-300 italic">暂无参加记录</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : view === 'list' ? (
        <div className="grid gap-4">
          {exams.length > 0 ? (
            exams.map(e => {
              const hasStarted = e.startTime && new Date(e.startTime) <= new Date();
              return (
                <div key={e.id} className="bg-white p-6 rounded-3xl border flex flex-col md:flex-row justify-between items-center group shadow-sm hover:shadow-md transition-all gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm ${e.isVisible ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-300'}`}>
                      <i className="fa-solid fa-file-invoice"></i>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => { setSelectedExamIdForResults(e.id); setView('results'); }}
                          className="font-black text-lg text-gray-900 leading-none hover:text-indigo-600 transition-colors text-left"
                        >
                          {e.title}
                        </button>
                        {e.isVisible ? (
                          <span className="bg-emerald-50 text-emerald-600 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-emerald-100">正在显示</span>
                        ) : (
                          <span className="bg-gray-50 text-gray-400 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-gray-100">已隐藏</span>
                        )}
                        {hasStarted && (
                          <span className="bg-rose-50 text-rose-600 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-rose-100">已开考</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 font-medium flex flex-wrap gap-4 mt-2">
                        <span><i className="fa-regular fa-clock mr-1 text-indigo-400"></i> {e.duration}分钟</span>
                        <span><i className="fa-solid fa-star mr-1 text-indigo-400"></i> 总分 {e.totalScore}</span>
                        <span><i className="fa-solid fa-calendar mr-1 text-indigo-400"></i> 有效期: {e.startTime ? e.startTime.replace('T', ' ') : '即刻'} ~ {e.endTime ? e.endTime.replace('T', ' ') : '永久'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={() => onToggleVisibility(e.id)} className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs font-black transition-all border-2 ${e.isVisible ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'}`}>
                       {e.isVisible ? '点击隐藏' : '点击发布'}
                    </button>
                    <button 
                      onClick={() => handleEdit(e)} 
                      disabled={!!hasStarted}
                      title={hasStarted ? "开考后无法编辑内容" : ""}
                      className={`flex-1 md:flex-none px-4 py-2.5 border-2 rounded-xl text-xs font-black transition-all ${
                        hasStarted 
                          ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' 
                          : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50 active:scale-95'
                      }`}
                    >
                      编辑
                    </button>
                    <button onClick={() => onDelete(e.id)} className="flex-1 md:flex-none p-2.5 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 text-center space-y-5">
              <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center text-4xl">
                <i className="fa-solid fa-paper-plane"></i>
              </div>
              <h3 className="text-xl font-black text-gray-800">未发布考试</h3>
              <button onClick={() => { setEditingExamId(null); resetForm(); setView('publish'); }} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl">开启发布流程</button>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border shadow-sm max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">考试标题</label>
                <input required className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-indigo-50 transition-all" placeholder="例如：2024秋季考核" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">关联题库</label>
                  <select className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold outline-none" value={form.bankId} onChange={e => {
                    setForm({...form, bankId: e.target.value, selectedQuestionIds: []});
                    setCurrentPageMan(1);
                  }}>
                    {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">考试时长 (分钟)</label>
                  <input type="number" required className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold outline-none" value={form.duration} onChange={e => setForm({...form, duration: Number(e.target.value)})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">开始日期</label>
                  <input type="datetime-local" className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 font-bold outline-none text-xs" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">结束日期</label>
                  <input type="datetime-local" className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 font-bold outline-none text-xs" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">组卷策略</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setForm({...form, strategy: 'RANDOM'})} className={`flex-1 py-3 rounded-2xl font-black text-sm border-2 ${form.strategy === 'RANDOM' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-400 border-gray-50'}`}>随机组卷</button>
                  <button type="button" onClick={() => setForm({...form, strategy: 'MANUAL'})} className={`flex-1 py-3 rounded-2xl font-black text-sm border-2 ${form.strategy === 'MANUAL' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-400 border-gray-50'}`}>人工选题</button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">及格线阈值 ({form.passScorePercent}%)</label>
                <input type="range" min="0" max="100" step="5" className="w-full h-2 bg-indigo-50 rounded-lg appearance-none cursor-pointer accent-indigo-600" value={form.passScorePercent} onChange={e => setForm({...form, passScorePercent: Number(e.target.value)})} />
                <div className="flex justify-between text-[10px] font-black text-gray-300 px-1">
                  <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                </div>
              </div>

              <div className="bg-indigo-900/5 p-6 rounded-[2rem] border border-indigo-100/50 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-500">试卷总分：</span>
                  <span className="text-2xl font-black text-indigo-600">{calculatedTotalScore} 分</span>
                </div>
                <div className="flex justify-between items-center border-t border-indigo-100 pt-4">
                  <span className="text-sm font-bold text-gray-500">及格分数线：</span>
                  <span className="text-xl font-black text-emerald-600">{calculatedPassScore} 分</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col h-full border-l border-gray-50 pl-8">
              {form.strategy === 'RANDOM' ? (
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">设定随机抽题数</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-600">单选题</span>
                      <input type="number" min="0" className="w-20 bg-gray-50 py-2 text-center rounded-xl font-black" value={form.singleCount} onChange={e => setForm({...form, singleCount: Number(e.target.value)})} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-600">多选题</span>
                      <input type="number" min="0" className="w-20 bg-gray-50 py-2 text-center rounded-xl font-black" value={form.multipleCount} onChange={e => setForm({...form, multipleCount: Number(e.target.value)})} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-600">判断题</span>
                      <input type="number" min="0" className="w-20 bg-gray-50 py-2 text-center rounded-xl font-black" value={form.judgeCount} onChange={e => setForm({...form, judgeCount: Number(e.target.value)})} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-600">填空题</span>
                      <input type="number" min="0" className="w-20 bg-gray-50 py-2 text-center rounded-xl font-black" value={form.fillBlankCount} onChange={e => setForm({...form, fillBlankCount: Number(e.target.value)})} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-600">简答题</span>
                      <input type="number" min="0" className="w-20 bg-gray-50 py-2 text-center rounded-xl font-black" value={form.shortAnswerCount} onChange={e => setForm({...form, shortAnswerCount: Number(e.target.value)})} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">选择试题 ({form.selectedQuestionIds.length} 题)</h4>
                      <button 
                        type="button" 
                        onClick={handleSelectAllFiltered} 
                        className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        {paginatedQuestionsMan.length > 0 && paginatedQuestionsMan.every(q => form.selectedQuestionIds.includes(q.id)) ? '取消本页' : '全选本页'}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <select 
                        className="text-[10px] bg-gray-50 px-2 py-1.5 rounded-xl border-none outline-none font-bold shrink-0" 
                        value={qTypeFilterMan} 
                        onChange={e => { setQTypeFilterMan(e.target.value); setCurrentPageMan(1); }}
                      >
                        <option value="ALL">全部题型</option>
                        <option value={QuestionType.SINGLE}>单选</option>
                        <option value={QuestionType.MULTIPLE}>多选</option>
                        <option value={QuestionType.JUDGE}>判断</option>
                        <option value={QuestionType.FILL_IN_BLANK}>填空</option>
                        <option value={QuestionType.SHORT_ANSWER}>简答</option>
                      </select>
                      <input 
                        className="flex-1 text-[10px] bg-gray-50 px-3 py-1.5 rounded-xl border-none outline-none font-bold" 
                        placeholder="搜索题目内容..." 
                        value={qSearch} 
                        onChange={e => { setQSearch(e.target.value); setCurrentPageMan(1); }} 
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar border-y py-4">
                    {paginatedQuestionsMan.map(q => {
                      const active = form.selectedQuestionIds.includes(q.id);
                      return (
                        <div key={q.id} onClick={() => toggleQuestion(q.id)} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex gap-3 ${active ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-50 grayscale opacity-60 hover:grayscale-0 hover:opacity-100'}`}>
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-1 border ${active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-transparent'}`}><i className="fa-solid fa-check text-[10px]"></i></div>
                          <div>
                            <div className="text-[9px] font-black text-indigo-400 uppercase">{q.type}</div>
                            <div className="text-xs font-bold text-gray-800 line-clamp-2">{q.content}</div>
                          </div>
                        </div>
                      );
                    })}
                    {filteredQuestions.length === 0 && (
                      <div className="py-10 text-center text-gray-300 text-xs italic">未找到匹配试题</div>
                    )}
                  </div>

                  {totalPagesMan > 1 && (
                    <div className="flex items-center justify-between px-1 pt-2 shrink-0">
                      <div className="text-[10px] font-bold text-gray-400">{filteredQuestions.length} 题 · {currentPageMan}/{totalPagesMan} 页</div>
                      <div className="flex gap-1">
                        <button 
                          type="button"
                          disabled={currentPageMan === 1}
                          onClick={() => setCurrentPageMan(p => p - 1)}
                          className="w-8 h-8 rounded-lg bg-gray-50 border flex items-center justify-center text-gray-400 disabled:opacity-30"
                        >
                          <i className="fa-solid fa-chevron-left text-[10px]"></i>
                        </button>
                        <button 
                          type="button"
                          disabled={currentPageMan === totalPagesMan}
                          onClick={() => setCurrentPageMan(p => p + 1)}
                          className="w-8 h-8 rounded-lg bg-gray-50 border flex items-center justify-center text-gray-400 disabled:opacity-30"
                        >
                          <i className="fa-solid fa-chevron-right text-[10px]"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-dashed">
            <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black shadow-2xl hover:bg-indigo-700 transition-all text-xl">
              {editingExamId ? '保存更改' : '立即发布考试'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ExamPublisher;
