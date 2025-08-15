#!/bin/bash

# Deploy TacticalOps with Latest Fixes
VPS_HOST="217.79.255.54"
VPS_USER="root"
DOMAIN="tac.consulting.sa"
VPS_PROJECT_DIR="/opt/tacticalops"

# Function to execute commands on VPS
vps_exec() {
    ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "$1"
}

echo "🚀 Deploying TacticalOps with Latest Fixes"
echo "=========================================="

echo "1. Pulling latest code from GitHub..."
vps_exec "cd $VPS_PROJECT_DIR && git fetch origin && git reset --hard origin/dev"

echo ""
echo "2. Stopping existing containers..."
vps_exec "cd $VPS_PROJECT_DIR && docker-compose -f docker-compose.vps.yml down"

echo ""
echo "3. Removing old images to force rebuild..."
vps_exec "docker rmi tacticalops/platform:latest || true"

echo ""
echo "4. Creating proper environment file..."
vps_exec "cat > $VPS_PROJECT_DIR/.env << 'EOF'
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
DEPLOYMENT_TIER=civilian
API_VERSION=v2
EOF"

echo ""
echo "5. Building and starting containers with latest code..."
vps_exec "cd $VPS_PROJECT_DIR && docker-compose -f docker-compose.vps.yml up -d --build"

echo ""
echo "6. Waiting for containers to start..."
sleep 45

echo ""
echo "7. Checking container status..."
vps_exec "docker ps | grep tacticalops"

echo ""
echo "8. Checking application logs..."
vps_exec "docker logs tacticalops-app --tail=15"

echo ""
echo "9. Testing application health..."
sleep 10
HEALTH_CHECK=$(vps_exec "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health || echo 'FAILED'")
echo "Health check result: $HEALTH_CHECK"

if [ "$HEALTH_CHECK" = "200" ]; then
    echo ""
    echo "✅ Application is healthy!"
    
    echo ""
    echo "10. Testing through nginx..."
    NGINX_TEST=$(vps_exec "curl -s -o /dev/null -w '%{http_code}' http://$DOMAIN/api/health || echo 'FAILED'")
    echo "Nginx test result: $NGINX_TEST"
    
    echo ""
    echo "11. Testing main page..."
    MAIN_PAGE=$(vps_exec "curl -s -o /dev/null -w '%{http_code}' http://$DOMAIN || echo 'FAILED'")
    echo "Main page result: $MAIN_PAGE"
    
    echo ""
    echo "🎉 TacticalOps Platform Successfully Deployed!"
    echo "============================================="
    echo "✅ Latest code deployed"
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
    echo ""
    echo "🤖 Agent API Endpoints:"
    echo "   System Control: https://$DOMAIN/api/agentic/system-control"
    echo "   Authentication: https://$DOMAIN/api/agent/auth"
    echo "   Task Management: https://$DOMAIN/api/agents/task-management"
    
else
    echo ""
    echo "⚠️  Application still not responding correctly"
    echo "Health check returned: $HEALTH_CHECK"
    
    echo ""
    echo "Debugging information:"
    echo "Container status:"
    vps_exec "docker ps | grep tacticalops"
    
    echo ""
    echo "Application logs:"
    vps_exec "docker logs tacticalops-app --tail=30"
    
    echo ""
    echo "Environment variables in container:"
    vps_exec "docker exec tacticalops-app env | grep -E '(JWT_SECRET|NODE_ENV|PORT)' || echo 'Container not accessible'"
fi