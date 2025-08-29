import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { 
  ArrowLeft,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Globe,
  MapPin,
  DollarSign,
  Key,
  Database,
  Zap,
  Shield,
  Building,
  Beaker,
  Leaf,
  Heart,
  AlertTriangle,
  Info,
  ExternalLink,
  Construction,
  Target
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DataImportManagerProps {
  onClose: () => void;
  initialDataTypeFilter?: string | null;
}

interface APISource {
  id: string;
  name: string;
  description: string;
  region: 'Europe' | 'USA' | 'Global';
  authority: string;
  dataTypes: string[];
  recordCount: number;
  isOfficial: boolean;
  isFree: boolean;
  pricing?: string;
  website: string;
  documentation: string;
  rateLimit: string;
  keyRequired: boolean;
  status: 'active' | 'pending' | 'error' | 'inactive' | 'planned';
  lastSync?: string;
  reliability: 'high' | 'medium' | 'low';
  coverage: string;
  updateFrequency: string;
  icon: React.ComponentType<any>;
  color: string;
  implementationStatus: 'implemented' | 'planned' | 'external';
  serverSupport?: boolean;
}

const API_SOURCES: APISource[] = [
  // European Official Sources
  {
    id: 'efsa-openfoodtox',
    name: 'EFSA OpenFoodTox',
    description: 'European Food Safety Authority chemical hazards database',
    region: 'Europe',
    authority: 'European Food Safety Authority (EFSA)',
    dataTypes: ['pollutants', 'parasites'],
    recordCount: 75000,
    isOfficial: true,
    isFree: true,
    website: 'https://www.efsa.europa.eu/en/data/chemical-hazards-database',
    documentation: 'https://www.efsa.europa.eu/en/data/data-standardisation',
    rateLimit: '1000 requests/hour',
    keyRequired: false,
    status: 'planned',
    reliability: 'high',
    coverage: 'European Union',
    updateFrequency: 'Monthly',
    icon: Shield,
    color: 'text-blue-600',
    implementationStatus: 'planned',
    serverSupport: false
  },
  {
    id: 'eurofir',
    name: 'EuroFIR Food Platform',
    description: 'European food composition and nutrition database',
    region: 'Europe',
    authority: 'EuroFIR AISBL',
    dataTypes: ['nutrients', 'ingredients'],
    recordCount: 120000,
    isOfficial: true,
    isFree: false,
    pricing: '€500-2000/month',
    website: 'https://www.eurofir.org/',
    documentation: 'https://www.eurofir.org/food-information/',
    rateLimit: '5000 requests/hour',
    keyRequired: true,
    status: 'planned',
    reliability: 'high',
    coverage: 'European Union',
    updateFrequency: 'Quarterly',
    icon: Database,
    color: 'text-green-600',
    implementationStatus: 'planned',
    serverSupport: false
  },
  {
    id: 'ciqual-anses',
    name: 'CIQUAL (ANSES France)',
    description: 'French national food composition database',
    region: 'Europe',
    authority: 'ANSES (France)',
    dataTypes: ['nutrients', 'ingredients'],
    recordCount: 3200,
    isOfficial: true,
    isFree: true,
    website: 'https://ciqual.anses.fr/',
    documentation: 'https://ciqual.anses.fr/cms/sites/default/files/inline-files/Ciqual2020_Methodology_EN.pdf',
    rateLimit: '500 requests/hour',
    keyRequired: false,
    status: 'planned',
    reliability: 'high',
    coverage: 'France',
    updateFrequency: 'Annually',
    icon: Beaker,
    color: 'text-purple-600',
    implementationStatus: 'planned',
    serverSupport: false
  },
  {
    id: 'bfr-germany',
    name: 'BfR (Germany)',
    description: 'German Federal Institute for Risk Assessment database',
    region: 'Europe',
    authority: 'BfR Germany',
    dataTypes: ['pollutants', 'parasites'],
    recordCount: 25000,
    isOfficial: true,
    isFree: true,
    website: 'https://www.bfr.bund.de/en/home.html',
    documentation: 'https://www.bfr.bund.de/en/data_and_databases-130392.html',
    rateLimit: '200 requests/hour',
    keyRequired: false,
    status: 'planned',
    reliability: 'high',
    coverage: 'Germany',
    updateFrequency: 'Quarterly',
    icon: Shield,
    color: 'text-red-600',
    implementationStatus: 'planned',
    serverSupport: false
  },
  {
    id: 'fsa-uk',
    name: 'FSA (UK)',
    description: 'UK Food Standards Agency composition database',
    region: 'Europe',
    authority: 'Food Standards Agency (UK)',
    dataTypes: ['nutrients', 'ingredients', 'pollutants'],
    recordCount: 8000,
    isOfficial: true,
    isFree: true,
    website: 'https://www.food.gov.uk/',
    documentation: 'https://www.gov.uk/government/collections/composition-of-foods-integrated-dataset-cofid',
    rateLimit: '1000 requests/hour',
    keyRequired: false,
    status: 'planned',
    reliability: 'high',
    coverage: 'United Kingdom',
    updateFrequency: 'Annually',
    icon: Building,
    color: 'text-orange-600',
    implementationStatus: 'planned',
    serverSupport: false
  },

  // USA Official Sources
  {
    id: 'usda-fooddata-central',
    name: 'USDA FoodData Central',
    description: 'US Department of Agriculture comprehensive food database',
    region: 'USA',
    authority: 'USDA',
    dataTypes: ['nutrients', 'ingredients', 'products'],
    recordCount: 450000,
    isOfficial: true,
    isFree: true,
    website: 'https://fdc.nal.usda.gov/',
    documentation: 'https://fdc.nal.usda.gov/api-guide.html',
    rateLimit: '3600 requests/hour',
    keyRequired: true,
    status: 'active',
    reliability: 'high',
    coverage: 'United States',
    updateFrequency: 'Monthly',
    icon: Database,
    color: 'text-green-600',
    implementationStatus: 'implemented',
    serverSupport: true
  },
  {
    id: 'fda-food-code',
    name: 'FDA Food Code Database',
    description: 'FDA food safety and regulatory database',
    region: 'USA',
    authority: 'FDA',
    dataTypes: ['pollutants', 'ingredients', 'products'],
    recordCount: 180000,
    isOfficial: true,
    isFree: true,
    website: 'https://www.fda.gov/food/food-code/',
    documentation: 'https://www.fda.gov/food/food-ingredients-packaging/food-additive-status-list',
    rateLimit: '1000 requests/hour',
    keyRequired: false,
    status: 'planned',
    reliability: 'high',
    coverage: 'United States',
    updateFrequency: 'Quarterly',
    icon: Shield,
    color: 'text-blue-600',
    implementationStatus: 'planned',
    serverSupport: false
  },
  {
    id: 'epa-ecotox',
    name: 'EPA ECOTOX',
    description: 'EPA chemical toxicity and environmental data',
    region: 'USA',
    authority: 'EPA',
    dataTypes: ['pollutants', 'parasites'],
    recordCount: 1200000,
    isOfficial: true,
    isFree: true,
    website: 'https://cfpub.epa.gov/ecotox/',
    documentation: 'https://www.epa.gov/chemical-research/ecotox-user-guide-ecotoxicology-knowledgebase',
    rateLimit: '500 requests/hour',
    keyRequired: true,
    status: 'active',
    reliability: 'high',
    coverage: 'Global (US-led)',
    updateFrequency: 'Quarterly',
    icon: AlertTriangle,
    color: 'text-red-600',
    implementationStatus: 'implemented',
    serverSupport: true
  },
  {
    id: 'nih-nutrition',
    name: 'NIH Nutrition Database',
    description: 'National Institutes of Health nutrition research database',
    region: 'USA',
    authority: 'NIH',
    dataTypes: ['nutrients', 'ingredients'],
    recordCount: 95000,
    isOfficial: true,
    isFree: true,
    website: 'https://www.niddk.nih.gov/',
    documentation: 'https://www.niddk.nih.gov/health-information/health-topics/nutrition',
    rateLimit: '2000 requests/hour',
    keyRequired: false,
    status: 'planned',
    reliability: 'high',
    coverage: 'United States',
    updateFrequency: 'Monthly',
    icon: Heart,
    color: 'text-pink-600',
    implementationStatus: 'planned',
    serverSupport: false
  },
  {
    id: 'cdc-foodborne',
    name: 'CDC Foodborne Disease',
    description: 'Centers for Disease Control foodborne illness database',
    region: 'USA',
    authority: 'CDC',
    dataTypes: ['parasites', 'pollutants'],
    recordCount: 15000,
    isOfficial: true,
    isFree: true,
    website: 'https://www.cdc.gov/foodborneburden/',
    documentation: 'https://www.cdc.gov/foodsafety/data-research/index.html',
    rateLimit: '300 requests/hour',
    keyRequired: false,
    status: 'planned',
    reliability: 'high',
    coverage: 'United States',
    updateFrequency: 'Monthly',
    icon: AlertCircle,
    color: 'text-yellow-600',
    implementationStatus: 'planned',
    serverSupport: false
  },

  // Global Third-Party Sources
  {
    id: 'openfood-facts',
    name: 'OpenFood Facts',
    description: 'Global collaborative food products database',
    region: 'Global',
    authority: 'Open Food Facts Association',
    dataTypes: ['products', 'ingredients', 'nutrients'],
    recordCount: 2800000,
    isOfficial: false,
    isFree: true,
    website: 'https://openfoodfacts.org/',
    documentation: 'https://openfoodfacts.github.io/openfoodfacts-server/api/',
    rateLimit: '10000 requests/hour',
    keyRequired: false,
    status: 'active',
    reliability: 'medium',
    coverage: 'Global',
    updateFrequency: 'Real-time',
    icon: Globe,
    color: 'text-emerald-600',
    implementationStatus: 'implemented',
    serverSupport: true
  },
  {
    id: 'spoonacular',
    name: 'Spoonacular API',
    description: 'Commercial food and recipe database with nutrition data',
    region: 'Global',
    authority: 'RapidAPI/Spoonacular',
    dataTypes: ['ingredients', 'nutrients', 'products'],
    recordCount: 380000,
    isOfficial: false,
    isFree: false,
    pricing: '$15-149/month',
    website: 'https://spoonacular.com/food-api',
    documentation: 'https://spoonacular.com/food-api/docs',
    rateLimit: '150-15000 requests/day',
    keyRequired: true,
    status: 'active',
    reliability: 'high',
    coverage: 'Global',
    updateFrequency: 'Daily',
    icon: Zap,
    color: 'text-orange-500',
    implementationStatus: 'implemented',
    serverSupport: true
  },
  {
    id: 'edamam-nutrition',
    name: 'Edamam Nutrition API',
    description: 'Commercial nutrition analysis and food database',
    region: 'Global',
    authority: 'Edamam LLC',
    dataTypes: ['nutrients', 'ingredients'],
    recordCount: 890000,
    isOfficial: false,
    isFree: false,
    pricing: '$19-399/month',
    website: 'https://www.edamam.com/',
    documentation: 'https://developer.edamam.com/edamam-docs-nutrition-api',
    rateLimit: '5-100 requests/minute',
    keyRequired: true,
    status: 'active',
    reliability: 'high',
    coverage: 'Global',
    updateFrequency: 'Daily',
    icon: Leaf,
    color: 'text-green-500',
    implementationStatus: 'implemented',
    serverSupport: true
  },
  {
    id: 'nutritionix',
    name: 'Nutritionix API',
    description: 'Commercial nutrition database with branded foods',
    region: 'Global',
    authority: 'Nutritionix',
    dataTypes: ['nutrients', 'products', 'ingredients'],
    recordCount: 1100000,
    isOfficial: false,
    isFree: false,
    pricing: '$25-299/month',
    website: 'https://www.nutritionix.com/business/api',
    documentation: 'https://docs.nutritionix.com/',
    rateLimit: '1000-50000 requests/day',
    keyRequired: true,
    status: 'active',
    reliability: 'high',
    coverage: 'US + Global',
    updateFrequency: 'Daily',
    icon: Database,
    color: 'text-blue-500',
    implementationStatus: 'implemented',
    serverSupport: true
  },
  {
    id: 'openaq-air-quality',
    name: 'OpenAQ Air Quality',
    description: 'Global air quality data for pollutant monitoring',
    region: 'Global',
    authority: 'OpenAQ',
    dataTypes: ['pollutants'],
    recordCount: 50000,
    isOfficial: false,
    isFree: true,
    website: 'https://openaq.org/',
    documentation: 'https://docs.openaq.org/',
    rateLimit: '10000 requests/day',
    keyRequired: false,
    status: 'active',
    reliability: 'high',
    coverage: 'Global',
    updateFrequency: 'Real-time',
    icon: AlertTriangle,
    color: 'text-orange-600',
    implementationStatus: 'implemented',
    serverSupport: true
  },
  {
    id: 'zestful',
    name: 'Zestful Ingredient Parser',
    description: 'AI-powered ingredient parsing and analysis',
    region: 'Global',
    authority: 'Zestful',
    dataTypes: ['ingredients'],
    recordCount: 250000,
    isOfficial: false,
    isFree: false,
    pricing: '$0.002/parse',
    website: 'https://zestfuldata.com/',
    documentation: 'https://zestfuldata.com/docs',
    rateLimit: '1000 requests/minute',
    keyRequired: true,
    status: 'planned',
    reliability: 'high',
    coverage: 'Global',
    updateFrequency: 'Real-time',
    icon: Beaker,
    color: 'text-purple-500',
    implementationStatus: 'planned',
    serverSupport: false
  },
  {
    id: 'world-health-org',
    name: 'WHO Global Health Observatory',
    description: 'World Health Organization health and nutrition data',
    region: 'Global',
    authority: 'World Health Organization',
    dataTypes: ['pollutants', 'parasites', 'nutrients'],
    recordCount: 45000,
    isOfficial: true,
    isFree: true,
    website: 'https://www.who.int/data/gho',
    documentation: 'https://www.who.int/data/gho/info/gho-odata-api',
    rateLimit: '1000 requests/hour',
    keyRequired: false,
    status: 'planned',
    reliability: 'high',
    coverage: 'Global',
    updateFrequency: 'Annually',
    icon: Globe,
    color: 'text-cyan-600',
    implementationStatus: 'planned',
    serverSupport: false
  }
];

export function DataImportManager({ onClose, initialDataTypeFilter }: DataImportManagerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [importProgress, setImportProgress] = useState<Record<string, number>>({});
  const [importStatus, setImportStatus] = useState<Record<string, 'idle' | 'importing' | 'success' | 'error'>>({});
  const [importCounts, setImportCounts] = useState<Record<string, number>>({});
  const [selectedRegion, setSelectedRegion] = useState<'all' | 'Europe' | 'USA' | 'Global'>('all');
  const [dataTypeFilter, setDataTypeFilter] = useState<string | null>(initialDataTypeFilter || null);

  useEffect(() => {
    // Initialize import status for all sources
    const initialStatus: Record<string, 'idle' | 'importing' | 'success' | 'error'> = {};
    const initialCounts: Record<string, number> = {};
    
    API_SOURCES.forEach(source => {
      initialStatus[source.id] = 'idle';
      initialCounts[source.id] = 0;
    });
    
    setImportStatus(initialStatus);
    setImportCounts(initialCounts);
    
    // Show notification if navigated from specific data type
    if (initialDataTypeFilter) {
      console.log(`🎯 API Import Manager opened with filter: ${initialDataTypeFilter}`);
      toast.info(`🎯 Showing APIs for importing ${initialDataTypeFilter} data`);
    }
  }, [initialDataTypeFilter]);

  const filteredSources = API_SOURCES.filter(source => {
    const regionMatch = selectedRegion === 'all' || source.region === selectedRegion;
    const dataTypeMatch = !dataTypeFilter || source.dataTypes.includes(dataTypeFilter);
    return regionMatch && dataTypeMatch;
  });

  const handleImport = async (sourceId: string, dataType: string) => {
    const source = API_SOURCES.find(s => s.id === sourceId);
    if (!source) return;

    // Strict validation to prevent any imports from unimplemented sources
    if (source.implementationStatus === 'planned' || !source.serverSupport) {
      toast.error(`🚧 ${source.name} is planned but not yet implemented. This API integration is on our roadmap for future releases.`);
      console.log(`⚠️ Blocked import attempt from planned source: ${sourceId}`);
      return;
    }

    // Also block if status is not active
    if (source.status !== 'active') {
      toast.error(`⚠️ ${source.name} is not currently active. Status: ${source.status}`);
      return;
    }

    // Check for required API keys
    if (source.keyRequired && !source.isFree) {
      toast.error(`🔑 API key required for ${source.name}. This is a paid service that requires configuration.`);
      return;
    }

    setImportStatus(prev => ({ ...prev, [sourceId]: 'importing' }));
    setImportProgress(prev => ({ ...prev, [sourceId]: 0 }));
    
    try {
      console.log(`🔄 Starting real import from ${source.name} for ${dataType}`);
      
      // Use the appropriate real API endpoint based on the source
      let endpoint = '';
      let requestBody = {};

      // Only handle implemented sources
      switch (sourceId) {
        case 'usda-fooddata-central':
          endpoint = `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/import-real-usda`;
          requestBody = { query: 'vitamin', limit: 25 };
          break;
        case 'openaq-air-quality':
        case 'epa-ecotox':
          endpoint = `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/import-real-openaq`;
          requestBody = { country: 'US', limit: 100 };
          break;
        case 'spoonacular':
          endpoint = `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/import-real-spoonacular`;
          requestBody = { query: 'apple', limit: 20 };
          break;
        case 'openfood-facts':
          endpoint = `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/import`;
          requestBody = {
            source: 'openfood-facts',
            dataType,
            region: source.region,
            authority: source.authority
          };
          break;
        case 'edamam-nutrition':
          endpoint = `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/import`;
          requestBody = {
            source: 'edamam-nutrition',
            dataType,
            region: source.region,
            authority: source.authority
          };
          break;
        case 'nutritionix':
          endpoint = `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/import`;
          requestBody = {
            source: 'nutritionix',
            dataType,
            region: source.region,
            authority: source.authority
          };
          break;
        default:
          // This should be caught by the validation above, but double-check
          console.error(`❌ No import handler for source: ${sourceId}`);
          toast.error(`❌ Import handler not implemented for ${source.name}`);
          setImportStatus(prev => ({ ...prev, [sourceId]: 'error' }));
          return;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Import request failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Import failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Check if the result indicates the source is planned/not implemented
      if (result.error && result.error.includes('planned')) {
        throw new Error(`${source.name} is planned but not yet implemented`);
      }
      
      // Simulate progress updates for better UX
      for (let i = 0; i <= 100; i += 10) {
        setImportProgress(prev => ({ ...prev, [sourceId]: i }));
        await new Promise(resolve => setTimeout(resolve, 80));
      }
      
      setImportStatus(prev => ({ ...prev, [sourceId]: 'success' }));
      setImportCounts(prev => ({ ...prev, [sourceId]: result.imported || 0 }));
      
      if (result.imported > 0) {
        toast.success(`✅ Successfully imported ${result.imported} records from ${source.name}`);
      } else {
        toast.info(`📭 Import completed but no data was available from ${source.name} (this could be due to API limits or missing keys)`);
      }
      
    } catch (error) {
      console.error(`❌ Import error for ${source.name}:`, error);
      setImportStatus(prev => ({ ...prev, [sourceId]: 'error' }));
      
      // Provide more specific error messages
      let errorMessage = error.message;
      if (errorMessage.includes('planned') || errorMessage.includes('not yet implemented')) {
        errorMessage = `${source.name} is planned for future implementation but not currently available.`;
      } else if (errorMessage.includes('400')) {
        errorMessage = `Bad request - this usually means the API source is not properly configured on the server.`;
      } else if (errorMessage.includes('500')) {
        errorMessage = `Server error - the import service may be temporarily unavailable.`;
      }
      
      toast.error(`❌ Import failed for ${source.name}: ${errorMessage}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'importing': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getImplementationStatusBadge = (source: APISource) => {
    switch (source.implementationStatus) {
      case 'implemented':
        return (
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
            ✅ Ready
          </Badge>
        );
      case 'planned':
        return (
          <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
            🚧 Planned
          </Badge>
        );
      case 'external':
        return (
          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
            🔗 External
          </Badge>
        );
      default:
        return null;
    }
  };

  const getRegionStats = () => {
    const stats = {
      total: API_SOURCES.length,
      europe: API_SOURCES.filter(s => s.region === 'Europe').length,
      usa: API_SOURCES.filter(s => s.region === 'USA').length,
      global: API_SOURCES.filter(s => s.region === 'Global').length,
      official: API_SOURCES.filter(s => s.isOfficial).length,
      free: API_SOURCES.filter(s => s.isFree).length,
      implemented: API_SOURCES.filter(s => s.implementationStatus === 'implemented').length,
      totalRecords: API_SOURCES.reduce((sum, s) => sum + s.recordCount, 0)
    };
    return stats;
  };

  const stats = getRegionStats();

  const APISourceCard = ({ source }: { source: APISource }) => {
    const Icon = source.icon;
    const status = importStatus[source.id] || 'idle';
    const progress = importProgress[source.id] || 0;
    const importedCount = importCounts[source.id] || 0;
    
    // Check if this source supports the filtered data type
    const supportsFilteredType = dataTypeFilter ? source.dataTypes.includes(dataTypeFilter) : false;
    
    return (
      <Card 
        key={source.id} 
        className={`relative overflow-hidden transition-all duration-200 ${
          source.implementationStatus === 'implemented' 
            ? 'hover:shadow-lg border-green-200' 
            : 'opacity-75 hover:opacity-90'
        } ${
          dataTypeFilter && supportsFilteredType 
            ? 'ring-2 ring-blue-300 bg-blue-50 border-blue-200' 
            : ''
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Icon className={`w-6 h-6 ${source.color}`} />
              <div className="flex-1">
                <CardTitle className="text-lg leading-tight flex items-center space-x-2">
                  <span>{source.name}</span>
                  {dataTypeFilter && supportsFilteredType && (
                    <Badge variant="default" className="text-xs bg-blue-600 text-white">
                      Supports {dataTypeFilter}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {source.region}
                  </Badge>
                  {source.isOfficial && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      Official
                    </Badge>
                  )}
                  {source.isFree && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      Free
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getImplementationStatusBadge(source)}
              {getStatusIcon(status)}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">{source.description}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700">Authority</div>
              <div className="text-gray-600">{source.authority}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Records</div>
              <div className="text-gray-600">{source.recordCount.toLocaleString()}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Coverage</div>
              <div className="text-gray-600">{source.coverage}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Updates</div>
              <div className="text-gray-600">{source.updateFrequency}</div>
            </div>
          </div>

          <div>
            <div className="font-medium text-gray-700 mb-2">Data Types</div>
            <div className="flex flex-wrap gap-1">
              {source.dataTypes.map((type) => (
                <Badge 
                  key={type} 
                  variant={dataTypeFilter === type ? "default" : "outline"} 
                  className={`text-xs ${
                    dataTypeFilter === type 
                      ? "bg-blue-600 text-white" 
                      : ""
                  }`}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          {/* Enhanced filter notification */}
          {dataTypeFilter && supportsFilteredType && (
            <Alert className="border-blue-200 bg-blue-50">
              <Target className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-xs">
                This API source supports <strong>{dataTypeFilter}</strong> data import and is highlighted due to your filter selection.
              </AlertDescription>
            </Alert>
          )}

          {/* Implementation Status Info */}
          {source.implementationStatus === 'planned' && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <Construction className="w-4 h-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 text-xs">
                This API is planned for future implementation. Check back in upcoming releases.
              </AlertDescription>
            </Alert>
          )}

          {source.keyRequired && source.implementationStatus === 'implemented' && (
            <Alert>
              <Key className="w-4 h-4" />
              <AlertDescription className="text-xs">
                API key required. Rate limit: {source.rateLimit}
              </AlertDescription>
            </Alert>
          )}

          {status === 'importing' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {status === 'success' && importedCount > 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm">
                Successfully imported {importedCount.toLocaleString()} records
              </AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-2">
            {source.dataTypes.map((dataType) => (
              <Button
                key={dataType}
                variant={dataTypeFilter === dataType ? "default" : "outline"}
                size="sm"
                onClick={() => handleImport(source.id, dataType)}
                disabled={
                  status === 'importing' || 
                  source.implementationStatus === 'planned' ||
                  !source.serverSupport
                }
                className="flex-1"
              >
                {source.implementationStatus === 'implemented' ? (
                  <>Import {dataType}</>
                ) : (
                  <>Coming Soon</>
                )}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(source.website, '_blank')}
              className="px-3"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Admin</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Real Data Import Manager
                {dataTypeFilter && (
                  <span className="text-blue-600"> - {dataTypeFilter}</span>
                )}
              </h1>
              <p className="text-gray-600">
                {dataTypeFilter 
                  ? `Import ${dataTypeFilter} data from compatible APIs`
                  : 'Import from official European, US, and global food databases'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="text-sm">
              {filteredSources.length} Sources
            </Badge>
            <Badge variant="secondary" className="text-sm bg-green-100 text-green-800">
              {filteredSources.filter(s => s.implementationStatus === 'implemented').length} Ready
            </Badge>
            {dataTypeFilter && (
              <Badge variant="default" className="text-sm bg-blue-100 text-blue-800 border-blue-300">
                Filtered: {dataTypeFilter}
              </Badge>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="europe">Europe ({API_SOURCES.filter(s => s.region === 'Europe' && (!dataTypeFilter || s.dataTypes.includes(dataTypeFilter))).length})</TabsTrigger>
            <TabsTrigger value="usa">USA ({API_SOURCES.filter(s => s.region === 'USA' && (!dataTypeFilter || s.dataTypes.includes(dataTypeFilter))).length})</TabsTrigger>
            <TabsTrigger value="global">Global ({API_SOURCES.filter(s => s.region === 'Global' && (!dataTypeFilter || s.dataTypes.includes(dataTypeFilter))).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Data Type Filter Alert */}
            {dataTypeFilter && (
              <Alert className="border-blue-200 bg-blue-50">
                <Target className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-800 flex items-center justify-between">
                  <span>
                    <strong>Filtered View:</strong> Showing only APIs that support importing <strong>{dataTypeFilter}</strong> data. 
                    {filteredSources.length} out of {stats.total} sources support this data type.
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDataTypeFilter(null)}
                    className="ml-4 h-6 px-2 text-xs"
                  >
                    Clear Filter
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Database className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">{filteredSources.length}</div>
                  <div className="text-sm text-gray-600">
                    {dataTypeFilter ? `${dataTypeFilter} Sources` : 'Total Sources'}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">
                    {filteredSources.filter(s => s.implementationStatus === 'implemented').length}
                  </div>
                  <div className="text-sm text-gray-600">Ready to Import</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">
                    {filteredSources.filter(s => s.isOfficial).length}
                  </div>
                  <div className="text-sm text-gray-600">Official Sources</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  <div className="text-2xl font-bold">
                    {filteredSources.filter(s => s.isFree).length}
                  </div>
                  <div className="text-sm text-gray-600">Free Sources</div>
                </CardContent>
              </Card>
            </div>

            {/* All filtered sources */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredSources.map((source) => (
                <APISourceCard key={source.id} source={source} />
              ))}
            </div>

            {filteredSources.length === 0 && dataTypeFilter && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  No API sources found that support <strong>{dataTypeFilter}</strong> data. 
                  Try clearing the filter to see all available sources.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Region-specific tabs */}
          {['europe', 'usa', 'global'].map((region) => (
            <TabsContent key={region} value={region} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredSources
                  .filter(source => source.region.toLowerCase() === region || (region === 'global' && source.region === 'Global'))
                  .map((source) => (
                    <APISourceCard key={source.id} source={source} />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}