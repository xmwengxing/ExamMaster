# 服务器脚本说明

本目录包含用于服务器部署、迁移和维护的各种脚本和配置文件。

## 📁 文件列表

### 备份与迁移

#### `backup-all-sites.sh`
**用途：** 备份服务器上所有网站数据

**功能：**
- 备份 `/www/wwwroot/` 下所有网站文件
- 备份 Docker 卷数据
- 备份 PostgreSQL 数据库
- 备份 Nginx 配置
- 生成备份清单

**使用方法：**
```bash
chmod +x backup-all-sites.sh
./backup-all-sites.sh
```

**输出：**
- 备份文件：`/root/backups/system_upgrade_YYYYMMDD_HHMMSS.tar.gz`
- 备份目录：`/root/backups/system_upgrade_YYYYMMDD_HHMMSS/`

---

#### `quick-migrate.sh`
**用途：** 系统升级后快速恢复 EduMaster 服务

**功能：**
- 检查系统版本
- 安装 Docker 和 Node.js
- 配置 Docker 镜像加速
- 应用优化配置
- 启动并验证服务

**使用方法：**
```bash
chmod +x quick-migrate.sh
./quick-migrate.sh
```

**前置条件：**
- 已恢复网站数据到 `/www/wwwroot/exammaster.zzzjl.com`
- 已配置 `.env` 文件

---

### 配置文件

#### `optimized-docker-compose.yml`
**用途：** 优化的 Docker Compose 配置

**优化点：**
- 升级 PostgreSQL 到 16-alpine
- 添加资源限制（CPU、内存）
- 优化日志配置
- 性能参数调优
- 去除 Docker Nginx 容器

**使用方法：**
```bash
cp optimized-docker-compose.yml ../docker-compose.yml
docker compose up -d --build
```

---

#### `postgresql-optimized.conf`
**用途：** PostgreSQL 性能优化配置

**优化参数：**
- `shared_buffers = 256MB` - 共享内存缓冲区
- `effective_cache_size = 1GB` - 查询规划器缓存
- `work_mem = 16MB` - 每个查询操作内存
- `random_page_cost = 1.1` - SSD 优化
- `effective_io_concurrency = 200` - SSD 并发 I/O

**使用方法：**
```bash
mkdir -p ../postgres
cp postgresql-optimized.conf ../postgres/postgresql.conf
docker compose restart postgres
```

---

#### `宝塔Nginx优化配置.conf`
**用途：** 宝塔面板 Nginx 优化配置

**优化点：**
- 去除 Docker Nginx 层，直接代理到 API 容器
- 优化超时设置（10s 连接，60s 读写）
- 优化连接设置（关闭缓冲）
- 添加 Gzip 压缩
- 静态资源缓存策略

**使用方法：**
```bash
# 备份现有配置
cp /www/server/panel/vhost/nginx/exammaster.zzzjl.com.conf \
   /www/server/panel/vhost/nginx/exammaster.zzzjl.com.conf.backup

# 应用新配置
cp 宝塔Nginx优化配置.conf \
   /www/server/panel/vhost/nginx/exammaster.zzzjl.com.conf

# 测试并重载
nginx -t && nginx -s reload
```

---

### 测试工具

#### `performance-test.sh`
**用途：** 性能测试和验证

**测试项：**
1. 健康检查响应时间（5次测试）
2. 并发请求测试（100请求，10并发）
3. 数据库连接测试
4. 容器资源使用
5. 系统资源使用

**使用方法：**
```bash
chmod +x performance-test.sh

# 测试本地
./performance-test.sh http://localhost:3001

# 测试生产环境
./performance-test.sh https://exammaster.zzzjl.com
```

**性能指标：**
- 健康检查响应时间应 < 0.1s
- 数据库查询时间应 < 0.05s
- API 容器内存使用应 < 512MB
- PostgreSQL 容器内存使用应 < 1GB

---

## 🚀 快速开始

