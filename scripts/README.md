# 数据迁移脚本集合

本目录包含 EduMaster 系统从 SQLite 迁移到 PostgreSQL 的完整工具集。

## 📁 文件说明

### 核心脚本

| 文件 | 说明 | 用途 |
|------|------|------|
| `migrate.js` | 主迁移脚本 | 执行完整的数据迁移流程 |
| `test-migrate.js` | 测试脚本 | 验证迁移脚本的基本功能 |
| `verify-migration.js` | 验证脚本 | 检查迁移后的数据完整性 |

### 文档

| 文件 | 说明 |
|------|------|
| `MIGRATION_GUIDE.md` | 详细的迁移指南（500+ 行） |
| `QUICK_START.md` | 快速开始指南 |
| `README.md` | 本文件 |

## 🚀 快速开始

### 1. 测试连接

```bash
node scripts/test-migrate.js
```

**预期输出：**
```
✓ SQLite 连接成功
✓ PostgreSQL 连接成功
✓ 所有测试通过！
```

### 2. 备份数据

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

**迁移过程：**
- 连接数据库
- 导出 SQLite 数据
- 清洗数据（JSON、布尔值、日期时间）
- 批量导入到 PostgreSQL
- 验证数据完整性
- 生成迁移报告

### 4. 验证结果

```bash
node scripts/verify-migration.js
```

**验证项目：**
- 记录数对比
- 外键完整性
- JSON 字段有效性
- 数据类型正确性

### 5. 查看报告

```bash
# Windows
type migration-report.json

# Linux/Mac
cat migration-report.json
```

## 📊 迁移流程图

```
┌─────────────────┐
│  测试连接       │
│  test-migrate   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  备份数据       │
│  copy db file   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  执行迁移       │
│  migrate.js     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  验证结果       │
│  verify-migration│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  查看报告       │
│  report.json    │
└─────────────────┘
```

## 🔧 配置

### 环境变量（.env）

```env
# PostgreSQL 配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edumaster
DB_USER=edumaster_user
DB_PASSWORD=your_password

# JWT 配置
JWT_SECRET=your_jwt_secret
```

### 迁移参数（migrate.js）

```javascript
const SQLITE_DB_PATH = './edumaster.db';  // SQLite 路径
const BATCH_SIZE = 100;                    // 批量大小
const MAX_RETRIES = 3;                     // 重试次数
```

## 📋 迁移的表

共 23 个表，按依赖顺序迁移：

1. **基础表**
   - users（用户）
   - banks（题库）

2. **内容表**
   - questions（题目）
   - exams（考试）
   - tags（标签）
   - practical_tasks（实操任务）

3. **关联表**
   - exam_history（考试历史）
   - practice_records（练习记录）
   - mistakes（错题）
   - favorites（收藏）
   - notes（笔记）
   - srs_records（SRS 记录）
   - question_tags（题目-标签）

4. **讨论表**
   - discussions（讨论）
   - comments（评论）
   - discussion_likes（点赞）

5. **其他表**
   - daily_progress（每日进度）
   - login_logs（登录日志）
   - audit_logs（审计日志）
   - practical_records（实操记录）
   - ai_analysis（AI 解析）
   - system_config（系统配置）
   - system_config_kv（配置键值）

## 🔄 数据转换

### JSON 字段

```
SQLite TEXT → PostgreSQL JSONB
'["A","B","C"]' → ["A","B","C"]
```

### 布尔字段

```
SQLite INTEGER → PostgreSQL BOOLEAN
1 → true
0 → false
```

### 日期时间字段

```
SQLite TEXT → PostgreSQL TIMESTAMP
'2024-01-22 10:30:00' → '2024-01-22T10:30:00.000Z'
```

## ⚡ 性能特点

- **批量处理**：默认 100 条/批，避免内存溢出
- **事务保护**：每批独立事务，失败自动回滚
- **自动重试**：失败表自动重试 3 次
- **进度显示**：实时显示迁移进度
- **并发安全**：使用连接池管理数据库连接

## 🛡️ 错误处理

