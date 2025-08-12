# 🧪 ATAK-Inspired Tactical Platform - Testing Guide

## 🎯 **Testing Overview**

We'll test all the major ATAK-inspired features we've implemented:
- ✅ **Leaflet Tactical Mapping** (PWA Dashboard)
- ✅ **React Native Mobile Maps** (Mobile App)
- ✅ **Real-time Collaboration** (LiveKit Data Channels)
- ✅ **Geofencing & Location Services**
- ✅ **Emergency Response System**
- ✅ **Tactical Communication**

---

## 🚀 **Step 1: Environment Setup**

### **Install Dependencies**
```bash
# PWA Dashboard
cd modern-dashboard
npm install

# React Native App
cd react-native-app
npm install
```

### **Database Setup**
```bash
cd modern-dashboard
npm run db:setup
```

### **Start Development Servers**
```bash
# Terminal 1: PWA Dashboard
cd modern-dashboard && npm run dev

# Terminal 2: React Native App
cd react-native-app && npx expo start

# Terminal 3: External Testing (Optional)
./setup-ngrok-testing.sh
```

---

## 🗺️ **Step 2: Test Tactical Mapping (PWA Dashboard)**

### **Access the Dashboard**
1. Open browser: `http://localhost:3000`
2. Login: `admin` / `admin123`
3. Navigate to the main dashboard

### **Test Leaflet Integration**
1. **Map Loading**: Verify the tactical map loads with Leaflet
2. **Layer Switching**: Test Street → Satellite → Terrain layers
3. **Map Controls**: Test zoom, pan, and navigation controls
4. **Device Markers**: Check if device markers appear with status

### **Test Drawing Tools**
1. Click the **Drawing** mode button (pencil icon)
2. Try drawing:
   - **Lines** for routes
   - **Polygons** for areas
   - **Circles** for zones
   - **Markers** for points of interest
3. Verify drawings persist and sync

### **Test Collaboration Panel**
1. Check the **Collaboration** panel on the right
2. Verify connection status shows "Live Collaboration"
3. Test media controls (audio/video buttons)
4. Check participant list

---

## 📱 **Step 3: Test React Native Mobile App**

### **Launch Mobile App**
1. In Expo CLI, choose your platform:
   - **Android**: Press `a` or scan QR code
   - **iOS**: Press `i` or scan QR code
   - **Web**: Press `w` for web testing

### **Test Native Mapping**
1. **Map Loading**: Verify react-native-maps loads
2. **Device Markers**: Check device location markers
3. **Map Types**: Toggle between Standard → Satellite → Hybrid
4. **User Location**: Verify "My Location" button works

### **Test Mode Controls**
1. **View Mode**: Default navigation and viewing
2. **Draw Mode**: Test drawing lines and shapes
3. **Geofence Mode**: Test creating circular geofences
4. **Measure Mode**: Test distance measurements

### **Test Location Services**
1. Grant location permissions when prompted
2. Verify GPS tracking starts
3. Check location accuracy in status panel
4. Test background location (move device)

---

## 🛡️ **Step 4: Test Geofencing System**

### **Create Geofences (PWA)**
1. Switch to **Geofence** mode
2. Click on map to create geofence
3. Set properties:
   - **Name**: "Test Zone"
   - **Radius**: 100 meters
   - **Trigger**: Enter/Exit
   - **Alert Level**: Warning

### **Test Geofence Detection (Mobile)**
1. Create geofence around current location
2. Move outside the geofence boundary
3. Check for geofence alerts in:
   - Mobile app notifications
   - PWA dashboard alerts
   - Console logs

### **Verify Database Storage**
```bash
cd modern-dashboard
npm run db:studio
```
Check tables: `geofences`, `geofence_triggers`

---

## 📡 **Step 5: Test LiveKit Communication**

### **Test Data Channels**
1. Open PWA dashboard in two browser tabs
2. Create annotation in one tab
3. Verify it appears in real-time in other tab
4. Check collaboration panel for activity

### **Test Emergency Broadcasting**
1. In mobile app, trigger emergency alert
2. Verify alert appears in PWA dashboard
3. Check emergency event logging
4. Test response acknowledgment

### **Test Media Streaming** (If LiveKit server available)
1. Enable camera/microphone in PWA
2. Start video call from mobile app
3. Test screen sharing capabilities
4. Verify audio/video quality

---

## 🚨 **Step 6: Test Emergency Response**

### **Emergency Alert Flow**
1. **Mobile App**: Tap emergency/panic button
2. **Location Broadcast**: Verify location is sent
3. **PWA Alert**: Check emergency banner appears
4. **Response**: Test "RESPOND" button functionality
5. **Logging**: Verify emergency event is logged

