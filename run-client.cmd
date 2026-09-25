@echo off
set "PATH=C:\Users\PC HP\AppData\Local\Programs\nodejs-v24.21.0;C:\Users\PC HP\AppData\Roaming\npm;%PATH%"
cd /d "%~dp0client"
echo ==============================================
echo   Starting Mini Shopee Front-end (Vite)...
echo   URL: http://localhost:5173
echo ==============================================
npm.cmd run dev
pause
