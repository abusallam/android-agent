#!/bin/sh
# TacticalOps Platform - Docker Entrypoint Script
# Handles initialization, database migrations, and application startup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
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

# Function to wait for service
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local timeout=${4:-60}
    
    log "Waiting for $service_name at $host:$port..."
    
    local count=0
    while ! nc -z "$host" "$port" 2>/dev/null; do
        if [ $count -ge $timeout ]; then
            error "$service_name is not available after ${timeout}s"
            exit 1
        fi
        count=$((count + 1))
        sleep 1
    done
    
    success "$service_name is available"
}

# Function to setup database (simplified)
setup_database() {
    log "Setting up database connection..."
    
    # Generate Prisma client
    npx prisma generate
    
    success "Database client generated successfully"
    return 0
}

# Function to create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    mkdir -p /app/logs /app/uploads /app/tmp
    chmod 755 /app/logs /app/uploads /app/tmp
    
    success "Directories created"
}

# Function to validate environment variables
validate_environment() {
    log "Validating environment variables..."
    
    local required_vars="NODE_ENV DATABASE_URL JWT_SECRET"
    local missing_vars=""
    
    for var in $required_vars; do
        if [ -z "$(eval echo \$$var)" ]; then
            missing_vars="$missing_vars $var"
        fi
    done
    
    if [ -n "$missing_vars" ]; then
        error "Missing required environment variables:$missing_vars"
        exit 1
    fi
    
    # Validate JWT secret length
    if [ ${#JWT_SECRET} -lt 32 ]; then
        error "JWT_SECRET must be at least 32 characters long"
        exit 1
    fi
    
    success "Environment variables validated"
}

# Function to setup logging
setup_logging() {
    log "Setting up logging..."
    
    # Create log files
    touch /app/logs/app.log /app/logs/error.log /app/logs/access.log
    
    # Set log level
    export LOG_LEVEL=${LOG_LEVEL:-info}
    
    success "Logging configured"
}

# Function to check system resources
check_resources() {
    log "Checking system resources..."
    
    # Check available memory
    local available_memory=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [ "$available_memory" -lt 256 ]; then
        warn "Low available memory: ${available_memory}MB"
    fi
    
    # Check disk space
    local available_disk=$(df /app | awk 'NR==2{print $4}')
    if [ "$available_disk" -lt 1048576 ]; then  # 1GB in KB
        warn "Low available disk space: ${available_disk}KB"
    fi
    
    success "System resources checked"
}

# Function to setup security
setup_security() {
    log "Setting up security configurations..."
    
    # Set secure file permissions
    find /app -type f -name "*.js" -exec chmod 644 {} \;
    find /app -type d -exec chmod 755 {} \;
    
    # Ensure sensitive files are not readable by others
    if [ -f "/app/.env" ]; then
        chmod 600 /app/.env
    fi
    
    success "Security configurations applied"
}

# Function to perform health check
health_check() {
    log "Performing initial health check..."
    
    # Wait a moment for the server to start
    sleep 5
    
    # Check if the application is responding
    if curl -f http://localhost:3000/api/v2/health >/dev/null 2>&1; then
        success "Application health check passed"
        return 0
    else
        error "Application health check failed"
        return 1
    fi
}

# Function to cleanup on exit
cleanup() {
    log "Cleaning up..."
    
    # Kill any background processes
    jobs -p | xargs -r kill
    
    # Remove temporary files
    rm -rf /app/tmp/*
    
    log "Cleanup completed"
}

# Trap cleanup function on exit
trap cleanup EXIT INT TERM

# Main execution
main() {
    log "Starting TacticalOps Platform initialization..."
    log "Version: ${BUILD_VERSION:-unknown}"
    log "Environment: ${NODE_ENV:-development}"
    log "Deployment Tier: ${DEPLOYMENT_TIER:-civilian}"
    
    # Validate environment
    validate_environment
    
    # Create directories
    create_directories
    
    # Setup logging
    setup_logging
    
    # Setup security
    setup_security
    
    # Check system resources
    check_resources
    
    # Parse DATABASE_URL to extract connection details
    if [ -n "$DATABASE_URL" ]; then
        # Extract host and port from DATABASE_URL
        DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        
        if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
            wait_for_service "$DB_HOST" "$DB_PORT" "PostgreSQL" 60
        fi
    fi
    
    # Wait for Redis if configured
    if [ -n "$REDIS_URL" ]; then
        REDIS_HOST=$(echo "$REDIS_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        REDIS_PORT=$(echo "$REDIS_URL" | sed -n 's/.*:\([0-9]*\)$/\1/p')
        
        if [ -n "$REDIS_HOST" ] && [ -n "$REDIS_PORT" ]; then
            wait_for_service "$REDIS_HOST" "$REDIS_PORT" "Redis" 30
        fi
    fi
    
    # Setup database with simplified approach
    setup_database
    
    success "TacticalOps Platform initialization completed"
    
    # Start the application
    log "Starting TacticalOps Platform server..."
    
    # Start the application in background for health check
    node server.js &
    APP_PID=$!
    
    # Wait for application to start and perform health check
    if health_check; then
        # If health check passes, wait for the application process
        wait $APP_PID
    else
        # If health check fails, kill the application and exit
        kill $APP_PID 2>/dev/null || true
        exit 1
    fi
}

# Execute main function
main "$@"