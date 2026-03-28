-- 创建职业工种清单表 (occupation_list)
-- 用于存储可申报的职业和工种方向列表，支持关键词搜索
-- 创建时间: 2026-02-06

-- ============================================================
-- 职业工种清单表 (occupation_list)
-- ============================================================
CREATE TABLE IF NOT EXISTS occupation_list (
  -- 主键
  id VARCHAR(255) PRIMARY KEY,
  
  -- 职业和工种信息
  occupation VARCHAR(200) NOT NULL,  -- 申报认定职业（如：人工智能训练师）
  direction VARCHAR(200),  -- 工种/职业方向名称（可为空，如：数据标注）
  
  -- 审计字段
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 索引
-- ============================================================

-- 职业名称索引 - 用于按职业查询和关键词搜索
CREATE INDEX IF NOT EXISTS idx_occupation_list_occupation ON occupation_list(occupation);

-- 工种方向索引 - 用于按工种方向搜索（支持NULL值）
CREATE INDEX IF NOT EXISTS idx_occupation_list_direction ON occupation_list(direction);

-- 复合索引 - 用于查询某个职业的所有工种方向
CREATE INDEX IF NOT EXISTS idx_occupation_list_occupation_direction ON occupation_list(occupation, direction);

-- 全文搜索索引 - 支持职业名称的关键词搜索（使用 GIN 索引）
CREATE INDEX IF NOT EXISTS idx_occupation_list_occupation_gin ON occupation_list USING gin(to_tsvector('simple', occupation));

-- ============================================================
-- 注释说明
-- ============================================================

COMMENT ON TABLE occupation_list IS '职业工种清单表 - 存储可申报的职业和工种方向列表';
COMMENT ON COLUMN occupation_list.id IS '职业工种记录唯一标识';
COMMENT ON COLUMN occupation_list.occupation IS '申报认定职业 - 如：人工智能训练师、电工、焊工等';
COMMENT ON COLUMN occupation_list.direction IS '工种/职业方向名称 - 如：数据标注、数据采集等（可为空）';

-- ============================================================
-- 示例数据（可选）
-- ============================================================

-- 插入人工智能训练师的示例职业工种数据
INSERT INTO occupation_list (id, occupation, direction) VALUES
  ('occupation-001', '人工智能训练师', '数据标注'),
  ('occupation-002', '人工智能训练师', '数据采集'),
  ('occupation-003', '人工智能训练师', '数据处理'),
  ('occupation-004', '人工智能训练师', '模型训练'),
  ('occupation-005', '电工', NULL),
  ('occupation-006', '焊工', NULL),
  ('occupation-007', '汽车维修工', '机械维修'),
  ('occupation-008', '汽车维修工', '电气维修')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 完成通知
-- ============================================================

-- 注意: 职业工种清单表创建完成
-- 包含职业和工种方向字段（工种方向可为空）
-- 已创建索引支持关键词搜索和快速查询
-- 已添加示例数据供测试使用
