#!/bin/bash

# 24AI Desktop Agent Installer
# This script will install and run the 24AI desktop agent

echo "====================================="
echo "  24AI Desktop Agent Installer"
echo "====================================="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed!"
    echo "Please install Python 3 from: https://www.python.org/downloads/"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

echo "✅ Python 3 found"
echo ""

# Create a virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi
echo ""

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate
echo ""

# Download the agent files if they don't exist
if [ ! -f "agent.py" ]; then
    echo "📥 Downloading agent files..."
    curl -o agent.py https://raw.githubusercontent.com/samuel4121987-afk/24ai-frontend/main/desktop-agent/agent.py
    curl -o requirements.txt https://raw.githubusercontent.com/samuel4121987-afk/24ai-frontend/main/desktop-agent/requirements.txt
    echo "✅ Files downloaded"
else
    echo "✅ Agent files already exist"
fi
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt
echo "✅ Dependencies installed"
echo ""

# Prompt for access code
echo "====================================="
echo "Please enter your access code:"
read -p "Access Code: " ACCESS_CODE
echo ""

# Run the agent
echo "🚀 Starting 24AI Desktop Agent..."
echo "====================================="
echo ""
python3 agent.py "$ACCESS_CODE"

# Keep terminal open if there's an error
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Agent stopped with an error"
    read -p "Press Enter to exit..."
fi
