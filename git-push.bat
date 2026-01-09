@echo off
chcp 65001 >nul
echo ========================================
echo ExamMaster GitHub 推送脚本
echo ========================================
echo.

REM 检查是否已初始化
if not exist .git (
    echo [错误] Git 仓库未初始化
    echo 请先运行 git-init.bat
    pause
    exit /b 1
)

echo 请输入你的 GitHub 仓库地址
echo 例如：https://github.com/username/ExamMaster.git
echo.
set /p REPO_URL="仓库地址: "

if "%REPO_URL%"=="" (
    echo [错误] 仓库地址不能为空
    pause
    exit /b 1
)

echo.
echo [1/3] 添加远程仓库...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
if errorlevel 1 (
    echo [错误] 添加远程仓库失败
    pause
    exit /b 1
)
echo.

echo [2/3] 验证远程仓库...
git remote -v
echo.

echo [3/3] 推送到 GitHub...
echo.
echo 注意：如果提示输入用户名和密码
echo - 用户名：你的 GitHub 用户名
echo - 密码：Personal Access Token（不是 GitHub 密码）
echo.
echo 如何获取 Token：
echo 1. 访问 https://github.com/settings/tokens
echo 2. Generate new token (classic)
echo 3. 勾选 repo 权限
echo 4. 复制生成的 Token
echo.
pause
echo.

git push -u origin main

if errorlevel 1 (
    echo.
    echo [错误] 推送失败
    echo.
    echo 可能的原因：
    echo 1. 认证失败 - 请检查用户名和 Token
    echo 2. 仓库不存在 - 请先在 GitHub 创建仓库
    echo 3. 网络问题 - 请检查网络连接
    echo.
    echo 详细帮助请查看 GITHUB_SETUP.md
    pause
    exit /b 1
)

echo.
echo ========================================
echo 推送成功！
echo ========================================
echo.
echo 你的项目已上传到：
echo %REPO_URL%
echo.
echo 访问仓库：
echo %REPO_URL:~0,-4%
echo.
pause
