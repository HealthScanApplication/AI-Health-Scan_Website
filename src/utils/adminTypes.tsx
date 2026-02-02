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
  { name: 'nutrients', label: 'Nutrients (Beneficial)', table: 'catalog_elements', category: 'beneficial', count: stats.nutrients, color: 'emerald', icon: '🥬' },
  { name: 'ingredients', label: 'Ingredients', table: 'catalog_ingredients', category: 'raw,processed,meals', count: stats.ingredients, color: 'blue', icon: '🧪' },
  { name: 'pollutants', label: 'Pollutants (Hazardous)', table: 'catalog_elements', category: 'hazardous', count: stats.pollutants, color: 'red', icon: '⚠️' },
  { name: 'products', label: 'Recipes/Meals', table: 'catalog_recipes', category: 'meal,beverage,condiment', count: stats.products, color: 'purple', icon: '📦' },
  { name: 'scans', label: 'Scans', table: 'scans', category: null, count: stats.scans, color: 'violet', icon: '📱' },
  { name: 'parasites', label: 'Parasites (Hazardous)', table: 'catalog_elements', category: 'hazardous', count: stats.parasites, color: 'orange', icon: '🦠' },
  { name: 'meals', label: 'Meals', table: 'catalog_recipes', category: 'meal', count: stats.meals, color: 'green', icon: '🍽️' }
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