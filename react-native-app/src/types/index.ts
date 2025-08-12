/**
 * Comprehensive TypeScript Type Definitions
 * Centralized type definitions for the tactical mapping system
 */

// Base Types
export type Coordinates = [number, number]; // [latitude, longitude]
export type CoordinatesWithAltitude = [number, number, number]; // [lat, lng, alt]
export type BoundingBox = [number, number, number, number]; // [west, south, east, north]

// Theme Types
export type ThemeName = 'light' | 'dark' | 'camo-desert' | 'camo-forest';
export type LanguageCode = 'en' | 'ar';

// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  permissions: string[];
  profile: UserProfile;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
  unit?: string;
  rank?: string;
  callSign?: string;
  emergencyContact?: EmergencyContact;
}

export interface UserPreferences {
  theme: ThemeName;
  language: LanguageCode;
  notifications: NotificationPreferences;
  map: MapPreferences;
  communication: CommunicationPreferences;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

// Map Types
export interface TacticalMap {
  id: string;
  name: string;
  description?: string;
  bounds: BoundingBox;
  center: Coordinates;
  zoom: number;
  theme: ThemeName;
  layers: MapLayer[];
  features: TacticalMapFeature[];
  permissions: MapPermissions;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MapLayer {
  id: string;
  name: string;
  type: 'tile' | 'vector' | 'overlay';
  source: string;
  visible: boolean;
  opacity: number;
  zIndex: number;
  style?: LayerStyle;
}

export interface LayerStyle {
  color?: string;
  weight?: number;
  opacity?: number;
  fillColor?: string;
  fillOpacity?: number;
  dashArray?: string;
}

export interface TacticalMapFeature {
  id: string;
  mapId: string;
  type: FeatureType;
  geometry: FeatureGeometry;
  properties: FeatureProperties;
  style?: FeatureStyle;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type FeatureType = 'point' | 'line' | 'polygon' | 'circle' | 'rectangle';

export interface FeatureGeometry {
  type: FeatureType;
  coordinates: number[] | number[][] | number[][][];
  radius?: number; // for circles
}

export interface FeatureProperties {
  name: string;
  description?: string;
  category: FeatureCategory;
  priority: Priority;
  status: FeatureStatus;
  metadata: Record<string, any>;
}

export type FeatureCategory = 'friendly' | 'enemy' | 'neutral' | 'objective' | 'hazard' | 'infrastructure';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type FeatureStatus = 'active' | 'inactive' | 'pending' | 'completed';

export interface FeatureStyle {
  color: string;
  weight: number;
  opacity: number;
  fillColor?: string;
  fillOpacity?: number;
  icon?: string;
  size?: number;
}

// Target Types
export interface TacticalTarget {
  id: string;
  name: string;
  type: TargetType;
  category: FeatureCategory;
  priority: Priority;
  status: TargetStatus;
  position: Position;
  track: TrackPoint[];
  metadata: TargetMetadata;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TargetType = 'person' | 'vehicle' | 'aircraft' | 'vessel' | 'structure' | 'equipment';
export type TargetStatus = 'active' | 'inactive' | 'lost' | 'destroyed';

export interface Position {
  lat: number;
  lng: number;
  alt?: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

export interface TrackPoint extends Position {
  id: string;
  targetId: string;
}

export interface TargetMetadata {
  description?: string;
  size?: string;
  color?: string;
  equipment?: string[];
  threat_level?: 'low' | 'medium' | 'high' | 'critical';
  last_seen?: Date;
  confidence?: number;
}

// Communication Types
export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  content: MessageContent;
  type: MessageType;
  priority: Priority;
  location?: Coordinates;
  attachments: Attachment[];
  reactions: Reaction[];
  threadId?: string;
  replyToId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MessageType = 'text' | 'voice' | 'video' | 'file' | 'location' | 'emergency';

export interface MessageContent {
  text?: string;
  duration?: number; // for voice/video
  size?: number; // for files
  mimeType?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  size: number;
  mimeType: string;
  thumbnail?: string;
}

export interface Reaction {
  emoji: string;
  userId: string;
  timestamp: Date;
}

export interface Channel {
  id: string;
  name: string;
  type: 'public' | 'private' | 'direct' | 'emergency';
  description?: string;
  members: string[];
  permissions: ChannelPermissions;
  createdBy: string;
  createdAt: Date;
}

// Navigation Types
export interface Route {
  id: string;
  name: string;
  type: RouteType;
  waypoints: Waypoint[];
  distance: number;
  duration: number;
  elevation: ElevationProfile;
  instructions: RouteInstruction[];
  createdBy: string;
  createdAt: Date;
}

export type RouteType = 'walking' | 'driving' | 'cycling' | 'aircraft' | 'boat' | 'tactical';

export interface Waypoint {
  id: string;
  name: string;
  position: Coordinates;
  type: 'start' | 'end' | 'intermediate' | 'checkpoint';
  instructions?: string;
  eta?: Date;
}

export interface ElevationProfile {
  points: ElevationPoint[];
  gain: number;
  loss: number;
  maxElevation: number;
  minElevation: number;
}

export interface ElevationPoint {
  distance: number;
  elevation: number;
  position: Coordinates;
}

export interface RouteInstruction {
  distance: number;
  duration: number;
  instruction: string;
  direction: string;
  position: Coordinates;
}

// Geofencing Types
export interface Geofence {
  id: string;
  name: string;
  description?: string;
  type: GeofenceType;
  geometry: GeofenceGeometry;
  triggers: GeofenceTrigger[];
  actions: GeofenceAction[];
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: Date;
}

export type GeofenceType = 'inclusion' | 'exclusion' | 'alert';

export interface GeofenceGeometry {
  type: 'circle' | 'polygon';
  coordinates: Coordinates | Coordinates[];
  radius?: number; // for circles
}

export interface GeofenceTrigger {
  event: 'enter' | 'exit' | 'dwell';
  targets: string[]; // target IDs or 'all'
  conditions?: GeofenceCondition[];
}

export interface GeofenceCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than';
  value: any;
}

export interface GeofenceAction {
  type: 'notification' | 'alert' | 'webhook' | 'email';
  config: Record<string, any>;
}

// Emergency Types
export interface EmergencyEvent {
  id: string;
  type: EmergencyType;
  priority: Priority;
  status: EmergencyStatus;
  location: Position;
  reporter: string;
  description: string;
  casualties?: CasualtyInfo[];
  resources: EmergencyResource[];
  timeline: EmergencyTimelineEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export type EmergencyType = 'medical' | 'fire' | 'security' | 'natural_disaster' | 'accident' | 'other';
export type EmergencyStatus = 'reported' | 'responding' | 'on_scene' | 'resolved' | 'cancelled';

export interface CasualtyInfo {
  id: string;
  name?: string;
  status: 'injured' | 'critical' | 'deceased' | 'missing';
  injuries?: string[];
  location: Position;
  medicalInfo?: MedicalInfo;
}

export interface MedicalInfo {
  bloodType?: string;
  allergies?: string[];
  medications?: string[];
  conditions?: string[];
  emergencyContact?: EmergencyContact;
}

export interface EmergencyResource {
  id: string;
  type: 'personnel' | 'vehicle' | 'equipment';
  name: string;
  status: 'available' | 'dispatched' | 'on_scene' | 'unavailable';
  location?: Position;
  eta?: Date;
}

export interface EmergencyTimelineEntry {
  id: string;
  timestamp: Date;
  event: string;
  description: string;
  userId: string;
}

// Permission Types
export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
  expires?: 'never' | number;
}

export interface AllPermissions {
  location: PermissionStatus;
  locationBackground: PermissionStatus;
  camera: PermissionStatus;
  microphone: PermissionStatus;
  mediaLibrary: PermissionStatus;
  notifications: PermissionStatus;
}

// Preferences Types
export interface NotificationPreferences {
  enabled: boolean;
  emergency: boolean;
  tactical: boolean;
  communication: boolean;
  system: boolean;
  sound: boolean;
  vibration: boolean;
}

export interface MapPreferences {
  defaultTheme: ThemeName;
  showGrid: boolean;
  showScale: boolean;
  showCompass: boolean;
  autoCenter: boolean;
  trackingInterval: number;
}

export interface CommunicationPreferences {
  autoDownloadMedia: boolean;
  pushToTalkEnabled: boolean;
  voiceActivation: boolean;
  encryptionEnabled: boolean;
}

// Permission Types
export interface MapPermissions {
  view: string[];
  edit: string[];
  admin: string[];
}

export interface ChannelPermissions {
  read: string[];
  write: string[];
  admin: string[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: Date;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Event Types
export interface TacticalEvent {
  type: string;
  payload: any;
  timestamp: Date;
  userId?: string;
}

// Plugin Types (for future use)
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  permissions: string[];
  config: Record<string, any>;
  enabled: boolean;
}

// Export all types
export default {
  // Re-export commonly used types
  Coordinates,
  CoordinatesWithAltitude,
  BoundingBox,
  ThemeName,
  LanguageCode,
  User,
  TacticalMap,
  TacticalTarget,
  Message,
  Route,
  Geofence,
  EmergencyEvent,
};