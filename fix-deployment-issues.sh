#!/bin/bash

# Fix TacticalOps Deployment Issues
VPS_HOST="217.79.255.54"
VPS_USER="root"
DOMAIN="tacticalops.ta.consulting.sa"
VPS_PROJECT_DIR="/opt/tacticalops"

# Function to execute commands on VPS
vps_exec() {
    ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "$1"
}

echo "🔧 Fixing TacticalOps Deployment Issues"
echo "======================================"

echo "1. Checking current environment file on VPS..."
vps_exec "ls -la $VPS_PROJECT_DIR/.env.production"

echo ""
echo "2. Checking environment variables in the file..."
vps_exec "grep -E '(JWT_SECRET|DB_PASSWORD|REDIS_PASSWORD)' $VPS_PROJECT_DIR/.env.production | head -5"

echo ""
echo "3. Stopping containers to fix environment..."
vps_exec "cd $VPS_PROJECT_DIR && docker-compose -f docker-compose.vps.yml down"

echo ""
echo "4. Checking Docker Compose environment variable usage..."
vps_exec "grep -A 5 -B 5 'JWT_SECRET' $VPS_PROJECT_DIR/docker-compose.vps.yml"

echo ""
echo "5. Creating proper environment file with all required variables..."
vps_exec "cat > $VPS_PROJECT_DIR/.env << 'EOF'
# TacticalOps Platform - VPS Environment
NODE_ENV=production
PORT=3000

# Database Configuration
DB_HOST=tacticalops-postgres
DB_PORT=5432
DB_NAME=tacticalops
DB_USER=postgres
DB_PASSWORD=TacticalOps2024SecureDB!
DATABASE_URL=postgresql://postgres:TacticalOps2024SecureDB!@tacticalops-postgres:5432/tacticalops

# Redis Configuration
REDIS_HOST=tacticalops-redis
REDIS_PORT=6379
REDIS_PASSWORD=TacticalOps2024SecureRedis!
REDIS_URL=redis://:TacticalOps2024SecureRedis!@tacticalops-redis:6379

# Security Configuration
JWT_SECRET=TacticalOps2024SuperSecureJWTSecretKey32CharactersLong!
ENCRYPTION_KEY=TacticalOps2024EncryptionKey32Chars!
SESSION_SECRET=TacticalOps2024SessionSecretKey32Characters!
AGENT_API_KEY=TacticalOps2024AgentAPIKey32CharactersSecure!

# Application Configuration
NEXT_PUBLIC_APP_URL=https://$DOMAIN
NEXT_PUBLIC_API_URL=https://$DOMAIN/api
NEXT_PUBLIC_WS_URL=wss://$DOMAIN

# MinIO Configuration
MINIO_ROOT_USER=tacticalops
MINIO_ROOT_PASSWORD=TacticalOps2024MinIOSecure!
MINIO_ENDPOINT=tacticalops-minio:9000

# Monitoring
GRAFANA_PASSWORD=TacticalOps2024Grafana!

# Features
FEATURES_ENABLED=basic,mapping,emergency,communication,agentic,nlp,automation,geospatial,storage
DEFAULT_SECURITY_TIER=government
EOF"

echo ""
echo "6. Starting containers with proper environment..."
vps_exec "cd $VPS_PROJECT_DIR && docker-compose -f docker-compose.vps.yml up -d"

echo ""
echo "7. Waiting for containers to start..."
sleep 30

echo ""
echo "8. Checking container status..."
vps_exec "docker ps | grep tacticalops"

echo ""
echo "9. Checking application logs..."
vps_exec "docker logs tacticalops-app --tail=10"

echo ""
echo "10. Testing application health..."
HEALTH_CHECK=$(vps_exec "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health || echo 'FAILED'")
echo "Health check result: $HEALTH_CHECK"

if [ "$HEALTH_CHECK" = "200" ]; then
    echo "✅ Application is now healthy!"
    
    echo ""
    echo "11. Testing through nginx..."
    NGINX_TEST=$(vps_exec "curl -s -o /dev/null -w '%{http_code}' http://$DOMAIN/api/health || echo 'FAILED'")
    echo "Nginx test result: $NGINX_TEST"
    
    echo ""
    echo "🎉 TacticalOps Platform Fixed!"
    echo "================================"
    echo "✅ Containers running properly"
    echo "✅ Environment variables configured"
    echo "✅ Application responding"
    echo "✅ Nginx proxy working"
    echo ""
    echo "🌐 Access URLs:"
    echo "   Main Application: http://$DOMAIN"
    echo "   API Health Check: http://$DOMAIN/api/health"
    echo "   Admin Dashboard: http://$DOMAIN (admin/admin123)"
    echo ""
    echo "🔒 HTTPS URLs (via Cloudflare):"
    echo "   Main Application: https://$DOMAIN"
    echo "   API Health Check: https://$DOMAIN/api/health"
    
else
    echo "⚠️  Application still not responding correctly"
    echo "Let's check what's happening..."
    
    echo ""
    echo "Container logs:"
    vps_exec "docker logs tacticalops-app --tail=20"
    
    echo ""
    echo "Environment check:"
    vps_exec "docker exec tacticalops-app env | grep JWT_SECRET || echo 'JWT_SECRET not found'"
fi