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

# Check if mongodump is available
if ! command -v mongodump &> /dev/null; then
    echo "Error: mongodump command not found"
    echo "Please install MongoDB Database Tools"
    exit 1
fi

# Try to detect MongoDB connection settings
if [ -n "$MONGODB_URI" ]; then
    # Use explicitly provided URI
    MONGO_URI="$MONGODB_URI"
elif [ -n "$MONGODB_HOST" ]; then
    # Use host if provided
    MONGO_URI="mongodb://${MONGODB_HOST}:27017/mcq-writing-app"
else
    # Default to localhost unless we're in a real container (not devcontainer)
    if [ -f /.dockerenv ] && [ ! -f /usr/local/share/docker-init.sh ]; then
        echo "Running inside container (not devcontainer), using container network..."
        MONGO_URI="mongodb://mongodb:27017/mcq-writing-app"
    else
        MONGO_URI="mongodb://localhost:27017/mcq-writing-app"
    fi
fi

# Create backup directory
BACKUP_DIR="$BACKUPS_DIR/$BACKUP_NAME"
mkdir -p "$BACKUP_DIR"

# Perform backup using mongodump
echo "Using MongoDB URI: $MONGO_URI"
if mongodump --uri="$MONGO_URI" --out="$BACKUP_DIR" 2>/dev/null; then
    echo "Backup completed successfully!"
    echo "Backup location: $BACKUP_DIR"
    
    # Create backup info file
    cat > "$BACKUP_DIR/backup_info.json" << EOF
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "name": "$BACKUP_NAME",
    "type": "$(if [[ $BACKUP_NAME == demo* ]]; then echo "demo"; else echo "regular"; fi)",
    "uri": "$MONGO_URI"
}
EOF
    
    # List backup contents
    echo -e "\nBackup contents:"
    ls -lh "$BACKUP_DIR"
else
    echo "Error: Backup failed"
    rm -rf "$BACKUP_DIR"
    exit 1
fi