
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
    strategy: 'SEQUENTIAL', // 默认顺序练习
    counts: {
      [QuestionType.SINGLE]: 0,
      [QuestionType.MULTIPLE]: 0,
      [QuestionType.JUDGE]: 0,
      [QuestionType.FILL_IN_BLANK]: 0,
      [QuestionType.SHORT_ANSWER]: 0,
    }
  });

  // 严格过滤：仅显示 isCustom 为 1 (true) 的记录
  const customHistory = useMemo(() => 
    history.filter(h => (h.isCustom === true || (h.isCustom as any) === 1))
  , [history]);

  const typeStats = useMemo(() => {
    const bankQs = store.questions.filter(q => q.bankId === activeBank.id);
    return {
      [QuestionType.SINGLE]: bankQs.filter(q => q.type === QuestionType.SINGLE).length,
      [QuestionType.MULTIPLE]: bankQs.filter(q => q.type === QuestionType.MULTIPLE).length,
      [QuestionType.JUDGE]: bankQs.filter(q => q.type === QuestionType.JUDGE).length,
      [QuestionType.FILL_IN_BLANK]: bankQs.filter(q => q.type === QuestionType.FILL_IN_BLANK).length,
      [QuestionType.SHORT_ANSWER]: bankQs.filter(q => q.type === QuestionType.SHORT_ANSWER).length,
    };
  }, [store.questions, activeBank.id]);

  const totalCount = useMemo(() => {
    return Object.values(form.counts).reduce((sum, count) => sum + count, 0);
  }, [form.counts]);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      [QuestionType.SINGLE]: '单选',
      [QuestionType.MULTIPLE]: '多选',
      [QuestionType.JUDGE]: '判断',
      [QuestionType.FILL_IN_BLANK]: '填空',
      [QuestionType.SHORT_ANSWER]: '简答',
      'ALL': '全题型',
    };
    return labels[type] || type;
  };

  const getTypeSummary = (record: PracticeRecord) => {
    // 如果有questionTypeFilter，使用它
    if (record.questionTypeFilter && record.questionTypeFilter !== 'ALL') {
      return getTypeLabel(record.questionTypeFilter);
    }
    // 否则使用type字段
    return record.type || '全题型';
  };

  const handleCountChange = (type: QuestionType, value: number) => {
    const maxCount = typeStats[type];
    const validValue = Math.max(0, Math.min(value, maxCount));
    setForm({
      ...form,
      counts: {
        ...form.counts,
        [type]: validValue
      }
    });
  };

  const handleQuickSet = (type: QuestionType) => {
    const maxCount = typeStats[type];
    setForm({
      ...form,
      counts: {
        ...form.counts,
        [type]: maxCount
      }
    });
  };

  const handleCreatePractice = async () => {
    if (totalCount === 0) return alert('请至少选择一道题目');
    if (isOperating) return;

    setIsOperating(true);
    try {
      const newId = Date.now().toString();
      
      // 生成类型摘要
      const selectedTypes = Object.entries(form.counts)
        .filter(([_, count]) => count > 0)
        .map(([type, count]) => `${getTypeLabel(type as QuestionType)}×${count}`)
        .join(' + ');

      const newRecord: PracticeRecord = {
        id: newId,
        bankId: activeBank.id,
        bankName: activeBank.name,
        type: selectedTypes,
        questionTypeFilter: 'CUSTOM', // 标记为自定义组合
        mode: PracticeMode.SEQUENTIAL,
        count: totalCount,
        date: new Date().toLocaleString(),
        currentIndex: 0,
        userAnswers: {},
        isCustom: true
      };

      // 1. 先保存到数据库
      await store.addPracticeRecord(newRecord);
      
      // 2. 关闭弹窗
      setIsModalOpen(false);
      
      // 3. 直接开始练习，传递skipCheck标志跳过历史进度检查
      onStart(PracticeMode.SEQUENTIAL, {
        ...newRecord,
        strategy: form.strategy,
        isCustom: true,
        bankId: activeBank.id,
        customCounts: form.counts, // 传递自定义题数配置
        skipCheck: true
      });
      
      // 重置表单
      setForm({
        strategy: 'SEQUENTIAL',
        counts: {
          [QuestionType.SINGLE]: 0,
          [QuestionType.MULTIPLE]: 0,
          [QuestionType.JUDGE]: 0,
          [QuestionType.FILL_IN_BLANK]: 0,
          [QuestionType.SHORT_ANSWER]: 0,
        }
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
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-black uppercase">{getTypeSummary(item)}</span>
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
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 animate-in zoom-in-95 duration-200 shadow-2xl max-h-[90vh] overflow-y-auto">
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
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3 ml-1">选择题型和题数</label>
                <div className="space-y-3">
                  {[
                    { type: QuestionType.SINGLE, label: '单选题', icon: 'fa-circle-dot', color: 'indigo' },
                    { type: QuestionType.MULTIPLE, label: '多选题', icon: 'fa-square-check', color: 'purple' },
                    { type: QuestionType.JUDGE, label: '判断题', icon: 'fa-circle-question', color: 'blue' },
                    { type: QuestionType.FILL_IN_BLANK, label: '填空题', icon: 'fa-pen-to-square', color: 'emerald' },
                    { type: QuestionType.SHORT_ANSWER, label: '简答题', icon: 'fa-align-left', color: 'amber' }
                  ].map(({ type, label, icon, color }) => (
                    <div key={type} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                      <div className={`w-10 h-10 bg-${color}-100 rounded-xl flex items-center justify-center text-${color}-600 shrink-0`}>
                        <i className={`fa-solid ${icon}`}></i>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-800 text-sm">{label}</div>
                        <div className="text-xs text-gray-400">题库可用: {typeStats[type]} 题</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCountChange(type, form.counts[type] - 1)}
                          disabled={form.counts[type] === 0}
                          className="w-8 h-8 rounded-lg bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <i className="fa-solid fa-minus text-xs"></i>
                        </button>
                        <input
                          type="number"
                          min="0"
                          max={typeStats[type]}
                          value={form.counts[type]}
                          onChange={(e) => handleCountChange(type, parseInt(e.target.value) || 0)}
                          className="w-16 text-center py-2 border-2 border-gray-200 rounded-lg font-bold text-gray-800 focus:border-indigo-400 outline-none"
                        />
                        <button
                          onClick={() => handleCountChange(type, form.counts[type] + 1)}
                          disabled={form.counts[type] >= typeStats[type]}
                          className="w-8 h-8 rounded-lg bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <i className="fa-solid fa-plus text-xs"></i>
                        </button>
                        <button
                          onClick={() => handleQuickSet(type)}
                          disabled={typeStats[type] === 0}
                          className="ml-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          全选
                        </button>
                      </div>
                    </div>
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
                 <p className="text-2xl font-black text-indigo-600 mt-1">{totalCount} <span className="text-xs font-bold">题</span></p>
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
                  disabled={isOperating || totalCount === 0}
                  className={`flex-1 py-4 rounded-[1.5rem] font-black shadow-xl ${
                    isOperating || totalCount === 0
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
