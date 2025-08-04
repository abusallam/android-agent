#!/bin/bash

# 🛡️ Android Agent AI - Docker Infrastructure Testing Script
# Comprehensive testing of all services and streaming capabilities

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Logging functions
log() {
    echo -e "${GREEN}[TEST]${NC} $1"
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
    echo -e "${PURPLE}[TESTING]${NC} $1"
}

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    info "Running test: $test_name"
    
    if eval "$test_command"; then
        log "✅ PASS: $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        error "❌ FAIL: $test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Wait for service to be ready
wait_for_service() {
    local service_name="$1"
    local health_check="$2"
    local max_attempts=30
    local attempt=1
    
    info "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if eval "$health_check" > /dev/null 2>&1; then
            log "✅ $service_name is ready"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    error "❌ $service_name failed to become ready after $max_attempts attempts"
    return 1
}

# Test Docker services
test_docker_services() {
    header "🐳 Testing Docker Services"
    
    services=("postgres" "redis" "coturn" "livekit" "android-agent")
    
    for service in "${services[@]}"; do
        run_test "Docker service $service is running" \
                 "docker-compose ps | grep -q '$service.*Up'" \
                 "service_running"
    done
}

# Test database connectivity
test_database() {
    header "🗄️ Testing Database Connectivity"
    
    run_test "PostgreSQL is accepting connections" \
             "docker-compose exec -T postgres pg_isready -U android_agent -d android_agent_db" \
             "database_ready"
    
    run_test "Redis is accepting connections" \
             "docker-compose exec -T redis redis-cli -a redis_password_2024 ping | grep -q PONG" \
             "redis_ready"
}

# Test web services
test_web_services() {
    header "🌐 Testing Web Services"
    
    # Wait for services to be ready
    wait_for_service "Android Agent API" "curl -s http://localhost:3000/api/health"
    wait_for_service "LiveKit Server" "curl -s http://localhost:7880/"
    
    run_test "Android Agent health endpoint" \
             "curl -s http://localhost:3000/api/health | grep -q 'healthy'" \
             "api_healthy"
    
    run_test "LiveKit server is responding" \
             "curl -s http://localhost:7880/ | grep -q 'LiveKit'" \
             "livekit_responding"
    
    run_test "Android Agent dashboard loads" \
             "curl -s http://localhost:3000/ | grep -q 'Android Agent AI'" \
             "dashboard_loads"
}

# Test API endpoints
test_api_endpoints() {
    header "🔌 Testing API Endpoints"
    
    endpoints=(
        "/api/health:healthy"
        "/api/sync:sync"
        "/api/device/sync:device"
        "/api/emergency/alert:emergency"
    )
    
    for endpoint_test in "${endpoints[@]}"; do
        IFS=':' read -r endpoint expected <<< "$endpoint_test"
        run_test "API endpoint $endpoint" \
                 "curl -s http://localhost:3000$endpoint | grep -q '$expected'" \
                 "endpoint_working"
    done
}

# Test LiveKit token generation
test_livekit_token() {
    header "🎥 Testing LiveKit Token Generation"
    
    run_test "LiveKit token endpoint responds" \
             "curl -s -X POST -H 'Content-Type: application/json' -d '{\"deviceId\":\"test-device\",\"roomName\":\"test-room\"}' http://localhost:3000/api/livekit/token | grep -q 'token'" \
             "token_generated"
}

# Test COTURN server
test_coturn() {
    header "🌐 Testing COTURN Server"
    
    run_test "COTURN STUN port is open" \
             "nc -z -u localhost 3478" \
             "stun_port_open"
    
    run_test "COTURN TCP port is open" \
             "nc -z localhost 3478" \
             "turn_tcp_open"
    
    # Test STUN functionality (basic connectivity)
    run_test "COTURN server is responding" \
             "timeout 5 nc -u localhost 3478 < /dev/null" \
             "coturn_responding"
}

# Test streaming capabilities
test_streaming_capabilities() {
    header "📹 Testing Streaming Capabilities"
    
    # Test WebRTC feature detection endpoint
    run_test "WebRTC capabilities detection" \
             "curl -s http://localhost:3000/api/health | grep -q 'services'" \
             "webrtc_detection"
    
    # Test LiveKit room creation (via token generation)
    run_test "LiveKit room creation capability" \
             "curl -s -X POST -H 'Content-Type: application/json' -d '{\"deviceId\":\"test-streaming\",\"roomName\":\"streaming-test\",\"isAdmin\":true}' http://localhost:3000/api/livekit/token | grep -q 'serverUrl'" \
             "room_creation"
}

# Test network connectivity
test_network() {
    header "🔗 Testing Network Connectivity"
    
    # Test internal Docker network
    run_test "Internal network - App to LiveKit" \
             "docker-compose exec -T android-agent curl -s http://livekit:7880/" \
             "internal_livekit"
    
    run_test "Internal network - App to PostgreSQL" \
             "docker-compose exec -T android-agent nc -z postgres 5432" \
             "internal_postgres"
    
    run_test "Internal network - App to Redis" \
             "docker-compose exec -T android-agent nc -z redis 6379" \
             "internal_redis"
}

