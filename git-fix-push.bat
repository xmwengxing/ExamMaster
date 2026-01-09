@echo off
chcp 65001 >nul
echo ========================================
echo 快速修复推送冲突
echo ========================================
echo.

echo 这个脚本将：
echo 1. 强制推送你的代码到 GitHub
echo 2. 覆盖远程仓库的初始化文件
echo.
echo [警告] 远程仓库的内容将被替换！
echo.

choice /C YN /M "确认继续"
if errorlevel 2 (
    echo 操作已取消
    pause
    exit /b 0
)

echo.
echo 正在强制推送到 GitHub...
echo.

git push -f origin main

if errorlevel 1 (
    echo.
    echo ========================================
    echo 推送失败
    echo ========================================
    echo.
    echo 可能的原因：
    echo 1. 认证失败
    echo    - 确认用户名是否正确
    echo    - 确认使用的是 Token 而不是密码
    echo    - Token 是否有 repo 权限
    echo.
    echo 2. 网络问题
    echo    - 检查网络连接
    echo    - 尝试使用 VPN
    echo.
    echo 3. 仓库权限
    echo    - 确认你有仓库的写入权限
    echo.
    echo 如需帮助，查看 GITHUB_SETUP.md
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo 推送成功！
echo ========================================
echo.
echo 你的项目已成功上传到：
echo https://github.com/xmwengxing/ExamMaster
echo.
echo 建议操作：
echo 1. 访问仓库检查文件
echo 2. 添加仓库描述和标签
echo 3. 查看 README.md 显示效果
echo.
pause
