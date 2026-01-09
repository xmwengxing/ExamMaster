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

  useEffect(() => {
    loadDiscussions();
  }, [sortBy, filterQuestionId, showHidden]);

  const loadDiscussions = async () => {
    setIsLoading(true);
    try {
      const result = await store.fetchDiscussions({
        questionId: filterQuestionId,
        sortBy,
        includeHidden: showHidden
      });
      setDiscussions(result);
    } catch (error: any) {
      console.error('[DiscussionList] 加载讨论失败:', error);
      alert('加载讨论失败：' + (error.message || '未知错误'));
    } finally {
      setIsLoading(false);
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

  // 分离置顶和普通讨论
  const pinnedDiscussions = discussions.filter(d => d.isPinned);
  const normalDiscussions = discussions.filter(d => !d.isPinned);

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-black text-gray-900">讨论区</h2>
          <span className="text-sm text-gray-400">({discussions.length})</span>
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

      {/* 讨论列表 */}
      {discussions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border">
          <i className="fa-solid fa-comments text-5xl text-gray-300 mb-4"></i>
          <p className="text-gray-400 font-medium">暂无讨论，发起第一个讨论吧</p>
          <button
            onClick={onCreateNew}
            className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-colors"
          >
            发起讨论
          </button>
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
