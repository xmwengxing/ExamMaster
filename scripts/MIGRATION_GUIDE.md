# 数据迁移指南

## 概述

本指南说明如何使用 `migrate.js` 脚本将数据从 SQLite 迁移到 PostgreSQL。

## 前置条件

1. **已安装依赖**
   ```bash
   npm install
   ```

2. **PostgreSQL 数据库已创建并初始化**
   - 数据库已创建（edumaster）
   - 表结构已初始化（运行 postgres/init.sql）
   - 连接信息已配置在 .env 文件中

3. **SQLite 数据库文件存在**
   - 文件路径：`./edumaster.db`
   - 包含需要迁移的数据

## 配置

### 环境变量（.env）

确保以下环境变量已正确配置：

```env
# PostgreSQL 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edumaster
DB_USER=edumaster_user
DB_PASSWORD=your_password

# JWT 配置
JWT_SECRET=your_jwt_secret
```

### 迁移参数

可以在 `scripts/migrate.js` 中修改以下参数：

- `SQLITE_DB_PATH`: SQLite 数据库文件路径（默认：`./edumaster.db`）
- `BATCH_SIZE`: 批量插入大小（默认：100）
- `MAX_RETRIES`: 最大重试次数（默认：3）

## 使用方法

### 1. 测试连接

在执行迁移前，先测试数据库连接：

```bash
node scripts/test-migrate.js
```

预期输出：
- ✓ SQLite 连接成功
- ✓ PostgreSQL 连接成功
- ✓ 数据清洗测试通过

### 2. 备份数据

**重要：在迁移前备份 SQLite 数据库！**

```bash
# Windows
copy edumaster.db edumaster.db.backup

# Linux/Mac
cp edumaster.db edumaster.db.backup
```

### 3. 执行迁移

```bash
node scripts/migrate.js
```

### 4. 查看迁移报告

迁移完成后，会在项目根目录生成 `migration-report.json` 文件，包含：

- 迁移摘要（总表数、成功/失败数、记录数）
- 每个表的详细迁移结果
- 数据验证结果

示例报告：

```json
{
  "timestamp": "2024-01-22T10:30:00.000Z",
  "duration": "45.23秒",
  "summary": {
    "totalTables": 23,
    "successTables": 23,
    "failedTables": 0,
    "skippedTables": 0,
    "totalRecords": 15000,
    "insertedRecords": 15000,
    "failedRecords": 0
  },
  "tables": [...],
  "validation": [...]
}
```

## 迁移流程

脚本会按以下顺序执行：

1. **连接数据库**
   - 打开 SQLite 数据库（只读模式）
   - 测试 PostgreSQL 连接

2. **迁移数据**（按表顺序）
   - users（用户表）
   - banks（题库表）
   - questions（题目表）
   - exams（考试表）
   - exam_history（考试历史）
   - practice_records（练习记录）
   - mistakes（错题）
   - favorites（收藏）
   - notes（笔记）
   - srs_records（SRS 记录）
   - daily_progress（每日进度）
   - tags（标签）
   - question_tags（题目-标签关联）
   - discussions（讨论）
   - comments（评论）
   - discussion_likes（点赞）
   - ai_analysis（AI 解析）
   - practical_tasks（实操任务）
   - practical_records（实操记录）
   - login_logs（登录日志）
   - audit_logs（审计日志）
   - system_config（系统配置）
   - system_config_kv（系统配置键值）

3. **数据清洗**
   - JSON 字段：解析 JSON 字符串为 JSONB
   - 布尔字段：将 0/1 转换为 false/true
   - 日期时间字段：转换为 ISO 8601 格式

4. **批量导入**
   - 使用事务保证原子性
   - 分批插入（默认 100 条/批）
   - 冲突时跳过（ON CONFLICT DO NOTHING）

5. **数据验证**
   - 对比 SQLite 和 PostgreSQL 的记录数
   - 标记不一致的表

6. **生成报告**
   - 保存详细报告到 JSON 文件
   - 输出摘要到控制台

## 数据转换规则

### JSON 字段

SQLite TEXT → PostgreSQL JSONB

```javascript
// 转换前（SQLite）
options: '["A", "B", "C"]'

// 转换后（PostgreSQL）
options: ["A", "B", "C"]  // JSONB 类型
```

### 布尔字段

SQLite INTEGER (0/1) → PostgreSQL BOOLEAN

```javascript
// 转换前（SQLite）
is_visible: 1

// 转换后（PostgreSQL）
is_visible: true
```

