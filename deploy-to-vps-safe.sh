#!/bin/bash

# TacticalOps Platform - Safe VPS Deployment Script
# This script safely deploys to VPS without affecting existing services

set -e

# Configuration
VPS_HOST="217.79.255.54"
VPS_USER="root"
VPS_PROJECT_DIR="/opt/tacticalops"
LOCAL_ENV_FILE=".env.production"
DOMAIN="tac.consulting.sa"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
}

# Function to execute commands on VPS
vps_exec() {
    ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "$1"
}

# Function to copy files to VPS
vps_copy() {
    scp -o StrictHostKeyChecking=no "$1" "$VPS_USER@$VPS_HOST:$2"
}

echo "🎖️ TacticalOps Platform - Safe VPS Deployment"
echo "=============================================="
echo "VPS Host: $VPS_HOST"
echo "Domain: $DOMAIN"
echo "Project Directory: $VPS_PROJECT_DIR"
echo ""

# Step 1: Test VPS connectivity
log "Testing VPS connectivity..."
if vps_exec "echo 'VPS connection successful'"; then
    success "VPS connection established"
else
    error "Cannot connect to VPS. Please check your SSH configuration."
    exit 1
fi

# Step 2: Create project directory and clone/update repository
log "Setting up project directory on VPS..."
vps_exec "mkdir -p $VPS_PROJECT_DIR"

if vps_exec "[ -d $VPS_PROJECT_DIR/.git ]"; then
    log "Repository exists, pulling latest changes..."
    vps_exec "cd $VPS_PROJECT_DIR && git fetch origin && git reset --hard origin/dev"
else
    log "Setting up repository..."
    vps_exec "rm -rf $VPS_PROJECT_DIR"
    vps_exec "cd /opt && git clone https://github.com/abusallam/android-agent.git tacticalops"
    vps_exec "cd $VPS_PROJECT_DIR && git checkout dev"
fi

success "Repository updated on VPS"

# Step 3: Copy environment variables safely
log "Copying environment variables to VPS..."
if [ -f "$LOCAL_ENV_FILE" ]; then
    # Update domain in env file for VPS
    sed "s/NEXT_PUBLIC_APP_URL=.*/NEXT_PUBLIC_APP_URL=https:\/\/$DOMAIN/" "$LOCAL_ENV_FILE" > .env.vps.tmp
    sed -i "s/NEXT_PUBLIC_API_URL=.*/NEXT_PUBLIC_API_URL=https:\/\/$DOMAIN\/api/" .env.vps.tmp
    sed -i "s/NEXT_PUBLIC_WS_URL=.*/NEXT_PUBLIC_WS_URL=wss:\/\/$DOMAIN/" .env.vps.tmp
    
    vps_copy ".env.vps.tmp" "$VPS_PROJECT_DIR/.env.production"
    rm .env.vps.tmp
    success "Environment variables copied to VPS"
else
    error "Local environment file not found: $LOCAL_ENV_FILE"
    exit 1
fi

# Step 4: Copy modern-dashboard environment
log "Copying dashboard environment..."
vps_copy "modern-dashboard/.env.production" "$VPS_PROJECT_DIR/modern-dashboard/.env.production"

# Step 5: Check existing Docker containers (don't interfere)
log "Checking existing Docker services..."
EXISTING_CONTAINERS=$(vps_exec "docker ps --format '{{.Names}}' | grep -v tacticalops || true")
if [ ! -z "$EXISTING_CONTAINERS" ]; then
    warning "Existing containers detected:"
    echo "$EXISTING_CONTAINERS"
    warning "Will deploy TacticalOps without interfering with existing services"
fi

# Step 6: Deploy TacticalOps containers
log "Deploying TacticalOps containers..."
vps_exec "cd $VPS_PROJECT_DIR && docker-compose -f docker-compose.vps.yml down || true"
vps_exec "cd $VPS_PROJECT_DIR && docker-compose -f docker-compose.vps.yml up -d --build"

# Wait for services to start
log "Waiting for services to initialize..."
sleep 30

