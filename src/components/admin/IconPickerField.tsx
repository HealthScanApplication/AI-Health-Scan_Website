import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { icons as lucideIcons, type LucideIcon } from 'lucide-react';
import * as FeatherIcons from 'react-feather';
import * as HeroIcons from '@heroicons/react/24/outline';
import { Icon as IconifyIcon } from '@iconify/react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Search, X, Check, Upload, Image as ImageIcon } from 'lucide-react';

// Import commonly used Phosphor icons (health/medical/sport focused)
import {
  Heart, Heartbeat, Brain, Eye, Tooth, Bone, FirstAid, Pill, Syringe,
  Thermometer, Stethoscope, Drop, Fire, Flame,
  Moon, Sun, Lightning, Shield, ShieldCheck, ShieldWarning, Warning,
  Baby, Smiley, SmileyXEyes, Hand, Footprints, Barbell, Bicycle,
  ForkKnife, Leaf, Tree, Flower, Plant, Carrot,
  Fish, Egg, Bread, Cookie, Coffee, Wine, Cigarette, CigaretteSlash,
  Bed, Bathtub, Shower, Toilet, FirstAidKit, Bandaids, Eyedropper,
  MagnifyingGlass, Question, Info, CheckCircle, XCircle, WarningCircle,
  Plus, Minus, X as PhosphorX, Check as PhosphorCheck, ArrowUp, ArrowDown,
  Calendar, Clock, Timer, Hourglass, Bell, BellRinging, BellSlash,
  User, Users, UserCircle, UserPlus, UserMinus, UserList,
  House, MapPin, Compass, Globe, CloudRain, CloudSnow, Snowflake,
  ThermometerCold, ThermometerHot,
  Virus, Biohazard, Radioactive, Skull,
  Dna, Atom, TestTube, Flask, Microscope,
  Ear, Person, PersonSimple, GenderMale, GenderFemale,
  Wheelchair, WheelchairMotion,
  // Sport icons
  Trophy, Medal, Target, Flag, FlagBanner, Pulse,
  Sneaker, SneakerMove, Watch,
  Mountains, Path, Tent, Campfire, Waves
} from '@phosphor-icons/react';

// Icon library metadata
type IconLibrary = 'lucide' | 'phosphor' | 'feather' | 'heroicons' | 'iconify' | 'custom';

interface IconEntry {
  name: string;
  library: IconLibrary;
  component: any;
}

// Pre-compute all icons from all libraries
const LUCIDE_ICONS: IconEntry[] = Object.keys(lucideIcons).map(name => ({
  name,
  library: 'lucide' as IconLibrary,
  component: lucideIcons[name as keyof typeof lucideIcons],
}));

// Manually curated Phosphor icons (health/medical/sport focused - 95+ icons)
const PHOSPHOR_ICON_MAP = {
  Heart, Heartbeat, Brain, Eye, Tooth, Bone, FirstAid, Pill, Syringe,
  Thermometer, Stethoscope, Drop, Fire, Flame,
  Moon, Sun, Lightning, Shield, ShieldCheck, ShieldWarning, Warning,
  Baby, Smiley, SmileyXEyes, Hand, Footprints, Barbell, Bicycle,
  ForkKnife, Leaf, Tree, Flower, Plant, Carrot,
  Fish, Egg, Bread, Cookie, Coffee, Wine, Cigarette, CigaretteSlash,
  Bed, Bathtub, Shower, Toilet, FirstAidKit, Bandaids, Eyedropper,
  MagnifyingGlass, Question, Info, CheckCircle, XCircle, WarningCircle,
  Plus, Minus, X: PhosphorX, Check: PhosphorCheck, ArrowUp, ArrowDown,
  Calendar, Clock, Timer, Hourglass, Bell, BellRinging, BellSlash,
  User, Users, UserCircle, UserPlus, UserMinus, UserList,
  House, MapPin, Compass, Globe, CloudRain, CloudSnow, Snowflake,
  ThermometerCold, ThermometerHot,
  Virus, Biohazard, Radioactive, Skull,
  Dna, Atom, TestTube, Flask, Microscope,
  Ear, Person, PersonSimple, GenderMale, GenderFemale,
  Wheelchair, WheelchairMotion,
  Trophy, Medal, Target, Flag, FlagBanner, Pulse,
  Sneaker, SneakerMove, Watch,
  Mountains, Path, Tent, Campfire, Waves
} as const;

