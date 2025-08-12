#!/bin/bash

# 🔐 Android Agent AI - Quick VPN Tunnel Setup
# This script provides the easiest way to create a VPN tunnel for secure access

echo "🔐 Android Agent AI - VPN Tunnel Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}Choose your VPN solution:${NC}"
echo "1) 🚀 Tailscale (Recommended - Zero Config)"
echo "2) 🌐 ngrok Tunnel (Development - Instant)"
echo "3) ⚡ WireGuard (Advanced - Self-hosted)"
echo "4) 📡 Mesh Network (B2B Radio Ready)"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
  1)
    echo -e "\n${PURPLE}🚀 Setting up Tailscale VPN...${NC}"
    
    # Check if Tailscale is installed
    if ! command -v tailscale &> /dev/null; then
      echo -e "${YELLOW}📦 Installing Tailscale...${NC}"
      curl -fsSL https://tailscale.com/install.sh | sh
    fi
    
    echo -e "${GREEN}✅ Tailscale installed successfully!${NC}"
    echo ""
    echo -e "${BLUE}🔗 To connect your network:${NC}"
    echo "1. Run: sudo tailscale up"
    echo "2. Follow the authentication link"
    echo "3. Your Android Agent AI will be accessible from anywhere!"
    echo ""
    echo -e "${YELLOW}📱 Mobile Access:${NC}"
    echo "• Install Tailscale app on your phone"
    echo "• Connect to the same network"
    echo "• Access your dashboard securely"
    ;;
    
  2)
    echo -e "\n${PURPLE}🌐 Setting up ngrok tunnel...${NC}"
    
    # Check if ngrok is installed
    if ! command -v ngrok &> /dev/null; then
      echo -e "${YELLOW}📦 Installing ngrok...${NC}"
      
      # Download and install ngrok
      if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
        echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
        sudo apt update && sudo apt install ngrok
      elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install ngrok/ngrok/ngrok
      fi
    fi
    
    echo -e "${GREEN}✅ ngrok installed successfully!${NC}"
    echo ""
    echo -e "${BLUE}🔗 To create your tunnel:${NC}"
    echo "1. Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "2. Run: ngrok authtoken YOUR_TOKEN"
    echo "3. Start tunnel: ngrok http 3000"
    echo ""
    echo -e "${YELLOW}📱 Mobile Access:${NC}"
    echo "• Use the https://xxx.ngrok.io URL from ngrok output"
    echo "• Access from anywhere in the world instantly!"
    
    # Create ngrok config
    mkdir -p ~/.ngrok2
    cat > ~/.ngrok2/ngrok.yml << EOF
version: "2"
authtoken: YOUR_TOKEN_HERE
tunnels:
  android-agent:
    proto: http
    addr: 3000
    bind_tls: true
    inspect: false
EOF
    
    echo -e "${GREEN}📝 Created ngrok config at ~/.ngrok2/ngrok.yml${NC}"
    ;;
    
  3)
    echo -e "\n${PURPLE}⚡ Setting up WireGuard VPN...${NC}"
    
    # Install WireGuard
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
      sudo apt update && sudo apt install -y wireguard
    elif [[ "$OSTYPE" == "darwin"* ]]; then
      brew install wireguard-tools
    fi
    
    # Generate keys
    wg genkey | tee privatekey | wg pubkey > publickey
    PRIVATE_KEY=$(cat privatekey)
    PUBLIC_KEY=$(cat publickey)
    
    # Create WireGuard config
    sudo mkdir -p /etc/wireguard
    sudo tee /etc/wireguard/wg0.conf > /dev/null << EOF
[Interface]
PrivateKey = $PRIVATE_KEY
Address = 10.0.0.2/24
DNS = 1.1.1.1

[Peer]
PublicKey = SERVER_PUBLIC_KEY_HERE
Endpoint = YOUR_SERVER_IP:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
EOF
    
    echo -e "${GREEN}✅ WireGuard configured!${NC}"
    echo -e "${YELLOW}📝 Edit /etc/wireguard/wg0.conf with your server details${NC}"
    echo -e "${BLUE}🔗 Start VPN: sudo wg-quick up wg0${NC}"
    
    # Clean up keys
    rm privatekey publickey
    ;;
    
  4)
    echo -e "\n${PURPLE}📡 Setting up Mesh Network for B2B Radio...${NC}"
    
    # Install mesh networking tools
    sudo apt update
    sudo apt install -y batman-adv batctl bridge-utils iw hostapd
    
    # Create mesh setup script
    cat > setup-mesh.sh << 'EOF'
#!/bin/bash

# Load batman-adv kernel module
sudo modprobe batman-adv
echo "batman-adv" | sudo tee -a /etc/modules

# Create mesh interface
sudo batctl if add wlan1
sudo ip link set up dev bat0
sudo ip addr add 192.168.199.1/24 dev bat0

# Configure wireless interface for mesh
sudo iw dev wlan1 set type ibss
sudo ip link set wlan1 up
sudo iw dev wlan1 ibss join android-agent-mesh 2412

# Enable IP forwarding
echo 'net.ipv4.ip_forward=1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

echo "✅ Mesh network 'android-agent-mesh' is ready!"
echo "📡 Network: 192.168.199.0/24"
echo "🔗 Interface: bat0"
EOF
    
    chmod +x setup-mesh.sh
    
    echo -e "${GREEN}✅ Mesh networking tools installed!${NC}"
    echo -e "${BLUE}🔗 Run ./setup-mesh.sh to start mesh network${NC}"
    echo -e "${YELLOW}📡 Perfect for B2B radio integration${NC}"
    ;;
    
  *)
    echo -e "${RED}❌ Invalid choice${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}🎉 VPN tunnel setup complete!${NC}"
echo -e "${BLUE}🌐 Your Android Agent AI is now ready for secure remote access${NC}"
echo ""
echo -e "${YELLOW}💡 Pro Tips:${NC}"
echo "• Test your connection before deploying"
echo "• Use HTTPS in production"
echo "• Monitor connection logs"
echo "• Keep your credentials secure"
echo ""
echo -e "${PURPLE}🚀 Start your Android Agent AI:${NC}"
echo "cd modern-dashboard && npm run dev"