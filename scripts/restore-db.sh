#!/bin/bash

# Stop execution if any command fails
set -e

# Default values
WORKSPACE_DIR="/workspaces/QuestionWritingWebApp"
BACKUPS_DIR="$WORKSPACE_DIR/backups"

# Function to display usage information
show_usage() {
    echo "Usage: ./scripts/restore-db.sh <backup-name>"
    echo "Example: ./scripts/restore-db.sh backup_20250301_123456"
    echo ""
    echo "Available backups:"
    ls -1 "$BACKUPS_DIR"
    exit 1
}

# Check if backup name is provided
if [ -z "$1" ]; then
    echo "Error: Backup name not provided"
    show_usage
fi

BACKUP_NAME="$1"
BACKUP_DIR="$BACKUPS_DIR/$BACKUP_NAME"

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo "Error: Backup directory does not exist: $BACKUP_DIR"
    show_usage
fi

echo "Starting database restore from backup: $BACKUP_NAME"

# Get the MongoDB container ID - handles both docker compose v1 and v2
MONGO_CONTAINER=$(docker compose ps -q mongodb 2>/dev/null || docker-compose ps -q mongodb)

if [ -z "$MONGO_CONTAINER" ]; then
    echo "Error: MongoDB container is not running"
    echo "Please start the database first using: ./scripts/start-debug.sh"
    exit 1
fi

# Database connection settings
MONGO_URI="mongodb://localhost:27017/mcq-writing-app"

# Restore the database using mongorestore
mongorestore --uri="$MONGO_URI" --drop "$BACKUP_DIR"

echo "Database restore completed successfully!"