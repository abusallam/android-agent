import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
  TouchableOpacity,
  Text,
  Modal,
  ScrollView,
  TextInput,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import TacticalMapView from '../components/TacticalMapView';
import CollaborationService, { MapChange, UserCursor } from '../services/CollaborationService';
import CommunicationService, { TacticalMessage } from '../services/CommunicationService';
import GeospatialService from '../services/GeospatialService';
import OfflineTileService, { OfflineRegion, DownloadProgress } from '../services/OfflineTileService';
import { supabase, supabaseUtils, TABLES, TacticalSession, TacticalMap } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface TacticalScreenProps {
  navigation: any;
  route: any;
}

export const TacticalScreen: React.FC<TacticalScreenProps> = ({ navigation, route }) => {
  // Services
  const collaborationService = useRef(new CollaborationService()).current;
  const communicationService = useRef(new CommunicationService()).current;
  const geospatialService = useRef(new GeospatialService()).current;
  const offlineTileService = useRef(new OfflineTileService()).current;

  // State
  const [currentMap, setCurrentMap] = useState<TacticalMap | null>(null);
  const [currentSession, setCurrentSession] = useState<TacticalSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeCursors, setActiveCursors] = useState<UserCursor[]>([]);
  const [messages, setMessages] = useState<TacticalMessage[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [offlineRegions, setOfflineRegions] = useState<OfflineRegion[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

  // UI State
  const [showSidebar, setShowSidebar] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showOfflineManager, setShowOfflineManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [drawingMode, setDrawingMode] = useState<'point' | 'line' | 'polygon' | null>(null);
  const [chatMessage, setChatMessage] = useState('');

  // Initialize services and load data
  useEffect(() => {
    initializeServices();
    loadInitialData();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeServices = async () => {
    try {
      // Initialize communication service
      await communicationService.initialize({
        onMessageReceived: (message) => {
          setMessages(prev => [message, ...prev]);
        },
        onUserOnline: (userId) => {
          console.log(`User ${userId} came online`);
        },
        onUserOffline: (userId) => {
          console.log(`User ${userId} went offline`);
        }
      });

      console.log('Services initialized successfully');
    } catch (error) {
      console.error('Error initializing services:', error);
      Alert.alert('Error', 'Failed to initialize tactical services');
    }
  };

  const loadInitialData = async () => {
    try {
      // Load offline regions
      const regions = await offlineTileService.getOfflineRegions();
      setOfflineRegions(regions);

      // Check if we have a specific map/session from navigation params
      const { mapId, sessionId } = route.params || {};
      
      if (mapId) {
        await loadMap(mapId);
      }
      
      if (sessionId) {
        await joinSession(sessionId);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadMap = async (mapId: string) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.MAPS)
        .select('*')
        .eq('id', mapId)
        .single();

      if (error) throw error;

      setCurrentMap(data);
    } catch (error) {
      console.error('Error loading map:', error);
      Alert.alert('Error', 'Failed to load map');
    }
  };

  const joinSession = async (sessionId: string) => {
    try {
      if (!currentMap) {
        Alert.alert('Error', 'Please select a map first');
        return;
      }

      await collaborationService.joinSession(sessionId, currentMap.id, {
        onMapChange: handleMapChange,
        onUserJoined: (user) => {
          console.log('User joined:', user);
        },
        onUserLeft: (userId) => {
          console.log('User left:', userId);
        },
        onCursorUpdate: (cursor) => {
          setActiveCursors(prev => {
            const filtered = prev.filter(c => c.userId !== cursor.userId);
            return [...filtered, cursor];
          });
        }
      });

      const session = await collaborationService.getSession();
      setCurrentSession(session);
      setIsConnected(true);

      // Join communication channel for this session
      await communicationService.joinChannel(sessionId);

      Alert.alert('Success', 'Joined collaboration session');
    } catch (error) {
      console.error('Error joining session:', error);
      Alert.alert('Error', 'Failed to join session');
    }
  };

  const createNewSession = async () => {
    try {
      if (!currentMap) {
        Alert.alert('Error', 'Please select a map first');
        return;
      }

      const sessionName = `Session ${new Date().toLocaleTimeString()}`;
      const session = await collaborationService.createSession(sessionName, currentMap.id);
      
      await joinSession(session.id);
    } catch (error) {
      console.error('Error creating session:', error);
      Alert.alert('Error', 'Failed to create session');
    }
  };

  const handleMapChange = (change: MapChange) => {
    console.log('Map change received:', change);
    // Handle different types of map changes
    switch (change.changeType) {
      case 'feature_added':
        // Refresh map features
        break;
      case 'feature_updated':
        // Update specific feature
        break;
      case 'feature_deleted':
        // Remove feature from map
        break;
    }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !currentSession) return;

    try {
      await communicationService.sendMessage(currentSession.id, chatMessage.trim(), {
        includeLocation: true
      });
      setChatMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const toggleOfflineMode = async () => {
    try {
      if (!isOfflineMode) {
        // Entering offline mode - check if we have offline data
        const regions = await offlineTileService.getOfflineRegions();
        if (regions.length === 0) {
          Alert.alert(
            'No Offline Data',
            'You need to download map tiles first. Go to Offline Manager to download maps.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
      
      setIsOfflineMode(!isOfflineMode);
      Alert.alert(
        'Mode Changed',
        `Switched to ${!isOfflineMode ? 'offline' : 'online'} mode`
      );
    } catch (error) {
      console.error('Error toggling offline mode:', error);
    }
  };

  const downloadOfflineMap = async () => {
    try {
      if (!currentMap) {
        Alert.alert('Error', 'Please select a map first');
        return;
      }

      const regionId = `region_${Date.now()}`;
      const regionName = `${currentMap.name} - Offline`;
      
      // Use current map bounds or default bounds
      const bounds = currentMap.bounds ? {
        north: currentMap.bounds.coordinates[0][2][1],
        south: currentMap.bounds.coordinates[0][0][1],
        east: currentMap.bounds.coordinates[0][2][0],
        west: currentMap.bounds.coordinates[0][0][0]
      } : {
        north: currentMap.center.coordinates[1] + 0.01,
        south: currentMap.center.coordinates[1] - 0.01,
        east: currentMap.center.coordinates[0] + 0.01,
        west: currentMap.center.coordinates[0] - 0.01
      };

      const tileSource = OfflineTileService.TILE_SOURCES[0]; // Use OSM
      const zoomLevels = [10, 11, 12, 13, 14, 15]; // Download multiple zoom levels

      const success = await offlineTileService.downloadRegion(
        regionId,
        regionName,
        bounds,
        tileSource,
        zoomLevels,
        (progress) => {
          setDownloadProgress(progress);
        }
      );

      if (success) {
        Alert.alert('Success', 'Map downloaded for offline use');
        const updatedRegions = await offlineTileService.getOfflineRegions();
        setOfflineRegions(updatedRegions);
      } else {
        Alert.alert('Error', 'Failed to download map');
      }
      
      setDownloadProgress(null);
    } catch (error) {
      console.error('Error downloading offline map:', error);
      Alert.alert('Error', 'Failed to download map');
      setDownloadProgress(null);
    }
  };

  const importGeospatialFile = async () => {
    try {
      if (!currentMap) {
        Alert.alert('Error', 'Please select a map first');
        return;
      }

      const result = await geospatialService.importFile(currentMap.id);
      
      if (result.success) {
        Alert.alert(
          'Import Successful',
          `Imported ${result.featuresCount} features`
        );
      } else {
        Alert.alert(
          'Import Failed',
          result.errors?.join('\n') || 'Unknown error'
        );
      }
    } catch (error) {
      console.error('Error importing file:', error);
      Alert.alert('Error', 'Failed to import file');
    }
  };

  const cleanup = async () => {
    try {
      await collaborationService.leaveSession();
      await communicationService.cleanup();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  const renderSidebar = () => (
    <Modal
      visible={showSidebar}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowSidebar(false)}
    >
      <View style={styles.sidebarOverlay}>
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Tactical Menu</Text>
            <TouchableOpacity onPress={() => setShowSidebar(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.sidebarContent}>
            <TouchableOpacity style={styles.sidebarItem} onPress={createNewSession}>
              <Ionicons name="people" size={20} color="#fff" />
              <Text style={styles.sidebarItemText}>Create Session</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sidebarItem} onPress={() => setShowChat(true)}>
              <Ionicons name="chatbubbles" size={20} color="#fff" />
              <Text style={styles.sidebarItemText}>Chat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sidebarItem} onPress={importGeospatialFile}>
              <Ionicons name="download" size={20} color="#fff" />
              <Text style={styles.sidebarItemText}>Import File</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sidebarItem} onPress={() => setShowOfflineManager(true)}>
              <Ionicons name="cloud-offline" size={20} color="#fff" />
              <Text style={styles.sidebarItemText}>Offline Maps</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sidebarItem} onPress={toggleOfflineMode}>
              <Ionicons name={isOfflineMode ? "wifi" : "cloud-offline"} size={20} color="#fff" />
              <Text style={styles.sidebarItemText}>
                {isOfflineMode ? 'Go Online' : 'Go Offline'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderChat = () => (
    <Modal
      visible={showChat}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowChat(false)}
    >
      <View style={styles.chatOverlay}>
        <View style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>Team Chat</Text>
            <TouchableOpacity onPress={() => setShowChat(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.chatMessages}>
            {messages.map((message, index) => (
              <View key={message.id || index} style={styles.messageItem}>
                <Text style={styles.messageSender}>{message.sender?.username || 'Unknown'}</Text>
                <Text style={styles.messageContent}>{message.content}</Text>
                <Text style={styles.messageTime}>
                  {new Date(message.created_at).toLocaleTimeString()}
                </Text>
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.chatInput}>
            <TextInput
              style={styles.chatTextInput}
              value={chatMessage}
              onChangeText={setChatMessage}
              placeholder="Type a message..."
              placeholderTextColor="#888"
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendChatMessage}>
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderOfflineManager = () => (
    <Modal
      visible={showOfflineManager}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowOfflineManager(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Offline Maps</Text>
            <TouchableOpacity onPress={() => setShowOfflineManager(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <TouchableOpacity style={styles.downloadButton} onPress={downloadOfflineMap}>
              <Ionicons name="download" size={20} color="#fff" />
              <Text style={styles.downloadButtonText}>Download Current Area</Text>
            </TouchableOpacity>
            
            {downloadProgress && (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  Downloading: {Math.round(downloadProgress.progress * 100)}%
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[styles.progressFill, { width: `${downloadProgress.progress * 100}%` }]} 
                  />
                </View>
              </View>
            )}
            
            <Text style={styles.sectionTitle}>Downloaded Regions</Text>
            {offlineRegions.map((region) => (
              <View key={region.id} style={styles.regionItem}>
                <Text style={styles.regionName}>{region.name}</Text>
                <Text style={styles.regionInfo}>
                  {Math.round(region.size / 1024 / 1024)}MB • {region.tileCount} tiles
                </Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    Alert.alert(
                      'Delete Region',
                      'Are you sure you want to delete this offline region?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: async () => {
                            await offlineTileService.deleteRegion(region.id);
                            const updatedRegions = await offlineTileService.getOfflineRegions();
                            setOfflineRegions(updatedRegions);
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Ionicons name="trash" size={16} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Main Map View */}
      <TacticalMapView
        mapId={currentMap?.id}
        sessionId={currentSession?.id}
        onMapReady={() => console.log('Map ready')}
        onFeaturePress={(feature) => console.log('Feature pressed:', feature)}
        onLongPress={(coordinates) => console.log('Long press:', coordinates)}
      />
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBarButton} onPress={() => setShowSidebar(true)}>
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle}>
            {currentMap?.name || 'Tactical Map'}
          </Text>
          {isConnected && (
            <Text style={styles.topBarSubtitle}>
              Session: {currentSession?.name}
            </Text>
          )}
        </View>
        
        <View style={styles.topBarRight}>
          {isOfflineMode && (
            <View style={styles.offlineIndicator}>
              <Ionicons name="cloud-offline" size={16} color="#fff" />
              <Text style={styles.offlineText}>Offline</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Drawing Tools */}
      <View style={styles.drawingTools}>
        <TouchableOpacity
          style={[styles.drawingTool, drawingMode === 'point' && styles.drawingToolActive]}
          onPress={() => setDrawingMode(drawingMode === 'point' ? null : 'point')}
        >
          <Ionicons name="location" size={20} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.drawingTool, drawingMode === 'line' && styles.drawingToolActive]}
          onPress={() => setDrawingMode(drawingMode === 'line' ? null : 'line')}
        >
          <Ionicons name="remove" size={20} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.drawingTool, drawingMode === 'polygon' && styles.drawingToolActive]}
          onPress={() => setDrawingMode(drawingMode === 'polygon' ? null : 'polygon')}
        >
          <Ionicons name="shapes" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction} onPress={() => setShowChat(true)}>
          <Ionicons name="chatbubbles" size={20} color="#fff" />
          {messages.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{messages.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="locate" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Modals */}
      {renderSidebar()}
      {renderChat()}
      {renderOfflineManager()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  topBarButton: {
    padding: 8,
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  topBarSubtitle: {
    color: '#ccc',
    fontSize: 12,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offlineText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  drawingTools: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 8,
    zIndex: 1000,
  },
  drawingTool: {
    padding: 12,
    marginVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  drawingToolActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
  },
  quickActions: {
    position: 'absolute',
    bottom: 32,
    right: 16,
    zIndex: 1000,
  },
  quickAction: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sidebarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  sidebar: {
    width: width * 0.8,
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sidebarTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sidebarContent: {
    flex: 1,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sidebarItemText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  chatOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  chatContainer: {
    height: height * 0.7,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  chatTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatMessages: {
    flex: 1,
    padding: 16,
  },
  messageItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  messageSender: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  messageContent: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  messageTime: {
    color: '#888',
    fontSize: 12,
  },
  chatInput: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
    alignItems: 'flex-end',
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    height: height * 0.8,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
  },
  regionName: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  regionInfo: {
    color: '#888',
    fontSize: 12,
    marginRight: 12,
  },
  deleteButton: {
    padding: 8,
  },
});

export default TacticalScreen;