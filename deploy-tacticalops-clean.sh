#!/bin/bash

# TacticalOps Clean Deployment Script
# This script properly deploys TacticalOps to VPS following the dev.consulting.sa pattern

set -e

# Configuration
VPS_HOST="217.79.255.54"
VPS_USER="root"
DOMAIN="tacticalops.ta.consulting.sa"
VPS_PROJECT_DIR="/opt/tacticalops"
LOCAL_ENV_FILE=".env.production"

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

# Function to execute commands on VPS
execute_remote() {
    ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "$1"
}

print_status "🚀 Starting TacticalOps Clean Deployment"

# Step 1: Verify local environment
print_status "📋 Verifying local environment..."
if [ ! -f "$LOCAL_ENV_FILE" ]; then
    print_error "Environment file $LOCAL_ENV_FILE not found!"
    exit 1
fi

if [ ! -f "docker-compose.vps-fixed.yml" ]; then
    print_error "Docker compose file docker-compose.vps-fixed.yml not found!"
    exit 1
fi

if [ ! -f "nginx/tacticalops.conf" ]; then
    print_error "Nginx configuration file nginx/tacticalops.conf not found!"
    exit 1
fi

print_success "Local environment verified"

# Step 2: Test VPS connection
print_status "🔗 Testing VPS connection..."
if ! execute_remote "echo 'Connection successful'"; then
    print_error "Cannot connect to VPS!"
    exit 1
fi
print_success "VPS connection established"

# Step 3: Stop existing deployment if running
print_status "🛑 Stopping existing deployment..."
execute_remote "cd $VPS_PROJECT_DIR && docker-compose -f docker-compose.vps-fixed.yml down || true"
execute_remote "cd $VPS_PROJECT_DIR && docker-compose -f docker-compose.production.yml down || true"
print_success "Existing deployment stopped"

# Step 4: Update code from GitHub
print_status "📥 Updating code from GitHub..."
execute_remote "cd $VPS_PROJECT_DIR && git fetch origin"
execute_remote "cd $VPS_PROJECT_DIR && git reset --hard origin/master"
execute_remote "cd $VPS_PROJECT_DIR && git clean -fd"
print_success "Code updated from GitHub"

# Step 5: Copy configuration files
print_status "📁 Copying configuration files..."
scp -o StrictHostKeyChecking=no "$LOCAL_ENV_FILE" "$VPS_USER@$VPS_HOST:$VPS_PROJECT_DIR/.env.production"
scp -o StrictHostKeyChecking=no "docker-compose.vps-fixed.yml" "$VPS_USER@$VPS_HOST:$VPS_PROJECT_DIR/"
scp -o StrictHostKeyChecking=no "nginx/tacticalops.conf" "$VPS_USER@$VPS_HOST:$VPS_PROJECT_DIR/nginx/"
scp -o StrictHostKeyChecking=no "modern-dashboard/Dockerfile.production" "$VPS_USER@$VPS_HOST:$VPS_PROJECT_DIR/modern-dashboard/"
print_success "Configuration files copied"

# Step 6: Create necessary directories
print_status "📂 Creating necessary directories..."
execute_remote "cd $VPS_PROJECT_DIR && mkdir -p data/postgres data/redis data/uploads logs"
execute_remote "cd $VPS_PROJECT_DIR && chmod -R 755 data logs"
print_success "Directories created"

# Step 7: Setup nginx configuration
print_status "🌐 Setting up nginx configuration..."
execute_remote "cp $VPS_PROJECT_DIR/nginx/tacticalops.conf /etc/nginx/sites-available/"
execute_remote "rm -f /etc/nginx/sites-enabled/tacticalops-fixed.conf"
execute_remote "ln -sf /etc/nginx/sites-available/tacticalops.conf /etc/nginx/sites-enabled/"
execute_remote "nginx -t"
execute_remote "systemctl reload nginx"
print_success "Nginx configuration updated"

# Step 8: Build and start services
print_status "🏗️ Building and starting services..."
execute_remote "cd $VPS_PROJECT_DIR && docker-compose -f docker-compose.vps-fixed.yml build --no-cache"
execute_remote "cd $VPS_PROJECT_DIR && docker-compose -f docker-compose.vps-fixed.yml up -d"
print_success "Services started"

# Step 9: Wait for services to be healthy
print_status "⏳ Waiting for services to be healthy..."
sleep 30

# Check service health
print_status "🔍 Checking service health..."
execute_remote "cd $VPS_PROJECT_DIR && docker-compose -f docker-compose.vps-fixed.yml ps"

# Step 10: Test the deployment
print_status "🧪 Testing deployment..."
sleep 10

# Test health endpoint
if execute_remote "curl -f -s http://127.0.0.1:3020/api/health"; then
    print_success "Health endpoint responding"
else
    print_warning "Health endpoint not responding yet"
fi

# Test HTTPS endpoint
if curl -f -s "https://$DOMAIN/api/health" > /dev/null 2>&1; then
    print_success "HTTPS endpoint responding"
else
    print_warning "HTTPS endpoint not responding yet"
fi

# Step 11: Show final status
print_status "📊 Final deployment status:"
execute_remote "cd $VPS_PROJECT_DIR && docker-compose -f docker-compose.vps-fixed.yml ps"

print_success "🎉 TacticalOps deployment completed!"
print_status "🌐 Application URL: https://$DOMAIN"
print_status "🔧 Admin Panel: https://$DOMAIN/admin"
print_status "📊 Health Check: https://$DOMAIN/api/health"
print_status "🔑 Default credentials: admin/admin123"

print_status "📝 To check logs:"
print_status "   ssh $VPS_USER@$VPS_HOST 'cd $VPS_PROJECT_DIR && docker-compose -f docker-compose.vps-fixed.yml logs -f'"

print_status "🔄 To restart services:"
print_status "   ssh $VPS_USER@$VPS_HOST 'cd $VPS_PROJECT_DIR && docker-compose -f docker-compose.vps-fixed.yml restart'"