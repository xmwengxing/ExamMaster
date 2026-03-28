-- 创建报名记录表 (registrations)
-- 用于存储学历教育、职业技能和大中小学科三种类型的报名信息
-- 创建时间: 2026-02-06

-- ============================================================
-- 报名记录表 (registrations)
-- ============================================================
CREATE TABLE IF NOT EXISTS registrations (
  -- 主键
  id VARCHAR(255) PRIMARY KEY,
  
  -- 报名类型和状态
  type VARCHAR(50) NOT NULL CHECK (type IN ('EDUCATION', 'VOCATIONAL', 'K12')),
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  
  -- 通用信息字段
  name VARCHAR(100) NOT NULL,
  gender VARCHAR(10),
  birth_date DATE,
  phone VARCHAR(50) NOT NULL,
  id_type VARCHAR(50),
  id_number VARCHAR(50),
  city VARCHAR(100),
  company VARCHAR(200),
  
  -- 学历教育专用字段
  first_education VARCHAR(50),
  first_education_school VARCHAR(200),
  first_education_major VARCHAR(100),
  first_education_graduation_date DATE,
  highest_education VARCHAR(50),
  highest_education_school VARCHAR(200),
  highest_education_major VARCHAR(100),
  highest_education_graduation_date DATE,
  upgrade_type VARCHAR(50),
  upgrade_budget VARCHAR(50),
  upgrade_form VARCHAR(50),
  upgrade_major VARCHAR(100),
  
  -- 职业技能专用字段
  occupation VARCHAR(200),
  occupation_direction VARCHAR(200),
  apply_level VARCHAR(50),
  work_years INTEGER,
  current_certificate VARCHAR(200),
  certificate_level VARCHAR(50),
  certificate_code VARCHAR(100),
  certificate_date DATE,
  education_history JSONB,  -- 学习经历数组
  work_history JSONB,  -- 工作经历数组
  photo_url TEXT,  -- 1寸白底照片路径
  
  -- 文档路径
  document_path TEXT,
  
  -- 关联学员账户
  user_id VARCHAR(255),
  
  -- 审计字段
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  
  -- 外键约束
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- 索引
-- ============================================================

-- 报名类型索引 - 用于按类型筛选报名记录
CREATE INDEX IF NOT EXISTS idx_registrations_type ON registrations(type);

-- 报名状态索引 - 用于按状态筛选报名记录
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);

-- 联系电话索引 - 用于按手机号搜索和查重
CREATE INDEX IF NOT EXISTS idx_registrations_phone ON registrations(phone);

-- 姓名索引 - 用于按姓名搜索
CREATE INDEX IF NOT EXISTS idx_registrations_name ON registrations(name);

-- 创建时间索引 - 用于按时间排序和分页
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at DESC);

-- 用户ID索引 - 用于查询某个用户的所有报名记录
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);

-- 复合索引 - 用于管理后台按类型和状态筛选
CREATE INDEX IF NOT EXISTS idx_registrations_type_status ON registrations(type, status);

-- ============================================================
-- 注释说明
-- ============================================================

COMMENT ON TABLE registrations IS '报名记录表 - 存储学历教育、职业技能和大中小学科的报名信息';
COMMENT ON COLUMN registrations.id IS '报名记录唯一标识';
COMMENT ON COLUMN registrations.type IS '报名类型: EDUCATION(学历教育), VOCATIONAL(职业技能), K12(大中小学科)';
COMMENT ON COLUMN registrations.status IS '报名状态: PENDING(待审核), APPROVED(已通过), REJECTED(已拒绝)';
COMMENT ON COLUMN registrations.name IS '报名人姓名';
COMMENT ON COLUMN registrations.phone IS '联系电话';
COMMENT ON COLUMN registrations.education_history IS '学习经历JSON数组 - 包含学历程度、学校、专业、毕业时间';
COMMENT ON COLUMN registrations.work_history IS '工作经历JSON数组 - 包含工作时间段、单位、职务';
COMMENT ON COLUMN registrations.photo_url IS '1寸白底照片存储路径';
COMMENT ON COLUMN registrations.document_path IS '生成的报名文档路径(Excel或Word)';
COMMENT ON COLUMN registrations.user_id IS '关联的学员账户ID - 通过姓名和电话关联';

-- ============================================================
-- 完成通知
-- ============================================================

-- 注意: 表创建完成
-- 包含通用信息、学历教育、职业技能字段
-- 已创建所有必要的索引和外键约束