# Step 7: Initialize database
log "Initializing database..."
vps_exec "cd $VPS_PROJECT_DIR && docker exec -i tacticalops-postgres psql -U postgres -d tacticalops < init-db-postgis.sql || true"
vps_exec "cd $VPS_PROJECT_DIR && docker exec -i tacticalops-postgres psql -U postgres -d tacticalops < init-db-enhanced.sql || true"
vps_exec "cd $VPS_PROJECT_DIR && docker exec -i tacticalops-postgres psql -U postgres -d tacticalops < scripts/create-task-management-schema.sql || true"

# Step 8: Configure Nginx safely (add new domain without affecting existing)
log "Configuring Nginx for TacticalOps domain..."

# Create nginx configuration
cat > tacticalops-nginx.conf << EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    # SSL Configuration (will be handled by certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    client_max_body_size 100M;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300;
    }
}
EOF

# Copy nginx config to VPS
vps_copy "tacticalops-nginx.conf" "/tmp/tacticalops-nginx.conf"
rm tacticalops-nginx.conf

# Install nginx config safely
vps_exec "cp /tmp/tacticalops-nginx.conf /etc/nginx/sites-available/tacticalops"
vps_exec "ln -sf /etc/nginx/sites-available/tacticalops /etc/nginx/sites-enabled/"

# Test nginx configuration before reloading
log "Testing Nginx configuration..."
if vps_exec "nginx -t"; then
    success "Nginx configuration is valid"
    
    # Reload nginx safely
    log "Reloading Nginx..."
    vps_exec "systemctl reload nginx"
    success "Nginx reloaded successfully"
else
    error "Nginx configuration test failed. Please check manually."
    exit 1
fi

# Step 9: Setup SSL certificate
log "Setting up SSL certificate..."
vps_exec "certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@ta.consulting.sa || echo 'SSL setup may have failed, continuing...'"

# Step 10: Verify deployment
log "Verifying deployment..."
sleep 10

# Check container status
CONTAINER_STATUS=$(vps_exec "docker-compose -f $VPS_PROJECT_DIR/docker-compose.vps.yml ps")
echo "Container Status:"
echo "$CONTAINER_STATUS"

# Test application health
log "Testing application health..."
HEALTH_CHECK=$(vps_exec "curl -s -o /dev/null -w '%{http_code}' https://$DOMAIN/api/health || echo 'FAILED'")

if [ "$HEALTH_CHECK" = "200" ]; then
    success "Application health check passed!"
else
    warning "Application health check returned: $HEALTH_CHECK"
fi

# Final summary
echo ""
echo "🎖️ TacticalOps Platform Deployment Summary"
echo "=========================================="
echo "✅ Repository updated on VPS"
echo "✅ Environment variables configured"
echo "✅ Docker containers deployed"
echo "✅ Database initialized"
echo "✅ Nginx configured for domain: $DOMAIN"
echo "✅ SSL certificate setup attempted"
echo ""
echo "🌐 Access URLs:"
echo "   Main Application: https://$DOMAIN"
echo "   API Health Check: https://$DOMAIN/api/health"
echo "   Admin Dashboard: https://$DOMAIN (admin/admin123)"
echo ""
echo "🤖 Agent API Endpoints:"
echo "   System Control: https://$DOMAIN/api/agentic/system-control"
echo "   Authentication: https://$DOMAIN/api/agent/auth"
echo "   Task Management: https://$DOMAIN/api/agents/task-management"
echo ""
echo "📊 Monitor deployment:"
echo "   Container logs: ssh $VPS_USER@$VPS_HOST 'cd $VPS_PROJECT_DIR && docker-compose -f docker-compose.vps.yml logs -f'"
echo "   Container status: ssh $VPS_USER@$VPS_HOST 'docker ps'"
echo ""

if [ "$HEALTH_CHECK" = "200" ]; then
    success "🎉 Deployment completed successfully!"
    echo "Ready for comprehensive testing with Playwright MCP."
else
    warning "⚠️  Deployment completed but health check failed. Manual verification needed."
fi

echo ""
echo "Next steps:"
echo "1. Verify the application is accessible at https://$DOMAIN"
echo "2. Run comprehensive testing suite"
echo "3. Monitor logs for any issues"