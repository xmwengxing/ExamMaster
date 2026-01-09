import React, { useState, useEffect } from 'react';
import { Discussion, Comment, Question } from '../types';
import { useAppStore } from '../store';
import CommentTree from './CommentTree';

interface DiscussionDetailProps {
  discussionId: string;
  onBack: () => void;
  onEdit?: (discussion: Discussion) => void;
  onDelete?: (discussionId: string) => void;
  currentUserId?: string;
  isAdmin?: boolean;
}

const DiscussionDetail: React.FC<DiscussionDetailProps> = ({ 
  discussionId,
  onBack,
  onEdit,
  onDelete,
  currentUserId,
  isAdmin = false
}) => {
  const store = useAppStore();
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedQuestion, setRelatedQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    loadDiscussionDetail();
  }, [discussionId]);

  const loadDiscussionDetail = async () => {
    setIsLoading(true);
    try {
      // 加载讨论详情
      const discussionData = await store.fetchDiscussion(discussionId);
      
      if (!discussionData) {
        throw new Error('讨论数据为空');
      }
      
      setDiscussion(discussionData);
      setLikeCount(discussionData.likeCount || 0);

      // 加载评论
      const commentsData = await store.fetchComments(discussionId);
      setComments(commentsData);

      // 如果有关联题目，加载题目信息
      if (discussionData.questionId) {
        const question = store.questions.find(q => q.id === discussionData.questionId);
        if (question) {
          setRelatedQuestion(question);
        }
      }
    } catch (error: any) {
      console.error('[DiscussionDetail] 加载失败:', error);
      alert('加载讨论失败：' + (error.message || '未知错误'));
      onBack(); // 加载失败时返回列表
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) {
      return alert('请输入评论内容');
    }

    setIsSubmitting(true);
    try {
      await store.createComment(discussionId, {
        content: newComment.trim()
      });
      setNewComment('');
      await loadDiscussionDetail(); // 重新加载评论
    } catch (error: any) {
      console.error('[DiscussionDetail] 发表评论失败:', error);
      alert('发表评论失败：' + (error.message || '未知错误'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async () => {
    try {
      await store.toggleDiscussionLike(discussionId);
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error: any) {
      console.error('[DiscussionDetail] 点赞失败:', error);
    }
  };

  const handleTogglePin = async () => {
    if (!discussion) return;
    try {
      const updated = await store.toggleDiscussionPin(discussionId);
      setDiscussion(updated);
    } catch (error: any) {
      console.error('[DiscussionDetail] 置顶操作失败:', error);
      alert('操作失败：' + (error.message || '未知错误'));
    }
  };

  const handleToggleVisibility = async () => {
    if (!discussion) return;
    try {
      const updated = await store.toggleDiscussionVisibility(discussionId);
      setDiscussion(updated);
    } catch (error: any) {
      console.error('[DiscussionDetail] 可见性操作失败:', error);
      alert('操作失败：' + (error.message || '未知错误'));
    }
  };

  const handleDelete = async () => {
    if (!discussion) return;
    if (!confirm('确定删除这个讨论吗？\n\n删除后将无法恢复，且所有评论也会被删除。')) {
      return;
    }

    try {
      await store.deleteDiscussion(discussionId);
      if (onDelete) {
        onDelete(discussionId);
      }
      onBack();
    } catch (error: any) {
      console.error('[DiscussionDetail] 删除失败:', error);
      alert('删除失败：' + (error.message || '未知错误'));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <i className="fa-solid fa-spinner animate-spin text-3xl text-indigo-600"></i>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="text-center py-12">
        <i className="fa-solid fa-exclamation-circle text-5xl text-gray-300 mb-4"></i>
        <p className="text-gray-400 font-medium mb-4">讨论不存在或已被删除</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-colors"
        >
          返回列表
        </button>
      </div>
    );
  }

  const canEdit = currentUserId && currentUserId === discussion.authorId;
  const canManage = isAdmin;

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-bold transition-colors"
      >
        <i className="fa-solid fa-arrow-left"></i>
        返回列表
      </button>

      {/* 讨论主体 */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-gray-100">
        {/* 标题和状态标识 */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 flex-1">
              {discussion.isPinned && (
                <i className="fa-solid fa-thumbtack text-amber-500 mr-2"></i>
              )}
              {discussion.isHidden && (
                <i className="fa-solid fa-eye-slash text-gray-400 mr-2"></i>
              )}
              {discussion.title}
            </h1>

            {/* 操作按钮 */}
            {(canEdit || canManage) && (
              <div className="flex gap-2">
                {canEdit && onEdit && (
                  <button
                    onClick={() => onEdit(discussion)}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 flex items-center justify-center transition-colors"
                    title="编辑"
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
                )}
                {canManage && (
                  <>
                    <button
                      onClick={handleTogglePin}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        discussion.isPinned
                          ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={discussion.isPinned ? '取消置顶' : '置顶'}
                    >
                      <i className="fa-solid fa-thumbtack"></i>
                    </button>
                    <button
                      onClick={handleToggleVisibility}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        discussion.isHidden
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                      title={discussion.isHidden ? '显示' : '隐藏'}
                    >
                      <i className={`fa-solid fa-eye${discussion.isHidden ? '-slash' : ''}`}></i>
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-rose-50 text-gray-600 hover:text-rose-500 flex items-center justify-center transition-colors"
                      title="删除"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 元信息 */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <i className="fa-solid fa-user"></i>
              {discussion.authorName}
            </span>
            <span className="flex items-center gap-1">
              <i className="fa-solid fa-clock"></i>
              {formatDate(discussion.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <i className="fa-solid fa-eye"></i>
              {discussion.viewCount} 浏览
            </span>
          </div>
        </div>

        {/* 关联题目 */}
        {relatedQuestion && (
          <div className="mb-6 p-4 bg-indigo-50 rounded-2xl border-2 border-indigo-100">
            <div className="flex items-start gap-3">
              <i className="fa-solid fa-link text-indigo-600 mt-1"></i>
              <div className="flex-1">
                <div className="text-xs font-bold text-indigo-600 mb-1">关联题目</div>
                <div className="text-sm text-gray-700 line-clamp-2">{relatedQuestion.content}</div>
              </div>
            </div>
          </div>
        )}

        {/* 讨论内容 */}
        <div className="prose max-w-none mb-6">
          <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {discussion.content}
          </div>
        </div>

        {/* 互动按钮 */}
        <div className="flex items-center gap-4 pt-6 border-t-2 border-gray-100">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors ${
              isLiked
                ? 'bg-rose-100 text-rose-600'
                : 'bg-gray-100 text-gray-600 hover:bg-rose-50 hover:text-rose-500'
            }`}
          >
            <i className={`fa-${isLiked ? 'solid' : 'regular'} fa-heart`}></i>
            <span>{likeCount}</span>
          </button>
          <div className="flex items-center gap-2 text-gray-600">
            <i className="fa-solid fa-comment"></i>
            <span className="font-bold">{discussion.commentCount} 条评论</span>
          </div>
        </div>
      </div>

      {/* 发表评论 */}
      <div className="bg-white p-6 rounded-3xl border-2 border-gray-100">
        <h3 className="text-lg font-black text-gray-900 mb-4">发表评论</h3>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="说说你的看法..."
          className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none mb-3"
          rows={4}
        />
        <button
          onClick={handlePostComment}
          disabled={isSubmitting}
          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <><i className="fa-solid fa-spinner animate-spin mr-2"></i>发送中...</>
          ) : (
            <><i className="fa-solid fa-paper-plane mr-2"></i>发表评论</>
          )}
        </button>
      </div>

      {/* 评论列表 */}
      <div className="bg-white p-6 rounded-3xl border-2 border-gray-100">
        <h3 className="text-lg font-black text-gray-900 mb-4">
          全部评论 ({comments.length})
        </h3>
        <CommentTree
          comments={comments}
          discussionId={discussionId}
          onCommentAdded={loadDiscussionDetail}
          onCommentDeleted={loadDiscussionDetail}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
};

export default DiscussionDetail;
