/**
 * Theme Selector Component
 * Allows users to switch between tactical themes
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
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getAvailableThemes, ThemeName } from '../theme/TacticalTheme';

const { width } = Dimensions.get('window');

interface ThemeSelectorProps {
  visible: boolean;
  onClose: () => void;
  showSystemThemeOption?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  visible,
  onClose,
  showSystemThemeOption = true,
}) => {
  const { 
    theme, 
    themeName, 
    setTheme, 
    useSystemTheme, 
    setUseSystemTheme,
    systemTheme 
  } = useTheme();
  
  const availableThemes = getAvailableThemes();

  const handleThemeSelect = (selectedTheme: ThemeName) => {
    setTheme(selectedTheme);
    onClose();
  };

  const handleSystemThemeToggle = () => {
    setUseSystemTheme(!useSystemTheme);
  };

  const getThemePreview = (themeOption: typeof availableThemes[0]) => {
    const previewTheme = themeOption.name;
    const colors = {
      light: ['#FFFFFF', '#2196F3', '#4CAF50', '#F44336'],
      dark: ['#121212', '#90CAF9', '#66BB6A', '#EF5350'],
      'camo-desert': ['#F4E4BC', '#D4A574', '#9ACD32', '#CD853F'],
      'camo-forest': ['#2F4F2F', '#228B22', '#00FF00', '#8B4513'],
    };

    return colors[previewTheme] || colors.light;
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
      maxWidth: width * 0.9,
      maxHeight: '80%',
    },
    title: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    themeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    themeOption: {
      width: '48%',
      marginBottom: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 2,
      borderColor: 'transparent',
      overflow: 'hidden',
    },
    selectedTheme: {
      borderColor: theme.colors.primary,
    },
    themePreview: {
      height: 80,
      flexDirection: 'row',
    },
    colorStrip: {
      flex: 1,
    },
    themeInfo: {
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.cardBackground,
    },
    themeName: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text,
      textAlign: 'center',
    },
    themeType: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 2,
    },
    systemThemeSection: {
      marginTop: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    systemThemeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
    },
    systemThemeText: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.text,
      flex: 1,
    },
    systemThemeSubtext: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    switch: {
      width: 50,
      height: 30,
      borderRadius: 15,
      padding: 2,
      justifyContent: 'center',
    },
    switchActive: {
      backgroundColor: theme.colors.primary,
    },
    switchInactive: {
      backgroundColor: theme.colors.border,
    },
    switchThumb: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: '#FFFFFF',
    },
    switchThumbActive: {
      alignSelf: 'flex-end',
    },
    switchThumbInactive: {
      alignSelf: 'flex-start',
    },
    closeButton: {
      marginTop: theme.spacing.lg,
      backgroundColor: theme.colors.buttonPrimary,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      alignSelf: 'center',
    },
    closeButtonText: {
      color: theme.colors.background,
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.medium,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Select Theme</Text>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.themeGrid}>
              {availableThemes.map((themeOption) => {
                const isSelected = themeName === themeOption.name;
                const previewColors = getThemePreview(themeOption);
                
                return (
                  <TouchableOpacity
                    key={themeOption.name}
                    style={[
                      styles.themeOption,
                      isSelected && styles.selectedTheme,
                    ]}
                    onPress={() => handleThemeSelect(themeOption.name)}
                  >
                    <View style={styles.themePreview}>
                      {previewColors.map((color, index) => (
                        <View
                          key={index}
                          style={[
                            styles.colorStrip,
                            { backgroundColor: color },
                          ]}
                        />
                      ))}
                    </View>
                    <View style={styles.themeInfo}>
                      <Text style={styles.themeName}>
                        {themeOption.displayName}
                      </Text>
                      <Text style={styles.themeType}>
                        {themeOption.isCamo ? 'Tactical' : 'Standard'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {showSystemThemeOption && (
              <View style={styles.systemThemeSection}>
                <TouchableOpacity
                  style={styles.systemThemeOption}
                  onPress={handleSystemThemeToggle}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.systemThemeText}>
                      Follow System Theme
                    </Text>
                    <Text style={styles.systemThemeSubtext}>
                      Automatically switch between light and dark themes based on your device settings
                      {useSystemTheme && ` (Currently: ${systemTheme})`}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.switch,
                      useSystemTheme ? styles.switchActive : styles.switchInactive,
                    ]}
                  >
                    <View
                      style={[
                        styles.switchThumb,
                        useSystemTheme ? styles.switchThumbActive : styles.switchThumbInactive,
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ThemeSelector;