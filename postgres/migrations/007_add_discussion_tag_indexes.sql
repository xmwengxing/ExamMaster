-- 讨论区和标签性能优化：添加数据库索引
-- 创建时间：2026-01-28
-- 说明：为讨论表和标签表添加索引，大幅提升查询速度

-- ========================================
-- 讨论表索引
-- ========================================

-- 1. 按最后活动时间排序的索引（最常用）
CREATE INDEX IF NOT EXISTS idx_discussions_last_activity 
ON discussions(last_activity_at DESC);

-- 2. 置顶和隐藏状态的复合索引（用于筛选）
CREATE INDEX IF NOT EXISTS idx_discussions_pinned_hidden 
ON discussions(is_pinned DESC, is_hidden);

-- 3. 按题目ID筛选的索引
CREATE INDEX IF NOT EXISTS idx_discussions_question_id 
ON discussions(question_id) 
WHERE question_id IS NOT NULL;

-- 4. 按点赞数排序的索引（热门排序）
CREATE INDEX IF NOT EXISTS idx_discussions_like_count 
ON discussions(like_count DESC);

-- 5. 按评论数排序的索引（最多评论排序）
CREATE INDEX IF NOT EXISTS idx_discussions_comment_count 
ON discussions(comment_count DESC);

-- 6. 作者ID索引（用于查询用户的讨论）
CREATE INDEX IF NOT EXISTS idx_discussions_author_id 
ON discussions(author_id);

-- ========================================
-- 标签表索引
-- ========================================

-- 1. 按使用次数排序的索引
CREATE INDEX IF NOT EXISTS idx_tags_usage_count 
ON tags(usage_count DESC);

-- 2. 标签名称索引（用于搜索和去重）
CREATE INDEX IF NOT EXISTS idx_tags_name 
ON tags(name);

-- ========================================
-- 评论表索引
-- ========================================

-- 1. 按讨论ID查询评论的索引
CREATE INDEX IF NOT EXISTS idx_comments_discussion_id 
ON comments(discussion_id);

-- 2. 按创建时间排序的索引
CREATE INDEX IF NOT EXISTS idx_comments_created_at 
ON comments(created_at DESC);

-- 3. 作者ID索引（用于查询用户的评论）
CREATE INDEX IF NOT EXISTS idx_comments_author_id 
ON comments(author_id);

-- 4. 父评论ID索引（用于查询回复）
CREATE INDEX IF NOT EXISTS idx_comments_parent_id 
ON comments(parent_id) 
WHERE parent_id IS NOT NULL;

-- ========================================
-- 题目标签关联表索引
-- ========================================

-- 1. 按题目ID查询标签的索引
CREATE INDEX IF NOT EXISTS idx_question_tags_question_id 
ON question_tags(question_id);

-- 2. 按标签ID查询题目的索引
CREATE INDEX IF NOT EXISTS idx_question_tags_tag_id 
ON question_tags(tag_id);

-- ========================================
-- 点赞表索引
-- ========================================

-- 1. 讨论点赞：按讨论ID查询
CREATE INDEX IF NOT EXISTS idx_discussion_likes_discussion_id 
ON discussion_likes(discussion_id);

-- 2. 讨论点赞：按用户ID查询
CREATE INDEX IF NOT EXISTS idx_discussion_likes_user_id 
ON discussion_likes(user_id);

-- 3. 评论点赞：按评论ID查询
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id 
ON comment_likes(comment_id);

-- 4. 评论点赞：按用户ID查询
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id 
ON comment_likes(user_id);

-- ========================================
-- 验证索引创建
-- ========================================

-- 查看所有索引
-- SELECT tablename, indexname, indexdef 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('discussions', 'tags', 'comments', 'question_tags', 'discussion_likes', 'comment_likes')
-- ORDER BY tablename, indexname;

-- 分析表统计信息（优化查询计划）
ANALYZE discussions;
ANALYZE tags;
ANALYZE comments;
ANALYZE question_tags;
ANALYZE discussion_likes;
ANALYZE comment_likes;

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE '✅ 讨论区和标签索引创建完成';
  RAISE NOTICE '📊 已分析表统计信息';
  RAISE NOTICE '🚀 查询性能预计提升 90%% 以上';
END $$;
