import { projectId, publicAnonKey } from './supabase/info';
import { toast } from 'sonner';

export interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: string;
  type: 'ai-generated' | 'uploaded' | 'url';
}

export interface ImageGenerationOptions {
  style?: 'realistic' | 'professional' | 'artistic';
  lighting?: 'natural' | 'studio' | 'soft';
  background?: 'bokeh' | 'minimal' | 'contextual';
  perspective?: 'table-view' | 'hand-held' | 'overhead' | 'angled';
  customPrompt?: string;
}

// Generate context-aware prompts for different record types
export const generatePrompt = (
  itemName: string,
  recordType: 'meal' | 'product' | 'ingredient' | 'nutrient' | 'pollutant' | 'scan',
  category?: string,
  options: ImageGenerationOptions = {}
): string => {
  const { style = 'realistic', lighting = 'natural', background = 'bokeh', perspective } = options;

  // Custom prompt override
  if (options.customPrompt) {
    return options.customPrompt;
  }

  // Base quality descriptors
  const qualityTerms = [
    'hyper realistic', 
    'professional photography', 
    '4K resolution',
    'sharp focus',
    'perfect lighting',
    'commercial quality'
  ].join(', ');

  // Background descriptors
  const backgroundTerms = {
    bokeh: 'beautiful blurred bokeh background, creamy depth of field, out of focus background',
    minimal: 'clean minimal background, neutral colors, studio lighting',
    contextual: 'natural environment background, lifestyle setting'
  };

  // Lighting descriptors  
  const lightingTerms = {
    natural: 'natural lighting, soft daylight, warm tones',
    studio: 'professional studio lighting, even illumination, crisp shadows',
    soft: 'soft diffused lighting, gentle shadows, warm ambiance'
  };

  const basePrompt = `${qualityTerms}, ${lightingTerms[lighting]}, ${backgroundTerms[background]}`;

  switch (recordType) {
    case 'meal':
      const mealPerspective = perspective || 'table-view';
      if (mealPerspective === 'table-view') {
        return `A delicious ${itemName} meal beautifully plated and sitting on an elegant dining table, ${basePrompt}, overhead angled view, appetizing presentation, restaurant quality plating, vibrant fresh colors, centered composition`;
      }
      return `A ${itemName} meal beautifully presented, ${basePrompt}, appetizing and fresh, professional food photography, vibrant colors`;

    case 'product':
      const productPerspective = perspective || 'hand-held';
      if (productPerspective === 'hand-held') {
        return `A person's hand holding a ${itemName} product package in a shopping context, ${basePrompt}, the hand is taking a photo with the product clearly visible, grocery store or kitchen environment, product label clearly readable, lifestyle photography`;
      }
      return `A ${itemName} product package, ${basePrompt}, clean product photography, package clearly visible and readable, commercial photography style`;

    case 'ingredient':
      return `Fresh ${itemName} ingredient displayed beautifully, ${basePrompt}, food styling, vibrant natural colors, premium quality, artisanal presentation, ingredient showcase photography`;

    case 'nutrient':
      return `Visual representation of ${itemName} nutrient in fresh healthy foods, ${basePrompt}, health and wellness concept, fresh fruits and vegetables rich in ${itemName}, scientific yet appealing, health-focused photography`;

    case 'pollutant':
      return `Warning visualization about ${itemName} contamination, ${basePrompt}, safety awareness concept, smartphone displaying HealthScan app with warning indicators, food safety illustration, cautionary but not alarming, health app interface`;

    case 'scan':
      return `HealthScan mobile app interface scanning a ${itemName}, ${basePrompt}, smartphone screen showing the scanning process, modern app design, user interface, technology in action, mobile app photography`;

    default:
      return `Beautiful ${itemName}, ${basePrompt}, centered composition, professional photography`;
  }
};

// Generate image using OpenAI API through server
export const generateRecordImage = async (
  itemName: string,
  recordType: 'meal' | 'product' | 'ingredient' | 'nutrient' | 'pollutant' | 'scan',
  category?: string,
  options: ImageGenerationOptions = {}
): Promise<GeneratedImage> => {
  try {
    if (!itemName?.trim()) {
      throw new Error('Item name is required for image generation');
    }

    const prompt = generatePrompt(itemName, recordType, category, options);
    console.log(`🎨 Generating ${recordType} image for "${itemName}" with prompt:`, prompt);

    // Call server endpoint for image generation
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/generate-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        itemName,
        recordType,
        category,
        options
      })
    });

    console.log(`🔍 Image generation response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Image generation HTTP error: ${response.status} ${response.statusText}`, errorText);
      
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Ignore JSON parse errors
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('🔍 Image generation response data:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Image generation failed');
    }

    const generatedImage: GeneratedImage = {
      url: result.imageUrl,
      prompt: prompt,
      timestamp: new Date().toISOString(),
      type: result.isPlaceholder ? 'uploaded' : 'ai-generated'
    };

    if (result.isPlaceholder) {
      console.log('⚠️ Using placeholder image due to OpenAI API issues:', result.error);
      toast.warning('Using placeholder image', {
        description: result.error || 'OpenAI API not available'
      });
    } else {
      console.log('✅ AI image generated successfully:', generatedImage);
      toast.success('AI image generated successfully!');
    }

    return generatedImage;

  } catch (error: any) {
    console.error('❌ Image generation error:', error);
    
    // Provide more specific error messages
    const errorMessage = error.message || 'Failed to generate image';
    if (errorMessage.includes('401') || errorMessage.includes('invalid') || errorMessage.includes('expired')) {
      toast.error('OpenAI API key error', {
        description: 'The OpenAI API key is invalid, expired, or not configured properly'
      });
    } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      toast.error('Rate limit exceeded', {
        description: 'OpenAI API rate limit reached. Please try again later.'
      });
    } else if (errorMessage.includes('402') || errorMessage.includes('billing')) {
      toast.error('Billing issue', {
        description: 'OpenAI API billing issue - insufficient credits or payment required'
      });
    } else {
      toast.error('Failed to generate AI image', {
        description: errorMessage
      });
    }
    
    // Return fallback reliable Unsplash image
    const fallbackUrl = generateReliableUnsplashImage(itemName, recordType);
    
    return {
      url: fallbackUrl,
      prompt: `Reliable Unsplash image for ${itemName} (${recordType})`,
      timestamp: new Date().toISOString(),
      type: 'uploaded'
    };
  }
};

