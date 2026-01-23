# PostgreSQL 数据库架构文档

## 目录结构

```
postgres/
├── init.sql                    # 数据库初始化脚本
├── README.md                   # 本文档
└── SCHEMA_VERIFICATION.md      # 架构验证报告
```

## 快速开始

### 1. 初始化数据库

```bash
# 方式 1：使用 psql 命令行
psql -h localhost -p 5433 -U edumaster_user -d edumaster -f postgres/init.sql

# 方式 2：使用环境变量
export PGPASSWORD='edumaster_password_2024'
psql -h localhost -p 5433 -U edumaster_user -d edumaster -f postgres/init.sql
```

### 2. 验证架构

```bash
# 运行验证脚本
node scripts/verify-postgres-schema.js
```

## 数据库架构概览

### 核心表（23 个）

#### 1. 用户管理
- **users**: 用户表，存储用户基本信息、权限、学习数据

#### 2. 题库管理
- **banks**: 题库表，存储题库信息
- **questions**: 题目表，支持单选、多选、判断、填空、简答题
- **tags**: 标签表，用于题目分类
- **question_tags**: 题目-标签关联表

#### 3. 练习与考试
- **practice_records**: 练习记录表
- **exams**: 考试表
- **exam_history**: 考试历史表

#### 4. 学习辅助
- **mistakes**: 错题表
- **favorites**: 收藏表
- **notes**: 笔记表
- **srs_records**: SRS（间隔重复）记录表
- **daily_progress**: 每日进度表

#### 5. 讨论系统
- **discussions**: 讨论表
- **comments**: 评论表
- **discussion_likes**: 点赞表

#### 6. 实操练习
- **practical_tasks**: 实操任务表
- **practical_records**: 实操记录表

#### 7. AI 功能
- **ai_analysis**: AI 解析记录表

#### 8. 系统管理
- **system_config**: 系统配置表
- **system_config_kv**: 系统配置键值表
- **login_logs**: 登录日志表
- **audit_logs**: 审计日志表

## 数据类型映射

### SQLite → PostgreSQL

| SQLite | PostgreSQL | 说明 |
|--------|-----------|------|
| TEXT | VARCHAR(n) | 短文本字段 |
| TEXT | TEXT | 长文本字段 |
| TEXT (JSON) | JSONB | JSON 数据，支持索引和查询 |
| INTEGER | INTEGER | 整数 |
| INTEGER (0/1) | BOOLEAN | 布尔值 |
| REAL | NUMERIC(10,2) | 精确小数 |
| TEXT (日期) | TIMESTAMP | 时间戳 |

## 索引策略

### 1. 主键索引
所有表都有主键索引，确保唯一性。

### 2. 外键索引
所有外键字段都有索引，优化关联查询。

### 3. 常用查询字段索引
- 用户表：phone, role, last_activity, class_name
- 题目表：bank_id, type, chapter, sort_order
- 考试表：status, start_time, end_time
- 讨论表：last_activity_at, created_at, is_pinned

### 4. JSONB 字段索引
使用 GIN 索引优化 JSONB 查询：
- questions.tags

### 5. 复合索引
- questions(bank_id, sort_order)：优化题目排序
- questions(bank_id, chapter)：优化章节查询
- daily_progress(user_id, date)：唯一索引，防止重复

## 外键约束

### 级联删除（ON DELETE CASCADE）
当父记录删除时，自动删除子记录：
- users → 所有用户相关数据
- banks → questions, exams, practice_records
- questions → mistakes, favorites, notes, ai_analysis
- discussions → comments, discussion_likes
- comments → 子评论

### 置空（ON DELETE SET NULL）
当父记录删除时，将外键设置为 NULL：
- questions → discussions.question_id
- banks → exam_history.bank_id
- users → audit_logs.operator_id

## JSONB 字段说明

### 用户表（users）
- **custom_fields**: 自定义字段，灵活扩展用户属性
- **student_perms**: 学员权限配置
- **allowed_bank_ids**: 允许访问的题库 ID 列表
- **permissions**: 权限配置
- **login_history**: 登录历史记录

