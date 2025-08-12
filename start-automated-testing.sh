#!/bin/bash

# 🎭 Android Agent AI - Automated Testing Startup Script
# This script starts the server and runs comprehensive automated tests

echo "🚀 Starting Android Agent AI Automated Testing Suite"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up processes...${NC}"
    pkill -f "npm run dev" 2>/dev/null
    pkill -f "node test-dashboard-automated.js" 2>/dev/null
    exit 0
}

# Set up cleanup trap
trap cleanup SIGINT SIGTERM

# Step 1: Start the development server
echo -e "\n${BLUE}📡 Starting development server...${NC}"
cd modern-dashboard
npm run dev &
SERVER_PID=$!

# Wait for server to start
echo -e "${YELLOW}⏳ Waiting for server to start...${NC}"
sleep 10

# Check if server is running
if curl -s http://localhost:3002/api/health > /dev/null; then
    echo -e "${GREEN}✅ Server is running on http://localhost:3002${NC}"
else
    echo -e "${RED}❌ Server failed to start${NC}"
    exit 1
fi

# Step 2: Run database setup
echo -e "\n${BLUE}🗄️ Setting up database...${NC}"
npm run db:setup

# Step 3: Install Playwright dependencies
echo -e "\n${BLUE}🎭 Installing Playwright dependencies...${NC}"
cd ..
npm install playwright

# Step 4: Run automated tests
echo -e "\n${BLUE}🧪 Running automated tests...${NC}"
node test-dashboard-automated.js

# Step 5: Display results
echo -e "\n${GREEN}🎉 Testing completed!${NC}"
echo -e "\n${YELLOW}📋 Test Results:${NC}"
echo "• HTML Report: test-report.html"
echo "• JSON Results: test-results.json"
echo "• Screenshots: screenshots/ directory"

echo -e "\n${BLUE}🌐 Access URLs:${NC}"
echo "• Dashboard: http://localhost:3002"
echo "• Mobile: http://10.76.195.206:3002"
echo "• Login: admin / admin123"

echo -e "\n${YELLOW}Press Ctrl+C to stop the server and exit${NC}"

# Keep server running
wait $SERVER_PID