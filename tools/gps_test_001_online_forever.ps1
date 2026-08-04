$ErrorActionPreference = 'Continue'
$deviceId = 'LOADTEST_002'
$latitude = 20.9810977
$longitude = 105.839667

while ($true) {
  try {
    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $url = "http://127.0.0.1:9055/?id=$deviceId&timestamp=$timestamp&lat=$latitude&lon=$longitude&speed=0&bearing=0&altitude=10&accuracy=5&batt=90"
    Invoke-WebRequest -Method Post -Uri $url -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop | Out-Null
  } catch {
    # The local GPS backend can be temporarily unavailable during a restart.
  }
  Start-Sleep -Seconds 10
}
