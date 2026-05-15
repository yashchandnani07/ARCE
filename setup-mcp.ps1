# ARCE MCP Setup Script for Windows
# This script automates the setup of the ARCE MCP server for Bob IDE

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ARCE MCP Server Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        if (Get-Command $Command -ErrorAction Stop) {
            return $true
        }
    }
    catch {
        return $false
    }
}

# Step 1: Check Python installation
Write-Host "[1/6] Checking Python installation..." -ForegroundColor Yellow
if (-not (Test-Command "python")) {
    Write-Host "ERROR: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8 or higher from https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}

$pythonVersion = python --version 2>&1
Write-Host "  Found: $pythonVersion" -ForegroundColor Green

# Check Python version (must be 3.8+)
$versionMatch = $pythonVersion -match "Python (\d+)\.(\d+)"
if ($versionMatch) {
    $major = [int]$Matches[1]
    $minor = [int]$Matches[2]
    if ($major -lt 3 -or ($major -eq 3 -and $minor -lt 8)) {
        Write-Host "ERROR: Python 3.8 or higher is required (found $major.$minor)" -ForegroundColor Red
        exit 1
    }
}

# Step 2: Create virtual environment
Write-Host ""
Write-Host "[2/6] Creating virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "  Virtual environment already exists, skipping creation" -ForegroundColor Cyan
} else {
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
    Write-Host "  Virtual environment created successfully" -ForegroundColor Green
}

# Step 3: Activate virtual environment
Write-Host ""
Write-Host "[3/6] Activating virtual environment..." -ForegroundColor Yellow
$activateScript = ".\venv\Scripts\Activate.ps1"
if (-not (Test-Path $activateScript)) {
    Write-Host "ERROR: Activation script not found at $activateScript" -ForegroundColor Red
    exit 1
}

# Check if execution policy allows running scripts
$executionPolicy = Get-ExecutionPolicy
if ($executionPolicy -eq "Restricted") {
    Write-Host "  WARNING: PowerShell execution policy is Restricted" -ForegroundColor Yellow
    Write-Host "  Run this command in an admin PowerShell to allow scripts:" -ForegroundColor Yellow
    Write-Host "  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Attempting to bypass for this session..." -ForegroundColor Yellow
    Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
}

& $activateScript
Write-Host "  Virtual environment activated" -ForegroundColor Green

# Step 4: Upgrade pip
Write-Host ""
Write-Host "[4/6] Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Failed to upgrade pip, continuing anyway..." -ForegroundColor Yellow
} else {
    Write-Host "  pip upgraded successfully" -ForegroundColor Green
}

# Step 5: Install dependencies
Write-Host ""
Write-Host "[5/6] Installing MCP server dependencies..." -ForegroundColor Yellow
Write-Host "  This may take a few minutes..." -ForegroundColor Cyan

$dependencies = @(
    "fastmcp",
    "pytest",
    "pip-audit",
    "flask",
    "pyyaml",
    "streamlit"
)

$failedPackages = @()
foreach ($package in $dependencies) {
    Write-Host "  Installing $package..." -ForegroundColor Cyan
    python -m pip install $package --quiet
    if ($LASTEXITCODE -ne 0) {
        $failedPackages += $package
        Write-Host "    FAILED: $package" -ForegroundColor Red
    } else {
        Write-Host "    OK: $package" -ForegroundColor Green
    }
}

if ($failedPackages.Count -gt 0) {
    Write-Host ""
    Write-Host "ERROR: Failed to install the following packages:" -ForegroundColor Red
    foreach ($pkg in $failedPackages) {
        Write-Host "  - $pkg" -ForegroundColor Red
    }
    exit 1
}

# Step 6: Validate installation
Write-Host ""
Write-Host "[6/6] Validating installation..." -ForegroundColor Yellow

# Check if fastmcp is importable
$validateScript = @"
import sys
try:
    import fastmcp
    import pytest
    import flask
    import yaml
    print('OK')
except ImportError as e:
    print(f'ERROR: {e}')
    sys.exit(1)
"@

$result = python -c $validateScript
if ($result -eq "OK") {
    Write-Host "  All dependencies validated successfully" -ForegroundColor Green
} else {
    Write-Host "ERROR: Dependency validation failed" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    exit 1
}

# Success message
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure Bob IDE with the MCP server" -ForegroundColor White
Write-Host "   - Copy mcp-config-template.json content" -ForegroundColor White
Write-Host "   - Add to Bob IDE settings (see README.md)" -ForegroundColor White
Write-Host ""
Write-Host "2. Test the MCP server:" -ForegroundColor White
Write-Host "   python arce/mcp_server.py" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Run the demo app:" -ForegroundColor White
Write-Host "   cd demo-app" -ForegroundColor Cyan
Write-Host "   python app.py" -ForegroundColor Cyan
Write-Host ""
Write-Host "For detailed instructions, see the 'MCP Setup' section in README.md" -ForegroundColor Yellow
Write-Host ""

# Display installed versions
Write-Host "Installed versions:" -ForegroundColor Cyan
python -c "import fastmcp; print(f'  fastmcp: {fastmcp.__version__}')"
python -c "import pytest; print(f'  pytest: {pytest.__version__}')"
python -c "import flask; print(f'  flask: {flask.__version__}')"
python -c "import yaml; print(f'  pyyaml: {yaml.__version__}')"
Write-Host ""

# Made with Bob
