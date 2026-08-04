@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0seed_timeline_demo.ps1" %*
exit /b %ERRORLEVEL%

# POWERSHELL_START
param(
  [string]$Date = (Get-Date -Format 'yyyy-MM-dd'),
  [int]$UserId = 1,
  [string]$ServerDir = '..\GPS_Server'
)

$ErrorActionPreference = 'Stop'

function Resolve-FullPath([string] $Path) {
  if ([IO.Path]::IsPathRooted($Path)) {
    return [IO.Path]::GetFullPath($Path)
  }
  return [IO.Path]::GetFullPath((Join-Path (Get-Location) $Path))
}

$server = Resolve-FullPath $ServerDir
$javaExe = Join-Path $server 'jre\bin\java.exe'
$h2Jar = Join-Path $server 'lib\h2-2.3.232.jar'
$dbPath = Join-Path $server 'data\database'

if (!(Test-Path -LiteralPath $javaExe)) { throw "Java runtime not found: $javaExe" }
if (!(Test-Path -LiteralPath $h2Jar)) { throw "H2 database driver not found: $h2Jar" }
if (!(Test-Path -LiteralPath ("$dbPath.mv.db"))) { throw "Database not found: $dbPath.mv.db" }

$listener = Get-NetTCPConnection -LocalPort 9090,9055 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
  throw 'GPS_Server is running. Stop it first to avoid writing to its database while in use.'
}

$uid = 'TIMELINE_DEMO_001'
$name = 'GPS Test Timeline - 07-10'
$sqlFile = Join-Path $env:TEMP ("seed_timeline_demo_{0}.sql" -f ([Guid]::NewGuid().ToString('N')))

$sql = @"
SET REFERENTIAL_INTEGRITY FALSE;

DELETE FROM tc_events WHERE deviceid IN (SELECT id FROM tc_devices WHERE uniqueid = '$uid');
DELETE FROM tc_positions WHERE deviceid IN (SELECT id FROM tc_devices WHERE uniqueid = '$uid');
DELETE FROM tc_user_device WHERE deviceid IN (SELECT id FROM tc_devices WHERE uniqueid = '$uid');
DELETE FROM tc_devices WHERE uniqueid = '$uid';

INSERT INTO tc_devices (name, uniqueid, lastupdate, attributes, category, disabled)
VALUES ('$name', '$uid', TIMESTAMP '$Date 09:00:00', '{}', 'default', FALSE);

INSERT INTO tc_user_device (userid, deviceid)
SELECT $UserId, id FROM tc_devices WHERE uniqueid = '$uid';

INSERT INTO tc_positions (deviceid, servertime, devicetime, fixtime, valid, latitude, longitude, altitude, speed, course, attributes, accuracy)
SELECT id, TIMESTAMP '$Date 07:00:00', TIMESTAMP '$Date 07:00:00', TIMESTAMP '$Date 07:00:00', TRUE, 20.981098, 105.839667, 10, 28, 85, '{"motion":true}', 5 FROM tc_devices WHERE uniqueid = '$uid';
INSERT INTO tc_positions (deviceid, servertime, devicetime, fixtime, valid, latitude, longitude, altitude, speed, course, attributes, accuracy)
SELECT id, TIMESTAMP '$Date 07:20:00', TIMESTAMP '$Date 07:20:00', TIMESTAMP '$Date 07:20:00', TRUE, 20.983200, 105.841100, 10, 31, 70, '{"motion":true}', 5 FROM tc_devices WHERE uniqueid = '$uid';
INSERT INTO tc_positions (deviceid, servertime, devicetime, fixtime, valid, latitude, longitude, altitude, speed, course, attributes, accuracy)
SELECT id, TIMESTAMP '$Date 07:40:00', TIMESTAMP '$Date 07:40:00', TIMESTAMP '$Date 07:40:00', TRUE, 20.986100, 105.843900, 10, 24, 45, '{"motion":true}', 5 FROM tc_devices WHERE uniqueid = '$uid';
INSERT INTO tc_positions (deviceid, servertime, devicetime, fixtime, valid, latitude, longitude, altitude, speed, course, attributes, accuracy)
SELECT id, TIMESTAMP '$Date 08:00:00', TIMESTAMP '$Date 08:00:00', TIMESTAMP '$Date 08:00:00', TRUE, 20.987800, 105.845000, 10, 0, 0, '{"motion":false}', 5 FROM tc_devices WHERE uniqueid = '$uid';
INSERT INTO tc_positions (deviceid, servertime, devicetime, fixtime, valid, latitude, longitude, altitude, speed, course, attributes, accuracy)
SELECT id, TIMESTAMP '$Date 08:30:00', TIMESTAMP '$Date 08:30:00', TIMESTAMP '$Date 08:30:00', TRUE, 20.987800, 105.845000, 10, 0, 0, '{"motion":false}', 5 FROM tc_devices WHERE uniqueid = '$uid';
INSERT INTO tc_positions (deviceid, servertime, devicetime, fixtime, valid, latitude, longitude, altitude, speed, course, attributes, accuracy)
SELECT id, TIMESTAMP '$Date 09:00:00', TIMESTAMP '$Date 09:00:00', TIMESTAMP '$Date 09:00:00', TRUE, 20.987800, 105.845000, 10, 0, 0, '{"motion":false}', 5 FROM tc_devices WHERE uniqueid = '$uid';

INSERT INTO tc_events (type, eventtime, deviceid, attributes)
SELECT 'deviceOffline', TIMESTAMP '$Date 09:00:00', id, '{"reason":"timeline-demo"}' FROM tc_devices WHERE uniqueid = '$uid';

SET REFERENTIAL_INTEGRITY TRUE;
"@

[IO.File]::WriteAllText($sqlFile, $sql, [Text.UTF8Encoding]::new($false))
try {
  # H2 2.x parses empty password and paths reliably through the connection URL.
  # RunScript's command-line parser treats a separate empty `-password` argument
  # inconsistently on Windows PowerShell, so omit it (H2 defaults to blank).
  & $javaExe -cp $h2Jar org.h2.tools.RunScript -url "jdbc:h2:$dbPath" -user sa -script $sqlFile
  if ($LASTEXITCODE -ne 0) { throw "H2 RunScript failed with exit code $LASTEXITCODE" }
} finally {
  Remove-Item -LiteralPath $sqlFile -Force -ErrorAction SilentlyContinue
}

Write-Host ''
Write-Host "Created $name ($uid)." -ForegroundColor Green
Write-Host "In Lộ trình, select this device and the range $Date 07:00 to $Date 10:00." -ForegroundColor Cyan
Write-Host 'Expected rows: 07:00–08:00 Di chuyển, 08:00–09:00 Đứng yên, 09:00–10:00 Ngoại tuyến.' -ForegroundColor Cyan
Write-Host 'Start GPS_Server again after the script finishes.' -ForegroundColor Yellow
