@echo off
chcp 65001 >nul
echo =========================================
echo 重置管理员密码（Docker环境）
echo =========================================
echo.

REM 检查Docker容器是否运行
docker ps | findstr "edumaster_postgres" >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: edumaster_postgres 容器未运行
    echo 请先启动容器: docker-compose up -d
    echo.
    pause
    exit /b 1
)

echo ✅ 检测到数据库容器正在运行
echo.

REM 执行SQL脚本重置管理员
echo 正在重置管理员账号...
type reset-admin.sql | docker exec -i edumaster_postgres psql -U edumaster_user -d edumaster >nul 2>&1

if errorlevel 1 (
    echo.
    echo ❌ 重置失败，请检查错误信息
    echo.
    pause
    exit /b 1
)

echo.
echo =========================================
echo ✅ 管理员密码重置成功！
echo =========================================
echo.
echo 登录信息：
echo   用户名: admin
echo   密码: admin
echo.
echo 请使用以上信息登录系统
echo.
pause
