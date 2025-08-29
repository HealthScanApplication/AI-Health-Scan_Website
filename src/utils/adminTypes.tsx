export interface AdminStats {
  users: number;
  meals: number;
  products: number;
  ingredients: number;
  nutrients: number;
  pollutants: number;
  scans: number;
  parasites: number;
  lastUpdated: string;
  databaseConnected: boolean;
  memoryMode?: boolean;
  serverMode?: string;
  error?: string;
}

export type AdminTab = 'overview' | 'database' | 'imports' | 'seeding' | 'nutrients' | 'ingredients' | 'pollutants' | 'products' | 'scans' | 'parasites' | 'meals';

export const dataTypeStats = (stats: AdminStats) => [
  { name: 'nutrients', count: stats.nutrients, color: 'emerald', icon: '🥬' },
  { name: 'ingredients', count: stats.ingredients, color: 'blue', icon: '🧪' },
  { name: 'pollutants', count: stats.pollutants, color: 'red', icon: '⚠️' },
  { name: 'products', count: stats.products, color: 'purple', icon: '📦' },
  { name: 'scans', count: stats.scans, color: 'violet', icon: '📱' },
  { name: 'parasites', count: stats.parasites, color: 'orange', icon: '🦠' },
  { name: 'meals', count: stats.meals, color: 'green', icon: '🍽️' }
];

export const dataPotentials = {
  nutrients: 5000,
  ingredients: 10000,
  pollutants: 2000,
  products: 50000,
  scans: 1000,
  parasites: 500,
  meals: 25000
};

export const tabMapping: Record<string, AdminTab> = {
  'nutrients': 'nutrients',
  'ingredients': 'ingredients', 
  'pollutants': 'pollutants',
  'products': 'products',
  'scans': 'scans',
  'parasites': 'parasites',
  'meals': 'meals'
};