### 题库表（banks）
- **score_config**: 评分配置，定义各题型分值

### 题目表（questions）
- **options**: 选择题选项数组
- **answer**: 题目答案（支持多种格式）
- **blanks**: 填空题配置
- **tags**: 题目标签数组

### 练习记录表（practice_records）
- **user_answers**: 用户答题记录

### 考试表（exams）
- **selected_question_ids**: 选中的题目 ID 列表

### 考试历史表（exam_history）
- **wrong_question_ids**: 错题 ID 列表
- **user_answers**: 用户答案记录
- **exam_config**: 考试配置快照
- **ordered_question_ids**: 题目顺序

### 实操表（practical_tasks, practical_records）
- **parts**: 实操任务各部分配置
- **answers**: 用户提交的答案

### 系统配置表（system_config）
- **data**: 系统配置数据

## 默认数据

### 管理员账号
- **手机号**: admin
- **密码**: admin（bcrypt 加密）
- **角色**: ADMIN

⚠️ **重要**：生产环境部署后请立即修改默认密码！

## 性能优化建议

### 1. 连接池配置
```javascript
const pool = new Pool({
  min: 2,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

### 2. 查询优化
- 使用参数化查询防止 SQL 注入
- 使用 EXPLAIN ANALYZE 分析慢查询
- 为常用查询创建索引
- 使用 JSONB 操作符优化 JSON 查询

### 3. 批量操作
- 使用事务处理批量插入
- 使用 COPY 命令加速大批量导入

### 4. 分页查询
```sql
SELECT * FROM questions 
WHERE bank_id = $1 
ORDER BY sort_order 
LIMIT $2 OFFSET $3;
```

## 维护命令

### 查看表结构
```sql
-- 列出所有表
\dt

-- 查看表结构
\d users

-- 查看索引
\di

-- 查看外键
\d+ users
```

### 性能分析
```sql
-- 分析查询计划
EXPLAIN ANALYZE SELECT * FROM questions WHERE bank_id = 'xxx';

-- 查看表大小
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 查看索引使用情况
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### 备份与恢复
```bash
# 备份数据库
pg_dump -h localhost -p 5433 -U edumaster_user -d edumaster -F c -f backup.dump

# 恢复数据库
pg_restore -h localhost -p 5433 -U edumaster_user -d edumaster -c backup.dump
```

## 故障排查

### 连接问题
```bash
# 测试连接
psql -h localhost -p 5433 -U edumaster_user -d edumaster -c "SELECT NOW();"

# 查看连接数
SELECT count(*) FROM pg_stat_activity WHERE datname = 'edumaster';

# 查看活跃查询
SELECT pid, usename, state, query 
FROM pg_stat_activity 
WHERE datname = 'edumaster' AND state = 'active';
```

### 性能问题
```sql
-- 查看慢查询
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 查看锁等待
SELECT * FROM pg_locks WHERE NOT granted;
```

## 安全建议

1. **密码安全**
   - 使用强密码（至少 16 位）
   - 定期更换密码
   - 不要在代码中硬编码密码

2. **访问控制**
   - 限制 PostgreSQL 远程访问
   - 配置 pg_hba.conf 限制 IP
   - 使用最小权限原则

3. **数据加密**
   - 使用 SSL/TLS 加密连接
   - 敏感数据使用应用层加密

4. **审计日志**
   - 启用 PostgreSQL 日志
   - 记录所有 DDL 操作
   - 定期审查日志

## 相关文档

- [架构验证报告](./SCHEMA_VERIFICATION.md)
- [数据迁移指南](../scripts/migrate.js)
- [API 适配指南](../server.js)

## 版本历史

- **v1.0.0** (2026-01-22): 初始版本
  - 创建 23 个表
  - 创建 83 个索引
  - 创建 32 个外键约束
  - 配置 19 个 JSONB 字段
