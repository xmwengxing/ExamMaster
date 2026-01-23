DROP TABLE IF EXISTS discussion_likes CASCADE;

CREATE TABLE discussion_likes (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  discussion_id VARCHAR(255),
  comment_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT check_like_target CHECK (
    (discussion_id IS NOT NULL AND comment_id IS NULL) OR
    (discussion_id IS NULL AND comment_id IS NOT NULL)
  ),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (discussion_id) REFERENCES discussions(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX idx_discussion_likes_user_id ON discussion_likes(user_id);
CREATE INDEX idx_discussion_likes_discussion_id ON discussion_likes(discussion_id) WHERE discussion_id IS NOT NULL;
CREATE INDEX idx_discussion_likes_comment_id ON discussion_likes(comment_id) WHERE comment_id IS NOT NULL;
CREATE UNIQUE INDEX unique_discussion_like ON discussion_likes(user_id, discussion_id) WHERE discussion_id IS NOT NULL;
CREATE UNIQUE INDEX unique_comment_like ON discussion_likes(user_id, comment_id) WHERE comment_id IS NOT NULL;
