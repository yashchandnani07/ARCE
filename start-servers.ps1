# ARCE Development Server Startup Script
# Starts both the FastAPI backend and the frontend dev server

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host "🚀 Starting ARCE Development Servers..." -ForegroundColor Cyan
Write-Host ""

# Check if Python is available
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python not found. Please install Python 3.10+." -ForegroundColor Red
    exit 1
}

# Check if bun is available
$hasBun = Get-Command bun -ErrorAction SilentlyContinue
$hasNpm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $hasBun -and -not $hasNpm) {
    Write-Host "❌ Neither Bun nor npm found. Please install Bun (https://bun.sh) or Node.js 18+." -ForegroundColor Red
    exit 1
}
$pkgManager = if ($hasBun) { "bun" } else { "npm" }
Write-Host "  Using package manager: $pkgManager" -ForegroundColor Gray

# Install backend dependencies if needed
Write-Host "📦 Checking backend dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "$ProjectRoot\venv")) {
    Write-Host "  Creating virtual environment..." -ForegroundColor Yellow
    python -m venv "$ProjectRoot\venv"
}

$venvPython = "$ProjectRoot\venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    Write-Host "❌ Virtual environment broken. Delete 'venv/' and re-run this script." -ForegroundColor Red
    exit 1
}

# Install backend requirements
Write-Host "  Installing backend requirements..." -ForegroundColor Yellow
& $venvPython -m pip install -q -r "$ProjectRoot\arce\requirements-api.txt"

# Check if frontend dependencies are installed
Write-Host "📦 Checking frontend dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "$ProjectRoot\Frontend\node_modules")) {
    Write-Host "  Installing frontend dependencies (this may take a minute)..." -ForegroundColor Yellow
    Push-Location "$ProjectRoot\Frontend"
    & $pkgManager install
    Pop-Location
}

# Ensure .env.local exists for frontend-backend connection
if (-not (Test-Path "$ProjectRoot\Frontend\.env.local")) {
    Write-Host "  Creating Frontend/.env.local..." -ForegroundColor Yellow
    Set-Content -Path "$ProjectRoot\Frontend\.env.local" -Value "VITE_API_BASE_URL=http://localhost:8000"
}

# Create runs directory if it doesn't exist
if (-not (Test-Path "$ProjectRoot\runs")) {
    New-Item -ItemType Directory -Path "$ProjectRoot\runs" -Force | Out-Null
}

Write-Host ""
Write-Host "✅ All dependencies ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""

# Start backend as a separate process
$backendProc = Start-Process -FilePath $venvPython `
    -ArgumentList "arce/api_server.py" `
    -WorkingDirectory $ProjectRoot `
    -PassThru -NoNewWindow

Start-Sleep -Seconds 2

# Start frontend as a separate process
$frontendArgs = if ($pkgManager -eq "bun") { "dev" } else { "run dev" }
$frontendProc = Start-Process -FilePath $pkgManager `
    -ArgumentList $frontendArgs `
    -WorkingDirectory "$ProjectRoot\Frontend" `
    -PassThru -NoNewWindow

Write-Host ""
Write-Host "🟢 Backend started  (PID: $($backendProc.Id))" -ForegroundColor Green
Write-Host "🟢 Frontend started (PID: $($frontendProc.Id))" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

try {
    while ($true) {
        if ($backendProc.HasExited) {
            Write-Host "❌ Backend stopped (exit code: $($backendProc.ExitCode))" -ForegroundColor Red
            break
        }
        if ($frontendProc.HasExited) {
            Write-Host "❌ Frontend stopped (exit code: $($frontendProc.ExitCode))" -ForegroundColor Red
            break
        }
        Start-Sleep -Seconds 2
    }
}
finally {
    Write-Host ""
    Write-Host "🛑 Stopping servers..." -ForegroundColor Yellow
    if (-not $backendProc.HasExited) { Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue }
    if (-not $frontendProc.HasExited) { Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue }
    Write-Host "✅ Servers stopped" -ForegroundColor Green
}
