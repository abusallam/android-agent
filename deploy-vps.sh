#!/bin/bash
# TacticalOps Platform - VPS Deployment Script
# Non-disruptive deployment to existing VPS with Nginx and Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="tacticalops"
APP_DIR="/opt/${APP_NAME}"
BACKUP_DIR="/opt/backups/${APP_NAME}"
NGINX_SITES_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
DOCKER_NETWORK="${APP_NAME}-network"

# Default values
DOMAIN=""
VPS_IP=""
SSH_USER="root"
DEPLOYMENT_TIER="civilian"
SKIP_BACKUP=false
FORCE_DEPLOY=false
DRY_RUN=false

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}"
}

# Function to show usage
show_usage() {
    cat << EOF
TacticalOps Platform - VPS Deployment Script

Usage: $0 [OPTIONS]

OPTIONS:
    -d, --domain DOMAIN         Domain name for the deployment
    -i, --ip IP                 VPS IP address
    -u, --user USER             SSH user (default: root)
    -t, --tier TIER             Deployment tier: civilian|government|military (default: civilian)
    -s, --skip-backup           Skip backup creation
    -f, --force                 Force deployment even if conflicts exist
    -n, --dry-run               Show what would be done without executing
    -h, --help                  Show this help message

EXAMPLES:
    $0 -d tacticalops.example.com -i 192.168.1.100
    $0 -d tactical.gov -i 10.0.0.50 -t government -u admin
    $0 --domain mil.tactical.ops --ip 172.16.0.10 --tier military --force

ENVIRONMENT VARIABLES:
    VPS_SSH_KEY                 Path to SSH private key (default: ~/.ssh/id_rsa)
    DEPLOYMENT_BRANCH           Git branch to deploy (default: main)
    BUILD_VERSION               Version tag for Docker images (default: latest)

EOF
}

# Function to parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--domain)
                DOMAIN="$2"
                shift 2
                ;;
            -i|--ip)
                VPS_IP="$2"
                shift 2
                ;;
            -u|--user)
                SSH_USER="$2"
                shift 2
                ;;
            -t|--tier)
                DEPLOYMENT_TIER="$2"
                shift 2
                ;;
            -s|--skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            -f|--force)
                FORCE_DEPLOY=true
                shift
                ;;
            -n|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Validate required parameters
    if [[ -z "$DOMAIN" ]]; then
        error "Domain is required. Use -d or --domain option."
        exit 1
    fi
    
    if [[ -z "$VPS_IP" ]]; then
        error "VPS IP is required. Use -i or --ip option."
        exit 1
    fi
    
    # Validate deployment tier
    if [[ ! "$DEPLOYMENT_TIER" =~ ^(civilian|government|military)$ ]]; then
        error "Invalid deployment tier: $DEPLOYMENT_TIER. Must be civilian, government, or military."
        exit 1
    fi
}

# Function to execute command on VPS
vps_exec() {
    local command="$1"
    local description="$2"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "[DRY RUN] Would execute on VPS: $command"
        return 0
    fi
    
    if [[ -n "$description" ]]; then
        log "$description"
    fi
    
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        ${VPS_SSH_KEY:+-i "$VPS_SSH_KEY"} \
        "$SSH_USER@$VPS_IP" "$command"
}

