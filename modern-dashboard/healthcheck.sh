#!/bin/bash

# TacticalOps Platform - Health Check Script
# This script performs health checks for the containerized application

set -e

# Configuration
HEALTH_CHECK_URL="http://localhost:3000/api/health"
TIMEOUT=10
MAX_RETRIES=3

# Function to check if the application is responding
check_app_health() {
    local retry_count=0
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        if curl -f -s --max-time $TIMEOUT "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            echo "✅ Application health check passed"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        echo "⚠️  Health check attempt $retry_count failed, retrying..."
        sleep 2
    done
    
    echo "❌ Application health check failed after $MAX_RETRIES attempts"
    return 1
}

# Function to check database connectivity
check_database_health() {
    if [ -n "$DATABASE_URL" ]; then
        # Try to connect to the database using the application's health endpoint
        if curl -f -s --max-time $TIMEOUT "http://localhost:3000/api/health/db" > /dev/null 2>&1; then
            echo "✅ Database health check passed"
            return 0
        else
            echo "⚠️  Database health check failed"
            return 1
        fi
    else
        echo "ℹ️  Database health check skipped (no DATABASE_URL configured)"
        return 0
    fi
}

# Function to check Redis connectivity
check_redis_health() {
    if [ -n "$REDIS_URL" ]; then
        # Try to connect to Redis using the application's health endpoint
        if curl -f -s --max-time $TIMEOUT "http://localhost:3000/api/health/cache" > /dev/null 2>&1; then
            echo "✅ Redis health check passed"
            return 0
        else
            echo "⚠️  Redis health check failed"
            return 1
        fi
    else
        echo "ℹ️  Redis health check skipped (no REDIS_URL configured)"
        return 0
    fi
}

# Function to check disk space
check_disk_space() {
    local usage=$(df /app | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$usage" -lt 90 ]; then
        echo "✅ Disk space check passed (${usage}% used)"
        return 0
    else
        echo "⚠️  Disk space warning (${usage}% used)"
        return 1
    fi
}

# Function to check memory usage
check_memory_usage() {
    local memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    
    if [ "$memory_usage" -lt 90 ]; then
        echo "✅ Memory usage check passed (${memory_usage}% used)"
        return 0
    else
        echo "⚠️  Memory usage warning (${memory_usage}% used)"
        return 1
    fi
}

# Main health check function
main() {
    echo "🏥 TacticalOps Platform - Health Check"
    echo "====================================="
    echo "Timestamp: $(date)"
    echo ""
    
    local exit_code=0
    
    # Check application health
    if ! check_app_health; then
        exit_code=1
    fi
    
    # Check database health
    if ! check_database_health; then
        exit_code=1
    fi
    
    # Check Redis health
    if ! check_redis_health; then
        exit_code=1
    fi
    
    # Check system resources
    if ! check_disk_space; then
        exit_code=1
    fi
    
    if ! check_memory_usage; then
        exit_code=1
    fi
    
    echo ""
    if [ $exit_code -eq 0 ]; then
        echo "🎉 All health checks passed!"
    else
        echo "❌ Some health checks failed!"
    fi
    
    return $exit_code
}

# Execute health check
main "$@"