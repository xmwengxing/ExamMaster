@echo off
chcp 65001 >nul
REM ========================================
REM GitHub 同步脚本
REM 功能：检查 Git 状态、交互式提交、自动推送
REM ========================================

echo.
echo ╔════════════════════════════════════════╗
echo ║     GitHub 同步脚本                    ║
echo ╚════════════════════════════════════════╝
echo.

REM 检查是否在 Git 仓库中
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：当前目录不是 Git 仓库
    pause
    exit /b 1
)

REM 检查当前分支
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo 📌 当前分支: %CURRENT_BRANCH%
echo.

REM 检查是否有未提交的更改
git diff --quiet
if errorlevel 1 (
    set HAS_CHANGES=1
) else (
    git diff --cached --quiet
    if errorlevel 1 (
        set HAS_CHANGES=1
    ) else (
        set HAS_CHANGES=0
    )
)

if %HAS_CHANGES%==0 (
    echo ✅ 工作区干净，没有未提交的更改
    echo.
    goto :push
)

REM 显示更改状态
echo 📋 当前更改状态:
echo ----------------------------------------
git status --short
echo ----------------------------------------
echo.

REM 询问是否要提交
set /p CONFIRM="是否要提交这些更改？(y/n): "
if /i not "%CONFIRM%"=="y" (
    echo ❌ 已取消提交
    pause
    exit /b 0
)

REM 添加所有更改
echo.
echo 📦 添加所有更改到暂存区...
git add -A
if errorlevel 1 (
    echo ❌ 添加文件失败
    pause
    exit /b 1
)

REM 输入提交信息
echo.
set /p COMMIT_MSG="请输入提交信息: "
if "%COMMIT_MSG%"=="" (
    echo ❌ 提交信息不能为空
    pause
    exit /b 1
)

REM 提交更改
echo.
echo 💾 提交更改...
git commit -m "%COMMIT_MSG%"
if errorlevel 1 (
    echo ❌ 提交失败
    pause
    exit /b 1
)
echo ✅ 提交成功

:push
REM 询问是否推送
echo.
set /p PUSH_CONFIRM="是否要推送到远程仓库？(y/n): "
if /i not "%PUSH_CONFIRM%"=="y" (
    echo ℹ️  已跳过推送
    pause
    exit /b 0
)

REM 检查远程仓库
git remote -v | findstr "origin" >nul
if errorlevel 1 (
    echo ❌ 错误：未配置远程仓库 origin
    echo.
    echo 请先配置远程仓库：
    echo git remote add origin [your-repo-url]
    pause
    exit /b 1
)

REM 推送到远程仓库
echo.
echo 🚀 推送到远程仓库...
git push origin %CURRENT_BRANCH%
if errorlevel 1 (
    echo.
    echo ⚠️  推送失败，可能需要先拉取远程更改
    echo.
    set /p PULL_CONFIRM="是否要先拉取远程更改？(y/n): "
    if /i "%PULL_CONFIRM%"=="y" (
        echo.
        echo 📥 拉取远程更改...
        git pull origin %CURRENT_BRANCH% --rebase
        if errorlevel 1 (
            echo ❌ 拉取失败，请手动解决冲突
            pause
            exit /b 1
        )
        echo.
        echo 🚀 重新推送...
        git push origin %CURRENT_BRANCH%
        if errorlevel 1 (
            echo ❌ 推送失败
            pause
            exit /b 1
        )
    ) else (
        echo ❌ 已取消推送
        pause
        exit /b 1
    )
)

echo.
echo ✅ 同步完成！
echo.
echo 📊 最近的提交:
git log --oneline -5
echo.

pause
