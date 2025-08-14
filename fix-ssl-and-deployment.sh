#!/bin/bash

# Fix SSL and Deployment Issues for TacticalOps Platform
# This script fixes the NGINX SSL configuration and Docker container issues

set -e

VPS_HOST="217.79.255.54"
VPS_USER="root"
DOMAIN="tacticalops.ta.consulting.sa"

echo "🔧 Fixing TacticalOps SSL and Deployment Issues..."
echo "=================================================="

# Function to run commands on VPS
run_on_vps() {
    ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "$1"
}

# Function to copy files to VPS
copy_to_vps() {
    scp -o StrictHostKeyChecking=no "$1" "$VPS_USER@$VPS_HOST:$2"
}

echo "📋 Step 1: Analyzing current deployment..."
echo "Current containers status:"
run_on_vps "docker ps | grep tactical || echo 'No tactical containers running'"

echo ""
echo "📋 Step 2: Stopping current deployment..."
run_on_vps "cd /opt/tacticalops && docker-compose down || echo 'No containers to stop'"

echo ""
echo "📋 Step 3: Backing up current NGINX configuration..."
run_on_vps "cp /etc/nginx/sites-available/tacticalops-clean /etc/nginx/sites-available/tacticalops-clean.backup.$(date +%Y%m%d_%H%M%S) || echo 'No backup needed'"

echo ""
echo "📋 Step 4: Uploading fixed NGINX configuration..."
copy_to_vps "nginx/tacticalops-fixed.conf" "/etc/nginx/sites-available/tacticalops-fixed.conf"

echo ""
echo "📋 Step 5: Enabling new NGINX configuration..."
run_on_vps "rm -f /etc/nginx/sites-enabled/tacticalops-clean"
run_on_vps "ln -sf /etc/nginx/sites-available/tacticalops-fixed.conf /etc/nginx/sites-enabled/tacticalops-fixed.conf"

echo ""
echo "📋 Step 6: Testing NGINX configuration..."
run_on_vps "nginx -t"

echo ""
echo "📋 Step 7: Reloading NGINX..."
run_on_vps "systemctl reload nginx"

echo ""
echo "📋 Step 8: Fixing Docker container permissions..."
run_on_vps "cd /opt/tacticalops && mkdir -p logs data/uploads data/static && chmod -R 755 logs data || echo 'Permissions set'"

echo ""
echo "📋 Step 9: Checking Docker Compose configuration..."
run_on_vps "cd /opt/tacticalops && ls -la docker-compose.yml || echo 'No docker-compose.yml found'"

echo ""
echo "📋 Step 10: Starting containers with proper configuration..."
run_on_vps "cd /opt/tacticalops && docker-compose up -d --build"

echo ""
echo "📋 Step 11: Waiting for containers to start..."
sleep 30

echo ""
echo "📋 Step 12: Checking container status..."
run_on_vps "docker ps | grep tactical"

echo ""
echo "📋 Step 13: Testing HTTPS connection..."
echo "Testing SSL certificate..."
curl -I "https://$DOMAIN" || echo "HTTPS test failed - checking HTTP..."
curl -I "http://$DOMAIN" || echo "HTTP test also failed"

echo ""
echo "📋 Step 14: Checking application logs..."
run_on_vps "docker logs --tail=10 tacticalops-app || echo 'No app logs available'"

echo ""
echo "✅ SSL and Deployment Fix Complete!"
echo "=================================="
echo ""
echo "🌐 Access URLs:"
echo "  - HTTPS: https://$DOMAIN"
echo "  - HTTP (redirects): http://$DOMAIN"
echo ""
echo "🔍 To check status:"
echo "  - Container status: ssh $VPS_USER@$VPS_HOST 'docker ps | grep tactical'"
echo "  - NGINX status: ssh $VPS_USER@$VPS_HOST 'systemctl status nginx'"
echo "  - Application logs: ssh $VPS_USER@$VPS_HOST 'docker logs tacticalops-app'"
echo ""
echo "🚨 If issues persist:"
echo "  1. Check container logs: docker logs tacticalops-app"
echo "  2. Check NGINX logs: tail -f /var/log/nginx/tacticalops-error.log"
echo "  3. Verify certificate: openssl s_client -connect $DOMAIN:443"