#!/bin/bash
# ARCE Development Server Startup Script
# Starts both the FastAPI backend and the frontend dev server

echo "🚀 Starting ARCE Development Servers..."
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.8+."
    exit 1
fi

# Check if bun is available
if ! command -v bun &> /dev/null; then
    echo "❌ Bun not found. Please install Bun: https://bun.sh"
    exit 1
fi

# Install backend dependencies if needed
echo "📦 Checking backend dependencies..."
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "Installing backend requirements..."
pip install -q -r arce/requirements-api.txt

# Check if frontend dependencies are installed
echo "📦 Checking frontend dependencies..."
if [ ! -d "Frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd Frontend
    bun install
    cd ..
fi

# Create runs directory if it doesn't exist
if [ ! -d "runs" ]; then
    echo "Creating runs directory..."
    mkdir -p runs
    touch runs/.gitkeep
fi

echo ""
echo "✅ All dependencies ready!"
echo ""
echo "Starting servers..."
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to cleanup on exit
trap cleanup INT TERM

# Start backend in background
python arce/api_server.py &
BACKEND_PID=$!
echo "🟢 Backend started (PID: $BACKEND_PID)"

# Wait a moment for backend to start
sleep 2

# Start frontend in background
cd Frontend
bun dev &
FRONTEND_PID=$!
cd ..
echo "🟢 Frontend started (PID: $FRONTEND_PID)"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

# Made with Bob