# Function to copy file to VPS
vps_copy() {
    local local_path="$1"
    local remote_path="$2"
    local description="$3"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "[DRY RUN] Would copy: $local_path -> $SSH_USER@$VPS_IP:$remote_path"
        return 0
    fi
    
    if [[ -n "$description" ]]; then
        log "$description"
    fi
    
    scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        ${VPS_SSH_KEY:+-i "$VPS_SSH_KEY"} \
        "$local_path" "$SSH_USER@$VPS_IP:$remote_path"
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if required commands are available locally
    local required_commands="ssh scp docker docker-compose git"
    for cmd in $required_commands; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            error "Required command not found: $cmd"
            exit 1
        fi
    done
    
    # Check SSH connectivity
    if ! ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
         ${VPS_SSH_KEY:+-i "$VPS_SSH_KEY"} \
         "$SSH_USER@$VPS_IP" "echo 'SSH connection successful'" >/dev/null 2>&1; then
        error "Cannot connect to VPS via SSH: $SSH_USER@$VPS_IP"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Function to analyze VPS environment
analyze_vps_environment() {
    log "Analyzing VPS environment..."
    
    # Get system information
    local os_info
    os_info=$(vps_exec "cat /etc/os-release | grep PRETTY_NAME" "Getting OS information")
    log "OS: $os_info"
    
    # Check Docker installation
    if vps_exec "docker --version" "Checking Docker installation" >/dev/null 2>&1; then
        local docker_version
        docker_version=$(vps_exec "docker --version")
        log "Docker: $docker_version"
    else
        error "Docker is not installed on the VPS"
        exit 1
    fi
    
    # Check Docker Compose installation
    if vps_exec "docker-compose --version" "Checking Docker Compose installation" >/dev/null 2>&1; then
        local compose_version
        compose_version=$(vps_exec "docker-compose --version")
        log "Docker Compose: $compose_version"
    else
        error "Docker Compose is not installed on the VPS"
        exit 1
    fi
    
    # Check Nginx installation
    if vps_exec "nginx -v" "Checking Nginx installation" >/dev/null 2>&1; then
        local nginx_version
        nginx_version=$(vps_exec "nginx -v" 2>&1)
        log "Nginx: $nginx_version"
    else
        error "Nginx is not installed on the VPS"
        exit 1
    fi
    
    # Check existing containers
    log "Existing Docker containers:"
    vps_exec "docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'" ""
    
    # Check existing networks
    log "Existing Docker networks:"
    vps_exec "docker network ls" ""
    
    # Check port usage
    log "Checking port usage..."
    local ports_to_check="80 443 3000 3001 5432 6379 9090"
    for port in $ports_to_check; do
        if vps_exec "netstat -tlnp | grep :$port" "" >/dev/null 2>&1; then
            warn "Port $port is in use"
            vps_exec "netstat -tlnp | grep :$port" ""
        else
            log "Port $port is available"
        fi
    done
    
    success "VPS environment analysis completed"
}

# Function to create backup
create_backup() {
    if [[ "$SKIP_BACKUP" == "true" ]]; then
        log "Skipping backup creation as requested"
        return 0
    fi
    
    log "Creating backup..."
    
    local backup_timestamp
    backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/$backup_timestamp"
    
    # Create backup directory
    vps_exec "mkdir -p $backup_path" "Creating backup directory"
    
    # Backup Nginx configuration
    vps_exec "cp -r /etc/nginx $backup_path/" "Backing up Nginx configuration"
    
    # Backup existing TacticalOps installation if it exists
    if vps_exec "test -d $APP_DIR" "" >/dev/null 2>&1; then
        vps_exec "tar -czf $backup_path/tacticalops-app.tar.gz -C $APP_DIR ." "Backing up existing TacticalOps installation"
    fi
    
    # Backup Docker containers and images
    vps_exec "docker ps -a --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}' > $backup_path/docker-containers.txt" "Backing up Docker container list"
    vps_exec "docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.ID}}' > $backup_path/docker-images.txt" "Backing up Docker image list"
    
    # Create backup manifest
    vps_exec "cat > $backup_path/manifest.txt << EOF
Backup created: $(date)
VPS IP: $VPS_IP
Domain: $DOMAIN
Deployment Tier: $DEPLOYMENT_TIER
Backup Path: $backup_path
EOF" "Creating backup manifest"
    
    success "Backup created at $backup_path"
}

# Function to prepare deployment
prepare_deployment() {
    log "Preparing deployment..."
    
    # Create application directory
    vps_exec "mkdir -p $APP_DIR" "Creating application directory"
    
    # Create data and logs directories
    vps_exec "mkdir -p $APP_DIR/data/{postgres,redis,prometheus,grafana,loki,uploads}" "Creating data directories"
    vps_exec "mkdir -p $APP_DIR/logs/{app,nginx,postgres,redis,backup}" "Creating log directories"
    vps_exec "mkdir -p $APP_DIR/ssl" "Creating SSL directory"
    vps_exec "mkdir -p $APP_DIR/nginx/sites-enabled" "Creating Nginx configuration directory"
    vps_exec "mkdir -p $APP_DIR/monitoring/{prometheus,grafana,loki,promtail}" "Creating monitoring directories"
    vps_exec "mkdir -p $APP_DIR/scripts" "Creating scripts directory"
    
    # Set proper permissions
    vps_exec "chown -R 1001:1001 $APP_DIR/data $APP_DIR/logs" "Setting data directory permissions"
    vps_exec "chmod -R 755 $APP_DIR" "Setting application directory permissions"
    
    success "Deployment preparation completed"
}

# Function to deploy application files
deploy_application() {
    log "Deploying application files..."
    
    # Copy Docker Compose configuration
    vps_copy "docker-compose.production.yml" "$APP_DIR/docker-compose.yml" "Copying Docker Compose configuration"
    
    # Copy environment configuration
    vps_copy ".env.production.example" "$APP_DIR/.env.example" "Copying environment configuration template"
    
    # Copy application source (if deploying from local)
    if [[ -d "modern-dashboard" ]]; then
        log "Copying application source..."
        tar -czf /tmp/tacticalops-app.tar.gz modern-dashboard/ scripts/ nginx/ monitoring/ --exclude=node_modules --exclude=.next
        vps_copy "/tmp/tacticalops-app.tar.gz" "$APP_DIR/app.tar.gz" "Copying application archive"
        vps_exec "cd $APP_DIR && tar -xzf app.tar.gz && rm app.tar.gz" "Extracting application files"
        rm -f /tmp/tacticalops-app.tar.gz
    else
        # Clone from repository
        local branch="${DEPLOYMENT_BRANCH:-main}"
        vps_exec "cd $APP_DIR && git clone -b $branch https://github.com/yourusername/tacticalops.git ." "Cloning application from repository"
    fi
    
    # Copy configuration files
    vps_copy "nginx/tacticalops.conf" "$APP_DIR/nginx/tacticalops.conf" "Copying Nginx site configuration"
    vps_copy "monitoring/prometheus.yml" "$APP_DIR/monitoring/prometheus/prometheus.yml" "Copying Prometheus configuration"
    vps_copy "monitoring/grafana/" "$APP_DIR/monitoring/grafana/" "Copying Grafana configuration"
    
    success "Application files deployed"
}

# Function to configure environment
configure_environment() {
    log "Configuring environment..."
    
    # Generate secure secrets if .env doesn't exist
    if ! vps_exec "test -f $APP_DIR/.env" "" >/dev/null 2>&1; then
        log "Generating environment configuration..."
        
        # Generate secure random keys
        local jwt_secret
        local encryption_key
        local session_secret
        local db_password
        local redis_password
        local grafana_password
        
        jwt_secret=$(openssl rand -base64 32)
        encryption_key=$(openssl rand -base64 32)
        session_secret=$(openssl rand -base64 32)
        db_password=$(openssl rand -base64 16)
        redis_password=$(openssl rand -base64 16)
        grafana_password=$(openssl rand -base64 12)
        
        # Create .env file
        vps_exec "cat > $APP_DIR/.env << EOF
# TacticalOps Platform - Production Environment
NODE_ENV=production
DEPLOYMENT_TIER=$DEPLOYMENT_TIER
DOMAIN=$DOMAIN

# Database
DB_NAME=tacticalops
DB_USER=tacticalops
DB_PASSWORD=$db_password
DATABASE_URL=postgresql://tacticalops:$db_password@postgres:5432/tacticalops

# Redis
REDIS_PASSWORD=$redis_password
REDIS_URL=redis://:$redis_password@redis:6379

# Security
JWT_SECRET=$jwt_secret
ENCRYPTION_KEY=$encryption_key
SESSION_SECRET=$session_secret
AGENT_API_KEY=$(openssl rand -base64 24)

# Monitoring
GRAFANA_PASSWORD=$grafana_password

# Paths
DATA_PATH=$APP_DIR/data
LOGS_PATH=$APP_DIR/logs

# Features based on tier
$(case $DEPLOYMENT_TIER in
    civilian)
        echo "FEATURES_ENABLED=basic,mapping,emergency,communication"
        ;;
    government)
        echo "FEATURES_ENABLED=enhanced,mapping,emergency,communication,analytics,compliance"
        ;;
    military)
        echo "FEATURES_ENABLED=full,mapping,emergency,communication,analytics,compliance,tactical,intelligence"
        ;;
