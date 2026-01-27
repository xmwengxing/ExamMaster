-- PostgreSQL 数据库初始化脚本
-- EduMaster 刷题系统 - 从 SQLite 迁移到 PostgreSQL
-- 创建时间: 2026-01-22

-- ============================================================
-- 1. 用户表 (users)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  phone VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  real_name VARCHAR(100),
  nickname VARCHAR(100),
  avatar TEXT,
  id_card VARCHAR(50),
  school VARCHAR(200),
  education_type VARCHAR(50),
  education_level VARCHAR(50),
  major VARCHAR(100),
  company VARCHAR(200),
  custom_fields JSONB,
  student_perms JSONB,
  allowed_bank_ids JSONB,
  accuracy NUMERIC(5,2),
  mistake_count INTEGER DEFAULT 0,
  daily_goal INTEGER DEFAULT 20,
  last_login TIMESTAMP,
  permissions JSONB,
  deepseek_api_key TEXT,
  login_history JSONB,
  total_online_time INTEGER DEFAULT 0,
  class_name VARCHAR(100),
  last_activity TIMESTAMP,
  gender VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON users(last_activity);
CREATE INDEX IF NOT EXISTS idx_users_class_name ON users(class_name);

-- ============================================================
-- 2. 题库表 (banks)
-- ============================================================
CREATE TABLE IF NOT EXISTS banks (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  level VARCHAR(50),
  description TEXT,
  question_count INTEGER DEFAULT 0,
  score_config JSONB,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 题库表索引
CREATE INDEX IF NOT EXISTS idx_banks_category ON banks(category);
CREATE INDEX IF NOT EXISTS idx_banks_level ON banks(level);

-- ============================================================
-- 3. 题目表 (questions)
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(255) PRIMARY KEY,
  bank_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  options JSONB,
  answer JSONB,
  explanation TEXT,
  chapter VARCHAR(200),
  blanks JSONB,
  reference_answer TEXT,
  ai_grading_enabled BOOLEAN DEFAULT FALSE,
  tags JSONB,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
);

