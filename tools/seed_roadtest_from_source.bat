@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0seed_roadtest_from_source.ps1" %*
exit /b %ERRORLEVEL%
