import React, { useState, useEffect } from 'react';
import { Discussion } from '../types';
import { useAppStore } from '../store';

interface DiscussionListProps {
  questionId?: string;
  onSelectDiscussion: (discussion: Discussion) => void;
  onCreateNew: () => void;
  showHidden?: boolean;
}

type SortOption = 'latest' | 'hot' | 'mostCommented';

const DiscussionList: React.FC<DiscussionListProps> = ({ 
  questionId, 
  onSelectDiscussion, 
  onCreateNew,
  showHidden = false
}) => {
  const store = useAppStore();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [filterQuestionId, setFilterQuestionId] = useState<string | undefined>(questionId);
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  useEffect(() => {
    loadDiscussions();
  }, [sortBy, filterQuestionId, showHidden]);

  const loadDiscussions = async () => {
    // 优化：先尝试从缓存加载，避免每次都显示 loading
    try {
      const result = await store.fetchDiscussions({
        questionId: filterQuestionId,
        sortBy,
        includeHidden: showHidden
      });
      
      // 如果有数据，立即显示（可能是缓存）
      if (result && result.length > 0) {
        setDiscussions(result);
        setIsLoading(false);
      } else {
        // 没有数据时才显示 loading
        setIsLoading(true);
        setDiscussions(result);
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('[DiscussionList] 加载讨论失败:', error);
      setIsLoading(false);
      alert('加载讨论失败：' + (error.message || '未知错误'));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 分离置顶和普通讨论，并应用搜索过滤
  const filteredDiscussions = discussions.filter(d => {
    if (!searchKeyword.trim()) return true;
    const keyword = searchKeyword.toLowerCase();
    const titleMatch = d.title.toLowerCase().includes(keyword);
    const contentMatch = d.content.toLowerCase().includes(keyword);
    return titleMatch || contentMatch;
  });

  const pinnedDiscussions = filteredDiscussions.filter(d => d.isPinned);
  const normalDiscussions = filteredDiscussions.filter(d => !d.isPinned);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <i className="fa-solid fa-spinner animate-spin text-3xl text-indigo-600"></i>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部工具栏 */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-gray-900">讨论区</h2>
            <span className="text-sm text-gray-400">({filteredDiscussions.length})</span>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* 排序选择 */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2 border-2 border-gray-100 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="latest">最新发布</option>
              <option value="hot">最热讨论</option>
              <option value="mostCommented">最多评论</option>
            </select>

            {/* 创建讨论按钮 */}
            <button
              onClick={onCreateNew}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              <i className="fa-solid fa-plus mr-2"></i>发起讨论
            </button>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="relative">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索话题或内容关键词..."
            className="w-full px-4 py-3 pl-12 border-2 border-gray-100 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          {searchKeyword && (
            <button
              onClick={() => setSearchKeyword('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <i className="fa-solid fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* 讨论列表 */}
      {filteredDiscussions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border">
          <i className="fa-solid fa-comments text-5xl text-gray-300 mb-4"></i>
          <p className="text-gray-400 font-medium">
            {searchKeyword ? '未找到匹配的讨论' : '暂无讨论，发起第一个讨论吧'}
          </p>
          {!searchKeyword && (
            <button
              onClick={onCreateNew}
              className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-colors"
            >
              发起讨论
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* 置顶讨论 */}
          {pinnedDiscussions.length > 0 && (
            <div className="space-y-3">
              {pinnedDiscussions.map((discussion) => (
                <DiscussionCard
                  key={discussion.id}
                  discussion={discussion}
                  onClick={() => onSelectDiscussion(discussion)}
                  isPinned={true}
                />
              ))}
            </div>
          )}

          {/* 普通讨论 */}
          {normalDiscussions.map((discussion) => (
            <DiscussionCard
              key={discussion.id}
              discussion={discussion}
              onClick={() => onSelectDiscussion(discussion)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 讨论卡片组件
interface DiscussionCardProps {
  discussion: Discussion;
  onClick: () => void;
  isPinned?: boolean;
}

const DiscussionCard: React.FC<DiscussionCardProps> = ({ discussion, onClick, isPinned }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white p-6 rounded-3xl border-2 hover:border-indigo-200 transition-all cursor-pointer group ${
        isPinned ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'
      } ${discussion.isHidden ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-4">
        {/* 左侧统计信息 */}
        <div className="flex flex-col items-center gap-2 min-w-[60px]">
          <div className="text-center">
            <div className="text-2xl font-black text-gray-800">{discussion.likeCount}</div>
            <div className="text-xs text-gray-400">点赞</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-indigo-600">{discussion.commentCount}</div>
            <div className="text-xs text-gray-400">回复</div>
          </div>
        </div>

        {/* 主要内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-lg font-black text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
              {isPinned && (
                <i className="fa-solid fa-thumbtack text-amber-500 mr-2"></i>
              )}
              {discussion.isHidden && (
                <i className="fa-solid fa-eye-slash text-gray-400 mr-2"></i>
              )}
              {discussion.title}
            </h3>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {discussion.content}
          </p>

          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="font-medium">
              <i className="fa-solid fa-user mr-1"></i>
              {discussion.authorName}
            </span>
            <span>
              <i className="fa-solid fa-clock mr-1"></i>
              {formatDate(discussion.lastActivityAt)}
            </span>
            <span>
              <i className="fa-solid fa-eye mr-1"></i>
              {discussion.viewCount} 浏览
            </span>
            {discussion.questionId && (
              <span className="text-indigo-600">
                <i className="fa-solid fa-link mr-1"></i>
                关联题目
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionList;
