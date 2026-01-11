
import React, { useState, useMemo } from 'react';
import { Question, QuestionType, QuestionBank } from '../../types';

interface FavoritesProps {
  favorites: Question[];
  banks: QuestionBank[];
  onStart: (questions: Question[]) => void;
  onToggleFavorite: (q: Question) => void;
  onBack: () => void;
}

const Favorites: React.FC<FavoritesProps> = ({ favorites, banks, onStart, onToggleFavorite, onBack }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<QuestionType | 'ALL'>('ALL');

  // 根据选择的题型过滤收藏列表
  const filteredFavorites = useMemo(() => {
    if (filterType === 'ALL') return favorites;
    return favorites.filter(f => f.type === filterType);
  }, [favorites, filterType]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredFavorites.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredFavorites.map(f => f.id));
    }
  };

  const handleStartPractice = () => {
    const selectedQs = favorites.filter(f => selectedIds.includes(f.id));
    if (selectedQs.length === 0) return alert('请先选择要练习的题目');
    onStart(selectedQs);
  };

  const getBankName = (bankId: string) => {
    return banks.find(b => b.id === bankId)?.name || '未知题库';
  };

  const handleFilterChange = (type: QuestionType | 'ALL') => {
    setFilterType(type);
    setSelectedIds([]); // 切换题型时清空选中项，避免逻辑混乱
  };

  const filterOptions = [
    { id: 'ALL', label: '全部题型', count: favorites.length },
    { id: QuestionType.SINGLE, label: '单选题', count: favorites.filter(f => f.type === QuestionType.SINGLE).length },
    { id: QuestionType.MULTIPLE, label: '多选题', count: favorites.filter(f => f.type === QuestionType.MULTIPLE).length },
    { id: QuestionType.JUDGE, label: '判断题', count: favorites.filter(f => f.type === QuestionType.JUDGE).length },
  ];

  return (
    <div className="space-y-6 flex flex-col min-h-full pb-20 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 px-1">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border flex items-center justify-center text-gray-500 shadow-sm active:scale-90 transition-transform shrink-0"
          title="返回练习"
        >
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <div className="flex-1 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">我的收藏</h2>
            <p className="text-xs text-gray-400 mt-1 font-bold">
              {filterType === 'ALL' ? `共收藏 ${favorites.length} 道题目` : `当前筛选下有 ${filteredFavorites.length} 道题目`}
            </p>
          </div>
          {filteredFavorites.length > 0 && (
            <button 
              onClick={toggleSelectAll}
              className="text-indigo-600 text-xs font-black bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-all active:scale-95"
            >
              {selectedIds.length === filteredFavorites.length ? '取消全选' : '全部选择'}
            </button>
          )}
        </div>
      </div>

      {/* 题型筛选器 */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 -mx-1 px-1">
        {filterOptions.map(opt => (
          <button
            key={opt.id}
            onClick={() => handleFilterChange(opt.id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all border-2 shrink-0 ${
              filterType === opt.id 
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-100 hover:text-indigo-600'
            }`}
          >
            {opt.label}
            <span className={`px-1.5 py-0.5 rounded-lg text-[9px] ${
              filterType === opt.id ? 'bg-white/20 text-white' : 'bg-gray-50 text-gray-400'
            }`}>
              {opt.count}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-4 flex-1">
        {filteredFavorites.length > 0 ? (
          filteredFavorites.map((q) => (
            <div 
              key={q.id} 
              className={`bg-white rounded-[2rem] p-6 border transition-all flex items-start gap-4 shadow-sm group hover:border-indigo-100 animate-in slide-in-from-bottom-2 ${
                selectedIds.includes(q.id) ? 'border-indigo-200 bg-indigo-50/10' : 'border-gray-100'
              }`}
            >
              <div className="pt-1">
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(q.id)}
                  onChange={() => toggleSelect(q.id)}
                  className="w-5 h-5 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                    q.type === QuestionType.SINGLE ? 'bg-indigo-50 text-indigo-600' : 
                    q.type === QuestionType.MULTIPLE ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {q.type === QuestionType.SINGLE ? '单选' : q.type === QuestionType.MULTIPLE ? '多选' : '判断'}
                  </span>
                  <span className="text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded font-bold">
                    {getBankName(q.bankId)}
                  </span>
                </div>
                <h4 className="font-bold text-gray-800 leading-relaxed text-sm line-clamp-2">
                  {q.content}
                </h4>
              </div>
              <button 
                onClick={() => onToggleFavorite(q)}
                className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center hover:bg-amber-100 transition-colors shrink-0"
                title="取消收藏"
              >
                <i className="fa-solid fa-star"></i>
              </button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-gray-300 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-50">
            <i className={`fa-solid ${filterType === 'ALL' ? 'fa-star-half-stroke' : 'fa-filter-circle-xmark'} text-6xl mb-4 opacity-10`}></i>
            <p className="font-bold">{filterType === 'ALL' ? '暂无收藏题目' : '当前分类下暂无题目'}</p>
            <p className="text-xs mt-1">{filterType === 'ALL' ? '在练习过程中点击星星即可收藏题目' : '您可以尝试切换其他题型筛选'}</p>
          </div>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-80 bg-white border border-indigo-100 rounded-3xl p-5 shadow-2xl animate-in slide-in-from-bottom-6 duration-300 z-30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">已选题目</div>
              <div className="text-xl font-black text-indigo-600">{selectedIds.length} <span className="text-xs">题</span></div>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <i className="fa-solid fa-list-check text-xl"></i>
            </div>
          </div>
          <button 
            onClick={handleStartPractice}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            开始练习选中项
          </button>
        </div>
      )}
    </div>
  );
};

export default Favorites;
