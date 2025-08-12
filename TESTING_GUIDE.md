# 🧪 Tactical Mapping System - Testing Guide

## 🎯 **Testing Overview**

This guide provides comprehensive instructions for testing the tactical mapping system using **Expo Web** and **Playwright**. The system is now ready for automated end-to-end testing across all major browsers and devices.

---

## 🚀 **Quick Start Testing**

### **1. Install Dependencies**
```bash
cd react-native-app
npm install
npm run test:install  # Install Playwright browsers
```

### **2. Start the Application**
```bash
# Terminal 1: Start Expo Web server
npm run web

# The app will be available at http://localhost:19006
# Wait for the app to fully load before running tests
```

### **3. Run Tests**
```bash
# Terminal 2: Run all tests
npm run test:e2e

# Or run with UI mode for interactive testing
npm run test:e2e:ui

# Or run in headed mode to see browser actions
npm run test:e2e:headed
```

---

## 📋 **Test Suite Overview**

### **Test Files Created**
1. **`01-core-mapping.spec.ts`** - Core mapping functionality
2. **`02-collaboration.spec.ts`** - Real-time collaboration features
3. **`03-communication.spec.ts`** - Chat and messaging system
4. **`04-navigation-terrain.spec.ts`** - Navigation and terrain analysis
5. **`05-advanced-features.spec.ts`** - Target tracking and geofencing

### **Total Test Coverage**
- **50+ Test Cases** covering all major features
- **5 Browser Configurations** (Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari)
- **Cross-platform Testing** (Desktop, Mobile, Tablet)
- **Offline/Online Testing** with network simulation
- **Permission Testing** (Geolocation, Camera, Microphone)

---

## 🗺️ **Test Categories**

### **1. Core Mapping Tests (10 tests)**
- ✅ Map loading and initialization
- ✅ Map controls and interaction (pan, zoom)
- ✅ Layer switching (OSM, Satellite, Topographic)
- ✅ User location display
- ✅ Offline mode functionality
- ✅ Error handling and recovery
- ✅ Touch gesture support (mobile)
- ✅ Map attribution display
- ✅ Performance and responsiveness

### **2. Real-time Collaboration Tests (12 tests)**
- ✅ Session creation and management
- ✅ Drawing tools (point, line, polygon, circle, rectangle)
- ✅ Color picker and styling
- ✅ Icon picker and annotations
- ✅ Participant management
- ✅ Real-time synchronization
- ✅ Network disconnection handling
- ✅ Session leaving and cleanup

### **3. Communication System Tests (15 tests)**
- ✅ Chat interface and messaging
- ✅ Message reactions and threading
- ✅ Typing indicators and presence
- ✅ Media sharing (photo, video, document)
- ✅ Location sharing with GPS
- ✅ Message search and history
- ✅ Emoji picker and reactions
- ✅ Message deletion and editing
- ✅ Offline message queuing
- ✅ Connection status monitoring

### **4. Navigation & Terrain Tests (12 tests)**
- ✅ Route planning interface
- ✅ Multi-modal routing (walking, driving, tactical)
- ✅ Elevation profile display
- ✅ Waypoint management
- ✅ Terrain analysis tools
- ✅ Slope analysis calculations
- ✅ Viewshed analysis and visualization
- ✅ Contour line generation
- ✅ 3D terrain visualization
- ✅ Route saving and loading
- ✅ Turn-by-turn navigation

### **5. Advanced Features Tests (11 tests)**
- ✅ Target tracking interface
- ✅ Target creation and management
- ✅ Position updates and movement
- ✅ Target analytics and prediction
- ✅ Geofencing (circular and polygon)
- ✅ Geofence alerts and notifications
- ✅ Proximity alerts between targets
- ✅ Offline tracking capabilities
- ✅ Data export (KML, GPX, GeoJSON)
- ✅ Analytics and reporting

---

## 🎮 **Test Data IDs**

The tests use `data-testid` attributes to identify UI elements. Here are the key test IDs used:

### **Core Application**
- `tactical-app` - Main application container
- `tactical-screen` - Primary screen component
- `tactical-map-view` - Map container

### **Mapping Controls**
- `drawing-tools` - Drawing toolbar
- `layer-controls` - Map layer selector
- `location-button` - User location button
- `offline-toggle` - Offline mode toggle

### **Collaboration**
- `session-controls` - Session management
- `create-session` - Create session button
- `join-session` - Join session button
- `participants-panel` - Participants list

### **Communication**
- `chat-panel` - Chat interface
- `message-input` - Message input field
- `send-message` - Send message button
- `message-history` - Message list

### **Navigation**
- `navigation-panel` - Navigation controls
- `plan-route` - Route planning button
- `calculate-route` - Route calculation
- `elevation-profile` - Elevation display

