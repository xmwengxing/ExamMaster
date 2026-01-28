@echo off
chcp 65001 >nul
REM ========================================
REM 手动执行数据库迁移脚本
REM ========================================

echo.
echo ╔════════════════════════════════════════╗
echo ║     执行数据库迁移                     ║
echo ╚════════════════════════════════════════╝
echo.

set SERVER=root@47.104.173.139
set PROJECT_DIR=/www/wwwroot/exammaster.zzzjl.com

echo [1/3] 上传迁移脚本...
scp postgres/migrations/add_custom_practice_fields.sql %SERVER%:%PROJECT_DIR%/postgres/migrations/
echo ✅ 上传完成
echo.

echo [2/3] 执行迁移脚本...
ssh %SERVER% "cd %PROJECT_DIR% && docker compose exec -T postgres psql -U edumaster_user -d edumaster < postgres/migrations/add_custom_practice_fields.sql"
echo ✅ 迁移完成
echo.

echo [3/3] 验证字段是否添加成功...
ssh %SERVER% "cd %PROJECT_DIR% && docker compose exec -T postgres psql -U edumaster_user -d edumaster -c '\d practice_records'"
echo.

echo ╔════════════════════════════════════════╗
echo ║     迁移完成！                         ║
echo ╚════════════════════════════════════════╝
echo.
pause
