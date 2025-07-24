# Technology Stack & Build System

## Backend Stack
- **Runtime**: Node.js 18 (Alpine Linux in Docker)
- **Web Framework**: Express.js 4.18.2
- **Template Engine**: EJS 3.1.9
- **Real-time Communication**: Socket.IO 4.7.2
- **Database**: LowDB 5.1.0 (JSON file-based)
- **Authentication**: bcrypt 5.1.1 (with MD5 fallback - security issue)
- **Session Management**: Redis 4.6.10 + connect-redis 7.1.0
- **Additional Libraries**: body-parser, cookie-parser, geoip-lite

## Frontend Stack
- **UI Framework**: Semantic UI (legacy)
- **JavaScript**: jQuery 3.4.1
- **Mapping**: Leaflet.js with OpenStreetMap
- **Styling**: Custom SCSS + Semantic UI themes

## Android Client
- **Language**: Java (legacy)
- **Target SDK**: Android API 24 (Android 7.0 - 2016)
- **Min SDK**: Android API 11 (Android 3.0)
- **Build Tools**: Gradle 3.4.2
- **Socket Client**: socket.io-client 0.8.3
- **Build System**: Android Gradle Plugin

## Infrastructure
- **Containerization**: Docker with multi-service setup
- **Orchestration**: Docker Compose
- **Base Image**: node:18-alpine
- **Java Runtime**: OpenJDK 8 (for APK building)
- **Reverse Proxy**: Not included (manual setup required)

## APK Building Tools
- **APK Tool**: apktool.jar (for decompiling/recompiling)
- **Code Signing**: sign.jar with test certificates
- **Smali Patching**: Direct smali code modification for server configuration

## Common Commands

### Development
```bash
# Start the full stack
docker-compose up --build

# Start in development mode
cd server && npm run test  # Actually runs node index.js

# Build Android client
cd client && ./gradlew build

# Clean Android build
cd client && ./gradlew clean
```

### Production Deployment
```bash
# Production deployment
docker-compose up -d --build

# View logs
docker-compose logs -f l3mon

# Restart services
docker-compose restart
```

### APK Building
```bash
# APK tools are automated through web interface
# Manual commands (from server directory):
java -jar app/factory/apktool.jar b app/factory/decompiled -o assets/webpublic/build.apk
java -jar app/factory/sign.jar assets/webpublic/build.apk
```

## Environment Configuration
- **Ports**: Web interface (22533), Socket.IO (22222), Redis (6379)
- **Security**: TLS optional, bcrypt rounds configurable
- **Admin Credentials**: Configurable via environment variables
- **Data Persistence**: clientData volume mount, Redis data volume

## Known Technical Debt
- **Outdated Android SDK**: Using 2016-era Android APIs
- **Mixed Authentication**: bcrypt + MD5 creates security vulnerability
- **Legacy Frontend**: jQuery + Semantic UI from 2018
- **File-based Database**: LowDB not suitable for production scale
- **Hardcoded Paths**: Many file paths are not configurable