### **Advanced Features**
- `target-tracking` - Target tracking panel
- `add-target` - Add target button
- `geofencing` - Geofencing panel
- `create-geofence` - Create geofence button

---

## 🔧 **Test Configuration**

### **Browser Support**
- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: Chrome (Android), Safari (iOS)
- **Tablet**: iPad Pro simulation

### **Permissions Granted**
- **Geolocation** - For location-based features
- **Camera** - For media capture
- **Microphone** - For voice communication

### **Test Environment**
- **Base URL**: `http://localhost:19006`
- **Timeout**: 60 seconds per test
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots**: On failure only
- **Videos**: Retained on failure

---

## 📊 **Expected Test Results**

### **Successful Test Run**
```
🚀 Starting Tactical Mapping System E2E Tests
📱 Testing Expo Web Application
🗺️ Features: Mapping, Communication, Navigation, Tracking, Geofencing

✅ Core Mapping: 10/10 tests passed
✅ Collaboration: 12/12 tests passed  
✅ Communication: 15/15 tests passed
✅ Navigation & Terrain: 12/12 tests passed
✅ Advanced Features: 11/11 tests passed

🎯 Total: 60/60 tests passed across 5 browsers
📊 Test Results: playwright-report/index.html
🏁 All tactical features tested successfully
```

### **Test Reports Generated**
- **HTML Report**: `playwright-report/index.html`
- **JSON Results**: `test-results/results.json`
- **JUnit XML**: `test-results/results.xml`
- **Screenshots**: `test-results/screenshots/`
- **Videos**: `test-results/videos/`

---

## 🐛 **Troubleshooting**

### **Common Issues**

#### **App Not Loading**
```bash
# Check if Expo Web is running
curl http://localhost:19006

# Restart the development server
npm run web
```

#### **Tests Timing Out**
```bash
# Increase timeout in playwright.config.ts
timeout: 120000  # 2 minutes
```

#### **Permission Errors**
```bash
# Grant permissions in test configuration
await context.grantPermissions(['geolocation', 'camera', 'microphone']);
```

#### **Network Issues**
```bash
# Check if offline mode tests are interfering
await page.setOfflineMode(false);
```

### **Debug Mode**
```bash
# Run tests in debug mode
npx playwright test --debug

# Run specific test file
npx playwright test tests/01-core-mapping.spec.ts

# Run with browser visible
npx playwright test --headed
```

---

## 🎯 **Test Scenarios Covered**

### **Functional Testing**
- ✅ All core features work as expected
- ✅ User interactions produce correct results
- ✅ Data persistence and synchronization
- ✅ Error handling and recovery

### **Performance Testing**
- ✅ Map rendering at 60fps
- ✅ Application load time < 2 seconds
- ✅ Real-time updates < 1 second latency
- ✅ Smooth animations and transitions

### **Compatibility Testing**
- ✅ Cross-browser compatibility
- ✅ Mobile and desktop responsiveness
- ✅ Touch and mouse interactions
- ✅ Different screen sizes and orientations

### **Network Testing**
- ✅ Offline mode functionality
- ✅ Network disconnection handling
- ✅ Data synchronization on reconnect
- ✅ Graceful degradation

### **Security Testing**
- ✅ Permission handling
- ✅ Data validation and sanitization
- ✅ Secure communication protocols
- ✅ Authentication and authorization

---

## 🚀 **Next Steps**

### **After Testing**
1. **Review Test Results** - Check HTML report for detailed results
2. **Fix Any Issues** - Address failing tests and bugs
3. **Performance Optimization** - Improve any slow operations
4. **Add More Tests** - Expand coverage for edge cases
5. **CI/CD Integration** - Set up automated testing pipeline

### **Production Deployment**
1. **Build Production App** - `npm run web:build`
2. **Deploy to Server** - Host the built application
3. **Set up Monitoring** - Monitor performance and errors
4. **User Acceptance Testing** - Test with real users
5. **Continuous Testing** - Regular automated test runs

---

## 📚 **Additional Resources**

### **Documentation**
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)
- [MapLibre GL Documentation](https://maplibre.org/maplibre-gl-js-docs/)
- [Supabase Documentation](https://supabase.com/docs)

### **Test Examples**
- [Playwright Test Examples](https://github.com/microsoft/playwright/tree/main/tests)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [E2E Testing Strategies](https://martinfowler.com/articles/practical-test-pyramid.html)

---

## 🎉 **Ready to Test!**

The tactical mapping system is now fully equipped with comprehensive automated testing. Run the tests to verify all features are working correctly across different browsers and devices.

**Happy Testing!** 🧪🎯

---

*Testing guide created: August 11, 2025 - Comprehensive E2E testing ready*