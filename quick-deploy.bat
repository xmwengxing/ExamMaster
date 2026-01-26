@echo off
REM 快速部署脚本 - 仅更新代码，不重新构建镜像
REM 适用于代码小改动的快速部署

echo ========================================
echo   EduMaster 快速部署
echo ========================================
echo.

set SERVER=root@47.104.173.139
set PROJECT_DIR=/www/wwwroot/exammaster.zzzjl.com

echo [1/5] 构建前端...
call npm run build
if errorlevel 1 (
    echo 错误: 构建失败
    pause
    exit /b 1
)
echo.

echo [2/5] 同步文件...
echo   - 前端 (dist/)
scp -r dist %SERVER%:%PROJECT_DIR%/
echo   - 后端 (server.js, db.js, utils/)
scp server.js db.js %SERVER%:%PROJECT_DIR%/
scp -r utils %SERVER%:%PROJECT_DIR%/
echo.

echo [3/5] 重启 API 服务...
ssh %SERVER% "cd %PROJECT_DIR% && docker compose restart api"
echo.

echo [4/5] 等待服务启动...
timeout /t 5 /nobreak >nul
echo.

echo [5/5] 检查状态...
ssh %SERVER% "cd %PROJECT_DIR% && docker compose ps api"
echo.

echo ========================================
echo   部署完成！
echo ========================================
echo.
echo 访问: https://exammaster.zzzjl.com
echo 记得强制刷新浏览器 (Ctrl + Shift + R)
echo.

pause
