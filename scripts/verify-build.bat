@echo off
chcp 65001 >nul
echo ========================================
echo 构建产物验证脚本
echo ========================================
echo.

echo [1/5] 检查 dist 目录...
if not exist "dist" (
    echo ❌ dist 目录不存在
    exit /b 1
)
echo ✅ dist 目录存在

echo.
echo [2/5] 检查关键文件...
set "missing=0"

if not exist "dist\index.html" (
    echo ❌ index.html 缺失
    set "missing=1"
) else (
    echo ✅ index.html 存在
)

if not exist "dist\manifest.json" (
    echo ❌ manifest.json 缺失
    set "missing=1"
) else (
    echo ✅ manifest.json 存在
)

if not exist "dist\sw.js" (
    echo ❌ sw.js 缺失
    set "missing=1"
) else (
    echo ✅ sw.js 存在
)

if not exist "dist\assets" (
    echo ❌ assets 目录缺失
    set "missing=1"
) else (
    echo ✅ assets 目录存在
)

if "%missing%"=="1" (
    echo.
    echo ❌ 有文件缺失，请重新构建
    exit /b 1
)

echo.
echo [3/5] 检查 JS 文件...
dir /b "dist\assets\*.js" >nul 2>&1
if errorlevel 1 (
    echo ❌ 没有找到 JS 文件
    exit /b 1
)
echo ✅ JS 文件存在

echo.
echo [4/5] 检查 CSS 文件...
dir /b "dist\assets\*.css" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  没有找到 CSS 文件（可能正常）
) else (
    echo ✅ CSS 文件存在
)

echo.
echo [5/5] 统计文件大小...
for /f "tokens=3" %%a in ('dir /s "dist" ^| find "个文件"') do set "filecount=%%a"
for /f "tokens=3" %%a in ('dir /s "dist" ^| find "字节"') do set "totalsize=%%a"
echo 📊 总文件数: %filecount%
echo 📊 总大小: %totalsize% 字节

echo.
echo ========================================
echo ✅ 构建产物验证通过！
echo ========================================
echo.
echo 可以安全部署到生产环境
echo.

exit /b 0
