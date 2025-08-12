/**
 * Internationalization (i18n) Configuration
 * Supports Arabic (RTL) and English (LTR) with tactical terminology
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { Platform } from 'react-native';

// Import translation resources
import enTranslations from './locales/en.json';
import arTranslations from './locales/ar.json';

// Language configuration
export const SUPPORTED_LANGUAGES = ['en', 'ar'] as const;
export const DEFAULT_LANGUAGE = 'en';
export const RTL_LANGUAGES = ['ar'];

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// Check if language is RTL
export const isRTL = (language: string): boolean => {
  return RTL_LANGUAGES.includes(language as any);
};

// Get device language
export const getDeviceLanguage = (): SupportedLanguage => {
  if (Platform.OS === 'web') {
    const browserLang = navigator.language.split('-')[0];
    return SUPPORTED_LANGUAGES.includes(browserLang as any) 
      ? (browserLang as SupportedLanguage) 
      : DEFAULT_LANGUAGE;
  }
  
  // For React Native, we'll use a fallback
  // In a real app, you'd use react-native-localize
  return DEFAULT_LANGUAGE;
};

// Translation resources
const resources = {
  en: {
    common: enTranslations.common,
    tactical: enTranslations.tactical,
    navigation: enTranslations.navigation,
    communication: enTranslations.communication,
    emergency: enTranslations.emergency,
    settings: enTranslations.settings,
  },
  ar: {
    common: arTranslations.common,
    tactical: arTranslations.tactical,
    navigation: arTranslations.navigation,
    communication: arTranslations.communication,
    emergency: arTranslations.emergency,
    settings: arTranslations.settings,
  },
};

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: 'common',
    ns: ['common', 'tactical', 'navigation', 'communication', 'emergency', 'settings'],
    
    debug: __DEV__,
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    
    react: {
      useSuspense: false, // Disable suspense for React Native compatibility
    },
  });

// Language change handler
export const changeLanguage = async (language: SupportedLanguage): Promise<void> => {
  try {
    await i18n.changeLanguage(language);
    
    // Store language preference
    if (Platform.OS === 'web') {
      localStorage.setItem('i18nextLng', language);
    }
    // For React Native, you'd use AsyncStorage here
    
    console.log(`Language changed to: ${language}`);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

// Get current language
export const getCurrentLanguage = (): SupportedLanguage => {
  return i18n.language as SupportedLanguage || DEFAULT_LANGUAGE;
};

// Get available languages with display names
export const getAvailableLanguages = () => [
  { code: 'en', name: 'English', nativeName: 'English', isRTL: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', isRTL: true },
];

export default i18n;