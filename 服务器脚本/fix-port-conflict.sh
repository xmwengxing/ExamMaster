#!/bin/bash
# 修复端口冲突问题

PROJECT_DIR="/www/wwwroot/exammaster.zzzjl.com"

echo "=== 修复端口冲突问题 ==="
echo ""

cd $PROJECT_DIR || exit 1

# 1. 停止所有容器
echo "1. 停止所有容器..."
docker compose down

# 2. 检查端口占用
echo ""
echo "2. 检查端口占用情况..."
echo "端口 80:"
netstat -tlnp | grep :80 || echo "  端口 80 未被占用"
echo ""
echo "端口 443:"
netstat -tlnp | grep :443 || echo "  端口 443 未被占用"
echo ""
echo "端口 3001:"
netstat -tlnp | grep :3001 || echo "  端口 3001 未被占用"

# 3. 清理可能的僵尸容器
echo ""
echo "3. 清理僵尸容器..."
docker ps -a | grep edumaster | awk '{print $1}' | xargs -r docker rm -f

# 4. 重新启动服务
echo ""
echo "4. 重新启动服务..."
docker compose up -d

# 5. 等待服务启动
echo ""
echo "5. 等待服务启动..."
sleep 10

# 6. 检查服务状态
echo ""
echo "6. 检查服务状态..."
docker compose ps

# 7. 查看日志
echo ""
echo "7. 查看 API 日志..."
docker compose logs --tail=20 api

echo ""
echo "=== 修复完成 ==="
