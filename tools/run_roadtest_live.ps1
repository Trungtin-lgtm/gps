param(
  [string]$ServerUrl = 'http://127.0.0.1:9055',
  [int]$IntervalSeconds = 5,
  [int]$DurationMinutes = 0
)

$ErrorActionPreference = 'Stop'

if ($IntervalSeconds -lt 1) {
  throw 'IntervalSeconds must be at least 1.'
}

$fixturePath = Join-Path $PSScriptRoot 'fixtures\roadtest_public_route.json'
$fixture = Get-Content -LiteralPath $fixturePath -Raw | ConvertFrom-Json
$route = @($fixture.points)

if ($route.Count -lt 3) {
  throw "The route fixture must contain at least three points: $fixturePath"
}

$stationaryOffsets = @(
  @(0.000000, 0.000000),
  @(0.000010, 0.000006),
  @(-0.000009, 0.000008),
  @(0.000006, -0.000010),
  @(-0.000005, -0.000006)
)

function Send-OsmAndPosition {
  param(
    [string]$UniqueId,
    [double]$Latitude,
    [double]$Longitude,
    [double]$Speed,
    [bool]$Motion,
    [int]$Bearing
  )

  $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
  $motionValue = if ($Motion) { 'true' } else { 'false' }
  $urlValues = @(
    $ServerUrl.TrimEnd('/')
    $UniqueId
    $timestamp
    $Latitude.ToString('0.000000', [Globalization.CultureInfo]::InvariantCulture)
    $Longitude.ToString('0.000000', [Globalization.CultureInfo]::InvariantCulture)
    $Speed.ToString('0.0', [Globalization.CultureInfo]::InvariantCulture)
    $Bearing
    $motionValue
  )
  $url = (
    '{0}/?id={1}&timestamp={2}&lat={3}&lon={4}&speed={5}&bearing={6}' +
    '&altitude=10&accuracy=5&batt=90&motion={7}'
  ) -f $urlValues

  Invoke-WebRequest `
    -Method Post `
    -Uri $url `
    -UseBasicParsing `
    -TimeoutSec 10 `
    -ErrorAction Stop | Out-Null
}

$startedAt = Get-Date
$closedLoop = ([double]$route[0][0] -eq [double]$route[-1][0]) -and
  ([double]$route[0][1] -eq [double]$route[-1][1])
$routeCycleCount = if ($closedLoop) {
  $route.Count - 1
} else {
  $route.Count
}
$routeIndex = 0
$stationaryIndex = 0

Write-Host 'ROADTEST_001: moving along the public road fixture.'
Write-Host 'ROADTEST_002: stationary with GPS jitter below 30 metres.'
Write-Host 'ROADTEST_003: intentionally silent so it remains offline.'
Write-Host 'Press Ctrl+C to stop.'

while ($DurationMinutes -le 0 -or (Get-Date) -lt $startedAt.AddMinutes($DurationMinutes)) {
  try {
    $movingPoint = $route[$routeIndex]
    $nextIndex = ($routeIndex + 1) % $routeCycleCount
    $nextPoint = $route[$nextIndex]
    $bearing = [int](
      ([Math]::Atan2(
        [double]$nextPoint[1] - [double]$movingPoint[1],
        [double]$nextPoint[0] - [double]$movingPoint[0]
      ) * 180 / [Math]::PI + 360) % 360
    )

    Send-OsmAndPosition `
      -UniqueId 'ROADTEST_001' `
      -Latitude ([double]$movingPoint[0]) `
      -Longitude ([double]$movingPoint[1]) `
      -Speed 18 `
      -Motion $true `
      -Bearing $bearing

    $stationaryPoint = $route[-1]
    $offset = $stationaryOffsets[$stationaryIndex]
    Send-OsmAndPosition `
      -UniqueId 'ROADTEST_002' `
      -Latitude ([double]$stationaryPoint[0] + [double]$offset[0]) `
      -Longitude ([double]$stationaryPoint[1] + [double]$offset[1]) `
      -Speed 0 `
      -Motion $false `
      -Bearing 0

    $statusValues = @(
      (Get-Date)
      ($routeIndex + 1)
      $routeCycleCount
      ($stationaryIndex + 1)
      $stationaryOffsets.Count
    )
    Write-Host (
      '{0:HH:mm:ss}  moving={1}/{2}  stationary-jitter={3}/{4}  offline=silent' `
        -f $statusValues
    )
  } catch {
    Write-Warning "ROADTEST sender failed: $($_.Exception.Message)"
  }

  $routeIndex = $nextIndex
  $stationaryIndex = ($stationaryIndex + 1) % $stationaryOffsets.Count
  Start-Sleep -Seconds $IntervalSeconds
}
