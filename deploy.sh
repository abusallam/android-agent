#!/bin/bash

# Android Agent - Production Deployment Script
# This script sets up and deploys the Android Agent platform

set -e

echo "🚀 Android Agent - Production Deployment"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Checking system requirements..."

# Check available disk space (minimum 2GB)
available_space=$(df . | tail -1 | awk '{print $4}')
if [ "$available_space" -lt 2097152 ]; then
    print_warning "Low disk space detected. At least 2GB recommended."
fi

# Check available memory (minimum 1GB)
available_memory=$(free -m | awk 'NR==2{printf "%.0f", $7}')
if [ "$available_memory" -lt 1024 ]; then
    print_warning "Low memory detected. At least 1GB RAM recommended."
fi

print_success "System requirements check completed"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p server/clientData
mkdir -p modern-dashboard/prisma
touch server/clientData/blank

# Generate secure passwords if not set
if [ ! -f ".env.production" ]; then
    print_status "Generating secure configuration..."
    
    # Generate random passwords
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
    
    cat > .env.production << EOF
# Production Environment Variables
# Generated on $(date)

# Database
POSTGRES_DB=android_agent_db
POSTGRES_USER=android_agent
POSTGRES_PASSWORD=${DB_PASSWORD}

# Redis
REDIS_PASSWORD=${REDIS_PASSWORD}

# Security
NEXTAUTH_SECRET=${JWT_SECRET}
NEXTAUTH_URL=http://localhost:3000

# Application
NODE_ENV=production
EOF
    
    print_success "Secure configuration generated in .env.production"
    print_warning "Please review and update .env.production with your specific settings"
fi

# Build and start services
print_status "Building Docker images..."
docker-compose build --no-cache

print_status "Starting services..."
docker-compose up -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 10

# Check service health
print_status "Checking service health..."

# Check PostgreSQL
if docker-compose exec -T postgres pg_isready -U android_agent -d android_agent_db > /dev/null 2>&1; then
    print_success "PostgreSQL is healthy"
else
    print_error "PostgreSQL health check failed"
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is healthy"
else
    print_error "Redis health check failed"
fi

# Check Android Agent PWA
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "Android Agent PWA is healthy"
else
    print_warning "Android Agent PWA health check failed (may still be starting)"
fi

# Display deployment information
echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "📱 Android Agent PWA: http://localhost:3000"
echo "🔧 Legacy System: http://localhost:22533 (if enabled)"
echo "🗄️ Database: PostgreSQL on port 5432"
echo "🔄 Cache: Redis on port 6379"
echo ""
echo "🔑 Default Credentials:"
echo "   Username: admin"
echo "   Password: admin"
echo ""
echo "⚠️  IMPORTANT: Change the default password immediately!"
echo ""
echo "📊 View logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down"
echo "🔄 Restart services: docker-compose restart"
echo ""
echo "📖 Documentation: https://github.com/yourusername/android-agent"
echo ""

# Show running containers
print_status "Running containers:"
docker-compose ps

print_success "Android Agent is now running! 🚀"