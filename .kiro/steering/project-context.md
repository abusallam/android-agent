# Android Agent Project Context

## Project Overview
Android Agent is a powerful remote management suite for Android devices that allows administrators to monitor and control Android devices through a web interface. The system consists of:

1. **Web Dashboard** - Administrative interface for device management
2. **Android Client** - Mobile app installed on target devices
3. **Real-time Communication** - Socket.IO for live data streaming
4. **APK Builder** - Dynamic APK generation with custom server configurations

## Core Features
- **Device Monitoring**: GPS tracking, call logs, SMS logs, contacts, installed apps
- **Remote Control**: File management, microphone recording, WiFi scanning
- **Real-time Data**: Live clipboard monitoring, notification logging
- **Security Management**: Permission monitoring, device information
- **Communication**: Send SMS, manage device settings

## Current Architecture
- **Backend**: Node.js + Express + Socket.IO + LowDB
- **Frontend**: EJS templates + jQuery + Semantic UI
- **Mobile**: Native Android (Java) with Socket.IO client
- **Database**: JSON file-based storage with LowDB
- **Infrastructure**: Docker containerization

## Known Issues
- **Critical Security Vulnerability**: Broken authentication (bcrypt vs MD5 mismatch)
- **Outdated Technology Stack**: Using 2018-era frameworks and libraries
- **Hardcoded Configuration**: Network addresses and settings not configurable
- **Unused Dependencies**: Redis and session management not implemented
- **Legacy Mobile Platform**: Android API 24 (2016), very outdated

## Modernization Goals
- **Security**: Fix authentication and implement modern security practices
- **Technology Stack**: Upgrade to modern frameworks and libraries
- **User Experience**: Modern, responsive, real-time dashboard
- **Mobile Platform**: Update to modern Android development practices
- **Scalability**: Implement proper database and session management
- **AI Integration**: Add agentic capabilities for intelligent device management
- **Geolocation**: Enhanced location tracking and mapping features

## Target Users
- **Security Professionals**: Device monitoring and management
- **IT Administrators**: Corporate device oversight
- **Researchers**: Mobile security and behavior analysis
- **Developers**: Building custom device management solutions