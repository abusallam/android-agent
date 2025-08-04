#!/bin/bash

echo "🚀 Starting Android Agent - Production Mode (No Webpack Errors)"

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "node .next" 2>/dev/null || true
pkill -f "ngrok" 2>/dev/null || true

# Clean up logs
echo "🗑️ Cleaning logs..."
rm -f dev-server.log prod-server.log ngrok.log 2>/dev/null || true

# Set environment variables
export DATABASE_URL="file:./dev.db"
export NEXTAUTH_SECRET="dev-secret-key-for-local-development-only"
export NEXTAUTH_URL="http://localhost:3000"
export NODE_ENV="production"

echo "🗄️ Database: SQLite (./dev.db)"
echo "🔐 Auth: JWT with bcrypt"
echo "🌐 Local: http://localhost:3000"
echo "📱 Network: http://10.76.195.206:3000"
echo ""

# Build application
echo "🏗️ Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Check for errors above."
    exit 1
fi

# Start production server
echo "🚀 Starting production server (no webpack errors)..."
nohup node .next/standalone/server.js > prod-server.log 2>&1 &
PROD_PID=$!

# Wait for server to start
sleep 5

# Test server
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Production server started successfully"
else
    echo "❌ Production server failed to start"
    exit 1
fi

# Start ngrok tunnel
echo "🌐 Starting ngrok tunnel..."
nohup ngrok http 3000 > ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 5

# Get ngrok URL
echo ""
echo "📱 Getting mobile access URL..."
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ ! -z "$NGROK_URL" ]; then
    echo "✅ Mobile Access URL: $NGROK_URL"
else
    echo "⚠️ ngrok URL not available yet, check http://localhost:4040"
    NGROK_URL="Check http://localhost:4040"
fi

echo ""
echo "🎉 Android Agent is now running in PRODUCTION MODE!"
echo ""
echo "🎯 Access URLs:"
echo "  🖥️  PC: http://localhost:3000"
echo "  📱 Mobile: $NGROK_URL"
echo ""
echo "✨ Features Available:"
echo "  🗺️  Interactive Maps"
echo "  🚨 Emergency Panel"
echo "  📊 Device Status Cards"
echo "  🔔 Notification Manager"
echo "  🌙 Dark/Light Theme Toggle"
echo "  📱 PWA Installation"
echo "  🧪 API Testing Panel"
echo ""
echo "🔑 Login: admin / admin"
echo ""
echo "📋 Logs:"
echo "  Server: tail -f prod-server.log"
echo "  ngrok: tail -f ngrok.log"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap 'echo "🛑 Stopping services..."; kill $PROD_PID $NGROK_PID 2>/dev/null; exit 0' INT
wait