const PHOSPHOR_ICONS: IconEntry[] = Object.keys(PHOSPHOR_ICON_MAP).map(name => ({
  name,
  library: 'phosphor' as IconLibrary,
  component: PHOSPHOR_ICON_MAP[name as keyof typeof PHOSPHOR_ICON_MAP],
}));

const FEATHER_ICONS: IconEntry[] = Object.keys(FeatherIcons)
  .filter(k => {
    const val = FeatherIcons[k as keyof typeof FeatherIcons];
    return typeof val === 'function' || (typeof val === 'object' && val !== null && 'render' in val);
  })
  .map(name => ({
    name,
    library: 'feather' as IconLibrary,
    component: FeatherIcons[name as keyof typeof FeatherIcons],
  }));

const HERO_ICONS: IconEntry[] = Object.keys(HeroIcons)
  .filter(k => {
    if (!k.endsWith('Icon')) return false;
    const val = HeroIcons[k as keyof typeof HeroIcons];
    return typeof val === 'function' || (typeof val === 'object' && val !== null);
  })
  .map(name => ({
    name: name.replace('Icon', ''),
    library: 'heroicons' as IconLibrary,
    component: HeroIcons[name as keyof typeof HeroIcons],
  }));

const ALL_ICONS = [
  ...LUCIDE_ICONS,
  ...PHOSPHOR_ICONS,
  ...FEATHER_ICONS,
  ...HERO_ICONS,
];
const PAGE_SIZE = 100;

// Iconify library collections for on-demand loading
const ICONIFY_COLLECTIONS = [
  { id: 'tabler', name: 'Tabler', count: '4,400+' },
  { id: 'mdi', name: 'Material Design', count: '7,000+' },
  { id: 'bi', name: 'Bootstrap', count: '2,000+' },
  { id: 'ion', name: 'Ionicons', count: '1,300+' },
  { id: 'octicon', name: 'Octicons', count: '600+' },
  { id: 'ri', name: 'Remix', count: '2,800+' },
  { id: 'carbon', name: 'Carbon', count: '2,000+' },
  { id: 'fa6-solid', name: 'Font Awesome', count: '2,000+' },
];

// Common health/medical/sport icons to show first when no search (from all libraries)
const FEATURED_ICON_NAMES = [
  // Lucide health
  'HeartPulse', 'Heart', 'Brain', 'Eye', 'Bone', 'Activity', 'Pill',
  'Stethoscope', 'Thermometer', 'Syringe', 'Apple', 'Droplets', 'Flame',
  'Moon', 'Sun', 'Zap', 'Shield', 'ShieldAlert', 'AlertTriangle', 'AlertCircle',
  'Baby', 'Smile', 'Frown', 'Hand',
  // Lucide sport/movement
  'Footprints', 'PersonStanding', 'Dumbbell', 'Bike', 'Volleyball', 'Trophy', 'Medal',
  'Goal', 'Award', 'Weight', 'BicepsFlexed', 'WavesLadder',
  // Lucide food/nature
  'UtensilsCrossed', 'Leaf', 'TreePine', 'Flower2', 'Sprout',
  'CircleDot', 'Scale', 'RotateCcw', 'Bandage', 'Scissors',
  'Battery', 'BatteryLow', 'CloudRain', 'Wind', 'Waves',
  // Phosphor
  'HeartStraight', 'Heartbeat', 'FirstAidKit', 'Pulse', 'Tooth',
  'Eyedropper', 'Eyeglasses', 'Barbell', 'Bicycle', 'PersonSimpleRun',
  'Drop', 'Fire', 'Lightning', 'ShieldCheck', 'Warning',
];

interface IconPickerFieldProps {
  value: string;
  svgPathValue?: string;
  onChange: (iconName: string) => void;
  onSvgPathChange?: (svgPath: string) => void;
  label?: string;
  allowCustomUpload?: boolean;
  onCustomIconUpload?: (file: File) => Promise<string>;
}

function parseIconValue(value: string): { library: IconLibrary; name: string } {
  if (value.includes(':')) {
    const [lib, name] = value.split(':');
    return { library: lib as IconLibrary, name };
  }
  // Default to lucide for backward compatibility
  return { library: 'lucide', name: value };
}

