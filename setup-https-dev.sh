#!/bin/bash

# Android Agent - HTTPS Development Setup
# This script sets up local HTTPS for testing PWA on Android devices

echo "🔒 Setting up HTTPS for Android Agent PWA testing"
echo "================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get local IP address
LOCAL_IP=$(hostname -I | awk '{print $1}')
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(ip route get 1 | awk '{print $7; exit}')
fi

echo -e "${YELLOW}[INFO]${NC} Your local IP address: ${LOCAL_IP}"

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo -e "${YELLOW}[INFO]${NC} mkcert not found. Installing mkcert for trusted certificates..."
    
    # Install mkcert based on OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt &> /dev/null; then
            sudo apt update && sudo apt install -y mkcert
        elif command -v yum &> /dev/null; then
            sudo yum install -y mkcert
        elif command -v pacman &> /dev/null; then
            sudo pacman -S mkcert
        else
            echo -e "${RED}[ERROR]${NC} Could not install mkcert automatically. Please install manually:"
            echo "Visit: https://github.com/FiloSottile/mkcert#installation"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install mkcert
        else
            echo -e "${RED}[ERROR]${NC} Please install Homebrew first, then run: brew install mkcert"
            exit 1
        fi
    else
        echo -e "${RED}[ERROR]${NC} Unsupported OS. Please install mkcert manually:"
        echo "Visit: https://github.com/FiloSottile/mkcert#installation"
        exit 1
    fi
fi

# Create SSL directory
mkdir -p ssl

# Install local CA
echo -e "${BLUE}[INFO]${NC} Installing local Certificate Authority..."
mkcert -install

# Generate certificate for localhost and local IP
echo -e "${BLUE}[INFO]${NC} Generating trusted SSL certificate..."
cd ssl
mkcert -key-file localhost.key -cert-file localhost.crt localhost 127.0.0.1 ${LOCAL_IP} ::1
cd ..

echo -e "${GREEN}[SUCCESS]${NC} Trusted SSL certificate generated!"

# Create HTTPS development script
cat > start-https-dev.sh << EOF
#!/bin/bash

echo "🚀 Starting Android Agent with HTTPS..."

# Get local IP
LOCAL_IP=\$(hostname -I | awk '{print \$1}')
if [ -z "\$LOCAL_IP" ]; then
    LOCAL_IP=\$(ip route get 1 | awk '{print \$7; exit}')
fi

echo "📱 Access URLs:"
echo "   Local:    https://localhost:3000"
echo "   Network:  https://\${LOCAL_IP}:3000"
echo ""
echo "📋 For Android testing:"
echo "   1. Connect your Android device to the same WiFi network"
echo "   2. Open Chrome on Android"
echo "   3. Visit: https://\${LOCAL_IP}:3000"
echo "   4. The certificate should be trusted (no security warning!)"
echo "   5. Install the PWA by tapping 'Setup Mobile App'"
echo ""

# Start Next.js with HTTPS
cd modern-dashboard
HTTPS=true SSL_CRT=../ssl/localhost.crt SSL_KEY=../ssl/localhost.key npm run dev -- --host 0.0.0.0 --port 3000
EOF

chmod +x start-https-dev.sh

# Create alternative method using ngrok
cat > start-ngrok-dev.sh << 'EOF'
#!/bin/bash

echo "🌐 Starting Android Agent with ngrok (alternative method)..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok not found. Installing ngrok..."
    
    # Install ngrok
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
        echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
        sudo apt update && sudo apt install ngrok
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install ngrok/ngrok/ngrok
    else
        echo "Please install ngrok manually from: https://ngrok.com/download"
        exit 1
    fi
fi

echo "📋 Instructions:"
echo "1. Sign up at https://ngrok.com and get your auth token"
echo "2. Run: ngrok config add-authtoken YOUR_TOKEN"
echo "3. Start the app in another terminal: cd modern-dashboard && npm run dev"
echo "4. Then run this script to expose it with HTTPS"
echo ""

# Start ngrok tunnel
ngrok http 3000
EOF

chmod +x start-ngrok-dev.sh

echo ""
echo -e "${GREEN}[SUCCESS]${NC} HTTPS development setup complete!"
echo ""
echo -e "${BLUE}[TESTING OPTIONS]${NC}"
echo ""
echo -e "${YELLOW}Option 1: Local HTTPS (Recommended)${NC}"
echo "1. Run: ./start-https-dev.sh"
echo "2. Connect Android device to same WiFi"
echo "3. Visit https://${LOCAL_IP}:3000 on Android"
echo "4. Certificate should be trusted automatically!"
echo ""
echo -e "${YELLOW}Option 2: ngrok Tunnel (If local doesn't work)${NC}"
echo "1. Run: ./start-ngrok-dev.sh"
echo "2. Follow the ngrok setup instructions"
echo "3. Use the https://xxx.ngrok.io URL on Android"
echo ""
echo -e "${BLUE}[NEXT STEPS]${NC}"
echo "Choose one of the options above to start testing!"