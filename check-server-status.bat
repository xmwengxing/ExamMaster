@echo off
echo.
echo ===============================================================
echo   Check Server Status
echo ===============================================================
echo.

set SERVER_HOST=47.104.173.139
set SERVER_USER=root
set SERVER_PATH=/www/wwwroot/exammaster.zzzjl.com

echo Connecting to server...
echo.

echo [1] Check container status:
ssh %SERVER_USER%@%SERVER_HOST% "docker ps -a"
echo.

echo [2] Check API container logs (last 50 lines):
ssh %SERVER_USER%@%SERVER_HOST% "docker logs --tail=50 edumaster_api"
echo.

echo [3] Check PostgreSQL container logs (last 30 lines):
ssh %SERVER_USER%@%SERVER_HOST% "docker logs --tail=30 edumaster_postgres"
echo.

echo [4] Check if containers are running:
ssh %SERVER_USER%@%SERVER_HOST% "cd %SERVER_PATH% && docker ps | grep edumaster"
echo.

echo ===============================================================
echo   Status check complete
echo ===============================================================
echo.
pause
