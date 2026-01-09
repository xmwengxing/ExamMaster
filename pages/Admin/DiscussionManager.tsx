import React, { useState, useEffect } from 'react';
import { Discussion, Comment } from '../../types';
import { useAppStore } from '../../store';

type ViewMode = 'list' | 'detail';

const DiscussionManager: React.FC = () => {
  const store = useAppStore();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<'latest' | 'hot' | 'mostCommented'>('latest');
  const [filterHidden, setFilterHidden] = useState<'all' | 'visible' | 'hidden'>('all');

  useEffect(() => {
    loadDiscussions();
  }, [sortBy]);

  const loadDiscussions = async () => {
    setIsLoading(true);
    try {
      const result = await store.fetchDiscussions({
        sortBy,
        includeHidden: true
      });
      setDiscussions(result);
    } catch (error: any) {
      console.error('[DiscussionManager] 加载讨论失败:', error);
      alert('加载讨论失败：' + (error.message || '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async (discussionId: string) => {
    try {
      const result = await store.fetchComments(discussionId);
      setComments(result);
    } catch (error: any) {
      console.error('[DiscussionManager] 加载评论失败:', error);
    }
  };

  const handleSelectDiscussion = async (discussion: Discussion) => {
    setSelectedDiscussion(discussion);
    setViewMode('detail');
    await loadComments(discussion.id);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedDiscussion(null);
    setComments([]);
  };

  const handleTogglePin = async (discussion: Discussion) => {
    try {
      await store.toggleDiscussionPin(discussion.id);
      await loadDiscussions();
      if (selectedDiscussion?.id === discussion.id) {
        const updated = await store.fetchDiscussion(discussion.id);
        setSelectedDiscussion(updated);
      }
    } catch (error: any) {
      console.error('[DiscussionManager] 置顶操作失败:', error);
      alert('操作失败：' + (error.message || '未知错误'));
    }
  };

  const handleToggleVisibility = async (discussion: Discussion) => {
    try {
      await store.toggleDiscussionVisibility(discussion.id);
      await loadDiscussions();
      if (selectedDiscussion?.id === discussion.id) {
        const updated = await store.fetchDiscussion(discussion.id);
        setSelectedDiscussion(updated);
      }
    } catch (error: any) {
      console.error('[DiscussionManager] 可见性操作失败:', error);
      alert('操作失败：' + (error.message || '未知错误'));
    }
  };

  const handleDeleteDiscussion = async (discussion: Discussion) => {
    if (!confirm(`确定删除讨论"${discussion.title}"吗？\n\n此操作将删除该讨论及其所有评论，无法恢复。`)) {
      return;
    }

    try {
      await store.deleteDiscussion(discussion.id);
      await loadDiscussions();
      if (selectedDiscussion?.id === discussion.id) {
        handleBackToList();
      }
      alert('✓ 讨论已删除');
    } catch (error: any) {
      console.error('[DiscussionManager] 删除讨论失败:', error);
      alert('删除失败：' + (error.message || '未知错误'));
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    if (!confirm('确定删除这条评论吗？\n\n此操作将删除该评论及其所有回复，无法恢复。')) {
      return;
    }

    try {
      await store.deleteComment(comment.id);
      if (selectedDiscussion) {
        await loadComments(selectedDiscussion.id);
        // 刷新讨论以更新评论计数
        const updated = await store.fetchDiscussion(selectedDiscussion.id);
        setSelectedDiscussion(updated);
      }
      alert('✓ 评论已删除');
    } catch (error: any) {
      console.error('[DiscussionManager] 删除评论失败:', error);
      alert('删除失败：' + (error.message || '未知错误'));
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  // 筛选讨论
  const filteredDiscussions = discussions.filter(d => {
    if (filterHidden === 'visible') return !d.isHidden;
    if (filterHidden === 'hidden') return d.isHidden;
    return true;
  });

  // 构建评论树
  const buildCommentTree = (comments: Comment[]): (Comment & { children: Comment[] })[] => {
    const commentMap = new Map<string, Comment & { children: Comment[] }>();
    const rootComments: (Comment & { children: Comment[] })[] = [];

    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, children: [] });
    });

    comments.forEach(comment => {
      const commentWithChildren = commentMap.get(comment.id)!;
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.children.push(commentWithChildren);
        } else {
          rootComments.push(commentWithChildren);
        }
      } else {
        rootComments.push(commentWithChildren);
      }
    });

    return rootComments;
  };

  if (isLoading && viewMode === 'list') {
    return (
      <div className="flex items-center justify-center p-12">
        <i className="fa-solid fa-spinner animate-spin text-3xl text-indigo-600"></i>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {viewMode === 'list' ? (
        <>
          {/* 标题和工具栏 */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-gray-900">讨论管理</h2>
              <p className="text-sm text-gray-500 mt-1">管理所有讨论，包括隐藏、置顶和删除</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* 筛选 */}
              <select
                value={filterHidden}
                onChange={(e) => setFilterHidden(e.target.value as any)}
                className="px-4 py-2 border-2 border-gray-100 rounded-xl font-medium text-sm outline-none"
              >
                <option value="all">全部 ({discussions.length})</option>
                <option value="visible">可见 ({discussions.filter(d => !d.isHidden).length})</option>
                <option value="hidden">隐藏 ({discussions.filter(d => d.isHidden).length})</option>
              </select>

              {/* 排序 */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border-2 border-gray-100 rounded-xl font-medium text-sm outline-none"
              >
                <option value="latest">最新发布</option>
                <option value="hot">最热讨论</option>
                <option value="mostCommented">最多评论</option>
              </select>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border-2 border-gray-100">
              <div className="text-2xl font-black text-gray-900">{discussions.length}</div>
              <div className="text-xs text-gray-500">总讨论数</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border-2 border-gray-100">
              <div className="text-2xl font-black text-amber-600">{discussions.filter(d => d.isPinned).length}</div>
              <div className="text-xs text-gray-500">置顶讨论</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border-2 border-gray-100">
              <div className="text-2xl font-black text-gray-400">{discussions.filter(d => d.isHidden).length}</div>
              <div className="text-xs text-gray-500">隐藏讨论</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border-2 border-gray-100">
              <div className="text-2xl font-black text-indigo-600">{discussions.reduce((sum, d) => sum + d.commentCount, 0)}</div>
              <div className="text-xs text-gray-500">总评论数</div>
            </div>
          </div>

          {/* 讨论列表 */}
          <div className="bg-white rounded-3xl border-2 border-gray-100 overflow-hidden">
            {filteredDiscussions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <i className="fa-solid fa-comments text-4xl mb-3"></i>
                <p className="text-sm font-medium">暂无讨论</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredDiscussions.map(discussion => (
                  <div
                    key={discussion.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      discussion.isHidden ? 'bg-gray-50 opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* 状态标识 */}
                      <div className="flex flex-col gap-1 min-w-[60px]">
                        {discussion.isPinned && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-600 rounded-lg text-xs font-bold text-center">
                            置顶
                          </span>
                        )}
                        {discussion.isHidden && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-lg text-xs font-bold text-center">
                            隐藏
                          </span>
                        )}
                      </div>

                      {/* 主要内容 */}
                      <div className="flex-1 min-w-0">
                        <h3 
                          onClick={() => handleSelectDiscussion(discussion)}
                          className="font-bold text-gray-900 hover:text-indigo-600 cursor-pointer line-clamp-1"
                        >
                          {discussion.title}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                          {discussion.content}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span>{discussion.authorName}</span>
                          <span>{formatDate(discussion.createdAt)}</span>
                          <span><i className="fa-solid fa-eye mr-1"></i>{discussion.viewCount}</span>
                          <span><i className="fa-solid fa-heart mr-1"></i>{discussion.likeCount}</span>
                          <span><i className="fa-solid fa-comment mr-1"></i>{discussion.commentCount}</span>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTogglePin(discussion)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                            discussion.isPinned
                              ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                          title={discussion.isPinned ? '取消置顶' : '置顶'}
                        >
                          <i className="fa-solid fa-thumbtack text-sm"></i>
                        </button>
                        <button
                          onClick={() => handleToggleVisibility(discussion)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                            discussion.isHidden
                              ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              : 'bg-green-100 text-green-600 hover:bg-green-200'
                          }`}
                          title={discussion.isHidden ? '显示' : '隐藏'}
                        >
                          <i className={`fa-solid fa-eye${discussion.isHidden ? '-slash' : ''} text-sm`}></i>
                        </button>
                        <button
                          onClick={() => handleDeleteDiscussion(discussion)}
                          className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 hover:bg-rose-100 hover:text-rose-500 flex items-center justify-center transition-colors"
                          title="删除"
                        >
                          <i className="fa-solid fa-trash text-sm"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* 详情视图 */
        selectedDiscussion && (
          <div className="space-y-6">
            {/* 返回按钮 */}
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-bold transition-colors"
            >
              <i className="fa-solid fa-arrow-left"></i>
              返回列表
            </button>

            {/* 讨论详情 */}
            <div className="bg-white p-6 rounded-3xl border-2 border-gray-100">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedDiscussion.isPinned && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-600 rounded-lg text-xs font-bold">
                        置顶
                      </span>
                    )}
                    {selectedDiscussion.isHidden && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-lg text-xs font-bold">
                        隐藏
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-gray-900">{selectedDiscussion.title}</h2>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>{selectedDiscussion.authorName}</span>
                    <span>{formatDate(selectedDiscussion.createdAt)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleTogglePin(selectedDiscussion)}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                      selectedDiscussion.isPinned
                        ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <i className="fa-solid fa-thumbtack mr-2"></i>
                    {selectedDiscussion.isPinned ? '取消置顶' : '置顶'}
                  </button>
                  <button
                    onClick={() => handleToggleVisibility(selectedDiscussion)}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                      selectedDiscussion.isHidden
                        ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                  >
                    <i className={`fa-solid fa-eye${selectedDiscussion.isHidden ? '-slash' : ''} mr-2`}></i>
                    {selectedDiscussion.isHidden ? '显示' : '隐藏'}
                  </button>
                  <button
                    onClick={() => handleDeleteDiscussion(selectedDiscussion)}
                    className="px-4 py-2 rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-200 font-bold text-sm transition-colors"
                  >
                    <i className="fa-solid fa-trash mr-2"></i>
                    删除
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl text-gray-700 whitespace-pre-wrap">
                {selectedDiscussion.content}
              </div>

              <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                <span><i className="fa-solid fa-eye mr-1"></i>{selectedDiscussion.viewCount} 浏览</span>
                <span><i className="fa-solid fa-heart mr-1"></i>{selectedDiscussion.likeCount} 点赞</span>
                <span><i className="fa-solid fa-comment mr-1"></i>{selectedDiscussion.commentCount} 评论</span>
              </div>
            </div>

            {/* 评论管理 */}
            <div className="bg-white p-6 rounded-3xl border-2 border-gray-100">
              <h3 className="text-lg font-black text-gray-900 mb-4">
                评论管理 ({comments.length})
              </h3>

              {comments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <i className="fa-solid fa-comment text-3xl mb-2"></i>
                  <p className="text-sm">暂无评论</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {buildCommentTree(comments).map(comment => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onDelete={handleDeleteComment}
                      level={0}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
};

// 评论项组件
interface CommentItemProps {
  comment: Comment & { children?: Comment[] };
  onDelete: (comment: Comment) => void;
  level: number;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onDelete, level }) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  return (
    <div className={`${level > 0 ? 'ml-8' : ''}`}>
      <div className="p-4 bg-gray-50 rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-gray-900">{comment.authorName}</span>
              <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              <span><i className="fa-solid fa-heart mr-1"></i>{comment.likeCount}</span>
            </div>
          </div>
          <button
            onClick={() => onDelete(comment)}
            className="w-8 h-8 rounded-lg bg-white hover:bg-rose-50 text-gray-400 hover:text-rose-500 flex items-center justify-center transition-colors"
            title="删除评论"
          >
            <i className="fa-solid fa-trash text-xs"></i>
          </button>
        </div>
      </div>

      {/* 子评论 */}
      {comment.children && comment.children.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.children.map(child => (
            <CommentItem
              key={child.id}
              comment={child}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscussionManager;
