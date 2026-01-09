import React, { useState, useEffect } from 'react';
import { Discussion } from '../types';
import { useAppStore } from '../store';

interface QuestionDiscussionsProps {
  questionId: string;
  onNavigateToDiscussions: (questionId: string) => void;
}

const QuestionDiscussions: React.FC<QuestionDiscussionsProps> = ({ 
  questionId, 
  onNavigateToDiscussions 
}) => {
  const store = useAppStore();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDiscussions();
  }, [questionId]);

  const loadDiscussions = async () => {
    setIsLoading(true);
    try {
      const result = await store.fetchQuestionDiscussions(questionId);
      setDiscussions(result.slice(0, 3)); // 只显示前3条
    } catch (error: any) {
      console.error('[QuestionDiscussions] 加载失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return '今天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  if (isLoading) {
    return (
      <div className="w-full p-6 bg-white rounded-3xl border-2 border-gray-100">
        <div className="flex items-center justify-center py-4">
          <i className="fa-solid fa-spinner animate-spin text-gray-400"></i>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 bg-white rounded-3xl border-2 border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
          <i className="fa-solid fa-comments text-indigo-600"></i>
          相关讨论 ({discussions.length})
        </h3>
        <button
          onClick={() => onNavigateToDiscussions(questionId)}
          className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          查看全部 <i className="fa-solid fa-arrow-right ml-1"></i>
        </button>
      </div>

      {discussions.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <i className="fa-solid fa-comment-slash text-2xl mb-2"></i>
          <p className="text-sm">暂无相关讨论</p>
          <button
            onClick={() => onNavigateToDiscussions(questionId)}
            className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors"
          >
            <i className="fa-solid fa-plus mr-1"></i>
            发起讨论
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {discussions.map(discussion => (
            <div
              key={discussion.id}
              onClick={() => onNavigateToDiscussions(questionId)}
              className="p-4 bg-gray-50 rounded-2xl hover:bg-indigo-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1 flex-1">
                  {discussion.title}
                </h4>
                {discussion.isPinned && (
                  <i className="fa-solid fa-thumbtack text-amber-500 text-xs"></i>
                )}
              </div>
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {discussion.content}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>
                  <i className="fa-solid fa-user mr-1"></i>
                  {discussion.authorName}
                </span>
                <span>
                  <i className="fa-solid fa-clock mr-1"></i>
                  {formatDate(discussion.createdAt)}
                </span>
                <span>
                  <i className="fa-solid fa-comment mr-1"></i>
                  {discussion.commentCount}
                </span>
                <span>
                  <i className="fa-solid fa-heart mr-1"></i>
                  {discussion.likeCount}
                </span>
              </div>
            </div>
          ))}
          
          {discussions.length > 0 && (
            <button
              onClick={() => onNavigateToDiscussions(questionId)}
              className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-bold text-sm hover:bg-indigo-100 transition-colors"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              发起新讨论
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionDiscussions;
