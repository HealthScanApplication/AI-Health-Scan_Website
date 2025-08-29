import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Design System Types
export interface ColorPalette {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
}

export interface HealthScanBrandColors {
  healthscanGreen: string;
  healthscanLightGreen: string;
  healthscanDarkTurquoise: string;
  healthscanRedAccent: string;
  healthscanBgLight: string;
  healthscanTextMuted: string;
}

export interface Typography {
  fontFamily: string;
  baseFontSize: string;
  fontSizeScale: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  fontWeights: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

export interface ComponentSizes {
  buttonHeights: {
    sm: string;
    standard: string;
    lg: string;
  };
  inputHeights: {
    sm: string;
    standard: string;
    lg: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
}

export interface DesignSystemTheme {
  colors: ColorPalette;
  brandColors: HealthScanBrandColors;
  typography: Typography;
  components: ComponentSizes;
  animations: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
}

// Default Theme
const defaultTheme: DesignSystemTheme = {
  colors: {
    primary: '#16a34a',
    primaryForeground: '#ffffff',
    secondary: '#f1f5f9',
    secondaryForeground: '#0f172a',
    accent: '#22c55e',
    accentForeground: '#ffffff',
    background: '#ffffff',
    foreground: '#0f172a',
    muted: '#f8fafc',
    mutedForeground: '#64748b',
    border: 'rgba(0, 0, 0, 0.1)',
    destructive: '#dc2626',
    destructiveForeground: '#ffffff',
    success: '#16a34a',
    successForeground: '#ffffff',
    warning: '#f59e0b',
    warningForeground: '#ffffff',
  },
  brandColors: {
    healthscanGreen: '#16a34a',
    healthscanLightGreen: '#22c55e',
    healthscanDarkTurquoise: '#008B8B',
    healthscanRedAccent: '#dc2626',
    healthscanBgLight: '#f8fdf9',
    healthscanTextMuted: '#6b7280',
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    baseFontSize: '14px',
    fontSizeScale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
    letterSpacing: {
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
    },
  },
  components: {
    buttonHeights: {
      sm: '2.5rem',
      standard: '3.5rem',
      lg: '4rem',
    },
    inputHeights: {
      sm: '2.5rem',
      standard: '3.5rem',
      lg: '4rem',
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
    },
    spacing: {
      xs: '0.5rem',
      sm: '0.75rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
    },
  },
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

interface DesignSystemContextType {
  theme: DesignSystemTheme;
  updateTheme: (updates: Partial<DesignSystemTheme>) => void;
  resetTheme: () => void;
  exportTheme: () => string;
  importTheme: (themeJson: string) => boolean;
  applyTheme: (theme: DesignSystemTheme) => void;
}

const DesignSystemContext = createContext<DesignSystemContextType | undefined>(undefined);

interface DesignSystemProviderProps {
  children: ReactNode;
}

export function DesignSystemProvider({ children }: DesignSystemProviderProps) {
  const [theme, setTheme] = useState<DesignSystemTheme>(() => {
    // Load theme from localStorage if available
    try {
      const savedTheme = localStorage.getItem('healthscan-design-system-theme');
      if (savedTheme) {
        return { ...defaultTheme, ...JSON.parse(savedTheme) };
      }
    } catch (error) {
      console.warn('Failed to load saved theme:', error);
    }
    return defaultTheme;
  });

  // Apply theme to CSS variables
  const applyTheme = (newTheme: DesignSystemTheme) => {
    const root = document.documentElement;
    
    // Apply color variables
    Object.entries(newTheme.colors).forEach(([key, value]) => {
      const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVarName, value);
    });

    // Apply brand color variables
    Object.entries(newTheme.brandColors).forEach(([key, value]) => {
      const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVarName, value);
    });

    // Apply typography variables
    root.style.setProperty('--font-family', newTheme.typography.fontFamily);
    root.style.setProperty('--font-size', newTheme.typography.baseFontSize);
    
    Object.entries(newTheme.typography.fontSizeScale).forEach(([key, value]) => {
      root.style.setProperty(`--text-${key}`, value);
    });

    Object.entries(newTheme.typography.fontWeights).forEach(([key, value]) => {
      root.style.setProperty(`--font-weight-${key}`, value.toString());
    });

    Object.entries(newTheme.typography.lineHeights).forEach(([key, value]) => {
      root.style.setProperty(`--line-height-${key}`, value.toString());
    });

    Object.entries(newTheme.typography.letterSpacing).forEach(([key, value]) => {
      root.style.setProperty(`--letter-spacing-${key}`, value);
    });

    // Apply component size variables
    Object.entries(newTheme.components.buttonHeights).forEach(([key, value]) => {
      root.style.setProperty(`--button-height-${key}`, value);
    });

    Object.entries(newTheme.components.inputHeights).forEach(([key, value]) => {
      root.style.setProperty(`--input-height-${key}`, value);
    });

    Object.entries(newTheme.components.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });

