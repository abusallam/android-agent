#!/bin/sh
# TacticalOps Platform - Simple Docker Entrypoint Script
# Simplified version for SQLite deployment

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}"
}

# Main execution
main() {
    log "Starting TacticalOps Platform..."
    log "Environment: ${NODE_ENV:-production}"
    
    # Create necessary directories
    log "Creating directories..."
    mkdir -p /app/data /app/logs /app/uploads /app/tmp
    chmod 755 /app/data /app/logs /app/uploads /app/tmp
    success "Directories created"
    
    # Generate Prisma client (already done during build)
    log "Prisma client already generated during build"
    
    # Database setup (using Supabase cloud database)
    log "Using Supabase cloud database - no local setup needed"
    
    # Start the application
    log "Starting Next.js application..."
    exec node server.js
}

# Run main function
main "$@"