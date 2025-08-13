#!/bin/bash
# TacticalOps Platform - Simple VPS Deployment Script
# Deploys to production VPS with PostgreSQL + PostGIS + MinIO

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration from environment
VPS_HOST=${VPS_HOST:-"217.79.255.54"}
VPS_USER=${VPS_USER:-"root"}
VPS_PASSWORD=${VPS_PASSWORD:-"gnqLG7FDd4"}
DOMAIN=${DOMAIN:-"ta.consulting.sa"}
APP_NAME="tacticalops"
APP_DIR="/opt/${APP_NAME}"

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

# Function to execute command on VPS
vps_exec() {
    local command="$1"
    local description="$2"
    
    if [[ -n "$description" ]]; then
        log "$description"
    fi
    
    sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        "$VPS_USER@$VPS_HOST" "$command"
}

# Function to copy file to VPS
vps_copy() {
    local local_path="$1"
    local remote_path="$2"
    local description="$3"
    
    if [[ -n "$description" ]]; then
        log "$description"
    fi
    
    sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        "$local_path" "$VPS_USER@$VPS_HOST:$remote_path"
}

# Function to copy directory to VPS
vps_copy_dir() {
    local local_path="$1"
    local remote_path="$2"
    local description="$3"
    
    if [[ -n "$description" ]]; then
        log "$description"
    fi
    
    sshpass -p "$VPS_PASSWORD" scp -r -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        "$local_path" "$VPS_USER@$VPS_HOST:$remote_path"
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if sshpass is available
    if ! command -v sshpass >/dev/null 2>&1; then
        error "sshpass is required but not installed. Install it with: apt-get install sshpass"
        exit 1
    fi
    
    # Check SSH connectivity
    if ! sshpass -p "$VPS_PASSWORD" ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
         "$VPS_USER@$VPS_HOST" "echo 'SSH connection successful'" >/dev/null 2>&1; then
        error "Cannot connect to VPS via SSH: $VPS_USER@$VPS_HOST"
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
    
    # Check available ports
    log "Checking port availability..."
    local ports_to_check="3010 5433 6380 9000 9001 9090 3011 3100"
    for port in $ports_to_check; do
        if vps_exec "netstat -tlnp | grep :$port" "" >/dev/null 2>&1; then
            warn "Port $port is in use"
        else
            log "Port $port is available"
        fi
    done
    
    # Check Docker installation
    if vps_exec "docker --version" "Checking Docker installation" >/dev/null 2>&1; then
        local docker_version
        docker_version=$(vps_exec "docker --version")
        log "Docker: $docker_version"
    else
        log "Installing Docker..."
        vps_exec "curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh" "Installing Docker"
        vps_exec "systemctl enable docker && systemctl start docker" "Starting Docker service"
    fi
    
    # Check Docker Compose installation
    if vps_exec "docker-compose --version" "Checking Docker Compose installation" >/dev/null 2>&1; then
        local compose_version
        compose_version=$(vps_exec "docker-compose --version")
        log "Docker Compose: $compose_version"
    else
        log "Installing Docker Compose..."
        vps_exec "curl -L \"https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose" "Downloading Docker Compose"
        vps_exec "chmod +x /usr/local/bin/docker-compose" "Making Docker Compose executable"
    fi
    
    success "VPS environment analysis completed"
}

# Function to prepare deployment
prepare_deployment() {
    log "Preparing deployment directories..."
    
    # Create application directory structure
    vps_exec "mkdir -p $APP_DIR" "Creating application directory"
    vps_exec "mkdir -p $APP_DIR/data/{postgres,redis,minio,minio-config,prometheus,grafana,loki,uploads,public,static}" "Creating data directories"
    vps_exec "mkdir -p $APP_DIR/logs/{app,nginx,postgres,redis,backup}" "Creating log directories"
    vps_exec "mkdir -p $APP_DIR/backups" "Creating backup directory"
    vps_exec "mkdir -p $APP_DIR/ssl" "Creating SSL directory"
    vps_exec "mkdir -p $APP_DIR/scripts" "Creating scripts directory"
    vps_exec "mkdir -p $APP_DIR/monitoring/{prometheus,grafana,loki,promtail}" "Creating monitoring directories"
    
    # Set proper permissions
    vps_exec "chown -R 1001:1001 $APP_DIR/data $APP_DIR/logs" "Setting data directory permissions"
    vps_exec "chmod -R 755 $APP_DIR" "Setting application directory permissions"
    
    success "Deployment directories prepared"
}

