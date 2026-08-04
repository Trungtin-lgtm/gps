$ErrorActionPreference = 'Continue'

$devices = @(
  @{
    Id = 'CODEXGPS_STILL_004'
    Latitude = 20.9714
    Longitude = 105.8374
  },
  @{
    Id = 'CODEXGPS_STILL_005'
    Latitude = 20.9741
    Longitude = 105.8328
  },
  @{
    Id = 'CODEXGPS_STILL_006'
    Latitude = 20.9770
    Longitude = 105.8405
  }
)

while ($true) {
  $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

  foreach ($device in $devices) {
    $url = 'http://127.0.0.1:9055/?id={0}&timestamp={1}&lat={2}&lon={3}&speed=0&bearing=0&altitude=10&accuracy=5&batt=88' -f `
      $device.Id,
      $timestamp,
      $device.Latitude.ToString([Globalization.CultureInfo]::InvariantCulture),
      $device.Longitude.ToString([Globalization.CultureInfo]::InvariantCulture)

    try {
      Invoke-WebRequest `
        -Method Post `
        -Uri $url `
        -UseBasicParsing `
        -TimeoutSec 10 `
        -ErrorAction Stop | Out-Null
    } catch {
      # Keep retrying while the local GPS backend is restarting or unavailable.
    }
  }

  Start-Sleep -Seconds 10
}
