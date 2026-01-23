@echo off
REM Docker 快速启动脚本 (Windows)
REM 用于快速启动 EduMaster Docker 环境

echo 🚀 EduMaster Docker 快速启动
echo ==============================

REM 检查 Docker 是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker 未安装，请先安装 Docker Desktop
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose 未安装，请先安装 Docker Compose
    pause
    exit /b 1
)

REM 检查 .env 文件
if not exist .env (
    echo ⚠️  .env 文件不存在，从 .env.example 复制...
    copy .env.example .env
    echo ✅ 已创建 .env 文件，请编辑并配置数据库密码和 JWT 密钥
    echo.
    pause
)

REM 检查前端构建
if not exist dist\index.html (
    echo ⚠️  前端未构建，开始构建...
    call npm install
    call npm run build
    echo ✅ 前端构建完成
)

REM 停止现有容器
echo.
echo 🛑 停止现有容器...
docker-compose down

REM 启动服务
echo.
echo 🚀 启动 Docker 服务...
docker-compose up -d

REM 等待服务启动
echo.
echo ⏳ 等待服务启动（30秒）...
timeout /t 30 /nobreak >nul

REM 检查容器状态
echo.
echo 📦 容器状态:
docker-compose ps

REM 运行测试
echo.
echo 🧪 运行健康检查...
node scripts/test-docker-deployment.js

if errorlevel 1 (
    echo.
    echo ⚠️  健康检查失败，请查看日志:
    echo   docker-compose logs
) else (
    echo.
    echo ✅ Docker 部署成功！
    echo.
    echo 访问地址:
    echo   前端: http://localhost
    echo   API: http://localhost:3001
    echo.
    echo 查看日志:
    echo   docker-compose logs -f
    echo.
    echo 停止服务:
    echo   docker-compose down
)

echo.
pause
