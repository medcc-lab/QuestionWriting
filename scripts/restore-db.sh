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
    echo "Environment variables:"
    echo "  MONGODB_URI  Override the MongoDB connection URI"
    echo "  MONGODB_HOST Override the MongoDB host (default: localhost)"
    echo ""
    echo "Available backups:"
    if [ -d "$BACKUPS_DIR" ]; then
        echo "Regular backups:"
        find "$BACKUPS_DIR" -maxdepth 1 -type d -name "backup_*" -printf "  %f\n" 2>/dev/null
        echo "Demo data backups:"
        find "$BACKUPS_DIR" -maxdepth 1 -type d -name "demo-data_*" -printf "  %f\n" 2>/dev/null
    else
        echo "No backups found"
    fi
    exit 1
}

# Check if mongorestore is available
if ! command -v mongorestore &> /dev/null; then
    echo "Error: mongorestore command not found"
    echo "Please install MongoDB Database Tools"
    exit 1
fi

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

# Check if backup directory contains required files
if [ ! -d "$BACKUP_DIR/mcq-writing-app" ]; then
    echo "Error: Invalid backup directory structure"
    echo "Missing mcq-writing-app directory in backup"
    exit 1
fi

echo "Starting database restore from backup: $BACKUP_NAME"

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

# Check if backup has stored URI and warn if different
if [ -f "$BACKUP_DIR/backup_info.json" ]; then
    BACKUP_URI=$(grep -o '"uri": *"[^"]*"' "$BACKUP_DIR/backup_info.json" | cut -d'"' -f4)
    if [ -n "$BACKUP_URI" ] && [ "$BACKUP_URI" != "$MONGO_URI" ]; then
        echo "Warning: Current MongoDB URI ($MONGO_URI) differs from backup URI ($BACKUP_URI)"
        echo "This might cause issues if the environments are not compatible"
        echo "Press Ctrl+C to abort or wait 5 seconds to continue..."
        sleep 5
    fi
fi

# Restore the database using mongorestore
echo "Using MongoDB URI: $MONGO_URI"
if mongorestore --uri="$MONGO_URI" --drop "$BACKUP_DIR" 2>/dev/null; then
    echo "Database restore completed successfully!"
    
    # Show backup info if available
    if [ -f "$BACKUP_DIR/backup_info.json" ]; then
        echo -e "\nBackup Information:"
        cat "$BACKUP_DIR/backup_info.json"
    fi
else
    echo "Error: Database restore failed"
    exit 1
fi