### **Test Emergency Features**
- **Automatic location sharing**
- **Priority messaging**
- **Team notifications**
- **Response coordination**
- **Event logging and tracking**

---

## 🔧 **Step 7: Test Backend APIs**

### **Tactical Map API**
```bash
# Test geofence creation
curl -X POST http://localhost:3000/api/tactical/map \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "geofence",
    "name": "API Test Zone",
    "type": "circle",
    "coordinates": {"latitude": 40.7128, "longitude": -74.0060},
    "radius": 50,
    "triggerType": "enter",
    "alertLevel": "info"
  }'

# Test map data retrieval
curl http://localhost:3000/api/tactical/map?includeGeofences=true \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Database Verification**
```bash
cd modern-dashboard
npm run db:studio
```

Check these tables:
- `map_layers` - Map layer data
- `map_annotations` - Tactical annotations
- `geofences` - Boundary definitions
- `geofence_triggers` - Entry/exit events
- `emergency_events` - Emergency responses
- `chat_messages` - Tactical communications

---

## 📊 **Step 8: Performance Testing**

### **Map Performance**
- **Load Time**: Should be < 2 seconds
- **Marker Rendering**: Test with 100+ devices
- **Real-time Updates**: Check < 100ms latency
- **Memory Usage**: Monitor browser/mobile memory

### **Location Accuracy**
- **GPS Precision**: Check accuracy readings
- **Update Frequency**: Verify 10-second intervals
- **Battery Usage**: Monitor mobile battery drain
- **Background Processing**: Test app backgrounding

### **Communication Performance**
- **Message Latency**: Real-time updates < 50ms
- **File Sharing**: Test large file uploads
- **Video Quality**: Check streaming performance
- **Connection Stability**: Test network interruptions

---

## 🐛 **Common Issues & Solutions**

### **Map Not Loading**
```bash
# Check Leaflet CSS import
# Verify OpenStreetMap tile access
# Check browser console for errors
```

### **Location Permission Denied**
```bash
# Mobile: Check app permissions in settings
# PWA: Allow location access in browser
# Verify HTTPS for production
```

### **Real-time Sync Issues**
```bash
# Check WebSocket connection
# Verify LiveKit configuration
# Test network connectivity
```

### **Database Connection Issues**
```bash
cd modern-dashboard
npm run db:generate
npm run db:push
```

---

## ✅ **Testing Checklist**

### **Core Features**
- [ ] PWA Dashboard loads with Leaflet map
- [ ] React Native app loads with native maps
- [ ] Device markers appear with status
- [ ] Map layers switch correctly
- [ ] Drawing tools work properly
- [ ] Real-time collaboration functions

### **Tactical Features**
- [ ] Geofences create and trigger alerts
- [ ] Location tracking works in background
- [ ] Emergency alerts broadcast correctly
- [ ] Tactical communication channels work
- [ ] File sharing and media work
- [ ] Multi-user collaboration syncs

### **Performance**
- [ ] Map loads in < 2 seconds
- [ ] Real-time updates < 100ms latency
- [ ] Battery usage < 5% per hour
- [ ] Memory usage stays reasonable
- [ ] Network usage optimized

### **Security**
- [ ] Authentication works properly
- [ ] Role-based access enforced
- [ ] Data encryption enabled
- [ ] Secure storage functioning
- [ ] Audit logging working

---

## 🎯 **Expected Results**

### **Successful Test Indicators**
- ✅ **Maps load quickly** with smooth interaction
- ✅ **Real-time updates** appear instantly across platforms
- ✅ **Geofences trigger** when boundaries are crossed
- ✅ **Emergency alerts** propagate immediately
- ✅ **Location tracking** works accurately in background
- ✅ **Collaboration features** sync between users
- ✅ **Performance metrics** meet tactical requirements

### **Success Metrics**
- **Map Load Time**: < 2 seconds ✅
- **Real-time Latency**: < 50ms ✅
- **Geofence Detection**: < 1 second ✅
- **Emergency Response**: < 5 seconds ✅
- **Battery Efficiency**: < 5% per hour ✅
- **Cross-platform Sync**: 100% reliability ✅

---

## 🚀 **Ready for Testing!**

Your ATAK-inspired tactical platform is ready for comprehensive testing. Follow this guide to verify all features work correctly and meet tactical operation requirements.

**Start Testing**: Run the setup commands above and begin with Step 1! 🎯

---

*Testing Guide - August 7, 2025 - ATAK-Inspired Tactical Platform*