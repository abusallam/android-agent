/**
 * Unified Tile Source Management Service
 * Handles all tile sources for tactical mapping with offline caching support
 */

export interface TileSource {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  minZoom: number;
  type: 'raster' | 'vector';
  category: 'street' | 'satellite' | 'terrain' | 'tactical';
  theme: 'light' | 'dark' | 'camo-desert' | 'camo-forest' | 'all';
  offline: boolean;
  requiresAuth: boolean;
  apiKey?: string;
}

export interface TileSourceConfig {
  defaultSource: string;
  offlineEnabled: boolean;
  maxCacheSize: number; // in MB
  cacheDuration: number; // in days
}

class TileSourceService {
  private static instance: TileSourceService;
  private config: TileSourceConfig;
  private tileSources: Map<string, TileSource>;

  private constructor() {
    this.config = {
      defaultSource: 'openstreetmap',
      offlineEnabled: true,
      maxCacheSize: 500, // 500MB
      cacheDuration: 30, // 30 days
    };
    
    this.tileSources = new Map();
    this.initializeTileSources();
  }

  public static getInstance(): TileSourceService {
    if (!TileSourceService.instance) {
      TileSourceService.instance = new TileSourceService();
    }
    return TileSourceService.instance;
  }

  /**
   * Initialize all available tile sources
   */
  private initializeTileSources(): void {
    const sources: TileSource[] = [
      // Street Maps
      {
        id: 'openstreetmap',
        name: 'OpenStreetMap',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 1,
        type: 'raster',
        category: 'street',
        theme: 'light',
        offline: true,
        requiresAuth: false,
      },
      {
        id: 'openstreetmap-dark',
        name: 'OpenStreetMap Dark',
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '© OpenStreetMap contributors © CARTO',
        maxZoom: 19,
        minZoom: 1,
        type: 'raster',
        category: 'street',
        theme: 'dark',
        offline: true,
        requiresAuth: false,
      },
      
      // Terrain Maps
      {
        id: 'opentopomap',
        name: 'OpenTopoMap',
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors © OpenTopoMap',
        maxZoom: 17,
        minZoom: 1,
        type: 'raster',
        category: 'terrain',
        theme: 'camo-desert',
        offline: true,
        requiresAuth: false,
      },
      
      // Satellite Imagery
      {
        id: 'esri-satellite',
        name: 'Esri World Imagery',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri © OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 1,
        type: 'raster',
        category: 'satellite',
        theme: 'camo-forest',
        offline: true,
        requiresAuth: false,
      },
      
      // Tactical Maps
      {
        id: 'usgs-topo',
        name: 'USGS Topographic',
        url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
        attribution: '© USGS',
        maxZoom: 16,
        minZoom: 1,
        type: 'raster',
        category: 'tactical',
        theme: 'all',
        offline: true,
        requiresAuth: false,
      },
      
      // Military Grid Reference System (MGRS) overlay
      {
        id: 'mgrs-overlay',
        name: 'MGRS Grid Overlay',
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places_Alternate/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri',
        maxZoom: 19,
        minZoom: 1,
        type: 'raster',
        category: 'tactical',
        theme: 'all',
        offline: false,
        requiresAuth: false,
      },
    ];

    sources.forEach(source => {
      this.tileSources.set(source.id, source);
    });
  }

  /**
   * Get all available tile sources
   */
  public getAllSources(): TileSource[] {
    return Array.from(this.tileSources.values());
  }

  /**
   * Get tile sources by category
   */
  public getSourcesByCategory(category: string): TileSource[] {
    return this.getAllSources().filter(source => source.category === category);
  }

  /**
   * Get tile sources by theme
   */
  public getSourcesByTheme(theme: string): TileSource[] {
    return this.getAllSources().filter(source => 
      source.theme === theme || source.theme === 'all'
    );
  }

  /**
   * Get recommended tile source for theme
   */
  public getRecommendedSourceForTheme(theme: string): TileSource {
    const themeMapping = {
      'light': 'openstreetmap',
      'dark': 'openstreetmap-dark',
      'camo-desert': 'opentopomap',
      'camo-forest': 'esri-satellite',
    };

    const sourceId = themeMapping[theme as keyof typeof themeMapping] || 'openstreetmap';
    return this.getTileSource(sourceId);
  }

  /**
   * Get specific tile source by ID
   */
  public getTileSource(id: string): TileSource {
    const source = this.tileSources.get(id);
    if (!source) {
      console.warn(`Tile source '${id}' not found, falling back to default`);
      return this.tileSources.get(this.config.defaultSource)!;
    }
    return source;
  }

  /**
   * Get tile source configuration for Leaflet
   */
  public getLeafletConfig(sourceId: string): {
    url: string;
    attribution: string;
    maxZoom: number;
    minZoom: number;
  } {
    const source = this.getTileSource(sourceId);
    return {
      url: source.url,
      attribution: source.attribution,
      maxZoom: source.maxZoom,
      minZoom: source.minZoom,
    };
  }