### 场景 1: 系统升级迁移

```bash
# 1. 升级前备份
./backup-all-sites.sh

# 2. 下载备份到本地
scp root@47.104.173.139:/root/backups/system_upgrade_*.tar.gz ./

# 3. 升级系统到 Alibaba Cloud Linux 3
# （在阿里云控制台操作）

# 4. 恢复数据
# （解压备份并恢复到 /www/wwwroot/）

# 5. 快速迁移
./quick-migrate.sh

# 6. 性能测试
./performance-test.sh
```

### 场景 2: 仅优化现有部署

```bash
# 1. 备份当前配置
cd /www/wwwroot/exammaster.zzzjl.com
cp docker-compose.yml docker-compose.yml.backup
cp .env .env.backup

# 2. 应用优化配置
cp 服务器脚本/optimized-docker-compose.yml docker-compose.yml
mkdir -p postgres
cp 服务器脚本/postgresql-optimized.conf postgres/postgresql.conf

# 3. 重启服务
docker compose down
docker compose up -d --build

# 4. 更新 Nginx 配置
cp 服务器脚本/宝塔Nginx优化配置.conf \
   /www/server/panel/vhost/nginx/exammaster.zzzjl.com.conf
nginx -t && nginx -s reload

# 5. 性能测试
cd 服务器脚本
./performance-test.sh
```

### 场景 3: 定期备份

```bash
# 添加定时任务
crontab -e

# 每天凌晨 2 点备份
0 2 * * * /www/wwwroot/exammaster.zzzjl.com/服务器脚本/backup-all-sites.sh

# 每周日凌晨 3 点清理 30 天前的备份
0 3 * * 0 find /root/backups -name "system_upgrade_*.tar.gz" -mtime +30 -delete
```

---

## 📊 性能对比

### 优化前
- 讨论管理: 5秒
- 新增管理员: 20秒
- AI 解析: 8秒
- 页面加载: 3-5秒

### 优化后（预期）
- 讨论管理: <1秒 (提升 80%+)
- 新增管理员: <2秒 (提升 90%+)
- AI 解析: <2秒 (提升 75%+)
- 页面加载: <1秒 (提升 70%+)

---

## 🔧 故障排查

### 问题 1: 脚本权限不足

```bash
chmod +x *.sh
```

### 问题 2: Docker 命令不存在

```bash
# 检查 Docker 是否安装
docker --version

# 如果未安装，运行快速迁移脚本
./quick-migrate.sh
```

### 问题 3: 备份失败

```bash
# 检查磁盘空间
df -h

# 检查目录权限
ls -la /root/backups
```

### 问题 4: 性能测试失败

```bash
# 检查服务状态
docker compose ps

# 查看日志
docker compose logs api --tail=50

# 测试健康检查
curl http://localhost:3001/api/health
```

---

## 📚 相关文档

- [系统迁移升级指南](../docs/系统迁移升级指南.md) - 完整迁移步骤
- [服务器架构说明](../docs/服务器架构说明.md) - 架构详解
- [技术文档](../技术文档.md) - 技术栈说明

---

## ⚠️ 注意事项

1. **备份重要性**
   - 所有操作前务必备份
   - 备份文件下载到本地保存
   - 验证备份完整性

2. **系统升级**
   - 在业务低峰期操作
   - 创建系统快照
   - 准备回滚方案

3. **配置修改**
   - 修改前备份原配置
   - 测试配置语法
   - 逐步应用验证

4. **性能监控**
   - 升级后持续监控 24-48 小时
   - 关注错误日志
   - 记录性能指标

---

## 🆘 紧急联系

如遇到问题：
1. 查看日志：`docker compose logs -f`
2. 检查状态：`docker compose ps`
3. 回滚配置：使用 `.backup` 后缀的备份文件
4. 系统回滚：使用阿里云快照恢复

---

**最后更新：** 2026-01-27  
**维护者：** EduMaster 团队
