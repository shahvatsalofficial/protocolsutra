@echo off
setlocal
cd /d "%~dp0.."
if "%~1"=="" (set "HOST=generic") else (set "HOST=%~1")
if "%~2"=="" (set "TARGET=.") else (set "TARGET=%~2")
node packages\cli\index.mjs install-skills --host "%HOST%" --target "%TARGET%"
exit /b %ERRORLEVEL%
