#!/bin/sh
# TacticalOps Platform - Health Check Script
# Comprehensive health check for Docker containers

set -e

# Configuration
HEALTH_CHECK_URL="http://localhost:3000/api/v2/health"
TIMEOUT=10
MAX_RETRIES=3
RETRY_DELAY=2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >&2
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" >&2
}

# Function to check HTTP endpoint
check_http_endpoint() {
    local url=$1
    local timeout=${2:-10}
    local expected_status=${3:-200}
    
    log "Checking HTTP endpoint: $url"
    
    # Use curl to check the endpoint
    local response
    local http_code
    
    if command -v curl >/dev/null 2>&1; then
        response=$(curl -s -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null || echo "000")
        http_code=${response: -3}
        
        if [ "$http_code" = "$expected_status" ]; then
            success "HTTP endpoint is healthy (status: $http_code)"
            return 0
        else
            error "HTTP endpoint returned status: $http_code (expected: $expected_status)"
            return 1
        fi
    elif command -v wget >/dev/null 2>&1; then
        if wget --quiet --timeout="$timeout" --tries=1 --spider "$url" 2>/dev/null; then
            success "HTTP endpoint is healthy"
            return 0
        else
            error "HTTP endpoint is not responding"
            return 1
        fi
    else
        error "Neither curl nor wget is available for health check"
        return 1
    fi
}

# Function to check process
check_process() {
    local process_name=$1
    
    log "Checking process: $process_name"
    
    if pgrep -f "$process_name" >/dev/null 2>&1; then
        success "Process $process_name is running"
        return 0
    else
        error "Process $process_name is not running"
        return 1
    fi
}

# Function to check port
check_port() {
    local port=$1
    local host=${2:-localhost}
    
    log "Checking port: $host:$port"
    
    if command -v nc >/dev/null 2>&1; then
        if nc -z "$host" "$port" 2>/dev/null; then
            success "Port $host:$port is open"
            return 0
        else
            error "Port $host:$port is not accessible"
            return 1
        fi
    elif command -v telnet >/dev/null 2>&1; then
        if echo "quit" | telnet "$host" "$port" 2>/dev/null | grep -q "Connected"; then
            success "Port $host:$port is open"
            return 0
        else
            error "Port $host:$port is not accessible"
            return 1
        fi
    else
        warn "Neither nc nor telnet is available for port check"
        return 0
    fi
}

# Function to check memory usage
check_memory() {
    local threshold=${1:-90}  # Default 90% threshold
    
    log "Checking memory usage (threshold: ${threshold}%)"
    
    if command -v free >/dev/null 2>&1; then
        local memory_usage
        memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
        
        if [ "$memory_usage" -lt "$threshold" ]; then
            success "Memory usage is healthy: ${memory_usage}%"
            return 0
        else
            warn "High memory usage: ${memory_usage}%"
            return 1
        fi
    else
        warn "free command not available for memory check"
        return 0
    fi
}

# Function to check disk space
check_disk_space() {
    local path=${1:-/app}
    local threshold=${2:-90}  # Default 90% threshold
    
    log "Checking disk space for $path (threshold: ${threshold}%)"
    
    if command -v df >/dev/null 2>&1; then
        local disk_usage
        disk_usage=$(df "$path" | awk 'NR==2{print $5}' | sed 's/%//')
        
        if [ "$disk_usage" -lt "$threshold" ]; then
            success "Disk space is healthy: ${disk_usage}%"
            return 0
        else
            warn "High disk usage: ${disk_usage}%"
            return 1
        fi
    else
        warn "df command not available for disk check"
        return 0
    fi
}

# Function to check file permissions
check_file_permissions() {
    local file=$1
    local expected_perms=$2
    
    if [ -f "$file" ]; then
        local actual_perms
        actual_perms=$(stat -c "%a" "$file" 2>/dev/null || stat -f "%A" "$file" 2>/dev/null)
        
        if [ "$actual_perms" = "$expected_perms" ]; then
            success "File permissions correct: $file ($actual_perms)"
            return 0
        else
            warn "File permissions incorrect: $file (expected: $expected_perms, actual: $actual_perms)"
            return 1
        fi
    else
        warn "File not found: $file"
        return 1
    fi
}

