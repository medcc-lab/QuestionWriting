#!/bin/bash

# Execute the Python implementation
python3 $(dirname "$0")/collect-stats.py

# Check if the Python script executed successfully
if [ $? -ne 0 ]; then
    echo "Error: Failed to run the Python statistics collector"
    exit 1
fi