### 自动重试

```
尝试 1 → 失败 → 等待 1s
尝试 2 → 失败 → 等待 2s
尝试 3 → 失败 → 记录错误
```

### 数据清洗

```
JSON 解析失败 → 设置为 NULL + 警告
日期解析失败 → 设置为 NULL + 警告
```

### 冲突处理

```
主键冲突 → ON CONFLICT DO NOTHING（跳过）
```

## 📈 迁移报告

### 报告内容

```json
{
  "timestamp": "迁移时间",
  "duration": "耗时",
  "summary": {
    "totalTables": 23,
    "successTables": 23,
    "failedTables": 0,
    "totalRecords": 15000,
    "insertedRecords": 15000,
    "failedRecords": 0
  },
  "tables": [...],
  "validation": [...]
}
```

### 报告位置

- 文件名：`migration-report.json`
- 位置：项目根目录

## ✅ 验证检查

### 记录数验证

对比 SQLite 和 PostgreSQL 的记录数：

```
✓ users: SQLite=6, PostgreSQL=6
✓ banks: SQLite=10, PostgreSQL=10
✓ questions: SQLite=1000, PostgreSQL=1000
```

### 外键完整性

检查外键关系是否完整：

```
✓ questions.bank_id → banks.id: 无孤立记录
✓ exam_history.user_id → users.id: 无孤立记录
```

### JSON 字段有效性

检查 JSONB 字段类型：

```
✓ questions.options: 所有 JSON 字段有效
✓ users.custom_fields: 所有 JSON 字段有效
```

### 数据类型正确性

检查字段类型转换：

```
✓ 布尔字段类型: 所有字段类型正确
✓ 日期时间字段类型: 所有字段类型正确
✓ JSONB 字段类型: 所有字段类型正确
```

## 🔍 故障排查

### 连接失败

```bash
# 检查 PostgreSQL 是否运行
pg_isready -h localhost -p 5432

# 检查 .env 配置
cat .env
```

### 迁移失败

```bash
# 查看详细日志
node scripts/migrate.js 2>&1 | tee migration.log

# 查看报告
cat migration-report.json
```

### 数据不一致

```bash
# 运行验证脚本
node scripts/verify-migration.js

# 检查特定表
psql -U edumaster_user -d edumaster -c "SELECT COUNT(*) FROM users;"
```

## 📚 相关文档

- [详细迁移指南](./MIGRATION_GUIDE.md) - 完整的使用说明
- [快速开始](./QUICK_START.md) - 快速参考
- [设计文档](../.kiro/specs/postgresql-migration-deployment/design.md) - 技术设计
- [需求文档](../.kiro/specs/postgresql-migration-deployment/requirements.md) - 功能需求

## 🆘 获取帮助

### 常见问题

1. **Q: 迁移需要多长时间？**
   A: 取决于数据量，1 万条记录约 30 秒

2. **Q: 迁移会影响 SQLite 数据吗？**
   A: 不会，SQLite 以只读模式打开

3. **Q: 迁移失败怎么办？**
   A: 脚本会自动重试，失败后可重新运行

4. **Q: 如何回滚？**
   A: 清空 PostgreSQL 数据，重新运行迁移

### 联系支持

- 查看迁移报告：`migration-report.json`
- 查看详细日志：控制台输出
- 查看文档：`MIGRATION_GUIDE.md`

## 📝 更新日志

### v1.0.0 (2024-01-22)

- ✓ 实现完整的迁移脚本
- ✓ 支持 23 个表的迁移
- ✓ 实现数据清洗功能
- ✓ 实现批量导入
- ✓ 实现数据验证
- ✓ 实现错误处理和重试
- ✓ 生成详细报告
- ✓ 创建测试脚本
- ✓ 创建验证脚本
- ✓ 编写完整文档

## 📄 许可证

本项目为 EduMaster 系统的一部分。

---

**最后更新**: 2024-01-22
**版本**: 1.0.0
**状态**: ✓ 已完成并测试


## 🔧 运维和管理脚本