# Function to check log files
check_log_files() {
    local log_dir=${1:-/app/logs}
    
    log "Checking log files in $log_dir"
    
    if [ -d "$log_dir" ]; then
        # Check if log directory is writable
        if [ -w "$log_dir" ]; then
            success "Log directory is writable: $log_dir"
        else
            error "Log directory is not writable: $log_dir"
            return 1
        fi
        
        # Check for recent log activity (files modified in last hour)
        if find "$log_dir" -name "*.log" -mmin -60 | grep -q .; then
            success "Recent log activity detected"
        else
            warn "No recent log activity in $log_dir"
        fi
        
        return 0
    else
        error "Log directory not found: $log_dir"
        return 1
    fi
}

# Function to perform comprehensive health check
comprehensive_health_check() {
    local exit_code=0
    
    log "Starting comprehensive health check..."
    
    # Check main application endpoint
    if ! check_http_endpoint "$HEALTH_CHECK_URL" "$TIMEOUT"; then
        exit_code=1
    fi
    
    # Check if Node.js process is running
    if ! check_process "node"; then
        exit_code=1
    fi
    
    # Check application port
    if ! check_port 3000; then
        exit_code=1
    fi
    
    # Check system resources
    check_memory 85 || warn "Memory usage is high"
    check_disk_space "/app" 85 || warn "Disk usage is high"
    
    # Check log files
    check_log_files "/app/logs" || warn "Log file issues detected"
    
    # Check critical directories exist and are writable
    for dir in "/app/logs" "/app/uploads" "/app/tmp"; do
        if [ -d "$dir" ] && [ -w "$dir" ]; then
            success "Directory is accessible: $dir"
        else
            error "Directory is not accessible: $dir"
            exit_code=1
        fi
    done
    
    # Check environment variables
    if [ -z "$NODE_ENV" ]; then
        warn "NODE_ENV is not set"
    fi
    
    if [ -z "$DATABASE_URL" ]; then
        error "DATABASE_URL is not set"
        exit_code=1
    fi
    
    return $exit_code
}

# Function to perform quick health check
quick_health_check() {
    log "Performing quick health check..."
    
    # Just check the main endpoint
    if check_http_endpoint "$HEALTH_CHECK_URL" "$TIMEOUT"; then
        success "Quick health check passed"
        return 0
    else
        error "Quick health check failed"
        return 1
    fi
}

# Function to perform health check with retries
health_check_with_retries() {
    local check_function=$1
    local retries=0
    
    while [ $retries -lt $MAX_RETRIES ]; do
        if $check_function; then
            return 0
        fi
        
        retries=$((retries + 1))
        if [ $retries -lt $MAX_RETRIES ]; then
            warn "Health check failed, retrying in ${RETRY_DELAY}s (attempt $retries/$MAX_RETRIES)"
            sleep $RETRY_DELAY
        fi
    done
    
    error "Health check failed after $MAX_RETRIES attempts"
    return 1
}

# Main execution
main() {
    local check_type=${1:-quick}
    
    case "$check_type" in
        "quick")
            health_check_with_retries quick_health_check
            ;;
        "comprehensive"|"full")
            health_check_with_retries comprehensive_health_check
            ;;
        "endpoint")
            check_http_endpoint "$HEALTH_CHECK_URL" "$TIMEOUT"
            ;;
        "process")
            check_process "node"
            ;;
        "port")
            check_port 3000
            ;;
        "memory")
            check_memory 85
            ;;
        "disk")
            check_disk_space "/app" 85
            ;;
        "logs")
            check_log_files "/app/logs"
            ;;
        *)
            error "Unknown check type: $check_type"
            echo "Usage: $0 [quick|comprehensive|endpoint|process|port|memory|disk|logs]"
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"