# Function to deploy application files
deploy_application() {
    log "Deploying application files..."
    
    # Copy Docker Compose configuration
    vps_copy "docker-compose.production.yml" "$APP_DIR/docker-compose.yml" "Copying Docker Compose configuration"
    
    # Copy environment configuration
    vps_copy ".env.production" "$APP_DIR/.env" "Copying environment configuration"
    
    # Copy database initialization scripts
    vps_copy "init-db-postgis.sql" "$APP_DIR/init-db-postgis.sql" "Copying PostgreSQL initialization script"
    
    # Copy backup scripts
    vps_copy "scripts/minio-backup.sh" "$APP_DIR/scripts/minio-backup.sh" "Copying MinIO backup script"
    vps_exec "chmod +x $APP_DIR/scripts/minio-backup.sh" "Making backup script executable"
    
    # Copy monitoring configurations
    if [[ -d "monitoring" ]]; then
        vps_copy_dir "monitoring/" "$APP_DIR/monitoring/" "Copying monitoring configurations"
    fi
    
    # Copy application source
    if [[ -d "modern-dashboard" ]]; then
        log "Copying application source..."
        # Create a temporary archive to avoid copying node_modules
        tar -czf /tmp/tacticalops-app.tar.gz modern-dashboard/ --exclude=node_modules --exclude=.next --exclude=dist
        vps_copy "/tmp/tacticalops-app.tar.gz" "$APP_DIR/app.tar.gz" "Copying application archive"
        vps_exec "cd $APP_DIR && tar -xzf app.tar.gz && rm app.tar.gz" "Extracting application files"
        rm -f /tmp/tacticalops-app.tar.gz
    fi
    
    success "Application files deployed"
}

# Function to configure Nginx
configure_nginx() {
    log "Configuring Nginx..."
    
    # Check if Nginx is installed
    if ! vps_exec "nginx -v" "Checking Nginx installation" >/dev/null 2>&1; then
        log "Installing Nginx..."
        vps_exec "apt update && apt install -y nginx" "Installing Nginx"
    fi
    
    # Copy Nginx configuration
    vps_copy "nginx/tacticalops.conf" "/etc/nginx/sites-available/tacticalops" "Copying Nginx site configuration"
    
    # Enable the site
    vps_exec "ln -sf /etc/nginx/sites-available/tacticalops /etc/nginx/sites-enabled/" "Enabling Nginx site"
    
    # Remove default site if it exists
    vps_exec "rm -f /etc/nginx/sites-enabled/default" "Removing default Nginx site"
    
    # Test Nginx configuration
    if vps_exec "nginx -t" "Testing Nginx configuration"; then
        success "Nginx configuration is valid"
    else
        error "Nginx configuration test failed"
        exit 1
    fi
    
    # Create basic error pages
    vps_exec "mkdir -p /var/www/html" "Creating web root directory"
    vps_exec "cat > /var/www/html/404.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>404 Not Found</title></head>
<body>
<h1>404 Not Found</h1>
<p>The requested resource was not found on this server.</p>
<hr>
<p><em>TacticalOps Platform</em></p>
</body>
</html>
EOF" "Creating 404 error page"
    
    vps_exec "cat > /var/www/html/50x.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Server Error</title></head>
<body>
<h1>Server Error</h1>
<p>The server encountered an internal error and was unable to complete your request.</p>
<hr>
<p><em>TacticalOps Platform</em></p>
</body>
</html>
EOF" "Creating 50x error page"
    
    success "Nginx configured successfully"
}

