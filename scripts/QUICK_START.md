# 数据迁移快速开始

## 一键迁移（推荐）

```bash
# 1. 测试连接
node scripts/test-migrate.js

# 2. 备份数据
copy edumaster.db edumaster.db.backup

# 3. 执行迁移
node scripts/migrate.js

# 4. 验证结果
node scripts/verify-migration.js
```

## 前置条件检查

- [ ] PostgreSQL 已安装并运行
- [ ] 数据库已创建（edumaster）
- [ ] 表结构已初始化（postgres/init.sql）
- [ ] .env 文件已配置
- [ ] SQLite 数据库文件存在（edumaster.db）

## 环境变量配置

编辑 `.env` 文件：

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edumaster
DB_USER=edumaster_user
DB_PASSWORD=your_password
```

## 迁移流程

```
测试连接 → 备份数据 → 执行迁移 → 验证结果 → 查看报告
```

## 常见问题

### Q: 迁移需要多长时间？
A: 取决于数据量，通常 1-5 分钟（1 万条记录约 30 秒）

### Q: 迁移失败怎么办？
A: 脚本会自动重试 3 次，失败后可以重新运行

### Q: 如何回滚？
A: 清空 PostgreSQL 数据，重新运行迁移脚本

### Q: 数据会丢失吗？
A: 不会，SQLite 数据保持不变，只是复制到 PostgreSQL

## 迁移后检查

```bash
# 检查记录数
node scripts/verify-migration.js

# 查看迁移报告
cat migration-report.json
```

## 获取帮助

详细文档：`scripts/MIGRATION_GUIDE.md`
