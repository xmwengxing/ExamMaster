#!/bin/bash

# Docker 快速启动脚本
# 用于快速启动 EduMaster Docker 环境

set -e

echo "🚀 EduMaster Docker 快速启动"
echo "=============================="

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "⚠️  .env 文件不存在，从 .env.example 复制..."
    cp .env.example .env
    echo "✅ 已创建 .env 文件，请编辑并配置数据库密码和 JWT 密钥"
    echo ""
    read -p "按 Enter 继续，或 Ctrl+C 退出编辑 .env 文件..."
fi

# 检查前端构建
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo "⚠️  前端未构建，开始构建..."
    npm install
    npm run build
    echo "✅ 前端构建完成"
fi

# 停止现有容器
echo ""
echo "🛑 停止现有容器..."
docker-compose down

# 启动服务
echo ""
echo "🚀 启动 Docker 服务..."
docker-compose up -d

# 等待服务启动
echo ""
echo "⏳ 等待服务启动（30秒）..."
sleep 30

# 检查容器状态
echo ""
echo "📦 容器状态:"
docker-compose ps

# 运行测试
echo ""
echo "🧪 运行健康检查..."
if node scripts/test-docker-deployment.js; then
    echo ""
    echo "✅ Docker 部署成功！"
    echo ""
    echo "访问地址:"
    echo "  前端: http://localhost"
    echo "  API: http://localhost:3001"
    echo ""
    echo "查看日志:"
    echo "  docker-compose logs -f"
    echo ""
    echo "停止服务:"
    echo "  docker-compose down"
else
    echo ""
    echo "⚠️  健康检查失败，请查看日志:"
    echo "  docker-compose logs"
fi
