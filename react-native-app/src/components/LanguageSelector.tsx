/**
 * Language Selector Component
 * Allows users to switch between Arabic and English with RTL support
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
  I18nManager,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { 
  changeLanguage, 
  getCurrentLanguage, 
  getAvailableLanguages, 
  isRTL,
  SupportedLanguage 
} from '../i18n';

const { width } = Dimensions.get('window');

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
  onLanguageChange?: (language: SupportedLanguage) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  visible,
  onClose,
  onLanguageChange,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isChanging, setIsChanging] = useState(false);
  
  const currentLanguage = getCurrentLanguage();
  const availableLanguages = getAvailableLanguages();

  const handleLanguageSelect = async (languageCode: SupportedLanguage) => {
    if (languageCode === currentLanguage) {
      onClose();
      return;
    }

    setIsChanging(true);
    
    try {
      // Change the language
      await changeLanguage(languageCode);
      
      // Handle RTL layout changes for React Native
      if (Platform.OS !== 'web') {
        const shouldBeRTL = isRTL(languageCode);
        const currentRTL = I18nManager.isRTL;
        
        if (shouldBeRTL !== currentRTL) {
          I18nManager.allowRTL(shouldBeRTL);
          I18nManager.forceRTL(shouldBeRTL);
          
          // Note: In a real app, you might need to restart the app
          // or reload the bundle for RTL changes to take effect
          console.log(`RTL changed to: ${shouldBeRTL}. App restart may be required.`);
        }
      }
      
      // Notify parent component
      onLanguageChange?.(languageCode);
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      margin: theme.spacing.md,
      maxWidth: width * 0.8,
      minWidth: width * 0.6,
    },
    title: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    languageList: {
      marginBottom: theme.spacing.md,
    },
    languageOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedLanguage: {
      backgroundColor: theme.colors.primary + '20',
      borderColor: theme.colors.primary,
    },
    languageFlag: {
      fontSize: 24,
      marginRight: theme.spacing.sm,
      marginLeft: theme.spacing.sm,
    },
    languageInfo: {
      flex: 1,
    },
    languageName: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text,
    },
    languageNativeName: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    languageDirection: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    checkmark: {
      fontSize: 20,
      color: theme.colors.primary,
      marginLeft: theme.spacing.sm,
    },
    rtlNote: {
      backgroundColor: theme.colors.warning + '20',
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      marginBottom: theme.spacing.md,
    },
    rtlNoteText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text,
      textAlign: 'center',
    },
    closeButton: {
      backgroundColor: theme.colors.buttonPrimary,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      alignSelf: 'center',
      marginTop: theme.spacing.md,
    },
    closeButtonText: {
      color: theme.colors.background,
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.medium,
    },
    loadingText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
  });

  const getLanguageFlag = (code: string): string => {
    const flags = {
      en: '🇺🇸',
      ar: '🇸🇦',
    };
    return flags[code as keyof typeof flags] || '🌐';
  };

  const needsRTLRestart = (languageCode: SupportedLanguage): boolean => {
    if (Platform.OS === 'web') return false;
    
    const willBeRTL = isRTL(languageCode);
    const currentRTL = I18nManager.isRTL;
    
    return willBeRTL !== currentRTL;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>
            {t('settings:language')}
          </Text>
          
          {Platform.OS !== 'web' && (
            <View style={styles.rtlNote}>
              <Text style={styles.rtlNoteText}>
                {currentLanguage === 'ar' 
                  ? 'قد يتطلب تغيير اللغة إعادة تشغيل التطبيق لتطبيق اتجاه النص'
                  : 'Language changes may require app restart to apply text direction'
                }
              </Text>
            </View>
          )}

          <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
            {availableLanguages.map((language) => {
              const isSelected = currentLanguage === language.code;
              const willNeedRestart = needsRTLRestart(language.code as SupportedLanguage);
              
              return (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageOption,
                    isSelected && styles.selectedLanguage,
                  ]}
                  onPress={() => handleLanguageSelect(language.code as SupportedLanguage)}
                  disabled={isChanging}
                >
                  <Text style={styles.languageFlag}>
                    {getLanguageFlag(language.code)}
                  </Text>
                  
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageName}>
                      {language.name}
                    </Text>
                    <Text style={styles.languageNativeName}>
                      {language.nativeName}
                    </Text>
                    <Text style={styles.languageDirection}>
                      {language.isRTL 
                        ? (currentLanguage === 'ar' ? 'من اليمين إلى اليسار' : 'Right to Left')
                        : (currentLanguage === 'ar' ? 'من اليسار إلى اليمين' : 'Left to Right')
                      }
                      {willNeedRestart && (
                        currentLanguage === 'ar' 
                          ? ' • يتطلب إعادة التشغيل'
                          : ' • Requires restart'
                      )}
                    </Text>
                  </View>
                  
                  {isSelected && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {isChanging && (
            <Text style={styles.loadingText}>
              {t('common:loading')}
            </Text>
          )}

          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
            disabled={isChanging}
          >
            <Text style={styles.closeButtonText}>
              {t('common:done')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default LanguageSelector;