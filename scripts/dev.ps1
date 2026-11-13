param(
    [string]$JwtSecret = "dev-only-insecure-secret-change-me"
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$apiDir = Join-Path $repoRoot "backend\python-fastapi"
$nodeDir = Join-Path $repoRoot "backend\node-express"
$reactDir = Join-Path $repoRoot "frontend\react-app"
$pythonExe = Join-Path $repoRoot "backend\.venv\Scripts\python.exe"
$nodeExe = (Get-Command node -ErrorAction Stop).Source
$logsDir = Join-Path $repoRoot ".devlogs"
$pidFile = Join-Path $logsDir "dev-stack.json"
$cors = "http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:8080"

New-Item -ItemType Directory -Force -Path $logsDir | Out-Null
if (-not (Test-Path $pythonExe)) { throw "Python environment missing. Create backend/.venv and install backend/python-fastapi/requirements.txt first." }
if (-not (Test-Path (Join-Path $nodeDir "node_modules"))) { throw "Express dependencies missing. Run: npm --prefix backend/node-express ci" }
if (-not (Test-Path (Join-Path $reactDir "node_modules\vite\bin\vite.js"))) { throw "React dependencies missing. Run: npm --prefix frontend/react-app ci" }

function Test-ListeningPort([int]$Port) {
    return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1)
}

if (Test-ListeningPort 5175) { throw "Port 5175 is already in use. Stop its current process or change the Vite port." }
if (-not (Test-ListeningPort 27017)) {
    throw "MongoDB is not listening on 127.0.0.1:27017. Start MongoDB first, or use 'docker compose up --build'."
}

$started = [System.Collections.Generic.List[System.Diagnostics.Process]]::new()
$owned = @{}
$oldEnvironment = @{}
function Set-StackEnvironment([string]$Name, [string]$Value) {
    if (-not $oldEnvironment.ContainsKey($Name)) { $oldEnvironment[$Name] = [Environment]::GetEnvironmentVariable($Name, "Process") }
    [Environment]::SetEnvironmentVariable($Name, $Value, "Process")
}
function Restore-StackEnvironment {
    foreach ($name in $oldEnvironment.Keys) { [Environment]::SetEnvironmentVariable($name, $oldEnvironment[$name], "Process") }
}
function Wait-Http([string]$Url, [System.Diagnostics.Process]$Process, [string]$Service) {
    $deadline = (Get-Date).AddSeconds(60)
    while ((Get-Date) -lt $deadline) {
        if ($Process.HasExited) { throw "$Service exited during startup. See logs in $logsDir." }
        try {
            $response = Invoke-RestMethod -Uri $Url -TimeoutSec 20
            if ($response.status -eq "ok") { return $response }
        } catch { }
        Start-Sleep -Seconds 1
    }
    throw "$Service did not become healthy at $Url. See logs in $logsDir."
}

