@echo off
REM SSL 证书验证脚本 (Windows)

setlocal enabledelayedexpansion

set SSL_DIR=nginx\ssl
set DOMAIN=exammaster.zzzjl.com
set PASSED=0
set FAILED=0
set WARNINGS=0

echo.
echo ========================================
echo   SSL 证书验证脚本
echo ========================================
echo.
echo 域名: %DOMAIN%
echo SSL 目录: %SSL_DIR%
echo.

REM 检查证书文件是否存在
echo ========================================
echo   检查证书文件
echo ========================================

if exist "%SSL_DIR%\cert.pem" (
    echo [32m√[0m 证书文件存在: %SSL_DIR%\cert.pem
    set /a PASSED+=1
) else (
    echo [31m×[0m 证书文件不存在: %SSL_DIR%\cert.pem
    set /a FAILED+=1
)

if exist "%SSL_DIR%\key.pem" (
    echo [32m√[0m 私钥文件存在: %SSL_DIR%\key.pem
    set /a PASSED+=1
) else (
    echo [31m×[0m 私钥文件不存在: %SSL_DIR%\key.pem
    set /a FAILED+=1
)

REM 检查 OpenSSL
where openssl >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [33m⚠[0m OpenSSL 未安装，跳过证书验证
    echo.
    goto check_nginx
)

REM 验证证书格式
echo.
echo ========================================
echo   验证证书格式
echo ========================================

openssl x509 -in "%SSL_DIR%\cert.pem" -noout -text >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m√[0m 证书文件格式有效
    set /a PASSED+=1
) else (
    echo [31m×[0m 证书文件格式无效
    set /a FAILED+=1
)

openssl rsa -in "%SSL_DIR%\key.pem" -check -noout >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m√[0m 私钥文件格式有效
    set /a PASSED+=1
) else (
    echo [31m×[0m 私钥文件格式无效
    set /a FAILED+=1
)

REM 检查证书和私钥是否匹配
echo.
echo ========================================
echo   验证证书和私钥匹配
echo ========================================

openssl x509 -noout -modulus -in "%SSL_DIR%\cert.pem" 2>nul | openssl md5 > temp_cert.txt
openssl rsa -noout -modulus -in "%SSL_DIR%\key.pem" 2>nul | openssl md5 > temp_key.txt

fc /b temp_cert.txt temp_key.txt >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m√[0m 证书和私钥匹配
    set /a PASSED+=1
) else (
    echo [31m×[0m 证书和私钥不匹配
    set /a FAILED+=1
)

del temp_cert.txt temp_key.txt >nul 2>&1

REM 检查证书信息
echo.
echo ========================================
echo   证书信息
echo ========================================

openssl x509 -in "%SSL_DIR%\cert.pem" -noout -subject -issuer -dates 2>nul

openssl x509 -in "%SSL_DIR%\cert.pem" -noout -checkend 0 >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m√[0m 证书未过期
    set /a PASSED+=1
) else (
    echo [31m×[0m 证书已过期
    set /a FAILED+=1
)

openssl x509 -in "%SSL_DIR%\cert.pem" -noout -checkend 2592000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m√[0m 证书有效期充足（超过 30 天）
    set /a PASSED+=1
) else (
    echo [33m⚠[0m 证书即将过期（少于 30 天）
    set /a WARNINGS+=1
)

:check_nginx
REM 检查 Nginx 配置
echo.
echo ========================================
echo   检查 Nginx 配置
echo ========================================

if not exist "nginx\nginx.conf" (
    echo [33m⚠[0m Nginx 配置文件不存在
    set /a WARNINGS+=1
    goto check_docker
)

findstr /C:"ssl_certificate /etc/nginx/ssl/cert.pem" nginx\nginx.conf >nul
if %errorlevel% equ 0 (
    echo [32m√[0m Nginx 配置中的证书路径正确
    set /a PASSED+=1
) else (
    echo [33m⚠[0m Nginx 配置中的证书路径可能不正确
    set /a WARNINGS+=1
)

findstr /C:"ssl_certificate_key /etc/nginx/ssl/key.pem" nginx\nginx.conf >nul
if %errorlevel% equ 0 (
    echo [32m√[0m Nginx 配置中的私钥路径正确
    set /a PASSED+=1
) else (
    echo [33m⚠[0m Nginx 配置中的私钥路径可能不正确
    set /a WARNINGS+=1
)

findstr /C:"ssl_protocols TLSv1.2 TLSv1.3" nginx\nginx.conf >nul
if %errorlevel% equ 0 (
    echo [32m√[0m SSL 协议配置正确（TLSv1.2, TLSv1.3）
    set /a PASSED+=1
) else (
    echo [33m⚠[0m SSL 协议配置可能不正确
    set /a WARNINGS+=1
)

findstr /C:"Strict-Transport-Security" nginx\nginx.conf >nul
if %errorlevel% equ 0 (
    echo [32m√[0m HSTS 已启用
    set /a PASSED+=1
) else (
    echo [33m⚠[0m HSTS 未启用
    set /a WARNINGS+=1
)

:check_docker
REM 检查 Docker 配置
echo.
echo ========================================
echo   检查 Docker 配置
echo ========================================

if not exist "docker-compose.yml" (
    echo [33m⚠[0m docker-compose.yml 文件不存在
    set /a WARNINGS+=1
    goto summary
)

findstr /C:"./nginx/ssl:/etc/nginx/ssl" docker-compose.yml >nul
if %errorlevel% equ 0 (
    echo [32m√[0m Docker Compose 中的 SSL 目录挂载正确
    set /a PASSED+=1
) else (
    echo [33m⚠[0m Docker Compose 中的 SSL 目录挂载可能不正确
    set /a WARNINGS+=1
)

:summary
REM 显示摘要
echo.
echo ========================================
echo   验证摘要
echo ========================================
echo.
echo 通过: %PASSED%
echo 失败: %FAILED%
echo 警告: %WARNINGS%
echo.

if %FAILED% equ 0 (
    if %WARNINGS% equ 0 (
        echo [32m√ 所有检查通过！[0m
        echo.
        echo SSL 证书配置正确，可以部署到生产环境。
    ) else (
        echo [33m⚠ 检查通过，但有 %WARNINGS% 个警告[0m
        echo.
        echo 建议修复警告后再部署到生产环境。
    )
) else (
    echo [31m× 有 %FAILED% 个检查失败[0m
    echo.
    echo 请修复失败的检查项后再部署。
)

echo.
pause
