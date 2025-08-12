import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as turf from '@turf/turf';
import { supabase, TABLES, TacticalMapFeature } from '../../lib/supabase';
import CollaborationService, { MapChange, UserCursor } from '../../services/CollaborationService';

interface MapCollaborationProps {
  mapId: string;
  sessionId?: string;
  onFeatureAdded?: (feature: TacticalMapFeature) => void;
  onFeatureUpdated?: (feature: TacticalMapFeature) => void;
  onFeatureDeleted?: (featureId: string) => void;
}

interface DrawingState {
  mode: 'point' | 'line' | 'polygon' | 'circle' | 'rectangle' | null;
  coordinates: [number, number][];
  isDrawing: boolean;
  currentFeature: any;
}

interface AnnotationData {
  title: string;
  description: string;
  color: string;
  icon: string;
  size: number;
  opacity: number;
}

export const MapCollaboration: React.FC<MapCollaborationProps> = ({
  mapId,
  sessionId,
  onFeatureAdded,
  onFeatureUpdated,
  onFeatureDeleted
}) => {
  const collaborationService = useRef(new CollaborationService()).current;
  
  const [drawingState, setDrawingState] = useState<DrawingState>({
    mode: null,
    coordinates: [],
    isDrawing: false,
    currentFeature: null
  });
  
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [annotationData, setAnnotationData] = useState<AnnotationData>({
    title: '',
    description: '',
    color: '#007AFF',
    icon: 'location',
    size: 20,
    opacity: 0.8
  });
  
  const [selectedFeature, setSelectedFeature] = useState<TacticalMapFeature | null>(null);
  const [showFeatureEditor, setShowFeatureEditor] = useState(false);
  const [activeCursors, setActiveCursors] = useState<UserCursor[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize collaboration if session is provided
  useEffect(() => {
    if (sessionId) {
      initializeCollaboration();
    }
    
    return () => {
      if (sessionId) {
        collaborationService.leaveSession();
      }
    };
  }, [sessionId]);

  const initializeCollaboration = async () => {
    try {
      await collaborationService.joinSession(sessionId!, mapId, {
        onMapChange: handleMapChange,
        onCursorUpdate: handleCursorUpdate,
        onUserJoined: (user) => console.log('User joined:', user),
        onUserLeft: (userId) => console.log('User left:', userId)
      });
      
      setIsConnected(true);
    } catch (error) {
      console.error('Error initializing collaboration:', error);
    }
  };

  const handleMapChange = (change: MapChange) => {
    switch (change.changeType) {
      case 'feature_added':
        onFeatureAdded?.(change.changeData.feature);
        break;
      case 'feature_updated':
        onFeatureUpdated?.(change.changeData.feature);
        break;
      case 'feature_deleted':
        onFeatureDeleted?.(change.featureId!);
        break;
    }
  };

  const handleCursorUpdate = (cursor: UserCursor) => {
    setActiveCursors(prev => {
      const filtered = prev.filter(c => c.userId !== cursor.userId);
      return [...filtered, cursor];
    });
  };

  const startDrawing = (mode: DrawingState['mode']) => {
    setDrawingState({
      mode,
      coordinates: [],
      isDrawing: true,
      currentFeature: null
    });
  };

  const stopDrawing = () => {
    setDrawingState({
      mode: null,
      coordinates: [],
      isDrawing: false,
      currentFeature: null
    });
  };

  const addCoordinate = (coordinate: [number, number]) => {
    if (!drawingState.isDrawing || !drawingState.mode) return;

    const newCoordinates = [...drawingState.coordinates, coordinate];
    
    setDrawingState(prev => ({
      ...prev,
      coordinates: newCoordinates
    }));

    // Auto-complete certain shapes
    if (drawingState.mode === 'polygon' && newCoordinates.length > 2) {
      const firstPoint = newCoordinates[0];
      const lastPoint = coordinate;
      const distance = turf.distance(
        turf.point(firstPoint),
        turf.point(lastPoint),
        { units: 'meters' }
      );
      
      // If user taps near the first point, complete the polygon
      if (distance < 50) {
        completeDrawing();
      }
    }
  };

  const completeDrawing = async () => {
    if (!drawingState.mode || drawingState.coordinates.length === 0) return;

    try {
      let geometry;
      let featureType: 'point' | 'line' | 'polygon';

      switch (drawingState.mode) {
        case 'point':
          if (drawingState.coordinates.length === 0) return;
          geometry = turf.point(drawingState.coordinates[0]);
          featureType = 'point';
          break;
          
        case 'line':
          if (drawingState.coordinates.length < 2) return;
          geometry = turf.lineString(drawingState.coordinates);
          featureType = 'line';
          break;
          
        case 'polygon':
          if (drawingState.coordinates.length < 3) return;
          const closedCoordinates = [...drawingState.coordinates, drawingState.coordinates[0]];
          geometry = turf.polygon([closedCoordinates]);
          featureType = 'polygon';
          break;
          
        case 'circle':
          if (drawingState.coordinates.length < 2) return;
          const center = drawingState.coordinates[0];
          const edge = drawingState.coordinates[1];
          const radius = turf.distance(turf.point(center), turf.point(edge), { units: 'kilometers' });
          geometry = turf.circle(center, radius, { units: 'kilometers' });
          featureType = 'polygon';
          break;
          
        case 'rectangle':
          if (drawingState.coordinates.length < 2) return;
          const [corner1, corner2] = drawingState.coordinates;
          const bbox = [
            Math.min(corner1[0], corner2[0]),
            Math.min(corner1[1], corner2[1]),
            Math.max(corner1[0], corner2[0]),
            Math.max(corner1[1], corner2[1])
          ];
          geometry = turf.bboxPolygon(bbox as [number, number, number, number]);
          featureType = 'polygon';
          break;
          
        default:
          return;
      }

      // Show annotation modal for user input
      setDrawingState(prev => ({ ...prev, currentFeature: geometry }));
      setShowAnnotationModal(true);
      
    } catch (error) {
      console.error('Error completing drawing:', error);
      Alert.alert('Error', 'Failed to complete drawing');
      stopDrawing();
    }
  };

  const saveFeature = async () => {
    if (!drawingState.currentFeature) return;

    try {
      const featureData = {
        map_id: mapId,
        feature_type: getFeatureType(drawingState.currentFeature.geometry.type),
        geometry: drawingState.currentFeature.geometry,
        properties: {
          name: annotationData.title || `${drawingState.mode} ${Date.now()}`,
          description: annotationData.description,
          color: annotationData.color,
          icon: annotationData.icon,
          size: annotationData.size,
          opacity: annotationData.opacity,
          createdAt: new Date().toISOString()
        },
        style: {
          color: annotationData.color,
          opacity: annotationData.opacity,
          strokeWidth: 2,
          fillOpacity: annotationData.opacity * 0.3
        }
      };

      const { data, error } = await supabase
        .from(TABLES.MAP_FEATURES)
        .insert(featureData)
        .select()
        .single();

      if (error) throw error;

      // Broadcast change to collaborators
      if (sessionId && isConnected) {
        await collaborationService.broadcastMapChange('feature_added', {
          feature: data,
          action: 'create'
        }, data.id);
      }

      onFeatureAdded?.(data);
      
      // Reset state
      setShowAnnotationModal(false);
      setAnnotationData({
        title: '',
        description: '',
        color: '#007AFF',
        icon: 'location',
        size: 20,
        opacity: 0.8
      });
      stopDrawing();
      
      Alert.alert('Success', 'Feature added successfully');
    } catch (error) {
      console.error('Error saving feature:', error);
      Alert.alert('Error', 'Failed to save feature');
    }
  };

  const updateFeature = async (featureId: string, updates: Partial<TacticalMapFeature>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.MAP_FEATURES)
        .update(updates)
        .eq('id', featureId)
        .select()
        .single();

      if (error) throw error;

      // Broadcast change to collaborators
      if (sessionId && isConnected) {
        await collaborationService.broadcastMapChange('feature_updated', {
          feature: data,
          action: 'update',
          changes: updates
        }, featureId);
      }

      onFeatureUpdated?.(data);
      
      Alert.alert('Success', 'Feature updated successfully');
    } catch (error) {
      console.error('Error updating feature:', error);
      Alert.alert('Error', 'Failed to update feature');
    }
  };

  const deleteFeature = async (featureId: string) => {
    try {
      const { error } = await supabase
        .from(TABLES.MAP_FEATURES)
        .delete()
        .eq('id', featureId);

      if (error) throw error;

      // Broadcast change to collaborators
      if (sessionId && isConnected) {
        await collaborationService.broadcastMapChange('feature_deleted', {
          action: 'delete'
        }, featureId);
      }

      onFeatureDeleted?.(featureId);
      
      Alert.alert('Success', 'Feature deleted successfully');
    } catch (error) {
      console.error('Error deleting feature:', error);
      Alert.alert('Error', 'Failed to delete feature');
    }
  };

  const getFeatureType = (geometryType: string): 'point' | 'line' | 'polygon' => {
    switch (geometryType) {
      case 'Point':
        return 'point';
      case 'LineString':
        return 'line';
      case 'Polygon':
        return 'polygon';
      default:
        return 'point';
    }
  };

  const renderDrawingTools = () => (
    <View style={styles.drawingTools}>
      <TouchableOpacity
        style={[styles.tool, drawingState.mode === 'point' && styles.toolActive]}
        onPress={() => drawingState.mode === 'point' ? stopDrawing() : startDrawing('point')}
      >
        <Ionicons name="location" size={20} color="#fff" />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tool, drawingState.mode === 'line' && styles.toolActive]}
        onPress={() => drawingState.mode === 'line' ? stopDrawing() : startDrawing('line')}
      >
        <Ionicons name="remove" size={20} color="#fff" />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tool, drawingState.mode === 'polygon' && styles.toolActive]}
        onPress={() => drawingState.mode === 'polygon' ? stopDrawing() : startDrawing('polygon')}
      >
        <Ionicons name="shapes" size={20} color="#fff" />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tool, drawingState.mode === 'circle' && styles.toolActive]}
        onPress={() => drawingState.mode === 'circle' ? stopDrawing() : startDrawing('circle')}
      >
        <Ionicons name="radio-button-off" size={20} color="#fff" />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tool, drawingState.mode === 'rectangle' && styles.toolActive]}
        onPress={() => drawingState.mode === 'rectangle' ? stopDrawing() : startDrawing('rectangle')}
      >
        <Ionicons name="square-outline" size={20} color="#fff" />
      </TouchableOpacity>
      
      {drawingState.isDrawing && (
        <TouchableOpacity style={[styles.tool, styles.completeButton]} onPress={completeDrawing}>
          <Ionicons name="checkmark" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAnnotationModal = () => (
    <Modal
      visible={showAnnotationModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAnnotationModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Annotation</Text>
            <TouchableOpacity onPress={() => setShowAnnotationModal(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.textInput}
                value={annotationData.title}
                onChangeText={(text) => setAnnotationData(prev => ({ ...prev, title: text }))}
                placeholder="Enter title..."
                placeholderTextColor="#888"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={annotationData.description}
                onChangeText={(text) => setAnnotationData(prev => ({ ...prev, description: text }))}
                placeholder="Enter description..."
                placeholderTextColor="#888"
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Color</Text>
              <View style={styles.colorPicker}>
                {['#007AFF', '#FF3B30', '#34C759', '#FF9500', '#AF52DE', '#FF2D92'].map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      annotationData.color === color && styles.colorSelected
                    ]}
                    onPress={() => setAnnotationData(prev => ({ ...prev, color }))}
                  />
                ))}
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Icon</Text>
              <View style={styles.iconPicker}>
                {['location', 'flag', 'warning', 'information-circle', 'star', 'heart'].map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      annotationData.icon === icon && styles.iconSelected
                    ]}
                    onPress={() => setAnnotationData(prev => ({ ...prev, icon }))}
                  >
                    <Ionicons name={icon as any} size={24} color="#fff" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAnnotationModal(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.saveButton} onPress={saveFeature}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderCollaborationStatus = () => (
    <View style={styles.collaborationStatus}>
      <View style={[styles.statusIndicator, isConnected ? styles.connected : styles.disconnected]}>
        <Ionicons 
          name={isConnected ? "people" : "person"} 
          size={16} 
          color="#fff" 
        />
        <Text style={styles.statusText}>
          {isConnected ? `${activeCursors.length + 1} users` : 'Solo'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderDrawingTools()}
      {sessionId && renderCollaborationStatus()}
      {renderAnnotationModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  drawingTools: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 8,
  },
  tool: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  toolActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
  },
  completeButton: {
    backgroundColor: 'rgba(52, 199, 89, 0.8)',
  },
  collaborationStatus: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  connected: {
    backgroundColor: 'rgba(52, 199, 89, 0.8)',
  },
  disconnected: {
    backgroundColor: 'rgba(142, 142, 147, 0.8)',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSelected: {
    borderColor: '#fff',
  },
  iconPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconSelected: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MapCollaboration;