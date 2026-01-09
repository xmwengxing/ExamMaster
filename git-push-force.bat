@echo off
chcp 65001 >nul
echo ========================================
echo Git 推送冲突解决脚本
echo ========================================
echo.

echo 检测到远程仓库有冲突
echo.
echo 可能的原因：
echo 1. 在 GitHub 创建仓库时勾选了初始化选项（README、.gitignore、LICENSE）
echo 2. 远程仓库已有其他提交
echo.
echo ========================================
echo 解决方案选择
echo ========================================
echo.
echo [1] 强制推送（覆盖远程仓库）- 推荐
echo     - 适用于：刚创建的仓库，远程只有初始化文件
echo     - 结果：远程仓库将被本地代码完全替换
echo.
echo [2] 合并推送（保留远程内容）
echo     - 适用于：需要保留远程仓库的某些文件
echo     - 结果：合并远程和本地的内容
echo.
echo [3] 取消操作
echo.

choice /C 123 /M "请选择解决方案"

if errorlevel 3 goto :end
if errorlevel 2 goto :merge
if errorlevel 1 goto :force

:force
echo.
echo ========================================
echo 方案 1: 强制推送
echo ========================================
echo.
echo [警告] 这将覆盖远程仓库的所有内容！
echo.
choice /C YN /M "确认要强制推送吗"
if errorlevel 2 goto :end

echo.
echo 正在强制推送...
git push -f origin main

if errorlevel 1 (
    echo.
    echo [错误] 强制推送失败
    echo.
    echo 可能的原因：
    echo 1. 认证失败 - 检查 Token 是否正确
    echo 2. 网络问题 - 检查网络连接
    echo 3. 权限不足 - 检查仓库权限
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo 强制推送成功！
echo ========================================
echo.
echo 你的代码已上传到 GitHub
echo 访问: https://github.com/xmwengxing/ExamMaster
echo.
goto :success

:merge
echo.
echo ========================================
echo 方案 2: 合并推送
echo ========================================
echo.
echo 步骤 1: 拉取远程代码...
git pull origin main --allow-unrelated-histories

if errorlevel 1 (
    echo.
    echo [错误] 拉取失败
    echo.
    echo 可能需要手动解决冲突
    echo 请查看冲突文件，解决后执行：
    echo   git add .
    echo   git commit -m "Merge remote changes"
    echo   git push origin main
    echo.
    pause
    exit /b 1
)

echo.
echo 步骤 2: 检查是否有冲突...
git status

echo.
echo 如果有冲突，请手动解决后执行：
echo   git add .
echo   git commit -m "Merge remote changes"
echo   git push origin main
echo.
echo 如果没有冲突，按任意键继续推送...
pause

echo.
echo 步骤 3: 推送到远程...
git push origin main

if errorlevel 1 (
    echo.
    echo [错误] 推送失败
    pause
    exit /b 1
)

echo.
echo ========================================
echo 合并推送成功！
echo ========================================
echo.
goto :success

:success
echo 后续操作建议：
echo.
echo 1. 访问你的仓库
echo    https://github.com/xmwengxing/ExamMaster
echo.
echo 2. 添加仓库描述和 Topics
echo    - Description: 智能刷题考试系统
echo    - Topics: education, exam-system, react, typescript, sqlite, ai
echo.
echo 3. 检查 README.md 是否正确显示
echo.
echo 4. 设置仓库可见性（如需要）
echo    Settings → Danger Zone → Change visibility
echo.
goto :end

:end
pause
