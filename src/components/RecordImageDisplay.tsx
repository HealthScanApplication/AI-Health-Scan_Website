import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Image as ImageIcon, 
  Sparkles, 
  RefreshCw, 
  Edit3, 
  Save, 
  X, 
  Settings, 
  Eye,
  Copy,
  AlertTriangle,
  Camera,
  Wand2
} from 'lucide-react';
import { toast } from 'sonner';
import { generateRecordImage, validateImageUrl, type GeneratedImage } from '../utils/recordImageGeneration';

interface RecordImageDisplayProps {
  itemName: string;
  recordType: 'meal' | 'product' | 'ingredient' | 'nutrient' | 'pollutant' | 'scan';
  category?: string;
  currentImageUrl?: string | null;
  onImageUpdate: (imageUrl: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showControls?: boolean;
}

interface ImageGenerationOptions {
  style?: 'realistic' | 'professional' | 'artistic';
  lighting?: 'natural' | 'studio' | 'soft';
  background?: 'bokeh' | 'minimal' | 'contextual';
  perspective?: 'table-view' | 'hand-held' | 'overhead' | 'angled';
  customPrompt?: string;
}

export function RecordImageDisplay({
  itemName,
  recordType,
  category,
  currentImageUrl,
  onImageUpdate,
  className = '',
  size = 'md',
  showControls = true
}: RecordImageDisplayProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUrl, setEditedUrl] = useState(currentImageUrl || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [options, setOptions] = useState<ImageGenerationOptions>({
    style: 'realistic',
    lighting: 'natural',
    background: 'bokeh',
    perspective: recordType === 'meal' ? 'table-view' : 'hand-held',
    customPrompt: ''
  });
  const [lastGenerated, setLastGenerated] = useState<GeneratedImage | null>(null);

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-48 h-48'
  };

  const containerSizeClasses = {
    sm: 'min-h-[100px]',
    md: 'min-h-[140px]',
    lg: 'min-h-[200px]'
  };

