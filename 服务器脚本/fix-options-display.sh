#!/bin/bash
# 修复题目选项显示问题 - 服务器端部署脚本

PROJECT_DIR="/www/wwwroot/exammaster.zzzjl.com"

echo "=== 修复题目选项显示问题 ==="
echo "项目路径: $PROJECT_DIR"
echo ""

cd $PROJECT_DIR || exit 1

# 备份当前的 server.js
echo "1. 备份当前文件..."
cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)

# 重启 API 服务
echo ""
echo "2. 重启 API 服务..."
docker compose restart api

# 等待服务启动
echo ""
echo "3. 等待服务启动..."
sleep 5

# 检查服务状态
echo ""
echo "4. 检查服务状态..."
docker compose ps api

# 查看日志
echo ""
echo "5. 查看最新日志..."
docker compose logs --tail=20 api

echo ""
echo "=== 修复完成 ==="
echo ""
echo "请在浏览器中测试："
echo "1. 访问 https://exammaster.zzzjl.com"
echo "2. 强制刷新页面（Ctrl + Shift + R）"
echo "3. 进入题库管理，查看题目列表"
echo "4. 确认选项能正常显示"
