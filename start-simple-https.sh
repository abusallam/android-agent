#!/bin/bash

# Simple HTTPS setup for Android Agent PWA testing
# This method uses Next.js built-in HTTPS support

echo "🚀 Starting Android Agent with Simple HTTPS"
echo "============================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get local IP address
LOCAL_IP=$(hostname -I | awk '{print $1}')
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(ip route get 1 | awk '{print $7; exit}')
fi

echo -e "${BLUE}[INFO]${NC} Your local IP address: ${LOCAL_IP}"

# Create simple self-signed certificate if it doesn't exist
if [ ! -f "ssl/localhost.key" ] || [ ! -f "ssl/localhost.crt" ]; then
    echo -e "${YELLOW}[INFO]${NC} Creating self-signed certificate..."
    
    mkdir -p ssl
    
    # Generate simple self-signed certificate
    openssl req -x509 -newkey rsa:4096 -keyout ssl/localhost.key -out ssl/localhost.crt -days 365 -nodes -subj "/C=US/ST=Dev/L=Local/O=AndroidAgent/CN=localhost"
    
    echo -e "${GREEN}[SUCCESS]${NC} Certificate created!"
fi

echo ""
echo -e "${BLUE}[STARTING SERVER]${NC}"
echo "📱 Access URLs:"
echo "   Local:    https://localhost:3000"
echo "   Network:  https://${LOCAL_IP}:3000"
echo ""
echo -e "${YELLOW}[ANDROID TESTING STEPS]${NC}"
echo "1. Connect your Android device to the same WiFi network"
echo "2. Open Chrome on your Android device"
echo "3. Navigate to: https://${LOCAL_IP}:3000"
echo "4. You'll see a security warning - this is normal for self-signed certificates"
echo "5. Tap 'Advanced' then 'Proceed to ${LOCAL_IP} (unsafe)'"
echo "6. The PWA should load and you can tap 'Setup Mobile App' to install"
echo ""
echo -e "${GREEN}[STARTING...]${NC} Press Ctrl+C to stop"
echo ""

# Start the development server with HTTPS
cd modern-dashboard

# Set environment variables for HTTPS
export HTTPS=true
export SSL_CRT=../ssl/localhost.crt
export SSL_KEY=../ssl/localhost.key

# Start Next.js development server
npm run dev -- --hostname 0.0.0.0 --port 3000