#!/bin/bash

echo "🚀 Setting up Android Agent for production with PostgreSQL..."

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

echo "🗄️ Setting up PostgreSQL database for production..."
# Ensure we're using PostgreSQL schema
cp prisma/schema-postgres.prisma prisma/schema.prisma

echo "🔧 Generating Prisma client..."
npm run db:generate

echo "📊 Running database migrations..."
npm run db:migrate

echo "🌱 Initializing database with default data..."
npm run db:init

echo "🏗️ Building application..."
npm run build

echo "✅ Production setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Set up your environment variables in .env.production"
echo "2. Run 'npm start' to start the production server"
echo "3. Or use Docker: 'docker-compose up -d'"
echo ""
echo "🗄️ Database info:"
echo "  Type: PostgreSQL (production)"
echo "  URL: Check your DATABASE_URL environment variable"
echo "  Admin: username=admin, password=admin (change this!)"