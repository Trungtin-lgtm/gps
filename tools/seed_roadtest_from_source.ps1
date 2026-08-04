param(
  [int]$UserId = 33,
  [int]$SourceDeviceId = 1,
  [string]$ServerDir = '..\GPS_Server',
  [string]$DatabasePath = '',
  [string]$FixturePath = "$PSScriptRoot\fixtures\roadtest_public_route.json"
)

$ErrorActionPreference = 'Stop'

function Resolve-FullPath([string] $Path) {
  if ([IO.Path]::IsPathRooted($Path)) {
    return [IO.Path]::GetFullPath($Path)
  }
  return [IO.Path]::GetFullPath((Join-Path (Get-Location) $Path))
}

function Sql-Timestamp([DateTime] $Value) {
  return $Value.ToString('yyyy-MM-dd HH:mm:ss')
}

function Escape-Sql([string] $Value) {
  return $Value.Replace("'", "''")
}

function Distance-Meters($First, $Second) {
  $earthRadius = 6371000.0
  $lat1 = [double]$First[0] * [Math]::PI / 180
  $lat2 = [double]$Second[0] * [Math]::PI / 180
  $latDelta = ([double]$Second[0] - [double]$First[0]) * [Math]::PI / 180
  $lonDelta = ([double]$Second[1] - [double]$First[1]) * [Math]::PI / 180
  $a = [Math]::Pow([Math]::Sin($latDelta / 2), 2) +
    [Math]::Cos($lat1) * [Math]::Cos($lat2) *
    [Math]::Pow([Math]::Sin($lonDelta / 2), 2)
  return $earthRadius * 2 * [Math]::Atan2([Math]::Sqrt($a), [Math]::Sqrt(1 - $a))
}

function Course-Degrees($First, $Second) {
  $lat1 = [double]$First[0] * [Math]::PI / 180
  $lat2 = [double]$Second[0] * [Math]::PI / 180
  $lonDelta = ([double]$Second[1] - [double]$First[1]) * [Math]::PI / 180
  $y = [Math]::Sin($lonDelta) * [Math]::Cos($lat2)
  $x = [Math]::Cos($lat1) * [Math]::Sin($lat2) -
    [Math]::Sin($lat1) * [Math]::Cos($lat2) * [Math]::Cos($lonDelta)
  return ([Math]::Atan2($y, $x) * 180 / [Math]::PI + 360) % 360
}

$server = Resolve-FullPath $ServerDir
$javaExe = Join-Path $server 'jre\bin\java.exe'
$h2Jar = Join-Path $server 'lib\h2-2.3.232.jar'
$dbPath = if ($DatabasePath) {
  Resolve-FullPath $DatabasePath
} else {
  Join-Path $server 'data\database'
}
$fixture = Get-Content -Raw -LiteralPath (Resolve-FullPath $FixturePath) | ConvertFrom-Json
$route = @($fixture.points)

if (!(Test-Path -LiteralPath $javaExe)) { throw "Java runtime not found: $javaExe" }
if (!(Test-Path -LiteralPath $h2Jar)) { throw "H2 database driver not found: $h2Jar" }
if (!(Test-Path -LiteralPath ("$dbPath.mv.db"))) { throw "Database not found: $dbPath.mv.db" }
if ($route.Count -lt 3) { throw 'ROADTEST fixture requires at least three route points.' }

$listener = Get-NetTCPConnection -LocalPort 9090,9055 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
  throw 'GPS_Server is running. Stop it before seeding the local H2 database.'
}

$now = Get-Date
$groupName = 'ROAD TEST - BAM DUONG'
$devices = @(
  @{
    UniqueId = 'ROADTEST_001'
    Name = 'ROADTEST 001 - Di chuyen'
    Status = 'online'
    MotionState = 'TRUE'
    RouteStart = $now.AddSeconds(-20 * ($route.Count - 1))
    StationarySamples = 0
    StationaryEnd = $now
  },
  @{
    UniqueId = 'ROADTEST_002'
    Name = 'ROADTEST 002 - Dung yen'
    Status = 'online'
    MotionState = 'FALSE'
    StationarySamples = 8
    StationaryEnd = $now
    RouteStart = $now.AddSeconds(-20 * (8 + $route.Count - 1))
  },
  @{
    UniqueId = 'ROADTEST_003'
    Name = 'ROADTEST 003 - Ngoai tuyen'
    Status = 'offline'
    MotionState = 'FALSE'
    StationarySamples = 8
    StationaryEnd = $now.AddMinutes(-20)
    RouteStart = $now.AddMinutes(-20).AddSeconds(-20 * (8 + $route.Count - 1))
  }
)

