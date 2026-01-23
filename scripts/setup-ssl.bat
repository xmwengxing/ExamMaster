@echo off
REM SSL 证书配置脚本 (Windows)
REM 用于配置 SSL 证书

setlocal enabledelayedexpansion

set DOMAIN=exammaster.zzzjl.com
set SSL_DIR=nginx\ssl

echo ==========================================
echo   SSL 证书配置工具 (Windows)
echo ==========================================
echo.
echo 域名: %DOMAIN%
echo SSL 目录: %SSL_DIR%
echo.

:menu
echo.
echo ==========================================
echo   请选择操作
echo ==========================================
echo 1. 使用 Cloudflare Origin Certificate
echo 2. 生成自签名证书（仅测试）
echo 3. 验证现有证书
echo 4. 查看证书信息
echo 0. 退出
echo ==========================================
echo.

set /p choice="请选择操作 [0-4]: "

if "%choice%"=="1" goto cloudflare
if "%choice%"=="2" goto selfsigned
if "%choice%"=="3" goto verify
if "%choice%"=="4" goto info
if "%choice%"=="0" goto end
goto menu

:cloudflare
echo.
echo [INFO] 配置 Cloudflare Origin Certificate
echo.
echo 请按照以下步骤操作:
echo 1. 登录 Cloudflare 控制台
echo 2. 选择域名 → SSL/TLS → Origin Server
echo 3. 点击 'Create Certificate'
echo 4. 选择证书有效期（推荐 15 年）
echo 5. 下载证书文件
echo.
echo 请将证书文件保存为:
echo   - %SSL_DIR%\cert.pem (证书)
echo   - %SSL_DIR%\key.pem (私钥)
echo.
pause
goto verify

:selfsigned
echo.
echo [WARN] 生成自签名证书（仅用于测试）
echo.

REM 检查 OpenSSL 是否可用
where openssl >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] OpenSSL 未安装或不在 PATH 中
    echo.
    echo 请安装 OpenSSL:
    echo 1. 下载: https://slproweb.com/products/Win32OpenSSL.html
    echo 2. 安装后添加到 PATH 环境变量
    echo.
    pause
    goto menu
)

REM 创建 SSL 目录
if not exist "%SSL_DIR%" mkdir "%SSL_DIR%"

REM 生成自签名证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 ^
    -keyout "%SSL_DIR%\key.pem" ^
    -out "%SSL_DIR%\cert.pem" ^
    -subj "/C=CN/ST=Beijing/L=Beijing/O=EduMaster/CN=%DOMAIN%"

if %errorlevel% equ 0 (
    echo.
    echo [INFO] 自签名证书已生成
    echo [WARN] 注意: 浏览器会显示安全警告，仅用于开发测试
    echo.
) else (
    echo.
    echo [ERROR] 证书生成失败
    echo.
)

pause
goto menu

:verify
echo.
echo [INFO] 验证证书配置...
echo.

REM 检查证书文件是否存在
if not exist "%SSL_DIR%\cert.pem" (
    echo [ERROR] 证书文件不存在: %SSL_DIR%\cert.pem
    goto verify_end
)

if not exist "%SSL_DIR%\key.pem" (
    echo [ERROR] 私钥文件不存在: %SSL_DIR%\key.pem
    goto verify_end
)

REM 检查 OpenSSL
where openssl >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] OpenSSL 未安装，无法验证证书
    echo [INFO] 证书文件存在，假设配置正确
    goto verify_end
)

REM 验证证书格式
openssl x509 -in "%SSL_DIR%\cert.pem" -noout -text >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] 证书文件格式无效
    goto verify_end
)

REM 验证私钥格式
openssl rsa -in "%SSL_DIR%\key.pem" -check -noout >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] 私钥文件格式无效
    goto verify_end
)

echo [INFO] 证书配置验证通过
echo.

REM 显示证书信息
echo 证书信息:
openssl x509 -in "%SSL_DIR%\cert.pem" -noout -subject -issuer -dates

:verify_end
echo.
pause
goto menu

:info
echo.
echo [INFO] 证书信息
echo.

if not exist "%SSL_DIR%\cert.pem" (
    echo [ERROR] 证书文件不存在
    pause
    goto menu
)

REM 检查 OpenSSL
where openssl >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] OpenSSL 未安装，无法查看证书信息
    pause
    goto menu
)

echo 证书详细信息:
echo ==========================================
openssl x509 -in "%SSL_DIR%\cert.pem" -noout -text
echo.
pause
goto menu

:end
echo.
echo [INFO] 退出
echo.
exit /b 0
