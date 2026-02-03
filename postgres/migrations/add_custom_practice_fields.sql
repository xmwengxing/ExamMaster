-- 添加个性化练习所需的字段
-- 执行时间: 2026-01-28

-- 添加 custom_counts 字段（存储各题型的数量配置）
ALTER TABLE practice_records 
ADD COLUMN IF NOT EXISTS custom_counts JSONB;

-- 添加 selected_chapters 字段（存储选中的章节）
ALTER TABLE practice_records 
ADD COLUMN IF NOT EXISTS selected_chapters JSONB;

-- 添加 strategy 字段（存储抽题策略：SEQUENTIAL 或 RANDOM）
ALTER TABLE practice_records 
ADD COLUMN IF NOT EXISTS strategy VARCHAR(50);

-- 添加注释
COMMENT ON COLUMN practice_records.custom_counts IS '自定义练习的题型数量配置，格式：{"SINGLE": 10, "MULTIPLE": 5, ...}';
COMMENT ON COLUMN practice_records.selected_chapters IS '选中的章节列表，格式：["第一章", "第二章"]';
COMMENT ON COLUMN practice_records.strategy IS '抽题策略：SEQUENTIAL（顺序）或 RANDOM（随机）';
