@echo off
set "PATH=C:\Users\PC HP\AppData\Local\Programs\nodejs-v24.21.0;C:\Users\PC HP\AppData\Roaming\npm;%PATH%"
cd /d "%~dp0server"
echo ==============================================
echo   Starting Mini Shopee Back-end (Express)...
echo   URL: http://localhost:5000
echo ==============================================
npm.cmd start
pause
