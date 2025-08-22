#!/bin/bash

# Android Agent AI - Cloud APK Build Script
# Builds APK using Expo Application Services (EAS)

echo "🚀 Building Android Agent AI APK via Expo Cloud..."

# Navigate to React Native app directory
cd react-native-app

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your API keys and run this script again."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "☁️  Installing EAS CLI..."
    npm install -g eas-cli
fi

# Login to Expo (if not already logged in)
echo "🔐 Checking Expo authentication..."
if ! expo whoami &> /dev/null; then
    echo "Please login to Expo:"
    expo login
fi

# Configure EAS project (if not already configured)
echo "⚙️  Configuring EAS project..."
if [ ! -f eas.json ]; then
    eas build:configure
else
    echo "✅ EAS already configured"
fi

# Show build options
echo ""
echo "🏗️  Available build profiles:"
echo "1. preview  - APK for testing (recommended)"
echo "2. production - Production APK"
echo "3. production-aab - Production AAB for Play Store"
echo ""

# Ask user which build profile to use
read -p "Select build profile (1-3) [default: 1]: " choice
case $choice in
    2)
        PROFILE="production"
        echo "🏭 Building production APK..."
        ;;
    3)
        PROFILE="production-aab"
        echo "🏪 Building production AAB for Play Store..."
        ;;
    *)
        PROFILE="preview"
        echo "🧪 Building preview APK for testing..."
        ;;
esac

# Start the build
echo "☁️  Starting EAS build..."
eas build --platform android --profile $PROFILE

# Check build status
echo ""
echo "🔍 Build submitted to Expo cloud!"
echo "📱 You can monitor the build progress at: https://expo.dev/accounts/[your-account]/projects/android-agent-tactical/builds"
echo ""
echo "⏳ The build typically takes 10-15 minutes."
echo "📧 You'll receive an email when the build is complete."
echo "📲 Download link will be available in the Expo dashboard."

# Show next steps
echo ""
echo "🎯 Next steps:"
echo "1. Wait for build completion email"
echo "2. Download APK from Expo dashboard"
echo "3. Install on Android device: adb install android-agent-tactical.apk"
echo "4. Or share download link for direct installation"

echo ""
echo "✅ Build process initiated successfully!"