#!/bin/bash

# Fix Nginx Configuration for TacticalOps
VPS_HOST="217.79.255.54"
VPS_USER="root"
DOMAIN="tac.consulting.sa"

# Function to execute commands on VPS
vps_exec() {
    ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "$1"
}

echo "🔧 Fixing Nginx Configuration for TacticalOps"
echo "============================================="

# Remove any conflicting nginx configuration
echo "Removing any existing tacticalops nginx config..."
vps_exec "rm -f /etc/nginx/sites-enabled/tacticalops"
vps_exec "rm -f /etc/nginx/sites-available/tacticalops"

# Create a simple HTTP-only configuration first
echo "Creating simple HTTP configuration..."
vps_exec "cat > /etc/nginx/sites-available/tacticalops << 'EOF'
server {
    listen 80;
    server_name $DOMAIN;
    
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
        proxy_set_header Connection \"upgrade\";
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
EOF"

# Enable the site
echo "Enabling nginx site..."
vps_exec "ln -sf /etc/nginx/sites-available/tacticalops /etc/nginx/sites-enabled/"

# Test nginx configuration
echo "Testing nginx configuration..."
if vps_exec "nginx -t"; then
    echo "✅ Nginx configuration is valid"
    
    # Reload nginx
    echo "Reloading nginx..."
    vps_exec "systemctl reload nginx"
    echo "✅ Nginx reloaded successfully"
    
    # Test the application
    echo "Testing application..."
    sleep 5
    HEALTH_CHECK=$(vps_exec "curl -s -o /dev/null -w '%{http_code}' http://$DOMAIN/api/health || echo 'FAILED'")
    
    if [ "$HEALTH_CHECK" = "200" ]; then
        echo "✅ Application is responding!"
        echo ""
        echo "🌐 Access URLs:"
        echo "   Main Application: http://$DOMAIN"
        echo "   API Health Check: http://$DOMAIN/api/health"
        echo "   Admin Dashboard: http://$DOMAIN (admin/admin123)"
        echo ""
        echo "🎉 TacticalOps is now accessible!"
    else
        echo "⚠️  Application health check returned: $HEALTH_CHECK"
        echo "Checking container status..."
        vps_exec "docker ps | grep tacticalops"
    fi
else
    echo "❌ Nginx configuration test failed"
    vps_exec "nginx -t"
fi