  const handleGenerateImage = async (useCustomPrompt: boolean = false) => {
    if (!itemName?.trim()) {
      toast.error('Item name is required for image generation');
      return;
    }

    setIsGenerating(true);
    
    try {
      const generationOptions = useCustomPrompt ? { ...options, customPrompt: options.customPrompt } : options;
      
      console.log(`🎨 Generating ${recordType} image for "${itemName}" with options:`, generationOptions);
      
      const generatedImage = await generateRecordImage(itemName, recordType, category, generationOptions);
      
      setLastGenerated(generatedImage);
      onImageUpdate(generatedImage.url);
      
      if (generatedImage.type === 'ai-generated') {
        toast.success(`AI image generated successfully for ${itemName}!`);
      } else {
        toast.info(`Placeholder image created for ${itemName}`);
      }
      
    } catch (error: any) {
      console.error('Image generation failed:', error);
      toast.error('Image generation failed', {
        description: error.message || 'Please try again'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveUrl = () => {
    if (editedUrl && validateImageUrl(editedUrl)) {
      onImageUpdate(editedUrl);
      setIsEditing(false);
      toast.success('Image URL updated successfully');
    } else if (editedUrl) {
      toast.error('Please enter a valid image URL');
    } else {
      onImageUpdate('');
      setIsEditing(false);
      toast.success('Image URL cleared');
    }
  };

  const handleCancelEdit = () => {
    setEditedUrl(currentImageUrl || '');
    setIsEditing(false);
  };

  const handleCopyUrl = () => {
    if (currentImageUrl) {
      navigator.clipboard.writeText(currentImageUrl);
      toast.success('Image URL copied to clipboard');
    }
  };

  const getRecordTypePromptHint = () => {
    switch (recordType) {
      case 'meal':
        return 'Meals are shown beautifully plated on a table with professional food photography styling';
      case 'product':
        return 'Products are shown being held in hand during a shopping experience';
      case 'ingredient':
        return 'Ingredients are displayed as fresh, premium quality items with artisanal presentation';
      case 'nutrient':
        return 'Nutrients are visualized through fresh healthy foods that contain them';
      case 'pollutant':
        return 'Pollutants are shown as warning visualizations with safety awareness context';
      case 'scan':
        return 'Scans show the HealthScan app interface in action scanning items';
      default:
        return 'Professional product photography with blurred bokeh background';
    }
  };

  const displayImage = currentImageUrl;
  const hasValidUrl = displayImage && validateImageUrl(displayImage);

  return (
    <Card className={`${className} ${containerSizeClasses[size]}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Camera className="w-4 h-4 text-healthscan-green" />
            <span>Image</span>
            {recordType && (
              <Badge variant="outline" className="text-xs">
                {recordType}
              </Badge>
            )}
          </div>
          {showControls && (
            <div className="flex items-center space-x-1">
              {hasValidUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyUrl}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="h-6 w-6 p-0"
              >
                <Edit3 className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="h-6 w-6 p-0"
              >
                <Settings className="w-3 h-3" />
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Image Display */}
        <div className={`relative ${sizeClasses[size]} mx-auto bg-gray-50 border border-gray-200 rounded-lg overflow-hidden group`}>
          {hasValidUrl ? (
            <>
              <img
                src={displayImage}
                alt={`${itemName} ${recordType}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Image failed to load:', displayImage);
                  (e.target as HTMLImageElement).src = `https://via.placeholder.com/${size === 'lg' ? '192x192' : size === 'md' ? '128x128' : '96x96'}/6b7280/ffffff?text=Error`;
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button variant="secondary" size="sm" className="text-xs h-6">
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <ImageIcon className="w-6 h-6 mb-1" />
              <span className="text-xs text-center">No Image</span>
            </div>
          )}

          {/* Generation status overlay */}
          {isGenerating && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-healthscan-green mx-auto mb-1" />
                <div className="text-xs text-gray-600">Generating...</div>
              </div>
            </div>
          )}

          {/* AI badge */}
          {lastGenerated && currentImageUrl === lastGenerated.url && (
            <div className="absolute top-1 right-1">
              <Badge variant="outline" className="bg-white/90 text-xs px-1">
                AI
              </Badge>
            </div>
          )}
        </div>

        {/* URL Editing */}
        {isEditing && (
          <div className="space-y-2">
            <Label htmlFor="image-url" className="text-xs">Image URL</Label>
            <Input
              id="image-url"
              value={editedUrl}
              onChange={(e) => setEditedUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="text-xs"
            />
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleSaveUrl} className="flex-1 h-7 text-xs">
                <Save className="w-3 h-3 mr-1" />
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancelEdit} className="h-7 text-xs">
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Advanced Options */}
        {showAdvanced && showControls && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Style</Label>
                <Select value={options.style} onValueChange={(value: any) => setOptions({...options, style: value})}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realistic">Realistic</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="artistic">Artistic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Background</Label>
                <Select value={options.background} onValueChange={(value: any) => setOptions({...options, background: value})}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bokeh">Blurred Bokeh</SelectItem>
                    <SelectItem value="minimal">Minimal Clean</SelectItem>
                    <SelectItem value="contextual">Natural Context</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Lighting</Label>
                <Select value={options.lighting} onValueChange={(value: any) => setOptions({...options, lighting: value})}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="natural">Natural Light</SelectItem>
                    <SelectItem value="studio">Studio Light</SelectItem>
                    <SelectItem value="soft">Soft Diffused</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Perspective</Label>
                <Select value={options.perspective} onValueChange={(value: any) => setOptions({...options, perspective: value})}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="table-view">Table View</SelectItem>
                    <SelectItem value="hand-held">Hand Held</SelectItem>
                    <SelectItem value="overhead">Overhead</SelectItem>
                    <SelectItem value="angled">Angled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Custom Prompt (Optional)</Label>
              <Textarea
                value={options.customPrompt}
                onChange={(e) => setOptions({...options, customPrompt: e.target.value})}
                placeholder="Enter custom image generation prompt..."
                className="text-xs h-16 resize-none"
              />
              <p className="text-xs text-gray-500">
                {getRecordTypePromptHint()}
              </p>
            </div>
          </div>
        )}

        {/* Generation Buttons */}
        {showControls && (
          <div className="flex space-x-2">
            <Button
              onClick={() => handleGenerateImage(false)}
              disabled={isGenerating || !itemName?.trim()}
              className="flex-1 bg-healthscan-green hover:bg-healthscan-light-green h-8 text-xs"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 mr-1" />
                  {hasValidUrl ? 'Regenerate' : 'Generate'} AI
                </>
              )}
            </Button>

            {options.customPrompt?.trim() && (
              <Button
                onClick={() => handleGenerateImage(true)}
                disabled={isGenerating}
                variant="outline"
                className="h-8 text-xs px-3"
              >
                <Wand2 className="w-3 h-3 mr-1" />
                Custom
              </Button>
            )}
          </div>
        )}

        {/* Generation Info */}
        {lastGenerated && currentImageUrl === lastGenerated.url && (
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                {lastGenerated.type === 'ai-generated' ? 'AI Generated' : 'Placeholder'}
              </Badge>
              <span>{new Date(lastGenerated.timestamp).toLocaleTimeString()}</span>
            </div>
            {lastGenerated.prompt && size !== 'sm' && (
              <p className="text-gray-600 italic line-clamp-2">{lastGenerated.prompt}</p>
            )}
          </div>
        )}

        {/* Warning for missing OpenAI key */}
        {!isGenerating && showControls && (
          <div className="text-xs text-amber-600 flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3" />
            <span>AI generation requires OpenAI API key in server</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecordImageDisplay;