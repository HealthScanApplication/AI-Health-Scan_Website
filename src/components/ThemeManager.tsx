import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { 
  Palette, 
  Type, 
  Settings, 
  Download, 
  Upload, 
  RotateCcw, 
  Copy, 
  Check,
  Eye,
  Lightbulb,
  Zap,
  Monitor
} from 'lucide-react';
import { useDesignSystem, DesignSystemTheme, ColorPalette, HealthScanBrandColors, Typography } from '../contexts/DesignSystemContext';

interface ThemeManagerProps {
  isAdmin?: boolean;
}

export function ThemeManager({ isAdmin = false }: ThemeManagerProps) {
  const { theme, updateTheme, resetTheme, exportTheme, importTheme } = useDesignSystem();
  const [activeTab, setActiveTab] = useState('colors');
  const [importText, setImportText] = useState('');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Color update handlers
  const updateColor = useCallback((colorType: 'colors' | 'brandColors', key: string, value: string) => {
    updateTheme({
      [colorType]: {
        ...theme[colorType],
        [key]: value,
      },
    });
  }, [theme, updateTheme]);

  // Typography update handlers
  const updateTypography = useCallback((key: string, value: any) => {
    updateTheme({
      typography: {
        ...theme.typography,
        [key]: value,
      },
    });
  }, [theme, updateTheme]);

  // Component size update handlers
  const updateComponentSize = useCallback((category: string, key: string, value: string) => {
    updateTheme({
      components: {
        ...theme.components,
        [category]: {
          ...theme.components[category as keyof typeof theme.components],
          [key]: value,
        },
      },
    });
  }, [theme, updateTheme]);

  // Export theme to clipboard
  const handleExportTheme = async () => {
    try {
      await navigator.clipboard.writeText(exportTheme());
      setCopiedToClipboard(true);
      toast.success('🎨 Theme exported to clipboard!');
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (error) {
      toast.error('Failed to export theme to clipboard');
      console.error('Export error:', error);
    }
  };

  // Import theme from text
  const handleImportTheme = () => {
    if (!importText.trim()) {
      toast.error('Please paste theme JSON data');
      return;
    }

    const success = importTheme(importText);
    if (success) {
      toast.success('🎨 Theme imported successfully!');
      setImportText('');
    } else {
      toast.error('Invalid theme format. Please check your JSON data.');
    }
  };

  // Preset themes
  const presetThemes = {
    default: 'Default HealthScan',
    purple: 'Purple Health',
    blue: 'Ocean Blue',
    orange: 'Vibrant Orange',
    dark: 'Dark Mode',
  };

  const applyPresetTheme = (preset: keyof typeof presetThemes) => {
    const presets: Record<string, Partial<DesignSystemTheme>> = {
      default: {
        colors: {
          primary: '#16a34a',
          accent: '#22c55e',
          background: '#ffffff',
          foreground: '#0f172a',
        } as Partial<ColorPalette>,
        brandColors: {
          healthscanGreen: '#16a34a',
          healthscanLightGreen: '#22c55e',
          healthscanDarkTurquoise: '#008B8B',
        } as Partial<HealthScanBrandColors>,
      },
      purple: {
        colors: {
          primary: '#8b5cf6',
          accent: '#a78bfa',
          background: '#ffffff',
          foreground: '#1f2937',
        } as Partial<ColorPalette>,
        brandColors: {
          healthscanGreen: '#8b5cf6',
          healthscanLightGreen: '#a78bfa',
          healthscanDarkTurquoise: '#6366f1',
        } as Partial<HealthScanBrandColors>,
      },
      blue: {
        colors: {
          primary: '#3b82f6',
          accent: '#60a5fa',
          background: '#ffffff',
          foreground: '#1f2937',
        } as Partial<ColorPalette>,
        brandColors: {
          healthscanGreen: '#3b82f6',
          healthscanLightGreen: '#60a5fa',
          healthscanDarkTurquoise: '#1d4ed8',
        } as Partial<HealthScanBrandColors>,
      },
      orange: {
        colors: {
          primary: '#f97316',
          accent: '#fb923c',
          background: '#ffffff',
          foreground: '#1f2937',
        } as Partial<ColorPalette>,
        brandColors: {
          healthscanGreen: '#f97316',
          healthscanLightGreen: '#fb923c',
          healthscanDarkTurquoise: '#ea580c',
        } as Partial<HealthScanBrandColors>,
      },
      dark: {
        colors: {
          primary: '#22c55e',
          accent: '#16a34a',
          background: '#0f172a',
          foreground: '#f8fafc',
          muted: '#1e293b',
          mutedForeground: '#94a3b8',
        } as Partial<ColorPalette>,
        brandColors: {
          healthscanGreen: '#22c55e',
          healthscanLightGreen: '#4ade80',
          healthscanDarkTurquoise: '#14b8a6',
        } as Partial<HealthScanBrandColors>,
      },
    };

    updateTheme(presets[preset]);
    toast.success(`🎨 Applied ${presetThemes[preset]} theme!`);
  };

  if (!isAdmin) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Theme Customization
          </CardTitle>
          <CardDescription>
            Admin access required to customize the design system.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Palette className="w-6 h-6 text-[var(--healthscan-green)]" />
                Design System Manager
              </CardTitle>
              <CardDescription>
                Customize colors, typography, and component styling for the entire application
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
                className="h-10"
              >
                <Eye className="w-4 h-4 mr-2" />
                {previewMode ? 'Exit Preview' : 'Preview Mode'}
              </Button>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Admin Only
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Select onValueChange={(value) => applyPresetTheme(value as keyof typeof presetThemes)}>
              <SelectTrigger>
                <SelectValue placeholder="Apply Preset" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(presetThemes).map(([key, name]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${key === 'default' ? 'bg-green-500' : key === 'purple' ? 'bg-purple-500' : key === 'blue' ? 'bg-blue-500' : key === 'orange' ? 'bg-orange-500' : 'bg-gray-800'}`}></div>
                      {name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleExportTheme} variant="outline" className="h-10">
              {copiedToClipboard ? <Check className="w-4 h-4 mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              Export Theme
            </Button>

            <Button onClick={resetTheme} variant="outline" className="h-10">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>

            <Button onClick={() => window.location.reload()} variant="outline" className="h-10">
              <Monitor className="w-4 h-4 mr-2" />
              Refresh Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Customization Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="components" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Components
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import/Export
          </TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* System Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Colors</CardTitle>
                <CardDescription>Core application color palette</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(theme.colors).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <Label className="w-32 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded border-2 border-gray-200"
                        style={{ backgroundColor: value }}
                      ></div>
                      <Input
                        type="color"
                        value={value}
                        onChange={(e) => updateColor('colors', key, e.target.value)}
                        className="w-16 h-8 p-0 border-0"
                      />
                      <Input
                        type="text"
                        value={value}
                        onChange={(e) => updateColor('colors', key, e.target.value)}
                        className="w-24 h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Brand Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">HealthScan Brand Colors</CardTitle>
                <CardDescription>Brand-specific color variables</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(theme.brandColors).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <Label className="w-32 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded border-2 border-gray-200"
                        style={{ backgroundColor: value }}
                      ></div>
                      <Input
                        type="color"
                        value={value}
                        onChange={(e) => updateColor('brandColors', key, e.target.value)}
                        className="w-16 h-8 p-0 border-0"
                      />
                      <Input
                        type="text"
                        value={value}
                        onChange={(e) => updateColor('brandColors', key, e.target.value)}
                        className="w-24 h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Color Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Color Preview</CardTitle>
              <CardDescription>See how your colors look in common UI elements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Button className="w-full btn-major bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)]">
                    Primary Button
                  </Button>
                  <Button variant="outline" className="w-full">
                    Secondary Button
                  </Button>
                  <Button variant="destructive" className="w-full">
                    Destructive Button
                  </Button>
                </div>
                <div className="space-y-2">
                  <Card className="p-4">
                    <h4 className="font-medium text-[var(--foreground)]">Card Title</h4>
                    <p className="text-sm text-[var(--muted-foreground)]">Card description text</p>
                  </Card>
                  <div className="p-3 bg-[var(--muted)] rounded-lg">
                    <p className="text-sm text-[var(--muted-foreground)]">Muted background</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Badge className="bg-[var(--healthscan-green)] text-white">Brand Badge</Badge>
                  <Badge variant="secondary">Secondary Badge</Badge>
                  <Badge variant="destructive">Error Badge</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Font Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Font Settings</CardTitle>
                <CardDescription>Configure typography fundamentals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Font Family</Label>
                  <Select 
                    value={theme.typography.fontFamily.split(',')[0]} 
                    onValueChange={(value) => updateTypography('fontFamily', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="system-ui">System UI</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Times">Times</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Base Font Size</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[parseInt(theme.typography.baseFontSize)]}
                      onValueChange={([value]) => updateTypography('baseFontSize', `${value}px`)}
                      min={12}
                      max={18}
                      step={1}
                      className="flex-1"
                    />
                    <span className="w-12 text-sm">{theme.typography.baseFontSize}</span>
                  </div>
                </div>

                {/* Font Weights */}
                <div className="space-y-2">
                  <Label>Font Weights</Label>
                  {Object.entries(theme.typography.fontWeights).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Label className="w-20 text-sm capitalize">{key}</Label>
                      <Slider
                        value={[value]}
                        onValueChange={([newValue]) => updateTypography('fontWeights', {
                          ...theme.typography.fontWeights,
                          [key]: newValue
                        })}
                        min={100}
                        max={900}
                        step={100}
                        className="flex-1"
                      />
                      <span className="w-12 text-sm">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Typography Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Typography Preview</CardTitle>
                <CardDescription>See how text will appear</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h1 style={{ fontSize: theme.typography.fontSizeScale['4xl'], fontWeight: theme.typography.fontWeights.bold }}>
                    Heading 1 - 4XL Bold
                  </h1>
                  <h2 style={{ fontSize: theme.typography.fontSizeScale['2xl'], fontWeight: theme.typography.fontWeights.semibold }}>
                    Heading 2 - 2XL Semibold
                  </h2>
                  <h3 style={{ fontSize: theme.typography.fontSizeScale.xl, fontWeight: theme.typography.fontWeights.medium }}>
                    Heading 3 - XL Medium
                  </h3>
                  <p style={{ fontSize: theme.typography.fontSizeScale.base, fontWeight: theme.typography.fontWeights.normal }}>
                    Body text - Base Normal. This is how regular paragraph text will appear throughout the application.
                  </p>
                  <p style={{ fontSize: theme.typography.fontSizeScale.sm, fontWeight: theme.typography.fontWeights.normal, color: 'var(--muted-foreground)' }}>
                    Small text - SM Normal. Used for captions and secondary information.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Button Sizes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Button Sizes</CardTitle>
                <CardDescription>Configure button heights and spacing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(theme.components.buttonHeights).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="capitalize">{key} Button Height</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={value}
                        onChange={(e) => updateComponentSize('buttonHeights', key, e.target.value)}
                        className="w-24"
                      />
                      <Button 
                        size="sm" 
                        style={{ height: value }}
                        className="flex-1"
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)} Button
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Input Sizes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Input Sizes</CardTitle>
                <CardDescription>Configure input field heights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(theme.components.inputHeights).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="capitalize">{key} Input Height</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={value}
                        onChange={(e) => updateComponentSize('inputHeights', key, e.target.value)}
                        className="w-24"
                      />
                      <Input 
                        placeholder={`${key} input`}
                        style={{ height: value }}
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Border Radius */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Border Radius</CardTitle>
                <CardDescription>Configure corner roundness</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(theme.components.borderRadius).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="capitalize">{key} Radius</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={value}
                        onChange={(e) => updateComponentSize('borderRadius', key, e.target.value)}
                        className="w-24"
                      />
                      <div 
                        className="flex-1 h-12 bg-[var(--primary)] flex items-center justify-center text-white text-sm"
                        style={{ borderRadius: value }}
                      >
                        {key.toUpperCase()} Radius
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Spacing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Spacing Scale</CardTitle>
                <CardDescription>Configure spacing variables</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(theme.components.spacing).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="capitalize">{key} Spacing</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={value}
                        onChange={(e) => updateComponentSize('spacing', key, e.target.value)}
                        className="w-24"
                      />
                      <div className="flex items-center gap-1">
                        <div 
                          className="bg-[var(--primary)] h-4"
                          style={{ width: value }}
                        ></div>
                        <span className="text-sm text-[var(--muted-foreground)]">{value}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Import/Export Tab */}
        <TabsContent value="import" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Export */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export Theme</CardTitle>
                <CardDescription>Download your current theme configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleExportTheme} className="w-full">
                  {copiedToClipboard ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  Copy Theme to Clipboard
                </Button>
                <Textarea
                  value={exportTheme()}
                  readOnly
                  className="h-32 text-xs font-mono"
                  placeholder="Theme JSON will appear here..."
                />
              </CardContent>
            </Card>

            {/* Import */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Import Theme</CardTitle>
                <CardDescription>Load a theme from JSON configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="h-32 text-xs font-mono"
                  placeholder="Paste theme JSON here..."
                />
                <Button onClick={handleImportTheme} className="w-full" disabled={!importText.trim()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Theme
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Theme Management</h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-1">
                    <li>• Export themes to save custom configurations</li>
                    <li>• Use preset themes as starting points</li>
                    <li>• Test changes in preview mode before applying</li>
                    <li>• Reset to default if something breaks</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Best Practices</h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-1">
                    <li>• Maintain sufficient color contrast for accessibility</li>
                    <li>• Keep consistent spacing scales</li>
                    <li>• Test on mobile devices after changes</li>
                    <li>• Document custom themes for team reference</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}