@echo off
chcp 65001 >nul
echo.
echo ========================================
echo      GitHub 快速同步
echo ========================================
echo.

REM 检查 Git 仓库
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [ERROR] 不是 Git 仓库
    pause
    exit /b 1
)

REM 设置中文文件名支持
git config core.quotepath false

REM 显示当前分支
for /f "tokens=*" %%i in ('git branch --show-current') do set BRANCH=%%i
echo 当前分支: %BRANCH%
echo.

REM 显示更改数量
for /f %%i in ('git status --short ^| find /c /v ""') do set COUNT=%%i
echo 更改文件数: %COUNT%
echo.

if %COUNT%==0 (
    echo [INFO] 没有需要提交的更改
    goto :push
)

REM 显示更改
echo 更改列表:
echo ----------------------------------------
git status --short
echo ----------------------------------------
echo.

REM 确认提交
set /p CONFIRM="提交这些更改? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo [INFO] 已取消
    pause
    exit /b 0
)

REM 添加文件
echo.
echo 添加文件...
git add -A
if errorlevel 1 (
    echo [ERROR] 添加失败
    pause
    exit /b 1
)

REM 输入提交信息
echo.
echo 提交信息模板:
echo   1 - 修复问题
echo   2 - 添加功能
echo   3 - 更新文档
echo   4 - 重构代码
echo   5 - 自定义
echo.
set /p CHOICE="选择 (1-5): "

if "%CHOICE%"=="1" set MSG=修复问题
if "%CHOICE%"=="2" set MSG=添加功能
if "%CHOICE%"=="3" set MSG=更新文档
if "%CHOICE%"=="4" set MSG=重构代码
if "%CHOICE%"=="5" (
    set /p MSG="输入提交信息: "
)

if "%MSG%"=="" (
    echo [ERROR] 提交信息不能为空
    pause
    exit /b 1
)

REM 提交
echo.
echo 提交: %MSG%
git commit -m "%MSG%"
if errorlevel 1 (
    echo [ERROR] 提交失败
    pause
    exit /b 1
)
echo [OK] 提交成功

:push
REM 推送
echo.
set /p PUSH="推送到远程? (y/n): "
if /i not "%PUSH%"=="y" (
    echo [INFO] 已跳过推送
    pause
    exit /b 0
)

echo.
echo 推送到 %BRANCH%...
git push origin %BRANCH%
if errorlevel 1 (
    echo.
    echo [ERROR] 推送失败
    echo.
    echo 可能原因:
    echo   - 网络问题
    echo   - 需要先拉取: git pull origin %BRANCH%
    echo   - 权限问题
    echo.
    echo 稍后可手动推送: git push origin %BRANCH%
    pause
    exit /b 1
)

echo.
echo [OK] 同步完成!
echo.
git log --oneline -3
echo.

pause
