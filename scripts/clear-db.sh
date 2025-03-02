#!/bin/bash

WORKSPACE_DIR="/workspaces/QuestionWritingWebApp"

# Function to display usage information
show_usage() {
    echo "Usage: ./scripts/clear-db.sh [--keep-users]"
    echo "  --keep-users    Optional: Keep user accounts when clearing the database"
    exit 1
}

# Parse command line arguments
KEEP_USERS=false
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --keep-users) KEEP_USERS=true ;;
        -h|--help) show_usage ;;
        *) echo "Unknown parameter: $1"; show_usage ;;
    esac
    shift
done

echo "Starting database clear operation..."

# Get the MongoDB container ID - handles both docker compose v1 and v2
MONGO_CONTAINER=$(docker compose ps -q mongodb 2>/dev/null || docker-compose ps -q mongodb)

if [ -z "$MONGO_CONTAINER" ]; then
    echo "Error: MongoDB container is not running"
    echo "Please start the database first using: ./scripts/start-debug.sh"
    exit 1
fi

# Stop execution if any command fails
set -e

# Database connection settings
MONGO_URI="mongodb://localhost:27017/mcq-writing-app"

if [ "$KEEP_USERS" = true ]; then
    echo "Clearing database (keeping user accounts)..."
    mongosh --quiet "$MONGO_URI" <<EOF
        db.questions.deleteMany({});
        db.lectures.deleteMany({});
        db.scoringconfigs.deleteMany({});
        print("Collections cleared (kept users)");
EOF
else
    echo "Clearing entire database..."
    mongosh --quiet "$MONGO_URI" <<EOF
        db.users.deleteMany({});
        db.questions.deleteMany({});
        db.lectures.deleteMany({});
        db.scoringconfigs.deleteMany({});
        print("All collections cleared");
EOF
fi

echo "Database clear operation completed successfully!"
if [ "$KEEP_USERS" = true ]; then
    echo "User accounts have been preserved."
else
    echo "All data has been cleared."
fi