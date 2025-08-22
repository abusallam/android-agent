#!/bin/bash

# 🤖 Android Agent AI - Android SDK Setup Script
# Automated installation and configuration of Android SDK for APK generation

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ANDROID_SDK_VERSION="11076708"  # Latest command line tools version
ANDROID_HOME="$HOME/Android/Sdk"
ANDROID_AVD_HOME="$HOME/.android/avd"

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect operating system
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        ARCH=$(uname -m)
        if [[ "$ARCH" == "x86_64" ]]; then
            SDK_ARCH="linux"
        else
            print_error "Unsupported architecture: $ARCH"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        SDK_ARCH="mac"
    else
        print_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi
    
    print_status "Detected OS: $OS ($ARCH)"
}

# Check if Java is installed
check_java() {
    print_status "Checking Java installation..."
    
    if command -v java &> /dev/null; then
        JAVA_VERSION=$(java -version 2>&1 | head -n1 | cut -d'"' -f2)
        print_success "Java found: $JAVA_VERSION"
        return 0
    else
        print_warning "Java not found. Installing OpenJDK..."
        install_java
    fi
}

# Install Java
install_java() {
    if [[ "$OS" == "linux" ]]; then
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            # Try different Java package names
            if sudo apt-get install -y openjdk-11-jdk 2>/dev/null; then
                print_success "Installed OpenJDK 11"
            elif sudo apt-get install -y openjdk-17-jdk 2>/dev/null; then
                print_success "Installed OpenJDK 17"
            elif sudo apt-get install -y default-jdk 2>/dev/null; then
                print_success "Installed default JDK"
            else
                print_error "Could not install Java. Please install OpenJDK manually."
                exit 1
            fi
        elif command -v yum &> /dev/null; then
            sudo yum install -y java-11-openjdk-devel
        elif command -v pacman &> /dev/null; then
            sudo pacman -S --noconfirm jdk11-openjdk
        else
            print_error "Could not install Java. Please install OpenJDK manually."
            exit 1
        fi
    elif [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install openjdk@11
        else
            print_error "Homebrew not found. Please install Java manually or install Homebrew first."
            exit 1
        fi
    fi
    
    print_success "Java installed successfully"
}

# Create Android SDK directory
create_sdk_directory() {
    print_status "Creating Android SDK directory..."
    
    if [ -d "$ANDROID_HOME" ]; then
        print_warning "Android SDK directory already exists: $ANDROID_HOME"
        read -p "Do you want to continue and potentially overwrite? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Installation cancelled by user"
            exit 1
        fi
    fi
    
    mkdir -p "$ANDROID_HOME"
    mkdir -p "$ANDROID_AVD_HOME"
    print_success "Created SDK directories"
}

# Download and install Android SDK command line tools
install_sdk_tools() {
    print_status "Downloading Android SDK command line tools..."
    
    local temp_dir=$(mktemp -d)
    local sdk_url="https://dl.google.com/android/repository/commandlinetools-${SDK_ARCH}-${ANDROID_SDK_VERSION}_latest.zip"
    local zip_file="$temp_dir/commandlinetools.zip"
    
    print_status "Downloading from: $sdk_url"
    
    if command -v curl &> /dev/null; then
        curl -L -o "$zip_file" "$sdk_url"
    elif command -v wget &> /dev/null; then
        wget -O "$zip_file" "$sdk_url"
    else
        print_error "Neither curl nor wget found. Please install one of them."
        exit 1
    fi
    
    print_status "Extracting SDK tools..."
    
    if command -v unzip &> /dev/null; then
        unzip -q "$zip_file" -d "$temp_dir"
    else
        print_error "unzip not found. Please install unzip."
        exit 1
    fi
    
    # Move cmdline-tools to the correct location
    mkdir -p "$ANDROID_HOME/cmdline-tools"
    mv "$temp_dir/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest"
    
    # Clean up
    rm -rf "$temp_dir"
    
    print_success "Android SDK command line tools installed"
}

# Configure environment variables
configure_environment() {
    print_status "Configuring environment variables..."
    
    local shell_rc=""
    if [[ "$SHELL" == *"zsh"* ]]; then
        shell_rc="$HOME/.zshrc"
    elif [[ "$SHELL" == *"bash"* ]]; then
        shell_rc="$HOME/.bashrc"
    else
        shell_rc="$HOME/.profile"
    fi
    
    print_status "Adding environment variables to $shell_rc"
    
    # Create backup
    if [ -f "$shell_rc" ]; then
        cp "$shell_rc" "${shell_rc}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Add Android environment variables
    cat >> "$shell_rc" << EOF

# Android SDK Environment Variables (Added by Android Agent AI setup)
export ANDROID_HOME="$ANDROID_HOME"
export ANDROID_SDK_ROOT="\$ANDROID_HOME"
export PATH="\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin"
export PATH="\$PATH:\$ANDROID_HOME/platform-tools"
export PATH="\$PATH:\$ANDROID_HOME/emulator"
export PATH="\$PATH:\$ANDROID_HOME/tools"
export PATH="\$PATH:\$ANDROID_HOME/tools/bin"

EOF
    
    # Export for current session
    export ANDROID_HOME="$ANDROID_HOME"
    export ANDROID_SDK_ROOT="$ANDROID_HOME"
    export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin"
    export PATH="$PATH:$ANDROID_HOME/platform-tools"
    export PATH="$PATH:$ANDROID_HOME/emulator"
    export PATH="$PATH:$ANDROID_HOME/tools"
    export PATH="$PATH:$ANDROID_HOME/tools/bin"
    
    print_success "Environment variables configured"
    print_warning "Please restart your terminal or run: source $shell_rc"
}

# Install required SDK packages
install_sdk_packages() {
    print_status "Installing required SDK packages..."
    
    local sdkmanager="$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager"
    
    if [ ! -f "$sdkmanager" ]; then
        print_error "SDK Manager not found at: $sdkmanager"
        exit 1
    fi
    
    print_status "Accepting SDK licenses..."
    yes | "$sdkmanager" --licenses > /dev/null 2>&1 || true
    
    print_status "Installing platform tools..."
    "$sdkmanager" "platform-tools"
    
    print_status "Installing build tools..."
    "$sdkmanager" "build-tools;33.0.0" "build-tools;34.0.0"
    
    print_status "Installing Android platforms..."
    "$sdkmanager" "platforms;android-33" "platforms;android-34"
    
    print_status "Installing emulator..."
    "$sdkmanager" "emulator"
    
    print_status "Installing system images..."
    "$sdkmanager" "system-images;android-33;google_apis;x86_64"
    
    print_success "SDK packages installed successfully"
}

# Create default Android Virtual Device
create_default_avd() {
    print_status "Creating default Android Virtual Device..."
    
    local avdmanager="$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager"
    local avd_name="AndroidAgent_API33"
    
    if [ ! -f "$avdmanager" ]; then
        print_error "AVD Manager not found at: $avdmanager"
        exit 1
    fi
    
    # Check if AVD already exists
    if "$avdmanager" list avd | grep -q "$avd_name"; then
        print_warning "AVD '$avd_name' already exists"
        return 0
    fi
    
    print_status "Creating AVD: $avd_name"
    echo "no" | "$avdmanager" create avd \
        -n "$avd_name" \
        -k "system-images;android-33;google_apis;x86_64" \
        -d "pixel_4" \
        --force
    
    print_success "Default AVD created: $avd_name"
}

# Verify installation
verify_installation() {
    print_status "Verifying Android SDK installation..."
    
    local errors=0
    
    # Check ANDROID_HOME
    if [ ! -d "$ANDROID_HOME" ]; then
        print_error "ANDROID_HOME directory not found: $ANDROID_HOME"
        ((errors++))
    else
        print_success "ANDROID_HOME directory exists"
    fi
    
    # Check SDK manager
    if [ -f "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" ]; then
        print_success "SDK Manager found"
    else
        print_error "SDK Manager not found"
        ((errors++))
    fi
    
    # Check ADB
    if command -v adb &> /dev/null; then
        ADB_VERSION=$(adb version | head -n1)
        print_success "ADB found: $ADB_VERSION"
    else
        print_error "ADB not found in PATH"
        ((errors++))
    fi
    
    # Check emulator
    if [ -f "$ANDROID_HOME/emulator/emulator" ]; then
        print_success "Android Emulator found"
    else
        print_error "Android Emulator not found"
        ((errors++))
    fi
    
    # Check AVD
    local avdmanager="$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager"
    if [ -f "$avdmanager" ]; then
        local avd_count=$("$avdmanager" list avd | grep -c "Name:" || true)
        if [ "$avd_count" -gt 0 ]; then
            print_success "Found $avd_count Android Virtual Device(s)"
        else
            print_warning "No Android Virtual Devices found"
        fi
    fi
    
    if [ $errors -eq 0 ]; then
        print_success "Android SDK installation verified successfully!"
        return 0
    else
        print_error "Installation verification failed with $errors error(s)"
        return 1
    fi
}

# Print usage information
print_usage() {
    echo "Android Agent AI - Android SDK Setup Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --install-sdk     Install Android SDK (default)"
    echo "  --create-avd      Create Android Virtual Device"
    echo "  --verify          Verify installation"
    echo "  --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                # Full installation"
    echo "  $0 --verify       # Verify existing installation"
    echo "  $0 --create-avd   # Create AVD only"
}

# Main installation function
main() {
    echo "🤖 Android Agent AI - Android SDK Setup"
    echo "======================================="
    echo ""
    
    # Parse command line arguments
    case "${1:-}" in
        --help)
            print_usage
            exit 0
            ;;
        --verify)
            verify_installation
            exit $?
            ;;
        --create-avd)
            create_default_avd
            exit $?
            ;;
        --install-sdk|"")
            # Full installation (default)
            ;;
        *)
            print_error "Unknown option: $1"
            print_usage
            exit 1
            ;;
    esac
    
    print_status "Starting Android SDK installation..."
    
    # Run installation steps
    detect_os
    check_java
    create_sdk_directory
    install_sdk_tools
    configure_environment
    install_sdk_packages
    create_default_avd
    
    echo ""
    print_success "Android SDK setup completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "1. Restart your terminal or run: source ~/.bashrc (or ~/.zshrc)"
    echo "2. Test the installation: ./setup-android-sdk.sh --verify"
    echo "3. Start building APKs: ./scripts/build-apk.sh"
    echo ""
    print_warning "If you encounter any issues, check the troubleshooting guide in the documentation."
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
