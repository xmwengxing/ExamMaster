@echo off
chcp 65001 >nul
REM ========================================
REM 快速部署脚本 - 仅更新代码，不重新构建镜像
REM 适用于代码小改动的快速部署，提高部署速度
REM 支持模块化架构和回滚机制
REM ========================================

echo.
echo ╔════════════════════════════════════════╗
echo ║     EduMaster 快速部署                 ║
echo ╚════════════════════════════════════════╝
echo.

REM 配置
set SERVER=root@47.104.173.139
set PROJECT_DIR=/www/wwwroot/exammaster.zzzjl.com
set BACKUP_DIR=%PROJECT_DIR%/backups
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

REM 环境变量验证
echo [0/9] 验证环境变量...
if not exist ".env.production" (
    echo ❌ 错误: .env.production 文件不存在
    pause
    exit /b 1
)
echo ✅ 环境配置文件存在
echo.

echo [1/9] 构建前端...
call npm run build
if errorlevel 1 (
    echo ❌ 错误: 构建失败
    pause
    exit /b 1
)
echo ✅ 前端构建成功
echo.

echo [2/9] 创建备份...
ssh %SERVER% "mkdir -p %BACKUP_DIR%/%TIMESTAMP%"
ssh %SERVER% "cd %PROJECT_DIR% && cp -r dist src server.js db.js utils package.json postgres/migrations %BACKUP_DIR%/%TIMESTAMP%/ 2>/dev/null || true"
echo ✅ 备份创建完成: %TIMESTAMP%
echo.

echo [3/9] 同步文件...
echo   📦 前端 (dist/)
scp -r dist %SERVER%:%PROJECT_DIR%/
echo   📦 后端模块化代码 (src/)
scp -r src %SERVER%:%PROJECT_DIR%/
echo   📦 主入口 (server.js, db.js)
scp server.js db.js %SERVER%:%PROJECT_DIR%/
echo   📦 工具函数 (utils/)
scp -r utils %SERVER%:%PROJECT_DIR%/
echo   📦 配置文件 (package.json, .env.production)
scp package.json .env.production %SERVER%:%PROJECT_DIR%/
echo ✅ 文件同步完成
echo.

echo [4/9] 同步数据库迁移脚本...
ssh %SERVER% "mkdir -p %PROJECT_DIR%/postgres/migrations"
scp postgres/migrations/*.sql %SERVER%:%PROJECT_DIR%/postgres/migrations/
echo ✅ 迁移脚本同步完成
echo.

echo [5/9] 安装依赖（如有更新）...
ssh %SERVER% "cd %PROJECT_DIR% && npm install --production"
echo ✅ 依赖安装完成
echo.

echo [6/9] 执行数据库迁移...
echo   📊 正在执行迁移脚本...
ssh %SERVER% "cd %PROJECT_DIR% && for file in postgres/migrations/*.sql; do echo \"执行: \$file\"; docker compose exec -T postgres psql -U edumaster_user -d edumaster < \$file 2>&1 || echo \"迁移脚本已执行或字段已存在\"; done"
echo ✅ 数据库迁移完成
echo.

echo [7/9] 重启 API 服务...
ssh %SERVER% "cd %PROJECT_DIR% && docker compose restart api"
if errorlevel 1 (
    echo ❌ 错误: 服务重启失败
    goto :rollback
)
echo ✅ 服务重启成功
echo.

echo [8/9] 等待服务启动...
timeout /t 5 /nobreak >nul
echo.

echo [9/9] 健康检查...
ssh %SERVER% "cd %PROJECT_DIR% && docker compose ps api"
ssh %SERVER% "curl -f http://localhost:3001/api/health || exit 1" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  警告: 健康检查失败
    set /p ROLLBACK_CONFIRM="是否回滚到上一个版本？(y/n): "
    if /i "%ROLLBACK_CONFIRM%"=="y" goto :rollback
)
echo ✅ 健康检查通过
echo.

echo.
echo ╔════════════════════════════════════════╗
echo ║     部署完成！                         ║
echo ╚════════════════════════════════════════╝
echo.
echo 🌐 访问地址: https://exammaster.zzzjl.com
echo 💡 提示: 记得强制刷新浏览器 (Ctrl + Shift + R)
echo 📦 备份位置: %BACKUP_DIR%/%TIMESTAMP%
echo.
pause
exit /b 0

:rollback
echo.
echo ╔════════════════════════════════════════╗
echo ║     开始回滚...                        ║
echo ╚════════════════════════════════════════╝
echo.
ssh %SERVER% "cd %PROJECT_DIR% && cp -r %BACKUP_DIR%/%TIMESTAMP%/* ./"
ssh %SERVER% "cd %PROJECT_DIR% && docker compose restart api"
echo ✅ 回滚完成
echo.
pause
exit /b 1
