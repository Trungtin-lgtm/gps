@echo off
setlocal
set "GPS_LOAD_TEST_BAT=%~f0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$bat=$env:GPS_LOAD_TEST_BAT; $text=[IO.File]::ReadAllText($bat); $marker='# POWERSHELL_START'; $idx=$text.LastIndexOf($marker); if ($idx -lt 0) { throw 'PowerShell marker not found' }; $script=$text.Substring($idx + $marker.Length); $tmp=Join-Path $env:TEMP 'gps_load_test_inner.ps1'; [IO.File]::WriteAllText($tmp, $script, [Text.UTF8Encoding]::new($false)); & $tmp @args" %*
exit /b %ERRORLEVEL%

# POWERSHELL_START
param(
  [string]$Mode = "10",
  [int]$DurationSeconds = 60,
  [int]$IntervalMs = 1000,
  [string]$ApiBase = "http://localhost:9090",
  [string]$GpsBase = "http://localhost:9055",
  [string]$Prefix = "LOADTEST_",
  [string]$DisplayNamePrefix = "GPS Test",
  [string]$Login = "",
  [string]$Password = ""
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http
$culture = [Globalization.CultureInfo]::InvariantCulture
$script:ApiPrefix = "/api"

function Get-ApiUrl {
  param([string]$ApiBase, [string]$Path)
  $base = $ApiBase.TrimEnd("/")
  $prefix = $script:ApiPrefix
  if ([string]::IsNullOrWhiteSpace($prefix)) {
    return "$base/$Path"
  }
  return "$base$prefix/$Path"
}

function Read-PlainPassword {
  $secure = Read-Host "Admin password" -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
}

function Login-Server {
  param([string]$ApiBase)

  $email = $Login
  if ([string]::IsNullOrWhiteSpace($email)) {
    $email = Read-Host "Admin login/email [admin]"
  }
  if ([string]::IsNullOrWhiteSpace($email)) {
    $email = "admin"
  }
  $password = $Password
  if ([string]::IsNullOrWhiteSpace($password)) {
    $password = Read-PlainPassword
  }

  $cookieFile = Join-Path $env:TEMP ("gps_load_test_cookies_{0}.txt" -f ([Guid]::NewGuid().ToString("N")))
  $body = "email=$([Uri]::EscapeDataString($email))&password=$([Uri]::EscapeDataString($password))"
  $lastStatus = ""
  $lastMessage = ""
  foreach ($candidatePrefix in @("/api", "")) {
    $script:ApiPrefix = $candidatePrefix
    $url = Get-ApiUrl -ApiBase $ApiBase -Path "session"
    $outputFile = Join-Path $env:TEMP ("gps_load_test_login_{0}.txt" -f ([Guid]::NewGuid().ToString("N")))
    $status = & curl.exe -sS -o $outputFile -w "%{http_code}" -c $cookieFile -X POST -H "Content-Type: application/x-www-form-urlencoded" --data $body "$url"
    if ($LASTEXITCODE -ne 0) {
      throw "curl cannot connect to $url"
    }
    if ([int]$status -ge 200 -and [int]$status -lt 300) {
      if ([string]::IsNullOrWhiteSpace($candidatePrefix)) {
        Write-Host "Detected API root: /"
      } else {
        Write-Host "Detected API root: $candidatePrefix"
      }
      return $cookieFile
    }
    $lastStatus = $status
    if (Test-Path $outputFile) {
      $lastMessage = Get-Content -LiteralPath $outputFile -Raw
    }
    if ([int]$status -ne 404) {
      break
    }
  }
  throw "Login failed. HTTP $lastStatus $lastMessage"
}

function Get-Devices {
  param($Session, [string]$ApiBase)

  $outputFile = Join-Path $env:TEMP ("gps_load_test_devices_{0}.json" -f ([Guid]::NewGuid().ToString("N")))
  $devicesAllUrl = Get-ApiUrl -ApiBase $ApiBase -Path "devices?all=true"
  $devicesUrl = Get-ApiUrl -ApiBase $ApiBase -Path "devices"
  $status = & curl.exe -sS -o $outputFile -w "%{http_code}" -b $Session "$devicesAllUrl"
  if ([int]$status -lt 200 -or [int]$status -ge 300) {
    $status = & curl.exe -sS -o $outputFile -w "%{http_code}" -b $Session "$devicesUrl"
  }
  if ([int]$status -lt 200 -or [int]$status -ge 300) {
    return @()
  }
  @(Get-Content -LiteralPath $outputFile -Raw | ConvertFrom-Json)
}

function Ensure-TestDevices {
  param($Session, [string]$ApiBase, [int]$Count, [string]$Prefix)

  Write-Host "Checking/creating $Count test devices with prefix $Prefix ..."
  $devices = @(Get-Devices -Session $Session -ApiBase $ApiBase)
  $byUniqueId = @{}
  foreach ($device in $devices) {
    if ($device.uniqueId) {
      $byUniqueId[$device.uniqueId] = $device
    }
  }

  for ($i = 1; $i -le $Count; $i++) {
    $uid = "{0}{1:D3}" -f $Prefix, $i
    $displayName = "{0} {1:D3}" -f $DisplayNamePrefix, $i
    if (-not $byUniqueId.ContainsKey($uid)) {
      $payload = @{
        name = $displayName
        uniqueId = $uid
        category = "default"
        disabled = $false
        attributes = @{}
      } | ConvertTo-Json -Depth 5
      $payloadFile = Join-Path $env:TEMP ("gps_load_test_device_{0}.json" -f ([Guid]::NewGuid().ToString("N")))
      [IO.File]::WriteAllText($payloadFile, $payload, [Text.UTF8Encoding]::new($false))
      $outputFile = Join-Path $env:TEMP ("gps_load_test_device_out_{0}.json" -f ([Guid]::NewGuid().ToString("N")))
      $devicesUrl = Get-ApiUrl -ApiBase $ApiBase -Path "devices"
      $status = & curl.exe -sS -o $outputFile -w "%{http_code}" -b $Session -X POST -H "Content-Type: application/json" --data-binary "@$payloadFile" "$devicesUrl"
      if ([int]$status -ge 200 -and [int]$status -lt 300) {
        $device = Get-Content -LiteralPath $outputFile -Raw | ConvertFrom-Json
        $byUniqueId[$uid] = $device
        Write-Host "Created $displayName ($uid)"
      } else {
        $message = ""
        if (Test-Path $outputFile) {
          $message = (Get-Content -LiteralPath $outputFile -Raw).Trim()
        }
        Write-Host "Could not create $displayName ($uid). HTTP $status $message" -ForegroundColor Yellow
      }
    } elseif ($byUniqueId[$uid].name -ne $displayName) {
      $device = $byUniqueId[$uid]
      $device.name = $displayName
      $payload = $device | ConvertTo-Json -Depth 20
      $payloadFile = Join-Path $env:TEMP ("gps_load_test_device_put_{0}.json" -f ([Guid]::NewGuid().ToString("N")))
      [IO.File]::WriteAllText($payloadFile, $payload, [Text.UTF8Encoding]::new($false))
      $outputFile = Join-Path $env:TEMP ("gps_load_test_device_put_out_{0}.json" -f ([Guid]::NewGuid().ToString("N")))
      $deviceUrl = Get-ApiUrl -ApiBase $ApiBase -Path "devices/$($device.id)"
      $status = & curl.exe -sS -o $outputFile -w "%{http_code}" -b $Session -X PUT -H "Content-Type: application/json" --data-binary "@$payloadFile" "$deviceUrl"
      if ([int]$status -ge 200 -and [int]$status -lt 300) {
        $updated = Get-Content -LiteralPath $outputFile -Raw | ConvertFrom-Json
        $byUniqueId[$uid] = $updated
        Write-Host "Renamed $uid to $displayName"
      } else {
        Write-Host "Could not rename $uid. HTTP $status" -ForegroundColor Yellow
      }
    }
  }
}

function Remove-TestDevices {
  param($Session, [string]$ApiBase, [string]$Prefix)

  $devices = @(Get-Devices -Session $Session -ApiBase $ApiBase | Where-Object { $_.uniqueId -like "$Prefix*" })
  if ($devices.Count -eq 0) {
    Write-Host "No test devices found for prefix $Prefix"
    return
  }

  Write-Host "Found $($devices.Count) test devices:"
  $devices | Select-Object id, name, uniqueId | Format-Table
  $confirm = Read-Host "Delete ONLY these test devices? Type YES to continue"
  if ($confirm -notin @("YES", "yes", "Y", "y")) {
    Write-Host "Cleanup cancelled."
    return
  }

  foreach ($device in $devices) {
    $deviceUrl = Get-ApiUrl -ApiBase $ApiBase -Path "devices/$($device.id)"
    & curl.exe -sS -o NUL -w "%{http_code}" -b $Session -X DELETE "$deviceUrl" | Out-Null
    Write-Host "Deleted $($device.uniqueId)"
  }
}

function Start-GpsLoad {
  param([int]$Count, [int]$DurationSeconds, [int]$IntervalMs, [string]$GpsBase, [string]$Prefix)

  if ($Count -notin @(10, 50, 100)) {
    Write-Host "Note: recommended test counts are 10, 50, or 100. Running with $Count anyway."
  }

  $client = [Net.Http.HttpClient]::new()
  $watch = [Diagnostics.Stopwatch]::StartNew()
  $round = 0
  $sentTotal = 0
  $okTotal = 0
  $errTotal = 0

  Write-Host "Sending fake GPS to $GpsBase"
  Write-Host "Devices: $Count | Duration: ${DurationSeconds}s | Interval: ${IntervalMs}ms"
  Write-Host "Open the web UI and watch devices named GPS Test 001, GPS Test 002..."

  try {
    while ($watch.Elapsed.TotalSeconds -lt $DurationSeconds) {
      $round++
      $roundWatch = [Diagnostics.Stopwatch]::StartNew()
      $epoch = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
      $tasks = New-Object "System.Collections.Generic.List[System.Threading.Tasks.Task[System.Net.Http.HttpResponseMessage]]"

      for ($i = 1; $i -le $Count; $i++) {
        $uid = "{0}{1:D3}" -f $Prefix, $i
        $angle = ($round * 0.08) + ($i * 0.19)
        $lat = 21.027800 + ([Math]::Sin($angle) * 0.015) + ($i * 0.00002)
        $lon = 105.834200 + ([Math]::Cos($angle) * 0.015) + ($i * 0.00002)
        $speed = 20 + (($round + $i) % 45)
        $bearing = (($round * 7) + ($i * 3)) % 360
        $batt = 50 + (($round + $i) % 50)

        $url = "{0}/?id={1}&timestamp={2}&lat={3}&lon={4}&speed={5}&bearing={6}&altitude=10&accuracy=5&batt={7}" -f `
          $GpsBase.TrimEnd("/"),
          [Uri]::EscapeDataString($uid),
          $epoch,
          $lat.ToString("0.000000", $culture),
          $lon.ToString("0.000000", $culture),
          $speed.ToString($culture),
          $bearing.ToString($culture),
          $batt.ToString($culture)

        $content = [Net.Http.StringContent]::new("", [Text.Encoding]::UTF8, "application/x-www-form-urlencoded")
        $tasks.Add($client.PostAsync($url, $content))
      }

      try {
        [Threading.Tasks.Task]::WaitAll($tasks.ToArray(), 30000) | Out-Null
      } catch {
        # Count failed requests below instead of stopping the whole run.
      }

      $ok = 0
      $err = 0
      $firstError = $null
      foreach ($task in $tasks) {
        $completedOk = $task.IsCompleted -and (-not $task.IsFaulted) -and (-not $task.IsCanceled)
        if ($completedOk -and [int]$task.Result.StatusCode -ge 200 -and [int]$task.Result.StatusCode -lt 300) {
          $ok++
        } else {
          $err++
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
        if ($completedOk) {
          $task.Result.Dispose()
        }
      }

      $sentTotal += $Count
      $okTotal += $ok
      $errTotal += $err
      $elapsed = [Math]::Max($watch.Elapsed.TotalSeconds, 0.001)
      $rate = ($sentTotal / $elapsed).ToString("0.0", $culture)
      $line = "Round {0}: sent={1}, ok={2}, error={3}, avg={4}/sec" -f $round, $Count, $ok, $err, $rate
      if ($firstError) { $line += " | firstError=$firstError" }
      Write-Host $line

      $sleepMs = $IntervalMs - [int]$roundWatch.ElapsedMilliseconds
      if ($sleepMs -gt 0) {
        Start-Sleep -Milliseconds $sleepMs
      }
    }
  } finally {
    $client.Dispose()
  }

  Write-Host "Done. Total sent=$sentTotal, ok=$okTotal, error=$errTotal"
}

try {
  if ($Mode -eq "cleanup") {
    $session = Login-Server -ApiBase $ApiBase
    Remove-TestDevices -Session $session -ApiBase $ApiBase -Prefix $Prefix
    exit 0
  }

  $count = [int]$Mode
  if ($count -le 0) {
    throw "Device count must be positive. Use 10, 50, 100, or cleanup."
  }

  $session = Login-Server -ApiBase $ApiBase
  Ensure-TestDevices -Session $session -ApiBase $ApiBase -Count $count -Prefix $Prefix
  Start-GpsLoad -Count $count -DurationSeconds $DurationSeconds -IntervalMs $IntervalMs -GpsBase $GpsBase -Prefix $Prefix
} catch {
  Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host ""
  Write-Host "If this says 'Unable to connect to the remote server', start GPS_Server first:" -ForegroundColor Yellow
  Write-Host '  cd "D:\GPStl\New folder\GPS\GPS\GPS_Server"'
  Write-Host '  .\start-server.bat'
  Write-Host ""
  Write-Host "Then open http://localhost:9090 and run this test again." -ForegroundColor Yellow
  exit 1
}