esac)
EOF" "Creating environment configuration"
        
        success "Environment configuration created with secure secrets"
    else
        log "Environment configuration already exists, skipping generation"
    fi
}

# Function to configure Nginx
configure_nginx() {
    log "Configuring Nginx..."
    
    # Create Nginx site configuration
    vps_exec "cat > $NGINX_SITES_DIR/tacticalops << 'EOF'
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL Configuration (will be updated by certbot)
    ssl_certificate /etc/ssl/certs/tacticalops.crt;
    ssl_private_key /etc/ssl/private/tacticalops.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection \"1; mode=block\";
    add_header Strict-Transport-Security \"max-age=63072000; includeSubDomains; preload\";

    # Rate Limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;

    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # API endpoints with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Monitoring endpoints (restricted access)
    location /grafana/ {
        allow 127.0.0.1;
        allow 10.0.0.0/8;
        allow 172.16.0.0/12;
        allow 192.168.0.0/16;
        deny all;
        
        proxy_pass http://localhost:3001/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files
    location /static/ {
        alias $APP_DIR/static/;
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }
}
EOF" "Creating Nginx site configuration"
    
    # Enable the site
    vps_exec "ln -sf $NGINX_SITES_DIR/tacticalops $NGINX_ENABLED_DIR/" "Enabling Nginx site"
    
    # Test Nginx configuration
    if vps_exec "nginx -t" "Testing Nginx configuration"; then
        success "Nginx configuration is valid"
    else
        error "Nginx configuration test failed"
        exit 1
    fi
}

