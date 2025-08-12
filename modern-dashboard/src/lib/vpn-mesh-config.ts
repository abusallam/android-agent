/**
 * VPN and Mesh Networking Configuration Helper
 * Provides easy setup for VPN tunnels and mesh networking capabilities
 */

export interface VPNConfig {
  type: 'wireguard' | 'openvpn' | 'tailscale';
  serverEndpoint: string;
  port: number;
  publicKey?: string;
  privateKey?: string;
  allowedIPs: string[];
  dns?: string[];
}

export interface MeshNetworkConfig {
  networkName: string;
  nodeId: string;
  peers: MeshPeer[];
  encryption: boolean;
  autoDiscovery: boolean;
}

export interface MeshPeer {
  id: string;
  endpoint: string;
  publicKey: string;
  allowedIPs: string[];
  persistentKeepalive?: number;
}

export class VPNMeshManager {
  /**
   * Generate WireGuard configuration for easy VPN setup
   */
  static generateWireGuardConfig(config: VPNConfig): string {
    return `
[Interface]
PrivateKey = ${config.privateKey}
Address = ${config.allowedIPs.join(', ')}
DNS = ${config.dns?.join(', ') || '1.1.1.1, 8.8.8.8'}

[Peer]
PublicKey = ${config.publicKey}
Endpoint = ${config.serverEndpoint}:${config.port}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
`.trim();
  }

  /**
   * Generate Tailscale setup commands
   */
  static generateTailscaleSetup(): string[] {
    return [
      '# Install Tailscale',
      'curl -fsSL https://tailscale.com/install.sh | sh',
      '',
      '# Start Tailscale',
      'sudo tailscale up',
      '',
      '# Get device IP',
      'tailscale ip -4',
      '',
      '# Enable subnet routing (optional)',
      'sudo tailscale up --advertise-routes=192.168.1.0/24',
      '',
      '# Enable exit node (optional)',
      'sudo tailscale up --advertise-exit-node'
    ];
  }

  /**
   * Generate mesh network configuration for B2B radio integration
   */
  static generateMeshConfig(config: MeshNetworkConfig): any {
    return {
      network: {
        name: config.networkName,
        nodeId: config.nodeId,
        encryption: config.encryption,
        autoDiscovery: config.autoDiscovery
      },
      peers: config.peers.map(peer => ({
        id: peer.id,
        endpoint: peer.endpoint,
        publicKey: peer.publicKey,
        allowedIPs: peer.allowedIPs,
        persistentKeepalive: peer.persistentKeepalive || 25
      })),
      routing: {
        protocol: 'babel', // Babel routing protocol for mesh
        metric: 'hop-count',
        convergenceTime: 30
      },
      radio: {
        frequency: '2.4GHz', // For B2B radio compatibility
        power: 'auto',
        antenna: 'omnidirectional',
        modulation: 'OFDM'
      }
    };
  }

  /**
   * Generate ngrok tunnel configuration for easy external access
   */
  static generateNgrokConfig(port: number = 3000): any {
    return {
      version: '2',
      authtoken: process.env.NGROK_AUTHTOKEN || 'your-ngrok-token-here',
      tunnels: {
        'android-agent': {
          proto: 'http',
          addr: port,
          bind_tls: true,
          inspect: false,
          auth: process.env.NGROK_AUTH || undefined
        },
        'android-agent-tcp': {
          proto: 'tcp',
          addr: port,
          remote_addr: `0.tcp.ngrok.io:${20000 + port}`
        }
      }
    };
  }

