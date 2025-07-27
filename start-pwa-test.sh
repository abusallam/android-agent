#!/bin/bash

# Android Agent PWA Testing Script
# Starts both Next.js server and HTTPS proxy for Android testing

echo "🚀 Starting Android Agent PWA for Testing"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping servers...${NC}"
    kill $NEXTJS_PID 2>/dev/null
    kill $PROXY_PID 2>/dev/null
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Check if certificates exist
if [ ! -f "ssl/localhost.crt" ] || [ ! -f "ssl/localhost.key" ]; then
    echo -e "${YELLOW}⚠️  SSL certificates not found. Creating them...${NC}"
    mkdir -p ssl
    openssl req -x509 -newkey rsa:4096 -keyout ssl/localhost.key -out ssl/localhost.crt -days 365 -nodes -subj "/C=US/ST=Dev/L=Local/O=AndroidAgent/CN=localhost"
    echo -e "${GREEN}✅ SSL certificates created!${NC}"
fi

# Get local IP
LOCAL_IP=$(hostname -I | awk '{print $1}')
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(ip route get 1 | awk '{print $7; exit}')
fi

echo -e "${BLUE}[INFO]${NC} Your local IP address: ${LOCAL_IP}"

# Start Next.js development server in background
echo -e "${BLUE}[INFO]${NC} Starting Next.js development server..."
cd modern-dashboard
npm run dev -- --port 3000 > ../nextjs.log 2>&1 &
NEXTJS_PID=$!
cd ..

# Wait for Next.js to start
echo -e "${YELLOW}[INFO]${NC} Waiting for Next.js to start..."
sleep 5

# Check if Next.js started successfully
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${YELLOW}[INFO]${NC} Next.js still starting, waiting a bit more..."
    sleep 5
fi

# Start HTTPS proxy
echo -e "${BLUE}[INFO]${NC} Starting HTTPS proxy..."
node start-https-proxy.js &
PROXY_PID=$!

# Wait for proxy to start
sleep 2

echo ""
echo -e "${GREEN}🎉 Both servers are running!${NC}"
echo ""
echo -e "${BLUE}📱 Testing URLs:${NC}"
echo -e "   Local HTTPS:  https://localhost:3001"
echo -e "   Network HTTPS: https://${LOCAL_IP}:3001"
echo -e "   Local HTTP:   http://localhost:3000 (for debugging)"
echo ""
echo -e "${YELLOW}📋 Android Testing Steps:${NC}"
echo "1. Connect your Android device to the same WiFi network"
echo "2. Open Chrome on your Android device"
echo "3. Navigate to: https://${LOCAL_IP}:3001"
echo "4. Accept the security warning (tap Advanced → Proceed)"
echo "5. Test the PWA and tap 'Setup Mobile App' to install"
echo ""
echo -e "${GREEN}✅ Ready for testing! Press Ctrl+C to stop both servers${NC}"
echo ""

# Keep script running
wait