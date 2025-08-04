#!/bin/bash

# 🚀 Android Agent - Production Environment
# This script starts the production environment

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🛡️ Android Agent - Production Environment${NC}"
echo "=============================================="
echo ""

# Change to the modern-dashboard directory
cd modern-dashboard

# Check if build exists
if [ ! -d ".next" ]; then
    echo -e "${YELLOW}🏗️ No build found, building application...${NC}"
    npm run build
    echo ""
fi

echo -e "${GREEN}🌐 Starting production server...${NC}"
echo ""
echo -e "${BLUE}📍 Access URLs:${NC}"
echo "   PC: http://localhost:3000"
echo "   Network: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo -e "${BLUE}🔑 Login Credentials:${NC}"
echo "   Username: admin"
echo "   Password: admin"
echo ""
echo -e "${BLUE}🔧 Management:${NC}"
echo "   Health: http://localhost:3000/api/health"
echo "   Database: npm run db:studio (in another terminal)"
echo ""

# Start the production server
DATABASE_URL="file:./dev.db" npm start