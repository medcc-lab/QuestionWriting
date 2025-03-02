#!/bin/bash

# Stop execution if any command fails
set -e

# Get current timestamp for backup name
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_NAME=${1:-"backup_$TIMESTAMP"}
WORKSPACE_DIR="/workspaces/QuestionWritingWebApp"
BACKUPS_DIR="$WORKSPACE_DIR/backups"

# Create backups directory if it doesn't exist
mkdir -p "$BACKUPS_DIR"

echo "Starting database backup..."

# Get the MongoDB container ID - handles both docker compose v1 and v2
MONGO_CONTAINER=$(docker compose ps -q mongodb 2>/dev/null || docker-compose ps -q mongodb)

if [ -z "$MONGO_CONTAINER" ]; then
    echo "Error: MongoDB container is not running"
    echo "Please start the database first using: ./scripts/start-debug.sh"
    exit 1
fi

# Create backup directory
BACKUP_DIR="$BACKUPS_DIR/$BACKUP_NAME"
mkdir -p "$BACKUP_DIR"

# Database connection settings
MONGO_URI="mongodb://localhost:27017/mcq-writing-app"

# Perform backup using mongodump
mongodump --uri="$MONGO_URI" --out="$BACKUP_DIR"

echo "Backup completed successfully!"
echo "Backup location: $BACKUP_DIR"