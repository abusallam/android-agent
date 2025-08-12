#!/bin/bash

# 🚀 Android Agent AI - MVP Complete Testing Script
# Tests all major functionality and prepares for production

echo "🎯 Android Agent AI - MVP Complete Testing"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Database Health
echo -e "\n${BLUE}📊 Testing Database Health...${NC}"
cd modern-dashboard
if npm run db:generate > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database schema valid${NC}"
else
    echo -e "${RED}❌ Database schema issues${NC}"
    exit 1
fi

# Test 2: PWA Build
echo -e "\n${BLUE}🌐 Testing PWA Build...${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PWA builds successfully${NC}"
else
    echo -e "${RED}❌ PWA build failed${NC}"
    exit 1
fi

# Test 3: React Native Dependencies
echo -e "\n${BLUE}📱 Testing React Native Setup...${NC}"
cd ../react-native-app
if npm install > /dev/null 2>&1; then
    echo -e "${GREEN}✅ React Native dependencies installed${NC}"
else
    echo -e "${RED}❌ React Native dependency issues${NC}"
    exit 1
fi

# Test 4: TypeScript Compilation
echo -e "\n${BLUE}🔧 Testing TypeScript Compilation...${NC}"
if npm run type-check > /dev/null 2>&1; then
    echo -e "${GREEN}✅ TypeScript compiles without errors${NC}"
else
    echo -e "${RED}❌ TypeScript compilation errors${NC}"
    exit 1
fi

# Test 5: ngrok Configuration
echo -e "\n${BLUE}🌍 Testing ngrok Configuration...${NC}"
if ngrok config check > /dev/null 2>&1; then
    echo -e "${GREEN}✅ ngrok configured correctly${NC}"
else
    echo -e "${RED}❌ ngrok configuration issues${NC}"
fi

# Test 6: API Health Check
echo -e "\n${BLUE}🔍 Testing API Health...${NC}"
cd ../modern-dashboard
npm run dev &
SERVER_PID=$!
sleep 5

if curl -s http://localhost:3000/api/health > /dev/null; then
    echo -e "${GREEN}✅ API server responding${NC}"
else
    echo -e "${RED}❌ API server not responding${NC}"
fi

kill $SERVER_PID 2>/dev/null

echo -e "\n${GREEN}🎉 MVP Testing Complete!${NC}"
echo -e "\n${YELLOW}📋 Next Steps:${NC}"
echo "1. Start PWA: cd modern-dashboard && npm run dev"
echo "2. Start React Native: cd react-native-app && npx expo start"
echo "3. Start ngrok: ./start-ngrok.sh"
echo "4. Test on mobile devices"

echo -e "\n${BLUE}🔗 Access URLs:${NC}"
echo "• PWA Dashboard: http://localhost:3000"
echo "• Admin Panel: http://localhost:3000/admin"
echo "• Login: admin / admin123"