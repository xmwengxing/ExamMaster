@echo off
echo.
echo ===============================================================
echo   Restart Server Services
echo ===============================================================
echo.

set SERVER_HOST=47.104.173.139
set SERVER_USER=root
set SERVER_PATH=/www/wwwroot/exammaster.zzzjl.com

echo Connecting to server...
echo.

echo [1] Stopping containers...
ssh %SERVER_USER%@%SERVER_HOST% "cd %SERVER_PATH% && docker stop edumaster_api edumaster_postgres edumaster_nginx 2>/dev/null || true"
echo.

echo [2] Removing containers...
ssh %SERVER_USER%@%SERVER_HOST% "cd %SERVER_PATH% && docker rm edumaster_api edumaster_postgres edumaster_nginx 2>/dev/null || true"
echo.

echo [3] Starting services...
ssh %SERVER_USER%@%SERVER_HOST% "cd %SERVER_PATH% && docker compose up -d"
echo.

echo [4] Waiting for services to start (30 seconds)...
timeout /t 30 /nobreak
echo.

echo [5] Checking container status...
ssh %SERVER_USER%@%SERVER_HOST% "docker ps"
echo.

echo [6] Checking API logs...
ssh %SERVER_USER%@%SERVER_HOST% "docker logs --tail=20 edumaster_api"
echo.

echo ===============================================================
echo   Restart complete
echo ===============================================================
echo.
echo Check health: curl https://exammaster.zzzjl.com/api/health
echo.
pause
