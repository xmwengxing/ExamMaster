-- 图文课程 (article course type) 数据库迁移
-- 新增 lesson_type 和 content 字段到 course_lessons
-- 扩展 courses.course_type 支持 'article'
-- 创建时间: 2026-05-26

-- ============================================================
-- 1. 课程主表：扩展 course_type 支持 article
-- ============================================================
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_course_type_check;
ALTER TABLE courses ADD CONSTRAINT courses_course_type_check
  CHECK (course_type IN ('vod', 'live', 'article'));

COMMENT ON COLUMN courses.course_type IS '课程类型: vod=录播课, live=直播课, article=图文课';

-- ============================================================
-- 2. 课程分类表：扩展 course_type 支持 article
-- ============================================================
ALTER TABLE course_categories DROP CONSTRAINT IF EXISTS course_categories_course_type_check;
ALTER TABLE course_categories ADD CONSTRAINT course_categories_course_type_check
  CHECK (course_type IN ('vod', 'live', 'article'));

-- 预置图文课程默认分类
INSERT INTO course_categories (id, name, course_type, sort_order) VALUES
  ('cat-article-01', '编程入门', 'article', 1),
  ('cat-article-02', 'Python学习', 'article', 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. 课时表：新增 lesson_type 和 content 字段
-- ============================================================
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS
  lesson_type VARCHAR(10) NOT NULL DEFAULT 'video'
  CHECK (lesson_type IN ('video', 'article'));

ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS content TEXT;

ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- article 类型的课时不需要 video_type，改为可空
ALTER TABLE course_lessons ALTER COLUMN video_type DROP NOT NULL;

COMMENT ON COLUMN course_lessons.lesson_type IS '课时类型: video=视频, article=图文/文章';
COMMENT ON COLUMN course_lessons.content IS '图文课 Markdown 内容';
COMMENT ON COLUMN course_lessons.updated_at IS '最后更新时间';
