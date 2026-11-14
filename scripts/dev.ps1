# Starts the whole AgriSmart stack locally (Windows / PowerShell):
#   FastAPI + AIML models  http://localhost:8000   (2 worker processes, load shedding, caches)
#   MCP server (HTTP)      http://localhost:8100/mcp
#   Express farm-service   http://localhost:4100   (needs MongoDB for farm data)
#   React web app          http://localhost:5175
#   Operations dashboard   http://localhost:5180
# Logs go to .devlogs/. Stop everything with .\scripts\stop-dev.ps1
param(
    [string]$JwtSecret = "dev-only-insecure-secret-change-me",
    [int]$ApiWorkers = 2,
    [int]$McpWorkers = 2
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$apiDir = Join-Path $repoRoot "backend\python-fastapi"
$nodeDir = Join-Path $repoRoot "backend\node-express"
$reactDir = Join-Path $repoRoot "frontend\react-app"
$dashDir = Join-Path $repoRoot "Dashboard"
$pythonExe = Join-Path $repoRoot "backend\.venv\Scripts\python.exe"
$nodeExe = (Get-Command node -ErrorAction Stop).Source
$logsDir = Join-Path $repoRoot ".devlogs"
$pidFile = Join-Path $logsDir "dev-stack.json"
$cors = "http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5180,http://localhost:8080,http://localhost:8090"

New-Item -ItemType Directory -Force -Path $logsDir | Out-Null
if (-not (Test-Path $pythonExe)) { throw "Python environment missing. Create backend/.venv and install backend/python-fastapi/requirements.txt first." }
if (-not (Test-Path (Join-Path $nodeDir "node_modules"))) { throw "Express dependencies missing. Run: npm --prefix backend/node-express ci" }
if (-not (Test-Path (Join-Path $reactDir "node_modules\vite\bin\vite.js"))) { throw "React dependencies missing. Run: npm --prefix frontend/react-app ci" }
if (-not (Test-Path (Join-Path $dashDir "node_modules\vite\bin\vite.js"))) { throw "Dashboard dependencies missing. Run: npm --prefix Dashboard ci" }

function Test-ListeningPort([int]$Port) {
    return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1)
}

$mongoUp = Test-ListeningPort 27017
if (-not $mongoUp) {
    Write-Warning "MongoDB is not listening on 127.0.0.1:27017. Farm pages will report 'database unavailable' until it starts (the farm-service reconnects automatically)."
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
function Wait-Http([string]$Url, [System.Diagnostics.Process]$Process, [string]$Service, [string[]]$Accept = @("ok"), [int]$Seconds = 90) {
    $deadline = (Get-Date).AddSeconds($Seconds)
    while ((Get-Date) -lt $deadline) {
        if ($Process -and $Process.HasExited) { throw "$Service exited during startup. See logs in $logsDir." }
        $response = $null
        try {
            $response = Invoke-RestMethod -Uri $Url -TimeoutSec 20
        } catch {
            # A degraded service answers 503 with a JSON body (Windows PowerShell 5.1 has no -SkipHttpErrorCheck).
            try { $response = $_.ErrorDetails.Message | ConvertFrom-Json } catch { }
        }
        if ($response -and ($Accept -contains $response.status)) { return $response }
        Start-Sleep -Seconds 1
    }
    throw "$Service did not become healthy at $Url. See logs in $logsDir."
}
function Start-StackProcess([string]$Name, [string]$Exe, [string[]]$Arguments, [string]$WorkDir) {
    $p = Start-Process -FilePath $Exe -ArgumentList $Arguments -WorkingDirectory $WorkDir -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $logsDir "$Name.out.log") -RedirectStandardError (Join-Path $logsDir "$Name.err.log") -PassThru
    $started.Add($p)
    $owned[$Name] = $p.Id
    return $p
}

