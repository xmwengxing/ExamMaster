@echo off
chcp 65001 >nul
echo ==========================================
echo 服务器环境检查
echo ==========================================
echo.
echo 正在连接到服务器 47.104.173.139...
echo 请输入 root 密码
echo.

ssh root@47.104.173.139 "echo '=== 系统信息 ===' && cat /etc/os-release | grep PRETTY_NAME && echo '' && echo '=== Docker 检查 ===' && docker --version 2>&1 && echo '' && echo '=== Docker Compose 检查 ===' && (docker-compose --version 2>&1 || docker compose version 2>&1) && echo '' && echo '=== Git 检查 ===' && git --version 2>&1 && echo '' && echo '=== 端口检查 ===' && echo '端口 80:' && (ss -tuln | grep ':80 ' || echo '可用') && echo '端口 443:' && (ss -tuln | grep ':443 ' || echo '可用') && echo '端口 5432:' && (ss -tuln | grep ':5432 ' || echo '可用') && echo '' && echo '=== 目录检查 ===' && ls -la /www/wwwroot 2>&1 && echo '' && echo '=== 磁盘空间 ===' && df -h / | tail -1"

echo.
echo ==========================================
echo 检查完成
echo ==========================================
pause
