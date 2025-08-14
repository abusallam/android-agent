#!/bin/bash

# Debug TacticalOps Deployment Issues
VPS_HOST="217.79.255.54"
VPS_USER="root"
DOMAIN="tacticalops.ta.consulting.sa"

# Function to execute commands on VPS
vps_exec() {
    ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "$1"
}

echo "🔍 Debugging TacticalOps Deployment Issues"
echo "=========================================="

echo "1. Container Status:"
vps_exec "docker ps | grep tacticalops"

echo ""
echo "2. Container Logs (last 20 lines):"
vps_exec "docker logs tacticalops-app --tail=20"

echo ""
echo "3. Environment Variables Check:"
vps_exec "docker exec tacticalops-app env | grep -E '(NODE_ENV|PORT|DATABASE_URL|JWT_SECRET)' || echo 'Container not accessible'"

echo ""
echo "4. Application Port Check:"
vps_exec "netstat -tlnp | grep :3000"

echo ""
echo "5. Direct Application Test:"
vps_exec "curl -v http://localhost:3000/api/health"

echo ""
echo "6. Nginx Configuration Check:"
vps_exec "nginx -t"

echo ""
echo "7. Current Nginx Sites:"
vps_exec "ls -la /etc/nginx/sites-enabled/"

echo ""
echo "8. Test Domain Resolution:"
vps_exec "curl -I http://$DOMAIN"

echo ""
echo "9. Database Connection Test:"
vps_exec "docker exec tacticalops-postgres pg_isready -U postgres || echo 'Database not accessible'"

echo ""
echo "10. Redis Connection Test:"
vps_exec "docker exec tacticalops-redis redis-cli ping || echo 'Redis not accessible'"