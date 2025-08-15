#!/bin/bash

echo "🚀 Deploying TacticalOps with Supabase + PostgreSQL Architecture..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

VPS_HOST="217.79.255.54"
VPS_USER="root"
VPS_PATH="/opt/tacticalops"

echo -e "${BLUE}📊 Database Architecture:${NC}"
echo -e "   🌐 Primary: Supabase Cloud PostgreSQL"
echo -e "   🔄 Backup: PostgreSQL Container (VPS)"
echo -e "   ⚡ Cache: Redis Container (VPS)"
echo -e "   📱 Mobile: SQLite (Expo React Native)"

echo -e "${BLUE}📦 Step 1: Committing architecture changes...${NC}"
git add .
git commit -m "🏗️ Architecture: Implement Supabase + PostgreSQL backup system

✅ Database Architecture:
- Primary: Supabase Cloud PostgreSQL (production)
- Backup: PostgreSQL Container (VPS networking/provisioning)
- Cache: Redis Container (sessions/performance)
- Mobile: SQLite (Expo React Native offline-first)

✅ Configuration:
- Updated Prisma schema for Supabase PostgreSQL
- Added PostgreSQL backup container to docker-compose
- Created comprehensive database architecture documentation
- Updated environment configuration for multi-database setup

✅ Documentation:
- DATABASE_ARCHITECTURE.md with complete system overview
- Mermaid diagrams for data flow and synchronization
- Environment configuration examples
- Mobile synchronization strategy"

echo -e "${BLUE}📤 Step 2: Pushing to repository...${NC}"
git push origin dev

echo -e "${BLUE}🔄 Step 3: Pulling changes on VPS...${NC}"
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "
    cd ${VPS_PATH} && 
    echo '🔄 Pulling latest changes...' &&
    git pull origin dev &&
    echo '✅ Changes pulled successfully'
"

echo -e "${BLUE}⚙️ Step 4: Setting up environment configuration...${NC}"
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "
    cd ${VPS_PATH} && 
    echo '📝 Creating production environment file...' &&
    if [ ! -f .env.production ]; then
        cp .env.production.example .env.production
        echo '⚠️  Please configure .env.production with your Supabase credentials'
        echo '   - SUPABASE_DATABASE_URL'
        echo '   - SUPABASE_URL'
        echo '   - SUPABASE_ANON_KEY'
        echo '   - SUPABASE_SERVICE_KEY'
        echo '   - POSTGRES_PASSWORD'
        echo '   - REDIS_PASSWORD'
        echo '   - JWT_SECRET'
    else
        echo '✅ Environment file already exists'
    fi
"

echo -e "${BLUE}🏗️ Step 5: Building containers with new architecture...${NC}"
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "
    cd ${VPS_PATH} && 
    echo '🛑 Stopping existing containers...' &&
    docker-compose -f docker-compose.vps-fixed.yml down &&
    echo '🏗️ Building new containers...' &&
    docker-compose -f docker-compose.vps-fixed.yml build --no-cache &&
    echo '🚀 Starting new architecture...' &&
    docker-compose -f docker-compose.vps-fixed.yml up -d
"

echo -e "${BLUE}💾 Step 6: Setting up databases...${NC}"
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "
    cd ${VPS_PATH} && 
    echo '⏳ Waiting for containers to be ready...' &&
    sleep 30 &&
    echo '📊 Pushing Prisma schema to Supabase...' &&
    docker-compose -f docker-compose.vps-fixed.yml exec -T tacticalops-app npx prisma db push &&
    echo '👤 Setting up tactical admin users...' &&
    docker-compose -f docker-compose.vps-fixed.yml exec -T tacticalops-app node setup-tactical-admin.js
"

echo -e "${BLUE}🧪 Step 7: Running health checks...${NC}"
sleep 10
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "
    cd ${VPS_PATH} && 
    echo '🏥 Checking container health...' &&
    docker-compose -f docker-compose.vps-fixed.yml ps &&
    echo '🌐 Testing API health...' &&
    curl -s http://localhost:3020/api/health | head -20
"

echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${YELLOW}🌐 Website: https://tac.consulting.sa${NC}"
echo -e "${YELLOW}🔐 Login Credentials:${NC}"
echo -e "   Username: admin"
echo -e "   Password: admin123"
echo -e "   Role: ADMIN"
echo ""
echo -e "${BLUE}📊 Database Architecture Deployed:${NC}"
echo -e "   🌐 Primary: Supabase Cloud PostgreSQL"
echo -e "   🔄 Backup: PostgreSQL Container (Port 5433)"
echo -e "   ⚡ Cache: Redis Container (Port 6382)"
echo -e "   🖥️ App: Next.js Container (Port 3020)"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo -e "   1. Configure Supabase credentials in .env.production"
echo -e "   2. Test tactical theme and Arabic/English support"
echo -e "   3. Verify authentication with admin/admin123"
echo -e "   4. Test mobile app synchronization"
echo ""
echo -e "${GREEN}🎯 TacticalOps Multi-Database Architecture Ready!${NC}"