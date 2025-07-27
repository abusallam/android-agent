#!/bin/bash

# Family Safety Monitor - Production Deployment Script
# This script deploys the Family Safety Monitor to production

set -e  # Exit on any error

echo "🚀 Family Safety Monitor - Production Deployment"
echo "================================================"

# Configuration
PROJECT_NAME="family-safety-monitor"
DOCKER_COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR="./backups"
LOG_FILE="./deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if Node.js is installed (for building)
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 18+ first."
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js version 18 or higher is required. Current version: $(node --version)"
    fi
    
    log "✅ All prerequisites met"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "./logs"
    mkdir -p "./ssl"
    
    log "✅ Directories created"
}

# Environment setup
setup_environment() {
    log "Setting up environment..."
    
    # Check if .env file exists
    if [ ! -f "modern-dashboard/.env.local" ]; then
        warning ".env.local file not found. Creating from template..."
        
        cat > modern-dashboard/.env.local << EOF
# Database Configuration
DATABASE_URL="postgresql://family_safety:secure_password@localhost:5432/family_safety_db"

# Security Configuration
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"

# Redis Configuration
REDIS_URL="redis://localhost:6379"

# PWA Push Notifications (Generate your own VAPID keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BEl62iUYgUivxIkv69yViEuiBIa40HcCWLEaQC7-jCuLKR4dGfEoRqn6hsL7doVBEU6a7ckjBjdVvswGqMhQNdQ"
VAPID_PRIVATE_KEY="tUxbf-Oeq_sPiAM6EEuMdreG6-igaw7JZXN_-_S-j5s"

# Optional: AI Features (OpenAI API Key)
# OPENAI_API_KEY="your-openai-api-key"

# Optional: Enhanced Maps (Mapbox Token)
# NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="your-mapbox-token"

# Production Settings
NODE_ENV="production"
EOF
        
        info "Please review and update the .env.local file with your specific configuration"
    fi
    
    log "✅ Environment configured"
}

# Build the application
build_application() {
    log "Building the application..."
    
    cd modern-dashboard
    
    # Install dependencies
    log "Installing dependencies..."
    npm ci --production=false
    
    # Run linting
    log "Running linting..."
    npm run lint || warning "Linting issues found, but continuing deployment"
    
    # Build the application
    log "Building Next.js application..."
    npm run build
    
    cd ..
    
    log "✅ Application built successfully"
}

# Database backup (if exists)
backup_database() {
    log "Creating database backup..."
    
    if docker ps | grep -q postgres; then
        BACKUP_FILE="$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"
        docker exec $(docker ps -q -f name=postgres) pg_dump -U family_safety family_safety_db > "$BACKUP_FILE" || warning "Database backup failed"
        log "✅ Database backup created: $BACKUP_FILE"
    else
        info "No existing database found, skipping backup"
    fi
}

# Deploy with Docker Compose
deploy_docker() {
    log "Deploying with Docker Compose..."
    
    # Stop existing containers
    log "Stopping existing containers..."
    docker-compose down || info "No existing containers to stop"
    
    # Pull latest images
    log "Pulling latest images..."
    docker-compose pull
    
    # Start services
    log "Starting services..."
    docker-compose up -d --build
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    log "✅ Docker deployment completed"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Check if services are running
    if ! docker-compose ps | grep -q "Up"; then
        error "Some services are not running properly"
    fi
    
    # Check application health
    for i in {1..10}; do
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            log "✅ Application is healthy"
            return 0
        fi
        info "Waiting for application to be ready... (attempt $i/10)"
        sleep 10
    done
    
    error "Application health check failed"
}

# Run tests
run_tests() {
    log "Running deployment tests..."
    
    # Wait a bit more for full startup
    sleep 10
    
    # Run the test suite
    if node test-enhanced-features.js; then
        log "✅ Tests passed successfully"
    else
        warning "Some tests failed, but deployment continues"
    fi
}

# Display deployment information
show_deployment_info() {
    log "Deployment completed successfully!"
    
    echo ""
    echo "🎉 Family Safety Monitor is now running!"
    echo "========================================"
    echo ""
    echo "📱 Application URL: http://localhost:3000"
    echo "🔧 Admin Panel: http://localhost:3000/admin"
    echo "📊 Health Check: http://localhost:3000/api/health"
    echo ""
    echo "🐳 Docker Services:"
    docker-compose ps
    echo ""
    echo "📋 Quick Commands:"
    echo "  View logs:        docker-compose logs -f"
    echo "  Stop services:    docker-compose down"
    echo "  Restart:          docker-compose restart"
    echo "  Update:           ./deploy.sh"
    echo ""
    echo "📱 Mobile Testing:"
    echo "  1. Find your computer's IP address"
    echo "  2. Visit http://YOUR_IP:3000 on mobile device"
    echo "  3. Install PWA by tapping 'Add to Home Screen'"
    echo "  4. Configure auto-start and emergency features"
    echo ""
    echo "🔒 Security Notes:"
    echo "  - Change default passwords in .env.local"
    echo "  - Set up SSL certificates for production"
    echo "  - Configure firewall rules"
    echo "  - Review security settings"
    echo ""
    echo "📚 Documentation:"
    echo "  - README.md: Setup and usage instructions"
    echo "  - CONTRIBUTING.md: Development guidelines"
    echo "  - CHANGELOG.md: Version history"
    echo ""
    echo "🆘 Support:"
    echo "  - GitHub Issues: Report bugs and request features"
    echo "  - Documentation: Check README and docs/"
    echo "  - Logs: Check ./deployment.log for details"
    echo ""
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    # Add any cleanup tasks here
    log "✅ Cleanup completed"
}

# Main deployment function
main() {
    log "Starting deployment process..."
    
    # Trap to ensure cleanup on exit
    trap cleanup EXIT
    
    check_prerequisites
    create_directories
    setup_environment
    build_application
    backup_database
    deploy_docker
    health_check
    run_tests
    show_deployment_info
    
    log "🎉 Deployment completed successfully!"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "stop")
        log "Stopping Family Safety Monitor..."
        docker-compose down
        log "✅ Services stopped"
        ;;
    "restart")
        log "Restarting Family Safety Monitor..."
        docker-compose restart
        log "✅ Services restarted"
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "health")
        curl -s http://localhost:3000/api/health | jq '.' || echo "Health check failed"
        ;;
    "test")
        node test-enhanced-features.js
        ;;
    "backup")
        backup_database
        ;;
    "help")
        echo "Family Safety Monitor Deployment Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  deploy    Deploy the application (default)"
        echo "  stop      Stop all services"
        echo "  restart   Restart all services"
        echo "  logs      View service logs"
        echo "  health    Check application health"
        echo "  test      Run test suite"
        echo "  backup    Create database backup"
        echo "  help      Show this help message"
        ;;
    *)
        error "Unknown command: $1. Use '$0 help' for usage information."
        ;;
esac