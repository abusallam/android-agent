#!/bin/bash

echo "🌐 Setting up ngrok for mobile testing..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed. Please install ngrok first:"
    echo "   Visit: https://ngrok.com/download"
    echo "   Or use: brew install ngrok (on macOS)"
    echo "   Or use: sudo snap install ngrok (on Linux)"
    exit 1
fi

# Check if auth token is provided
if [ -z "$NGROK_AUTH_TOKEN" ]; then
    echo "❌ NGROK_AUTH_TOKEN environment variable is required"
    echo ""
    echo "Usage:"
    echo "  NGROK_AUTH_TOKEN='your-token-here' ./setup-ngrok.sh"
    echo ""
    echo "Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken"
    exit 1
fi

echo "🔐 Configuring ngrok with authentication token..."
ngrok config add-authtoken $NGROK_AUTH_TOKEN

echo "🚀 Starting ngrok tunnel for localhost:3000..."
echo ""
echo "📱 Mobile Access Instructions:"
echo "1. Copy the HTTPS URL that ngrok provides"
echo "2. Open that URL on your mobile device"
echo "3. Login with: admin / admin"
echo ""
echo "⚠️  Important: Use the HTTPS URL for PWA features to work on mobile"
echo ""

# Start ngrok tunnel
ngrok http 3000 --log=stdout