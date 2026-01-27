@echo off
chcp 65001 >nul
echo.
echo =========================================
echo   模块化架构验证
echo =========================================
echo.

set PASS=0
set FAIL=0
set WARN=0

echo 1. 检查目录结构...
echo -----------------------------------

if exist "src\config" (
    echo [OK] 目录存在: src\config
    set /a PASS+=1
) else (
    echo [FAIL] 目录缺失: src\config
    set /a FAIL+=1
)

if exist "src\controllers" (
    echo [OK] 目录存在: src\controllers
    set /a PASS+=1
) else (
    echo [FAIL] 目录缺失: src\controllers
    set /a FAIL+=1
)

if exist "src\middleware" (
    echo [OK] 目录存在: src\middleware
    set /a PASS+=1
) else (
    echo [FAIL] 目录缺失: src\middleware
    set /a FAIL+=1
)

if exist "src\routes" (
    echo [OK] 目录存在: src\routes
    set /a PASS+=1
) else (
    echo [FAIL] 目录缺失: src\routes
    set /a FAIL+=1
)

if exist "src\services" (
    echo [OK] 目录存在: src\services
    set /a PASS+=1
) else (
    echo [FAIL] 目录缺失: src\services
    set /a FAIL+=1
)

echo.
echo 2. 检查服务器文件...
echo -----------------------------------

if exist "server.js" (
    findstr /C:"registerRoutes" server.js >nul
    if errorlevel 1 (
        echo [FAIL] server.js 不是模块化版本
        set /a FAIL+=1
    ) else (
        echo [OK] server.js 是模块化版本
        set /a PASS+=1
    )
) else (
    echo [FAIL] server.js 不存在
    set /a FAIL+=1
)

if exist "server-new.js" (
    echo [WARN] 发现 server-new.js，应该已重命名
    set /a WARN+=1
)

if exist "server-old.js" (
    echo [OK] 旧版本已备份为 server-old.js
    set /a PASS+=1
)

echo.
echo 3. 检查路由文件...
echo -----------------------------------

if exist "src\routes\index.js" (
    echo [OK] 路由聚合器存在
    set /a PASS+=1
    
    for %%f in (src\routes\*.routes.js) do (
        echo    检查: %%~nf
    )
) else (
    echo [FAIL] 路由聚合器不存在
    set /a FAIL+=1
)

echo.
echo 4. 检查中间件...
echo -----------------------------------

if exist "src\middleware\auth.js" (
    findstr /C:"export" src\middleware\auth.js | findstr /C:"auth" >nul
    if errorlevel 1 (
        echo [FAIL] 认证中间件未正确导出
        set /a FAIL+=1
    ) else (
        echo [OK] 认证中间件正确导出
        set /a PASS+=1
    )
) else (
    echo [FAIL] 认证中间件不存在
    set /a FAIL+=1
)

echo.
echo 5. 检查控制器...
echo -----------------------------------

set CONTROLLER_COUNT=0
for %%f in (src\controllers\*.controller.js) do set /a CONTROLLER_COUNT+=1

if %CONTROLLER_COUNT% GTR 0 (
    echo [OK] 找到 %CONTROLLER_COUNT% 个控制器
    set /a PASS+=1
) else (
    echo [FAIL] 未找到控制器文件
    set /a FAIL+=1
)

echo.
echo 6. 检查服务层...
echo -----------------------------------

set SERVICE_COUNT=0
for %%f in (src\services\*.service.js) do set /a SERVICE_COUNT+=1

if %SERVICE_COUNT% GTR 0 (
    echo [OK] 找到 %SERVICE_COUNT% 个服务
    set /a PASS+=1
) else (
    echo [FAIL] 未找到服务文件
    set /a FAIL+=1
)

echo.
echo 7. 检查 Dockerfile...
echo -----------------------------------

if exist "Dockerfile" (
    findstr /C:"server-new.js" Dockerfile >nul
    if errorlevel 1 (
        findstr /C:"COPY server.js" Dockerfile >nul
        if errorlevel 1 (
            echo [WARN] Dockerfile 可能配置不正确
            set /a WARN+=1
        ) else (
            echo [OK] Dockerfile 配置正确
            set /a PASS+=1
        )
    ) else (
        echo [FAIL] Dockerfile 仍在使用 server-new.js
        set /a FAIL+=1
    )
) else (
    echo [FAIL] Dockerfile 不存在
    set /a FAIL+=1
)

echo.
echo 8. 检查 .dockerignore...
echo -----------------------------------

if exist ".dockerignore" (
    findstr /C:"server-old.js" .dockerignore >nul
    if errorlevel 1 (
        echo [WARN] .dockerignore 可能需要更新
        set /a WARN+=1
    ) else (
        echo [OK] .dockerignore 已排除旧文件
        set /a PASS+=1
    )
) else (
    echo [WARN] .dockerignore 不存在
    set /a WARN+=1
)

echo.
echo 9. 检查测试文件...
echo -----------------------------------

if exist "tests" (
    set TEST_COUNT=0
    for /r tests %%f in (*.test.js) do set /a TEST_COUNT+=1
    echo [OK] 找到 %TEST_COUNT% 个测试文件
    set /a PASS+=1
) else (
    echo [WARN] tests 目录不存在
    set /a WARN+=1
)

echo.
echo =========================================
echo   验证结果
echo =========================================
echo.
echo 通过: %PASS%
echo 警告: %WARN%
echo 失败: %FAIL%
echo.

if %FAIL% GTR 0 (
    echo [FAIL] 验证失败，请修复上述问题
    pause
    exit /b 1
) else if %WARN% GTR 0 (
    echo [WARN] 验证通过，但有警告
    pause
    exit /b 0
) else (
    echo [OK] 验证完全通过！
    pause
    exit /b 0
)
