-- 交互式课堂 - 课程组表（父级课程）
CREATE TABLE IF NOT EXISTS interactive_course_groups (
  id          VARCHAR(64) PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  cover_image VARCHAR(512) DEFAULT '',
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE interactive_course_groups IS '交互式课堂 - 课程组（父级课程）';

-- 给 interactive_courses 添加 group_id
ALTER TABLE interactive_courses ADD COLUMN IF NOT EXISTS group_id VARCHAR(64);
