#!/bin/bash
# ARCE Development Server Startup Script
# Starts both the FastAPI backend and the frontend dev server

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Starting ARCE Development Servers..."
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.10+."
    exit 1
fi

# Check package manager
PKG_MANAGER=""
if command -v bun &> /dev/null; then
    PKG_MANAGER="bun"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
else
    echo "❌ Neither Bun nor npm found. Please install Bun (https://bun.sh) or Node.js 18+."
    exit 1
fi
echo "  Using package manager: $PKG_MANAGER"

# Setup virtual environment
echo "📦 Checking backend dependencies..."
if [ ! -d "$PROJECT_ROOT/venv" ]; then
    echo "  Creating virtual environment..."
    python3 -m venv "$PROJECT_ROOT/venv"
fi

VENV_PYTHON="$PROJECT_ROOT/venv/bin/python"
if [ ! -f "$VENV_PYTHON" ]; then
    echo "❌ Virtual environment broken. Delete 'venv/' and re-run this script."
    exit 1
fi

# Install backend requirements
echo "  Installing backend requirements..."
"$VENV_PYTHON" -m pip install -q -r "$PROJECT_ROOT/arce/requirements-api.txt"

# Install frontend dependencies
echo "📦 Checking frontend dependencies..."
if [ ! -d "$PROJECT_ROOT/Frontend/node_modules" ]; then
    echo "  Installing frontend dependencies (this may take a minute)..."
    cd "$PROJECT_ROOT/Frontend"
    $PKG_MANAGER install
    cd "$PROJECT_ROOT"
fi

# Ensure .env.local exists
if [ ! -f "$PROJECT_ROOT/Frontend/.env.local" ]; then
    echo "  Creating Frontend/.env.local..."
    echo "VITE_API_BASE_URL=http://localhost:8000" > "$PROJECT_ROOT/Frontend/.env.local"
fi

# Create runs directory
mkdir -p "$PROJECT_ROOT/runs"

echo ""
echo "✅ All dependencies ready!"
echo ""
echo "Starting servers..."
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}
trap cleanup INT TERM

# Start backend
"$VENV_PYTHON" "$PROJECT_ROOT/arce/api_server.py" &
BACKEND_PID=$!
echo "🟢 Backend started (PID: $BACKEND_PID)"

sleep 2

# Start frontend
cd "$PROJECT_ROOT/Frontend"
$PKG_MANAGER run dev &
FRONTEND_PID=$!
cd "$PROJECT_ROOT"
echo "🟢 Frontend started (PID: $FRONTEND_PID)"
echo ""

# Wait for either to exit
wait -n $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
echo "⚠️  A server exited unexpectedly."
cleanup
