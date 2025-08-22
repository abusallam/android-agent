#!/bin/bash

# Complete Fix for TacticalOps SSL and Deployment Issues
# This script fixes NGINX SSL configuration and Docker build issues

set -e

VPS_HOST="217.79.255.54"
VPS_USER="root"
DOMAIN="tac.consulting.sa"

echo "🔧 Complete TacticalOps SSL and Deployment Fix"
echo "=============================================="

# Function to run commands on VPS
run_on_vps() {
    ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "$1"
}

# Function to copy files to VPS
copy_to_vps() {
    scp -o StrictHostKeyChecking=no "$1" "$VPS_USER@$VPS_HOST:$2"
}

echo "📋 Step 1: Stopping current deployment..."
run_on_vps "cd /opt/tacticalops && docker-compose down || echo 'No containers to stop'"

echo ""
echo "📋 Step 2: Backing up current configurations..."
run_on_vps "cp /etc/nginx/sites-available/tacticalops-clean /etc/nginx/sites-available/tacticalops-clean.backup.$(date +%Y%m%d_%H%M%S) || echo 'No backup needed'"

echo ""
echo "📋 Step 3: Uploading fixed NGINX configuration..."
copy_to_vps "nginx/tacticalops-fixed.conf" "/etc/nginx/sites-available/tacticalops-fixed.conf"

echo ""
echo "📋 Step 4: Enabling new NGINX configuration..."
run_on_vps "rm -f /etc/nginx/sites-enabled/tacticalops-clean"
run_on_vps "ln -sf /etc/nginx/sites-available/tacticalops-fixed.conf /etc/nginx/sites-enabled/tacticalops-fixed.conf"

echo ""
echo "📋 Step 5: Testing NGINX configuration..."
run_on_vps "nginx -t"

echo ""
echo "📋 Step 6: Reloading NGINX..."
run_on_vps "systemctl reload nginx"

echo ""
echo "📋 Step 7: Uploading fixed application files..."
# Copy the entire modern-dashboard directory with fixes
echo "Copying modern-dashboard directory..."
run_on_vps "mkdir -p /opt/tacticalops/modern-dashboard-new"
scp -r -o StrictHostKeyChecking=no modern-dashboard/* "$VPS_USER@$VPS_HOST:/opt/tacticalops/modern-dashboard-new/"

echo ""
echo "📋 Step 8: Backing up and replacing application directory..."
run_on_vps "cd /opt/tacticalops && mv modern-dashboard modern-dashboard-backup-$(date +%Y%m%d_%H%M%S) || echo 'No backup needed'"
run_on_vps "cd /opt/tacticalops && mv modern-dashboard-new modern-dashboard"

echo ""
echo "📋 Step 9: Copying deployment files..."
copy_to_vps "docker-compose.production.yml" "/opt/tacticalops/docker-compose.yml"
copy_to_vps ".env.production" "/opt/tacticalops/.env"

echo ""
echo "📋 Step 10: Setting up proper permissions..."
run_on_vps "cd /opt/tacticalops && mkdir -p logs data/uploads data/static && chmod -R 755 logs data modern-dashboard || echo 'Permissions set'"

echo ""
echo "📋 Step 11: Building and starting containers..."
run_on_vps "cd /opt/tacticalops && docker-compose build --no-cache"
run_on_vps "cd /opt/tacticalops && docker-compose up -d"

echo ""
echo "📋 Step 12: Waiting for containers to start..."
sleep 45

echo ""
echo "📋 Step 13: Checking container status..."
run_on_vps "docker ps | grep tactical"

echo ""
echo "📋 Step 14: Testing HTTPS connection..."
echo "Testing SSL certificate..."
sleep 10
curl -k -I "https://$DOMAIN" || echo "HTTPS test failed - checking logs..."

echo ""
echo "📋 Step 15: Checking application logs..."
run_on_vps "docker logs --tail=20 tacticalops-app || echo 'No app logs available'"

echo ""
echo "📋 Step 16: Testing application endpoints..."
echo "Testing health endpoint..."
curl -k "https://$DOMAIN/health" || curl -k "https://$DOMAIN/api/health" || echo "Health check failed"

echo ""
echo "✅ Complete SSL and Deployment Fix Finished!"
echo "==========================================="
echo ""
echo "🌐 Access URLs:"
echo "  - HTTPS: https://$DOMAIN"
echo "  - HTTP (redirects): http://$DOMAIN"
echo "  - Health: https://$DOMAIN/health"
echo ""
echo "🔍 To check status:"
echo "  - Container status: ssh $VPS_USER@$VPS_HOST 'docker ps'"
echo "  - Application logs: ssh $VPS_USER@$VPS_HOST 'docker logs -f tacticalops-app'"
echo "  - NGINX logs: ssh $VPS_USER@$VPS_HOST 'tail -f /var/log/nginx/tacticalops-error.log'"
echo ""
echo "🧪 Run comprehensive tests:"
echo "  node test-production-deployment.js --base-url=https://$DOMAIN"