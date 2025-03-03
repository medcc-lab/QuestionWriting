#!/bin/bash
set -e

WORKSPACE_DIR="/workspaces/QuestionWritingWebApp"

echo "Starting the MongoDB server..."
docker compose up -d mongodb
sleep 5  # Give MongoDB time to start up

echo "Starting the backend server..."
docker compose up -d backend

echo "Starting the frontend server..."
docker compose up -d frontend


echo "Waiting for servers to be ready..."
sleep 5

# Check if backend is running
if curl -s http://localhost:5000/api/users/profile > /dev/null; then
    echo "Backend server is running (http://localhost:5000/api)"
else
    echo "Warning: Backend server is not responding"
fi

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "Frontend server is running (http://localhost:3000)"
else
    echo "Warning: Frontend server is not responding"
fi

echo "Development environment is ready!"
echo "Use ./scripts/stop-debug.sh to stop the servers"