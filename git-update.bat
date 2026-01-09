@echo off
chcp 65001 >nul
echo ========================================
echo Git 日常更新推送脚本
echo ========================================
echo.

REM 检查是否有修改
git status --short
if errorlevel 1 (
    echo [错误] Git 仓库未初始化
    pause
    exit /b 1
)

echo.
echo 以上是修改的文件
echo.

REM 询问提交信息
set /p COMMIT_MSG="请输入提交信息（描述你的修改）: "

if "%COMMIT_MSG%"=="" (
    echo [错误] 提交信息不能为空
    pause
    exit /b 1
)

echo.
echo [1/3] 添加修改的文件...
git add .

echo.
echo [2/3] 提交到本地仓库...
git commit -m "%COMMIT_MSG%"

if errorlevel 1 (
    echo.
    echo [提示] 没有需要提交的修改
    pause
    exit /b 0
)

echo.
echo [3/3] 推送到 GitHub...

REM 检查是否已设置上游分支
git rev-parse --abbrev-ref --symbolic-full-name @{u} >nul 2>&1
if errorlevel 1 (
    echo [提示] 首次推送，设置上游分支...
    git push -u origin main
) else (
    git push
)

if errorlevel 1 (
    echo.
    echo ========================================
    echo 推送失败
    echo ========================================
    echo.
    echo 可能的原因：
    echo 1. 网络问题
    echo 2. 认证失败
    echo 3. 远程仓库有新的提交
    echo.
    echo 如果提示需要先拉取，执行：
    echo   git pull origin main --rebase
    echo   git push
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo 推送成功！
echo ========================================
echo.
echo 你的修改已上传到 GitHub
echo 访问: https://github.com/xmwengxing/ExamMaster
echo.
pause
