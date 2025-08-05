#!/bin/bash

# Android Agent - Ngrok HTTPS Setup Script
# This script sets up Ngrok for HTTPS testing of PWA and LiveKit features

echo "🚀 Setting up Ngrok for Android Agent HTTPS testing..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ Ngrok is not installed. Please install it first:"
    echo "   Visit: https://ngrok.com/download"
    echo "   Or use: brew install ngrok (on macOS)"
    echo "   Or use: sudo snap install ngrok (on Ubuntu)"
    exit 1
fi

# Kill any existing ngrok processes
pkill -f ngrok || true
sleep 2

# Start ngrok tunnel in background
echo "🌐 Starting Ngrok tunnel for localhost:3000..."
ngrok http 3000 --log=stdout > ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start
echo "⏳ Waiting for Ngrok to initialize..."
sleep 5

# Get the public URL with retries
NGROK_URL=""
for i in {1..10}; do
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o 'https://[^"]*\.ngrok[^"]*\.app' | head -1)
    if [ ! -z "$NGROK_URL" ]; then
        break
    fi
    echo "   Attempt $i/10: Waiting for Ngrok..."
    sleep 2
done

if [ -z "$NGROK_URL" ]; then
    echo "❌ Failed to get Ngrok URL. Please check if Ngrok started correctly."
    echo "   You can manually check at: http://localhost:4040"
    echo "   Or check the log: tail -f ngrok.log"
    exit 1
fi

echo "✅ Ngrok tunnel established!"
echo "🔗 Public HTTPS URL: $NGROK_URL"
echo ""
echo "📱 Mobile Testing Instructions:"
echo "   1. Open $NGROK_URL on your mobile device"
echo "   2. Test PWA installation (Add to Home Screen)"
echo "   3. Test authentication (admin/admin123)"
echo "   4. Test LiveKit video/audio features"
echo "   5. Test geolocation and sensors"
echo ""
echo "🔧 Development URLs:"
echo "   Local:  http://localhost:3000"
echo "   HTTPS:  $NGROK_URL"
echo "   Ngrok:  http://localhost:4040 (tunnel dashboard)"
echo ""
echo "🔑 Login Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "⚠️  Note: Keep this terminal open to maintain the tunnel"
echo "   Press Ctrl+C to stop the tunnel"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping Ngrok tunnel..."
    kill $NGROK_PID 2>/dev/null || true
    pkill -f ngrok || true
    echo "✅ Cleanup complete"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Keep the script running
wait $NGROK_PID