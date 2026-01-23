# Docker 快速开始指南

## 5 分钟快速部署

### 前置要求

- ✅ Docker 20.10+
- ✅ Docker Compose 2.0+
- ✅ Node.js 18+ (用于构建前端)

### 快速启动步骤

#### 方法 1: 使用自动化脚本（推荐）

**Windows 用户**:
```bash
docker-start.bat
```

**Linux/Mac 用户**:
```bash
chmod +x docker-start.sh
./docker-start.sh
```

脚本会自动完成：
1. ✅ 检查 Docker 环境
2. ✅ 创建 .env 文件（如果不存在）
3. ✅ 构建前端（如果未构建）
4. ✅ 启动所有服务
5. ✅ 运行健康检查

#### 方法 2: 手动启动

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env，修改 DB_PASSWORD 和 JWT_SECRET

# 2. 构建前端
npm install
npm run build

# 3. 启动服务
docker-compose up -d

# 4. 等待服务启动（约 30 秒）
# 然后访问 http://localhost
```

### 验证部署

```bash
# 运行自动化测试
node scripts/test-docker-deployment.js

# 或手动测试
curl http://localhost/api/health
```

### 访问应用

- 🌐 前端: http://localhost
- 🔌 API: http://localhost:3001
- 🗄️ 数据库: localhost:5432

### 常用命令

```bash
# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启
docker-compose restart

# 停止
docker-compose down
```

## 故障排查

### 问题：端口被占用

修改 `.env` 文件中的端口：
```env
PORT=3002        # API 端口
DB_PORT=5433     # 数据库端口
```

### 问题：容器无法启动

```bash
# 查看日志
docker-compose logs <service_name>

# 重新构建
docker-compose up -d --build
```

### 问题：数据库连接失败

确保 `.env` 文件中：
```env
DB_HOST=postgres  # 必须是容器名称
```

## 更多信息

- 📖 [完整部署指南](./DOCKER_DEPLOYMENT_GUIDE.md)
- 🧪 [测试说明](./DOCKER_TEST_README.md)
- 📋 [任务完成总结](./TASK_10_DOCKER_COMPLETION_SUMMARY.md)
