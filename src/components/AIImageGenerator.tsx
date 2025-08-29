import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { ImageIcon, Wand2, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface AIImageGeneratorProps {
  recordType: string;
  itemName: string;
  category?: string;
  onImageGenerated: (imageUrl: string) => void;
}

export function AIImageGenerator({ recordType, itemName, category, onImageGenerated }: AIImageGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  const generateParasitePrompt = () => {
    const parasiteName = itemName.toLowerCase();
    
    // Create scientific microscopy prompts based on parasite type
    if (parasiteName.includes('giardia')) {
      return "High-quality scientific microscopy image of Giardia lamblia parasite, showing characteristic pear-shaped trophozoite with two nuclei and flagella, medical textbook style, clean white background, educational diagram quality";
    }
    
    if (parasiteName.includes('cryptosporidium') || parasiteName.includes('crypto')) {
      return "Scientific microscopy image of Cryptosporidium oocysts, small spherical parasites with distinct internal structure, medical laboratory photography, clean white background, educational quality";
    }
    
    if (parasiteName.includes('entamoeba') || parasiteName.includes('amoeba')) {
      return "Scientific microscopy image of Entamoeba histolytica trophozoite, showing characteristic amoeboid shape with visible nucleus, medical textbook style, clean white background, parasitology education quality";
    }
    
    if (parasiteName.includes('toxoplasma')) {
      return "Scientific microscopy image of Toxoplasma gondii parasites, crescent-shaped tachyzoites in tissue, medical research photography, clean white background, parasitology textbook quality";
    }
    
    if (parasiteName.includes('roundworm') || parasiteName.includes('ascaris')) {
      return "Scientific photograph of Ascaris lumbricoides roundworm, large nematode parasite showing characteristic body segmentation, medical specimen photography, clean white background, parasitology education";
    }
    
    if (parasiteName.includes('hookworm') || parasiteName.includes('ancylostoma')) {
      return "Scientific microscopy image of hookworm (Ancylostoma) larva or adult, showing characteristic hook-like mouth parts, medical textbook photography, clean white background, parasitology education";
    }
    
    if (parasiteName.includes('whipworm') || parasiteName.includes('trichuris')) {
      return "Scientific photograph of Trichuris trichiura whipworm, showing characteristic whip-like anterior end, medical specimen photography, clean white background, parasitology textbook style";
    }
    
    if (parasiteName.includes('pinworm') || parasiteName.includes('enterobius')) {
      return "Scientific microscopy image of Enterobius vermicularis pinworm, small white nematode with pointed tail, medical laboratory photography, clean white background, educational quality";
    }
    
    if (parasiteName.includes('tapeworm') || parasiteName.includes('taenia') || parasiteName.includes('cestode')) {
      return "Scientific photograph of tapeworm segments (proglottids), showing characteristic segmented structure, medical specimen photography, clean white background, parasitology textbook quality";
    }
    
    if (parasiteName.includes('fluke') || parasiteName.includes('trematode') || parasiteName.includes('fasciola') || parasiteName.includes('clonorchis')) {
      return "Scientific microscopy image of liver fluke (trematode), showing characteristic leaf-shaped body structure, medical textbook photography, clean white background, parasitology education";
    }
    
    if (parasiteName.includes('scabies') || parasiteName.includes('sarcoptes')) {
      return "Scientific microscopy image of Sarcoptes scabiei mite, showing characteristic oval body with legs and mouthparts, dermatology textbook photography, clean white background, medical education quality";
    }
    
    if (parasiteName.includes('lice') || parasiteName.includes('pediculus')) {
      return "Scientific photograph of human head louse (Pediculus), showing characteristic insect body with six legs and claws, medical entomology photography, clean white background, educational quality";
    }
    
    if (parasiteName.includes('anisakis') || parasiteName.includes('herring worm')) {
      return "Scientific photograph of Anisakis marine nematode larva, coiled parasitic worm from fish, food safety laboratory photography, clean white background, parasitology education";
    }
    
    if (parasiteName.includes('trichinella')) {
      return "Scientific microscopy image of Trichinella spiralis larvae encysted in muscle tissue, showing characteristic spiral coiling, medical pathology photography, clean white background, parasitology textbook";
    }
    
    // Category-based prompts for parasites not specifically handled
    if (category) {
      switch (category.toLowerCase()) {
        case 'protozoa':
          return `Scientific microscopy image of ${itemName} protozoan parasite, single-celled organism with visible internal structures, medical laboratory photography, clean white background, parasitology education quality`;
        
        case 'nematode':
          return `Scientific photograph of ${itemName} nematode parasite, roundworm showing characteristic cylindrical body, medical specimen photography, clean white background, parasitology textbook style`;
        
        case 'cestode':
          return `Scientific photograph of ${itemName} cestode parasite, tapeworm showing segmented body structure, medical specimen photography, clean white background, parasitology education`;
        
        case 'trematode':
          return `Scientific microscopy image of ${itemName} trematode parasite, fluke showing characteristic leaf-shaped body, medical textbook photography, clean white background, parasitology quality`;
        
        case 'arthropod':
          return `Scientific photograph of ${itemName} arthropod parasite, showing jointed legs and segmented body, medical entomology photography, clean white background, educational quality`;
        
        default:
          return `Scientific microscopy image of ${itemName} parasite, medical specimen photography showing detailed morphology, clean white background, parasitology textbook quality`;
      }
    }
    
    // Generic parasite prompt
    return `Scientific microscopy image of ${itemName} parasite, detailed medical specimen photography showing characteristic morphological features, clean white background, parasitology textbook quality, educational diagram style`;
  };

  const generateContextPrompt = () => {
    const baseContext = "Professional, high-quality photograph with a clean white background";
    
    switch (recordType) {
      case 'nutrient':
        return `${baseContext}, showing fresh ${itemName} foods being held above a shopping cart in a grocery store, vibrant colors, healthy lifestyle photography`;
      
      case 'ingredient':
        return `${baseContext}, showing premium ${itemName} package being held above a shopping basket in grocery shopping context, product photography style`;
      
      case 'pollutant':
        return `${baseContext}, showing a smartphone displaying HealthScan app interface scanning a product for ${itemName} contamination warning, modern mobile app UI`;
      
      case 'product':
        return `${baseContext}, showing ${itemName} product package being held above a shopping basket, realistic product photography`;
      
      case 'scan':
        return `${baseContext}, showing HealthScan mobile app interface scanning ${itemName}, clean modern app design with green accents`;
      
      case 'parasite':
        return generateParasitePrompt();
      
      case 'meal':
        return `${baseContext}, showing beautifully plated ${itemName} meal on a restaurant table, food photography style`;
      
      default:
        return `${baseContext}, ${itemName} in professional photography style`;
    }
  };

  const handleGenerate = async () => {
    if (!itemName?.trim()) {
      toast.error('Item name is required for image generation');
      return;
    }

    setIsGenerating(true);
    
    try {
      const prompt = customPrompt.trim() || generateContextPrompt();
      
      console.log(`🎨 Generating AI image for ${recordType}: ${itemName}`);
      console.log(`🎨 Using prompt: ${prompt}`);

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          prompt,
          itemName,
          recordType,
          category,
          options: {
            style: recordType === 'parasite' ? 'scientific' : 'professional',
            quality: 'high'
          }
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

      const data = await response.json();
      console.log('🔍 Image generation response data:', data);
      
      if (data.success && data.imageUrl) {
        console.log('✅ AI image generated successfully:', data.imageUrl);
        onImageGenerated(data.imageUrl);
        
        if (data.isPlaceholder) {
          toast.warning('Using placeholder image - OpenAI API key not configured', {
            description: data.error || 'AI image generation unavailable'
          });
        } else {
          toast.success(`${recordType === 'parasite' ? 'Scientific parasite' : 'AI'} image generated successfully!`);
        }
      } else {
        throw new Error(data.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('❌ Error generating AI image:', error);
      
      // Provide more specific error messages
      const errorMessage = error.message || 'Failed to generate AI image';
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
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center space-x-2">
          <ImageIcon className="w-4 h-4" />
          <h4 className="font-medium">
            {recordType === 'parasite' ? 'Scientific Parasite Image Generation' : 'AI Image Generation'}
          </h4>
        </div>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="custom-prompt">Custom Prompt (optional)</Label>
            <Textarea
              id="custom-prompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={recordType === 'parasite' 
                ? "Leave empty to use scientific microscopy prompt..." 
                : `Leave empty to use default prompt for ${recordType}s...`}
              rows={3}
              className="text-sm"
            />
          </div>
          
          <div className="text-xs text-gray-500">
            <strong>Default prompt:</strong> {generateContextPrompt()}
          </div>
          
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || !itemName?.trim()}
            className="w-full"
            size="sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating{recordType === 'parasite' ? ' Scientific Image' : ''}...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate {recordType === 'parasite' ? 'Scientific ' : 'AI '}Image
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}