# Function to setup SSL certificate
setup_ssl() {
    log "Setting up SSL certificate..."
    
    # Install certbot if not present
    vps_exec "which certbot || (apt update && apt install -y certbot python3-certbot-nginx)" "Installing certbot"
    
    # Obtain SSL certificate
    if vps_exec "certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN" "Obtaining SSL certificate"; then
        success "SSL certificate obtained successfully"
    else
        warn "SSL certificate setup failed, using self-signed certificate"
        
        # Create self-signed certificate as fallback
        vps_exec "openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                  -keyout /etc/ssl/private/tacticalops.key \
                  -out /etc/ssl/certs/tacticalops.crt \
                  -subj \"/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN\"" "Creating self-signed certificate"
    fi
}

# Function to deploy containers
deploy_containers() {
    log "Deploying Docker containers..."
    
    # Create Docker network if it doesn't exist
    vps_exec "docker network create $DOCKER_NETWORK --driver bridge || true" "Creating Docker network"
    
    # Build and start containers
    vps_exec "cd $APP_DIR && docker-compose pull" "Pulling Docker images"
    vps_exec "cd $APP_DIR && docker-compose build --no-cache" "Building application image"
    vps_exec "cd $APP_DIR && docker-compose up -d" "Starting containers"
    
    # Wait for services to start
    log "Waiting for services to start..."
    sleep 30
    
    # Check container status
    vps_exec "cd $APP_DIR && docker-compose ps" "Checking container status"
    
    success "Containers deployed successfully"
}

