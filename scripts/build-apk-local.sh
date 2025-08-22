#!/bin/bash

# Android Agent AI - Local APK Build Script
# Builds APK using local Android SDK

echo "🚀 Building Android Agent AI APK locally..."

# Check if Android SDK is installed
if [ -z "$ANDROID_HOME" ]; then
    echo "❌ ANDROID_HOME not set. Please install Android SDK first."
    echo "Run: ./setup-android-sdk.sh"
    exit 1
fi

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

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo "📱 Installing Expo CLI..."
    npm install -g @expo/cli
fi

# Login to Expo (if not already logged in)
echo "🔐 Checking Expo authentication..."
if ! expo whoami &> /dev/null; then
    echo "Please login to Expo:"
    expo login
fi

# Prebuild for local development
echo "🔧 Prebuilding for local development..."
expo prebuild --platform android --clear

# Build APK locally
echo "🏗️  Building APK locally..."
cd android
./gradlew assembleRelease

# Check if build was successful
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo "✅ APK built successfully!"
    echo "📱 APK location: react-native-app/android/app/build/outputs/apk/release/app-release.apk"
    
    # Copy APK to root directory for easy access
    cp app/build/outputs/apk/release/app-release.apk ../../android-agent-tactical.apk
    echo "📋 APK copied to: android-agent-tactical.apk"
    
    # Show APK info
    echo ""
    echo "📊 APK Information:"
    ls -lh ../../android-agent-tactical.apk
    
    echo ""
    echo "🎉 Build complete! You can now install the APK on your Android device."
    echo "📲 Install command: adb install android-agent-tactical.apk"
else
    echo "❌ APK build failed. Check the logs above for errors."
    exit 1
fi