try {
    Set-StackEnvironment "JWT_SECRET" $JwtSecret
    Set-StackEnvironment "ENVIRONMENT" "development"
    Set-StackEnvironment "DATABASE_URL" "sqlite:///./agrioptima.db"
    Set-StackEnvironment "CORS_ORIGINS" $cors
    Set-StackEnvironment "PYTHONPATH" $repoRoot
    Set-StackEnvironment "FARM_SERVICE_URL" "http://127.0.0.1:4100"
    Set-StackEnvironment "MCP_URL" "http://127.0.0.1:8100"

    # ---------------------------------------------------------------- FastAPI + AIML
    if (Test-ListeningPort 8000) {
        $apiHealth = Wait-Http "http://127.0.0.1:8000/api/health" $null "FastAPI on port 8000" -Seconds 5
        if ($apiHealth.model -ne "ml-model") { throw "Port 8000 is in use by a FastAPI service without the trained model. Stop it, then rerun this script." }
        Write-Host "Reusing healthy FastAPI service on port 8000."
    } else {
        $api = Start-StackProcess "fastapi" $pythonExe @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--workers", "$ApiWorkers") $apiDir
        $apiHealth = Wait-Http "http://127.0.0.1:8000/api/health" $api "FastAPI"
    }
    if ($apiHealth.model -ne "ml-model") { throw "FastAPI started, but the crop model is not loaded. Check AIML/models and fastapi.err.log." }

    # ---------------------------------------------------------------- MCP server
    if (Test-ListeningPort 8100) {
        $null = Wait-Http "http://127.0.0.1:8100/health" $null "MCP server on port 8100" -Seconds 5
        Write-Host "Reusing healthy MCP server on port 8100."
    } else {
        $mcp = Start-StackProcess "mcp" $pythonExe @("-m", "AIML.agentic_ai.mcp_server", "--transport", "http", "--host", "127.0.0.1", "--port", "8100", "--workers", "$McpWorkers") $repoRoot
        $null = Wait-Http "http://127.0.0.1:8100/health" $mcp "MCP server"
    }

    # ---------------------------------------------------------------- Express
    Set-StackEnvironment "PORT" "4100"
    Set-StackEnvironment "MONGODB_URI" "mongodb://127.0.0.1:27017/agrioptima"
    Set-StackEnvironment "JWT_ISSUER" "agrioptima-api"
    Set-StackEnvironment "JWT_AUDIENCE" "agrioptima"
    Set-StackEnvironment "AGRI_API_URL" "http://127.0.0.1:8000/api"
    $farmAccept = if ($mongoUp) { @("ok") } else { @("ok", "degraded") }
    if (Test-ListeningPort 4100) {
        $null = Wait-Http "http://127.0.0.1:4100/health" $null "Express on port 4100" $farmAccept -Seconds 5
        Write-Host "Reusing Express service on port 4100."
    } else {
        $farm = Start-StackProcess "express" $nodeExe @("src/server.js") $nodeDir
        $null = Wait-Http "http://127.0.0.1:4100/health" $farm "Express farm service" $farmAccept
    }

    # ---------------------------------------------------------------- frontends
    Set-StackEnvironment "API_PROXY_TARGET" "http://127.0.0.1:8000"
    Set-StackEnvironment "FARM_PROXY_TARGET" "http://127.0.0.1:4100"
    Set-StackEnvironment "MCP_PROXY_TARGET" "http://127.0.0.1:8100"
    $frontends = @(
        @{ Name = "vite"; Dir = $reactDir; Port = 5175 },
        @{ Name = "dashboard"; Dir = $dashDir; Port = 5180 }
    )
    foreach ($fe in $frontends) {
        if (Test-ListeningPort $fe.Port) {
            $owner = (Get-NetTCPConnection -LocalPort $fe.Port -State Listen | Select-Object -First 1).OwningProcess
            $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$owner").CommandLine
            if ($cmd -notlike "*$(Split-Path $fe.Dir -Leaf)*vite*") { throw "Port $($fe.Port) is in use by another program (PID $owner). Stop it, then rerun this script." }
            Write-Host "Reusing the $($fe.Name) dev server already running on port $($fe.Port)."
            continue
        }
        $viteCli = Join-Path $fe.Dir "node_modules\vite\bin\vite.js"
        $proc = Start-StackProcess $fe.Name $nodeExe @($viteCli, "--host", "127.0.0.1", "--port", "$($fe.Port)", "--strictPort") $fe.Dir
        $deadline = (Get-Date).AddSeconds(40)
        do {
            if ($proc.HasExited) { throw "$($fe.Name) exited during startup. See $($fe.Name).err.log in $logsDir." }
            try { $null = Invoke-WebRequest -Uri "http://127.0.0.1:$($fe.Port)/" -TimeoutSec 5 -UseBasicParsing; break } catch { Start-Sleep -Seconds 1 }
        } while ((Get-Date) -lt $deadline)
        if (-not (Test-ListeningPort $fe.Port)) { throw "$($fe.Name) did not open port $($fe.Port). See logs in $logsDir." }
    }

    $owned | ConvertTo-Json | Set-Content -Encoding utf8 $pidFile
    Write-Host "AgriSmart is running:" -ForegroundColor Green
    Write-Host "  Dashboard:      http://localhost:5180"
    Write-Host "  React web app:  http://localhost:5175"
    Write-Host "  FastAPI docs:   http://localhost:8000/docs  ($ApiWorkers workers)"
    Write-Host "  MCP server:     http://localhost:8100/mcp   ($McpWorkers workers)"
    Write-Host "  Express health: http://localhost:4100/health$(if (-not $mongoUp) { '  (MongoDB not running)' })"
    Write-Host "  Logs:           $logsDir"
    Write-Host "  Stop:           .\scripts\stop-dev.ps1"
} catch {
    foreach ($process in $started) { if (-not $process.HasExited) { & taskkill.exe /PID $process.Id /T /F 2>$null | Out-Null } }
    throw
} finally {
    Restore-StackEnvironment
}
