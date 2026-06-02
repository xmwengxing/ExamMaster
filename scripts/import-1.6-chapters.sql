-- ============================================================================
-- ExamMaster 1.6 课件上架 + 1.7/1.8 占位章节
-- 执行: docker exec -i examaster_postgres psql -U edumaster_user -d edumaster < scripts/import-1.6-chapters.sql
-- 创建: 2026-06-02
-- ============================================================================

-- 1.6 主章节（已构建完成，立即上架 published）
INSERT INTO interactive_courses
  (id, title, description, base_path, cover_image, status, sort_order, group_id, start_chapter)
VALUES (
  'ic-trainer-1.6',
  '业务流程构建及业务优化通用方法',
  '人工智能训练师三级 · 1.6 业务流程构建及业务优化通用方法 — 58分钟交互式课件，涵盖S1-S5共24章：BPMN四符号、As-Is/To-Be、ECRS四刀法、业务流程诊断实战。',
  'courses/ai-trainer/',
  '',
  'published',
  6,
  'icg-ai-trainer-3',
  119
) ON CONFLICT (id) DO UPDATE SET
  title         = EXCLUDED.title,
  description   = EXCLUDED.description,
  base_path     = EXCLUDED.base_path,
  status        = 'published',
  sort_order    = 6,
  group_id      = 'icg-ai-trainer-3',
  start_chapter = 119,
  updated_at    = NOW();

-- 1.7 占位章节（status=draft，学员端不可见，源文档已就绪待开发）
INSERT INTO interactive_courses
  (id, title, description, base_path, cover_image, status, sort_order, group_id, start_chapter)
VALUES (
  'ic-trainer-1.7',
  '简单场景业务流程分析与优化',
  '人工智能训练师三级 · 1.7 简单场景业务流程分析与优化 — 占位章节，源文档已就绪，待课件构建后上架。',
  'courses/ai-trainer/',
  '',
  'draft',
  7,
  'icg-ai-trainer-3',
  143
) ON CONFLICT (id) DO NOTHING;

-- 1.8 占位章节
INSERT INTO interactive_courses
  (id, title, description, base_path, cover_image, status, sort_order, group_id, start_chapter)
VALUES (
  'ic-trainer-1.8',
  '复杂场景业务流程分析与优化',
  '人工智能训练师三级 · 1.8 复杂场景业务流程分析与优化 — 占位章节，源文档已就绪，待课件构建后上架。',
  'courses/ai-trainer/',
  '',
  'draft',
  8,
  'icg-ai-trainer-3',
  167
) ON CONFLICT (id) DO NOTHING;

-- 验证
SELECT id, title, sort_order, start_chapter, status FROM interactive_courses ORDER BY sort_order;
