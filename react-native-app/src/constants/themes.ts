// 🎨 Tactical Mapping System - Comprehensive Theming System
// Supports: Light, Dark, Desert Camo, Forest Camo themes with military aesthetics

export type TacticalThemeName = 'light' | 'dark' | 'desert-camo' | 'forest-camo';

export interface TacticalTheme {
  name: TacticalThemeName;
  displayName: string;
  colors: {
    // Base colors
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    
    // Text colors
    text: {
      primary: string;
      secondary: string;
      inverse: string;
      accent: string;
    };
    
    // Map colors
    map: {
      background: string;
      water: string;
      land: string;
      roads: string;
      buildings: string;
      borders: string;
    };
    
    // Tactical colors
    tactical: {
      friendly: string;
      hostile: string;
      neutral: string;
      unknown: string;
      target: string;
      route: string;
      geofence: string;
      alert: string;
    };
    
    // UI states
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Interactive elements
    button: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    
    // Borders and dividers
    border: string;
    divider: string;
    
    // Overlays
    overlay: string;
    modal: string;
  };
  
  // Map tile sources for different themes
  mapSources: {
    base: string[];
    satellite: string[];
    terrain: string[];
  };
  
  // Typography
  typography: {
    fontFamily: string;
    sizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    weights: {
      light: string;
      normal: string;
      medium: string;
      bold: string;
    };
  };
  
  // Spacing
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  
  // Border radius
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  
  // Shadows
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

// 🌞 Light Theme - Professional civilian/law enforcement
export const LIGHT_THEME: TacticalTheme = {
  name: 'light',
  displayName: 'Light',
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#0ea5e9',
    background: '#ffffff',
    surface: '#f8fafc',
    
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      inverse: '#ffffff',
      accent: '#2563eb',
    },
    
    map: {
      background: '#f0f9ff',
      water: '#3b82f6',
      land: '#f1f5f9',
      roads: '#64748b',
      buildings: '#cbd5e1',
      borders: '#475569',
    },
    
    tactical: {
      friendly: '#10b981',
      hostile: '#ef4444',
      neutral: '#f59e0b',
      unknown: '#6b7280',
      target: '#dc2626',
      route: '#8b5cf6',
      geofence: '#06b6d4',
      alert: '#f97316',
    },
    
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    button: {
      primary: '#2563eb',
      secondary: '#64748b',
      disabled: '#cbd5e1',
    },
    
    border: '#e2e8f0',
    divider: '#f1f5f9',
    overlay: 'rgba(0, 0, 0, 0.5)',
    modal: '#ffffff',
  },
  
  mapSources: {
    base: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    satellite: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    terrain: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],
  },
  
  typography: {
    fontFamily: 'System',
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
    weights: {
      light: '300',
      normal: '400',
      medium: '500',
      bold: '700',
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  },
};

// 🌙 Dark Theme - Professional night operations
export const DARK_THEME: TacticalTheme = {
  name: 'dark',
  displayName: 'Dark',
  colors: {
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#06b6d4',
    background: '#0f172a',
    surface: '#1e293b',
    
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
      inverse: '#0f172a',
      accent: '#3b82f6',
    },
    
    map: {
      background: '#0f172a',
      water: '#1e40af',
      land: '#1e293b',
      roads: '#475569',
      buildings: '#334155',
      borders: '#64748b',
    },
    
    tactical: {
      friendly: '#10b981',
      hostile: '#ef4444',
      neutral: '#f59e0b',
      unknown: '#6b7280',
      target: '#dc2626',
      route: '#8b5cf6',
      geofence: '#06b6d4',
      alert: '#f97316',
    },
    
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    button: {
      primary: '#3b82f6',
      secondary: '#475569',
      disabled: '#334155',
    },
    
    border: '#334155',
    divider: '#1e293b',
    overlay: 'rgba(0, 0, 0, 0.7)',
    modal: '#1e293b',
  },
  
  mapSources: {
    base: ['https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png'],
    satellite: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    terrain: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],
  },
  
  typography: {
    fontFamily: 'System',
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
    weights: {
      light: '300',
      normal: '400',
      medium: '500',
      bold: '700',
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.3)',
  },
};

