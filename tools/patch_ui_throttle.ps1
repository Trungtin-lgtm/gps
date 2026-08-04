param(
    [string]$Command = "status",
    [int]$IntervalMs = 1500
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$target = Join-Path $root "src\store\throttleMiddleware.js"
$backup = "$target.bak-ui-throttle"
$marker = "UI_THROTTLE_COALESCED_PATCH"

function Write-Status {
    if (!(Test-Path -LiteralPath $target)) {
        throw "Cannot find $target"
    }
    $content = Get-Content -LiteralPath $target -Raw
    if ($content.Contains($marker)) {
        if ($content -match "const interval = ([0-9]+);") {
            Write-Host "STATUS: patched. UI realtime throttle interval = $($Matches[1])ms"
        } else {
            Write-Host "STATUS: patched."
        }
    } else {
        Write-Host "STATUS: original/default throttle."
    }
    if (Test-Path -LiteralPath $backup) {
        Write-Host "Backup exists:"
        Write-Host "  $backup"
    }
}

function Patch-File {
    if ($IntervalMs -lt 500) {
        throw "IntervalMs too small. Use 1000, 1500, 2000, or higher."
    }
    if (!(Test-Path -LiteralPath $target)) {
        throw "Cannot find $target"
    }
    if (!(Test-Path -LiteralPath $backup)) {
        Copy-Item -LiteralPath $target -Destination $backup -Force
        Write-Host "Backup created:"
        Write-Host "  $backup"
    } else {
        Write-Host "Backup already exists:"
        Write-Host "  $backup"
    }

    $content = @"
import { batch } from 'react-redux';

// $marker
// This middleware protects the web UI from rendering too often when many GPS
// devices send positions at the same time. The server/database still receives
// all positions; this only coalesces realtime Redux updates shown in the browser.
const interval = $IntervalMs;

const mergeById = (items, idField) => {
  const map = new Map();
  items.forEach((item) => {
    if (item && item[idField] !== undefined) {
      map.set(item[idField], item);
    }
  });
  return Array.from(map.values());
};

export default () => (next) => {
  let pendingDevices = [];
  let pendingPositions = [];
  let scheduled = false;

  const flush = () => {
    scheduled = false;

    const devices = pendingDevices;
    const positions = pendingPositions;
    pendingDevices = [];
    pendingPositions = [];

    batch(() => {
      if (devices.length) {
        next({
          type: 'devices/update',
          payload: mergeById(devices, 'id'),
        });
      }
      if (positions.length) {
        next({
          type: 'positions/update',
          payload: mergeById(positions, 'deviceId'),
        });
      }
    });
  };

  return (action) => {
    if (action.type === 'devices/update') {
      pendingDevices.push(...action.payload);
    } else if (action.type === 'positions/update') {
      pendingPositions.push(...action.payload);
    } else {
      return next(action);
    }

    if (!scheduled) {
      scheduled = true;
      setTimeout(flush, interval);
    }

    return null;
  };
};
"@

    Set-Content -LiteralPath $target -Value $content -Encoding UTF8
    Write-Host "PATCHED OK:"
    Write-Host "  $target"
    Write-Host "UI realtime update is now coalesced every $IntervalMs ms."
}

function Restore-File {
    if (!(Test-Path -LiteralPath $backup)) {
        throw "Backup not found: $backup"
    }
    Copy-Item -LiteralPath $backup -Destination $target -Force
    Write-Host "RESTORED original file from backup:"
    Write-Host "  $backup"
}

switch ($Command.ToLowerInvariant()) {
    "status" { Write-Status }
    "patch" { Patch-File }
    "restore" { Restore-File }
    default {
        Write-Host "Usage:"
        Write-Host "  tools\patch_ui_throttle.bat status"
        Write-Host "  tools\patch_ui_throttle.bat patch 1500"
        Write-Host "  tools\patch_ui_throttle.bat restore"
        exit 2
    }
}