$sql = [Text.StringBuilder]::new()
[void]$sql.AppendLine('SET REFERENTIAL_INTEGRITY FALSE;')
[void]$sql.AppendLine("UPDATE tc_devices SET positionid = NULL WHERE uniqueid LIKE 'ROADTEST_00%';")
[void]$sql.AppendLine("DELETE FROM tc_events WHERE deviceid IN (SELECT id FROM tc_devices WHERE uniqueid LIKE 'ROADTEST_00%');")
[void]$sql.AppendLine("DELETE FROM tc_positions WHERE deviceid IN (SELECT id FROM tc_devices WHERE uniqueid LIKE 'ROADTEST_00%');")
[void]$sql.AppendLine("DELETE FROM tc_user_device WHERE deviceid IN (SELECT id FROM tc_devices WHERE uniqueid LIKE 'ROADTEST_00%');")
[void]$sql.AppendLine("DELETE FROM tc_devices WHERE uniqueid LIKE 'ROADTEST_00%';")
[void]$sql.AppendLine(
  "INSERT INTO tc_groups (name, attributes) " +
  "SELECT '$groupName', '{}' WHERE NOT EXISTS (SELECT 1 FROM tc_groups WHERE name = '$groupName');"
)
[void]$sql.AppendLine(
  "INSERT INTO tc_user_group (userid, groupid) " +
  "SELECT $UserId, id FROM tc_groups g WHERE g.name = '$groupName' " +
  "AND NOT EXISTS (SELECT 1 FROM tc_user_group ug WHERE ug.userid = $UserId AND ug.groupid = g.id);"
)

