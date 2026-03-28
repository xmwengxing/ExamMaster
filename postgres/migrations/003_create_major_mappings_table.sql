-- 创建专业对照表 (major_mappings)
-- 用于存储职业与专业的匹配关系，支持四级和三级专业符合规则判断
-- 创建时间: 2026-02-06

-- ============================================================
-- 专业对照表 (major_mappings)
-- ============================================================
CREATE TABLE IF NOT EXISTS major_mappings (
  -- 主键
  id VARCHAR(255) PRIMARY KEY,
  
  -- 职业和专业信息
  occupation VARCHAR(200) NOT NULL,  -- 职业名称（如：人工智能训练师）
  major_name VARCHAR(200) NOT NULL,  -- 专业名称（如：计算机应用技术）
  
  -- 专业符合规则标志
  level_4_compatible BOOLEAN DEFAULT FALSE,  -- 四级专业符合（中专、技校学历）
  level_3_compatible BOOLEAN DEFAULT FALSE,  -- 三级专业符合（大专及以上学历）
  
  -- 审计字段
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 约束：至少一个兼容级别为 true
  CONSTRAINT chk_at_least_one_compatible CHECK (level_4_compatible = TRUE OR level_3_compatible = TRUE)
);

-- ============================================================
-- 索引
-- ============================================================

-- 职业名称索引 - 用于按职业查询专业对照表
CREATE INDEX IF NOT EXISTS idx_major_mappings_occupation ON major_mappings(occupation);

-- 专业名称索引 - 用于按专业名称搜索
CREATE INDEX IF NOT EXISTS idx_major_mappings_major_name ON major_mappings(major_name);

-- 唯一复合索引 - 确保同一职业的专业名称不重复
CREATE UNIQUE INDEX IF NOT EXISTS idx_major_mappings_occupation_major ON major_mappings(occupation, major_name);

-- 四级兼容索引 - 用于快速查询四级专业符合的记录
CREATE INDEX IF NOT EXISTS idx_major_mappings_level_4 ON major_mappings(occupation, level_4_compatible) WHERE level_4_compatible = TRUE;

-- 三级兼容索引 - 用于快速查询三级专业符合的记录
CREATE INDEX IF NOT EXISTS idx_major_mappings_level_3 ON major_mappings(occupation, level_3_compatible) WHERE level_3_compatible = TRUE;

-- ============================================================
-- 注释说明
-- ============================================================

COMMENT ON TABLE major_mappings IS '专业对照表 - 存储职业与专业的匹配关系，用于判断专业符合规则';
COMMENT ON COLUMN major_mappings.id IS '专业对照记录唯一标识';
COMMENT ON COLUMN major_mappings.occupation IS '职业名称 - 如：人工智能训练师、电工等';
COMMENT ON COLUMN major_mappings.major_name IS '专业名称 - 如：计算机应用技术、电气工程等';
COMMENT ON COLUMN major_mappings.level_4_compatible IS '四级专业符合 - 适用于中专、技校学历';
COMMENT ON COLUMN major_mappings.level_3_compatible IS '三级专业符合 - 适用于大专及以上学历';

-- ============================================================
-- 示例数据（可选）
-- ============================================================

-- 插入人工智能训练师的示例专业对照数据
INSERT INTO major_mappings (id, occupation, major_name, level_4_compatible, level_3_compatible) VALUES
  ('major-mapping-001', '人工智能训练师', '计算机应用技术', TRUE, TRUE),
  ('major-mapping-002', '人工智能训练师', '软件技术', TRUE, TRUE),
  ('major-mapping-003', '人工智能训练师', '计算机网络技术', TRUE, TRUE),
  ('major-mapping-004', '人工智能训练师', '人工智能技术应用', TRUE, TRUE),
  ('major-mapping-005', '人工智能训练师', '大数据技术', FALSE, TRUE),
  ('major-mapping-006', '人工智能训练师', '数据科学与大数据技术', FALSE, TRUE)
ON CONFLICT (occupation, major_name) DO NOTHING;

-- ============================================================
-- 完成通知
-- ============================================================

-- 注意: 专业对照表创建完成
-- 包含职业、专业名称、四级兼容、三级兼容字段
-- 已创建唯一约束（occupation + major_name）和所有必要的索引
-- 已添加示例数据供测试使用
