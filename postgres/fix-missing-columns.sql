-- PostgreSQL 数据库表结构修复脚本
-- 修复迁移过程中缺失的字段和约束
-- 创建时间: 2026-01-23

-- ============================================================
-- 1. 修复 tags 表 - 添加 created_at 默认值
-- ============================================================
-- 问题: null value in column "created_at" of relation "tags" violates not-null constraint
-- 解决: 为 created_at 字段添加默认值

ALTER TABLE tags 
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- 更新已存在的 NULL 值
UPDATE tags 
SET created_at = CURRENT_TIMESTAMP 
WHERE created_at IS NULL;

RAISE NOTICE '✅ tags 表 created_at 字段已修复';

-- ============================================================
-- 2. 修复 question_tags 表 - 允许 tag_id 为 NULL 或添加约束
-- ============================================================
-- 问题: null value in column "tag_id" of relation "question_tags" violates not-null constraint
-- 解决: 这个问题通常是代码逻辑问题，但我们可以添加检查约束

-- 检查是否有 NULL 值
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM question_tags WHERE tag_id IS NULL) THEN
    RAISE NOTICE '⚠️  发现 question_tags 表中有 NULL tag_id，正在清理...';
    DELETE FROM question_tags WHERE tag_id IS NULL;
    RAISE NOTICE '✅ 已清理 NULL tag_id 记录';
  ELSE
    RAISE NOTICE '✅ question_tags 表无 NULL tag_id';
  END IF;
END $$;

-- ============================================================
-- 3. 检查并修复外键约束
-- ============================================================
-- 问题: insert or update on table "questions" violates foreign key constraint "questions_bank_id_fkey"
-- 解决: 确保外键约束存在且正确

DO $$
BEGIN
  -- 检查外键约束是否存在
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'questions_bank_id_fkey' 
    AND table_name = 'questions'
  ) THEN
    RAISE NOTICE '⚠️  questions_bank_id_fkey 外键约束不存在，正在创建...';
    ALTER TABLE questions 
      ADD CONSTRAINT questions_bank_id_fkey 
      FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ questions_bank_id_fkey 外键约束已创建';
  ELSE
    RAISE NOTICE '✅ questions_bank_id_fkey 外键约束已存在';
  END IF;
END $$;

-- ============================================================
-- 4. 检查并清理重复的主键
-- ============================================================
-- 问题: duplicate key value violates unique constraint "questions_pkey"
-- 解决: 清理重复的测试数据

DO $$
BEGIN
  -- 删除测试数据（ID 以 test- 开头的记录）
  DELETE FROM questions WHERE id LIKE 'test-%';
  DELETE FROM banks WHERE id LIKE 'test-%';
  DELETE FROM users WHERE id LIKE 'test-%';
  DELETE FROM exam_history WHERE id LIKE 'test-%';
  DELETE FROM exams WHERE id LIKE 'test-%';
  
  RAISE NOTICE '✅ 已清理测试数据';
END $$;

-- ============================================================
-- 5. 验证所有表的必需字段
-- ============================================================

-- 检查 users 表
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE '✅ users.created_at 字段已添加';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE '✅ users.updated_at 字段已添加';
  END IF;
END $$;

-- 检查 banks 表
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'banks' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE banks ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE '✅ banks.created_at 字段已添加';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'banks' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE banks ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE '✅ banks.updated_at 字段已添加';
  END IF;
END $$;

-- 检查 questions 表
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE questions ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE '✅ questions.created_at 字段已添加';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE questions ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE '✅ questions.updated_at 字段已添加';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE questions ADD COLUMN sort_order INTEGER DEFAULT 0;
    RAISE NOTICE '✅ questions.sort_order 字段已添加';
  END IF;
END $$;

-- 检查 exam_history 表
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_history' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE exam_history ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE '✅ exam_history.created_at 字段已添加';
  END IF;
END $$;

-- ============================================================
-- 6. 创建触发器自动更新 updated_at
-- ============================================================

-- 创建更新时间戳函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加触发器
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN 
    SELECT unnest(ARRAY['users', 'banks', 'questions', 'exams', 'system_config', 'system_config_kv', 'srs_records'])
  LOOP
    -- 检查表是否有 updated_at 字段
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = table_name AND column_name = 'updated_at'
    ) THEN
      -- 删除旧触发器（如果存在）
      EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %s', table_name, table_name);
      
      -- 创建新触发器
      EXECUTE format('
        CREATE TRIGGER update_%s_updated_at
        BEFORE UPDATE ON %s
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
      ', table_name, table_name);
      
      RAISE NOTICE '✅ %表 updated_at 触发器已创建', table_name;
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 7. 验证数据完整性
-- ============================================================

-- 检查孤立的外键引用
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  -- 检查 questions 表中引用不存在的 bank_id
  SELECT COUNT(*) INTO orphan_count
  FROM questions q
  LEFT JOIN banks b ON q.bank_id = b.id
  WHERE b.id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE NOTICE '⚠️  发现 % 个孤立的 questions 记录（引用不存在的 bank_id）', orphan_count;
    -- 可以选择删除或修复这些记录
    -- DELETE FROM questions WHERE bank_id NOT IN (SELECT id FROM banks);
  ELSE
    RAISE NOTICE '✅ questions 表无孤立记录';
  END IF;
  
  -- 检查 exam_history 表中引用不存在的 exam_id
  SELECT COUNT(*) INTO orphan_count
  FROM exam_history eh
  LEFT JOIN exams e ON eh.exam_id = e.id
  WHERE e.id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE NOTICE '⚠️  发现 % 个孤立的 exam_history 记录（引用不存在的 exam_id）', orphan_count;
  ELSE
    RAISE NOTICE '✅ exam_history 表无孤立记录';
  END IF;
END $$;

-- ============================================================
-- 8. 优化索引
-- ============================================================

-- 确保所有必需的索引都存在
CREATE INDEX IF NOT EXISTS idx_questions_bank_id ON questions(bank_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_sort_order ON questions(bank_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_exam_history_user_id ON exam_history(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_history_exam_id ON exam_history(exam_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_question_tags_question_id ON question_tags(question_id);
CREATE INDEX IF NOT EXISTS idx_question_tags_tag_id ON question_tags(tag_id);

RAISE NOTICE '✅ 所有索引已验证';

-- ============================================================
-- 9. 统计信息更新
-- ============================================================

-- 更新表统计信息以优化查询性能
ANALYZE users;
ANALYZE banks;
ANALYZE questions;
ANALYZE exam_history;
ANALYZE tags;
ANALYZE question_tags;

RAISE NOTICE '✅ 表统计信息已更新';

-- ============================================================
-- 完成通知
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 数据库表结构修复完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '修复内容：';
  RAISE NOTICE '  1. ✅ tags.created_at 字段默认值';
  RAISE NOTICE '  2. ✅ question_tags 表 NULL 值清理';
  RAISE NOTICE '  3. ✅ 外键约束验证';
  RAISE NOTICE '  4. ✅ 测试数据清理';
  RAISE NOTICE '  5. ✅ 必需字段验证';
  RAISE NOTICE '  6. ✅ updated_at 触发器';
  RAISE NOTICE '  7. ✅ 数据完整性检查';
  RAISE NOTICE '  8. ✅ 索引优化';
  RAISE NOTICE '  9. ✅ 统计信息更新';
  RAISE NOTICE '';
  RAISE NOTICE '下一步：';
  RAISE NOTICE '  1. 重启 API 服务器';
  RAISE NOTICE '  2. 测试网站功能';
  RAISE NOTICE '  3. 检查错误日志';
  RAISE NOTICE '';
END $$;
