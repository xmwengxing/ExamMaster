@echo off
chcp 65001 >nul
echo ========================================
echo Git 上传前检查脚本
echo ========================================
echo.

echo 正在检查将要上传的文件...
echo.

REM 检查是否有敏感文件
echo [检查敏感文件]
echo.

set FOUND_ISSUES=0

if exist .env (
    echo [警告] 发现 .env 文件
    set FOUND_ISSUES=1
)

if exist .env.local (
    echo [警告] 发现 .env.local 文件
    set FOUND_ISSUES=1
)

if exist .env.production (
    echo [警告] 发现 .env.production 文件
    set FOUND_ISSUES=1
)

if exist edumaster.db (
    echo [警告] 发现数据库文件 edumaster.db
    set FOUND_ISSUES=1
)

if exist cloudflare-cert.pem (
    echo [警告] 发现 SSL 证书文件
    set FOUND_ISSUES=1
)

if exist cloudflare-key.pem (
    echo [警告] 发现 SSL 密钥文件
    set FOUND_ISSUES=1
)

if exist .vscode (
    echo [提示] 发现 .vscode 目录（将被排除）
)

if exist .kiro (
    echo [提示] 发现 .kiro 目录（将被排除）
)

if exist .github (
    echo [提示] 发现 .github 目录（将被排除）
)

echo.
echo [检查测试文件]
echo.

for %%f in (test-*.html test-*.js check-*.js create-*.js fix-*.cjs) do (
    if exist %%f (
        echo [提示] 发现测试文件: %%f （将被排除）
    )
)

echo.
echo [检查部署脚本]
echo.

for %%f in (deploy*.bat deploy*.sh upload-*.sh setup-*.bat setup-*.sh verify-*.sh vps-*.sh) do (
    if exist %%f (
        echo [提示] 发现部署脚本: %%f （将被排除）
    )
)

echo.
echo [检查配置文件]
echo.

if exist nginx.conf (
    echo [提示] 发现 nginx.conf （将被排除）
)

if exist nginx-ssl.conf (
    echo [提示] 发现 nginx-ssl.conf （将被排除）
)

if exist ecosystem.config.cjs (
    echo [提示] 发现 ecosystem.config.cjs （将被排除）
)

echo.
echo ========================================
echo 检查完成
echo ========================================
echo.

if %FOUND_ISSUES%==1 (
    echo [警告] 发现敏感文件！
    echo 这些文件已在 .gitignore 中排除，不会被上传
    echo 但建议你检查确认
) else (
    echo [成功] 未发现敏感文件
)

echo.
echo 将要上传的文件列表：
echo.
git status --short 2>nul
if errorlevel 1 (
    echo [提示] Git 仓库未初始化，请先运行 git-init.bat
)

echo.
echo ========================================
echo 建议操作：
echo ========================================
echo.
echo 1. 确认 .gitignore 文件已正确配置
echo 2. 检查上面的文件列表
echo 3. 如果确认无误，运行 git-init.bat
echo.

pause
