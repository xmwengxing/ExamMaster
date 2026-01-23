-- 修复 discussion_likes 表结构
-- 问题：discussion_id 和 comment_id 不能同时为 NOT NULL，因为点赞要么针对讨论，要么针对评论

-- 1. 删除旧表（如果存在数据，请先备份）
DROP TABLE IF EXISTS discussion_likes CASCADE;

-- 2. 重新创建表，允许 discussion_id 和 comment_id 为 NULL
CREATE TABLE discussion_likes (
  user_id VARCHAR(255) NOT NULL,
  discussion_id VARCHAR(255),
  comment_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL,
  -- 添加约束：discussion_id 和 comment_id 必须有且只有一个不为 NULL
  CONSTRAINT check_like_target CHECK (
    (discussion_id IS NOT NULL AND comment_id IS NULL) OR
    (discussion_id IS NULL AND comment_id IS NOT NULL)
  ),
  -- 主键：根据点赞类型使用不同的组合
  PRIMARY KEY (user_id, COALESCE(discussion_id, ''), COALESCE(comment_id, '')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (discussion_id) REFERENCES discussions(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- 3. 创建索引
CREATE INDEX idx_discussion_likes_user_id ON discussion_likes(user_id);
CREATE INDEX idx_discussion_likes_discussion_id ON discussion_likes(discussion_id) WHERE discussion_id IS NOT NULL;
CREATE INDEX idx_discussion_likes_comment_id ON discussion_likes(comment_id) WHERE comment_id IS NOT NULL;

-- 4. 添加注释
COMMENT ON TABLE discussion_likes IS '点赞表：记录用户对讨论或评论的点赞';
COMMENT ON COLUMN discussion_likes.user_id IS '点赞用户ID';
COMMENT ON COLUMN discussion_likes.discussion_id IS '讨论ID（点赞讨论时使用）';
COMMENT ON COLUMN discussion_likes.comment_id IS '评论ID（点赞评论时使用）';
COMMENT ON COLUMN discussion_likes.created_at IS '点赞时间';
