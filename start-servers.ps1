# ARCE Development Server Startup Script
# Starts both the FastAPI backend and the frontend dev server

Write-Host "🚀 Starting ARCE Development Servers..." -ForegroundColor Cyan
Write-Host ""

# Check if Python is available
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python not found. Please install Python 3.8+." -ForegroundColor Red
    exit 1
}

# Check if bun is available
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Bun not found. Please install Bun: https://bun.sh" -ForegroundColor Red
    exit 1
}

# Install backend dependencies if needed
Write-Host "📦 Checking backend dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Install requirements
Write-Host "Installing backend requirements..." -ForegroundColor Yellow
pip install -q -r arce/requirements-api.txt

# Check if frontend dependencies are installed
Write-Host "📦 Checking frontend dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "Frontend/node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location Frontend
    bun install
    Pop-Location
}

# Create runs directory if it doesn't exist
if (-not (Test-Path "runs")) {
    Write-Host "Creating runs directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "runs" | Out-Null
    New-Item -ItemType File -Path "runs/.gitkeep" | Out-Null
}

Write-Host ""
Write-Host "✅ All dependencies ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

# Start backend in background
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    & ".\venv\Scripts\Activate.ps1"
    python arce/api_server.py
}

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start frontend in background
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD/Frontend
    bun dev
}

# Monitor both jobs
Write-Host "🟢 Backend started (Job ID: $($backendJob.Id))" -ForegroundColor Green
Write-Host "🟢 Frontend started (Job ID: $($frontendJob.Id))" -ForegroundColor Green
Write-Host ""

try {
    # Keep script running and show output
    while ($true) {
        # Check if jobs are still running
        if ($backendJob.State -ne "Running") {
            Write-Host "❌ Backend stopped unexpectedly" -ForegroundColor Red
            break
        }
        if ($frontendJob.State -ne "Running") {
            Write-Host "❌ Frontend stopped unexpectedly" -ForegroundColor Red
            break
        }
        
        # Show any output
        Receive-Job -Job $backendJob -ErrorAction SilentlyContinue | ForEach-Object {
            Write-Host "[Backend] $_" -ForegroundColor Blue
        }
        Receive-Job -Job $frontendJob -ErrorAction SilentlyContinue | ForEach-Object {
            Write-Host "[Frontend] $_" -ForegroundColor Magenta
        }
        
        Start-Sleep -Seconds 1
    }
}
finally {
    # Cleanup on exit
    Write-Host ""
    Write-Host "🛑 Stopping servers..." -ForegroundColor Yellow
    Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job -Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $frontendJob -ErrorAction SilentlyContinue
    Write-Host "✅ Servers stopped" -ForegroundColor Green
}

# Made with Bob
