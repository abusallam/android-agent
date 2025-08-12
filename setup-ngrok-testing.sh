#!/bin/bash

# Android Agent - ngrok External Testing Setup Script
# This script sets up everything needed for external testing with ngrok

set -e

echo "🚀 Android Agent - ngrok External Testing Setup"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "modern-dashboard/package.json" ] || [ ! -f "react-native-app/package.json" ]; then
    print_error "Please run this script from the root directory of the Android Agent project"
    exit 1
fi

print_info "Detected Android Agent project structure"
echo ""

# Step 1: Check prerequisites
echo "📋 Step 1: Checking Prerequisites"
echo "--------------------------------"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status "npm installed: $NPM_VERSION"
else
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check if ngrok is installed
if command -v ngrok &> /dev/null; then
    NGROK_VERSION=$(ngrok version)
    print_status "ngrok installed: $NGROK_VERSION"
else
    print_warning "ngrok not found. Installing ngrok..."
    npm install -g ngrok
    if command -v ngrok &> /dev/null; then
        print_status "ngrok installed successfully"
    else
        print_error "Failed to install ngrok. Please install manually: npm install -g ngrok"
        exit 1
    fi
fi

echo ""

# Step 2: Setup PWA Dashboard
echo "🌐 Step 2: Setting up PWA Dashboard"
echo "-----------------------------------"

cd modern-dashboard

# Install dependencies
if [ ! -d "node_modules" ]; then
    print_info "Installing PWA dependencies..."
    npm install
    print_status "PWA dependencies installed"
else
    print_status "PWA dependencies already installed"
fi

# Setup database
print_info "Setting up database with root admin and sample data..."
npm run db:setup
print_status "Database setup complete"

cd ..
echo ""

# Step 3: Setup React Native App
echo "📱 Step 3: Setting up React Native App"
echo "--------------------------------------"

cd react-native-app

# Install dependencies
if [ ! -d "node_modules" ]; then
    print_info "Installing React Native dependencies..."
    npm install
    print_status "React Native dependencies installed"
else
    print_status "React Native dependencies already installed"
fi

cd ..
echo ""

# Step 4: ngrok Configuration
echo "🔧 Step 4: ngrok Configuration"
echo "------------------------------"

# Check for ngrok auth token
if [ -z "$NGROK_AUTHTOKEN" ]; then
    print_warning "No ngrok auth token found in environment"
    echo ""
    echo "To get better ngrok features (custom subdomains, more connections):"
    echo "1. Visit: https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "2. Sign up for free and copy your auth token"
    echo "3. Set it: export NGROK_AUTHTOKEN=your_token_here"
    echo "4. Or add it to your shell profile (.bashrc, .zshrc, etc.)"
    echo ""
    print_info "You can still test without an auth token (with limitations)"
else
    print_status "ngrok auth token found in environment"
    # Configure auth token
    ngrok config add-authtoken $NGROK_AUTHTOKEN
    print_status "ngrok auth token configured"
fi

echo ""

# Step 5: Create startup scripts
echo "📝 Step 5: Creating Startup Scripts"
echo "-----------------------------------"

# Create PWA startup script
cat > start-pwa.sh << 'EOF'
#!/bin/bash
echo "🌐 Starting PWA Dashboard..."
cd modern-dashboard
npm run dev
EOF

chmod +x start-pwa.sh
print_status "Created start-pwa.sh"

# Create ngrok startup script
cat > start-ngrok.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting ngrok tunnel..."
cd modern-dashboard
node ngrok-setup.js start
EOF

chmod +x start-ngrok.sh
print_status "Created start-ngrok.sh"

# Create React Native startup script
cat > start-react-native.sh << 'EOF'
#!/bin/bash
echo "📱 Starting React Native App..."
cd react-native-app
npm start
EOF

chmod +x start-react-native.sh
print_status "Created start-react-native.sh"

# Create comprehensive test script
cat > test-system.sh << 'EOF'
#!/bin/bash
echo "🧪 Testing Android Agent System..."
echo ""

# Test PWA health
echo "Testing PWA health..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ PWA is running and healthy"
else
    echo "❌ PWA is not running. Start it with: ./start-pwa.sh"
fi

# Test ngrok tunnel
echo "Testing ngrok tunnel..."
if curl -s http://localhost:4040/api/tunnels > /dev/null; then
    echo "✅ ngrok tunnel is active"
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok\.io' | head -1)
    if [ ! -z "$NGROK_URL" ]; then
        echo "🌐 External URL: $NGROK_URL"
        echo "🔧 Admin Panel: $NGROK_URL/admin"
        echo "📋 Credentials: admin / admin123"
    fi
else
    echo "❌ ngrok tunnel is not running. Start it with: ./start-ngrok.sh"
fi

echo ""
echo "📱 To test React Native app:"
echo "1. Update react-native-app/src/constants/index.ts"
echo "2. Set NGROK_URL to your ngrok URL"
echo "3. Run: ./start-react-native.sh"
EOF

chmod +x test-system.sh
print_status "Created test-system.sh"

echo ""

# Step 6: Final instructions
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Your Android Agent system is ready for external testing with ngrok!"
echo ""
echo "📋 Default Admin Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "🚀 To start testing:"
echo ""
echo "1. Start PWA Dashboard (Terminal 1):"
echo "   ./start-pwa.sh"
echo ""
echo "2. Start ngrok tunnel (Terminal 2):"
echo "   ./start-ngrok.sh"
echo ""
echo "3. Update React Native API URL:"
echo "   - Edit react-native-app/src/constants/index.ts"
echo "   - Set NGROK_URL to your ngrok HTTPS URL"
echo ""
echo "4. Start React Native App (Terminal 3):"
echo "   ./start-react-native.sh"
echo ""
echo "5. Test the system:"
echo "   ./test-system.sh"
echo ""
echo "🌐 External Testing URLs (after starting ngrok):"
echo "   Dashboard: https://your-ngrok-url.ngrok.io"
echo "   Admin Panel: https://your-ngrok-url.ngrok.io/admin"
echo "   Health Check: https://your-ngrok-url.ngrok.io/api/health"
echo ""
echo "📱 Features to Test:"
echo "   ✅ PWA Dashboard with admin system"
echo "   ✅ React Native app with sensor integration"
echo "   ✅ Device registration and management"
echo "   ✅ Real-time location tracking"
echo "   ✅ Sensor data collection and sync"
echo "   ✅ Admin user management"
echo ""
echo "🔍 Monitoring:"
echo "   ngrok Web Interface: http://localhost:4040"
echo "   Database Studio: npm run db:studio (in modern-dashboard/)"
echo ""
print_status "Setup completed successfully!"
echo ""
print_info "Run ./test-system.sh anytime to check system status"