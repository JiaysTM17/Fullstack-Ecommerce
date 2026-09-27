@echo off
set "PATH=C:\Users\PC HP\AppData\Local\Programs\nodejs-v24.21.0;C:\Users\PC HP\AppData\Roaming\npm;%PATH%"
cd /d "%~dp0"
echo =======================================================================
echo   Executing Mini Shopee Enterprise Marketplace E2E Test Suite...
echo =======================================================================
node tests/run-all.js %*
