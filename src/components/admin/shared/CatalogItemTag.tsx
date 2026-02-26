import React from 'react';

export interface CatalogItemTagProps {
  name: string;
  imageUrl?: string;
  fallbackColor?: 'emerald' | 'orange' | 'blue';
  onRemove?: () => void;
}

/**
 * Reusable image+text tag component used for ingredients, equipment, and step mentions
 * Displays an image or fallback letter with the item name
 */
export function CatalogItemTag({
  name,
  imageUrl,
  fallbackColor = 'emerald',
  onRemove,
}: CatalogItemTagProps) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
  };
  
  const fallbackBg: Record<string, string> = {
    emerald: 'bg-emerald-200 text-emerald-700',
    orange: 'bg-orange-200 text-orange-700',
    blue: 'bg-blue-200 text-blue-700',
  };

  return (
    <span className={`flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-xl border text-xs font-medium shadow-sm ${colors[fallbackColor]}`}>
      {imageUrl ? (
        <img src={imageUrl} alt="" className="w-6 h-6 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${fallbackBg[fallbackColor]}`}>
          {name[0]?.toUpperCase() || '?'}
        </span>
      )}
      <span className="truncate max-w-[100px]">{name}</span>
      {onRemove && (
        <button type="button" onClick={onRemove} className="text-gray-400 hover:text-red-600 ml-0.5 font-bold leading-none flex-shrink-0">&times;</button>
      )}
    </span>
  );
}
