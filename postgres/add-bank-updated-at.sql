-- 为 banks 表添加 updated_at 字段，用于检测题库更新

-- 1. 添加 updated_at 字段
ALTER TABLE banks 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2. 为现有记录设置初始值
UPDATE banks 
SET updated_at = CURRENT_TIMESTAMP 
WHERE updated_at IS NULL;

-- 3. 创建触发器：题目增删改时自动更新 banks.updated_at
CREATE OR REPLACE FUNCTION update_bank_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新对应题库的 updated_at
  UPDATE banks 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = COALESCE(NEW.bank_id, OLD.bank_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS trigger_update_bank_timestamp ON questions;

-- 5. 创建新触发器
CREATE TRIGGER trigger_update_bank_timestamp
AFTER INSERT OR UPDATE OR DELETE ON questions
FOR EACH ROW
EXECUTE FUNCTION update_bank_timestamp();

-- 6. 验证
SELECT id, name, question_count, updated_at 
FROM banks 
ORDER BY updated_at DESC;
