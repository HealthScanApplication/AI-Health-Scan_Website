import React from 'react';
import { DATA_TYPE_CONFIGS } from '../constants/adminConstants';
import { Leaf } from 'lucide-react';

interface SimpleRecordImageProps {
  imageUrl?: string | null;
  altText?: string;
  itemName?: string;
  recordType?: 'meal' | 'product' | 'ingredient' | 'nutrient' | 'pollutant' | 'scan' | 'parasite';
  className?: string;
}

export function SimpleRecordImage({
  imageUrl,
  altText,
  itemName,
  recordType = 'product',
  className = ''
}: SimpleRecordImageProps) {
  // Temporarily using placeholder images until AI generation is implemented

  const getRecordConfig = () => {
    // Map recordType to the correct key in DATA_TYPE_CONFIGS
    const keyMapping: Record<string, string> = {
      'nutrient': 'nutrients',
      'pollutant': 'pollutants', 
      'ingredient': 'ingredients',
      'product': 'products',
      'scan': 'scans',
      'meal': 'meals',
      'parasite': 'parasites'
    };

    const configKey = keyMapping[recordType] || 'products';
    const config = DATA_TYPE_CONFIGS.find(c => c.key === configKey);
    
    return config || DATA_TYPE_CONFIGS.find(c => c.key === 'products')!;
  };

  const getPlaceholderColor = () => {
    switch (recordType) {
      // Good for body - Green
      case 'nutrient': return 'bg-green-500';
      
      // Bad for body - Red  
      case 'pollutant': return 'bg-red-500';
      case 'parasite': return 'bg-red-500';
      
      // Neutral - Use admin dashboard colors but in solid form
      case 'meal': return 'bg-orange-500';
      case 'product': return 'bg-yellow-500'; // matches admin yellow-600
      case 'ingredient': return 'bg-blue-500';
      case 'scan': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  const displayName = altText || itemName || 'Item';
  const config = getRecordConfig();
  
  // Override icon for nutrients to use Leaf instead of Heart
  const IconComponent = recordType === 'nutrient' ? Leaf : config.icon;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Temporary placeholder - will be replaced with AI-generated images */}
      <div className={`w-full h-full ${getPlaceholderColor()} flex items-center justify-center`}>
        <IconComponent className="w-6 h-6 text-white" />
      </div>
    </div>
  );
}

export default SimpleRecordImage;