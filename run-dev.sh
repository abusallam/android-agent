#!/bin/bash

# 🚀 Android Agent - Development Environment
# This script starts the development environment with UV integration

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🛡️ Android Agent - Development Environment${NC}"
echo "=============================================="
echo ""

# Check if UV is available
if command -v uv &> /dev/null; then
    echo -e "${BLUE}📦 UV package manager found${NC}"
    
    # Activate UV environment if it exists
    if [ -d ".venv" ]; then
        echo -e "${BLUE}🔧 Activating UV virtual environment...${NC}"
        source .venv/bin/activate
    else
        echo -e "${YELLOW}⚠️  No UV virtual environment found${NC}"
        echo -e "${YELLOW}   Run: uv venv && source .venv/bin/activate${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  UV package manager not found${NC}"
    echo -e "${YELLOW}   Install with: curl -LsSf https://astral.sh/uv/install.sh | sh${NC}"
fi

echo ""
echo -e "${GREEN}🌐 Starting Next.js development server...${NC}"
echo ""

# Change to the modern-dashboard directory
cd modern-dashboard

# Start the development server
DATABASE_URL="file:./dev.db" npm run dev