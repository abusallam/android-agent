#!/bin/bash

# 🛡️ Android Agent AI - Docker Infrastructure Startup Script
# Complete setup with LiveKit, COTURN, PostgreSQL, Redis, and PWA Dashboard

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

header() {
    echo -e "${PURPLE}[ANDROID AGENT AI]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    log "✅ Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    log "✅ Docker Compose is available"
}

# Get external IP for COTURN
get_external_ip() {
    EXTERNAL_IP=$(curl -s https://ipinfo.io/ip 2>/dev/null || curl -s https://api.ipify.org 2>/dev/null || echo "127.0.0.1")
    log "🌐 External IP detected: $EXTERNAL_IP"
    export EXTERNAL_IP
}

# Create necessary directories
create_directories() {
    log "📁 Creating necessary directories..."
    mkdir -p nginx/ssl
    mkdir -p livekit/data
    mkdir -p postgres/data
    mkdir -p redis/data
    log "✅ Directories created"
}

# Generate SSL certificates (self-signed for development)
generate_ssl_certs() {
    if [ ! -f "nginx/ssl/cert.pem" ]; then
        log "🔐 Generating self-signed SSL certificates..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=AndroidAgent/CN=localhost" \
            2>/dev/null || warning "OpenSSL not available, skipping SSL certificate generation"
    fi
}

# Update environment variables
update_env_vars() {
    log "🔧 Updating environment variables..."
    
    # Update LiveKit configuration to use local server
    if [ -f "modern-dashboard/.env.local" ]; then
        sed -i.bak "s|LIVEKIT_URL=.*|LIVEKIT_URL=ws://localhost:7880|g" modern-dashboard/.env.local
        sed -i.bak "s|NEXT_PUBLIC_LIVEKIT_URL=.*|NEXT_PUBLIC_LIVEKIT_URL=ws://localhost:7880|g" modern-dashboard/.env.local
        log "✅ Environment variables updated"
    fi
}

# Start the infrastructure
start_infrastructure() {
    header "🚀 Starting Android Agent AI Infrastructure"
    
    log "📦 Starting PostgreSQL and Redis..."
    docker-compose up -d postgres redis
    
    log "⏳ Waiting for database to be ready..."
    sleep 10
    
    log "🌐 Starting COTURN server..."
    docker-compose up -d coturn
    
    log "⏳ Waiting for COTURN to be ready..."
    sleep 5
    
    log "🎥 Starting LiveKit server..."
    docker-compose up -d livekit
    
    log "⏳ Waiting for LiveKit to be ready..."
    sleep 10
    
    log "🛡️ Building and starting Android Agent application..."
    docker-compose up -d android-agent
    
    log "⏳ Waiting for application to be ready..."
    sleep 15
    
    log "🌐 Starting Nginx reverse proxy..."
    docker-compose up -d nginx
    
    log "✅ All services started successfully!"
}

# Check service health
check_health() {
    header "🏥 Checking Service Health"
    
    services=("postgres" "redis" "coturn" "livekit" "android-agent" "nginx")
    
    for service in "${services[@]}"; do
        if docker-compose ps | grep -q "$service.*Up"; then
            log "✅ $service is running"
        else
            warning "⚠️  $service may not be running properly"
        fi
    done
    
    # Test API endpoints
    log "🧪 Testing API endpoints..."
    sleep 5
    
    if curl -s http://localhost:3000/api/health > /dev/null; then
        log "✅ Android Agent API is responding"
    else
        warning "⚠️  Android Agent API is not responding yet"
    fi
    
    if curl -s http://localhost:7880/ > /dev/null; then
        log "✅ LiveKit server is responding"
    else
        warning "⚠️  LiveKit server is not responding yet"
    fi
}

# Show access information
show_access_info() {
    header "🌐 Access Information"
    
    echo ""
    echo -e "${GREEN}📱 Android Agent AI Dashboard:${NC}"
    echo -e "   🖥️  PC Access:     ${BLUE}http://localhost:3000${NC}"
    echo -e "   🌐 Network Access: ${BLUE}http://$(hostname -I | awk '{print $1}'):3000${NC}"
    echo -e "   🔒 HTTPS Access:   ${BLUE}https://localhost${NC} (if SSL enabled)"
    echo ""
    echo -e "${GREEN}🎥 LiveKit Server:${NC}"
    echo -e "   📡 WebRTC:         ${BLUE}ws://localhost:7880${NC}"
    echo -e "   🌐 Network:        ${BLUE}ws://$(hostname -I | awk '{print $1}'):7880${NC}"
    echo ""
    echo -e "${GREEN}🌐 COTURN Server:${NC}"
    echo -e "   📡 STUN/TURN:      ${BLUE}stun:localhost:3478${NC}"
    echo -e "   🔐 Credentials:    ${BLUE}androidagent:coturn_password_2024${NC}"
    echo ""
    echo -e "${GREEN}🗄️ Database Access:${NC}"
    echo -e "   🐘 PostgreSQL:     ${BLUE}localhost:5432${NC}"
    echo -e "   🔴 Redis:          ${BLUE}localhost:6379${NC}"
    echo ""
    echo -e "${GREEN}🔑 Login Credentials:${NC}"
    echo -e "   👤 Username:       ${BLUE}admin${NC}"
    echo -e "   🔒 Password:       ${BLUE}admin${NC}"
    echo ""
    echo -e "${GREEN}🔧 Management Commands:${NC}"
    echo -e "   📊 View logs:      ${BLUE}docker-compose logs -f${NC}"
    echo -e "   🛑 Stop services:  ${BLUE}docker-compose down${NC}"
    echo -e "   🔄 Restart:        ${BLUE}docker-compose restart${NC}"
    echo -e "   📈 Monitor:        ${BLUE}docker-compose ps${NC}"
    echo ""
}

# Show port information
show_port_info() {
    header "🔌 Port Configuration"
    
    echo ""
    echo -e "${GREEN}📡 Required Ports (ensure these are open):${NC}"
    echo ""
    echo -e "${BLUE}Application Ports:${NC}"
    echo -e "   3000/tcp  - Android Agent Dashboard"
    echo -e "   7880/tcp  - LiveKit WebRTC"
    echo -e "   7881/tcp  - LiveKit TURN"
    echo -e "   7882/tcp  - LiveKit HTTP API"
    echo ""
    echo -e "${BLUE}COTURN Ports:${NC}"
    echo -e "   3478/udp  - STUN/TURN"
    echo -e "   3478/tcp  - STUN/TURN"
    echo -e "   3479/udp  - Alt STUN/TURN"
    echo -e "   3479/tcp  - Alt STUN/TURN"
    echo -e "   5349/udp  - STUN/TURN TLS"
    echo -e "   5349/tcp  - STUN/TURN TLS"
    echo -e "   5350/udp  - Alt STUN/TURN TLS"
    echo -e "   5350/tcp  - Alt STUN/TURN TLS"
    echo -e "   49152-65535/udp - Media relay ports"
    echo ""
    echo -e "${BLUE}Database Ports:${NC}"
    echo -e "   5432/tcp  - PostgreSQL"
    echo -e "   6379/tcp  - Redis"
    echo ""
    echo -e "${BLUE}Web Server Ports:${NC}"
    echo -e "   80/tcp    - HTTP (Nginx)"
    echo -e "   443/tcp   - HTTPS (Nginx)"
    echo ""
    echo -e "${YELLOW}⚠️  For external access, ensure these ports are open in your firewall!${NC}"
    echo ""
}

# Main execution
main() {
    header "🛡️ Android Agent AI - Docker Infrastructure Setup"
    echo ""
    
    # Pre-flight checks
    check_docker
    check_docker_compose
    get_external_ip
    
    # Setup
    create_directories
    generate_ssl_certs
    update_env_vars
    
    # Start services
    start_infrastructure
    
    # Health checks
    check_health
    
    # Show information
    show_access_info
    show_port_info
    
    header "🎉 Android Agent AI is now running!"
    log "🚀 Ready for WebRTC streaming with camera, microphone, and screen sharing!"
    echo ""
}

# Handle script arguments
case "${1:-start}" in
    "start")
        main
        ;;
    "stop")
        header "🛑 Stopping Android Agent AI Infrastructure"
        docker-compose down
        log "✅ All services stopped"
        ;;
    "restart")
        header "🔄 Restarting Android Agent AI Infrastructure"
        docker-compose down
        sleep 5
        main
        ;;
    "logs")
        header "📊 Showing Service Logs"
        docker-compose logs -f
        ;;
    "status")
        header "📈 Service Status"
        docker-compose ps
        check_health
        ;;
    "clean")
        header "🧹 Cleaning Up Docker Resources"
        docker-compose down -v --remove-orphans
        docker system prune -f
        log "✅ Cleanup completed"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|status|clean}"
        echo ""
        echo "Commands:"
        echo "  start   - Start all services (default)"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  logs    - Show service logs"
        echo "  status  - Show service status"
        echo "  clean   - Clean up Docker resources"
        exit 1
        ;;
esac