function formatIconValue(library: IconLibrary, name: string): string {
  return `${library}:${name}`;
}

/**
 * Renders an icon from any library by name with fallback
 */
export function LucideIconPreview({
  name,
  className = 'w-5 h-5',
}: {
  name: string;
  className?: string;
}) {
  const { library, name: iconName } = parseIconValue(name);
  
  // Custom uploaded icon (URL)
  if (library === 'custom') {
    return <img src={iconName} alt="custom icon" className={className} />;
  }
  
  // Find icon from all libraries
  const icon = ALL_ICONS.find(i => i.library === library && i.name === iconName);
  if (!icon) {
    return <span className="text-gray-400 text-xs">?</span>;
  }
  
  const IconComponent = icon.component;
  
  // Iconify icon (on-demand loading)
  if (library === 'iconify') {
    return <IconifyIcon icon={iconName} className={className} />;
  }
  
  // Phosphor needs weight prop
  if (library === 'phosphor') {
    return <IconComponent className={className} weight="regular" />;
  }
  
  // Default rendering
  return <IconComponent className={className} />;
}

export function IconPickerField({
  value,
  svgPathValue,
  onChange,
  onSvgPathChange,
  label = 'Icon',
  allowCustomUpload = true,
  onCustomIconUpload,
}: IconPickerFieldProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [libraryFilter, setLibraryFilter] = useState<IconLibrary | 'all' | 'iconify'>('all');
  const [iconifySearch, setIconifySearch] = useState('');
  const [iconifyCollection, setIconifyCollection] = useState('tabler');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCustom, setUploadingCustom] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => f.type.startsWith('image/'));
    
    if (imageFile && onCustomIconUpload) {
      setUploadingCustom(true);
      try {
        const url = await onCustomIconUpload(imageFile);
        onChange(`custom:${url}`);
        if (onSvgPathChange) onSvgPathChange(`custom:${url}`);
        setIsOpen(false);
      } catch (error) {
        console.error('Custom icon upload failed:', error);
      } finally {
        setUploadingCustom(false);
      }
    }
  }, [onChange, onSvgPathChange, onCustomIconUpload]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onCustomIconUpload) {
      setUploadingCustom(true);
      try {
        const url = await onCustomIconUpload(file);
        onChange(`custom:${url}`);
        if (onSvgPathChange) onSvgPathChange(`custom:${url}`);
        setIsOpen(false);
      } catch (error) {
        console.error('Custom icon upload failed:', error);
      } finally {
        setUploadingCustom(false);
      }
    }
  }, [onChange, onSvgPathChange, onCustomIconUpload]);

  // Filter icons based on search and library
  const filteredIcons = useMemo(() => {
    if (libraryFilter === 'iconify') return [];
    
    let icons = ALL_ICONS;
    
    // Filter by library
    if (libraryFilter !== 'all') {
      icons = icons.filter(icon => icon.library === libraryFilter);
    }
    
    // Filter by search
    if (!search.trim()) {
      // Show featured first, then rest alphabetically
      const featuredSet = new Set(FEATURED_ICON_NAMES);
      const featured = icons.filter(icon => featuredSet.has(icon.name));
      const rest = icons.filter(icon => !featuredSet.has(icon.name));
      return [...featured, ...rest];
    }
    
    const q = search.toLowerCase();
    return icons.filter(icon => icon.name.toLowerCase().includes(q));
  }, [search, libraryFilter]);

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search]);

  // Load more on scroll
  const handleScroll = useCallback(() => {
    const el = gridRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredIcons.length));
    }
  }, [filteredIcons.length]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: Event) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const selectIcon = useCallback(
    (icon: IconEntry) => {
      const fullValue = formatIconValue(icon.library, icon.name);
      onChange(fullValue);
      if (onSvgPathChange) {
        onSvgPathChange(fullValue);
      }
      setIsOpen(false);
      setSearch('');
    },
    [onChange, onSvgPathChange],
  );

  const { library: selectedLibrary, name: selectedName } = value ? parseIconValue(value) : { library: 'lucide' as IconLibrary, name: '' };
  const selectedIcon = value ? filteredIcons.find(i => i.library === selectedLibrary && i.name === selectedName) || ALL_ICONS.find(i => i.library === selectedLibrary && i.name === selectedName) : undefined;
  const SelectedIconComponent = selectedIcon?.component;

  return (
    <div ref={containerRef} className="space-y-1.5 relative">
      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</Label>

      {/* Selected icon display + trigger */}
      <div
        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white cursor-pointer hover:border-blue-300 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Preview */}
        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
          {SelectedIconComponent ? (
            selectedLibrary === 'phosphor' ? (
              <SelectedIconComponent className="w-6 h-6 text-gray-700" weight="regular" />
            ) : (
              <SelectedIconComponent className="w-6 h-6 text-gray-700" />
            )
          ) : (
            <span className="text-gray-300 text-xs">None</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {value ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">{selectedName}</span>
              <Badge className={`text-[10px] ${selectedLibrary === 'phosphor' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                {selectedLibrary === 'phosphor' ? 'Phosphor' : 'Lucide'}
              </Badge>
            </div>
          ) : (
            <span className="text-sm text-gray-400">Click to select an icon...</span>
          )}
        </div>

        {value && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onChange('');
              if (onSvgPathChange) onSvgPathChange('');
            }}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Dropdown picker */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                placeholder="Search 1,500+ icons..."
                className="pl-9 h-9 text-sm"
                autoFocus
              />
              {search && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                  onClick={() => setSearch('')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <div className="text-[10px] text-gray-400">
                {filteredIcons.length} icon{filteredIcons.length !== 1 ? 's' : ''} found
                {!search && ' · Health icons shown first'}
              </div>
              <div className="flex gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setLibraryFilter('all')}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                    libraryFilter === 'all'
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All ({ALL_ICONS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLibraryFilter('lucide')}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                    libraryFilter === 'lucide'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  Lucide ({LUCIDE_ICONS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLibraryFilter('phosphor')}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                    libraryFilter === 'phosphor'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  Phosphor ({PHOSPHOR_ICONS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLibraryFilter('feather')}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                    libraryFilter === 'feather'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  Feather ({FEATHER_ICONS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLibraryFilter('heroicons')}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                    libraryFilter === 'heroicons'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  Heroicons ({HERO_ICONS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLibraryFilter('iconify')}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                    libraryFilter === 'iconify'
                      ? 'bg-orange-600 text-white'
                      : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                  }`}
                >
                  More (20k+)
                </button>
              </div>
            </div>
          </div>

          {/* Iconify search or Icon grid */}
          {libraryFilter === 'iconify' ? (
            <div className="p-3 space-y-3">
              <div className="flex gap-2">
                <select
                  value={iconifyCollection}
                  onChange={(e) => setIconifyCollection(e.target.value)}
                  className="px-2 py-1 text-xs border border-gray-200 rounded"
                  aria-label="Select icon library"
                >
                  {ICONIFY_COLLECTIONS.map(col => (
                    <option key={col.id} value={col.id}>{col.name} ({col.count})</option>
                  ))}
                </select>
                <Input
                  value={iconifySearch}
                  onChange={(e) => setIconifySearch(e.target.value)}
                  placeholder="Search icon name..."
                  className="flex-1 h-8 text-xs"
                />
              </div>
              {iconifySearch && (
                <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                  {[...Array(20)].map((_, i) => {
                    const iconName = `${iconifyCollection}:${iconifySearch}${i > 0 ? `-${i}` : ''}`;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                        onClick={() => {
                          onChange(`iconify:${iconName}`);
                          if (onSvgPathChange) onSvgPathChange(`iconify:${iconName}`);
                          setIsOpen(false);
                        }}
                        title={iconName}
                      >
                        <IconifyIcon icon={iconName} className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-gray-500 text-center">
                Search for icons from {ICONIFY_COLLECTIONS.find(c => c.id === iconifyCollection)?.name} library
              </p>
            </div>
          ) : allowCustomUpload && libraryFilter === 'all' ? (
            <div>
              {/* Custom upload area */}
              <div
                className={`m-2 mb-0 p-3 border-2 border-dashed rounded-lg transition-colors ${
                  isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-label="Upload custom icon"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingCustom}
                  className="w-full flex flex-col items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {uploadingCustom ? (
                    <div className="text-xs">Uploading...</div>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span className="text-[10px]">Drop or click to upload custom icon</span>
                    </>
                  )}
                </button>
              </div>
              {/* Icon grid */}
              <div
                ref={gridRef}
                className="grid grid-cols-8 gap-0.5 p-2 max-h-64 overflow-y-auto"
                onScroll={handleScroll}
              >

            {filteredIcons.slice(0, visibleCount).map((icon) => {
              const IconComponent = icon.component;
              const fullValue = formatIconValue(icon.library, icon.name);
              const isSelected = fullValue === value;
              const colorClass = icon.library === 'phosphor' ? 'purple' : 'blue';
              return (
                <button
                  key={fullValue}
                  type="button"
                  className={`
                    relative flex flex-col items-center justify-center p-2 rounded-lg transition-all
                    ${isSelected
                      ? `bg-${colorClass}-100 ring-2 ring-${colorClass}-500 text-${colorClass}-700`
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    }
                  `}
                  onClick={() => selectIcon(icon)}
                  title={`${icon.name} (${icon.library})`}
                >
                  {icon.library === 'phosphor' ? (
                    <IconComponent className="w-5 h-5" weight="regular" />
                  ) : (
                    <IconComponent className="w-5 h-5" />
                  )}
                  {isSelected && (
                    <Check className={`absolute top-0.5 right-0.5 w-3 h-3 text-${colorClass}-600`} />
                  )}
                </button>
              );
            })}
              </div>
            </div>
          ) : (
            <div
              ref={gridRef}
              className="grid grid-cols-8 gap-0.5 p-2 max-h-64 overflow-y-auto"
              onScroll={handleScroll}
            >
              {filteredIcons.slice(0, visibleCount).map((icon) => {
                const IconComponent = icon.component;
                const fullValue = formatIconValue(icon.library, icon.name);
                const isSelected = fullValue === value;
                const colorClass = icon.library === 'phosphor' ? 'purple' : icon.library === 'feather' ? 'green' : icon.library === 'heroicons' ? 'indigo' : 'blue';
                return (
                  <button
                    key={fullValue}
                    type="button"
                    className={`
                      relative flex flex-col items-center justify-center p-2 rounded-lg transition-all
                      ${
                        isSelected
                          ? `bg-${colorClass}-100 ring-2 ring-${colorClass}-500 text-${colorClass}-700`
                          : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                      }
                    `}
                    onClick={() => selectIcon(icon)}
                    title={`${icon.name} (${icon.library})`}
                  >
                    {icon.library === 'phosphor' ? (
                      <IconComponent className="w-5 h-5" weight="regular" />
                    ) : (
                      <IconComponent className="w-5 h-5" />
                    )}
                    {isSelected && (
                      <Check className={`absolute top-0.5 right-0.5 w-3 h-3 text-${colorClass}-600`} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected name footer */}
          {value && SelectedIconComponent && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
              {selectedLibrary === 'iconify' ? (
                <IconifyIcon icon={selectedName} className="w-4 h-4 text-orange-600" />
              ) : selectedLibrary === 'custom' ? (
                <img src={selectedName} alt="custom" className="w-4 h-4" />
              ) : selectedLibrary === 'phosphor' ? (
                <SelectedIconComponent className="w-4 h-4 text-purple-600" weight="regular" />
              ) : (
                <SelectedIconComponent className="w-4 h-4 text-blue-600" />
              )}
              <span className="text-xs font-medium text-gray-700">Selected: {selectedName.split(':').pop()}</span>
              <Badge className={`text-[10px] ml-auto ${
                selectedLibrary === 'phosphor' ? 'bg-purple-50 text-purple-700' :
                selectedLibrary === 'feather' ? 'bg-green-50 text-green-700' :
                selectedLibrary === 'heroicons' ? 'bg-indigo-50 text-indigo-700' :
                selectedLibrary === 'iconify' ? 'bg-orange-50 text-orange-700' :
                selectedLibrary === 'custom' ? 'bg-gray-50 text-gray-700' :
                'bg-blue-50 text-blue-700'
              }`}>
                {selectedLibrary.charAt(0).toUpperCase() + selectedLibrary.slice(1)}
              </Badge>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
