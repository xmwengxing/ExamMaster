@echo off
chcp 65001 >nul
echo ========================================
echo 测试学员更新功能
echo ========================================
echo.

echo [1/3] 重启 Docker 容器...
docker compose restart api
timeout /t 3 >nul

echo.
echo [2/3] 检查数据库状态...
docker compose exec postgres psql -U edumaster_user -d edumaster -f /app/fix-remaining-bugs.sql

echo.
echo [3/3] 查看 API 日志 (最近50行)...
docker compose logs --tail=50 api

echo.
echo ========================================
echo 测试准备完成!
echo ========================================
echo.
echo 请在浏览器中测试:
echo 1. 编辑学员信息,填写身份证号、学历性质、最高学历、班级
echo 2. 保存后刷新页面,检查字段是否显示
echo 3. 不修改密码再次保存,检查是否能正常登录
echo.
pause
