#!/bin/bash

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Set absolute paths
VENV_DIR="$SCRIPT_DIR/venv"
PYTHON="$VENV_DIR/bin/python"
PIP="$VENV_DIR/bin/pip"

# Create venv if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
  python3 -m venv "$VENV_DIR"
fi

# Install required packages
$PIP install --upgrade pip  # optional but good practice
$PIP install pytz python-dotenv supabase youtube_dl google-api-python-client schedule

# Run the scraper
$PYTHON -u "$SCRIPT_DIR/scraper.py"

