@echo off
chcp 65001 >nul
echo ========================================
echo ExamMaster GitHub 初始化脚本
echo ========================================
echo.

REM 先运行检查
echo [步骤 0] 运行上传前检查...
echo.
call git-clean-check.bat
echo.

echo ========================================
echo 继续初始化？
echo ========================================
echo.
choice /C YN /M "确认继续初始化 Git 仓库"
if errorlevel 2 goto :end
echo.

REM 检查是否已初始化
if exist .git (
    echo [警告] Git 仓库已存在
    echo.
    choice /C YN /M "是否继续（这将重新初始化仓库）"
    if errorlevel 2 goto :end
    echo.
    echo 删除现有 .git 目录...
    rmdir /s /q .git
)

echo [1/6] 初始化 Git 仓库...
git init
if errorlevel 1 (
    echo [错误] Git 初始化失败，请确保已安装 Git
    pause
    exit /b 1
)
echo.

echo [2/6] 添加所有文件到暂存区...
git add .
echo.

echo [3/6] 查看将要提交的文件...
git status
echo.
echo 请仔细检查上面的文件列表
echo 确保没有敏感文件（.env, *.db, *.pem 等）
echo.
pause
echo.

echo [4/6] 提交到本地仓库...
git commit -m "Initial commit: ExamMaster v2.0.0"
if errorlevel 1 (
    echo [错误] 提交失败
    pause
    exit /b 1
)
echo.

echo [5/6] 设置默认分支为 main...
git branch -M main
echo.

echo [6/6] 查看提交结果...
git log --oneline -1
echo.

echo ========================================
echo 初始化完成！
echo ========================================
echo.
echo 接下来需要手动操作：
echo ========================================
echo.
echo 1. 在 GitHub 创建名为 ExamMaster 的仓库
echo    访问: https://github.com/new
echo.
echo 2. 仓库设置：
echo    - Repository name: ExamMaster
echo    - Description: 智能刷题考试系统
echo    - Public 或 Private
echo    - 不要勾选任何初始化选项
echo.
echo 3. 创建后，运行推送脚本：
echo    git-push.bat
echo.
echo 或手动执行：
echo    git remote add origin 你的仓库地址
echo    git push -u origin main
echo.
echo 详细步骤请查看 GITHUB_SETUP.md 文件
echo ========================================
echo.

:end
pause
