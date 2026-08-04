@echo off
cd /d %~dp0
java -jar tracker-server.jar conf\gpsmaster.xml
pause
