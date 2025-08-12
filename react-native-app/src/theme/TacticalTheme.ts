/**
 * Tactical Theming System
 * Provides military-appropriate themes including camouflage patterns
 */

export interface TacticalTheme {
  name: string;
  displayName: string;
  colors: {
    // Base colors
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    
    // Status colors
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Tactical-specific colors
    friendly: string;
    enemy: string;
    neutral: string;
    objective: string;
    unknown: string;
    
    // Camo pattern colors (4-color system)
    camo1: string; // Primary camo color
    camo2: string; // Secondary camo color
    camo3: string; // Tertiary camo color
    camo4: string; // Accent camo color
    
    // UI element colors
    cardBackground: string;
    inputBackground: string;
    buttonPrimary: string;
    buttonSecondary: string;
    overlay: string;
    shadow: string;
  };
  
  typography: {
    fontFamily: string;
    fontSize: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    fontWeight: {
      light: string;
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  
  borderRadius: {
    none: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  
  // Theme-specific properties
  isDark: boolean;
  isCamo: boolean;
  camoType?: 'desert' | 'forest' | 'urban' | 'arctic';
}

// Base typography and spacing (shared across themes)
const baseTypography = {
  fontFamily: 'System',
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
};

const baseSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const baseBorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

const baseShadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
};

// Light Theme - Professional appearance for office/command center use
export const lightTheme: TacticalTheme = {
  name: 'light',
  displayName: 'Light',
  colors: {
    primary: '#2196F3',
    secondary: '#FFC107',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    text: '#212121',
    textSecondary: '#757575',
    border: '#E0E0E0',
    
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
    
    friendly: '#4CAF50',
    enemy: '#F44336',
    neutral: '#9E9E9E',
    objective: '#9C27B0',
    unknown: '#607D8B',
    
    camo1: '#F5F5F5',
    camo2: '#E0E0E0',
    camo3: '#BDBDBD',
    camo4: '#9E9E9E',
    
    cardBackground: '#FFFFFF',
    inputBackground: '#F5F5F5',
    buttonPrimary: '#2196F3',
    buttonSecondary: '#E0E0E0',
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  typography: baseTypography,
  spacing: baseSpacing,
  borderRadius: baseBorderRadius,
  shadows: baseShadows,
  isDark: false,
  isCamo: false,
};

// Dark Theme - Reduced eye strain for night operations
export const darkTheme: TacticalTheme = {
  name: 'dark',
  displayName: 'Dark',
  colors: {
    primary: '#90CAF9',
    secondary: '#FFD54F',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#333333',
    
    success: '#66BB6A',
    warning: '#FFB74D',
    error: '#EF5350',
    info: '#42A5F5',
    
    friendly: '#66BB6A',
    enemy: '#EF5350',
    neutral: '#BDBDBD',
    objective: '#BA68C8',
    unknown: '#78909C',
    
    camo1: '#1E1E1E',
    camo2: '#2E2E2E',
    camo3: '#3E3E3E',
    camo4: '#4E4E4E',
    
    cardBackground: '#1E1E1E',
    inputBackground: '#2E2E2E',
    buttonPrimary: '#90CAF9',
    buttonSecondary: '#333333',
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
  typography: baseTypography,
  spacing: baseSpacing,
  borderRadius: baseBorderRadius,
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.4)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.5)',
  },
  isDark: true,
  isCamo: false,
};

// Desert Camo Theme - Sand, tan, brown tones for desert environments
export const desertCamoTheme: TacticalTheme = {
  name: 'camo-desert',
  displayName: 'Desert Camo',
  colors: {
    primary: '#D4A574',
    secondary: '#B8860B',
    background: '#F4E4BC',
    surface: '#E6D3A3',
    text: '#5D4E37',
    textSecondary: '#8B7355',
    border: '#C19A6B',
    
    success: '#9ACD32',
    warning: '#DAA520',
    error: '#CD853F',
    info: '#D2B48C',
    
    friendly: '#9ACD32',
    enemy: '#CD853F',
    neutral: '#DEB887',
    objective: '#B8860B',
    unknown: '#A0522D',
    
    // Desert 4-color camouflage pattern
    camo1: '#F4E4BC', // Light sand
    camo2: '#D2B48C', // Tan
    camo3: '#DEB887', // Burlywood
    camo4: '#8B7355', // Dark khaki
    
    cardBackground: '#F4E4BC',
    inputBackground: '#E6D3A3',
    buttonPrimary: '#D4A574',
    buttonSecondary: '#DEB887',
    overlay: 'rgba(93, 78, 55, 0.6)',
    shadow: 'rgba(93, 78, 55, 0.2)',
  },
  typography: baseTypography,
  spacing: baseSpacing,
  borderRadius: baseBorderRadius,
  shadows: {
    sm: '0 1px 2px rgba(93, 78, 55, 0.2)',
    md: '0 4px 6px rgba(93, 78, 55, 0.3)',
    lg: '0 10px 15px rgba(93, 78, 55, 0.3)',
    xl: '0 20px 25px rgba(93, 78, 55, 0.4)',
  },
  isDark: false,
  isCamo: true,
  camoType: 'desert',
};

// Forest Camo Theme - Green, brown, olive tones for forest operations
export const forestCamoTheme: TacticalTheme = {
  name: 'camo-forest',
  displayName: 'Forest Camo',
  colors: {
    primary: '#228B22',
    secondary: '#32CD32',
    background: '#2F4F2F',
    surface: '#3CB371',
    text: '#F0FFF0',
    textSecondary: '#98FB98',
    border: '#556B2F',
    
    success: '#00FF00',
    warning: '#ADFF2F',
    error: '#8B4513',
    info: '#20B2AA',
    
    friendly: '#00FF00',
    enemy: '#8B4513',
    neutral: '#9ACD32',
    objective: '#FFD700',
    unknown: '#6B8E23',
    
    // Forest 4-color camouflage pattern
    camo1: '#2F4F2F', // Dark green
    camo2: '#228B22', // Forest green
    camo3: '#556B2F', // Dark olive green
    camo4: '#8B4513', // Saddle brown
    
    cardBackground: '#2F4F2F',
    inputBackground: '#3CB371',
    buttonPrimary: '#228B22',
    buttonSecondary: '#556B2F',
    overlay: 'rgba(47, 79, 47, 0.7)',
    shadow: 'rgba(47, 79, 47, 0.3)',
  },
  typography: baseTypography,
  spacing: baseSpacing,
  borderRadius: baseBorderRadius,
  shadows: {
    sm: '0 1px 2px rgba(47, 79, 47, 0.3)',
    md: '0 4px 6px rgba(47, 79, 47, 0.4)',
    lg: '0 10px 15px rgba(47, 79, 47, 0.4)',
    xl: '0 20px 25px rgba(47, 79, 47, 0.5)',
  },
  isDark: true,
  isCamo: true,
  camoType: 'forest',
};

// Theme registry
export const themes = {
  light: lightTheme,
  dark: darkTheme,
  'camo-desert': desertCamoTheme,
  'camo-forest': forestCamoTheme,
};

export type ThemeName = keyof typeof themes;

// Theme utility functions
export const getTheme = (themeName: ThemeName): TacticalTheme => {
  return themes[themeName] || themes.light;
};

export const getAvailableThemes = (): Array<{ name: ThemeName; displayName: string; isCamo: boolean }> => {
  return Object.values(themes).map(theme => ({
    name: theme.name as ThemeName,
    displayName: theme.displayName,
    isCamo: theme.isCamo,
  }));
};

export const getCamoThemes = (): TacticalTheme[] => {
  return Object.values(themes).filter(theme => theme.isCamo);
};

export const getNonCamoThemes = (): TacticalTheme[] => {
  return Object.values(themes).filter(theme => !theme.isCamo);
};

// Theme detection utilities
export const detectSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const shouldUseSystemTheme = (themeName: ThemeName): boolean => {
  return themeName === 'light' || themeName === 'dark';
};

export default {
  themes,
  getTheme,
  getAvailableThemes,
  getCamoThemes,
  getNonCamoThemes,
  detectSystemTheme,
  shouldUseSystemTheme,
};