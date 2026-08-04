@echo off
setlocal
if "%~1"=="" (set "SEED_GPS_COUNT=50") else (set "SEED_GPS_COUNT=%~1")
if "%~2"=="" (set "SEED_GPS_USER_ID=1") else (set "SEED_GPS_USER_ID=%~2")
if "%~3"=="" (set "SEED_GPS_PREFIX=LOADTEST_") else (set "SEED_GPS_PREFIX=%~3")
if "%~4"=="" (set "SEED_GPS_NAME_PREFIX=GPS Test") else (set "SEED_GPS_NAME_PREFIX=%~4")
if "%~5"=="" (set "SEED_GPS_SERVER_DIR=..\GPS_Server") else (set "SEED_GPS_SERVER_DIR=%~5")
set "SCRIPT=%~f0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$text=[IO.File]::ReadAllText('%SCRIPT%'); $marker='# POWERSHELL_START'; $idx=$text.LastIndexOf($marker); if($idx -lt 0){throw 'marker not found'}; $ps=$text.Substring($idx+$marker.Length); $tmp=Join-Path $env:TEMP ('seed_gps_test_devices_' + [guid]::NewGuid() + '.ps1'); Set-Content -LiteralPath $tmp -Value $ps -Encoding UTF8; try { & $tmp; exit $LASTEXITCODE } finally { Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue }"
exit /b %ERRORLEVEL%

# POWERSHELL_START
$Count = if ($env:SEED_GPS_COUNT) { [int]$env:SEED_GPS_COUNT } else { 50 }
$UserId = if ($env:SEED_GPS_USER_ID) { [int]$env:SEED_GPS_USER_ID } else { 1 }
$Prefix = if ($env:SEED_GPS_PREFIX) { $env:SEED_GPS_PREFIX } else { "LOADTEST_" }
$DisplayNamePrefix = if ($env:SEED_GPS_NAME_PREFIX) { $env:SEED_GPS_NAME_PREFIX } else { "GPS Test" }
$ServerDir = if ($env:SEED_GPS_SERVER_DIR) { $env:SEED_GPS_SERVER_DIR } else { "..\GPS_Server" }

$ErrorActionPreference = "Stop"

function Resolve-FullPath([string] $Path) {
  if ([IO.Path]::IsPathRooted($Path)) {
    return [IO.Path]::GetFullPath($Path)
  }
  return [IO.Path]::GetFullPath((Join-Path (Get-Location) $Path))
}

$server = Resolve-FullPath $ServerDir
$h2Jar = Join-Path $server "lib\h2-2.3.232.jar"
$javaExe = Join-Path $server "jre\bin\java.exe"
$dbPath = Join-Path $server "data\database"

if (!(Test-Path -LiteralPath $h2Jar)) { throw "H2 jar not found: $h2Jar" }
if (!(Test-Path -LiteralPath $javaExe)) { $javaExe = "java" }

Write-Host "IMPORTANT: GPS_Server must be stopped before seeding DB." -ForegroundColor Yellow
Write-Host "Seeding $Count devices for user id $UserId ..."

$sqlFile = Join-Path $env:TEMP ("seed_gps_test_devices_{0}.sql" -f ([Guid]::NewGuid().ToString("N")))
$sb = New-Object Text.StringBuilder
[void]$sb.AppendLine("SET REFERENTIAL_INTEGRITY FALSE;")

for ($i = 1; $i -le $Count; $i++) {
  $uid = "{0}{1:D3}" -f $Prefix, $i
  $name = "{0} {1:D3}" -f $DisplayNamePrefix, $i
  [void]$sb.AppendLine("MERGE INTO tc_devices (name, uniqueid, attributes, category, disabled) KEY(uniqueid) VALUES ('$name', '$uid', '{}', 'default', FALSE);")
}

[void]$sb.AppendLine("INSERT INTO tc_user_device (userid, deviceid)")
[void]$sb.AppendLine("SELECT $UserId, d.id FROM tc_devices d")
[void]$sb.AppendLine("WHERE d.uniqueid LIKE '$Prefix%'")
[void]$sb.AppendLine("AND NOT EXISTS (SELECT 1 FROM tc_user_device ud WHERE ud.userid = $UserId AND ud.deviceid = d.id);")
[void]$sb.AppendLine("SET REFERENTIAL_INTEGRITY TRUE;")

[IO.File]::WriteAllText($sqlFile, $sb.ToString(), [Text.UTF8Encoding]::new($false))

try {
  & $javaExe -cp $h2Jar org.h2.tools.RunScript -url "jdbc:h2:$dbPath" -user "sa" -script $sqlFile
  if ($LASTEXITCODE -ne 0) {
    throw "H2 RunScript failed. Make sure GPS_Server is fully stopped."
  }
  Write-Host "DONE. Test devices are in DB. Start GPS_Server now."
} finally {
  Remove-Item -LiteralPath $sqlFile -Force -ErrorAction SilentlyContinue
}
