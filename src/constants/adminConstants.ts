import { 
  Heart, 
  AlertTriangle, 
  Leaf, 
  Database, 
  Search, 
  Utensils, 
  Bug 
} from "lucide-react";

// Target counts for each data type
export const TARGET_COUNTS = {
  nutrients: 100,
  pollutants: 100,
  ingredients: 100,
  products: 50,
  parasites: 100,
  scans: 20,
  meals: 20
} as const;

// Data type configurations with responsive design
export const DATA_TYPE_CONFIGS = [
  { 
    key: 'nutrients', 
    label: 'Nutrients', 
    icon: Heart, 
    color: 'text-green-600', 
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Essential vitamins, minerals & nutrients',
    apiSources: ['USDA FoodData Central', 'Nutritionix'],
    priority: 'high'
  },
  { 
    key: 'pollutants', 
    label: 'Pollutants', 
    icon: AlertTriangle, 
    color: 'text-red-600', 
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: 'Environmental contaminants & toxins',
    apiSources: ['EPA ECOTOX', 'OpenAQ Air Quality'],
    priority: 'high'
  },
  { 
    key: 'ingredients', 
    label: 'Ingredients', 
    icon: Leaf, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: '100 comprehensive food ingredients',
    apiSources: ['OpenFood Facts', 'Internal Curated Database'],
    priority: 'high'
  },
  { 
    key: 'products', 
    label: 'Products', 
    icon: Database, 
    color: 'text-yellow-600', 
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    description: 'Food products & brands',
    apiSources: ['OpenFood Facts', 'USDA Database'],
    priority: 'medium'
  },
  { 
    key: 'scans', 
    label: 'Scans', 
    icon: Search, 
    color: 'text-indigo-600', 
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    description: 'User scans & analysis results',
    apiSources: ['Internal System', 'User Generated'],
    priority: 'low'
  },
  { 
    key: 'meals', 
    label: 'Meals', 
    icon: Utensils, 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    description: 'Meal compositions & nutrition',
    apiSources: ['Spoonacular', 'Recipe APIs'],
    priority: 'low'
  },
  { 
    key: 'parasites', 
    label: 'Parasites', 
    icon: Bug, 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: '100 comprehensive parasites & pathogens',
    apiSources: ['CDC Database', 'WHO Health Data', 'Medical Literature'],
    priority: 'medium'
  }
] as const;

// API endpoints
export const API_ENDPOINTS = {
  HEALTH: '/health',
  DATABASE_STATS: '/admin/database-stats',
  DETAILED_STATS: '/admin/detailed-stats',
  POPULATE_DATATYPE: '/admin/populate-datatype',
  EXPORT_DATATYPE: '/admin/export-datatype',
  KV_RECORDS: '/admin/kv-records',
  KV_SAVE: '/admin/kv-save'
} as const;

// View types for admin dashboard
export type AdminView = 
  | 'overview' 
  | 'list' 
  | 'relationships' 
  | 'import' 
  | 'testing' 
  | 'seeding' 
  | 'diagnostic' 
  | 'connection-fixer' 
  | 'rdi-manager'
  | 'health';

// Data type keys
export type DataTypeKey = typeof DATA_TYPE_CONFIGS[number]['key'];

// Priority levels
export type PriorityLevel = 'high' | 'medium' | 'low';

// Server status types
export type ServerStatus = 'online' | 'offline' | 'checking';

// Configuration interfaces
export interface DataTypeConfig {
  key: string;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  apiSources: string[];
  priority: PriorityLevel;
}

export interface DataTypeStats {
  current: number;
  target: number;
  withImages: number;
  withMetadata: number;
  fromSupabase: number;
  fromAPI: number;
  lastImport: string | null;
  coverage: number;
  quality: number;
}

export interface DetailedStats {
  [key: string]: DataTypeStats;
}

// Auto-population thresholds
export const AUTO_POPULATION_THRESHOLD = 300;
export const PRIORITY_DATA_TYPES = ['nutrients', 'pollutants', 'ingredients', 'parasites'];
export const SECONDARY_DATA_TYPES = ['products'];

// Timeouts and intervals
export const TIMEOUTS = {
  HEALTH_CHECK: 5000,
  API_REQUEST: 10000,
  DETAILED_STATS: 8000,
  STATS_REFRESH_INTERVAL: 30000
} as const;

// Default fallback stats
export const DEFAULT_STATS = {
  nutrients: 0,
  pollutants: 0,
  ingredients: 0,
  products: 0,
  parasites: 0,
  scans: 0,
  meals: 0,
  waitlist: 0
} as const;