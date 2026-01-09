
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { QuestionBank, QuestionType, Question, Tag } from '../../types';
import TagSelector from '../../components/TagSelector';
import { useAppStore } from '../../store';

interface BankManagerProps {
  banks: QuestionBank[];
  allQuestions: Question[];
  onAdd: (bank: any) => void;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  onUpdateScore: (bankId: string, config: any) => void;
  onAddQuestion: (q: Question) => void;
  onUpdateQuestion: (id: string, data: Partial<Question>) => void;
  onDeleteQuestion: (id: string) => void;
  onDeleteQuestions: (bankId: string, ids: string[]) => void;
  onImportQuestions: (bankId: string, qs: Question[]) => void;
}

const BankManager: React.FC<BankManagerProps> = ({ 
  banks, allQuestions, onAdd, onUpdate, onDelete, onUpdateScore,
  onAddQuestion, onUpdateQuestion, onDeleteQuestion, onDeleteQuestions, onImportQuestions
}) => {
  const store = useAppStore();
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
  const [bankForm, setBankForm] = useState<any>({ name: '', category: '', level: '初级', description: '' });
  const [scoreForm, setScoreForm] = useState<any>({});

  const [qSearch, setQSearch] = useState('');
  const [qTypeFilter, setQTypeFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 20;

  const [duplicateIds, setDuplicateIds] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  
  // 加载所有标签
  const [allTags, setAllTags] = useState<Tag[]>([]);
  
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await store.fetchTags();
        setAllTags(tags);
      } catch (error) {
        console.error('[BankManager] 加载标签失败:', error);
      }
    };
    loadTags();
  }, []);
  
  // 根据 tagId 查找标签对象
  const getTagById = (tagId: string) => {
    return allTags.find(tag => tag.id === tagId);
  };

  const editingBank = useMemo(() => banks.find(b => b.id === editingBankId) || null, [banks, editingBankId]);
  const bankQuestions = useMemo(() => editingBankId ? allQuestions.filter(q => q.bankId === editingBankId) : [], [allQuestions, editingBankId]);
  const filteredQuestions = useMemo(() => bankQuestions.filter(q => (qTypeFilter === 'ALL' || q.type === qTypeFilter) && q.content.toLowerCase().includes(qSearch.toLowerCase())), [bankQuestions, qSearch, qTypeFilter]);
  
  const totalPages = Math.ceil(filteredQuestions.length / pageSize);
  const paginatedQuestions = useMemo(() => filteredQuestions.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filteredQuestions, currentPage]);

  const handleBankSave = () => {
    if (!bankForm.name) return alert('请填写题库名称');
    
    if (editingBankId) {
      onUpdate(editingBankId, bankForm);
    } else {
      onAdd({
        ...bankForm,
        id: 'bank-' + Date.now(),
        questionCount: 0,
        scoreConfig: { 
          [QuestionType.SINGLE]: 2, 
          [QuestionType.MULTIPLE]: 4, 
          [QuestionType.JUDGE]: 1,
          [QuestionType.FILL_IN_BLANK]: 3,
          [QuestionType.SHORT_ANSWER]: 5
        }
      });
    }
    setIsBankModalOpen(false);
  };

  const handleQuestionSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBankId || !editingQuestion) return;
    if (!editingQuestion.content) return alert('请填写题目内容');

    const finalQuestion = { ...editingQuestion };
    
    // 判断题：固定选项
    if (finalQuestion.type === QuestionType.JUDGE) {
      finalQuestion.options = ['正确', '错误'];
    }
    
    // 填空题：验证配置
    if (finalQuestion.type === QuestionType.FILL_IN_BLANK) {
      if (!finalQuestion.blanks || finalQuestion.blanks.length === 0) {
        return alert('填空题至少需要配置一个空白');
      }
      // 验证每个空白都有答案
      for (const blank of finalQuestion.blanks) {
        if (!blank.acceptedAnswers || blank.acceptedAnswers.length === 0) {
          return alert(`空白 ${blank.id} 至少需要一个可接受的答案`);
        }
      }
      // 清空不需要的字段
      finalQuestion.options = [];
      finalQuestion.answer = '';
    }
    
    // 简答题：验证参考答案
    if (finalQuestion.type === QuestionType.SHORT_ANSWER) {
      if (!finalQuestion.referenceAnswer || finalQuestion.referenceAnswer.trim() === '') {
        return alert('简答题需要填写参考答案');
      }
      // 清空不需要的字段
      finalQuestion.options = [];
      finalQuestion.answer = '';
    }

    try {
      if (finalQuestion.id) {
        await onUpdateQuestion(finalQuestion.id, finalQuestion);
      } else {
        const res = await onAddQuestion({ 
          ...finalQuestion,
          id: 'q-' + Date.now(), 
          bankId: editingBankId,
        } as Question);
        // Optionally we could do something with res.question or res.id here
      }
      // wait a tick for store refresh to propagate
      await new Promise(r => setTimeout(r, 100));
    } catch (err: any) {
      alert('保存题目失败：' + (err?.message || err));
    }

    setIsQuestionModalOpen(false);
    setDuplicateIds([]);
  };

  const handleCheckDuplicates = () => {
    setIsChecking(true);
    setTimeout(() => {
      const seen = new Map<string, string>(); 
      const toDelete: string[] = [];

      bankQuestions.forEach(q => {
        const key = `${q.content.trim().toLowerCase()}_${q.type}`;
        if (seen.has(key)) {
          toDelete.push(q.id);
        } else {
          seen.set(key, q.id);
        }
      });

      setDuplicateIds(toDelete);
      setIsChecking(false);
      if (toDelete.length === 0) alert('当前题库未发现重复题目！');
    }, 800);
  };

  const handleClearDuplicates = async () => {
    if (duplicateIds.length === 0) return;
    if (confirm(`检测到 ${duplicateIds.length} 道重复项，确定清理吗？`)) {
      await onDeleteQuestions(editingBankId!, duplicateIds);
      setDuplicateIds([]);
      alert('清理完成');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingBankId) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      const newQs: Question[] = [];
      const errors: string[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        try {
          // 使用正则表达式解析CSV，支持引号包裹的字段
          const regex = /("([^"]*)"|([^,]+))/g;
          const parts: string[] = [];
          let match;
          
          while ((match = regex.exec(line)) !== null) {
            // 如果是引号包裹的内容，取group 2，否则取group 3
            parts.push((match[2] !== undefined ? match[2] : match[3]).trim());
          }
          
          if (parts.length < 4) {
            errors.push(`第${i+1}行：字段不足（至少需要4个字段）`);
            continue;
          }
          
          const [typeStr, content, optionsStr, answer, explanation = ''] = parts;
          const type = typeStr.toUpperCase() as QuestionType;
          
          // 验证题型
          if (![QuestionType.SINGLE, QuestionType.MULTIPLE, QuestionType.JUDGE].includes(type)) {
            errors.push(`第${i+1}行：题型无效（${typeStr}），应为SINGLE/MULTIPLE/JUDGE`);
            continue;
          }
          
          // 验证题干
          if (!content || content.trim() === '') {
            errors.push(`第${i+1}行：题干不能为空`);
            continue;
          }
          
          // 处理选项
          let options: string[] = [];
          if (type === QuestionType.JUDGE) {
            options = ['正确', '错误'];
          } else {
            options = optionsStr ? optionsStr.split('|').map(o => o.trim()).filter(o => o) : [];
            if (options.length < 2) {
              errors.push(`第${i+1}行：选择题至少需要2个选项`);
              continue;
            }
            if (options.length > 8) {
              errors.push(`第${i+1}行：选项数量不能超过8个`);
              continue;
            }
          }
          
          // 验证答案
          if (!answer || answer.trim() === '') {
            errors.push(`第${i+1}行：答案不能为空`);
            continue;
          }
          
          const answerUpper = answer.toUpperCase().trim();
          let finalAnswer: string | string[];
          
          if (type === QuestionType.MULTIPLE) {
            finalAnswer = answerUpper.split('').filter(a => /^[A-Z]$/.test(a));
            if (finalAnswer.length === 0) {
              errors.push(`第${i+1}行：多选题答案格式错误（如：ABC）`);
              continue;
            }
            // 验证答案选项是否在范围内
            const maxOption = String.fromCharCode(65 + options.length - 1);
            if (finalAnswer.some(a => a > maxOption)) {
              errors.push(`第${i+1}行：答案超出选项范围（最大为${maxOption}）`);
              continue;
            }
          } else {
            finalAnswer = answerUpper;
            if (type === QuestionType.JUDGE) {
              if (!['A', 'B'].includes(finalAnswer)) {
                errors.push(`第${i+1}行：判断题答案应为A（正确）或B（错误）`);
                continue;
              }
            } else {
              // 单选题
              if (!/^[A-Z]$/.test(finalAnswer)) {
                errors.push(`第${i+1}行：单选题答案格式错误（如：A）`);
                continue;
              }
              const maxOption = String.fromCharCode(65 + options.length - 1);
              if (finalAnswer > maxOption) {
                errors.push(`第${i+1}行：答案超出选项范围（最大为${maxOption}）`);
                continue;
              }
            }
          }

          newQs.push({
            id: `q-imp-${Date.now()}-${i}`,
            bankId: editingBankId,
            type: type,
            content: content.trim(),
            options: options,
            answer: finalAnswer,
            explanation: explanation.trim()
          });
        } catch (err: any) {
          errors.push(`第${i+1}行：解析失败 - ${err.message}`);
        }
      }
      
      // 显示导入结果
      if (errors.length > 0) {
        const errorMsg = `导入完成，但有 ${errors.length} 条错误：\n\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? '\n...(更多错误已省略)' : ''}`;
        if (newQs.length === 0) {
          alert('导入失败！\n\n' + errorMsg);
          return;
        } else {
          if (!confirm(`发现 ${errors.length} 条错误，成功解析 ${newQs.length} 题。\n\n是否继续导入有效题目？\n\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`)) {
            return;
          }
        }
      }
      
      if (newQs.length > 0) {
        try {
          const res = await onImportQuestions(editingBankId, newQs as Question[]);
          const inserted = res?.inserted ?? newQs.length;
          alert(`✓ 成功导入 ${inserted} 题${errors.length > 0 ? `\n✗ 跳过 ${errors.length} 条错误` : ''}`);
          setIsImportModalOpen(false);
        } catch (err: any) {
          alert('导入失败：' + (err?.message || err));
        }
      }
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const downloadTemplate = () => {
    const headers = '题型(SINGLE/MULTIPLE/JUDGE),题干,选项(用|分隔;判断题可留空),答案(如A或ABC),解析\n';
    const example1 = 'SINGLE,下列哪个协议用于加密网页传输？,HTTP|FTP|HTTPS|SMTP,C,HTTPS是HTTP的安全版本\n';
    const example2 = 'JUDGE,防火墙主要用于监控和过滤进出网络的数据包。,,A,防火墙是网络安全的第一道防线\n';
    const example3 = 'MULTIPLE,发现账号被盗应采取哪些措施？(多选),立即修改密码|通知银行|告知好友|举报异常,ABCD,这些都是减少损失的重要步骤\n';
    const example4 = 'MULTIPLE,"以下哪些是常见的网络攻击方式？（多选，题干中可以包含逗号、引号等特殊字符）",DDoS攻击|SQL注入|XSS跨站脚本|钓鱼攻击|中间人攻击|暴力破解,ABCDEF,"这些都是常见攻击方式，需要采取相应防护措施"\n';
    const example5 = 'SINGLE,"在OSI七层模型中，负责端到端通信的是哪一层？",物理层|数据链路层|网络层|传输层|会话层|表示层|应用层,D,传输层负责端到端的可靠数据传输\n';
    
    const instructions = '\n# 导入说明：\n' +
      '# 1. 题型：SINGLE(单选) / MULTIPLE(多选) / JUDGE(判断)\n' +
      '# 2. 题干：如包含逗号或引号，请用英文双引号包裹整个题干\n' +
      '# 3. 选项：用竖线|分隔，支持2-8个选项；判断题可留空\n' +
      '# 4. 答案：单选填A/B/C等，多选填ABC等（无需分隔），判断题A=正确/B=错误\n' +
      '# 5. 解析：选填，如包含逗号请用双引号包裹\n' +
      '# 6. 特殊字符：题干或解析中如有逗号、引号等，请用双引号包裹该字段\n\n';
    
    const blob = new Blob([`\uFEFF${instructions}${headers}${example1}${example2}${example3}${example4}${example5}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "题目导入模板.csv";
    link.click();
  };

  return (
    <div className="space-y-6">
      {view === 'list' ? (
        <>
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-gray-800">题库管理</h2>
              <p className="text-xs text-gray-400 font-medium">资源分类展示与快捷分值设定</p>
            </div>
            <button onClick={() => { setEditingBankId(null); setBankForm({ name: '', category: '', level: '初级', description: '' }); setIsBankModalOpen(true); }} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95">创建新题库</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banks.map(bank => (
              <div key={bank.id} className="bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-xl font-black">{bank.name[0]}</div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { 
                        setEditingBankId(bank.id); 
                        setBankForm({ 
                          name: bank.name, 
                          category: bank.category, 
                          level: bank.level, 
                          description: bank.description 
                        }); 
                        setIsBankModalOpen(true); 
                      }} 
                      className="p-1.5 text-gray-300 hover:text-indigo-600 transition-colors" 
                      title="编辑题库信息"
                    >
                      <i className="fa-solid fa-pen-to-square text-sm"></i>
                    </button>
                    <button onClick={() => { setEditingBankId(bank.id); setScoreForm(bank.scoreConfig); setIsScoreModalOpen(true); }} className="text-[10px] font-black px-3 py-1.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 uppercase hover:bg-amber-100 transition-colors">分值配置</button>
                    <button onClick={() => { if(confirm('确定删除该题库及内部所有题目吗？')) onDelete(bank.id); }} className="p-1.5 text-gray-300 hover:text-rose-500 transition-colors"><i className="fa-solid fa-trash-can text-sm"></i></button>
                  </div>
                </div>
                <h3 className="font-black text-gray-800 text-lg mb-2">{bank.name}</h3>
                <div className="flex gap-2 mb-3">
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg font-bold">{bank.category || '未分类'}</span>
                  <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-1 rounded-lg font-bold">{bank.level || '初级'}</span>
                </div>
                {bank.description && (
                  <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{bank.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-[10px] bg-gray-50 px-2 py-0.5 rounded text-gray-400 font-bold">单选:{bank.scoreConfig?.[QuestionType.SINGLE]}分</span>
                  <span className="text-[10px] bg-gray-50 px-2 py-0.5 rounded text-gray-400 font-bold">多选:{bank.scoreConfig?.[QuestionType.MULTIPLE]}分</span>
                  <span className="text-[10px] bg-gray-50 px-2 py-0.5 rounded text-gray-400 font-bold">判断:{bank.scoreConfig?.[QuestionType.JUDGE]}分</span>
                  <span className="text-[10px] bg-gray-50 px-2 py-0.5 rounded text-gray-400 font-bold">填空:{bank.scoreConfig?.[QuestionType.FILL_IN_BLANK] || 3}分</span>
                  <span className="text-[10px] bg-gray-50 px-2 py-0.5 rounded text-gray-400 font-bold">简答:{bank.scoreConfig?.[QuestionType.SHORT_ANSWER] || 5}分</span>
                </div>
                <div className="mt-auto flex justify-between items-center border-t border-dashed pt-5">
                  <div className="text-center">
                    <div className="text-xl font-black text-indigo-600">{bank.questionCount}</div>
                    <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">总题目数</div>
                  </div>
                  <button onClick={() => { setEditingBankId(bank.id); setView('editor'); setCurrentPage(1); }} className="bg-gray-900 text-white px-6 py-2.5 rounded-2xl text-xs font-black hover:bg-black active:scale-95 transition-all">内容管理 &rarr;</button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-3xl border shadow-sm gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <button onClick={() => { setView('list'); setDuplicateIds([]); }} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors active:scale-90"><i className="fa-solid fa-arrow-left"></i></button>
              <h2 className="text-lg font-black truncate max-w-[250px]">{editingBank?.name}</h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-2xl border mr-2">
                 {duplicateIds.length > 0 ? (
                   <div className="flex items-center gap-2 px-3">
                      <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 animate-pulse">发现 {duplicateIds.length} 个重复项</span>
                      <button onClick={handleClearDuplicates} className="bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-rose-100 hover:bg-rose-700">清理</button>
                   </div>
                 ) : (
                   <button onClick={handleCheckDuplicates} disabled={isChecking} className="text-gray-500 hover:text-indigo-600 px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2">
                     {isChecking ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-shield-halved"></i>}
                     查重
                   </button>
                 )}
              </div>
              <button onClick={() => setIsImportModalOpen(true)} className="bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-sm active:scale-95 transition-all">批量导入</button>
              <button onClick={() => { 
                setEditingQuestion({ 
                  type: QuestionType.SINGLE, 
                  options: ['', '', '', ''], 
                  answer: 'A', 
                  content: '',
                  blanks: [],
                  referenceAnswer: '',
                  aiGradingEnabled: false,
                  tags: []
                }); 
                setIsQuestionModalOpen(true); 
              }} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg">新增题目</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <aside className="bg-white p-6 rounded-3xl border shadow-sm h-fit space-y-4">
               <input className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border-none outline-none focus:ring-2 focus:ring-indigo-100 font-bold" placeholder="搜索关键词..." value={qSearch} onChange={e => { setQSearch(e.target.value); setCurrentPage(1); }} />
               <select className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-black border-none" value={qTypeFilter} onChange={e => { setQTypeFilter(e.target.value); setCurrentPage(1); }}>
                 <option value="ALL">全部题型</option>
                 <option value={QuestionType.SINGLE}>单选题</option>
                 <option value={QuestionType.MULTIPLE}>多选题</option>
                 <option value={QuestionType.JUDGE}>判断题</option>
                 <option value={QuestionType.FILL_IN_BLANK}>填空题</option>
                 <option value={QuestionType.SHORT_ANSWER}>简答题</option>
               </select>
            </aside>
            <div className="md:col-span-3 flex flex-col space-y-4">
              <div className="bg-white rounded-3xl border shadow-sm divide-y overflow-hidden">
                {paginatedQuestions.map((q, i) => {
                  const isDup = duplicateIds.includes(q.id);
                  return (
                    <div key={q.id} className={`p-6 transition-all flex justify-between group ${isDup ? 'bg-rose-50/40 border-l-4 border-l-rose-500' : 'hover:bg-gray-50/50'}`}>
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-indigo-600 text-white px-2 py-0.5 rounded font-black">#{(currentPage-1)*pageSize+i+1}</span>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{q.type}</span>
                          {isDup && <span className="text-[9px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded border border-rose-200">重复标记</span>}
                          {q.type === QuestionType.FILL_IN_BLANK && q.blanks && (
                            <span className="text-[9px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded border border-amber-200">{q.blanks.length}个空白</span>
                          )}
                          {q.type === QuestionType.SHORT_ANSWER && q.aiGradingEnabled && (
                            <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded border border-emerald-200">AI评分</span>
                          )}
                        </div>
                        <h4 className="font-bold text-gray-800 leading-relaxed">{q.content}</h4>
                        {q.type !== QuestionType.FILL_IN_BLANK && q.type !== QuestionType.SHORT_ANSWER && (
                          <div className="flex flex-wrap gap-2">
                            {q.options.map((opt, idx) => (
                              <span key={idx} className="text-[10px] bg-white border border-gray-100 px-2 py-1 rounded-lg text-gray-500 font-medium">{String.fromCharCode(65+idx)}. {opt}</span>
                            ))}
                          </div>
                        )}
                        {q.type === QuestionType.FILL_IN_BLANK && q.blanks && (
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">空白答案：</span>
                            {q.blanks.map((blank, idx) => (
                              <span key={blank.id} className="ml-2">
                                {blank.id}: {blank.acceptedAnswers.slice(0, 2).join(', ')}
                                {blank.acceptedAnswers.length > 2 && '...'}
                              </span>
                            ))}
                          </div>
                        )}
                        {q.type === QuestionType.SHORT_ANSWER && q.referenceAnswer && (
                          <div className="text-xs text-gray-500 line-clamp-2">
                            <span className="font-medium">参考答案：</span>
                            {q.referenceAnswer}
                          </div>
                        )}
                        {/* 标签显示 */}
                        {q.tags && q.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {q.tags.slice(0, 5).map((tagId, idx) => {
                              const tag = getTagById(tagId);
                              return tag ? (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold text-white"
                                  style={{ backgroundColor: tag.color || '#6366f1' }}
                                >
                                  <i className="fa-solid fa-tag text-[8px] mr-1"></i>
                                  {tag.name}
                                </span>
                              ) : (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-400"
                                >
                                  <i className="fa-solid fa-tag text-[8px] mr-1"></i>
                                  {tagId}
                                </span>
                              );
                            })}
                            {q.tags.length > 5 && (
                              <span className="text-[10px] text-gray-400 font-medium">+{q.tags.length - 5}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity self-start ml-4">
                        <button onClick={() => { setEditingQuestion(q); setIsQuestionModalOpen(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><i className="fa-solid fa-pen-to-square"></i></button>
                        <button onClick={() => onDeleteQuestion(q.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><i className="fa-solid fa-trash-can"></i></button>
                      </div>
                    </div>
                  );
                })}
                {paginatedQuestions.length === 0 && (
                  <div className="py-20 text-center text-gray-300 italic">暂无题目内容</div>
                )}
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-bold text-gray-400">共 {filteredQuestions.length} 题，第 {currentPage} / {totalPages} 页</span>
                  <div className="flex gap-2">
                    <button 
                      disabled={currentPage === 1} 
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-gray-400 disabled:opacity-30"
                    >
                      <i className="fa-solid fa-chevron-left"></i>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) < 2)
                      .map((p, i, arr) => {
                        const showDots = i > 0 && p - arr[i-1] > 1;
                        return (
                          <React.Fragment key={p}>
                            {showDots && <span className="text-gray-300 self-center px-1">...</span>}
                            <button 
                              onClick={() => setCurrentPage(p)}
                              className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === p ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border text-gray-500 hover:bg-gray-50'}`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}
                    <button 
                      disabled={currentPage === totalPages} 
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-gray-400 disabled:opacity-30"
                    >
                      <i className="fa-solid fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isBankModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 animate-in zoom-in-95 duration-200 shadow-2xl">
            <h3 className="text-2xl font-black mb-6">{editingBankId ? '修改题库信息' : '创建新题库'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">题库名称</label>
                <input className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold outline-none" value={bankForm.name} onChange={e => setBankForm({...bankForm, name: e.target.value})} placeholder="例如：2024网络安全基础" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">所属分类</label>
                  <input className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold outline-none" value={bankForm.category} onChange={e => setBankForm({...bankForm, category: e.target.value})} placeholder="例如：IT技术" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">等级</label>
                  <input className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold outline-none" value={bankForm.level || ''} onChange={e => setBankForm({...bankForm, level: e.target.value})} placeholder="例如：初级" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">题库描述</label>
                <textarea className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold outline-none h-24" value={bankForm.description} onChange={e => setBankForm({...bankForm, description: e.target.value})} placeholder="简要介绍题库考核范围..." />
              </div>
            </div>
            <div className="flex gap-4 pt-8">
              <button onClick={() => setIsBankModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black">取消</button>
              <button onClick={handleBankSave} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">确认保存</button>
            </div>
          </div>
        </div>
      )}

      {isQuestionModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleQuestionSave} className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 animate-in zoom-in-95 duration-200 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-black mb-6">{editingQuestion?.id ? '编辑题目' : '新增题目'}</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">题目类型</label>
                  <select className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold outline-none" value={editingQuestion?.type} onChange={e => setEditingQuestion({...editingQuestion, type: e.target.value as QuestionType})}>
                    <option value={QuestionType.SINGLE}>单选题</option>
                    <option value={QuestionType.MULTIPLE}>多选题</option>
                    <option value={QuestionType.JUDGE}>判断题</option>
                    <option value={QuestionType.FILL_IN_BLANK}>填空题</option>
                    <option value={QuestionType.SHORT_ANSWER}>简答题</option>
                  </select>
                </div>
                {editingQuestion?.type !== QuestionType.FILL_IN_BLANK && editingQuestion?.type !== QuestionType.SHORT_ANSWER && (
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">正确答案</label>
                    <input 
                      className="w-full bg-indigo-50 text-indigo-600 border-none rounded-2xl px-5 py-3.5 font-black outline-none" 
                      placeholder={editingQuestion?.type === QuestionType.JUDGE ? "A(正确) 或 B(错误)" : "如: A 或 ABC"} 
                      value={Array.isArray(editingQuestion?.answer) ? editingQuestion?.answer.join('') : editingQuestion?.answer} 
                      onChange={e => {
                        const val = e.target.value.toUpperCase();
                        setEditingQuestion({
                          ...editingQuestion, 
                          answer: editingQuestion?.type === QuestionType.MULTIPLE ? val.split('') : val
                        });
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">题目正文</label>
                <textarea required className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none h-24" value={editingQuestion?.content} onChange={e => setEditingQuestion({...editingQuestion, content: e.target.value})} placeholder="输入题目内容..." />
              </div>

              {/* 填空题配置 */}
              {editingQuestion?.type === QuestionType.FILL_IN_BLANK && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">
                      填空配置
                      <span className="text-gray-300 ml-2 normal-case font-medium">在题干中使用 {'{{'} blank1 {'}}'}, {'{{'} blank2 {'}}'} 等标记空白位置</span>
                    </label>
                    {editingQuestion?.blanks?.map((blank, idx) => (
                      <div key={blank.id} className="bg-gray-50 rounded-2xl p-4 mb-3">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-black text-indigo-600">空白 #{idx + 1} ({blank.id})</span>
                          {editingQuestion.blanks!.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => setEditingQuestion({
                                ...editingQuestion, 
                                blanks: editingQuestion.blanks!.filter((_, i) => i !== idx)
                              })} 
                              className="text-rose-400 hover:text-rose-600 text-xs"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          )}
                        </div>
                        <label className="text-[9px] font-bold text-gray-400 block mb-1 ml-1">可接受的答案（每行一个）</label>
                        <textarea 
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-100 h-20" 
                          value={blank.acceptedAnswers.join('\n')}
                          onChange={e => {
                            const newBlanks = [...editingQuestion.blanks!];
                            newBlanks[idx] = {
                              ...blank,
                              acceptedAnswers: e.target.value.split('\n').filter(a => a.trim())
                            };
                            setEditingQuestion({...editingQuestion, blanks: newBlanks});
                          }}
                          placeholder="例如：&#10;JavaScript&#10;JS&#10;javascript"
                        />
                        <div className="flex items-center gap-4 mt-2">
                          <label className="flex items-center gap-2 text-xs font-medium text-gray-500">
                            <input 
                              type="checkbox" 
                              checked={blank.caseSensitive || false}
                              onChange={e => {
                                const newBlanks = [...editingQuestion.blanks!];
                                newBlanks[idx] = {...blank, caseSensitive: e.target.checked};
                                setEditingQuestion({...editingQuestion, blanks: newBlanks});
                              }}
                              className="rounded"
                            />
                            区分大小写
                          </label>
                        </div>
                      </div>
                    ))}
                    <button 
                      type="button" 
                      onClick={() => {
                        const nextId = `blank${(editingQuestion.blanks?.length || 0) + 1}`;
                        setEditingQuestion({
                          ...editingQuestion, 
                          blanks: [
                            ...(editingQuestion.blanks || []),
                            {
                              id: nextId,
                              position: editingQuestion.blanks?.length || 0,
                              acceptedAnswers: [],
                              caseSensitive: false
                            }
                          ]
                        });
                      }}
                      className="text-xs font-black text-indigo-600 hover:underline"
                    >
                      <i className="fa-solid fa-plus mr-1"></i> 添加空白
                    </button>
                  </div>
                </div>
              )}

              {/* 简答题配置 */}
              {editingQuestion?.type === QuestionType.SHORT_ANSWER && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">参考答案</label>
                    <textarea 
                      className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none h-32" 
                      value={editingQuestion?.referenceAnswer || ''} 
                      onChange={e => setEditingQuestion({...editingQuestion, referenceAnswer: e.target.value})} 
                      placeholder="输入参考答案，用于AI评分参考..."
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editingQuestion?.aiGradingEnabled || false}
                        onChange={e => setEditingQuestion({...editingQuestion, aiGradingEnabled: e.target.checked})}
                        className="w-5 h-5 rounded"
                      />
                      <span className="text-sm font-bold text-gray-700">启用AI自动评分</span>
                    </label>
                    <p className="text-[10px] text-gray-400 font-medium italic mt-1 ml-8">启用后，学员可以使用AI评分功能获得即时反馈</p>
                  </div>
                </div>
              )}

              {editingQuestion?.type === QuestionType.JUDGE ? (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">判断选项展示</label>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-2xl border-2 border-indigo-100">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shrink-0 shadow-md shadow-indigo-100">A</div>
                        <span className="font-black text-indigo-700">正确</span>
                     </div>
                     <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border-2 border-gray-100">
                        <div className="w-10 h-10 rounded-xl bg-gray-200 text-gray-600 flex items-center justify-center font-black shrink-0">B</div>
                        <span className="font-black text-gray-500">错误</span>
                     </div>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium italic mt-1 ml-1">* 判断题选项已固定为“正确/错误”，无需手动输入。</p>
                </div>
              ) : editingQuestion?.type !== QuestionType.FILL_IN_BLANK && editingQuestion?.type !== QuestionType.SHORT_ANSWER ? (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">候选项配置</label>
                  {editingQuestion?.options?.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-black shrink-0">{String.fromCharCode(65+idx)}</div>
                      <input 
                        className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2.5 font-bold outline-none" 
                        value={opt} 
                        onChange={e => {
                          const nextOpts = [...(editingQuestion.options || [])];
                          nextOpts[idx] = e.target.value;
                          setEditingQuestion({...editingQuestion, options: nextOpts});
                        }}
                      />
                      {editingQuestion.options!.length > 2 && (
                        <button type="button" onClick={() => setEditingQuestion({...editingQuestion, options: editingQuestion.options!.filter((_, i) => i !== idx)})} className="text-rose-300 hover:text-rose-500"><i className="fa-solid fa-circle-minus"></i></button>
                      )}
                    </div>
                  ))}
                  {editingQuestion?.options && editingQuestion.options.length < 8 && (
                    <button type="button" onClick={() => setEditingQuestion({...editingQuestion, options: [...editingQuestion.options!, '']})} className="text-xs font-black text-indigo-600 hover:underline"><i className="fa-solid fa-plus mr-1"></i> 添加选项</button>
                  )}
                </div>
              ) : null}

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">专家解析 (选填)</label>
                <textarea className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none h-24" value={editingQuestion?.explanation} onChange={e => setEditingQuestion({...editingQuestion, explanation: e.target.value})} placeholder="输入题目解析..." />
              </div>

              {/* 标签选择器 */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">题目标签 (选填)</label>
                <TagSelector
                  selectedTagIds={editingQuestion?.tags || []}
                  onChange={(tagIds) => setEditingQuestion({...editingQuestion, tags: tagIds})}
                  allowCreate={true}
                  placeholder="搜索或创建标签..."
                />
                <p className="text-[10px] text-gray-400 font-medium italic mt-2 ml-1">* 标签可用于分类和筛选题目</p>
              </div>
            </div>
            <div className="flex gap-4 pt-8">
              <button type="button" onClick={() => setIsQuestionModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black">取消</button>
              <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">确认保存题目</button>
            </div>
          </form>
        </div>
      )}

      {isScoreModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-sm:max-w-xs max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black mb-6">题库分值设置</h3>
            <div className="space-y-5">
               <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-600">单选题分值</span>
                  <input type="number" className="w-20 bg-gray-50 rounded-xl px-3 py-2 text-center font-black" value={scoreForm[QuestionType.SINGLE] || 2} onChange={e => setScoreForm({...scoreForm, [QuestionType.SINGLE]: Number(e.target.value)})} />
               </div>
               <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-600">多选题分值</span>
                  <input type="number" className="w-20 bg-gray-50 rounded-xl px-3 py-2 text-center font-black" value={scoreForm[QuestionType.MULTIPLE] || 4} onChange={e => setScoreForm({...scoreForm, [QuestionType.MULTIPLE]: Number(e.target.value)})} />
               </div>
               <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-600">判断题分值</span>
                  <input type="number" className="w-20 bg-gray-50 rounded-xl px-3 py-2 text-center font-black" value={scoreForm[QuestionType.JUDGE] || 1} onChange={e => setScoreForm({...scoreForm, [QuestionType.JUDGE]: Number(e.target.value)})} />
               </div>
               <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-600">填空题分值</span>
                  <input type="number" className="w-20 bg-gray-50 rounded-xl px-3 py-2 text-center font-black" value={scoreForm[QuestionType.FILL_IN_BLANK] || 3} onChange={e => setScoreForm({...scoreForm, [QuestionType.FILL_IN_BLANK]: Number(e.target.value)})} />
               </div>
               <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-600">简答题分值</span>
                  <input type="number" className="w-20 bg-gray-50 rounded-xl px-3 py-2 text-center font-black" value={scoreForm[QuestionType.SHORT_ANSWER] || 5} onChange={e => setScoreForm({...scoreForm, [QuestionType.SHORT_ANSWER]: Number(e.target.value)})} />
               </div>
            </div>
            <div className="flex gap-4 pt-8">
              <button onClick={() => setIsScoreModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-2xl font-bold">取消</button>
              <button onClick={() => { onUpdateScore(editingBankId!, scoreForm); setIsScoreModalOpen(false); }} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg">保存分值</button>
            </div>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">批量导入题目</h3>
            <p className="text-xs text-gray-400 mb-8 font-medium">请严格按照 CSV 模板格式进行题目编撰后再进行上传操作。</p>
            
            <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className="bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-3xl p-8 text-center cursor-pointer hover:bg-indigo-50 transition-colors group"
              >
                <i className="fa-solid fa-cloud-arrow-up text-4xl text-indigo-400 mb-4 group-hover:scale-110 transition-transform"></i>
                <div className="text-sm font-bold text-indigo-600">点击此处上传题目文件</div>
                <div className="text-[10px] text-gray-400 mt-2">支持标准 CSV 格式表格</div>
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileImport} />
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">填写规范说明</h4>
                <ul className="text-[11px] text-amber-700/80 space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>题型标识符: <strong>SINGLE</strong>(单选), <strong>MULTIPLE</strong>(多选), <strong>JUDGE</strong>(判断)</li>
                  <li>选项分隔符: 使用英文半角 <strong>|</strong> 分隔，支持 <strong>2-8个</strong> 选项</li>
                  <li>答案规范: 单选填A/B/C等，多选填ABC等（无需分隔符）</li>
                  <li>判断题: 选项可留空，答案 <strong>A</strong>=正确，<strong>B</strong>=错误</li>
                  <li>特殊字符: 题干或解析中如有<strong>逗号、引号</strong>，请用<strong>英文双引号</strong>包裹该字段</li>
                  <li>系统会自动验证格式并提示错误行，只导入有效题目</li>
                </ul>
              </div>

              <button 
                onClick={downloadTemplate}
                className="w-full py-4 border-2 border-gray-100 text-gray-500 rounded-2xl text-xs font-black hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-download"></i> 获取题目导入 CSV 模板
              </button>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsImportModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankManager;
