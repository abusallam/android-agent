import * as turf from '@turf/turf';
import { supabase, TABLES, TacticalMapFeature } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';

export interface GeospatialFile {
  name: string;
  type: 'kml' | 'kmz' | 'gpx' | 'geojson' | 'shapefile';
  uri: string;
  size: number;
}

export interface ImportResult {
  success: boolean;
  featuresCount: number;
  features: TacticalMapFeature[];
  errors?: string[];
}

export interface ExportOptions {
  format: 'kml' | 'gpx' | 'geojson';
  features: TacticalMapFeature[];
  filename?: string;
}

export class GeospatialService {
  
  // Import geospatial files
  async importFile(mapId: string): Promise<ImportResult> {
    try {
      // Pick file using document picker
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.google-earth.kml+xml',
          'application/vnd.google-earth.kmz',
          'application/gpx+xml',
          'application/geo+json',
          'application/json'
        ],
        copyToCacheDirectory: true
      });

      if (result.canceled || !result.assets[0]) {
        return { success: false, featuresCount: 0, features: [] };
      }

      const file = result.assets[0];
      const fileType = this.detectFileType(file.name, file.mimeType);
      
      if (!fileType) {
        return { 
          success: false, 
          featuresCount: 0, 
          features: [], 
          errors: ['Unsupported file format'] 
        };
      }

      // Read file content
      const content = await FileSystem.readAsStringAsync(file.uri);
      
      // Parse based on file type
      let features: any[] = [];
      
      switch (fileType) {
        case 'kml':
          features = await this.parseKML(content);
          break;
        case 'gpx':
          features = await this.parseGPX(content);
          break;
        case 'geojson':
          features = await this.parseGeoJSON(content);
          break;
        default:
          return { 
            success: false, 
            featuresCount: 0, 
            features: [], 
            errors: [`${fileType} format not yet supported`] 
          };
      }

      // Convert to tactical map features and save to database
      const tacticalFeatures = await this.saveFeaturesToDatabase(mapId, features);

      return {
        success: true,
        featuresCount: tacticalFeatures.length,
        features: tacticalFeatures
      };

    } catch (error) {
      console.error('Error importing file:', error);
      return { 
        success: false, 
        featuresCount: 0, 
        features: [], 
        errors: [error.message] 
      };
    }
  }

  // Export features to various formats
  async exportFeatures(options: ExportOptions): Promise<string | null> {
    try {
      let content: string;
      const filename = options.filename || `export_${Date.now()}`;

      switch (options.format) {
        case 'geojson':
          content = this.exportToGeoJSON(options.features);
          break;
        case 'kml':
          content = this.exportToKML(options.features);
          break;
        case 'gpx':
          content = this.exportToGPX(options.features);
          break;
        default:
          throw new Error(`Export format ${options.format} not supported`);
      }

      // Save to device storage
      const fileUri = `${FileSystem.documentDirectory}${filename}.${options.format}`;
      await FileSystem.writeAsStringAsync(fileUri, content);

      return fileUri;
    } catch (error) {
      console.error('Error exporting features:', error);
      return null;
    }
  }

  // Parse KML format
  private async parseKML(content: string): Promise<any[]> {
    try {
      // Simple KML parser - in production, use a proper XML parser
      const features: any[] = [];
      
      // Extract placemarks
      const placemarkRegex = /<Placemark[^>]*>(.*?)<\/Placemark>/gs;
      const placemarks = content.match(placemarkRegex) || [];

      for (const placemark of placemarks) {
        const feature = this.parseKMLPlacemark(placemark);
        if (feature) {
          features.push(feature);
        }
      }

      return features;
    } catch (error) {
      console.error('Error parsing KML:', error);
      return [];
    }
  }

  private parseKMLPlacemark(placemark: string): any | null {
    try {
      // Extract name
      const nameMatch = placemark.match(/<name[^>]*>(.*?)<\/name>/s);
      const name = nameMatch ? nameMatch[1].trim() : 'Unnamed';

      // Extract description
      const descMatch = placemark.match(/<description[^>]*>(.*?)<\/description>/s);
      const description = descMatch ? descMatch[1].trim() : '';

      // Extract coordinates
      let geometry = null;

      // Point
      const pointMatch = placemark.match(/<Point[^>]*>.*?<coordinates[^>]*>(.*?)<\/coordinates>.*?<\/Point>/s);
      if (pointMatch) {
        const coords = this.parseKMLCoordinates(pointMatch[1]);
        if (coords.length > 0) {
          geometry = turf.point(coords[0]).geometry;
        }
      }

      // LineString
      const lineMatch = placemark.match(/<LineString[^>]*>.*?<coordinates[^>]*>(.*?)<\/coordinates>.*?<\/LineString>/s);
      if (lineMatch) {
        const coords = this.parseKMLCoordinates(lineMatch[1]);
        if (coords.length > 1) {
          geometry = turf.lineString(coords).geometry;
        }
      }

      // Polygon
      const polygonMatch = placemark.match(/<Polygon[^>]*>.*?<outerBoundaryIs>.*?<coordinates[^>]*>(.*?)<\/coordinates>.*?<\/outerBoundaryIs>.*?<\/Polygon>/s);
      if (polygonMatch) {
        const coords = this.parseKMLCoordinates(polygonMatch[1]);
        if (coords.length > 2) {
          // Ensure polygon is closed
          if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
            coords.push(coords[0]);
          }
          geometry = turf.polygon([coords]).geometry;
        }
      }

      if (!geometry) return null;

      return {
        geometry,
        properties: {
          name,
          description,
          source: 'kml'
        }
      };
    } catch (error) {
      console.error('Error parsing KML placemark:', error);
      return null;
    }
  }

  private parseKMLCoordinates(coordString: string): [number, number][] {
    const coords: [number, number][] = [];
    const coordPairs = coordString.trim().split(/\s+/);
    
    for (const pair of coordPairs) {
      const parts = pair.split(',');
      if (parts.length >= 2) {
        const lon = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        if (!isNaN(lon) && !isNaN(lat)) {
          coords.push([lon, lat]);
        }
      }
    }
    
    return coords;
  }

  // Parse GPX format
  private async parseGPX(content: string): Promise<any[]> {
    try {
      const features: any[] = [];

      // Extract waypoints
      const waypointRegex = /<wpt[^>]*lat="([^"]*)"[^>]*lon="([^"]*)"[^>]*>(.*?)<\/wpt>/gs;
      let match;
      
      while ((match = waypointRegex.exec(content)) !== null) {
        const lat = parseFloat(match[1]);
        const lon = parseFloat(match[2]);
        const content = match[3];
        
        const nameMatch = content.match(/<name[^>]*>(.*?)<\/name>/);
        const name = nameMatch ? nameMatch[1] : 'Waypoint';
        
        const descMatch = content.match(/<desc[^>]*>(.*?)<\/desc>/);
        const description = descMatch ? descMatch[1] : '';

        features.push({
          geometry: turf.point([lon, lat]).geometry,
          properties: {
            name,
            description,
            source: 'gpx',
            type: 'waypoint'
          }
        });
      }

      // Extract tracks
      const trackRegex = /<trk[^>]*>(.*?)<\/trk>/gs;
      const tracks = content.match(trackRegex) || [];

      for (const track of tracks) {
        const trackFeature = this.parseGPXTrack(track);
        if (trackFeature) {
          features.push(trackFeature);
        }
      }

      return features;
    } catch (error) {
      console.error('Error parsing GPX:', error);
      return [];
    }
  }

  private parseGPXTrack(track: string): any | null {
    try {
      const nameMatch = track.match(/<name[^>]*>(.*?)<\/name>/);
      const name = nameMatch ? nameMatch[1] : 'Track';

      const trkptRegex = /<trkpt[^>]*lat="([^"]*)"[^>]*lon="([^"]*)"[^>]*>/g;
      const coordinates: [number, number][] = [];
      let match;

      while ((match = trkptRegex.exec(track)) !== null) {
        const lat = parseFloat(match[1]);
        const lon = parseFloat(match[2]);
        if (!isNaN(lat) && !isNaN(lon)) {
          coordinates.push([lon, lat]);
        }
      }

      if (coordinates.length < 2) return null;

      return {
        geometry: turf.lineString(coordinates).geometry,
        properties: {
          name,
          source: 'gpx',
          type: 'track'
        }
      };
    } catch (error) {
      console.error('Error parsing GPX track:', error);
      return null;
    }
  }

  // Parse GeoJSON format
  private async parseGeoJSON(content: string): Promise<any[]> {
    try {
      const data = JSON.parse(content);
      const features: any[] = [];

      if (data.type === 'FeatureCollection') {
        for (const feature of data.features) {
          if (this.isValidGeoJSONFeature(feature)) {
            features.push({
              geometry: feature.geometry,
              properties: {
                ...feature.properties,
                source: 'geojson'
              }
            });
          }
        }
      } else if (data.type === 'Feature') {
        if (this.isValidGeoJSONFeature(data)) {
          features.push({
            geometry: data.geometry,
            properties: {
              ...data.properties,
              source: 'geojson'
            }
          });
        }
      } else if (data.type && ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'].includes(data.type)) {
        features.push({
          geometry: data,
          properties: {
            name: 'Imported Geometry',
            source: 'geojson'
          }
        });
      }

      return features;
    } catch (error) {
      console.error('Error parsing GeoJSON:', error);
      return [];
    }
  }

  // Export to GeoJSON
  private exportToGeoJSON(features: TacticalMapFeature[]): string {
    const featureCollection = turf.featureCollection(
      features.map(f => ({
        type: 'Feature',
        id: f.id,
        geometry: f.geometry,
        properties: f.properties
      }))
    );

    return JSON.stringify(featureCollection, null, 2);
  }

  // Export to KML
  private exportToKML(features: TacticalMapFeature[]): string {
    let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Tactical Map Export</name>
    <description>Exported from Tactical Mapping System</description>
`;

    for (const feature of features) {
      kml += this.featureToKMLPlacemark(feature);
    }

    kml += `  </Document>
</kml>`;

    return kml;
  }

  private featureToKMLPlacemark(feature: TacticalMapFeature): string {
    const name = feature.properties.name || 'Unnamed';
    const description = feature.properties.description || '';
    
    let geometryKML = '';
    
    switch (feature.geometry.type) {
      case 'Point':
        const [lon, lat] = feature.geometry.coordinates;
        geometryKML = `<Point><coordinates>${lon},${lat},0</coordinates></Point>`;
        break;
      
      case 'LineString':
        const lineCoords = feature.geometry.coordinates
          .map(([lon, lat]) => `${lon},${lat},0`)
          .join(' ');
        geometryKML = `<LineString><coordinates>${lineCoords}</coordinates></LineString>`;
        break;
      
      case 'Polygon':
        const ringCoords = feature.geometry.coordinates[0]
          .map(([lon, lat]) => `${lon},${lat},0`)
          .join(' ');
        geometryKML = `<Polygon><outerBoundaryIs><LinearRing><coordinates>${ringCoords}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
        break;
    }

    return `    <Placemark>
      <name>${this.escapeXML(name)}</name>
      <description>${this.escapeXML(description)}</description>
      ${geometryKML}
    </Placemark>
`;
  }

  // Export to GPX
  private exportToGPX(features: TacticalMapFeature[]): string {
    let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Tactical Mapping System">
  <metadata>
    <name>Tactical Map Export</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
`;

    for (const feature of features) {
      if (feature.geometry.type === 'Point') {
        const [lon, lat] = feature.geometry.coordinates;
        const name = feature.properties.name || 'Waypoint';
        const description = feature.properties.description || '';
        
        gpx += `  <wpt lat="${lat}" lon="${lon}">
    <name>${this.escapeXML(name)}</name>
    <desc>${this.escapeXML(description)}</desc>
  </wpt>
`;
      } else if (feature.geometry.type === 'LineString') {
        const name = feature.properties.name || 'Track';
        gpx += `  <trk>
    <name>${this.escapeXML(name)}</name>
    <trkseg>
`;
        for (const [lon, lat] of feature.geometry.coordinates) {
          gpx += `      <trkpt lat="${lat}" lon="${lon}"></trkpt>
`;
        }
        gpx += `    </trkseg>
  </trk>
`;
      }
    }

    gpx += '</gpx>';
    return gpx;
  }

  // Helper methods
  private detectFileType(filename: string, mimeType?: string): GeospatialFile['type'] | null {
    const extension = filename.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'kml':
        return 'kml';
      case 'kmz':
        return 'kmz';
      case 'gpx':
        return 'gpx';
      case 'geojson':
      case 'json':
        return 'geojson';
      default:
        return null;
    }
  }

  private isValidGeoJSONFeature(feature: any): boolean {
    return (
      feature &&
      feature.type === 'Feature' &&
      feature.geometry &&
      feature.geometry.type &&
      feature.geometry.coordinates
    );
  }

  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private async saveFeaturesToDatabase(mapId: string, features: any[]): Promise<TacticalMapFeature[]> {
    const savedFeatures: TacticalMapFeature[] = [];

    for (const feature of features) {
      try {
        const featureType = this.getFeatureType(feature.geometry.type);
        
        const { data, error } = await supabase
          .from(TABLES.MAP_FEATURES)
          .insert({
            map_id: mapId,
            feature_type: featureType,
            geometry: feature.geometry,
            properties: feature.properties,
            style: {
              color: '#007AFF',
              opacity: 0.7,
              strokeWidth: 2
            }
          })
          .select()
          .single();

        if (error) {
          console.error('Error saving feature:', error);
          continue;
        }

        savedFeatures.push(data);
      } catch (error) {
        console.error('Error processing feature:', error);
      }
    }

    return savedFeatures;
  }

  private getFeatureType(geometryType: string): 'point' | 'line' | 'polygon' {
    switch (geometryType) {
      case 'Point':
      case 'MultiPoint':
        return 'point';
      case 'LineString':
      case 'MultiLineString':
        return 'line';
      case 'Polygon':
      case 'MultiPolygon':
        return 'polygon';
      default:
        return 'point';
    }
  }

  // Coordinate system transformations
  async transformCoordinates(
    coordinates: [number, number], 
    fromCRS: string, 
    toCRS: string
  ): Promise<[number, number]> {
    // For now, assume all coordinates are in WGS84 (EPSG:4326)
    // In production, use proj4js for proper coordinate transformations
    return coordinates;
  }

  // Convert coordinates to different formats
  convertCoordinates(coordinates: [number, number], format: 'dd' | 'dms' | 'mgrs' | 'utm'): string {
    const [lon, lat] = coordinates;

    switch (format) {
      case 'dd':
        return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
      
      case 'dms':
        return `${this.toDMS(lat, 'lat')}, ${this.toDMS(lon, 'lon')}`;
      
      case 'mgrs':
        // Simplified MGRS conversion - use a proper library in production
        return this.toMGRS(lat, lon);
      
      case 'utm':
        // Simplified UTM conversion - use a proper library in production
        return this.toUTM(lat, lon);
      
      default:
        return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }
  }

  private toDMS(decimal: number, type: 'lat' | 'lon'): string {
    const abs = Math.abs(decimal);
    const degrees = Math.floor(abs);
    const minutes = Math.floor((abs - degrees) * 60);
    const seconds = ((abs - degrees) * 60 - minutes) * 60;
    
    const direction = type === 'lat' 
      ? (decimal >= 0 ? 'N' : 'S')
      : (decimal >= 0 ? 'E' : 'W');
    
    return `${degrees}°${minutes}'${seconds.toFixed(2)}"${direction}`;
  }

  private toMGRS(lat: number, lon: number): string {
    // Simplified MGRS - implement proper conversion in production
    return `33TWN 12345 67890`;
  }

  private toUTM(lat: number, lon: number): string {
    // Simplified UTM - implement proper conversion in production
    const zone = Math.floor((lon + 180) / 6) + 1;
    const hemisphere = lat >= 0 ? 'N' : 'S';
    return `${zone}${hemisphere} 123456 7890123`;
  }
}

export default GeospatialService;