### 日期时间字段

SQLite TEXT → PostgreSQL TIMESTAMP

```javascript
// 转换前（SQLite）
created_at: '2024-01-22 10:30:00'

// 转换后（PostgreSQL）
created_at: '2024-01-22T10:30:00.000Z'  // ISO 8601
```

## 错误处理

### 自动重试

如果表迁移失败，脚本会自动重试（最多 3 次）：

1. 第一次失败：等待 1 秒后重试
2. 第二次失败：等待 2 秒后重试
3. 第三次失败：记录错误并继续下一个表

### 常见错误

#### 1. 连接错误

```
错误: 无法打开 SQLite 数据库
解决: 检查 edumaster.db 文件是否存在
```

```
错误: PostgreSQL 连接失败
解决: 检查 .env 配置和 PostgreSQL 服务是否运行
```

#### 2. 外键约束错误

```
错误: 外键约束违反
解决: 确保表按正确顺序迁移（父表先于子表）
```

#### 3. JSON 解析错误

```
警告: JSON 解析失败
处理: 字段值设置为 NULL，记录警告日志
```

#### 4. 数据不一致

```
错误: SQLite 和 PostgreSQL 记录数不一致
解决: 检查迁移日志，查找失败的记录
```

## 验证迁移结果

### 1. 检查记录数

```sql
-- 在 PostgreSQL 中执行
SELECT 
  table_name,
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM banks) as banks_count,
  (SELECT COUNT(*) FROM questions) as questions_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
LIMIT 1;
```

### 2. 检查数据完整性

```sql
-- 检查外键约束
SELECT 
  COUNT(*) as orphaned_questions
FROM questions q
LEFT JOIN banks b ON q.bank_id = b.id
WHERE b.id IS NULL;
```

### 3. 检查 JSON 字段

```sql
-- 检查 JSONB 字段是否有效
SELECT 
  id,
  jsonb_typeof(options) as options_type,
  jsonb_typeof(answer) as answer_type
FROM questions
WHERE options IS NOT NULL
LIMIT 10;
```

## 回滚

如果迁移失败或数据不正确，可以回滚：

### 1. 清空 PostgreSQL 数据

```sql
-- 警告：这会删除所有数据！
TRUNCATE TABLE 
  ai_analysis, discussion_likes, comments, discussions,
  question_tags, tags, practical_records, practical_tasks,
  audit_logs, login_logs, system_config_kv, system_config,
  daily_progress, srs_records, notes, favorites, mistakes,
  exam_history, exams, practice_records, questions, banks, users
CASCADE;
```

### 2. 重新执行迁移

```bash
node scripts/migrate.js
```

## 性能优化

### 调整批量大小

对于大数据集，可以调整批量大小：

```javascript
// 在 migrate.js 中修改
const BATCH_SIZE = 500;  // 增加到 500
```

### 禁用日志

在生产环境中，可以禁用详细日志以提高性能：

```javascript
// 在 db.js 中设置
process.env.NODE_ENV = 'production';
```

## 故障排查

### 查看详细日志

迁移过程中的所有日志都会输出到控制台，包括：

- 连接状态
- 每个表的迁移进度
- 数据清洗警告
- 插入错误
- 验证结果

### 检查迁移报告

查看 `migration-report.json` 文件，找到失败的表和记录：

```json
{
  "tables": [
    {
      "table": "questions",
      "count": 1000,
      "inserted": 995,
      "failed": 5,
      "error": "..."
    }
  ]
}
```

### 手动修复数据

如果某些记录迁移失败，可以手动修复：

1. 从 SQLite 导出失败的记录
2. 手动清洗数据
3. 使用 SQL 插入到 PostgreSQL

## 注意事项

1. **备份数据**：迁移前务必备份 SQLite 数据库
2. **测试环境**：先在测试环境验证迁移脚本
3. **停止服务**：迁移期间停止应用服务
4. **检查磁盘空间**：确保有足够的磁盘空间
5. **网络稳定**：确保数据库连接稳定
6. **权限检查**：确保数据库用户有足够的权限

## 支持

如有问题，请检查：

1. 迁移报告（migration-report.json）
2. 控制台日志
3. PostgreSQL 日志
4. SQLite 数据库完整性

## 相关文件

- `scripts/migrate.js` - 主迁移脚本
- `scripts/test-migrate.js` - 测试脚本
- `db.js` - PostgreSQL 连接模块
- `postgres/init.sql` - 数据库初始化脚本
- `.env` - 环境变量配置
