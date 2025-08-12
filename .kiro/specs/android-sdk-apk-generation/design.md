# Android SDK Setup and APK Generation Design

## Overview

This design document outlines the architecture and implementation approach for setting up the Android SDK development environment and enabling APK generation for the Android Agent AI React Native application. The solution will provide automated setup scripts, proper environment configuration, and streamlined APK build processes.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Development Environment                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Setup Script  │  │  Android SDK    │  │  Build Tools    │ │
│  │                 │  │                 │  │                 │ │
│  │ • OS Detection  │  │ • Platform APIs │  │ • Gradle        │ │
│  │ • Dependency    │  │ • Build Tools   │  │ • APK Builder   │ │
│  │   Installation  │  │ • Emulator      │  │ • Signing Tools │ │
│  │ • Environment   │  │ • ADB Tools     │  │ • Optimization  │ │
│  │   Configuration │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                   React Native Application                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Source Code   │  │  Build Process  │  │   APK Output    │ │
│  │                 │  │                 │  │                 │ │
│  │ • TypeScript    │  │ • Metro Bundler │  │ • Debug APK     │ │
│  │ • React Native  │  │ • Gradle Build  │  │ • Release APK   │ │
│  │ • Expo SDK      │  │ • Asset Bundle  │  │ • Signed APK    │ │
│  │ • Native Modules│  │ • Code Signing  │  │ • Installable   │ │
│  │                 │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Environment Configuration

#### Directory Structure
```
~/Android/
├── Sdk/                          # Android SDK installation
│   ├── platform-tools/           # ADB, fastboot
│   ├── platforms/                # Android API levels
│   ├── build-tools/              # Build utilities
│   ├── emulator/                 # Android emulator
│   └── tools/                    # SDK tools
├── avd/                          # Android Virtual Devices
└── gradle/                       # Gradle wrapper and cache
```

#### Environment Variables
```bash
export ANDROID_HOME=~/Android/Sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/emulator
```

## Components and Interfaces

### 1. Setup Script (`setup-android-sdk.sh`)

**Purpose**: Automated installation and configuration of Android SDK

**Interface**:
```bash
./setup-android-sdk.sh [options]
  --install-sdk     Install Android SDK
  --create-avd      Create Android Virtual Device
  --verify          Verify installation
  --help           Show usage information
```

**Responsibilities**:
- Detect operating system and architecture
- Download and install Android SDK command line tools
- Configure environment variables
- Install required SDK packages
- Create Android Virtual Device
- Verify installation completeness

### 2. SDK Manager Wrapper (`android-sdk-manager.sh`)

**Purpose**: Manage Android SDK packages and updates

**Interface**:
```bash
./android-sdk-manager.sh [command]
  list              List available packages
  install <package> Install specific package
  update            Update all packages
  licenses          Accept SDK licenses
```

**Responsibilities**:
- List available SDK packages
- Install specific Android API levels
- Update existing packages
- Accept SDK licenses automatically

### 3. APK Builder (`build-apk.sh`)

**Purpose**: Generate APK files from React Native application

**Interface**:
```bash
./build-apk.sh [options]
  --debug          Build debug APK
  --release        Build release APK
  --clean          Clean build cache
  --install        Install APK on connected device
```

**Responsibilities**:
- Clean previous builds
- Run Metro bundler
- Execute Gradle build process
- Generate signed APK
- Install APK on devices/emulators

### 4. Emulator Manager (`android-emulator.sh`)

**Purpose**: Manage Android Virtual Devices

**Interface**:
```bash
./android-emulator.sh [command]
  list              List available AVDs
  create <name>     Create new AVD
  start <name>      Start specific AVD
  stop <name>       Stop running AVD
```

**Responsibilities**:
- List available Android Virtual Devices
- Create new AVDs with optimal configurations
- Start and stop emulators
- Monitor emulator status

## Data Models

### SDK Configuration
```typescript
interface SDKConfiguration {
  sdkPath: string;
  buildToolsVersion: string;
  platformVersion: string;
  targetSdkVersion: number;
  minSdkVersion: number;
  ndkVersion?: string;
}
```

### Build Configuration
```typescript
interface BuildConfiguration {
  buildType: 'debug' | 'release';
  architecture: 'arm64-v8a' | 'armeabi-v7a' | 'x86' | 'x86_64';
  outputPath: string;
  keystore?: {
    path: string;
    alias: string;
    password: string;
  };
}
```

### AVD Configuration
```typescript
interface AVDConfiguration {
  name: string;
  device: string;
  systemImage: string;
  apiLevel: number;
  abi: string;
  sdCardSize: string;
  ramSize: string;
}
```

## Error Handling

### SDK Installation Errors
- **Missing Java**: Detect and install OpenJDK
- **Network Issues**: Retry downloads with exponential backoff
- **Permission Errors**: Guide user through permission fixes
- **Disk Space**: Check available space before installation

### Build Errors
- **Gradle Issues**: Clear cache and retry
- **Missing Dependencies**: Auto-install required packages
- **Signing Errors**: Generate debug keystore if missing
- **Memory Issues**: Adjust Gradle memory settings

### Emulator Errors
- **Hardware Acceleration**: Detect and enable if available
- **System Images**: Download required system images
- **AVD Creation**: Handle existing AVD conflicts
- **Boot Issues**: Provide troubleshooting steps

## Testing Strategy

### Unit Tests
- SDK detection and validation
- Environment variable configuration
- Package installation verification
- Build process validation

### Integration Tests
- End-to-end APK generation
- Emulator creation and startup
- Device connection and deployment
- Hot reload functionality

### System Tests
- Cross-platform compatibility (Linux, macOS, Windows)
- Multiple Android API level support
- Physical device testing
- Performance benchmarking

## Implementation Details

### Setup Script Flow
```bash
1. Detect OS and architecture
2. Check for existing Java installation
3. Download Android command line tools
4. Extract and configure SDK
5. Set environment variables
6. Install required SDK packages
7. Accept SDK licenses
8. Create default AVD
9. Verify installation
10. Generate verification report
```

### APK Build Process
```bash
1. Clean previous builds
2. Install React Native dependencies
3. Start Metro bundler
4. Generate Android bundle
5. Run Gradle assembleDebug/assembleRelease
6. Sign APK (if release build)
7. Optimize APK
8. Output APK location
9. Verify APK integrity
```

### Required SDK Packages
```
- platform-tools (ADB, fastboot)
- platforms;android-33 (Android 13)
- platforms;android-34 (Android 14)
- build-tools;33.0.0
- build-tools;34.0.0
- system-images;android-33;google_apis;x86_64
- emulator
- tools
```

## Security Considerations

### Keystore Management
- Generate secure debug keystore
- Provide guidance for release keystore creation
- Secure storage of signing credentials
- Key rotation procedures

### SDK Security
- Verify SDK package checksums
- Use official Google repositories only
- Regular security updates
- Secure environment variable handling

## Performance Optimizations

### Build Performance
- Gradle daemon configuration
- Parallel builds
- Build cache optimization
- Incremental builds

### Emulator Performance
- Hardware acceleration (HAXM/KVM)
- Optimal RAM allocation
- SSD storage for AVDs
- GPU acceleration

## Monitoring and Logging

### Build Monitoring
- Build time tracking
- Success/failure rates
- Error categorization
- Performance metrics

### SDK Health Checks
- Package version monitoring
- License compliance
- Disk usage tracking
- Update notifications