// Generate ultra-reliable Unsplash images using only verified working URLs  
export const generateReliableUnsplashImage = (
  itemName: string,
  recordType: 'meal' | 'product' | 'ingredient' | 'nutrient' | 'pollutant' | 'scan'
): string => {
  // Use only the most reliable, minimal set of Unsplash URLs
  // These are manually verified to work correctly
  const ultraReliableUrl = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400';
  
  // For maximum reliability, use the same proven working image for all types
  // This ensures consistent loading while we troubleshoot any remaining image issues
  console.log(`Using ultra-reliable image for ${recordType}: ${itemName}`);
  
  return ultraReliableUrl;
};

// DEPRECATED: Use generateReliableUnsplashImage instead
export const generatePlaceholderImage = (
  itemName: string,
  recordType: 'meal' | 'product' | 'ingredient' | 'nutrient' | 'pollutant' | 'scan'
): string => {
  console.warn('⚠️ generatePlaceholderImage is deprecated. Using reliable Unsplash image instead.');
  return generateReliableUnsplashImage(itemName, recordType);
};

// Validate image URL
export const validateImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    new URL(url);
    return /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(url);
  } catch {
    return false;
  }
};

// Get image metadata for display
export const getImageMetadata = (image: GeneratedImage): {
  generatedAt: string;
  prompt: string;
  type: string;
} => {
  return {
    generatedAt: new Date(image.timestamp).toLocaleString(),
    prompt: image.prompt,
    type: image.type
  };
};

// Format image URL for consistent display
export const formatImageUrl = (url: string | null): string | null => {
  if (!url) return null;
  
  // Handle relative URLs
  if (url.startsWith('/')) {
    return url;
  }
  
  // Validate and return absolute URLs
  if (validateImageUrl(url)) {
    return url;
  }
  
  return null;
};

// Image generation utility class
export class RecordImageGenerator {
  private static apiKeyChecked = false;
  private static hasApiKey = false;

  static async checkApiKey(): Promise<boolean> {
    if (this.apiKeyChecked) {
      return this.hasApiKey;
    }

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/check-openai-key`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const result = await response.json();
      this.hasApiKey = result.hasKey && result.apiValid || false;
      this.apiKeyChecked = true;
      
      console.log('🔑 OpenAI API key status:', {
        hasKey: result.hasKey,
        keyStatus: result.keyStatus,
        apiValid: result.apiValid,
        message: result.message
      });
      
      return this.hasApiKey;
    } catch (error) {
      console.error('Error checking API key:', error);
      this.hasApiKey = false;
      this.apiKeyChecked = true;
      return false;
    }
  }

  static async generateImage(
    itemName: string,
    recordType: 'meal' | 'product' | 'ingredient' | 'nutrient' | 'pollutant' | 'scan',
    category?: string,
    options: ImageGenerationOptions = {}
  ): Promise<GeneratedImage> {
    const hasKey = await this.checkApiKey();
    
    if (!hasKey) {
      console.warn('⚠️ OpenAI API key not configured or invalid, using reliable Unsplash image');
      toast.warning('OpenAI API key not configured - using reliable Unsplash image');
    }

    return generateRecordImage(itemName, recordType, category, options);
  }

  static async testApiConnection(): Promise<{success: boolean, message: string, details?: any}> {
    try {
      console.log('🧪 Testing OpenAI API connection...');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/test-openai`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ OpenAI API test successful:', result);
        return {
          success: true,
          message: 'OpenAI API is working correctly',
          details: {
            testImageUrl: result.testImageUrl,
            keyFound: result.keyFound,
            keyFormat: result.keyFormat
          }
        };
      } else {
        console.error('❌ OpenAI API test failed:', result);
        return {
          success: false,
          message: result.error || 'OpenAI API test failed',
          details: {
            keyFound: result.keyFound,
            keyFormat: result.keyFormat
          }
        };
      }
    } catch (error) {
      console.error('❌ Error testing OpenAI API:', error);
      return {
        success: false,
        message: `Failed to test OpenAI API: ${error.message}`,
        details: { error: error.message }
      };
    }
  }
}

// Export default instance
export default RecordImageGenerator;