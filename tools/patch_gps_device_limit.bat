@echo off
setlocal

if "%~1"=="" (
  set "PATCH_MODE=patch"
) else (
  set "PATCH_MODE=%~1"
)
if "%~2"=="" (
  set "PATCH_LIMIT=100"
) else (
  set "PATCH_LIMIT=%~2"
)
if "%~3"=="" (
  set "PATCH_JAR=..\GPS_Server\tracker-server.jar"
) else (
  set "PATCH_JAR=%~3"
)

set "SCRIPT=%~f0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$script = Get-Content -LiteralPath '%SCRIPT%' -Raw; $marker = '# POWERSHELL_START'; $idx = $script.LastIndexOf($marker); if ($idx -lt 0) { throw 'PowerShell marker not found' }; $ps = $script.Substring($idx + $marker.Length); $tmp = Join-Path $env:TEMP ('patch_gps_device_limit_' + [guid]::NewGuid().ToString() + '.ps1'); Set-Content -LiteralPath $tmp -Value $ps -Encoding UTF8; try { & $tmp; exit $LASTEXITCODE } finally { Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue }"
exit /b %ERRORLEVEL%

# POWERSHELL_START
$Mode = if ($env:PATCH_MODE) { $env:PATCH_MODE } else { 'patch' }
$Limit = if ($env:PATCH_LIMIT) { [int] $env:PATCH_LIMIT } else { 100 }
$JarPath = if ($env:PATCH_JAR) { $env:PATCH_JAR } else { '..\GPS_Server\tracker-server.jar' }

if (@('patch', 'restore', 'status') -notcontains $Mode) {
    throw "Mode must be patch, restore, or status."
}

$ErrorActionPreference = 'Stop'

function Resolve-FullPath([string] $Path) {
    if ([IO.Path]::IsPathRooted($Path)) {
        return [IO.Path]::GetFullPath($Path)
    }
    return [IO.Path]::GetFullPath((Join-Path (Get-Location) $Path))
}

function Find-Pattern([byte[]] $Data, [byte[]] $Pattern) {
    $matches = New-Object System.Collections.Generic.List[int]
    for ($i = 0; $i -le $Data.Length - $Pattern.Length; $i++) {
        $ok = $true
        for ($j = 0; $j -lt $Pattern.Length; $j++) {
            if ($Data[$i + $j] -ne $Pattern[$j]) {
                $ok = $false
                break
            }
        }
        if ($ok) {
            $matches.Add($i)
        }
    }
    return $matches
}

if ($Limit -lt 11 -or $Limit -gt 127) {
    throw "Limit must be from 11 to 127 for this quick bytecode patch. Suggested: 100."
}

$jar = Resolve-FullPath $JarPath
$backup = "$jar.bak-limit10"
$entryName = 'org/traccar/api/security/PermissionsService.class'

if ($Mode -eq 'restore') {
    if (!(Test-Path -LiteralPath $backup)) {
        throw "Backup not found: $backup"
    }
    Copy-Item -LiteralPath $backup -Destination $jar -Force
    Write-Host "RESTORED original JAR from backup:"
    Write-Host "  $backup"
    Write-Host "Restart GPS_Server now."
    exit 0
}

if (!(Test-Path -LiteralPath $jar)) {
    throw "JAR not found: $jar"
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$needBackupBeforeUpdate = $Mode -eq 'patch' -and !(Test-Path -LiteralPath $backup)
if ($needBackupBeforeUpdate) {
    Copy-Item -LiteralPath $jar -Destination $backup -Force
    Write-Host "Backup created:"
    Write-Host "  $backup"
}

$openMode = if ($Mode -eq 'status') { [IO.Compression.ZipArchiveMode]::Read } else { [IO.Compression.ZipArchiveMode]::Update }
$zip = [IO.Compression.ZipFile]::Open($jar, $openMode)
try {
    $entry = $zip.GetEntry($entryName)
    if ($null -eq $entry) {
        throw "Entry not found in JAR: $entryName"
    }

    $stream = $entry.Open()
    try {
        $memory = New-Object IO.MemoryStream
        $stream.CopyTo($memory)
        [byte[]] $bytes = $memory.ToArray()
    } finally {
        $stream.Dispose()
    }

    # Bytecode pattern in PermissionsService.checkEdit:
    # size -> istore 7 -> iload 7 -> bipush 10 -> if_icmplt -> iconst_1 -> istore 6
    [byte[]] $pattern10  = 0xb9,0x00,0x77,0x01,0x00,0x36,0x07,0x15,0x07,0x10,0x0a,0xa1,0x00,0x06,0x04,0x36,0x06
    [byte[]] $patternNew = 0xb9,0x00,0x77,0x01,0x00,0x36,0x07,0x15,0x07,0x10,[byte]$Limit,0xa1,0x00,0x06,0x04,0x36,0x06

    $found10 = Find-Pattern $bytes $pattern10
    $foundNew = Find-Pattern $bytes $patternNew

    if ($Mode -eq 'status') {
        if ($foundNew.Count -eq 1) {
            Write-Host "STATUS: already patched. Device create limit bytecode = $Limit"
        } elseif ($found10.Count -eq 1) {
            Write-Host "STATUS: original. Device create limit bytecode = 10"
        } else {
            Write-Host "STATUS: unknown pattern. found original=$($found10.Count), patched=$($foundNew.Count)"
        }
        exit 0
    }

    if ($foundNew.Count -eq 1) {
        Write-Host "Already patched to limit $Limit. Nothing changed."
        exit 0
    }
    if ($found10.Count -ne 1) {
        throw "Could not safely find original limit pattern. found=$($found10.Count). JAR not changed."
    }

    if (Test-Path -LiteralPath $backup) {
        Write-Host "Backup already exists:"
        Write-Host "  $backup"
    }

    $offset = $found10[0] + 10
    $bytes[$offset] = [byte] $Limit

    $entry.Delete()
    $newEntry = $zip.CreateEntry($entryName, [IO.Compression.CompressionLevel]::Optimal)
    $out = $newEntry.Open()
    try {
        $out.Write($bytes, 0, $bytes.Length)
    } finally {
        $out.Dispose()
    }

    Write-Host "PATCHED OK:"
    Write-Host "  $jar"
    Write-Host "Device creation limit changed from 10 to $Limit."
    Write-Host "Restart GPS_Server before testing again."
} finally {
    $zip.Dispose()
}