// 🏜️ Desert Camo Theme - Military desert operations
export const DESERT_CAMO_THEME: TacticalTheme = {
  name: 'desert-camo',
  displayName: 'Desert Camo',
  colors: {
    primary: '#92400e',
    secondary: '#a16207',
    accent: '#d97706',
    background: '#fef3c7',
    surface: '#fde68a',
    
    text: {
      primary: '#451a03',
      secondary: '#92400e',
      inverse: '#fef3c7',
      accent: '#92400e',
    },
    
    map: {
      background: '#fef3c7',
      water: '#0369a1',
      land: '#fed7aa',
      roads: '#a16207',
      buildings: '#d97706',
      borders: '#92400e',
    },
    
    tactical: {
      friendly: '#059669',
      hostile: '#dc2626',
      neutral: '#d97706',
      unknown: '#78716c',
      target: '#b91c1c',
      route: '#7c2d12',
      geofence: '#0369a1',
      alert: '#ea580c',
    },
    
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#0369a1',
    
    button: {
      primary: '#92400e',
      secondary: '#a16207',
      disabled: '#d6d3d1',
    },
    
    border: '#d97706',
    divider: '#fed7aa',
    overlay: 'rgba(146, 64, 14, 0.5)',
    modal: '#fde68a',
  },
  
  mapSources: {
    base: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],
    satellite: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    terrain: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}'],
  },
  
  typography: {
    fontFamily: 'System',
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
    weights: {
      light: '300',
      normal: '400',
      medium: '500',
      bold: '700',
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  
  shadows: {
    sm: '0 1px 2px rgba(146, 64, 14, 0.2)',
    md: '0 4px 6px rgba(146, 64, 14, 0.2)',
    lg: '0 10px 15px rgba(146, 64, 14, 0.2)',
  },
};

// 🌲 Forest Camo Theme - Military forest/jungle operations
export const FOREST_CAMO_THEME: TacticalTheme = {
  name: 'forest-camo',
  displayName: 'Forest Camo',
  colors: {
    primary: '#166534',
    secondary: '#15803d',
    accent: '#22c55e',
    background: '#dcfce7',
    surface: '#bbf7d0',
    
    text: {
      primary: '#14532d',
      secondary: '#166534',
      inverse: '#dcfce7',
      accent: '#166534',
    },
    
    map: {
      background: '#dcfce7',
      water: '#0369a1',
      land: '#bbf7d0',
      roads: '#78716c',
      buildings: '#15803d',
      borders: '#166534',
    },
    
    tactical: {
      friendly: '#059669',
      hostile: '#dc2626',
      neutral: '#d97706',
      unknown: '#6b7280',
      target: '#b91c1c',
      route: '#7c2d12',
      geofence: '#0369a1',
      alert: '#ea580c',
    },
    
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#0369a1',
    
    button: {
      primary: '#166534',
      secondary: '#15803d',
      disabled: '#d6d3d1',
    },
    
    border: '#22c55e',
    divider: '#bbf7d0',
    overlay: 'rgba(22, 101, 52, 0.5)',
    modal: '#bbf7d0',
  },
  
  mapSources: {
    base: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],
    satellite: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    terrain: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}'],
  },
  
  typography: {
    fontFamily: 'System',
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
    weights: {
      light: '300',
      normal: '400',
      medium: '500',
      bold: '700',
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  
  shadows: {
    sm: '0 1px 2px rgba(22, 101, 52, 0.2)',
    md: '0 4px 6px rgba(22, 101, 52, 0.2)',
    lg: '0 10px 15px rgba(22, 101, 52, 0.2)',
  },
};

// Theme registry
export const TACTICAL_THEMES = {
  light: LIGHT_THEME,
  dark: DARK_THEME,
  'desert-camo': DESERT_CAMO_THEME,
  'forest-camo': FOREST_CAMO_THEME,
} as const;

// Theme utilities
export const getTheme = (themeName: TacticalThemeName): TacticalTheme => {
  return TACTICAL_THEMES[themeName] || TACTICAL_THEMES.dark;
};

export const getAvailableThemes = (): TacticalTheme[] => {
  return Object.values(TACTICAL_THEMES);
};

export const isValidTheme = (themeName: string): themeName is TacticalThemeName => {
  return themeName in TACTICAL_THEMES;
};

// Default theme
export const DEFAULT_THEME: TacticalThemeName = 'dark';