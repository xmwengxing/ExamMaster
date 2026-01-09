import React, { useState } from 'react';
import { Comment } from '../types';
import { useAppStore } from '../store';

interface CommentTreeProps {
  comments: Comment[];
  discussionId: string;
  onCommentAdded: () => void;
  onCommentDeleted: () => void;
  currentUserId?: string;
  isAdmin?: boolean;
}

const CommentTree: React.FC<CommentTreeProps> = ({ 
  comments, 
  discussionId,
  onCommentAdded,
  onCommentDeleted,
  currentUserId,
  isAdmin = false
}) => {
  // 构建评论树结构
  const buildCommentTree = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment & { children: Comment[] }>();
    const rootComments: (Comment & { children: Comment[] })[] = [];

    // 初始化所有评论
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, children: [] });
    });

    // 构建树结构
    comments.forEach(comment => {
      const commentWithChildren = commentMap.get(comment.id)!;
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.children.push(commentWithChildren);
        } else {
          // 父评论不存在，作为根评论
          rootComments.push(commentWithChildren);
        }
      } else {
        rootComments.push(commentWithChildren);
      }
    });

    return rootComments;
  };

  const commentTree = buildCommentTree(comments);

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <i className="fa-solid fa-comment text-3xl mb-2"></i>
        <p className="text-sm">暂无评论，来发表第一条评论吧</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {commentTree.map(comment => (
        <CommentNode
          key={comment.id}
          comment={comment}
          discussionId={discussionId}
          onCommentAdded={onCommentAdded}
          onCommentDeleted={onCommentDeleted}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          level={0}
        />
      ))}
    </div>
  );
};

// 评论节点组件
interface CommentNodeProps {
  comment: Comment & { children?: Comment[] };
  discussionId: string;
  onCommentAdded: () => void;
  onCommentDeleted: () => void;
  currentUserId?: string;
  isAdmin?: boolean;
  level: number;
}

const CommentNode: React.FC<CommentNodeProps> = ({ 
  comment, 
  discussionId,
  onCommentAdded,
  onCommentDeleted,
  currentUserId,
  isAdmin,
  level 
}) => {
  const store = useAppStore();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likeCount);

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

  const handleReply = async () => {
    if (!replyContent.trim()) {
      return alert('请输入回复内容');
    }

    setIsSubmitting(true);
    try {
      await store.createComment(discussionId, {
        content: replyContent.trim(),
        parentId: comment.id
      });
      setReplyContent('');
      setIsReplying(false);
      onCommentAdded();
    } catch (error: any) {
      console.error('[CommentNode] 回复失败:', error);
      alert('回复失败：' + (error.message || '未知错误'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定删除这条评论吗？\n\n删除后将无法恢复，且所有子评论也会被删除。')) {
      return;
    }

    try {
      await store.deleteComment(comment.id);
      onCommentDeleted();
    } catch (error: any) {
      console.error('[CommentNode] 删除失败:', error);
      alert('删除失败：' + (error.message || '未知错误'));
    }
  };

  const handleLike = async () => {
    try {
      await store.toggleCommentLike(comment.id);
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error: any) {
      console.error('[CommentNode] 点赞失败:', error);
    }
  };

  const canDelete = isAdmin || (currentUserId && currentUserId === comment.authorId);
  const maxLevel = 3; // 最大嵌套层级

  return (
    <div className={`${level > 0 ? 'ml-8 md:ml-12' : ''}`}>
      <div className="bg-white p-4 rounded-2xl border-2 border-gray-100">
        {/* 评论头部 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-user text-indigo-600"></i>
            </div>
            <div>
              <div className="font-bold text-gray-900">{comment.authorName}</div>
              <div className="text-xs text-gray-400">{formatDate(comment.createdAt)}</div>
            </div>
          </div>

          {canDelete && (
            <button
              onClick={handleDelete}
              className="text-gray-400 hover:text-rose-500 transition-colors"
              title="删除评论"
            >
              <i className="fa-solid fa-trash text-sm"></i>
            </button>
          )}
        </div>

        {/* 评论内容 */}
        <div className="text-gray-700 mb-3 whitespace-pre-wrap">
          {comment.content}
        </div>

        {/* 评论操作 */}
        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 transition-colors ${
              isLiked ? 'text-rose-500' : 'text-gray-400 hover:text-rose-500'
            }`}
          >
            <i className={`fa-${isLiked ? 'solid' : 'regular'} fa-heart`}></i>
            <span>{likeCount}</span>
          </button>

          {level < maxLevel && (
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="text-gray-400 hover:text-indigo-600 transition-colors"
            >
              <i className="fa-solid fa-reply mr-1"></i>
              回复
            </button>
          )}
        </div>

        {/* 回复输入框 */}
        {isReplying && (
          <div className="mt-4 space-y-3">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`回复 @${comment.authorName}`}
              className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleReply}
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <><i className="fa-solid fa-spinner animate-spin mr-2"></i>发送中...</>
                ) : (
                  '发送回复'
                )}
              </button>
              <button
                onClick={() => {
                  setIsReplying(false);
                  setReplyContent('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 子评论 */}
      {comment.children && comment.children.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.children.map(child => (
            <CommentNode
              key={child.id}
              comment={child}
              discussionId={discussionId}
              onCommentAdded={onCommentAdded}
              onCommentDeleted={onCommentDeleted}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentTree;
