# Docker 部署测试说明

本文档说明如何测试 Docker 部署的各个方面。

## 测试前准备

### 1. 确保 Docker 已安装

```bash
# 检查 Docker 版本
docker --version

# 检查 Docker Compose 版本
docker-compose --version
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，至少修改以下配置：
# - DB_PASSWORD: 数据库密码
# - JWT_SECRET: JWT 密钥
# - DB_HOST: 设置为 'postgres'（Docker 容器名称）
```

### 3. 构建前端

```bash
npm install
npm run build
```

## 测试步骤

### 步骤 1: 构建 Docker 镜像

```bash
# 构建后端镜像
docker-compose build api

# 查看构建的镜像
docker images | grep edumaster
```

**预期结果**：
- 镜像构建成功，无错误
- 可以看到 edumaster_api 镜像

### 步骤 2: 启动 Docker Compose

```bash
# 启动所有服务（后台模式）
docker-compose up -d

# 查看容器状态
docker-compose ps
```

**预期结果**：
- 所有容器状态为 "Up" 或 "Up (healthy)"
- 应该有 3 个容器：postgres, api, nginx

### 步骤 3: 验证服务健康状态

```bash
# 等待服务启动（约 30 秒）
sleep 30

# 检查容器健康状态
docker-compose ps

# 查看容器日志
docker-compose logs --tail=50
```

**预期结果**：
- PostgreSQL 容器健康检查通过
- API 容器健康检查通过
- Nginx 容器健康检查通过
- 日志中无严重错误

### 步骤 4: 测试 API 端点

```bash
# 测试 API 健康检查
curl http://localhost:3001/api/health

# 预期响应：
# {"status":"healthy","timestamp":"...","database":"connected"}
```

### 步骤 5: 测试 Nginx 代理

```bash
# 测试 Nginx 健康检查
curl http://localhost/health

# 测试 Nginx 代理 API
curl http://localhost/api/health

# 预期响应：
# {"status":"healthy","timestamp":"...","database":"connected"}
```

### 步骤 6: 测试前端访问

```bash
# 使用浏览器访问
# http://localhost

# 或使用 curl 检查
curl -I http://localhost
```

**预期结果**：
- 返回 200 状态码
- Content-Type 为 text/html

### 步骤 7: 运行自动化测试脚本

```bash
# 运行完整的测试脚本
node scripts/test-docker-deployment.js
```

**预期结果**：
- 所有测试通过
- 显示 "🎉 所有测试通过！Docker 部署正常工作。"

### 步骤 8: 测试数据持久化

```bash
# 1. 检查数据卷
docker volume ls | grep postgres

# 2. 重启容器
docker-compose restart postgres

# 3. 等待重启完成
sleep 10

# 4. 验证数据库仍然可访问
curl http://localhost:3001/api/health
```

**预期结果**：
- 数据卷存在
- 重启后数据库连接正常
- API 健康检查通过

### 步骤 9: 测试容器重启策略

```bash
# 1. 停止 API 容器
docker-compose stop api

# 2. 等待几秒
sleep 5

# 3. 检查容器是否自动重启
docker-compose ps api

# 4. 如果未自动重启，手动启动
docker-compose start api
```

**预期结果**：
- 容器配置了 `restart: unless-stopped`
- 停止后不会自动重启（需要手动启动或系统重启）

## 测试数据库功能

### 测试数据库连接

```bash
# 进入 PostgreSQL 容器
docker-compose exec postgres psql -U edumaster_user -d edumaster

# 在 psql 中执行：
\dt                    # 列出所有表
SELECT COUNT(*) FROM users;  # 查询用户数量
\q                     # 退出
```

### 测试数据迁移（如果有 SQLite 数据）

```bash
# 1. 确保 PostgreSQL 容器运行
docker-compose up -d postgres

# 2. 等待数据库就绪
sleep 10

# 3. 运行迁移脚本
node scripts/migrate.js

# 4. 验证迁移结果
node scripts/verify-migration.js
```

## 故障排查

### 问题 1: 容器无法启动

```bash
# 查看详细日志
docker-compose logs <service_name>

# 检查配置
docker-compose config

# 重新构建
docker-compose up -d --build
```

### 问题 2: 数据库连接失败

```bash
# 检查 PostgreSQL 日志
docker-compose logs postgres

# 检查网络连接
docker-compose exec api ping postgres

# 验证环境变量
docker-compose exec api env | grep DB_
```

### 问题 3: Nginx 无法访问

```bash
# 检查 Nginx 配置
docker-compose exec nginx nginx -t

# 查看 Nginx 日志
docker-compose logs nginx

# 测试 API 连接
docker-compose exec nginx wget -O- http://api:3001/api/health
```

### 问题 4: 端口冲突

```bash
# 检查端口占用
netstat -ano | findstr :3001
netstat -ano | findstr :5432
netstat -ano | findstr :80

# 修改 .env 文件中的端口
# 然后重启服务
docker-compose down
docker-compose up -d
```

## 清理测试环境

### 停止服务

```bash
# 停止所有容器
docker-compose stop

# 停止并删除容器
docker-compose down
```

### 删除数据（⚠️ 谨慎操作）

```bash
# 删除容器和数据卷
docker-compose down -v

# 删除镜像
docker rmi $(docker images | grep edumaster | awk '{print $3}')
```

### 完全清理

```bash
# 删除所有相关资源
docker-compose down -v --rmi all --remove-orphans

# 清理未使用的 Docker 资源
docker system prune -a
```

## 测试检查清单

- [ ] Docker 和 Docker Compose 已安装
- [ ] 环境变量已配置
- [ ] 前端已构建
- [ ] Docker 镜像构建成功
- [ ] 所有容器启动成功
- [ ] PostgreSQL 健康检查通过
- [ ] API 健康检查通过
- [ ] Nginx 健康检查通过
- [ ] API 端点可访问
- [ ] Nginx 代理工作正常
- [ ] 前端页面可访问
- [ ] 数据卷已创建
- [ ] 数据持久化正常
- [ ] 容器重启策略正确
- [ ] 自动化测试脚本通过

## 下一步

测试通过后，可以继续进行：

1. **任务 11**: 配置 Nginx（HTTPS、SSL 证书）
2. **任务 12**: 构建前端
3. **任务 13**: 检查点 - 确保 Docker 环境正常运行
4. **任务 14+**: 准备服务器部署

详细步骤请参考 `tasks.md` 文件。
