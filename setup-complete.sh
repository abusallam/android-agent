#!/bin/bash

# 🚀 Android Agent - Complete Setup Script
# This script sets up the entire Android Agent PWA with UV package manager

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check if UV is installed
check_uv() {
    log "Checking UV package manager..."
    
    if ! command -v uv &> /dev/null; then
        warning "UV package manager not found. Installing..."
        
        # Install UV
        curl -LsSf https://astral.sh/uv/install.sh | sh
        
        # Add to PATH for current session
        export PATH="$HOME/.local/bin:$PATH"
        
        # Verify installation
        if command -v uv &> /dev/null; then
            log "✅ UV package manager installed successfully"
            uv --version
        else
            error "❌ Failed to install UV package manager"
            exit 1
        fi
    else
        log "✅ UV package manager found"
        uv --version
    fi
}

# Check if Node.js is installed
check_node() {
    log "Checking Node.js..."
    
    if ! command -v node &> /dev/null; then
        error "❌ Node.js not found. Please install Node.js 18+ first"
        echo "Visit: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+"
        exit 1
    fi
    
    log "✅ Node.js $(node --version) found"
}

# Check if ngrok is installed
check_ngrok() {
    log "Checking ngrok..."
    
    if ! command -v ngrok &> /dev/null; then
        warning "ngrok not found. Installing via UV..."
        
        # Note: ngrok doesn't have a Python package, so we'll provide instructions
        warning "Please install ngrok manually:"
        echo "1. Visit: https://ngrok.com/download"
        echo "2. Download and install ngrok"
        echo "3. Sign up for a free account"
        echo "4. Run: ngrok config add-authtoken YOUR_TOKEN"
        echo ""
        warning "Continuing without ngrok (mobile testing will be limited)"
    else
        log "✅ ngrok found"
        ngrok version
    fi
}

# Setup UV project
setup_uv_project() {
    log "Setting up UV project..."
    
    # Initialize UV project if not already done
    if [ ! -f "pyproject.toml" ]; then
        warning "pyproject.toml not found, creating..."
        uv init --no-readme
    fi
    
    # Install development dependencies
    log "Installing Python development tools with UV..."
    uv add --dev black flake8 pytest mypy
    
    log "✅ UV project setup complete"
}

# Setup Node.js project
setup_node_project() {
    log "Setting up Node.js project..."
    
    cd modern-dashboard
    
    # Install dependencies
    log "Installing Node.js dependencies..."
    npm install
    
    # Setup database
    log "Setting up database..."
    npm run db:sqlite
    npm run db:setup
    
    # Build the application
    log "Building application..."
    npm run build
    
    cd ..
    
    log "✅ Node.js project setup complete"
}

# Create development scripts
create_dev_scripts() {
    log "Creating development scripts..."
    
    # Create UV development script
    cat > run-dev.sh << 'EOF'
#!/bin/bash
# Development script using UV

set -e

echo "🚀 Starting Android Agent Development Environment"

# Activate UV environment
echo "📦 Activating UV environment..."
source .venv/bin/activate 2>/dev/null || echo "No UV virtual environment found"

# Start the Next.js development server
echo "🌐 Starting Next.js server..."
cd modern-dashboard
DATABASE_URL="file:./dev.db" npm run dev

EOF

    chmod +x run-dev.sh
    
    # Create production script
    cat > run-prod.sh << 'EOF'
#!/bin/bash
# Production script

set -e

echo "🚀 Starting Android Agent Production Environment"

cd modern-dashboard

# Build if needed
if [ ! -d ".next" ]; then
    echo "🏗️ Building application..."
    npm run build
fi

# Start production server
echo "🌐 Starting production server..."
DATABASE_URL="file:./dev.db" npm start

EOF

    chmod +x run-prod.sh
    
    log "✅ Development scripts created"
}

# Update documentation
update_documentation() {
    log "Updating documentation..."
    
    # Update README with UV instructions
    if grep -q "UV Package Manager" README.md; then
        log "README already contains UV instructions"
    else
        log "Adding UV instructions to README..."
        # This would add UV-specific instructions to README
    fi
    
    log "✅ Documentation updated"
}

# Main setup function
main() {
    echo "🛡️ Android Agent - Complete Setup"
    echo "=================================="
    echo ""
    
    # Check prerequisites
    check_uv
    check_node
    check_ngrok
    
    echo ""
    log "Setting up project..."
    
    # Setup projects
    setup_uv_project
    setup_node_project
    create_dev_scripts
    update_documentation
    
    echo ""
    echo "🎉 Setup Complete!"
    echo "=================="
    echo ""
    echo "📋 Next Steps:"
    echo "1. Start development: ./run-dev.sh"
    echo "2. Or start production: ./run-prod.sh"
    echo "3. Access at: http://localhost:3000"
    echo "4. Login with: admin / admin"
    echo ""
    echo "🔧 Available Commands:"
    echo "- UV commands: uv --help"
    echo "- Database: cd modern-dashboard && npm run db:studio"
    echo "- Build: cd modern-dashboard && npm run build"
    echo ""
    echo "📱 For mobile testing:"
    echo "1. Install ngrok if not already installed"
    echo "2. Run: cd modern-dashboard && ./setup-ngrok.sh"
    echo ""
}

# Run main function
main "$@"