# Function to setup SSL certificate
setup_ssl() {
    log "Setting up SSL certificate..."
    
    # Install certbot if not present
    if ! vps_exec "which certbot" "" >/dev/null 2>&1; then
        log "Installing certbot..."
        vps_exec "apt update && apt install -y certbot python3-certbot-nginx" "Installing certbot"
    fi
    
    # Stop nginx temporarily for certificate generation
    vps_exec "systemctl stop nginx" "Stopping Nginx for certificate generation"
    
    # Obtain SSL certificate
    if vps_exec "certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN" "Obtaining SSL certificate"; then
        success "SSL certificate obtained successfully"
    else
        warn "SSL certificate setup failed, creating self-signed certificate"
        
        # Create self-signed certificate as fallback
        vps_exec "mkdir -p /etc/ssl/private /etc/ssl/certs" "Creating SSL directories"
        vps_exec "openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                  -keyout /etc/ssl/private/tacticalops.key \
                  -out /etc/ssl/certs/tacticalops.crt \
                  -subj \"/C=SA/ST=Riyadh/L=Riyadh/O=Consulting SA/CN=$DOMAIN\"" "Creating self-signed certificate"
        
        # Update Nginx configuration to use self-signed certificate
        vps_exec "sed -i 's|/etc/letsencrypt/live/ta.consulting.sa/fullchain.pem|/etc/ssl/certs/tacticalops.crt|g' /etc/nginx/sites-available/tacticalops" "Updating SSL certificate path"
        vps_exec "sed -i 's|/etc/letsencrypt/live/ta.consulting.sa/privkey.pem|/etc/ssl/private/tacticalops.key|g' /etc/nginx/sites-available/tacticalops" "Updating SSL key path"
    fi
    
    # Start nginx
    vps_exec "systemctl start nginx" "Starting Nginx"
    
    success "SSL setup completed"
}

# Function to deploy containers
deploy_containers() {
    log "Deploying Docker containers..."
    
    # Pull images
    vps_exec "cd $APP_DIR && docker-compose pull" "Pulling Docker images"
    
    # Build application image
    vps_exec "cd $APP_DIR && docker-compose build --no-cache tacticalops-app" "Building application image"
    
    # Start containers
    vps_exec "cd $APP_DIR && docker-compose up -d" "Starting containers"
    
    # Wait for services to start
    log "Waiting for services to start..."
    sleep 60
    
    # Check container status
    vps_exec "cd $APP_DIR && docker-compose ps" "Checking container status"
    
    success "Containers deployed successfully"
}

# Function to perform health checks
perform_health_checks() {
    log "Performing health checks..."
    
    local max_attempts=20
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log "Health check attempt $attempt/$max_attempts"
        
        # Check if application is responding
        if vps_exec "curl -f http://localhost:3010/api/v2/health" "Checking application health" >/dev/null 2>&1; then
            success "Application health check passed"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error "Application health check failed after $max_attempts attempts"
            log "Checking container logs..."
            vps_exec "cd $APP_DIR && docker-compose logs --tail=50 tacticalops-app" "Showing application logs"
            exit 1
        fi
        
        log "Waiting 15 seconds before next attempt..."
        sleep 15
        ((attempt++))
    done
    
    # Check database connectivity
    if vps_exec "cd $APP_DIR && docker-compose exec -T tacticalops-postgres pg_isready -U tacticalops -d tacticalops" "Checking database connectivity" >/dev/null 2>&1; then
        success "Database connectivity check passed"
    else
        warn "Database connectivity check failed"
    fi
    
    # Check MinIO connectivity
    if vps_exec "curl -f http://localhost:9000/minio/health/live" "Checking MinIO health" >/dev/null 2>&1; then
        success "MinIO health check passed"
    else
        warn "MinIO health check failed"
    fi
    
    # Check Redis connectivity
    if vps_exec "cd $APP_DIR && docker-compose exec -T tacticalops-redis redis-cli --no-auth-warning -a \$REDIS_PASSWORD ping" "Checking Redis connectivity" >/dev/null 2>&1; then
        success "Redis connectivity check passed"
    else
        warn "Redis connectivity check failed"
    fi
    
    success "Health checks completed"
}

# Function to setup monitoring and backups
setup_monitoring() {
    log "Setting up monitoring and backups..."
    
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
        cd $APP_DIR && docker-compose restart tacticalops-app
    endscript
}
EOF" "Setting up log rotation"
    
    # Setup backup cron jobs
    vps_exec "cat > /etc/cron.d/tacticalops-backup << 'EOF'