# Function to perform health checks
perform_health_checks() {
    log "Performing health checks..."
    
    local max_attempts=12
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log "Health check attempt $attempt/$max_attempts"
        
        if vps_exec "curl -f http://localhost:3000/api/v2/health" "Checking application health" >/dev/null 2>&1; then
            success "Application health check passed"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error "Application health check failed after $max_attempts attempts"
            vps_exec "cd $APP_DIR && docker-compose logs --tail=50" "Showing container logs"
            exit 1
        fi
        
        log "Waiting 10 seconds before next attempt..."
        sleep 10
        ((attempt++))
    done
    
    # Check external access
    if curl -f "https://$DOMAIN/api/v2/health" >/dev/null 2>&1; then
        success "External health check passed"
    else
        warn "External health check failed - check DNS and firewall settings"
    fi
}

# Function to setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Setup log rotation
    vps_exec "cat > /etc/logrotate.d/tacticalops << 'EOF'
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 1001 1001
    postrotate
        docker-compose -f $APP_DIR/docker-compose.yml restart tacticalops-app
    endscript
}
EOF" "Setting up log rotation"
    
    # Setup backup cron job
    vps_exec "cat > /etc/cron.d/tacticalops-backup << 'EOF'
0 2 * * * root cd $APP_DIR && ./scripts/backup.sh >> $APP_DIR/logs/backup/backup.log 2>&1
EOF" "Setting up backup cron job"
    
    success "Monitoring setup completed"
}

# Function to finalize deployment
finalize_deployment() {
    log "Finalizing deployment..."
    
    # Reload Nginx
    vps_exec "systemctl reload nginx" "Reloading Nginx"
    
    # Create deployment info file
    vps_exec "cat > $APP_DIR/deployment-info.txt << EOF
Deployment completed: $(date)
Domain: $DOMAIN
VPS IP: $VPS_IP
Deployment Tier: $DEPLOYMENT_TIER
Version: ${BUILD_VERSION:-latest}
Deployed by: $(whoami)@$(hostname)
EOF" "Creating deployment info file"
    
    # Show deployment summary
    log "Deployment Summary:"
    log "=================="
    log "Domain: https://$DOMAIN"
    log "Application: https://$DOMAIN"
    log "API: https://$DOMAIN/api/v2"
    log "Monitoring: https://$DOMAIN/grafana"
    log "Deployment Tier: $DEPLOYMENT_TIER"
    log "Application Directory: $APP_DIR"
    log "Logs Directory: $APP_DIR/logs"
    
    success "Deployment completed successfully!"
}

# Main execution function
main() {
    log "Starting TacticalOps Platform VPS deployment..."
    log "=============================================="
    
    parse_arguments "$@"
    
    log "Deployment Configuration:"
    log "Domain: $DOMAIN"
    log "VPS IP: $VPS_IP"
    log "SSH User: $SSH_USER"
    log "Deployment Tier: $DEPLOYMENT_TIER"
    log "Dry Run: $DRY_RUN"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        warn "DRY RUN MODE - No actual changes will be made"
    fi
    
    check_prerequisites
    analyze_vps_environment
    
    if [[ "$FORCE_DEPLOY" != "true" ]]; then
        read -p "Continue with deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Deployment cancelled by user"
            exit 0
        fi
    fi
    
    create_backup
    prepare_deployment
    deploy_application
    configure_environment
    configure_nginx
    setup_ssl
    deploy_containers
    perform_health_checks
    setup_monitoring
    finalize_deployment
    
    success "TacticalOps Platform deployment completed successfully!"
}

# Execute main function with all arguments
main "$@"