foreach ($device in $devices) {
  $uid = Escape-Sql $device.UniqueId
  $name = Escape-Sql $device.Name
  $lastUpdate = Sql-Timestamp $device.StationaryEnd
  [void]$sql.AppendLine(@"
INSERT INTO tc_devices (
  name, uniqueid, lastupdate, groupid, attributes, category, disabled,
  status, motionstate, motiontime
)
SELECT
  '$name', '$uid', TIMESTAMP '$lastUpdate', g.id,
  '{"offlineTimeout":60,"roadTest":true}', 'default', FALSE,
  '$($device.Status)', $($device.MotionState), TIMESTAMP '$lastUpdate'
FROM tc_groups g WHERE g.name = '$groupName';
"@)
  [void]$sql.AppendLine(
    "INSERT INTO tc_user_device (userid, deviceid) " +
    "SELECT $UserId, id FROM tc_devices WHERE uniqueid = '$uid';"
  )

  $totalDistance = 0.0
  for ($index = 0; $index -lt $route.Count; $index += 1) {
    $point = $route[$index]
    if ($index -gt 0) {
      $totalDistance += Distance-Meters $route[$index - 1] $point
    }
    $next = if ($index -lt $route.Count - 1) { $route[$index + 1] } else { $point }
    $course = Course-Degrees $point $next
    $timestamp = Sql-Timestamp $device.RouteStart.AddSeconds(20 * $index)
    $lat = ([double]$point[0]).ToString('0.000000', [Globalization.CultureInfo]::InvariantCulture)
    $lon = ([double]$point[1]).ToString('0.000000', [Globalization.CultureInfo]::InvariantCulture)
    $distanceValue = [Math]::Round($totalDistance, 1).ToString(
      [Globalization.CultureInfo]::InvariantCulture
    )
    $courseValue = [Math]::Round($course, 1).ToString(
      [Globalization.CultureInfo]::InvariantCulture
    )
    $attributes = Escape-Sql (
      '{"batteryLevel":90,"distance":' + $distanceValue +
      ',"totalDistance":' + $distanceValue +
      ',"motion":true,"roadTestPhase":"moving","sourceSchema":"original-osmand"}'
    )
    [void]$sql.AppendLine(@"
INSERT INTO tc_positions (
  protocol, deviceid, servertime, devicetime, fixtime, valid,
  latitude, longitude, altitude, speed, course, address,
  attributes, accuracy, network, geofenceids
)
SELECT
  source.protocol, device.id, TIMESTAMP '$timestamp', TIMESTAMP '$timestamp',
  TIMESTAMP '$timestamp', TRUE, $lat, $lon, source.altitude, 16, $courseValue,
  source.address, '$attributes', 5, source.network, source.geofenceids
FROM tc_devices device
CROSS JOIN (
  SELECT protocol, altitude, address, network, geofenceids
  FROM tc_positions WHERE deviceid = $SourceDeviceId
  ORDER BY fixtime DESC FETCH FIRST 1 ROW ONLY
) source
WHERE device.uniqueid = '$uid';
"@)
  }

  if ($device.StationarySamples -gt 0) {
    $lastPoint = $route[-1]
    for ($sample = 0; $sample -lt $device.StationarySamples; $sample += 1) {
      $secondsBeforeEnd = 20 * ($device.StationarySamples - 1 - $sample)
      $timestamp = Sql-Timestamp $device.StationaryEnd.AddSeconds(-$secondsBeforeEnd)
      # Deterministic jitter stays within about 3 m and must collapse into one
      # visual point under the shared 30 m GPS-noise rule.
      $latOffset = (($sample % 3) - 1) * 0.000010
      $lonOffset = ((($sample * 2) % 3) - 1) * 0.000010
      $lat = ([double]$lastPoint[0] + $latOffset).ToString(
        '0.000000',
        [Globalization.CultureInfo]::InvariantCulture
      )
      $lon = ([double]$lastPoint[1] + $lonOffset).ToString(
        '0.000000',
        [Globalization.CultureInfo]::InvariantCulture
      )
      $distanceValue = [Math]::Round($totalDistance, 1).ToString(
        [Globalization.CultureInfo]::InvariantCulture
      )
      $attributes = Escape-Sql (
        '{"batteryLevel":89,"distance":0,"totalDistance":' + $distanceValue +
        ',"motion":false,"roadTestPhase":"stationary","sourceSchema":"original-osmand"}'
      )
      [void]$sql.AppendLine(@"
INSERT INTO tc_positions (
  protocol, deviceid, servertime, devicetime, fixtime, valid,
  latitude, longitude, altitude, speed, course, address,
  attributes, accuracy, network, geofenceids
)
SELECT
  source.protocol, device.id, TIMESTAMP '$timestamp', TIMESTAMP '$timestamp',
  TIMESTAMP '$timestamp', TRUE, $lat, $lon, source.altitude, 0, 0,
  source.address, '$attributes', 5, source.network, source.geofenceids
FROM tc_devices device
CROSS JOIN (
  SELECT protocol, altitude, address, network, geofenceids
  FROM tc_positions WHERE deviceid = $SourceDeviceId
  ORDER BY fixtime DESC FETCH FIRST 1 ROW ONLY
) source
WHERE device.uniqueid = '$uid';
"@)
    }
  }

  [void]$sql.AppendLine(@"
UPDATE tc_devices
SET positionid = (
  SELECT MAX(position.id) FROM tc_positions position
  WHERE position.deviceid = tc_devices.id
)
WHERE uniqueid = '$uid';
"@)
}

[void]$sql.AppendLine(@"
INSERT INTO tc_events (type, eventtime, deviceid, attributes)
SELECT 'deviceOffline', lastupdate, id, '{"reason":"roadtest-local"}'
FROM tc_devices WHERE uniqueid = 'ROADTEST_003';
"@)
[void]$sql.AppendLine('SET REFERENTIAL_INTEGRITY TRUE;')

$sqlFile = Join-Path $env:TEMP ("seed_roadtest_{0}.sql" -f ([Guid]::NewGuid().ToString('N')))
[IO.File]::WriteAllText($sqlFile, $sql.ToString(), [Text.UTF8Encoding]::new($false))

try {
  & $javaExe -cp $h2Jar org.h2.tools.RunScript `
    -url "jdbc:h2:$dbPath" -user sa -script $sqlFile
  if ($LASTEXITCODE -ne 0) {
    throw "H2 RunScript failed with exit code $LASTEXITCODE"
  }
} finally {
  Remove-Item -LiteralPath $sqlFile -Force -ErrorAction SilentlyContinue
}

Write-Host ''
Write-Host 'ROADTEST local data created successfully:' -ForegroundColor Green
Write-Host '  ROADTEST_001 - moving, latest sample is current' -ForegroundColor Cyan
Write-Host '  ROADTEST_002 - stationary, route history is preserved' -ForegroundColor Cyan
Write-Host '  ROADTEST_003 - offline, route history is preserved' -ForegroundColor Cyan
Write-Host "  Group: $groupName; user id: $UserId" -ForegroundColor Cyan
Write-Host 'Start GPS_Server, open Lo trinh, select ROAD TEST - BAM DUONG, then choose Today.' -ForegroundColor Yellow
