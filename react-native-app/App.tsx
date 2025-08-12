import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import TacticalScreen from './src/screens/TacticalScreen';
import { DeviceService } from './src/services/DeviceService';
import { LocationService } from './src/services/LocationService';
import { StorageService } from './src/services/StorageService';
import { ApiService } from './src/services/ApiService';
import { CameraService } from './src/services/CameraService';
import { AudioService } from './src/services/AudioService';
import { SensorService } from './src/services/SensorService';
import PermissionService, { AllPermissions } from './src/services/PermissionService';
import { DeviceInfo, LocationData } from './src/types';
import { UI_CONSTANTS } from './src/constants';
import { TACTICAL_THEMES, TacticalThemeName, getTheme } from './src/constants/themes';

interface AppState {
  deviceInfo: DeviceInfo | null;
  currentLocation: LocationData | null;
  isLocationTracking: boolean;
  isRegistered: boolean;
  lastSync: string | null;
  batteryInfo: any;
  networkInfo: any;
  capabilities: any;
  backwardCompatibility: any;
  cameraSupport: any;
  audioSupport: any;
  isRecording: boolean;
  recordingDuration: number;
}

export default function App() {
  const [state, setState] = useState<AppState>({
    deviceInfo: null,
    currentLocation: null,
    isLocationTracking: false,
    isRegistered: false,
    lastSync: null,
    batteryInfo: null,
    networkInfo: null,
    capabilities: null,
    backwardCompatibility: null,
    cameraSupport: null,
    audioSupport: null,
    isRecording: false,
    recordingDuration: 0,
  });

  const [sensorData, setSensorData] = useState<any>(null);
  const [isSensorMonitoring, setIsSensorMonitoring] = useState(false);
  const [showTacticalSystem, setShowTacticalSystem] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing Android Agent Prototype...');
      
      // Initialize audio system
      await AudioService.initialize();
      
      // Get comprehensive device status
      const deviceStatus = await DeviceService.getDeviceStatus();
      console.log('📱 Device Status:', deviceStatus);
      
      // Check backward compatibility
      const backwardCompatibility = await DeviceService.checkBackwardCompatibility();
      console.log('🔄 Backward Compatibility:', backwardCompatibility);
      
      // Check camera support
      const cameraSupport = await CameraService.checkCameraSupport();
      console.log('📷 Camera Support:', cameraSupport);
      
      // Check audio capabilities
      const audioSupport = await AudioService.getAudioCapabilities();
      console.log('🎵 Audio Support:', audioSupport);
      
      // Initialize sensor monitoring
      const sensorCapabilities = await SensorService.getSensorCapabilities();
      console.log('🔬 Sensor Capabilities:', sensorCapabilities);
      
      // Start sensor monitoring if available
      if (sensorCapabilities.supportedSensors.length > 0) {
        const sensorStarted = await SensorService.startSensorMonitoring(1000);
        if (sensorStarted) {
          setIsSensorMonitoring(true);
          console.log('🔬 Sensor monitoring started');
          
          // Update sensor data periodically
          const sensorInterval = setInterval(() => {
            const currentSensorData = SensorService.getCurrentSensorData();
            setSensorData(currentSensorData);
          }, 2000);
          
          // Store interval for cleanup
          (global as any).sensorInterval = sensorInterval;
        }
      }
      
      // Check if device is registered
      const isRegistered = await checkRegistrationStatus();
      
      // Get cached location
      const locationService = LocationService.getInstance();
      const cachedLocation = await locationService.getCachedLocation();
      
      // Check location tracking status
      const trackingStatus = locationService.getTrackingStatus();
      
      setState({
        deviceInfo: deviceStatus.deviceInfo,
        currentLocation: cachedLocation,
        isLocationTracking: trackingStatus.foregroundActive || trackingStatus.backgroundActive,
        isRegistered,
        lastSync: null,
        batteryInfo: deviceStatus.battery,
        networkInfo: deviceStatus.network,
        capabilities: deviceStatus.capabilities,
        backwardCompatibility,
        cameraSupport,
        audioSupport,
        isRecording: false,
        recordingDuration: 0,
      });
      
      // Show compatibility warnings if needed
      if (backwardCompatibility.limitations.length > 0) {
        Alert.alert(
          'Device Compatibility',
          `Some features may be limited on this device:\n\n${backwardCompatibility.limitations.join('\n')}\n\nRecommendations:\n${backwardCompatibility.recommendations.join('\n')}`,
          [{ text: 'OK' }]
        );
      }
      
      console.log('✅ App initialized successfully');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      Alert.alert('Initialization Error', 'Failed to initialize the app. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkRegistrationStatus = async (): Promise<boolean> => {
    try {
      // Check if we have a stored token
      const token = await StorageService.getToken();
      if (!token) return false;
      
      // Verify with backend
      const healthCheck = await ApiService.healthCheck();
      return healthCheck;
    } catch (error) {
      console.error('Registration status check failed:', error);
      return false;
    }
  };

  const handleRegisterDevice = async () => {
    try {
      setIsLoading(true);
      
      // For prototype, we'll use a mock token
      await StorageService.storeToken('mock-jwt-token-for-prototype');
      
      const success = await DeviceService.registerDevice();
      
      if (success) {
        setState(prev => ({ ...prev, isRegistered: true }));
        Alert.alert('Success', 'Device registered successfully!');
      } else {
        Alert.alert('Error', 'Failed to register device. Please try again.');
      }
    } catch (error) {
      console.error('Device registration failed:', error);
      Alert.alert('Error', 'Registration failed. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartLocationTracking = async () => {
    try {
      setIsLoading(true);
      
      const locationService = LocationService.getInstance();
      const success = await locationService.startForegroundTracking();
      
      if (success) {
        setState(prev => ({ ...prev, isLocationTracking: true }));
        Alert.alert('Success', 'Location tracking started!');
        
        // Get current location
        const location = await locationService.getCurrentLocation();
        if (location) {
          setState(prev => ({ ...prev, currentLocation: location }));
        }
      } else {
        Alert.alert('Error', 'Failed to start location tracking. Please check permissions.');
      }
    } catch (error) {
      console.error('Location tracking failed:', error);
      Alert.alert('Error', 'Failed to start location tracking.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopLocationTracking = async () => {
    try {
      const locationService = LocationService.getInstance();
      await locationService.stopTracking();
      setState(prev => ({ ...prev, isLocationTracking: false }));
      Alert.alert('Success', 'Location tracking stopped!');
    } catch (error) {
      console.error('Stop tracking failed:', error);
      Alert.alert('Error', 'Failed to stop location tracking.');
    }
  };

  const handleSyncData = async () => {
    try {
      setIsLoading(true);
      
      // Get current sensor data
      const currentSensorData = isSensorMonitoring ? SensorService.getCurrentSensorData() : null;
      
      const success = await ApiService.syncDeviceData({
        deviceInfo: state.deviceInfo,
        location: state.currentLocation,
        batteryInfo: state.batteryInfo,
        networkInfo: state.networkInfo,
        sensorData: currentSensorData,
        timestamp: new Date().toISOString(),
        source: 'react-native-app'
      });
      
      if (success) {
        setState(prev => ({ ...prev, lastSync: new Date().toLocaleTimeString() }));
        Alert.alert(
          'Success', 
          `Data synchronized successfully!\n\n${currentSensorData ? 'Sensor data included' : 'No sensor data'}\n${state.currentLocation ? 'Location included' : 'No location data'}`
        );
      } else {
        Alert.alert('Error', 'Failed to sync data. Please try again.');
      }
    } catch (error) {
      console.error('Data sync failed:', error);
      Alert.alert('Error', 'Data synchronization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      setIsLoading(true);
      
      // Check camera permissions
      const permissions = await CameraService.requestPermissions();
      if (!permissions.camera) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      // For prototype, we'll simulate taking a photo
      Alert.alert(
        'Camera Feature',
        'Camera functionality is ready! In a full implementation, this would:\n\n• Open camera interface\n• Capture photo\n• Save to device\n• Upload to backend\n• Show in gallery',
        [
          { text: 'OK', onPress: () => console.log('Photo feature demonstrated') }
        ]
      );
    } catch (error) {
      console.error('Take photo failed:', error);
      Alert.alert('Error', 'Failed to access camera.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      const success = await AudioService.startRecording(60); // 60 seconds max
      
      if (success) {
        setState(prev => ({ ...prev, isRecording: true, recordingDuration: 0 }));
        
        // Start duration counter
        const interval = setInterval(async () => {
          const status = await AudioService.getRecordingStatus();
          setState(prev => ({ 
            ...prev, 
            recordingDuration: status.duration,
            isRecording: status.isRecording 
          }));
          
          if (!status.isRecording) {
            clearInterval(interval);
          }
        }, 1000);
        
        Alert.alert('Success', 'Audio recording started!');
      } else {
        Alert.alert('Error', 'Failed to start recording. Please check permissions.');
      }
    } catch (error) {
      console.error('Start recording failed:', error);
      Alert.alert('Error', 'Failed to start audio recording.');
    }
  };

  const handleStopRecording = async () => {
    try {
      const result = await AudioService.stopRecording();
      
      if (result && result.status === 'completed') {
        setState(prev => ({ ...prev, isRecording: false, recordingDuration: 0 }));
        
        Alert.alert(
          'Recording Complete',
          `Recording saved successfully!\n\nDuration: ${Math.floor(result.duration / 1000)}s\nSize: ${Math.round(result.size / 1024)}KB\n\nIn a full implementation, this would be uploaded to the backend.`,
          [
            { text: 'OK', onPress: () => console.log('Recording completed:', result) }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to stop recording properly.');
      }
    } catch (error) {
      console.error('Stop recording failed:', error);
      Alert.alert('Error', 'Failed to stop audio recording.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show tactical mapping system if requested
  if (showTacticalSystem) {
    return (
      <View style={{ flex: 1 }} testID="tactical-app">
        <TacticalScreen />
      </View>
    );
  }

  return (
    <View style={styles.container} testID="device-monitoring-app">
      <StatusBar style="light" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Android Agent</Text>
          <Text style={styles.subtitle}>Prototype v1.0.0</Text>
        </View>

        {/* Device Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Device Information</Text>
          {state.deviceInfo ? (
            <View style={styles.infoContainer}>
              <InfoRow label="Device ID" value={state.deviceInfo.deviceId} />
              <InfoRow label="Model" value={state.deviceInfo.model || 'Unknown'} />
              <InfoRow label="Manufacturer" value={state.deviceInfo.manufacturer || 'Unknown'} />
              <InfoRow label="OS Version" value={state.deviceInfo.osVersion || 'Unknown'} />
              <InfoRow label="Platform" value={state.deviceInfo.platform || 'Unknown'} />
              <InfoRow label="App Version" value={state.deviceInfo.appVersion || 'Unknown'} />
            </View>
          ) : (
            <Text style={styles.noDataText}>No device information available</Text>
          )}
        </View>

        {/* Location Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Location Status</Text>
          {state.currentLocation ? (
            <View style={styles.infoContainer}>
              <InfoRow label="Latitude" value={state.currentLocation.latitude?.toFixed(6) || 'N/A'} />
              <InfoRow label="Longitude" value={state.currentLocation.longitude?.toFixed(6) || 'N/A'} />
              <InfoRow label="Accuracy" value={`${state.currentLocation.accuracy?.toFixed(1) || 'N/A'}m`} />
              <InfoRow 
                label="Last Update" 
                value={new Date(state.currentLocation.timestamp).toLocaleTimeString()} 
              />
            </View>
          ) : (
            <Text style={styles.noDataText}>No location data available</Text>
          )}
          
          <View style={styles.buttonContainer}>
            {!state.isLocationTracking ? (
              <TouchableOpacity style={styles.primaryButton} onPress={handleStartLocationTracking}>
                <Text style={styles.buttonText}>Start Location Tracking</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.dangerButton} onPress={handleStopLocationTracking}>
                <Text style={styles.buttonText}>Stop Location Tracking</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Battery & Network Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Battery & Network</Text>
          {state.batteryInfo && state.networkInfo ? (
            <View style={styles.infoContainer}>
              <InfoRow 
                label="Battery Level" 
                value={`${state.batteryInfo.batteryLevel}%`} 
              />
              <StatusRow 
                label="Charging" 
                status={state.batteryInfo.isCharging} 
              />
              <InfoRow 
                label="Network Type" 
                value={state.networkInfo.networkType} 
              />
              <StatusRow 
                label="Internet Connected" 
                status={state.networkInfo.isInternetReachable} 
              />
              <InfoRow 
                label="IP Address" 
                value={state.networkInfo.ipAddress || 'N/A'} 
              />
            </View>
          ) : (
            <Text style={styles.noDataText}>Loading battery and network info...</Text>
          )}
        </View>

        {/* Camera & Audio Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Camera & Audio</Text>
          {state.cameraSupport && state.audioSupport ? (
            <View style={styles.infoContainer}>
              <StatusRow 
                label="Camera Available" 
                status={state.cameraSupport.hasCamera} 
              />
              <StatusRow 
                label="Audio Recording" 
                status={state.audioSupport.canRecord} 
              />
              <StatusRow 
                label="Audio Playback" 
                status={state.audioSupport.canPlayback} 
              />
              <StatusRow 
                label="Currently Recording" 
                status={state.isRecording} 
              />
              {state.isRecording && (
                <InfoRow 
                  label="Recording Duration" 
                  value={`${Math.floor(state.recordingDuration / 1000)}s`} 
                />
              )}
            </View>
          ) : (
            <Text style={styles.noDataText}>Loading camera and audio info...</Text>
          )}
          
          <View style={styles.buttonContainer}>
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.smallButton, styles.primaryButton]} 
                onPress={handleTakePhoto}
              >
                <Text style={styles.buttonText}>📷 Photo</Text>
              </TouchableOpacity>
              
              {!state.isRecording ? (
                <TouchableOpacity 
                  style={[styles.smallButton, styles.secondaryButton]} 
                  onPress={handleStartRecording}
                >
                  <Text style={styles.buttonText}>🎤 Record</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.smallButton, styles.dangerButton]} 
                  onPress={handleStopRecording}
                >
                  <Text style={styles.buttonText}>⏹️ Stop</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Sensor Data Card */}
        {isSensorMonitoring && sensorData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sensor Data</Text>
            <View style={styles.infoContainer}>
              <StatusRow 
                label="Sensor Monitoring" 
                status={isSensorMonitoring} 
              />
              {sensorData.accelerometer && (
                <>
                  <InfoRow 
                    label="Accelerometer X" 
                    value={sensorData.accelerometer.x?.toFixed(3) || 'N/A'} 
                  />
                  <InfoRow 
                    label="Accelerometer Y" 
                    value={sensorData.accelerometer.y?.toFixed(3) || 'N/A'} 
                  />
                  <InfoRow 
                    label="Accelerometer Z" 
                    value={sensorData.accelerometer.z?.toFixed(3) || 'N/A'} 
                  />
                </>
              )}
              {sensorData.gyroscope && (
                <>
                  <InfoRow 
                    label="Gyroscope X" 
                    value={sensorData.gyroscope.x?.toFixed(3) || 'N/A'} 
                  />
                  <InfoRow 
                    label="Gyroscope Y" 
                    value={sensorData.gyroscope.y?.toFixed(3) || 'N/A'} 
                  />
                  <InfoRow 
                    label="Gyroscope Z" 
                    value={sensorData.gyroscope.z?.toFixed(3) || 'N/A'} 
                  />
                </>
              )}
              {sensorData.magnetometer && (
                <InfoRow 
                  label="Compass" 
                  value={`${Math.round(Math.atan2(sensorData.magnetometer.y, sensorData.magnetometer.x) * 180 / Math.PI)}°`} 
                />
              )}
              <InfoRow 
                label="Last Update" 
                value={new Date(sensorData.timestamp).toLocaleTimeString()} 
              />
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={async () => {
                  const movement = SensorService.detectMovement();
                  Alert.alert(
                    'Movement Detection',
                    `Status: ${movement.isMoving ? 'Moving' : 'Still'}\nType: ${movement.movementType}\nIntensity: ${movement.movementIntensity.toFixed(2)}`,
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Text style={styles.buttonText}>🏃 Detect Movement</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Compatibility Card */}
        {state.backwardCompatibility && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Device Compatibility</Text>
            <View style={styles.infoContainer}>
              <StatusRow 
                label="Fully Supported" 
                status={state.backwardCompatibility.isSupported} 
              />
              <InfoRow 
                label="Android Version" 
                value={state.backwardCompatibility.androidVersion.toString()} 
              />
              <StatusRow 
                label="Legacy Device" 
                status={state.capabilities?.isLegacyDevice || false} 
              />
              <InfoRow 
                label="Supported Features" 
                value={`${state.backwardCompatibility.supportedFeatures.length} features`} 
              />
            </View>
            
            {state.backwardCompatibility.limitations.length > 0 && (
              <View style={styles.warningContainer}>
                <Text style={styles.warningTitle}>⚠️ Limitations:</Text>
                {state.backwardCompatibility.limitations.slice(0, 3).map((limitation: string, index: number) => (
                  <Text key={index} style={styles.warningText}>• {limitation}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* System Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>System Status</Text>
          <View style={styles.infoContainer}>
            <StatusRow 
              label="Device Registered" 
              status={state.isRegistered} 
            />
            <StatusRow 
              label="Location Tracking" 
              status={state.isLocationTracking} 
            />
            <StatusRow 
              label="Audio Recording" 
              status={state.isRecording} 
            />
            <InfoRow 
              label="Last Sync" 
              value={state.lastSync || 'Never'} 
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {!state.isRegistered && (
            <TouchableOpacity style={styles.primaryButton} onPress={handleRegisterDevice}>
              <Text style={styles.buttonText}>Register Device</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleSyncData}>
            <Text style={styles.buttonText}>Sync Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={() => {
              Alert.alert(
                'Tactical Mapping System',
                'Launch the tactical mapping and collaboration system?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Launch', 
                    onPress: () => setShowTacticalSystem(true)
                  }
                ]
              );
            }}
          >
            <Text style={styles.buttonText}>🗺️ Launch Tactical Mapping</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            React Native + Expo SDK 53 + React 19
          </Text>
          <Text style={styles.footerText}>
            New Architecture Enabled
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Helper Components
const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const StatusRow: React.FC<{ label: string; status: boolean }> = ({ label, status }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <View style={[styles.statusIndicator, status ? styles.statusActive : styles.statusInactive]}>
      <Text style={styles.statusText}>{status ? 'Active' : 'Inactive'}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: UI_CONSTANTS.SPACING.MD,
    paddingTop: 60, // Account for status bar
  },
  loadingText: {
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.SPACING.XL,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },
  subtitle: {
    fontSize: 16,
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
  },
  card: {
    backgroundColor: UI_CONSTANTS.COLORS.SURFACE,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.LG,
    padding: UI_CONSTANTS.SPACING.MD,
    marginBottom: UI_CONSTANTS.SPACING.MD,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },
  infoContainer: {
    gap: UI_CONSTANTS.SPACING.SM,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: UI_CONSTANTS.SPACING.XS,
  },
  infoLabel: {
    fontSize: 16,
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  noDataText: {
    fontSize: 16,
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statusIndicator: {
    paddingHorizontal: UI_CONSTANTS.SPACING.SM,
    paddingVertical: UI_CONSTANTS.SPACING.XS,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SM,
  },
  statusActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusInactive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: UI_CONSTANTS.SPACING.MD,
  },
  actionContainer: {
    gap: UI_CONSTANTS.SPACING.SM,
    marginTop: UI_CONSTANTS.SPACING.MD,
  },
  primaryButton: {
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    paddingVertical: UI_CONSTANTS.SPACING.MD,
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.MD,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: UI_CONSTANTS.COLORS.SECONDARY,
    paddingVertical: UI_CONSTANTS.SPACING.MD,
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.MD,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: UI_CONSTANTS.COLORS.ERROR,
    paddingVertical: UI_CONSTANTS.SPACING.MD,
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.MD,
    alignItems: 'center',
  },
  buttonText: {
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: UI_CONSTANTS.SPACING.XL,
    paddingTop: UI_CONSTANTS.SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    fontSize: 12,
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: UI_CONSTANTS.SPACING.SM,
  },
  smallButton: {
    flex: 1,
    paddingVertical: UI_CONSTANTS.SPACING.SM,
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.MD,
    alignItems: 'center',
  },
  warningContainer: {
    marginTop: UI_CONSTANTS.SPACING.MD,
    padding: UI_CONSTANTS.SPACING.SM,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SM,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: UI_CONSTANTS.COLORS.WARNING,
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },
  warningText: {
    fontSize: 12,
    color: UI_CONSTANTS.COLORS.WARNING,
    marginBottom: 2,
  },
});