try {
    $api = $null
    if (Test-ListeningPort 8000) {
        try {
            $apiHealth = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health" -TimeoutSec 4
            if ($apiHealth.status -ne "ok" -or $apiHealth.model -ne "ml-model") { throw "An unhealthy or unconfigured service is already using port 8000." }
            $apiPid = (Get-NetTCPConnection -LocalPort 8000 -State Listen | Select-Object -First 1).OwningProcess
            $api = Get-Process -Id $apiPid
            Write-Host "Reusing healthy FastAPI process on port 8000."
        } catch { throw "Port 8000 is in use by a FastAPI service that is not ready for this app. Stop it, then rerun this script. $($_.Exception.Message)" }
    }
    $farm = $null
    if (Test-ListeningPort 4100) {
        try {
            $farmHealth = Invoke-RestMethod -Uri "http://127.0.0.1:4100/health" -TimeoutSec 4
            if ($farmHealth.status -ne "ok") { throw "Farm service is not healthy." }
            $farmPid = (Get-NetTCPConnection -LocalPort 4100 -State Listen | Select-Object -First 1).OwningProcess
            $farm = Get-Process -Id $farmPid
            Write-Host "Reusing healthy Express service on port 4100."
        } catch { throw "Port 4100 is in use by a farm service that is not ready. Stop it, then rerun this script. $($_.Exception.Message)" }
    }
    Set-StackEnvironment "JWT_SECRET" $JwtSecret
    Set-StackEnvironment "ENVIRONMENT" "development"
    Set-StackEnvironment "DATABASE_URL" "sqlite:///./agrioptima.db"
    Set-StackEnvironment "CORS_ORIGINS" $cors
    Set-StackEnvironment "PYTHONPATH" $repoRoot
    if (-not $api) {
        $api = Start-Process -FilePath $pythonExe -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000") -WorkingDirectory $apiDir -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logsDir "fastapi.out.log") -RedirectStandardError (Join-Path $logsDir "fastapi.err.log") -PassThru
        $started.Add($api)
        $owned.api = $api.Id
        $apiHealth = Wait-Http "http://127.0.0.1:8000/api/health" $api "FastAPI"
    }
    if ($apiHealth.model -ne "ml-model") { throw "FastAPI started, but the crop model is not loaded. Check AIML/models and fastapi.err.log." }

    Set-StackEnvironment "PORT" "4100"
    Set-StackEnvironment "MONGODB_URI" "mongodb://127.0.0.1:27017/agrioptima"
    Set-StackEnvironment "JWT_ISSUER" "agrioptima-api"
    Set-StackEnvironment "JWT_AUDIENCE" "agrioptima"
    Set-StackEnvironment "AGRI_API_URL" "http://127.0.0.1:8000/api"
    if (-not $farm) {
        $farm = Start-Process -FilePath $nodeExe -ArgumentList @("src/server.js") -WorkingDirectory $nodeDir -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logsDir "express.out.log") -RedirectStandardError (Join-Path $logsDir "express.err.log") -PassThru
        $started.Add($farm)
        $owned.express = $farm.Id
        $null = Wait-Http "http://127.0.0.1:4100/health" $farm "Express farm service"
    }

    Set-StackEnvironment "API_PROXY_TARGET" "http://127.0.0.1:8000"
    Set-StackEnvironment "FARM_PROXY_TARGET" "http://127.0.0.1:4100"
    $viteCli = Join-Path $reactDir "node_modules\vite\bin\vite.js"
    $vite = Start-Process -FilePath $nodeExe -ArgumentList @($viteCli, "--host", "127.0.0.1", "--port", "5175", "--strictPort") -WorkingDirectory $reactDir -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logsDir "vite.out.log") -RedirectStandardError (Join-Path $logsDir "vite.err.log") -PassThru
    $started.Add($vite)
    $owned.vite = $vite.Id
    $deadline = (Get-Date).AddSeconds(30)
    do {
        if ($vite.HasExited) { throw "Vite exited during startup. See vite.err.log in $logsDir." }
        try { $null = Invoke-WebRequest -Uri "http://127.0.0.1:5175/" -TimeoutSec 5 -UseBasicParsing; break } catch { Start-Sleep -Seconds 1 }
    } while ((Get-Date) -lt $deadline)
    if (-not (Test-ListeningPort 5175)) { throw "Vite did not open port 5175. See vite.err.log in $logsDir." }

    $owned | ConvertTo-Json | Set-Content -Encoding utf8 $pidFile
    Write-Host "AgriSmart is running:" -ForegroundColor Green
    Write-Host "  React:         http://localhost:5175"
    Write-Host "  FastAPI docs:  http://localhost:8000/docs"
    Write-Host "  Express health:http://localhost:4100/health"
    Write-Host "  Logs:          $logsDir"
    Write-Host "  Stop:          .\scripts\stop-dev.ps1"
} catch {
    foreach ($process in $started) { if (-not $process.HasExited) { & taskkill.exe /PID $process.Id /T /F 2>$null | Out-Null } }
    throw
} finally {
    Restore-StackEnvironment
}