  /**
   * Check if offline tiles are available for source
   */
  public async isOfflineAvailable(sourceId: string): Promise<boolean> {
    const source = this.getTileSource(sourceId);
    if (!source.offline) {
      return false;
    }

    // Check if we have cached tiles for this source
    // This would integrate with a tile caching system
    try {
      // Placeholder for actual offline tile checking
      return true;
    } catch (error) {
      console.error('Error checking offline availability:', error);
      return false;
    }
  }

  /**
   * Download tiles for offline use
   */
  public async downloadTilesForArea(
    sourceId: string,
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    },
    minZoom: number,
    maxZoom: number,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const source = this.getTileSource(sourceId);
    
    if (!source.offline) {
      throw new Error(`Source '${sourceId}' does not support offline mode`);
    }

    try {
      // Calculate total number of tiles to download
      let totalTiles = 0;
      for (let z = minZoom; z <= maxZoom; z++) {
        const tilesAtZoom = this.calculateTilesInBounds(bounds, z);
        totalTiles += tilesAtZoom;
      }

      let downloadedTiles = 0;

      // Download tiles for each zoom level
      for (let z = minZoom; z <= maxZoom; z++) {
        const tiles = this.getTileCoordinatesInBounds(bounds, z);
        
        for (const tile of tiles) {
          try {
            await this.downloadTile(source, tile.x, tile.y, z);
            downloadedTiles++;
            
            if (onProgress) {
              onProgress((downloadedTiles / totalTiles) * 100);
            }
          } catch (error) {
            console.warn(`Failed to download tile ${tile.x},${tile.y},${z}:`, error);
          }
        }
      }

      console.log(`Downloaded ${downloadedTiles} tiles for offline use`);
    } catch (error) {
      console.error('Error downloading tiles:', error);
      throw error;
    }
  }

  /**
   * Calculate number of tiles in bounds at zoom level
   */
  private calculateTilesInBounds(bounds: any, zoom: number): number {
    const n = Math.pow(2, zoom);
    const minX = Math.floor((bounds.west + 180) / 360 * n);
    const maxX = Math.floor((bounds.east + 180) / 360 * n);
    const minY = Math.floor((1 - Math.log(Math.tan(bounds.north * Math.PI / 180) + 1 / Math.cos(bounds.north * Math.PI / 180)) / Math.PI) / 2 * n);
    const maxY = Math.floor((1 - Math.log(Math.tan(bounds.south * Math.PI / 180) + 1 / Math.cos(bounds.south * Math.PI / 180)) / Math.PI) / 2 * n);
    
    return (maxX - minX + 1) * (maxY - minY + 1);
  }

  /**
   * Get tile coordinates in bounds
   */
  private getTileCoordinatesInBounds(bounds: any, zoom: number): Array<{x: number, y: number}> {
    const tiles = [];
    const n = Math.pow(2, zoom);
    const minX = Math.floor((bounds.west + 180) / 360 * n);
    const maxX = Math.floor((bounds.east + 180) / 360 * n);
    const minY = Math.floor((1 - Math.log(Math.tan(bounds.north * Math.PI / 180) + 1 / Math.cos(bounds.north * Math.PI / 180)) / Math.PI) / 2 * n);
    const maxY = Math.floor((1 - Math.log(Math.tan(bounds.south * Math.PI / 180) + 1 / Math.cos(bounds.south * Math.PI / 180)) / Math.PI) / 2 * n);
    
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        tiles.push({ x, y });
      }
    }
    
    return tiles;
  }

  /**
   * Download individual tile
   */
  private async downloadTile(source: TileSource, x: number, y: number, z: number): Promise<void> {
    const url = source.url
      .replace('{x}', x.toString())
      .replace('{y}', y.toString())
      .replace('{z}', z.toString())
      .replace('{s}', 'a'); // Use 'a' subdomain

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      
      // Store tile in cache (this would integrate with actual storage)
      await this.storeTileInCache(source.id, x, y, z, blob);
    } catch (error) {
      throw new Error(`Failed to download tile: ${error}`);
    }
  }

  /**
   * Store tile in cache
   */
  private async storeTileInCache(sourceId: string, x: number, y: number, z: number, blob: Blob): Promise<void> {
    // This would integrate with actual tile caching system
    // For now, just log the operation
    console.log(`Storing tile ${sourceId}/${z}/${x}/${y} in cache`);
  }

  /**
   * Clear tile cache for source
   */
  public async clearCache(sourceId?: string): Promise<void> {
    try {
      if (sourceId) {
        console.log(`Clearing cache for source: ${sourceId}`);
        // Clear specific source cache
      } else {
        console.log('Clearing all tile caches');
        // Clear all caches
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Get cache size for source
   */
  public async getCacheSize(sourceId?: string): Promise<number> {
    try {
      // This would calculate actual cache size
      // For now, return placeholder
      return 0;
    } catch (error) {
      console.error('Error getting cache size:', error);
      return 0;
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<TileSourceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): TileSourceConfig {
    return { ...this.config };
  }

  /**
   * Add custom tile source
   */
  public addCustomSource(source: TileSource): void {
    this.tileSources.set(source.id, source);
  }

  /**
   * Remove tile source
   */
  public removeSource(sourceId: string): boolean {
    return this.tileSources.delete(sourceId);
  }
}

export default TileSourceService;