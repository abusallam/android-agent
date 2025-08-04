#!/bin/bash

echo "🧪 Testing Android Agent locally..."

# Set environment variables
export DATABASE_URL="file:./dev.db"
export NEXTAUTH_SECRET="dev-secret-key-for-local-development-only"
export NEXTAUTH_URL="http://localhost:3000"
export NODE_ENV="development"

echo "🗄️ Database: SQLite (./dev.db)"
echo "🔐 Auth: JWT with bcrypt"
echo "🌐 URL: http://localhost:3000"
echo ""

# Test health endpoint
echo "🏥 Testing health endpoint..."
if command -v curl &> /dev/null; then
    timeout 5 npm run dev &
    DEV_PID=$!
    sleep 3
    
    echo "📡 Health check:"
    curl -s http://localhost:3000/api/health | head -c 200
    echo ""
    
    kill $DEV_PID 2>/dev/null
    wait $DEV_PID 2>/dev/null
else
    echo "⚠️ curl not available, skipping health check"
fi

echo ""
echo "✅ Local test complete!"
echo ""
echo "🚀 To start development server:"
echo "  DATABASE_URL=\"file:./dev.db\" npm run dev"
echo ""
echo "🔑 Login credentials:"
echo "  Username: admin"
echo "  Password: admin"