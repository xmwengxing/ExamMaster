import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { QuestionType } from '../../types';

const AiAnalysisViewer: React.FC = () => {
  const store = useAppStore();
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(30);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 获取题型标签
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      [QuestionType.SINGLE]: '单选题',
      [QuestionType.MULTIPLE]: '多选题',
      [QuestionType.JUDGE]: '判断题',
      [QuestionType.FILL_IN_BLANK]: '填空题',
      [QuestionType.SHORT_ANSWER]: '简答题',
    };
    return labels[type] || type;
  };

  // 获取题型颜色
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      [QuestionType.SINGLE]: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      [QuestionType.MULTIPLE]: 'bg-purple-50 text-purple-600 border-purple-100',
      [QuestionType.JUDGE]: 'bg-blue-50 text-blue-600 border-blue-100',
      [QuestionType.FILL_IN_BLANK]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      [QuestionType.SHORT_ANSWER]: 'bg-amber-50 text-amber-600 border-amber-100',
    };
    return colors[type] || 'bg-gray-50 text-gray-600 border-gray-100';
  };

  // 加载数据
  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await store.fetchAdminAiAnalysis({
        page,
        pageSize,
        search,
        type: typeFilter
      });
      setRecords(result.records || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 0);
    } catch (e) {
      console.error('[AiAnalysisViewer] 加载失败:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, typeFilter]);

  // 搜索处理（防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        loadData();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // 切换展开/收起
  const toggleExpand = (recordId: string) => {
    setExpandedId(expandedId === recordId ? null : recordId);
  };

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="bg-white p-6 rounded-3xl border shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <i className="fa-solid fa-wand-magic-sparkles text-indigo-500"></i>
              AI 解析记录
            </h2>
            <p className="text-sm text-gray-400 mt-1">查看所有学员对题目的AI深度解析内容</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-indigo-600">{total}</div>
            <div className="text-xs text-gray-400 font-bold">条解析记录</div>
          </div>
        </div>
      </div>

      {/* 搜索和筛选栏 */}
      <div className="bg-white p-6 rounded-3xl border shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 搜索框 */}
          <div className="flex-1">
            <div className="relative">
              <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="搜索题目内容或学员姓名..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-indigo-400 outline-none"
              />
            </div>
          </div>

          {/* 题型筛选 */}
          <div className="w-full md:w-48">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800 focus:border-indigo-400 outline-none"
            >
              <option value="">全部题型</option>
              <option value={QuestionType.SINGLE}>单选题</option>
              <option value={QuestionType.MULTIPLE}>多选题</option>
              <option value={QuestionType.JUDGE}>判断题</option>
              <option value={QuestionType.FILL_IN_BLANK}>填空题</option>
              <option value={QuestionType.SHORT_ANSWER}>简答题</option>
            </select>
          </div>
        </div>
      </div>

      {/* 记录列表 */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300">
            <i className="fa-solid fa-spinner fa-spin text-5xl mb-4 opacity-20"></i>
            <p className="font-bold">加载中...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300">
            <i className="fa-solid fa-inbox text-5xl mb-4 opacity-20"></i>
            <p className="font-bold">暂无AI解析记录</p>
            <p className="text-xs mt-1">学员使用AI深度解析后，记录将显示在这里</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {records.map((record) => {
              const recordId = `${record.userId}-${record.questionId}`;
              const isExpanded = expandedId === recordId;
              
              return (
                <div key={recordId} className="p-6 hover:bg-gray-50/50 transition-colors">
                  {/* 记录头部 */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* 学员信息 */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-black">
                          {record.userName?.charAt(0) || '学'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-800">
                            {record.userRealName || record.userName}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(record.updatedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* 题目信息 */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${getTypeColor(record.questionType)}`}>
                          {getTypeLabel(record.questionType)}
                        </span>
                        <span className="text-xs text-gray-400">题目ID: {record.questionId}</span>
                      </div>

                      {/* 题目内容预览 */}
                      <div className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {record.questionContent}
                      </div>

                      {/* AI解析内容预览 */}
                      {!isExpanded && (
                        <div className="text-sm text-gray-500 line-clamp-3 bg-indigo-50/30 p-3 rounded-xl border border-indigo-100/50">
                          {record.content}
                        </div>
                      )}
                    </div>

                    {/* 展开按钮 */}
                    <button
                      onClick={() => toggleExpand(recordId)}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2 shrink-0"
                    >
                      {isExpanded ? (
                        <>
                          <i className="fa-solid fa-chevron-up"></i>
                          收起
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-chevron-down"></i>
                          查看详情
                        </>
                      )}
                    </button>
                  </div>

                  {/* 展开的详细内容 */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-in slide-in-from-top-2">
                      {/* 完整题目 */}
                      <div>
                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">题目内容</div>
                        <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-800">
                          {record.questionContent}
                        </div>
                      </div>

                      {/* AI解析内容 */}
                      <div>
                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <i className="fa-solid fa-wand-magic-sparkles text-indigo-500"></i>
                          AI 深度解析
                        </div>
                        <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                          <div 
                            className="markdown-body text-sm leading-relaxed text-gray-800"
                            dangerouslySetInnerHTML={{ __html: (window as any).marked?.parse(record.content) || record.content }}
                          />
                        </div>
                      </div>

                      {/* 时间信息 */}
                      <div className="flex items-center gap-6 text-xs text-gray-400">
                        <div>
                          <i className="fa-solid fa-clock mr-1"></i>
                          创建时间: {new Date(record.createdAt).toLocaleString()}
                        </div>
                        <div>
                          <i className="fa-solid fa-pen mr-1"></i>
                          更新时间: {new Date(record.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              共 {total} 条记录，第 {page} / {totalPages} 页
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
              >
                <i className="fa-solid fa-chevron-left mr-1"></i>
                上一页
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
              >
                下一页
                <i className="fa-solid fa-chevron-right ml-1"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAnalysisViewer;
