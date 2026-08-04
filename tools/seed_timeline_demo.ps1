$ErrorActionPreference = 'Stop'

$batchPath = Join-Path $PSScriptRoot 'seed_timeline_demo.bat'
$marker = '# POWERSHELL_START'
$batchText = [IO.File]::ReadAllText($batchPath)
$markerIndex = $batchText.LastIndexOf($marker)

if ($markerIndex -lt 0) {
  throw "PowerShell payload marker not found in $batchPath"
}

$payload = $batchText.Substring($markerIndex + $marker.Length)
$payloadBlock = [scriptblock]::Create($payload)
& $payloadBlock @args
exit $LASTEXITCODE