    Object.entries(newTheme.components.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    // Apply animation variables
    Object.entries(newTheme.animations.duration).forEach(([key, value]) => {
      root.style.setProperty(`--duration-${key}`, value);
    });

    Object.entries(newTheme.animations.easing).forEach(([key, value]) => {
      root.style.setProperty(`--easing-${key}`, value);
    });
  };

  // Update theme and apply changes
  const updateTheme = (updates: Partial<DesignSystemTheme>) => {
    const newTheme = {
      ...theme,
      ...updates,
      colors: { ...theme.colors, ...(updates.colors || {}) },
      brandColors: { ...theme.brandColors, ...(updates.brandColors || {}) },
      typography: { ...theme.typography, ...(updates.typography || {}) },
      components: { ...theme.components, ...(updates.components || {}) },
      animations: { ...theme.animations, ...(updates.animations || {}) },
    };
    
    setTheme(newTheme);
    applyTheme(newTheme);
    
    // Save to localStorage
    try {
      localStorage.setItem('healthscan-design-system-theme', JSON.stringify(newTheme));
    } catch (error) {
      console.warn('Failed to save theme:', error);
    }
  };

  // Reset to default theme
  const resetTheme = () => {
    setTheme(defaultTheme);
    applyTheme(defaultTheme);
    try {
      localStorage.removeItem('healthscan-design-system-theme');
    } catch (error) {
      console.warn('Failed to remove saved theme:', error);
    }
  };

  // Export theme as JSON
  const exportTheme = () => {
    return JSON.stringify(theme, null, 2);
  };

  // Import theme from JSON
  const importTheme = (themeJson: string): boolean => {
    try {
      const importedTheme = JSON.parse(themeJson);
      // Validate theme structure (basic validation)
      if (importedTheme.colors && importedTheme.brandColors && importedTheme.typography) {
        const newTheme = { ...defaultTheme, ...importedTheme };
        setTheme(newTheme);
        applyTheme(newTheme);
        
        // Save to localStorage
        localStorage.setItem('healthscan-design-system-theme', JSON.stringify(newTheme));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import theme:', error);
      return false;
    }
  };

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, []);

  const value: DesignSystemContextType = {
    theme,
    updateTheme,
    resetTheme,
    exportTheme,
    importTheme,
    applyTheme,
  };

  return (
    <DesignSystemContext.Provider value={value}>
      {children}
    </DesignSystemContext.Provider>
  );
}

export function useDesignSystem(): DesignSystemContextType {
  const context = useContext(DesignSystemContext);
  if (context === undefined) {
    throw new Error('useDesignSystem must be used within a DesignSystemProvider');
  }
  return context;
}

// Utility function to get CSS variable value
export function getCSSVariable(name: string): string {
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  return '';
}

// Utility function to convert theme to CSS custom properties
export function themeToCSSProperties(theme: DesignSystemTheme): Record<string, string> {
  const properties: Record<string, string> = {};
  
  // Convert colors
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    properties[cssVarName] = value;
  });

  // Convert brand colors
  Object.entries(theme.brandColors).forEach(([key, value]) => {
    const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    properties[cssVarName] = value;
  });

  return properties;
}