  /**
   * Generate Docker Compose configuration for VPN server
   */
  static generateVPNServerDockerCompose(): string {
    return `
version: '3.8'

services:
  wireguard:
    image: linuxserver/wireguard:latest
    container_name: android-agent-vpn
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=UTC
      - SERVERURL=auto
      - SERVERPORT=51820
      - PEERS=10
      - PEERDNS=auto
      - INTERNAL_SUBNET=10.13.13.0
      - ALLOWEDIPS=0.0.0.0/0
    volumes:
      - ./wireguard-config:/config
      - /lib/modules:/lib/modules
    ports:
      - "51820:51820/udp"
    sysctls:
      - net.ipv4.conf.all.src_valid_mark=1
    restart: unless-stopped
    networks:
      - android-agent-network

  tailscale:
    image: tailscale/tailscale:latest
    container_name: android-agent-tailscale
    hostname: android-agent-server
    environment:
      - TS_AUTHKEY=\${TAILSCALE_AUTHKEY}
      - TS_STATE_DIR=/var/lib/tailscale
      - TS_USERSPACE=false
    volumes:
      - tailscale-data:/var/lib/tailscale
      - /dev/net/tun:/dev/net/tun
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    restart: unless-stopped
    networks:
      - android-agent-network

networks:
  android-agent-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

volumes:
  tailscale-data:
`.trim();
  }

  /**
   * Generate mesh networking setup script for B2B radio
   */
  static generateMeshSetupScript(): string {
    return `
#!/bin/bash

# Android Agent AI - Mesh Networking Setup for B2B Radio
# This script sets up mesh networking capabilities for radio communication

echo "🌐 Setting up Mesh Networking for Android Agent AI"
echo "================================================="

# Install required packages
sudo apt update
sudo apt install -y batman-adv batctl bridge-utils iw hostapd

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

# Configure bridge for mesh network
sudo brctl addbr br-mesh
sudo brctl addif br-mesh bat0
sudo ip link set br-mesh up

# Start mesh routing daemon
sudo systemctl enable batman-adv
sudo systemctl start batman-adv

echo "✅ Mesh networking setup complete!"
echo "📡 Network: android-agent-mesh"
echo "🔗 Interface: bat0 (192.168.199.1/24)"
echo "📻 Radio: 2.4GHz Channel 1"

# Display mesh status
echo ""
echo "🔍 Mesh Network Status:"
sudo batctl n
sudo batctl o
`.trim();
  }

  /**
   * Generate quick VPN setup script
   */
  static generateQuickVPNSetup(): string {
    return `
#!/bin/bash

# Android Agent AI - Quick VPN Setup
# Choose your preferred VPN solution

echo "🔐 Android Agent AI - VPN Setup"
echo "==============================="
echo ""
echo "Choose your VPN solution:"
echo "1) WireGuard (Recommended - Fast & Secure)"
echo "2) Tailscale (Easiest - Zero Config)"
echo "3) OpenVPN (Traditional)"
echo "4) ngrok Tunnel (Development Only)"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
  1)
    echo "🚀 Setting up WireGuard..."
    sudo apt update && sudo apt install -y wireguard
    wg genkey | tee privatekey | wg pubkey > publickey
    echo "✅ WireGuard installed. Keys generated."
    echo "📝 Configure /etc/wireguard/wg0.conf with your settings"
    ;;
  2)
    echo "🚀 Setting up Tailscale..."
    curl -fsSL https://tailscale.com/install.sh | sh
    echo "✅ Tailscale installed. Run 'sudo tailscale up' to connect"
    ;;
  3)
    echo "🚀 Setting up OpenVPN..."
    sudo apt update && sudo apt install -y openvpn
    echo "✅ OpenVPN installed. Configure with your .ovpn file"
    ;;
  4)
    echo "🚀 Setting up ngrok tunnel..."
    if ! command -v ngrok &> /dev/null; then
      curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
      echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
      sudo apt update && sudo apt install ngrok
    fi
    echo "✅ ngrok installed. Set your authtoken: ngrok authtoken YOUR_TOKEN"
    echo "🌐 Start tunnel: ngrok http 3000"
    ;;
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "🎉 VPN setup complete!"
echo "🔗 Your Android Agent AI will be accessible securely"
`.trim();
  }
}

// Export configuration templates
export const VPN_TEMPLATES = {
  wireguard: VPNMeshManager.generateWireGuardConfig,
  tailscale: VPNMeshManager.generateTailscaleSetup,
  mesh: VPNMeshManager.generateMeshConfig,
  ngrok: VPNMeshManager.generateNgrokConfig,
  dockerCompose: VPNMeshManager.generateVPNServerDockerCompose,
  meshSetup: VPNMeshManager.generateMeshSetupScript,
  quickSetup: VPNMeshManager.generateQuickVPNSetup
};