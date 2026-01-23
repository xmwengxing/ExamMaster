# Docker 部署指南

本指南介绍如何使用 Docker 和 Docker Compose 部署 EduMaster 刷题系统。

## 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 2GB 可用内存
- 至少 5GB 可用磁盘空间

## 快速开始

### 1. 准备环境变量

复制环境变量模板并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，修改以下关键配置：

```env
# 数据库密码（必须修改）
DB_PASSWORD=your_strong_password_here

# JWT 密钥（必须修改）
JWT_SECRET=your_jwt_secret_here

# Docker 部署时，数据库主机设置为容器名称
DB_HOST=postgres
```

### 2. 构建前端

在启动 Docker 之前，需要先构建前端：

```bash
npm install
npm run build
```

这会在 `dist/` 目录生成前端构建产物。

### 3. 启动服务

使用 Docker Compose 启动所有服务：

```bash
# 后台启动
docker-compose up -d

# 或者前台启动（查看日志）
docker-compose up
```

### 4. 验证部署

等待所有服务启动（约 30-60 秒），然后运行测试脚本：

```bash
node scripts/test-docker-deployment.js
```

或者手动验证：

```bash
# 检查容器状态
docker-compose ps

# 测试 API
curl http://localhost:3001/api/health

# 测试 Nginx
curl http://localhost/health

# 测试 API 代理
curl http://localhost/api/health
```

### 5. 访问应用

- 前端: http://localhost
- API: http://localhost:3001
- 数据库: localhost:5432

## 常用命令

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f postgres
docker-compose logs -f api
docker-compose logs -f nginx
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart api
```

### 停止服务

```bash
# 停止所有服务
docker-compose stop

# 停止并删除容器
docker-compose down

# 停止并删除容器和数据卷（⚠️ 会删除数据库数据）
docker-compose down -v
```

### 重新构建

```bash
# 重新构建并启动
docker-compose up -d --build

# 仅重新构建 API 服务
docker-compose build api
```

## 数据管理

### 数据持久化

PostgreSQL 数据存储在 Docker 数据卷中：

```bash
# 查看数据卷
docker volume ls | grep postgres

# 查看数据卷详情
docker volume inspect <volume_name>
```

### 数据备份

```bash
# 备份数据库
docker-compose exec postgres pg_dump -U edumaster_user edumaster > backup.sql

# 或使用自定义格式（推荐）
docker-compose exec postgres pg_dump -U edumaster_user -Fc edumaster > backup.dump
```

### 数据恢复

```bash
# 从 SQL 文件恢复
docker-compose exec -T postgres psql -U edumaster_user edumaster < backup.sql

# 从自定义格式恢复
docker-compose exec -T postgres pg_restore -U edumaster_user -d edumaster backup.dump
```

### 数据迁移

如果已有 SQLite 数据库，需要先迁移数据：

```bash
# 1. 启动 PostgreSQL 容器
docker-compose up -d postgres

# 2. 等待数据库就绪
sleep 10

# 3. 运行迁移脚本
node scripts/migrate.js

# 4. 启动其他服务
docker-compose up -d
```

## 故障排查

### 容器无法启动

```bash
# 查看容器状态
docker-compose ps

# 查看详细日志
docker-compose logs <service_name>

# 检查配置文件
docker-compose config
```

### 数据库连接失败

1. 检查 `.env` 文件中的数据库配置
2. 确认 `DB_HOST=postgres`（容器名称）
3. 检查 PostgreSQL 容器是否健康：

```bash
docker-compose ps postgres
docker-compose logs postgres
```

### API 无法访问

1. 检查 API 容器日志：

```bash
docker-compose logs api
```

2. 确认 API 容器健康检查通过：

```bash
docker-compose ps api
```

3. 测试 API 端点：

```bash
curl http://localhost:3001/api/health
```

### Nginx 代理问题

1. 检查 Nginx 配置：

```bash
docker-compose exec nginx nginx -t
```

2. 查看 Nginx 日志：

```bash
docker-compose logs nginx
```

3. 确认 API 服务可达：

```bash
docker-compose exec nginx wget -O- http://api:3001/api/health
```

### 端口冲突

如果端口已被占用，修改 `.env` 文件中的端口配置：

```env
PORT=3002        # API 端口
DB_PORT=5433     # PostgreSQL 端口
HTTP_PORT=8080   # Nginx HTTP 端口
```

然后重启服务：

```bash
docker-compose down
docker-compose up -d
```

## 性能优化

### 调整连接池

编辑 `db.js`，调整连接池参数：

```javascript
const pool = new Pool({
  // ...
  min: 2,      // 最小连接数
  max: 20,     // 最大连接数（根据负载调整）
  idleTimeoutMillis: 30000,
});
```

### 调整 Nginx 工作进程

编辑 `nginx/nginx.conf`：

```nginx
worker_processes auto;  # 自动根据 CPU 核心数调整
worker_connections 1024; # 每个进程的最大连接数
```

### 限制容器资源

编辑 `docker-compose.yml`，添加资源限制：

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## 安全建议

1. **修改默认密码**：生产环境必须修改 `DB_PASSWORD` 和 `JWT_SECRET`
2. **限制数据库访问**：不要暴露 PostgreSQL 端口到公网
3. **使用 HTTPS**：生产环境配置 SSL 证书
4. **定期备份**：设置自动备份任务
5. **更新镜像**：定期更新 Docker 镜像到最新版本

## 生产环境部署

生产环境部署的额外步骤：

1. **配置 SSL 证书**（见任务 11）
2. **配置域名解析**
3. **设置防火墙规则**
4. **配置自动备份**
5. **配置监控和日志**
6. **配置 CI/CD 自动部署**

详细步骤请参考完整的部署文档。

## 参考资料

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [PostgreSQL Docker 镜像](https://hub.docker.com/_/postgres)
- [Nginx Docker 镜像](https://hub.docker.com/_/nginx)
