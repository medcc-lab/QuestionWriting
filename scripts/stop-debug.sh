#!/bin/bash

# Store the workspace root directory
WORKSPACE_DIR="/workspaces/QuestionWritingWebApp"
cd $WORKSPACE_DIR

echo "Stopping debug environment..."

# Stop MongoDB container - handle both docker compose v1 and v2
echo "Stopping MongoDB..."
if command -v docker compose &> /dev/null; then
    docker compose down
else
    docker-compose down
fi

# Stop backend process if running
if [ -f $WORKSPACE_DIR/.backend.pid ]; then
    echo "Stopping backend server..."
    PID=$(cat $WORKSPACE_DIR/.backend.pid)
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID
        echo "Backend server stopped"
    else
        echo "Backend server was not running"
    fi
    rm $WORKSPACE_DIR/.backend.pid
fi

# Stop frontend process if running
if [ -f $WORKSPACE_DIR/.frontend.pid ]; then
    echo "Stopping frontend server..."
    PID=$(cat $WORKSPACE_DIR/.frontend.pid)
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID
        echo "Frontend server stopped"
    else
        echo "Frontend server was not running"
    fi
    rm $WORKSPACE_DIR/.frontend.pid
fi

# Kill any remaining node processes (fallback)
echo "Cleaning up any remaining processes..."
pkill -f "node.*src/server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

echo "Debug environment stopped!"