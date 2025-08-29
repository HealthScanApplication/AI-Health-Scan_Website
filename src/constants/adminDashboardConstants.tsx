import { Heart, Leaf, Package, Zap, Scan, Utensils, Bug, Database, Users, ExternalLink, Share2, Mail, Globe, Upload, Palette, Settings, Cloud } from 'lucide-react'

export const dataTypeCards = [
  {
    id: 'nutrients',
    title: 'Nutrients',
    icon: Heart,
    description: 'Vitamins, minerals, and nutritional compounds',
    tab: 'nutrients',
    target: 100
  },
  {
    id: 'ingredients',
    title: 'Ingredients',
    icon: Leaf,
    description: 'Food ingredients and nutritional components',
    tab: 'ingredients',
    target: 100
  },
  {
    id: 'products',
    title: 'Products',
    icon: Package,
    description: 'Commercial food products and brands',
    tab: 'products',
    target: 100
  },
  {
    id: 'pollutants',
    title: 'Pollutants',
    icon: Zap,
    description: 'Environmental toxins and contaminants',
    tab: 'pollutants',
    target: 100
  },
  {
    id: 'scans',
    title: 'Scans',
    icon: Scan,
    description: 'User health scans and assessments',
    tab: 'scans',
    target: 100
  },
  {
    id: 'meals',
    title: 'Meals',
    icon: Utensils,
    description: 'Meal plans and nutritional combinations',
    tab: 'meals',
    target: 100
  },
  {
    id: 'parasites',
    title: 'Parasites',
    icon: Bug,
    description: 'Parasites and harmful organisms',
    tab: 'parasites',
    target: 100
  }
]

export const tabConfig = [
  { value: 'overview', label: 'Overview', icon: Database },
  { value: 'healthscan-api', label: 'HealthScan API', icon: ExternalLink },
  { value: 'users', label: 'Users', icon: Users },
  { value: 'api-migration', label: 'API Migration', icon: Cloud },
  { value: 'email-service', label: 'Email Service', icon: Mail },
  { value: 'referral-test', label: 'Referral Test', icon: Share2 },
  { value: 'convertkit', label: 'ConvertKit', icon: Mail },
  { value: 'zapier', label: 'Zapier', icon: Zap },
  { value: 'nutrients', label: 'Nutrients', icon: Heart },
  { value: 'ingredients', label: 'Ingredients', icon: Leaf },
  { value: 'products', label: 'Products', icon: Package },
  { value: 'pollutants', label: 'Pollutants', icon: Zap },
  { value: 'scans', label: 'Scans', icon: Scan },
  { value: 'meals', label: 'Meals', icon: Utensils },
  { value: 'parasites', label: 'Parasites', icon: Bug },
  { value: 'rdi', label: 'RDI', icon: Globe },
  { value: 'import', label: 'Import', icon: Upload },
  { value: 'theme', label: 'Theme', icon: Palette },
  { value: 'system', label: 'System', icon: Settings }
]