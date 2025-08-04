#!/bin/bash

echo "🚀 Setting up Android Agent for local development..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Setting up SQLite database for local development..."
# Ensure we're using SQLite schema
cp prisma/schema-sqlite.prisma prisma/schema.prisma

echo "🔧 Generating Prisma client..."
npm run db:generate

echo "📊 Setting up database..."
npm run db:push

echo "🌱 Initializing database with default data..."
npm run db:init

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Run 'npm run dev' to start the development server"
echo "2. Open http://localhost:3000 in your browser"
echo "3. Login with username: admin, password: admin"
echo ""
echo "🔧 Available commands:"
echo "  npm run dev          - Start development server"
echo "  npm run db:studio    - Open database browser"
echo "  npm run db:reset     - Reset database"
echo "  npm run test:local   - Full setup and start"
echo ""
echo "🗄️ Database info:"
echo "  Type: SQLite (local development)"
echo "  File: ./dev.db"
echo "  Admin: username=admin, password=admin"