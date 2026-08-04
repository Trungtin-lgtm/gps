@echo off
setlocal
if "%~1"=="" (set "GPS_SEND_COUNT=50") else (set "GPS_SEND_COUNT=%~1")
if "%~2"=="" (set "GPS_SEND_DURATION=3600") else (set "GPS_SEND_DURATION=%~2")
if "%~3"=="" (set "GPS_SEND_INTERVAL=1000") else (set "GPS_SEND_INTERVAL=%~3")
if "%~4"=="" (set "GPS_SEND_BASE=http://localhost:9055") else (set "GPS_SEND_BASE=%~4")
set "SCRIPT=%~f0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$text=[IO.File]::ReadAllText('%SCRIPT%'); $marker='# POWERSHELL_START'; $idx=$text.LastIndexOf($marker); if($idx -lt 0){throw 'marker not found'}; $ps=$text.Substring($idx+$marker.Length); $tmp=Join-Path $env:TEMP ('gps_send_only_' + [guid]::NewGuid() + '.ps1'); Set-Content -LiteralPath $tmp -Value $ps -Encoding UTF8; try { & $tmp; exit $LASTEXITCODE } finally { Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue }"
exit /b %ERRORLEVEL%

# POWERSHELL_START
$Count = if ($env:GPS_SEND_COUNT) { [int]$env:GPS_SEND_COUNT } else { 50 }
$DurationSeconds = if ($env:GPS_SEND_DURATION) { [int]$env:GPS_SEND_DURATION } else { 3600 }
$IntervalMs = if ($env:GPS_SEND_INTERVAL) { [int]$env:GPS_SEND_INTERVAL } else { 1000 }
$GpsBase = if ($env:GPS_SEND_BASE) { $env:GPS_SEND_BASE } else { "http://localhost:9055" }
$Prefix = "LOADTEST_"

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http
$culture = [Globalization.CultureInfo]::InvariantCulture

if ($Count -notin @(10, 50, 100)) {
  Write-Host "Note: recommended test counts are 10, 50, or 100. Running with $Count anyway."
}

$client = [Net.Http.HttpClient]::new()
$watch = [Diagnostics.Stopwatch]::StartNew()
$round = 0
$sentTotal = 0
$okTotal = 0
$errTotal = 0

Write-Host "Sending fake GPS only to $GpsBase"
Write-Host "Devices: $Count | Duration: ${DurationSeconds}s | Interval: ${IntervalMs}ms"
Write-Host "Expected devices: LOADTEST_001 ... LOADTEST_$('{0:D3}' -f $Count)"

try {
  while ($watch.Elapsed.TotalSeconds -lt $DurationSeconds) {
    $round++
    $tasks = New-Object System.Collections.Generic.List[Threading.Tasks.Task]
    for ($i = 1; $i -le $Count; $i++) {
      $uid = "{0}{1:D3}" -f $Prefix, $i
      $angle = (($round + $i) % 360) * [Math]::PI / 180.0
      $lat = 21.0285 + [Math]::Sin($angle) * 0.015 + ($i % 10) * 0.0008
      $lon = 105.8342 + [Math]::Cos($angle) * 0.015 + ([Math]::Floor($i / 10)) * 0.0008
      $speed = 10 + (($round + $i) % 60)
      $bearing = ($round * 7 + $i * 3) % 360
      $battery = 50 + ($i % 50)
      $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
      $uri = "{0}/?id={1}&timestamp={2}&lat={3}&lon={4}&speed={5}&bearing={6}&altitude=10&accuracy=5&batt={7}" -f `
        $GpsBase.TrimEnd("/"),
        [Uri]::EscapeDataString($uid),
        $timestamp,
        $lat.ToString("0.000000", $culture),
        $lon.ToString("0.000000", $culture),
        $speed,
        $bearing,
        $battery
      $tasks.Add($client.PostAsync($uri, $null))
    }

    try {
      [Threading.Tasks.Task]::WaitAll($tasks.ToArray(), 30000) | Out-Null
    } catch {
      # Some requests can fail while the GPS server is starting/restarting.
      # Count them below instead of aborting the whole 1-hour test.
    }

    $ok = 0
    $err = 0
    $firstError = $null
    foreach ($task in $tasks) {
      $sentTotal++
      $completedOk = $task.IsCompleted -and (-not $task.IsFaulted) -and (-not $task.IsCanceled)
      if ($completedOk -and $task.Result.IsSuccessStatusCode) {
        $ok++
        $okTotal++
      } else {
        $err++
        $errTotal++
        if ($null -eq $firstError) {
          if ($task.IsFaulted -and $task.Exception) {
            $firstError = $task.Exception.GetBaseException().Message
          } elseif ($task.IsCanceled) {
            $firstError = "request timed out or canceled"
          } elseif ($completedOk -and $task.Result) {
            $firstError = "HTTP " + [int]$task.Result.StatusCode
          } else {
            $firstError = "unknown request failure"
          }
        }
      }
      if ($completedOk -and $null -ne $task.Result) {
        $task.Result.Dispose()
      }
    }

    $avg = if ($watch.Elapsed.TotalSeconds -gt 0) { [Math]::Round($sentTotal / $watch.Elapsed.TotalSeconds, 1) } else { 0 }
    $line = "Round {0}: sent={1}, ok={2}, error={3}, avg={4}/sec" -f $round, $Count, $ok, $err, $avg
    if ($firstError) { $line += " | firstError=$firstError" }
    Write-Host $line

    Start-Sleep -Milliseconds $IntervalMs
  }
} finally {
  Write-Host "Finished. Total sent=$sentTotal, ok=$okTotal, error=$errTotal"
  $client.Dispose()
}
