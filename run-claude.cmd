@echo off
set "PATH=C:\Users\PC HP\AppData\Local\Programs\nodejs-v24.21.0;C:\Users\PC HP\AppData\Roaming\npm;%PATH%"
for /f "tokens=2,*" %%A in ('reg query HKCU\Environment /v ANTHROPIC_AUTH_TOKEN 2^>nul') do set "ANTHROPIC_AUTH_TOKEN=%%B"
set "ANTHROPIC_BASE_URL=https://api.miraiapi.com"
set "ANTHROPIC_MODEL=claude-sonnet-5"
set "ANTHROPIC_SMALL_FAST_MODEL=claude-sonnet-5"
set "CLAUDE_CODE_GIT_BASH_PATH=D:\Program File\Git\bin\bash.exe"
set "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1"
"C:\Users\PC HP\AppData\Roaming\npm\node_modules\@anthropic-ai\claude-code\bin\claude.exe" %*
