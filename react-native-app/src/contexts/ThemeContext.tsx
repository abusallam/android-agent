/**
 * Tactical Theme Context Provider
 * Manages theme state and provides theme switching functionality
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TacticalTheme, ThemeName, themes, getTheme, detectSystemTheme, shouldUseSystemTheme } from '../theme/TacticalTheme';

interface ThemeContextType {
  theme: TacticalTheme;
  themeName: ThemeName;
  setTheme: (themeName: ThemeName) => void;
  toggleTheme: () => void;
  isLoading: boolean;
  systemTheme: 'light' | 'dark';
  useSystemTheme: boolean;
  setUseSystemTheme: (use: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@tactical_theme';
const USE_SYSTEM_THEME_KEY = '@use_system_theme';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeName;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'light' 
}) => {
  const [themeName, setThemeName] = useState<ThemeName>(defaultTheme);
  const [useSystemTheme, setUseSystemTheme] = useState<boolean>(false);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load saved theme preferences on mount
  useEffect(() => {
    loadThemePreferences();
    detectAndSetSystemTheme();
    setupSystemThemeListener();
  }, []);

  // Update theme when system theme changes and user prefers system theme
  useEffect(() => {
    if (useSystemTheme && shouldUseSystemTheme(themeName)) {
      setThemeName(systemTheme);
    }
  }, [systemTheme, useSystemTheme]);

  /**
   * Load theme preferences from storage
   */
  const loadThemePreferences = async () => {
    try {
      const [savedTheme, savedUseSystemTheme] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY),
        AsyncStorage.getItem(USE_SYSTEM_THEME_KEY),
      ]);

      if (savedTheme && themes[savedTheme as ThemeName]) {
        setThemeName(savedTheme as ThemeName);
      }

      if (savedUseSystemTheme !== null) {
        const useSystem = JSON.parse(savedUseSystemTheme);
        setUseSystemTheme(useSystem);
        
        // If user prefers system theme, apply it
        if (useSystem) {
          const detectedTheme = detectSystemTheme();
          setSystemTheme(detectedTheme);
          if (shouldUseSystemTheme(savedTheme as ThemeName || defaultTheme)) {
            setThemeName(detectedTheme);
          }
        }
      }
    } catch (error) {
      console.error('Error loading theme preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Detect and set system theme
   */
  const detectAndSetSystemTheme = () => {
    const detected = detectSystemTheme();
    setSystemTheme(detected);
  };

  /**
   * Set up system theme change listener
   */
  const setupSystemThemeListener = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        const newSystemTheme = e.matches ? 'dark' : 'light';
        setSystemTheme(newSystemTheme);
      };

      mediaQuery.addEventListener('change', handleChange);
      
      // Cleanup function
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  };

  /**
   * Set theme and save to storage
   */
  const setTheme = async (newThemeName: ThemeName) => {
    try {
      setThemeName(newThemeName);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newThemeName);
      
      // If switching to a non-system theme, disable system theme preference
      if (!shouldUseSystemTheme(newThemeName) && useSystemTheme) {
        setUseSystemTheme(false);
        await AsyncStorage.setItem(USE_SYSTEM_THEME_KEY, JSON.stringify(false));
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = () => {
    const currentTheme = getTheme(themeName);
    if (currentTheme.isCamo) {
      // If current theme is camo, switch to light
      setTheme('light');
    } else {
      // Toggle between light and dark
      const newTheme = themeName === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
    }
  };

  /**
   * Set system theme preference
   */
  const handleSetUseSystemTheme = async (use: boolean) => {
    try {
      setUseSystemTheme(use);
      await AsyncStorage.setItem(USE_SYSTEM_THEME_KEY, JSON.stringify(use));
      
      if (use && shouldUseSystemTheme(themeName)) {
        setTheme(systemTheme);
      }
    } catch (error) {
      console.error('Error saving system theme preference:', error);
    }
  };

  const contextValue: ThemeContextType = {
    theme: getTheme(themeName),
    themeName,
    setTheme,
    toggleTheme,
    isLoading,
    systemTheme,
    useSystemTheme,
    setUseSystemTheme: handleSetUseSystemTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to use theme context
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Hook to get theme-aware styles
 */
export const useThemedStyles = <T extends Record<string, any>>(
  styleFactory: (theme: TacticalTheme) => T
): T => {
  const { theme } = useTheme();
  return styleFactory(theme);
};

/**
 * Higher-order component to inject theme
 */
export const withTheme = <P extends object>(
  Component: React.ComponentType<P & { theme: TacticalTheme }>
) => {
  return (props: P) => {
    const { theme } = useTheme();
    return <Component {...props} theme={theme} />;
  };
};

export default ThemeProvider;