import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, TABLES } from '../lib/supabase';

export interface TileSource {
  id: string;
  name: string;
  url: string;
  minZoom: number;
  maxZoom: number;
  tileSize: number;
  format: 'png' | 'jpg' | 'webp';
  attribution?: string;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface DownloadProgress {
  totalTiles: number;
  downloadedTiles: number;
  failedTiles: number;
  progress: number; // 0-1
  estimatedSize: number; // bytes
  downloadedSize: number; // bytes
  isComplete: boolean;
  error?: string;
}

export interface OfflineRegion {
  id: string;
  name: string;
  bounds: BoundingBox;
  minZoom: number;
  maxZoom: number;
  tileSource: string;
  downloadedAt: string;
  size: number; // bytes
  tileCount: number;
  isComplete: boolean;
}

export class OfflineTileService {
  private readonly TILES_DIR = `${FileSystem.documentDirectory}tiles/`;
  private readonly REGIONS_KEY = 'offline_regions';
  private readonly MAX_CONCURRENT_DOWNLOADS = 6;
  private readonly TILE_CACHE_SIZE = 500 * 1024 * 1024; // 500MB
  
  private downloadQueue: Map<string, Promise<void>> = new Map();
  private downloadProgress: Map<string, DownloadProgress> = new Map();
  private progressCallbacks: Map<string, (progress: DownloadProgress) => void> = new Map();

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      // Create tiles directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(this.TILES_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.TILES_DIR, { intermediates: true });
      }
    } catch (error) {
      console.error('Error initializing tile storage:', error);
    }
  }

  // Download tiles for a specific region
  async downloadRegion(
    regionId: string,
    name: string,
    bounds: BoundingBox,
    tileSource: TileSource,
    zoomLevels: number[],
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<boolean> {
    try {
      // Check if already downloading
      if (this.downloadQueue.has(regionId)) {
        console.log(`Region ${regionId} is already being downloaded`);
        return false;
      }

      // Calculate total tiles needed
      const totalTiles = this.calculateTileCount(bounds, zoomLevels);
      const estimatedSize = totalTiles * 15000; // Estimate 15KB per tile

      // Initialize progress
      const progress: DownloadProgress = {
        totalTiles,
        downloadedTiles: 0,
        failedTiles: 0,
        progress: 0,
        estimatedSize,
        downloadedSize: 0,
        isComplete: false
      };

      this.downloadProgress.set(regionId, progress);
      if (onProgress) {
        this.progressCallbacks.set(regionId, onProgress);
      }

      // Start download
      const downloadPromise = this.performDownload(regionId, name, bounds, tileSource, zoomLevels);
      this.downloadQueue.set(regionId, downloadPromise);

      const success = await downloadPromise;
      
      // Cleanup
      this.downloadQueue.delete(regionId);
      this.downloadProgress.delete(regionId);
      this.progressCallbacks.delete(regionId);

      return success;
    } catch (error) {
      console.error('Error downloading region:', error);
      this.downloadQueue.delete(regionId);
      this.downloadProgress.delete(regionId);
      this.progressCallbacks.delete(regionId);
      return false;
    }
  }

  private async performDownload(
    regionId: string,
    name: string,
    bounds: BoundingBox,
    tileSource: TileSource,
    zoomLevels: number[]
  ): Promise<boolean> {
    try {
      const progress = this.downloadProgress.get(regionId)!;
      const onProgress = this.progressCallbacks.get(regionId);

      // Create region directory
      const regionDir = `${this.TILES_DIR}${regionId}/`;
      await FileSystem.makeDirectoryAsync(regionDir, { intermediates: true });

      let downloadedTiles = 0;
      let failedTiles = 0;
      let downloadedSize = 0;

      // Download tiles for each zoom level
      for (const zoom of zoomLevels) {
        const tiles = this.getTilesForBounds(bounds, zoom);
        
        // Download tiles in batches to avoid overwhelming the server
        const batches = this.chunkArray(tiles, this.MAX_CONCURRENT_DOWNLOADS);
        
        for (const batch of batches) {
          const downloadPromises = batch.map(async (tile) => {
            try {
              const tileUrl = this.buildTileUrl(tileSource.url, tile.x, tile.y, tile.z);
              const tilePath = `${regionDir}${tile.z}_${tile.x}_${tile.y}.${tileSource.format}`;
              
              // Check if tile already exists
              const tileInfo = await FileSystem.getInfoAsync(tilePath);
              if (tileInfo.exists) {
                downloadedTiles++;
                downloadedSize += tileInfo.size || 0;
                return;
              }

              // Download tile
              const downloadResult = await FileSystem.downloadAsync(tileUrl, tilePath);
              
              if (downloadResult.status === 200) {
                downloadedTiles++;
                const tileSize = (await FileSystem.getInfoAsync(tilePath)).size || 0;
                downloadedSize += tileSize;
              } else {
                failedTiles++;
                console.warn(`Failed to download tile ${tile.z}/${tile.x}/${tile.y}: ${downloadResult.status}`);
              }
            } catch (error) {
              failedTiles++;
              console.error(`Error downloading tile ${tile.z}/${tile.x}/${tile.y}:`, error);
            }
          });

          await Promise.all(downloadPromises);

          // Update progress
          progress.downloadedTiles = downloadedTiles;
          progress.failedTiles = failedTiles;
          progress.downloadedSize = downloadedSize;
          progress.progress = downloadedTiles / progress.totalTiles;

          onProgress?.(progress);
        }
      }

      // Mark as complete
      progress.isComplete = true;
      onProgress?.(progress);

      // Save region metadata
      const region: OfflineRegion = {
        id: regionId,
        name,
        bounds,
        minZoom: Math.min(...zoomLevels),
        maxZoom: Math.max(...zoomLevels),
        tileSource: tileSource.id,
        downloadedAt: new Date().toISOString(),
        size: downloadedSize,
        tileCount: downloadedTiles,
        isComplete: true
      };

      await this.saveRegion(region);

      console.log(`Downloaded ${downloadedTiles} tiles for region ${regionId} (${failedTiles} failed)`);
      return true;
    } catch (error) {
      console.error('Error performing download:', error);
      return false;
    }
  }

  // Get offline tile if available
  async getOfflineTile(x: number, y: number, z: number, regionId?: string): Promise<string | null> {
    try {
      let tilePath: string;
      
      if (regionId) {
        // Look in specific region
        tilePath = `${this.TILES_DIR}${regionId}/${z}_${x}_${y}.png`;
      } else {
        // Look in all regions
        const regions = await this.getOfflineRegions();
        for (const region of regions) {
          tilePath = `${this.TILES_DIR}${region.id}/${z}_${x}_${y}.png`;
          const tileInfo = await FileSystem.getInfoAsync(tilePath);
          if (tileInfo.exists) {
            return tilePath;
          }
        }
        return null;
      }

      const tileInfo = await FileSystem.getInfoAsync(tilePath);
      return tileInfo.exists ? tilePath : null;
    } catch (error) {
      console.error('Error getting offline tile:', error);
      return null;
    }
  }

  // Check if area is available offline
  async isAreaAvailableOffline(bounds: BoundingBox, zoom: number): Promise<boolean> {
    try {
      const regions = await this.getOfflineRegions();
      
      for (const region of regions) {
        if (this.boundsContain(region.bounds, bounds) && 
            zoom >= region.minZoom && 
            zoom <= region.maxZoom) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking offline availability:', error);
      return false;
    }
  }

  // Get all offline regions
  async getOfflineRegions(): Promise<OfflineRegion[]> {
    try {
      const regionsJson = await AsyncStorage.getItem(this.REGIONS_KEY);
      return regionsJson ? JSON.parse(regionsJson) : [];
    } catch (error) {
      console.error('Error getting offline regions:', error);
      return [];
    }
  }

  // Delete offline region
  async deleteRegion(regionId: string): Promise<boolean> {
    try {
      // Delete tiles directory
      const regionDir = `${this.TILES_DIR}${regionId}/`;
      const dirInfo = await FileSystem.getInfoAsync(regionDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(regionDir);
      }

      // Remove from regions list
      const regions = await this.getOfflineRegions();
      const updatedRegions = regions.filter(r => r.id !== regionId);
      await AsyncStorage.setItem(this.REGIONS_KEY, JSON.stringify(updatedRegions));

      console.log(`Deleted offline region: ${regionId}`);
      return true;
    } catch (error) {
      console.error('Error deleting region:', error);
      return false;
    }
  }

  // Get cache size and statistics
  async getCacheStats(): Promise<{
    totalSize: number;
    regionCount: number;
    tileCount: number;
    regions: OfflineRegion[];
  }> {
    try {
      const regions = await this.getOfflineRegions();
      const totalSize = regions.reduce((sum, region) => sum + region.size, 0);
      const tileCount = regions.reduce((sum, region) => sum + region.tileCount, 0);

      return {
        totalSize,
        regionCount: regions.length,
        tileCount,
        regions
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalSize: 0,
        regionCount: 0,
        tileCount: 0,
        regions: []
      };
    }
  }

  // Clean up old or unused tiles
  async cleanupCache(maxSize?: number): Promise<void> {
    try {
      const stats = await this.getCacheStats();
      const targetSize = maxSize || this.TILE_CACHE_SIZE;

      if (stats.totalSize <= targetSize) {
        return; // No cleanup needed
      }

      // Sort regions by download date (oldest first)
      const sortedRegions = stats.regions.sort((a, b) => 
        new Date(a.downloadedAt).getTime() - new Date(b.downloadedAt).getTime()
      );

      let currentSize = stats.totalSize;
      
      for (const region of sortedRegions) {
        if (currentSize <= targetSize) {
          break;
        }

        await this.deleteRegion(region.id);
        currentSize -= region.size;
        console.log(`Cleaned up region ${region.name} to free space`);
      }
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  }

  // Cancel ongoing download
  async cancelDownload(regionId: string): Promise<void> {
    try {
      const downloadPromise = this.downloadQueue.get(regionId);
      if (downloadPromise) {
        // Note: We can't actually cancel the promise, but we can mark it as cancelled
        this.downloadQueue.delete(regionId);
        this.downloadProgress.delete(regionId);
        this.progressCallbacks.delete(regionId);
        
        // Delete partial download
        const regionDir = `${this.TILES_DIR}${regionId}/`;
        const dirInfo = await FileSystem.getInfoAsync(regionDir);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(regionDir);
        }
        
        console.log(`Cancelled download for region: ${regionId}`);
      }
    } catch (error) {
      console.error('Error cancelling download:', error);
    }
  }

  // Get download progress
  getDownloadProgress(regionId: string): DownloadProgress | null {
    return this.downloadProgress.get(regionId) || null;
  }

  // Private helper methods
  private async saveRegion(region: OfflineRegion): Promise<void> {
    try {
      const regions = await this.getOfflineRegions();
      const existingIndex = regions.findIndex(r => r.id === region.id);
      
      if (existingIndex >= 0) {
        regions[existingIndex] = region;
      } else {
        regions.push(region);
      }
      
      await AsyncStorage.setItem(this.REGIONS_KEY, JSON.stringify(regions));
    } catch (error) {
      console.error('Error saving region:', error);
    }
  }

  private calculateTileCount(bounds: BoundingBox, zoomLevels: number[]): number {
    let totalTiles = 0;
    
    for (const zoom of zoomLevels) {
      const tiles = this.getTilesForBounds(bounds, zoom);
      totalTiles += tiles.length;
    }
    
    return totalTiles;
  }

  private getTilesForBounds(bounds: BoundingBox, zoom: number): Array<{x: number, y: number, z: number}> {
    const tiles: Array<{x: number, y: number, z: number}> = [];
    
    const minTileX = this.lonToTileX(bounds.west, zoom);
    const maxTileX = this.lonToTileX(bounds.east, zoom);
    const minTileY = this.latToTileY(bounds.north, zoom);
    const maxTileY = this.latToTileY(bounds.south, zoom);
    
    for (let x = minTileX; x <= maxTileX; x++) {
      for (let y = minTileY; y <= maxTileY; y++) {
        tiles.push({ x, y, z: zoom });
      }
    }
    
    return tiles;
  }

  private lonToTileX(lon: number, zoom: number): number {
    return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
  }

  private latToTileY(lat: number, zoom: number): number {
    return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  }

  private buildTileUrl(template: string, x: number, y: number, z: number): string {
    return template
      .replace('{x}', x.toString())
      .replace('{y}', y.toString())
      .replace('{z}', z.toString())
      .replace('{s}', ['a', 'b', 'c'][Math.floor(Math.random() * 3)]); // Random subdomain
  }

  private boundsContain(outerBounds: BoundingBox, innerBounds: BoundingBox): boolean {
    return (
      outerBounds.north >= innerBounds.north &&
      outerBounds.south <= innerBounds.south &&
      outerBounds.east >= innerBounds.east &&
      outerBounds.west <= innerBounds.west
    );
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Predefined tile sources
  static readonly TILE_SOURCES: TileSource[] = [
    {
      id: 'osm',
      name: 'OpenStreetMap',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      minZoom: 0,
      maxZoom: 19,
      tileSize: 256,
      format: 'png',
      attribution: '© OpenStreetMap contributors'
    },
    {
      id: 'satellite',
      name: 'Satellite Imagery',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      minZoom: 0,
      maxZoom: 19,
      tileSize: 256,
      format: 'jpg',
      attribution: '© Esri'
    },
    {
      id: 'topo',
      name: 'Topographic',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      minZoom: 0,
      maxZoom: 19,
      tileSize: 256,
      format: 'jpg',
      attribution: '© Esri'
    }
  ];
}

export default OfflineTileService;