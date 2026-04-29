#!/bin/bash

# Docker环境下重置管理员密码脚本

echo "========================================="
echo "重置管理员密码（Docker环境）"
echo "========================================="
echo ""

# 检查Docker容器是否运行
if ! docker ps | grep -q edumaster_api; then
    echo "❌ 错误: edumaster_api 容器未运行"
    echo "请先启动容器: docker-compose up -d"
    exit 1
fi

echo "✅ 检测到 edumaster_api 容器正在运行"
echo ""

# 在容器中执行创建管理员脚本
echo "正在重置管理员账号..."
docker exec edumaster_api node scripts/reset-admin-password.js

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✅ 管理员密码重置成功！"
    echo "========================================="
    echo ""
    echo "登录信息："
    echo "  用户名: admin"
    echo "  密码: admin"
    echo ""
    echo "请使用以上信息登录系统"
    echo ""
else
    echo ""
    echo "❌ 重置失败，请检查错误信息"
    exit 1
fi
