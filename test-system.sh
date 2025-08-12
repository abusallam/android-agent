#!/bin/bash
echo "🧪 Testing Android Agent System..."
echo ""

# Test PWA health
echo "Testing PWA health..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ PWA is running and healthy"
else
    echo "❌ PWA is not running. Start it with: ./start-pwa.sh"
fi

# Test ngrok tunnel
echo "Testing ngrok tunnel..."
if curl -s http://localhost:4040/api/tunnels > /dev/null; then
    echo "✅ ngrok tunnel is active"
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok\.io' | head -1)
    if [ ! -z "$NGROK_URL" ]; then
        echo "🌐 External URL: $NGROK_URL"
        echo "🔧 Admin Panel: $NGROK_URL/admin"
        echo "📋 Credentials: admin / admin123"
    fi
else
    echo "❌ ngrok tunnel is not running. Start it with: ./start-ngrok.sh"
fi

echo ""
echo "📱 To test React Native app:"
echo "1. Update react-native-app/src/constants/index.ts"
echo "2. Set NGROK_URL to your ngrok URL"
echo "3. Run: ./start-react-native.sh"
