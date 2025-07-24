# Project Structure & Organization

## Root Directory Layout
```
android-agent/
├── client/                 # Android client application
├── server/                 # Node.js backend server
├── Screenshots/            # Documentation screenshots
├── docker-compose.yml      # Multi-service orchestration
├── Dockerfile             # Server container definition
└── README.md              # Project documentation
```

## Server Structure (`server/`)
```
server/
├── index.js               # Main application entry point
├── package.json           # Node.js dependencies and scripts
├── app/factory/           # APK building and signing tools
│   ├── apktool.jar        # APK decompilation/compilation tool
│   ├── sign.jar           # APK signing utility
│   ├── base.apk           # Template APK for building
│   ├── decompiled/        # Decompiled APK source (smali)
│   ├── testkey.pk8        # Test signing key
│   └── testkey.x509.pem   # Test certificate
├── assets/                # Web assets and templates
│   ├── views/             # EJS templates
│   │   ├── deviceManagerPages/  # Device-specific pages
│   │   └── partials/      # Reusable template components
│   └── webpublic/         # Static web assets
│       ├── css/           # Stylesheets (Semantic UI + custom)
│       ├── js/            # Client-side JavaScript
│       ├── client_downloads/  # File download storage
│       └── build.s.apk    # Generated APK download
├── clientData/            # Persistent client data storage
├── includes/              # Core server modules
│   ├── const.js           # Configuration constants
│   ├── databaseGateway.js # LowDB database interface
│   ├── clientManager.js   # Device connection management
│   ├── logManager.js      # Application logging
│   ├── apkBuilder.js      # APK generation logic
│   └── expressRoutes.js   # HTTP route definitions
```

## Android Client Structure (`client/`)
```
client/
├── build.gradle           # Project-level build configuration
├── settings.gradle        # Gradle settings
├── gradle.properties      # Build properties
├── gradlew               # Gradle wrapper script
├── app/                  # Main application module
│   ├── build.gradle      # App-level build configuration
│   ├── proguard-rules.pro # Code obfuscation rules
│   └── src/main/
│       ├── AndroidManifest.xml  # App permissions and components
│       ├── java/com/etechd/l3mon/  # Java source code
│       │   ├── MainActivity.java      # App entry point
│       │   ├── MainService.java       # Background service
│       │   ├── IOSocket.java          # Socket.IO communication
│       │   ├── ConnectionManager.java # Network management
│       │   ├── LocManager.java        # GPS/location services
│       │   ├── CallsManager.java      # Call log access
│       │   ├── SMSManager.java        # SMS operations
│       │   ├── ContactsManager.java   # Contacts access
│       │   ├── FileManager.java       # File system operations
│       │   ├── MicManager.java        # Microphone recording
│       │   ├── CameraManager.java     # Camera operations
│       │   ├── WifiScanner.java       # WiFi network scanning
│       │   ├── AppList.java           # Installed apps enumeration
│       │   ├── PermissionManager.java # Permission handling
│       │   ├── NotificationListener.java # Notification monitoring
│       │   ├── MyReceiver.java        # Broadcast receiver
│       │   └── ServiceReciever.java   # Service management
│       └── res/          # Android resources
│           ├── layout/   # UI layouts
│           ├── values/   # Strings, colors, dimensions
│           └── mipmap-*/ # App icons (various densities)
```

## Key Architectural Patterns

### Server-Side Organization
- **Global Modules**: Core services exposed as global variables (CONST, db, logManager, clientManager, apkBuilder)
- **Route-Based Structure**: Express routes organized in separate module (`expressRoutes.js`)
- **Manager Pattern**: Separate managers for clients, logs, and APK building
- **Configuration Centralization**: All constants and settings in `const.js`

### Client-Side Organization
- **Service-Oriented**: Each feature implemented as separate manager class
- **Socket Communication**: Centralized in `IOSocket.java` with message key system
- **Background Processing**: Main functionality runs in `MainService.java`
- **Permission-Based**: Features gated by Android permission system

### Data Flow Patterns
- **Real-time Communication**: Socket.IO events between Android client and web dashboard
- **Command Queue System**: Asynchronous command execution with callbacks
- **File-Based Persistence**: LowDB for configuration, file system for client data
- **Template Rendering**: Server-side EJS templates with client-side jQuery

### Security Considerations
- **Authentication Flow**: Cookie-based sessions with token validation
- **APK Signing**: Test certificates (not production-ready)
- **TLS Support**: Optional HTTPS configuration
- **Permission Management**: Android runtime permissions for sensitive operations

## File Naming Conventions
- **Server Files**: camelCase JavaScript modules
- **Android Files**: PascalCase Java classes
- **Templates**: lowercase with underscores (device_manager.ejs)
- **Static Assets**: lowercase with hyphens (custom.css)
- **Configuration**: UPPERCASE constants, lowercase environment variables