### 新增脚本（v3.0.0）

| 文件 | 说明 | 用途 |
|------|------|------|
| `check-and-fix-admin.js` | 管理员账号检查修复 | 验证和创建超级管理员账号 |
| `sync-to-server.js` | 服务器同步工具 | 生成服务器环境变量配置 |
| `final-verification.js` | 最终系统验证 | 全面检查系统状态 |
| `analyze-query-performance.js` | 查询性能分析 | 分析数据库查询性能 |
| `verify-security-config.js` | 安全配置验证 | 检查安全配置 |
| `generate-secure-passwords.js` | 密码生成工具 | 生成强密码和密钥 |
| `clear-postgres.js` | 数据库清空 | 清空 PostgreSQL 数据库 |
| `verify-postgres-schema.js` | 架构验证 | 验证数据库架构 |

### 管理员账号管理

#### 检查和修复管理员账号

```bash
# 本地环境
node scripts/check-and-fix-admin.js

# Docker 环境
docker-compose exec api node scripts/check-and-fix-admin.js
```

**功能**:
- ✓ 检查数据库连接
- ✓ 检查所有数据表是否存在
- ✓ 检查超级管理员账号是否存在
- ✓ 如果不存在，创建默认管理员账号（admin/admin）
- ✓ 测试管理员账号登录
- ✓ 统计用户数量

**输出示例**:
```
✓ 数据库连接成功
✓ 所有 23 个数据表都存在
✓ 当前用户总数: 1
✓ 管理员数量: 1
✓ 学员数量: 0
✓ 超级管理员账号已存在
✓ 管理员账号密码验证成功
```

或者（如果账号不存在）:
```
⚠ 超级管理员账号不存在
✓ 超级管理员账号创建成功！
═══════════════════════════════════════
  账号: admin
  密码: admin
  ⚠️  请立即登录并修改密码！
═══════════════════════════════════════
```

### 服务器同步

#### 生成服务器环境变量

```bash
node scripts/sync-to-server.js
```

**功能**:
- ✓ 读取本地 .env 配置
- ✓ 生成适用于服务器的环境变量
- ✓ 自动调整 Docker 相关配置
- ✓ 保存到 .env.server 文件
- ✓ 显示部署步骤指南

**生成的配置**:
- `NODE_ENV=production`
- `DB_HOST=postgres` (Docker 容器名称)
- `DB_PORT=5432` (Docker 内部端口)
- 保留本地的强密码和密钥

### 系统验证

#### 最终系统验证

```bash
# 本地环境
node scripts/final-verification.js

# Docker 环境
docker-compose exec api node scripts/final-verification.js
```

**验证项目**:
- ✓ 数据库功能（8项）
  - 数据库连接
  - 表结构完整性
  - 索引创建
  - 数据完整性
  - JSONB 字段
  - 连接池配置
- ✓ API 功能（3项）
  - 健康检查
  - 题库列表
  - 系统配置
- ✓ 安全措施（7项）
  - 环境变量配置
  - 密码强度
  - SSL 配置
  - CORS 配置
- ✓ 备份机制（3项）
  - 备份脚本
  - 备份目录
  - 恢复脚本
- ✓ 监控日志（4项）
  - 日志文件
  - 日志配置
  - 监控脚本
- ✓ 性能指标（3项）
  - 查询性能
  - 并发性能
  - 索引使用

**输出报告**: `FINAL_SYSTEM_VERIFICATION.md`

### 性能分析

#### 查询性能分析

```bash
node scripts/analyze-query-performance.js
```

**功能**:
- ✓ 分析慢查询
- ✓ 检查索引使用情况
- ✓ 统计查询次数
- ✓ 计算平均执行时间
- ✓ 提供优化建议

### 安全管理

#### 生成强密码

```bash
node scripts/generate-secure-passwords.js
```

**生成内容**:
- 数据库密码（32位）
- JWT Secret（64位）
- 随机密钥（可自定义长度）

**特点**:
- 包含大小写字母、数字、特殊字符
- 符合安全要求
- 可直接用于 .env 配置

