-- 在线课程系统 + 学员分组权限 数据库迁移
-- 新增: user_groups, courses, course_chapters, course_lessons,
--        live_sessions, course_enrollments, course_categories
-- 修改: users 表增加 group_id 字段
-- 创建时间: 2026-04-29

-- ============================================================
-- 1. 用户表修改：增加分组关联
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS group_id VARCHAR(36);

-- ============================================================
-- 2. 学员分组表 (user_groups)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_groups (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}'::JSONB,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE user_groups IS '学员分组表';
COMMENT ON COLUMN user_groups.permissions IS '分组权限JSON - 结构: {banks:[],exams:[],vod_courses:{mode,categories,courses},live_courses:{mode,categories,courses}}';

-- ============================================================
-- 3. 课程分类表 (course_categories)
-- ============================================================
CREATE TABLE IF NOT EXISTS course_categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  course_type VARCHAR(10) CHECK (course_type IN ('vod', 'live')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 预置默认分类
INSERT INTO course_categories (id, name, course_type, sort_order) VALUES
  ('cat-vod-01', '编程基础', 'vod', 1),
  ('cat-vod-02', '数据库', 'vod', 2),
  ('cat-vod-03', '前端开发', 'vod', 3),
  ('cat-live-01', '技术分享', 'live', 1),
  ('cat-live-02', '职业规划', 'live', 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. 课程主表 (courses)
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  cover_url VARCHAR(500),
  course_type VARCHAR(10) NOT NULL CHECK (course_type IN ('vod', 'live')),
  category VARCHAR(50),
  teacher_name VARCHAR(100),
  teacher_intro TEXT,
  price DECIMAL(10,2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INTEGER DEFAULT 0,
  student_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE courses IS '课程主表';
COMMENT ON COLUMN courses.course_type IS '课程类型: vod=录播课, live=直播课';
COMMENT ON COLUMN courses.status IS '状态: draft=草稿, published=已发布, archived=已归档';

-- 课程表索引
CREATE INDEX IF NOT EXISTS idx_courses_type ON courses(course_type);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_sort ON courses(sort_order);

-- ============================================================
-- 5. 课程章节表 (course_chapters) - 录播课专用
-- ============================================================
CREATE TABLE IF NOT EXISTS course_chapters (
  id VARCHAR(36) PRIMARY KEY,
  course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chapters_course ON course_chapters(course_id);
CREATE INDEX IF NOT EXISTS idx_chapters_sort ON course_chapters(course_id, sort_order);

-- ============================================================
-- 6. 课程课时表 (course_lessons) - 录播课专用
-- ============================================================
CREATE TABLE IF NOT EXISTS course_lessons (
  id VARCHAR(36) PRIMARY KEY,
  chapter_id VARCHAR(36) NOT NULL REFERENCES course_chapters(id) ON DELETE CASCADE,
  course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  video_type VARCHAR(20) DEFAULT 'upload' CHECK (video_type IN ('upload', 'embed', 'link')),
  video_url VARCHAR(1000),
  duration INTEGER DEFAULT 0,
  is_free_preview BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN course_lessons.video_type IS '视频类型: upload=上传文件, embed=嵌入链接(iframe), link=外链直链';
COMMENT ON COLUMN course_lessons.duration IS '时长（秒）';

CREATE INDEX IF NOT EXISTS idx_lessons_chapter ON course_lessons(chapter_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_sort ON course_lessons(chapter_id, sort_order);

-- ============================================================
-- 7. 直播场次表 (live_sessions) - 直播课专用
-- ============================================================
CREATE TABLE IF NOT EXISTS live_sessions (
  id VARCHAR(36) PRIMARY KEY,
  course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(200),
  meeting_number VARCHAR(50),
  meeting_url VARCHAR(500),
  meeting_password VARCHAR(50),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'living', 'ended')),
  replay_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE live_sessions IS '直播场次表';
COMMENT ON COLUMN live_sessions.meeting_number IS '腾讯会议号';
COMMENT ON COLUMN live_sessions.meeting_url IS '腾讯会议链接';
COMMENT ON COLUMN live_sessions.status IS '场次状态: scheduled=预约中, living=直播中, ended=已结束';

CREATE INDEX IF NOT EXISTS idx_sessions_course ON live_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON live_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON live_sessions(start_time);

-- ============================================================
-- 8. 学员学习记录表 (course_enrollments)
-- ============================================================
CREATE TABLE IF NOT EXISTS course_enrollments (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  last_lesson_id VARCHAR(36),
  last_position INTEGER DEFAULT 0,
  progress_percent INTEGER DEFAULT 0,
  completed_at TIMESTAMP,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, course_id)
);

COMMENT ON TABLE course_enrollments IS '学员课程学习记录';
COMMENT ON COLUMN course_enrollments.last_lesson_id IS '最近学习的课时ID';
COMMENT ON COLUMN course_enrollments.last_position IS '最近播放位置（秒）';
COMMENT ON COLUMN course_enrollments.progress_percent IS '完成百分比 0-100';

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_updated ON course_enrollments(updated_at);

-- ============================================================
-- 完成通知
-- ============================================================

-- 新增表汇总:
--   user_groups            - 学员分组（含权限JSONB）
--   course_categories      - 课程分类字典
--   courses                - 课程主表（vod/live）
--   course_chapters        - 录播课章节
--   course_lessons         - 录播课课时
--   live_sessions          - 直播课场次
--   course_enrollments     - 学员学习记录
--
-- users 表新增字段: group_id
--
-- 使用方式:
--   本地开发: docker compose exec -T postgres psql -U edumaster_user -d edumaster < postgres/migrations/006_add_courses_and_groups.sql
--   生产环境: 同上，替换数据库连接信息