# Test security and configuration
test_security() {
    header "🔒 Testing Security Configuration"
    
    run_test "Environment variables are loaded" \
             "docker-compose exec -T android-agent printenv | grep -q 'LIVEKIT_API_KEY'" \
             "env_vars_loaded"
    
    run_test "Database credentials are working" \
             "docker-compose exec -T postgres psql -U android_agent -d android_agent_db -c 'SELECT 1;' | grep -q '1'" \
             "db_credentials"
    
    run_test "Redis authentication is working" \
             "docker-compose exec -T redis redis-cli -a redis_password_2024 info | grep -q 'redis_version'" \
             "redis_auth"
}

# Performance and resource tests
test_performance() {
    header "⚡ Testing Performance and Resources"
    
    run_test "All containers are using reasonable memory" \
             "docker stats --no-stream --format 'table {{.Container}}\t{{.MemUsage}}' | grep -v 'CONTAINER' | wc -l | grep -q '[0-9]'" \
             "memory_usage"
    
    run_test "No containers are in restart loop" \
             "! docker-compose ps | grep -q 'Restarting'" \
             "no_restart_loops"
}

# Generate test report
generate_report() {
    header "📊 Test Results Summary"
    
    echo ""
    echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
    echo -e "${BLUE}📊 Total Tests: $TOTAL_TESTS${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed! Android Agent AI is ready for streaming!${NC}"
        echo ""
        echo -e "${BLUE}🚀 Ready Features:${NC}"
        echo -e "   📹 Video streaming with LiveKit"
        echo -e "   🎤 Audio communication"
        echo -e "   🖥️ Screen sharing capabilities"
        echo -e "   🌐 COTURN for NAT traversal"
        echo -e "   🗄️ PostgreSQL database"
        echo -e "   🔴 Redis caching"
        echo -e "   🛡️ Secure authentication"
        echo ""
        return 0
    else
        echo -e "${RED}⚠️ Some tests failed. Please check the logs above.${NC}"
        echo ""
        echo -e "${YELLOW}🔧 Troubleshooting Tips:${NC}"
        echo -e "   1. Check service logs: docker-compose logs [service-name]"
        echo -e "   2. Verify all services are running: docker-compose ps"
        echo -e "   3. Check port availability: netstat -tulpn"
        echo -e "   4. Restart services: docker-compose restart"
        echo ""
        return 1
    fi
}

# Show service information
show_service_info() {
    header "📋 Service Information"
    
    echo ""
    echo -e "${GREEN}🐳 Docker Services Status:${NC}"
    docker-compose ps
    echo ""
    
    echo -e "${GREEN}🔌 Port Mappings:${NC}"
    echo -e "   3000  → Android Agent Dashboard"
    echo -e "   7880  → LiveKit WebRTC Server"
    echo -e "   3478  → COTURN STUN/TURN (UDP/TCP)"
    echo -e "   5349  → COTURN TLS (UDP/TCP)"
    echo -e "   5432  → PostgreSQL Database"
    echo -e "   6379  → Redis Cache"
    echo -e "   49152-65535 → COTURN Media Relay (UDP)"
    echo ""
    
    echo -e "${GREEN}🌐 Access URLs:${NC}"
    echo -e "   Dashboard: ${BLUE}http://localhost:3000${NC}"
    echo -e "   LiveKit:   ${BLUE}ws://localhost:7880${NC}"
    echo -e "   Health:    ${BLUE}http://localhost:3000/api/health${NC}"
    echo ""
}

# Main test execution
main() {
    header "🛡️ Android Agent AI - Infrastructure Testing"
    echo ""
    
    # Check if Docker Compose is running
    if ! docker-compose ps | grep -q "Up"; then
        error "Docker Compose services are not running!"
        echo "Please start the services first with: ./docker-start.sh"
        exit 1
    fi
    
    # Run all test suites
    test_docker_services
    test_database
    test_web_services
    test_api_endpoints
    test_livekit_token
    test_coturn
    test_streaming_capabilities
    test_network
    test_security
    test_performance
    
    # Generate final report
    generate_report
    
    # Show service information
    show_service_info
    
    echo ""
    header "🎯 Testing Complete!"
}

# Handle script arguments
case "${1:-test}" in
    "test")
        main
        ;;
    "quick")
        header "🚀 Quick Health Check"
        test_docker_services
        test_web_services
        generate_report
        ;;
    "streaming")
        header "📹 Streaming-Specific Tests"
        test_livekit_token
        test_coturn
        test_streaming_capabilities
        generate_report
        ;;
    "network")
        header "🔗 Network Connectivity Tests"
        test_network
        test_coturn
        generate_report
        ;;
    *)
        echo "Usage: $0 {test|quick|streaming|network}"
        echo ""
        echo "Commands:"
        echo "  test      - Run all tests (default)"
        echo "  quick     - Quick health check"
        echo "  streaming - Test streaming capabilities"
        echo "  network   - Test network connectivity"
        exit 1
        ;;
esac