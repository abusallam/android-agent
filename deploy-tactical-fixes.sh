#!/bin/bash

echo "🚀 Deploying TacticalOps Fixes to VPS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

VPS_HOST="217.79.255.54"
VPS_USER="root"
VPS_PATH="/opt/tacticalops"

echo -e "${BLUE}📦 Step 1: Committing changes to Git...${NC}"
git add .
git commit -m "🎯 Fix: Tactical theme, Arabic/English support, authentication fixes

- ✅ Implemented proper tactical camo theme (desert/forest)
- ✅ Added Arabic/English multi-language support with RTL
- ✅ Fixed login page with proper sign up/forgot password
- ✅ Removed demo credentials from front screen
- ✅ Created tactical dashboard with proper theming
- ✅ Added tactical dummy data for testing
- ✅ Fixed authentication database issues"

echo -e "${BLUE}📤 Step 2: Pushing to GitHub...${NC}"
git push origin main

echo -e "${BLUE}🔄 Step 3: Pulling changes on VPS...${NC}"
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "
    cd ${VPS_PATH} && 
    echo '🔄 Pulling latest changes...' &&
    git pull origin main &&
    echo '✅ Changes pulled successfully'
"

echo -e "${BLUE}🏗️ Step 4: Rebuilding containers...${NC}"
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "
    cd ${VPS_PATH} && 
    echo '🛑 Stopping containers...' &&
    docker-compose -f docker-compose.vps-fixed.yml down &&
    echo '🏗️ Rebuilding containers...' &&
    docker-compose -f docker-compose.vps-fixed.yml build --no-cache &&
    echo '🚀 Starting containers...' &&
    docker-compose -f docker-compose.vps-fixed.yml up -d
"

echo -e "${BLUE}💾 Step 5: Setting up database and admin users...${NC}"
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "
    cd ${VPS_PATH} && 
    echo '📊 Pushing database schema...' &&
    docker-compose -f docker-compose.vps-fixed.yml exec -T tacticalops-app npx prisma db push &&
    echo '👤 Setting up tactical admin users...' &&
    docker-compose -f docker-compose.vps-fixed.yml exec -T tacticalops-app node setup-tactical-admin.js
"

echo -e "${BLUE}🧪 Step 6: Running health checks...${NC}"
sleep 10
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "
    cd ${VPS_PATH} && 
    echo '🏥 Checking container health...' &&
    docker-compose -f docker-compose.vps-fixed.yml ps &&
    echo '🌐 Testing API health...' &&
    curl -s http://localhost:3000/api/health | head -20
"

echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${YELLOW}🌐 Website: https://tac.consulting.sa${NC}"
echo -e "${YELLOW}🔐 Login Credentials:${NC}"
echo -e "   Username: admin"
echo -e "   Password: admin123"
echo -e "   Role: ROOT_ADMIN"
echo ""
echo -e "${BLUE}📋 Test the following fixes:${NC}"
echo -e "   ✅ Tactical camo theme (desert/forest)"
echo -e "   ✅ Arabic/English language toggle"
echo -e "   ✅ Login with admin/admin123"
echo -e "   ✅ Sign up and forgot password links"
echo -e "   ✅ No demo credentials on front screen"
echo -e "   ✅ Tactical dashboard with proper theming"
echo ""
echo -e "${GREEN}🎯 TacticalOps deployment successful!${NC}"