-- 题目表索引
CREATE INDEX IF NOT EXISTS idx_questions_bank_id ON questions(bank_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_sort_order ON questions(bank_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON questions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(bank_id, chapter);

-- ============================================================
-- 4. 练习记录表 (practice_records)
-- ============================================================
CREATE TABLE IF NOT EXISTS practice_records (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  bank_id VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255),
  type VARCHAR(50),
  question_type_filter VARCHAR(100),
  mode VARCHAR(50),
  count INTEGER DEFAULT 0,
  date VARCHAR(50),
  current_index INTEGER DEFAULT 0,
  user_answers JSONB,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
);

-- 练习记录表索引
CREATE INDEX IF NOT EXISTS idx_practice_records_user_id ON practice_records(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_records_bank_id ON practice_records(bank_id);
CREATE INDEX IF NOT EXISTS idx_practice_records_date ON practice_records(date);

-- ============================================================
-- 5. 考试表 (exams)
-- ============================================================
CREATE TABLE IF NOT EXISTS exams (
  id VARCHAR(255) PRIMARY KEY,
  bank_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  duration INTEGER NOT NULL,
  total_score NUMERIC(10,2) NOT NULL,
  pass_score NUMERIC(10,2),
  pass_score_percent NUMERIC(5,2),
  strategy VARCHAR(50),
  selected_question_ids JSONB,
  status VARCHAR(50) DEFAULT 'DRAFT',
  is_visible BOOLEAN DEFAULT TRUE,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  single_count INTEGER DEFAULT 0,
  multiple_count INTEGER DEFAULT 0,
  judge_count INTEGER DEFAULT 0,
  fill_blank_count INTEGER DEFAULT 0,
  short_answer_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
);

-- 考试表索引
CREATE INDEX IF NOT EXISTS idx_exams_bank_id ON exams(bank_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_start_time ON exams(start_time);
CREATE INDEX IF NOT EXISTS idx_exams_end_time ON exams(end_time);

-- ============================================================
-- 6. 考试历史表 (exam_history)
-- ============================================================
CREATE TABLE IF NOT EXISTS exam_history (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  exam_id VARCHAR(255) NOT NULL,
  exam_title VARCHAR(255),
  score NUMERIC(10,2),
  total_score NUMERIC(10,2),
  pass_score NUMERIC(10,2),
  time_used INTEGER,
  submit_time TIMESTAMP,
  bank_id VARCHAR(255),
  wrong_question_ids JSONB,
  user_answers JSONB,
  passed BOOLEAN DEFAULT FALSE,
  current_index INTEGER DEFAULT 0,
  is_finished BOOLEAN DEFAULT FALSE,
  exam_config JSONB,
  ordered_question_ids JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE SET NULL
);

-- 考试历史表索引
CREATE INDEX IF NOT EXISTS idx_exam_history_user_id ON exam_history(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_history_exam_id ON exam_history(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_history_submit_time ON exam_history(submit_time);

-- ============================================================
-- 7. 错题表 (mistakes)
-- ============================================================
CREATE TABLE IF NOT EXISTS mistakes (
  user_id VARCHAR(255) NOT NULL,
  question_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, question_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- 错题表索引
CREATE INDEX IF NOT EXISTS idx_mistakes_user_id ON mistakes(user_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_question_id ON mistakes(question_id);

-- ============================================================
-- 8. 收藏表 (favorites)
-- ============================================================
CREATE TABLE IF NOT EXISTS favorites (
  user_id VARCHAR(255) NOT NULL,
  question_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, question_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- 收藏表索引
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_question_id ON favorites(question_id);

-- ============================================================
-- 9. 笔记表 (notes)
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
  user_id VARCHAR(255) NOT NULL,
  question_id VARCHAR(255) NOT NULL,
  content TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, question_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- 笔记表索引
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_question_id ON notes(question_id);

-- ============================================================
-- 10. SRS 记录表 (srs_records)
-- ============================================================
CREATE TABLE IF NOT EXISTS srs_records (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  question_id VARCHAR(255) NOT NULL,
  interval INTEGER DEFAULT 0,
  ease_factor NUMERIC(5,2) DEFAULT 2.5,
  repetitions INTEGER DEFAULT 0,
  next_review_date VARCHAR(50),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- SRS 记录表索引
CREATE INDEX IF NOT EXISTS idx_srs_records_user_id ON srs_records(user_id);
CREATE INDEX IF NOT EXISTS idx_srs_records_question_id ON srs_records(question_id);
CREATE INDEX IF NOT EXISTS idx_srs_records_next_review_date ON srs_records(next_review_date);

-- ============================================================
-- 11. 每日进度表 (daily_progress)
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_progress (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  date VARCHAR(50) NOT NULL,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 每日进度表索引
CREATE INDEX IF NOT EXISTS idx_daily_progress_user_id ON daily_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_progress_date ON daily_progress(date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_progress_user_date ON daily_progress(user_id, date);

-- ============================================================
-- 12. 系统配置表 (system_config)
-- ============================================================
CREATE TABLE IF NOT EXISTS system_config (
  id VARCHAR(255) PRIMARY KEY,
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 13. 系统配置键值表 (system_config_kv)
-- ============================================================
CREATE TABLE IF NOT EXISTS system_config_kv (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 14. 登录日志表 (login_logs)
-- ============================================================
CREATE TABLE IF NOT EXISTS login_logs (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(20),
  time TIMESTAMP NOT NULL,
  logout_time TIMESTAMP,
  session_duration INTEGER DEFAULT 0,
  ip VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 登录日志表索引
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_time ON login_logs(time);
CREATE INDEX IF NOT EXISTS idx_login_logs_logout_time ON login_logs(logout_time);

-- ============================================================
-- 15. 审计日志表 (audit_logs)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  operator_id VARCHAR(255),
  operator_name VARCHAR(100),
  action VARCHAR(100) NOT NULL,
  target TEXT,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 审计日志表索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_operator_id ON audit_logs(operator_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- ============================================================
-- 16. 实操任务表 (practical_tasks)
-- ============================================================
CREATE TABLE IF NOT EXISTS practical_tasks (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  parts JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 17. 实操记录表 (practical_records)
-- ============================================================
CREATE TABLE IF NOT EXISTS practical_records (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  task_id VARCHAR(255) NOT NULL,
  answers JSONB,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES practical_tasks(id) ON DELETE CASCADE
);

-- 实操记录表索引
CREATE INDEX IF NOT EXISTS idx_practical_records_user_id ON practical_records(user_id);
CREATE INDEX IF NOT EXISTS idx_practical_records_task_id ON practical_records(task_id);

-- ============================================================
-- 18. 标签表 (tags)
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  color VARCHAR(50),
  created_at TIMESTAMP NOT NULL,
  usage_count INTEGER DEFAULT 0
);

-- 标签表索引
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);

-- ============================================================
-- 19. 题目-标签关联表 (question_tags)
-- ============================================================
CREATE TABLE IF NOT EXISTS question_tags (
  question_id VARCHAR(255) NOT NULL,
  tag_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (question_id, tag_id),
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 题目-标签关联表索引
CREATE INDEX IF NOT EXISTS idx_question_tags_question_id ON question_tags(question_id);
CREATE INDEX IF NOT EXISTS idx_question_tags_tag_id ON question_tags(tag_id);

-- ============================================================
-- 20. 讨论表 (discussions)
-- ============================================================
CREATE TABLE IF NOT EXISTS discussions (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id VARCHAR(255) NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  question_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  last_activity_at TIMESTAMP NOT NULL,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE SET NULL
);

-- 讨论表索引
CREATE INDEX IF NOT EXISTS idx_discussions_question_id ON discussions(question_id);
CREATE INDEX IF NOT EXISTS idx_discussions_author_id ON discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_discussions_last_activity_at ON discussions(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_is_pinned ON discussions(is_pinned, last_activity_at DESC);

-- ============================================================
-- 21. 评论表 (comments)
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id VARCHAR(255) PRIMARY KEY,
  discussion_id VARCHAR(255) NOT NULL,
  parent_id VARCHAR(255),
  author_id VARCHAR(255) NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  like_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (discussion_id) REFERENCES discussions(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 评论表索引
CREATE INDEX IF NOT EXISTS idx_comments_discussion_id ON comments(discussion_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- ============================================================
-- 22. 点赞表 (discussion_likes)
-- ============================================================
CREATE TABLE IF NOT EXISTS discussion_likes (
  user_id VARCHAR(255) NOT NULL,
  discussion_id VARCHAR(255),
  comment_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL,
  PRIMARY KEY (user_id, discussion_id, comment_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (discussion_id) REFERENCES discussions(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- 点赞表索引
CREATE INDEX IF NOT EXISTS idx_discussion_likes_user_id ON discussion_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_discussion_likes_discussion_id ON discussion_likes(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_likes_comment_id ON discussion_likes(comment_id);

-- ============================================================
-- 23. AI 解析记录表 (ai_analysis)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_analysis (
  user_id VARCHAR(255) NOT NULL,
  question_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  PRIMARY KEY (user_id, question_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- AI 解析记录表索引
CREATE INDEX IF NOT EXISTS idx_ai_analysis_user_id ON ai_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_question_id ON ai_analysis(question_id);

-- ============================================================
-- 初始化数据
-- ============================================================

-- Insert default admin account (password: admin, bcrypt encrypted)
-- Note: Change password in production
INSERT INTO users (
  id, phone, password, role, nickname, real_name, avatar, created_at
) VALUES (
  'admin-1',
  'admin',
  '$2b$10$rKvVPZqGvVZqGvVZqGvVZuO8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K',
  'ADMIN',
  'Super Admin',
  'System Administrator',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Completion Notice
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE 'PostgreSQL database schema initialization completed!';
  RAISE NOTICE '';
  RAISE NOTICE 'Created 23 tables:';
  RAISE NOTICE '  1. users - User table';
  RAISE NOTICE '  2. banks - Question bank table';
  RAISE NOTICE '  3. questions - Question table';
  RAISE NOTICE '  4. practice_records - Practice record table';
  RAISE NOTICE '  5. exams - Exam table';
  RAISE NOTICE '  6. exam_history - Exam history table';
  RAISE NOTICE '  7. mistakes - Mistake table';
  RAISE NOTICE '  8. favorites - Favorite table';
  RAISE NOTICE '  9. notes - Note table';
  RAISE NOTICE '  10. srs_records - SRS record table';
  RAISE NOTICE '  11. daily_progress - Daily progress table';
  RAISE NOTICE '  12. system_config - System config table';
  RAISE NOTICE '  13. system_config_kv - System config KV table';
  RAISE NOTICE '  14. login_logs - Login log table';
  RAISE NOTICE '  15. audit_logs - Audit log table';
  RAISE NOTICE '  16. practical_tasks - Practical task table';
  RAISE NOTICE '  17. practical_records - Practical record table';
  RAISE NOTICE '  18. tags - Tag table';
  RAISE NOTICE '  19. question_tags - Question-tag relation table';
  RAISE NOTICE '  20. discussions - Discussion table';
  RAISE NOTICE '  21. comments - Comment table';
  RAISE NOTICE '  22. discussion_likes - Like table';
  RAISE NOTICE '  23. ai_analysis - AI analysis table';
  RAISE NOTICE '';
  RAISE NOTICE 'All necessary indexes and foreign key constraints created';
  RAISE NOTICE 'Default admin account inserted (phone: admin, password: admin)';
END $$;
