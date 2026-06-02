-- ============================================================================
-- ExamMaster 交互式课件章节入库 —— 通用 SQL 模板
-- ----------------------------------------------------------------------------
-- 用途：把"已构建完成的课件章节"插入 `interactive_courses` 表，学员端即可
--       在"交互式课堂"看到并进入该章节。
--
-- 使用步骤：
--   1. 复制本文件为 scripts/import-<X.X>-chapters.sql
--   2. 修改下方 3 个值（X.X、sort_order、start_chapter、group_id）
--   3. 执行: docker exec -i examaster_postgres psql -U edumaster_user -d edumaster \
--              < scripts/import-<X.X>-chapters.sql
--   4. 验证: 在学员端 /api/interactive-courses/public 看到新章节
--   5. 浏览器打开 <base_path>embed.html?auto=1&chapter=<start_chapter> 验证
--
-- 字段说明（详见 docs/COURSE-UPDATE-GUIDE.md §2）：
--   id              : 'ic-trainer-<X.X>' （或 'ic-<group-prefix>-<X.X>' 自定义）
--   title           : 来自课件 course.json section.title
--   description     : 课件简介（章节数 / 时长 / 涵盖内容）
--   base_path       : 'courses/<course-name>/' （与 deploy-courses.sh 一致）
--   cover_image     : 封面图（留空 = 默认）
--   status          : 'published'（学员可见） / 'draft'（占位，学员不可见）
--   sort_order      : 在课程组内的排序，1-based
--   group_id        : 'icg-<timestamp>'（自动生成）或已有组 id
--   start_chapter   : 0-indexed 课件内起始章节，URL 跳转用
--                     计算：node 脚本（见 docs/COURSE-UPDATE-GUIDE.md §2）
-- ============================================================================

-- 主章节
INSERT INTO interactive_courses
  (id, title, description, base_path, cover_image, status, sort_order, group_id, start_chapter)
VALUES (
  'ic-trainer-X.X',                  -- TODO: 改 X.X
  '<section.title>',                 -- TODO: 改 course.json section.title
  '<description>',                   -- TODO: 课件简介
  'courses/<course-name>/',          -- TODO: 改 course name (与 deploy-courses.sh 一致)
  '',                                -- 封面图（留空）
  'published',                       -- published / draft
  <sort_order>,                      -- TODO: 在组内顺序
  'icg-ai-trainer-3',                -- TODO: 课程组 id（先 SELECT * FROM interactive_course_groups）
  <start_chapter>                    -- TODO: 0-indexed 起始章节
) ON CONFLICT (id) DO UPDATE SET
  title         = EXCLUDED.title,
  description   = EXCLUDED.description,
  base_path     = EXCLUDED.base_path,
  status        = EXCLUDED.status,
  sort_order    = EXCLUDED.sort_order,
  group_id      = EXCLUDED.group_id,
  start_chapter = EXCLUDED.start_chapter,
  updated_at    = NOW();

-- 验证
SELECT id, title, sort_order, start_chapter, status
FROM interactive_courses
ORDER BY sort_order;
