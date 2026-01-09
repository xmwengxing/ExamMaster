
import React, { useState, useMemo } from 'react';
import { QuestionBank, PracticeRecord, PracticeMode, QuestionType } from '../../types';
import { useAppStore } from '../../store';

interface PracticeProps {
  banks: QuestionBank[];
  activeBank: QuestionBank;
  history: PracticeRecord[];
  onStart: (mode: PracticeMode, params?: any) => void;
  onAddRecord: (record: PracticeRecord) => void;
  onDeleteRecord: (id: string) => void;
  onNavigate: (tab: string) => void;
}

const PracticeList: React.FC<PracticeProps> = ({ banks, activeBank, history, onStart, onAddRecord, onDeleteRecord, onNavigate }) => {
  const store = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOperating, setIsOperating] = useState(false);
  const [form, setForm] = useState({
    type: 'ALL',
    strategy: 'SEQUENTIAL', // 默认改为顺序练习
  });

  // 严格过滤：仅显示 isCustom 为 1 (true) 的记录
  const customHistory = useMemo(() => 
    history.filter(h => (h.isCustom === true || (h.isCustom as any) === 1))
  , [history]);

  const typeStats = useMemo(() => {
    const bankQs = store.questions.filter(q => q.bankId === activeBank.id);
    return {
      ALL: bankQs.length,
      [QuestionType.SINGLE]: bankQs.filter(q => q.type === QuestionType.SINGLE).length,
      [QuestionType.MULTIPLE]: bankQs.filter(q => q.type === QuestionType.MULTIPLE).length,
      [QuestionType.JUDGE]: bankQs.filter(q => q.type === QuestionType.JUDGE).length,
      [QuestionType.FILL_IN_BLANK]: bankQs.filter(q => q.type === QuestionType.FILL_IN_BLANK).length,
      [QuestionType.SHORT_ANSWER]: bankQs.filter(q => q.type === QuestionType.SHORT_ANSWER).length,
    };
  }, [store.questions, activeBank.id]);

  const estimatedCount = useMemo(() => {
    return typeStats[form.type as keyof typeof typeStats] || 0;
  }, [typeStats, form.type]);

  const handleCreatePractice = async () => {
    if (estimatedCount === 0) return alert('当前选中的分类下没有题目');
    if (isOperating) return; // 防止重复提交

    setIsOperating(true);
    try {
      const newId = Date.now().toString();
      const newRecord: PracticeRecord = {
        id: newId,
        bankId: activeBank.id,
        bankName: activeBank.name,
        type: form.type === 'ALL' ? '全题型' : 
              form.type === 'SINGLE' ? '单选题' : 
              form.type === 'MULTIPLE' ? '多选题' : '判断题',
        questionTypeFilter: form.type, // 保存原始题型过滤值
        mode: PracticeMode.SEQUENTIAL,
        count: estimatedCount,
        date: new Date().toLocaleString(),
        currentIndex: 0,
        userAnswers: {},
        isCustom: true // 此处传 true，store.addPracticeRecord 会自动转为 1
      };

      // 1. 先保存到数据库
      await store.addPracticeRecord(newRecord);
      
      // 2. 关闭弹窗
      setIsModalOpen(false);
      
      // 3. 开始练习
      onStart(PracticeMode.SEQUENTIAL, {
        ...newRecord,
        strategy: form.strategy,
        isCustom: true,
        bankId: activeBank.id,
        type: form.type 
      });
    } catch (err) {
      console.error('创建练习失败', err);
      alert('创建练习失败，请重试');
    } finally {
      setIsOperating(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这条练习记录吗？该操作不可恢复。')) {
      onDeleteRecord(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border shadow-sm">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
           <i className="fa-solid fa-rocket text-indigo-500"></i>
           系统标准练习
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => onStart(PracticeMode.SEQUENTIAL, { isCustom: false, bankId: activeBank.id })}
            className="flex items-center gap-4 p-5 rounded-2xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-all text-left group"
          >
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-arrow-down-1-9 text-xl"></i>
            </div>
            <div>
              <div className="font-bold text-indigo-900">顺序练习</div>
              <div className="text-sm text-indigo-600/70">官方题序 · 独立进度</div>
            </div>
          </button>
          <button 
            onClick={() => onStart(PracticeMode.MEMORY, { isCustom: false, bankId: activeBank.id })}
            className="flex items-center gap-4 p-5 rounded-2xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-all text-left group"
          >
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-brain text-xl"></i>
            </div>
            <div>
              <div className="font-bold text-emerald-900">背题模式</div>
              <div className="text-sm text-emerald-600/70">直接展示答案解析</div>
            </div>
          </button>
          <button 
            onClick={() => onNavigate('practical-practice')}
            className="flex items-center gap-4 p-5 rounded-2xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-all text-left group"
          >
            <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-keyboard text-xl"></i>
            </div>
            <div>
              <div className="font-bold text-amber-900">实操模拟</div>
              <div className="text-sm text-amber-600/70">开放式实操作答</div>
            </div>
          </button>
          <button 
            onClick={() => onNavigate('favorites')}
            className="flex items-center gap-4 p-5 rounded-2xl bg-yellow-50 border border-yellow-100 hover:bg-yellow-100 transition-all text-left group"
          >
            <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-star text-xl"></i>
            </div>
            <div>
              <div className="font-bold text-yellow-900">收藏夹</div>
              <div className="text-sm text-yellow-600/70">重点复习 · 精选题目</div>
            </div>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-wand-magic-sparkles text-indigo-400"></i>
            自定义练习任务
          </h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-indigo-600 text-sm font-bold bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors"
          >
            <i className="fa-solid fa-plus mr-1"></i> 新建个性化练习
          </button>
        </div>
        
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden min-h-[200px]">
          {customHistory.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {customHistory.map(item => (
                <div key={item.id} className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                      <i className="fa-solid fa-file-pen text-sm"></i>
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 leading-tight">{item.bankName}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-black uppercase">{item.type}</span>
                        <span className="text-xs text-gray-400 font-medium">进度: {item.currentIndex + 1}/{item.count} 题</span>
                        <span className="text-xs text-gray-300">|</span>
                        <span className="text-xs text-gray-400">{item.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onStart(item.mode, { ...item, isCustom: true })}
                      className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all"
                    >
                      继续练习
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300">
              <i className="fa-solid fa-inbox text-5xl mb-4 opacity-20"></i>
              <p className="font-bold">暂无自定义练习记录</p>
              <p className="text-[10px] mt-1">点击右上角，灵活配置您的专属刷题计划</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">配置练习任务</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">当前题库</label>
                <div className="w-full bg-gray-50 border-2 border-dashed border-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-700">
                  {activeBank.name}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">练习题型 (当前题库实有题数)</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'ALL', label: '全部题型', count: typeStats.ALL },
                    { id: QuestionType.SINGLE, label: '单选题', count: typeStats[QuestionType.SINGLE] },
                    { id: QuestionType.MULTIPLE, label: '多选题', count: typeStats[QuestionType.MULTIPLE] },
                    { id: QuestionType.JUDGE, label: '判断题', count: typeStats[QuestionType.JUDGE] },
                    { id: QuestionType.FILL_IN_BLANK, label: '填空题', count: typeStats[QuestionType.FILL_IN_BLANK] },
                    { id: QuestionType.SHORT_ANSWER, label: '简答题', count: typeStats[QuestionType.SHORT_ANSWER] }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setForm({...form, type: opt.id})}
                      className={`relative py-3 px-4 rounded-2xl text-sm font-bold border-2 transition-all text-left ${
                        form.type === opt.id 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                          : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-200'
                      }`}
                    >
                      {opt.label}
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black opacity-60`}>
                        {opt.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">抽取策略</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setForm({...form, strategy: 'RANDOM'})}
                    className={`flex-1 py-3 rounded-2xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                      form.strategy === 'RANDOM' 
                        ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100' 
                        : 'bg-white border-gray-100 text-gray-500 hover:border-amber-200'
                    }`}
                  >
                    <i className="fa-solid fa-shuffle"></i> 混序练习
                  </button>
                  <button
                    onClick={() => setForm({...form, strategy: 'SEQUENTIAL'})}
                    className={`flex-1 py-3 rounded-2xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                      form.strategy === 'SEQUENTIAL' 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                        : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-200'
                    }`}
                  >
                    <i className="fa-solid fa-arrow-down-short-wide"></i> 顺序练习
                  </button>
                </div>
              </div>

              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 text-center">
                 <p className="text-xs text-indigo-400 font-bold">生成题目总计</p>
                 <p className="text-2xl font-black text-indigo-600 mt-1">{estimatedCount} <span className="text-xs font-bold">题</span></p>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-[1.5rem] font-black"
                >
                  取消
                </button>
                <button 
                  onClick={handleCreatePractice}
                  disabled={isOperating}
                  className={`flex-1 py-4 rounded-[1.5rem] font-black shadow-xl ${
                    isOperating 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-indigo-600 text-white shadow-indigo-100'
                  }`}
                >
                  {isOperating ? '创建中...' : '确认生成'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeList;
