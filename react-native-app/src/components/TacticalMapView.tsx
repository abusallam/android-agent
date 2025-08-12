import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Alert, Dimensions, Platform, Text } from 'react-native';
import { supabase, supabaseUtils, TABLES, TacticalMapFeature, TacticalTarget } from '../lib/supabase';
import * as turf from '@turf/turf';
import L from 'leaflet';

// Fix for default markers in Leaflet
if (Platform.OS === 'web') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

const { width, height } = Dimensions.get('window');

// Enhanced TypeScript interfaces for tactical mapping
interface TacticalMapViewProps {
  mapId?: string;
  sessionId?: string;
  theme?: 'light' | 'dark' | 'camo-desert' | 'camo-forest';
  language?: 'en' | 'ar';
  onMapReady?: (map?: L.Map) => void;
  onFeaturePress?: (feature: TacticalMapFeature) => void;
  onLongPress?: (coordinates: [number, number]) => void;
  onLocationSelect?: (lat: number, lng: number) => void;
  markers?: TacticalMarker[];
  drawings?: TacticalDrawing[];
  showControls?: boolean;
  enableDrawing?: boolean;
  enableGeofencing?: boolean;
}

interface TacticalMarker {
  id: string;
  position: [number, number];
  type: 'friendly' | 'enemy' | 'neutral' | 'objective';
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface TacticalDrawing {
  id: string;
  type: 'line' | 'polygon' | 'circle' | 'rectangle';
  coordinates: number[][];
  style?: {
    color?: string;
    weight?: number;
    opacity?: number;
    fillColor?: string;
    fillOpacity?: number;
  };
}

interface MapState {
  center: [number, number];
  zoom: number;
  tileLayer: string;
}

// Tactical marker icon creation
const createTacticalIcon = (type: string, theme: string = 'light') => {
  const colors = {
    friendly: theme.includes('camo') ? '#4CAF50' : '#2196F3',
    enemy: theme.includes('camo') ? '#F44336' : '#FF5722',
    neutral: theme.includes('camo') ? '#FFC107' : '#9E9E9E',
    objective: theme.includes('camo') ? '#9C27B0' : '#673AB7',
  };

  if (Platform.OS === 'web' && typeof L !== 'undefined') {
    return L.divIcon({
      className: `tactical-marker tactical-marker-${type} tactical-marker-${theme}`,
      html: `<div style="
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: ${colors[type as keyof typeof colors]};
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }
  return null;
};

import TileSourceService from '../services/TileSourceService';

// Get tile layer configuration using the unified service
const getTileLayerConfig = (theme: string = 'light') => {
  const tileService = TileSourceService.getInstance();
  const source = tileService.getRecommendedSourceForTheme(theme);
  return tileService.getLeafletConfig(source.id);
};

export const TacticalMapView: React.FC<TacticalMapViewProps> = ({
  mapId,
  sessionId,
  theme = 'light',
  language = 'en',
  onMapReady,
  onFeaturePress,
  onLongPress,
  onLocationSelect,
  markers = [],
  drawings = [],
  showControls = true,
  enableDrawing = false,
  enableGeofencing = false,
}) => {
  const [mapState, setMapState] = useState<MapState>({
    center: [51.505, -0.09], // Default to London
    zoom: 13,
    tileLayer: getTileLayerConfig(theme).url,
  });
  
  const [features, setFeatures] = useState<TacticalMapFeature[]>([]);
  const [targets, setTargets] = useState<TacticalTarget[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize map and load data
  useEffect(() => {
    initializeMap();
    loadMapFeatures();
    loadTargets();
    setupRealtimeSubscriptions();
    
    return () => {
      // Cleanup subscriptions
    };
  }, [mapId, sessionId]);

  const initializeMap = async () => {
    try {
      // Get user's current location
      const location = await getCurrentLocation();
      if (location) {
        setUserLocation([location.latitude, location.longitude]);
        setMapState(prev => ({
          ...prev,
          center: [location.latitude, location.longitude],
          zoom: 15
        }));
        
        // Update user location in database
        await supabaseUtils.updateUserLocation({
          lat: location.latitude,
          lng: location.longitude,
          accuracy: location.accuracy,
          heading: location.heading,
          speed: location.speed
        });
      }
      
      setIsMapReady(true);
      onMapReady?.();
    } catch (error) {
      console.error('Error initializing map:', error);
      setIsMapReady(true); // Still mark as ready even if location fails
      onMapReady?.();
    }
  };

  const getCurrentLocation = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'web' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              heading: position.coords.heading,
              speed: position.coords.speed
            });
          },
          (error) => reject(error),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } else {
        reject(new Error('Geolocation not available'));
      }
    });
  };

  const loadMapFeatures = async () => {
    if (!mapId) return;
    
    try {
      const { data, error } = await supabase
        .from(TABLES.MAP_FEATURES)
        .select('*')
        .eq('map_id', mapId);
      
      if (error) throw error;
      
      setFeatures(data || []);
    } catch (error) {
      console.error('Error loading map features:', error);
    }
  };

  const loadTargets = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.TARGETS)
        .select('*')
        .eq('status', 'active');
      
      if (error) throw error;
      
      setTargets(data || []);
    } catch (error) {
      console.error('Error loading targets:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!mapId || !sessionId) return;
    
    // Subscribe to map changes
    const mapChangesSubscription = supabaseUtils.subscribeToMapChanges(mapId, (payload: any) => {
      handleRealtimeMapChange(payload);
    });
    
    // Subscribe to target updates
    const targetSubscription = supabase
      .channel('target-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABLES.TARGETS
      }, (payload) => {
        handleRealtimeTargetUpdate(payload);
      })
      .subscribe();
    
    return () => {
      mapChangesSubscription.unsubscribe();
      targetSubscription.unsubscribe();
    };
  };

  const handleRealtimeMapChange = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
      case 'INSERT':
        if (newRecord.feature_id) {
          loadMapFeatures();
        }
        break;
      case 'UPDATE':
        setFeatures(prev => prev.map(f => 
          f.id === newRecord.feature_id ? { ...f, ...newRecord } : f
        ));
        break;
      case 'DELETE':
        setFeatures(prev => prev.filter(f => f.id !== oldRecord.feature_id));
        break;
    }
  };

  const handleRealtimeTargetUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
      case 'INSERT':
        setTargets(prev => [...prev, newRecord]);
        break;
      case 'UPDATE':
        setTargets(prev => prev.map(t => 
          t.id === newRecord.id ? newRecord : t
        ));
        break;
      case 'DELETE':
        setTargets(prev => prev.filter(t => t.id !== oldRecord.id));
        break;
    }
  };

  // Render Leaflet map for web
  const renderWebMap = () => {
    if (Platform.OS !== 'web') return null;

    try {
      const { MapContainer, TileLayer, Marker, Popup, useMapEvents } = require('react-leaflet');
      const tileConfig = getTileLayerConfig(theme);
      
      // Map event handler component
      const MapEventHandler = () => {
        useMapEvents({
          click: (e: any) => {
            if (onLocationSelect) {
              onLocationSelect(e.latlng.lat, e.latlng.lng);
            }
          },
          contextmenu: (e: any) => {
            if (onLongPress) {
              onLongPress([e.latlng.lat, e.latlng.lng]);
            }
          },
        });
        return null;
      };
      
      return (
        <MapContainer
          center={mapState.center}
          zoom={mapState.zoom}
          style={{ 
            height: '100%', 
            width: '100%',
            filter: theme === 'camo-desert' ? 'sepia(0.3) saturate(1.2) hue-rotate(15deg)' :
                   theme === 'camo-forest' ? 'sepia(0.2) saturate(1.1) hue-rotate(90deg)' :
                   theme === 'dark' ? 'invert(1) hue-rotate(180deg)' : 'none'
          }}
          data-testid="tactical-map-view"
          zoomControl={showControls}
          attributionControl={showControls}
        >
          <TileLayer
            url={tileConfig.url}
            attribution={tileConfig.attribution}
          />
          
          <MapEventHandler />
          
          {/* User location marker */}
          {userLocation && (
            <Marker 
              position={userLocation} 
              data-testid="user-location"
              icon={createTacticalIcon('friendly', theme) || undefined}
            >
              <Popup>
                <div style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                  <strong>{language === 'ar' ? 'موقعك' : 'Your Location'}</strong><br/>
                  {language === 'ar' ? 'الإحداثيات' : 'Coordinates'}: {userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Custom tactical markers */}
          {markers.map(marker => (
            <Marker
              key={marker.id}
              position={marker.position}
              icon={createTacticalIcon(marker.type, theme) || undefined}
              data-testid="tactical-marker"
            >
              <Popup>
                <div style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                  <strong>{marker.title}</strong><br/>
                  {marker.description && (
                    <>
                      {marker.description}<br/>
                    </>
                  )}
                  {language === 'ar' ? 'النوع' : 'Type'}: {marker.type}<br/>
                  {language === 'ar' ? 'الإحداثيات' : 'Coordinates'}: {marker.position[0].toFixed(6)}, {marker.position[1].toFixed(6)}
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Database target markers */}
          {targets.map(target => (
            <Marker
              key={target.id}
              position={[target.current_position.lat, target.current_position.lng]}
              icon={createTacticalIcon('enemy', theme) || undefined}
              data-testid="target-marker"
            >
              <Popup>
                <div style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                  <strong>{target.name}</strong><br/>
                  {language === 'ar' ? 'النوع' : 'Type'}: {target.target_type}<br/>
                  {language === 'ar' ? 'الأولوية' : 'Priority'}: {target.priority}<br/>
                  {language === 'ar' ? 'الإحداثيات' : 'Coordinates'}: {target.current_position.lat.toFixed(6)}, {target.current_position.lng.toFixed(6)}
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Tactical drawings */}
          {drawings.map(drawing => {
            // Drawing implementation would go here
            // This would include lines, polygons, circles, etc.
            return null;
          })}
        </MapContainer>
      );
    } catch (error) {
      console.error('Error rendering Leaflet map:', error);
      return (
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackText}>Map Loading...</Text>
          <Text style={styles.fallbackSubtext}>Tactical Mapping System</Text>
        </View>
      );
    }
  };

  // Render fallback for native
  const renderNativeMap = () => {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>Tactical Map</Text>
        <Text style={styles.fallbackSubtext}>
          {userLocation 
            ? `Location: ${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}`
            : 'Getting location...'
          }
        </Text>
        <Text style={styles.fallbackSubtext}>
          Features: {features.length} | Targets: {targets.length}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container} data-testid="tactical-screen">
      {Platform.OS === 'web' ? renderWebMap() : renderNativeMap()}
      
      {/* Map controls overlay */}
      <View style={styles.controlsOverlay}>
        <View style={styles.mapControls} data-testid="drawing-tools">
          <Text style={styles.controlText}>🗺️ Tactical Map Ready</Text>
        </View>
        
        <View style={styles.layerControls} data-testid="layer-controls">
          <Text style={styles.controlText}>📍 {targets.length} Targets</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  fallbackText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  fallbackSubtext: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 5,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
  mapControls: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
    pointerEvents: 'auto',
  },
  layerControls: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
    pointerEvents: 'auto',
  },
  controlText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default TacticalMapView;