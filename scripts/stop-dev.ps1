$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$pidFile = Join-Path $repoRoot ".devlogs\dev-stack.json"
if (-not (Test-Path $pidFile)) { Write-Host "No AgriSmart development stack PID file found."; exit 0 }

$stack = Get-Content $pidFile -Raw | ConvertFrom-Json
$expected = @{
    api = "uvicorn app.main:app"
    express = "src/server.js"
    vite = "frontend\react-app\node_modules\vite\bin\vite.js"
}
foreach ($name in @("vite", "express", "api")) {
    $id = [int]$stack.$name
    $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId=$id" -ErrorAction SilentlyContinue
    if (-not $processInfo) { Write-Host "$name (PID $id) is already stopped."; continue }
    if ($processInfo.CommandLine -notlike "*$($expected[$name])*" ) {
        Write-Warning "Leaving PID $id alone because it no longer matches the AgriSmart $name command."
        continue
    }
    Stop-Process -Id $id -ErrorAction Stop
    Write-Host "Stopped $name (PID $id)."
}
