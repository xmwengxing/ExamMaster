-- 交互式课堂（Interactive Courses）表
-- 用于存储通过 Vite 构建后、以静态 HTML 页面嵌入的交互式课件

CREATE TABLE IF NOT EXISTS interactive_courses (
  id          VARCHAR(64) PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  base_path   VARCHAR(255) NOT NULL,      -- 构建产物在 public/ 下的路径，如 courses/ai-trainer/
  cover_image VARCHAR(512) DEFAULT '',
  status      VARCHAR(16) DEFAULT 'draft', -- draft / published
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE interactive_courses IS '交互式课堂课程表（iframe 嵌入的独立构建页面）';