# TacticalOps Platform Backup Jobs
0 2 * * * root cd $APP_DIR && docker-compose exec -T tacticalops-postgres pg_dump -U tacticalops tacticalops | gzip > /opt/tacticalops/backups/postgres-\$(date +\\%Y\\%m\\%d_\\%H\\%M\\%S).sql.gz
30 2 * * * root cd $APP_DIR && ./scripts/minio-backup.sh >> $APP_DIR/logs/backup/minio-backup.log 2>&1
0 3 * * * root find $APP_DIR/backups -name \"*.sql.gz\" -mtime +30 -delete
EOF" "Setting up backup cron jobs"
    
    # Restart cron service
    vps_exec "systemctl restart cron" "Restarting cron service"
    
    success "Monitoring and backups configured"
}

# Function to finalize deployment
finalize_deployment() {
    log "Finalizing deployment..."
    
    # Reload Nginx
    vps_exec "systemctl reload nginx" "Reloading Nginx"
    
    # Enable services to start on boot
    vps_exec "systemctl enable nginx" "Enabling Nginx on boot"
    vps_exec "systemctl enable docker" "Enabling Docker on boot"
    
    # Create deployment info file
    vps_exec "cat > $APP_DIR/deployment-info.txt << EOF
TacticalOps Platform Deployment Information
==========================================
Deployment Date: $(date)
Domain: $DOMAIN
VPS Host: $VPS_HOST
Application Directory: $APP_DIR
Version: 2.0.0
Features: PostgreSQL + PostGIS, MinIO S3 Storage, Redis Cache, Monitoring

Services:
- Application: http://localhost:3010
- PostgreSQL: localhost:5433
- Redis: localhost:6380
- MinIO API: localhost:9000
- MinIO Console: localhost:9001
- Prometheus: localhost:9090
- Grafana: localhost:3011

External Access:
- Main Application: https://$DOMAIN
- API: https://$DOMAIN/api/v2
- Health Check: https://$DOMAIN/health
- Grafana: https://$DOMAIN/grafana (admin access only)
- MinIO Console: https://$DOMAIN/minio (admin access only)

Backup Schedule:
- PostgreSQL: Daily at 02:00 (30 days retention)
- MinIO: Daily at 02:30 (30 days retention)
- Log Rotation: Daily (30 days retention)

Deployed by: $(whoami)@$(hostname)
EOF" "Creating deployment info file"
    
    # Show deployment summary
    log ""
    log "🎖️ TacticalOps Platform Deployment Summary"
    log "=========================================="
    log "✅ Domain: https://$DOMAIN"
    log "✅ Application: https://$DOMAIN"
    log "✅ API: https://$DOMAIN/api/v2"
    log "✅ Health Check: https://$DOMAIN/health"
    log "✅ Monitoring: https://$DOMAIN/grafana"
    log "✅ Storage: MinIO S3-compatible storage"
    log "✅ Database: PostgreSQL with PostGIS"
    log "✅ Cache: Redis"
    log "✅ Backups: Automated daily backups"
    log "✅ SSL: Certificate configured"
    log "✅ Monitoring: Prometheus + Grafana"
    log ""
    log "📁 Application Directory: $APP_DIR"
    log "📊 Logs Directory: $APP_DIR/logs"
    log "💾 Backups Directory: $APP_DIR/backups"
    log ""
    log "🔐 Default Admin Credentials:"
    log "   Username: admin"
    log "   Password: admin123"
    log ""
    log "🔧 Management Commands:"
    log "   View logs: cd $APP_DIR && docker-compose logs -f"
    log "   Restart: cd $APP_DIR && docker-compose restart"
    log "   Stop: cd $APP_DIR && docker-compose down"
    log "   Start: cd $APP_DIR && docker-compose up -d"
    log ""
    
    success "🚀 TacticalOps Platform deployment completed successfully!"
}

# Main execution function
main() {
    log "🎖️ Starting TacticalOps Platform VPS Deployment"
    log "=============================================="
    log "Target VPS: $VPS_HOST"
    log "Domain: $DOMAIN"
    log "Features: PostgreSQL + PostGIS, MinIO S3 Storage, Redis, Monitoring"
    log ""
    
    check_prerequisites
    analyze_vps_environment
    prepare_deployment
    deploy_application
    configure_nginx
    setup_ssl
    deploy_containers
    perform_health_checks
    setup_monitoring
    finalize_deployment
    
    success "🎉 Deployment completed successfully!"
    log ""
    log "🌐 Your TacticalOps Platform is now available at: https://$DOMAIN"
    log "📚 Check the deployment info at: $APP_DIR/deployment-info.txt"
    log ""
}

# Execute main function
main "$@"