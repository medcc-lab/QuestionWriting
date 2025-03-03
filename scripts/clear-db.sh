#!/bin/bash
# Stop execution if any command fails
set -e

# Default values
WORKSPACE_DIR="/workspaces/QuestionWritingWebApp"
KEEP_USERS=false
KEEP_SCORING=false

# Function to display usage information
show_usage() {
    echo "Usage: ./scripts/clear-db.sh [options]"
    echo "Options:"
    echo "  --keep-users     Keep user accounts when clearing the database"
    echo "  --keep-scoring   Keep scoring configuration when clearing the database"
    echo "  -h, --help      Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  MONGODB_URI  Override the MongoDB connection URI"
    echo "  MONGODB_HOST Override the MongoDB host (default: localhost)"
    exit 1
}

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --keep-users) KEEP_USERS=true ;;
        --keep-scoring) KEEP_SCORING=true ;;
        -h|--help) show_usage ;;
        *) echo "Unknown parameter: $1"; show_usage ;;
    esac
    shift
done

echo "Starting database clear operation..."

# Check if mongosh is available
if ! command -v mongosh &> /dev/null; then
    echo "Error: mongosh command not found"
    echo "Please install MongoDB Shell"
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

echo "Using MongoDB URI: $MONGO_URI"

# Prepare MongoDB commands based on options
COMMANDS=""
if [ "$KEEP_USERS" = true ] && [ "$KEEP_SCORING" = true ]; then
    echo "Clearing database (keeping user accounts and scoring config)..."
    COMMANDS="db.questions.deleteMany({}); db.lectures.deleteMany({});"
elif [ "$KEEP_USERS" = true ]; then
    echo "Clearing database (keeping user accounts)..."
    COMMANDS="db.questions.deleteMany({}); db.lectures.deleteMany({}); db.scoringconfigs.deleteMany({});"
elif [ "$KEEP_SCORING" = true ]; then
    echo "Clearing database (keeping scoring config)..."
    COMMANDS="db.users.deleteMany({}); db.questions.deleteMany({}); db.lectures.deleteMany({});"
else
    echo "Clearing entire database..."
    COMMANDS="db.users.deleteMany({}); db.questions.deleteMany({}); db.lectures.deleteMany({}); db.scoringconfigs.deleteMany({});"
fi

# Execute MongoDB commands
if echo "$COMMANDS print('Collections cleared');" | mongosh --quiet "$MONGO_URI"; then
    echo "Database clear operation completed successfully!"
    if [ "$KEEP_USERS" = true ]; then
        echo "User accounts have been preserved."
    fi
    if [ "$KEEP_SCORING" = true ]; then
        echo "Scoring configuration has been preserved."
    fi
else
    echo "Error: Database clear operation failed"
    exit 1
fi