#### 验证安全配置

```bash
node scripts/verify-security-config.js
```

**检查项目**:
- ✓ 环境变量强度
- ✓ 密码复杂度
- ✓ CORS 配置
- ✓ SSL 证书
- ✓ 文件权限

### 数据库管理

#### 清空数据库

```bash
node scripts/clear-postgres.js
```

**警告**: 此操作会删除所有数据，请谨慎使用！

**功能**:
- 删除所有表数据
- 保留表结构
- 重置序列
- 需要确认操作

#### 验证数据库架构

```bash
node scripts/verify-postgres-schema.js
```

**验证项目**:
- ✓ 所有表是否存在
- ✓ 字段类型是否正确
- ✓ 索引是否创建
- ✓ 外键约束是否设置
- ✓ JSONB 字段是否正确

## 🚀 部署流程

### 完整部署步骤

1. **准备本地环境**
   ```bash
   # 生成服务器配置
   node scripts/sync-to-server.js
   ```

2. **推送代码**
   ```bash
   git add .
   git commit -m "更新配置"
   git push origin main
   ```

3. **服务器部署**
   ```bash
   # SSH 到服务器
   ssh root@47.104.173.139
   
   # 拉取代码
   cd /www/wwwroot/exammaster.zzzjl.com
   git pull origin main
   
   # 上传环境变量（从本地）
   # scp .env.server root@47.104.173.139:/www/wwwroot/exammaster.zzzjl.com/.env
   
   # 重启服务
   docker-compose down
   docker-compose up -d --build
   ```

4. **验证部署**
   ```bash
   # 检查管理员账号
   docker-compose exec api node scripts/check-and-fix-admin.js
   
   # 最终验证
   docker-compose exec api node scripts/final-verification.js
   ```

### 快速命令参考

```bash
# 本地开发
npm run dev                    # 启动开发服务器
npm run build                  # 构建前端
npm test                       # 运行测试

# Docker 管理
docker-compose up -d           # 启动所有服务
docker-compose down            # 停止所有服务
docker-compose ps              # 查看服务状态
docker-compose logs -f         # 查看日志

# 数据库管理
docker-compose exec postgres psql -U edumaster_user -d edumaster
docker-compose exec api node scripts/check-and-fix-admin.js

# 系统验证
docker-compose exec api node scripts/final-verification.js
```

## 📚 相关文档

### 核心文档
- [技术文档](../技术文档.md) - 完整的技术文档
- [部署指南](../DEPLOYMENT_GUIDE.md) - 部署指南
- [快速参考](../QUICK_REFERENCE.md) - 快速参考
- [服务器部署同步指南](../服务器部署同步指南.md) - 服务器同步指南

### 规范文档
- [需求文档](../.kiro/specs/postgresql-migration-deployment/requirements.md)
- [设计文档](../.kiro/specs/postgresql-migration-deployment/design.md)
- [任务清单](../.kiro/specs/postgresql-migration-deployment/tasks.md)

### 配置文档
- [PostgreSQL 配置](../postgres/README.md)
- [安全加固](../postgres/SECURITY_HARDENING.md)
- [Nginx 配置](../nginx/README.md)

## 📝 更新日志

### v3.0.0 (2026-01-23) - PostgreSQL 版本

- ✨ 新增管理员账号检查修复脚本
- ✨ 新增服务器同步工具
- ✨ 新增最终系统验证脚本
- ✨ 新增查询性能分析工具
- ✨ 新增安全配置验证工具
- ✨ 新增密码生成工具
- ✨ 新增数据库清空工具
- ✨ 新增架构验证工具
- 📚 更新文档和使用指南

### v1.0.0 (2024-01-22) - 初始版本

- ✓ 实现完整的迁移脚本
- ✓ 支持 23 个表的迁移
- ✓ 实现数据清洗功能
- ✓ 实现批量导入
- ✓ 实现数据验证

---

**最后更新**: 2026-01-23  
**版本**: 3.0.0  
**状态**: ✓ 生产就绪
