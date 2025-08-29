import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { 
  Heart, 
  Leaf, 
  Package, 
  Zap, 
  Scan, 
  Globe, 
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Database,
  Activity,
  Clock,
  Users,
  BarChart3,
  TrendingUp,
  Filter,
  Download,
  Eye,
  Utensils,
  Bug
} from 'lucide-react';
import { 
  healthScanApi, 
  healthScanApiUtils,
  HealthScanApiStats,
  HealthScanNutrient,
  HealthScanIngredient,
  HealthScanProduct,
  HealthScanPollutant,
  HealthScanScan
} from '../services/healthscanApiService';
import { projectId } from '../utils/supabase/info';

interface HealthScanApiDashboardProps {
  accessToken?: string;
}

export function HealthScanApiDashboard({ accessToken }: HealthScanApiDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [apiStats, setApiStats] = useState<HealthScanApiStats | null>(null);
  const [apiHealth, setApiHealth] = useState<{ online: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Data states for different endpoints
  const [nutrients, setNutrients] = useState<HealthScanNutrient[]>([]);
  const [ingredients, setIngredients] = useState<HealthScanIngredient[]>([]);
  const [products, setProducts] = useState<HealthScanProduct[]>([]);
  const [pollutants, setPollutants] = useState<HealthScanPollutant[]>([]);
  const [scans, setScans] = useState<HealthScanScan[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [parasites, setParasites] = useState<any[]>([]);

  // Load API data
  const loadApiStats = async (showToast = true) => {
    setLoading(true);
    try {
      console.log('📊 Loading HealthScan API statistics...');

      // Check API health first
      const health = await healthScanApiUtils.checkApiHealth();
      setApiHealth(health);

      if (!health.online) {
        if (showToast) {
          healthScanApiUtils.showApiWarning('HealthScan API appears to be offline');
        }
        // Provide fallback stats when API is offline
        setApiStats({
          nutrients: { total: 0, categories: {} },
          ingredients: { total: 0, categories: {} },
          products: { total: 0, brands: 0, categories: {} },
          pollutants: { total: 0, toxicity_levels: {} },
          scans: { total: 0, scan_types: {}, last_24h: 0 },
          meals: { total: 0, categories: {} },
          parasites: { total: 0, categories: {} },
          system: {
            api_version: 'Unknown',
            uptime: 0,
            last_updated: new Date().toISOString(),
            data_sources: []
          }
        });
        return;
      }

      // Load API statistics
      const statsResponse = await healthScanApi.getStats();
      const stats = healthScanApiUtils.extractApiData(statsResponse);
      
      if (stats) {
        setApiStats(stats);
        if (showToast) {
          healthScanApiUtils.showApiSuccess('HealthScan API data loaded successfully');
        }
      } else if (statsResponse && !statsResponse.success && statsResponse.error?.includes('Endpoint not available')) {
        // Handle case where stats endpoint is not available
        if (showToast) {
          healthScanApiUtils.showApiWarning('Statistics endpoint is not yet available in the HealthScan API');
        }
        setApiStats({
          nutrients: { total: 0, categories: {} },
          ingredients: { total: 0, categories: {} },
          products: { total: 0, brands: 0, categories: {} },
          pollutants: { total: 0, toxicity_levels: {} },
          scans: { total: 0, scan_types: {}, last_24h: 0 },
          meals: { total: 0, categories: {} },
          parasites: { total: 0, categories: {} },
          system: {
            api_version: 'v1',
            uptime: 0,
            last_updated: new Date().toISOString(),
            data_sources: ['HealthScan API']
          }
        });
        setApiHealth({ online: true, message: 'HealthScan API is online (limited endpoints available)' });
      } else {
        throw new Error('Failed to load API statistics');
      }

    } catch (error) {
      console.error('❌ Failed to load HealthScan API data:', error);
      
      // Don't show error toast for 404/endpoint not available errors
      if (!error.message?.includes('Endpoint not available') && showToast) {
        healthScanApiUtils.showApiError(error, 'Loading HealthScan API data');
      }
      
      const errorMsg = healthScanApiUtils.formatApiError(error);
      
      // Set health status based on error type
      if (errorMsg.includes('Endpoint not available') || errorMsg.includes('404')) {
        setApiHealth({ online: true, message: 'HealthScan API is online (limited endpoints available)' });
        // Provide basic stats structure even when endpoints are unavailable
        setApiStats({
          nutrients: { total: 0, categories: {} },
          ingredients: { total: 0, categories: {} },
          products: { total: 0, brands: 0, categories: {} },
          pollutants: { total: 0, toxicity_levels: {} },
          scans: { total: 0, scan_types: {}, last_24h: 0 },
          meals: { total: 0, categories: {} },
          parasites: { total: 0, categories: {} },
          system: {
            api_version: 'v1',
            uptime: 0,
            last_updated: new Date().toISOString(),
            data_sources: ['HealthScan API (limited)']
          }
        });
      } else {
        setApiHealth({ online: false, message: errorMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  // Load specific data type
  const loadDataType = async (type: string, limit: number = 20) => {
    setLoading(true);
    try {
      const params = { 
        limit,
        ...(selectedCategory && { category: selectedCategory }),
        ...(searchQuery && { search: searchQuery })
      };

      let response;
      switch (type) {
        case 'nutrients':
          response = await healthScanApi.getNutrients(params);
          const nutrientData = healthScanApiUtils.extractApiData(response);
          setNutrients(nutrientData || []);
          break;
        case 'ingredients':
          response = await healthScanApi.getIngredients(params);
          const ingredientData = healthScanApiUtils.extractApiData(response);
          setIngredients(ingredientData || []);
          break;
        case 'products':
          response = await healthScanApi.getProducts(params);
          const productData = healthScanApiUtils.extractApiData(response);
          setProducts(productData || []);
          break;
        case 'pollutants':
          response = await healthScanApi.getPollutants(params);
          const pollutantData = healthScanApiUtils.extractApiData(response);
          setPollutants(pollutantData || []);
          break;
        case 'scans':
          response = await healthScanApi.getScans(params);
          const scanData = healthScanApiUtils.extractApiData(response);
          setScans(scanData || []);
          break;
        case 'meals':
          response = await healthScanApi.getMeals(params);
          const mealData = healthScanApiUtils.extractApiData(response);
          setMeals(mealData || []);
          break;
        case 'parasites':
          response = await healthScanApi.getParasites(params);
          const parasiteData = healthScanApiUtils.extractApiData(response);
          setParasites(parasiteData || []);
          break;
      }

      // Handle endpoint not available case
      if (response && !response.success && response.error?.includes('Endpoint not available')) {
        healthScanApiUtils.showApiWarning(`${type} endpoint is not yet available in the HealthScan API`);
      }

    } catch (error) {
      console.error(`Error loading ${type}:`, error);
      // Set empty arrays on error to prevent undefined states
      switch (type) {
        case 'nutrients':
          setNutrients([]);
          break;
        case 'ingredients':
          setIngredients([]);
          break;
        case 'products':
          setProducts([]);
          break;
        case 'pollutants':
          setPollutants([]);
          break;
        case 'scans':
          setScans([]);
          break;
        case 'meals':
          setMeals([]);
          break;
        case 'parasites':
          setParasites([]);
          break;
      }
      
      // Only show error toast if it's not a 404/endpoint unavailable error
      if (!error.message?.includes('Endpoint not available')) {
        healthScanApiUtils.showApiError(error, `Loading ${type}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadApiStats();
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab && activeTab !== 'overview' && apiHealth?.online) {
      loadDataType(activeTab);
    }
  }, [activeTab, selectedCategory, apiHealth?.online]);

  // API Status Component
  const ApiStatusCard = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">HealthScan API Status</CardTitle>
          <Button 
            onClick={() => loadApiStats()} 
            variant="outline" 
            size="sm" 
            disabled={loading}
            className="ml-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {apiHealth?.online ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">API Online</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-red-600 font-medium">API Offline</span>
            </>
          )}
          <Badge variant={apiHealth?.online ? "default" : "destructive"} className="ml-auto">
            {apiHealth?.online ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>Endpoint:</strong> {`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2`}</p>
          <p><strong>Status:</strong> {apiHealth?.message || 'Checking...'}</p>
          {apiStats?.system && (
            <>
              <p><strong>Version:</strong> {apiStats.system.api_version}</p>
              {apiStats.system.uptime > 0 && (
                <p><strong>Uptime:</strong> {Math.round(apiStats.system.uptime / 3600)}h</p>
              )}
              <p><strong>Last Updated:</strong> {healthScanApiUtils.formatTimestamp(apiStats.system.last_updated)}</p>
            </>
          )}
          
          {apiHealth?.message?.includes('limited') && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs">
              <p><strong>Note:</strong> Some API endpoints may not be available yet. The HealthScan API is actively being developed.</p>
            </div>
          )}
        </div>

        {apiStats?.system?.data_sources && apiStats.system.data_sources.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Data Sources:</p>
            <div className="flex flex-wrap gap-1">
              {apiStats.system.data_sources.map((source, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {source}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => window.open(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2`, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View API Endpoints
        </Button>
      </CardContent>
    </Card>
  );

  // Stats Overview Component
  const StatsOverview = () => {
    if (!apiStats) return null;

    const statCards = [
      {
        title: 'Nutrients',
        icon: Heart,
        count: apiStats.nutrients.total,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        categories: Object.keys(apiStats.nutrients.categories).length
      },
      {
        title: 'Ingredients',
        icon: Leaf,
        count: apiStats.ingredients.total,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        categories: Object.keys(apiStats.ingredients.categories).length
      },
      {
        title: 'Products',
        icon: Package,
        count: apiStats.products.total,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        categories: Object.keys(apiStats.products.categories).length,
        extra: `${apiStats.products.brands} brands`
      },
      {
        title: 'Pollutants',
        icon: Zap,
        count: apiStats.pollutants.total,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        categories: Object.keys(apiStats.pollutants.toxicity_levels).length
      },
      {
        title: 'Scans',
        icon: Scan,
        count: apiStats.scans.total,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        extra: `${apiStats.scans.last_24h} last 24h`
      },
      {
        title: 'Meals',
        icon: Utensils,
        count: apiStats.meals?.total || 0,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        categories: Object.keys(apiStats.meals?.categories || {}).length
      },
      {
        title: 'Parasites',
        icon: Bug,
        count: apiStats.parasites?.total || 0,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
        categories: Object.keys(apiStats.parasites?.categories || {}).length
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold">{healthScanApiUtils.formatCount(stat.count)}</p>
                    <div className="flex gap-2 text-xs text-gray-500 mt-1">
                      <span>{stat.categories} categories</span>
                      {stat.extra && <span>• {stat.extra}</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // Data Table Component
  const DataTable = ({ data, type }: { data: any[], type: string }) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No {type} data available</p>
          <p className="text-xs mt-2 opacity-75">
            This endpoint may not be implemented yet in the HealthScan API
          </p>
        </div>
      );
    }

    const renderRow = (item: any, index: number) => {
      switch (type) {
        case 'nutrients':
          return (
            <div key={item.id || index} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{item.name}</h4>
                <Badge variant="secondary">{item.type}</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-1">{item.category}</p>
              <p className="text-xs text-gray-500">Unit: {item.unit}</p>
              {item.rda && <p className="text-xs text-gray-500">RDA: {item.rda}</p>}
            </div>
          );
        case 'ingredients':
          return (
            <div key={item.id || index} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{item.name}</h4>
                <Badge variant="secondary">{item.category}</Badge>
              </div>
              {item.allergens && item.allergens.length > 0 && (
                <div className="mb-1">
                  <p className="text-xs text-gray-500 mb-1">Allergens:</p>
                  <div className="flex flex-wrap gap-1">
                    {item.allergens.map((allergen: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {allergen}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {item.health_impact && (
                <p className="text-xs text-gray-600">{item.health_impact}</p>
              )}
            </div>
          );
        case 'products':
          return (
            <div key={item.id || index} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{item.name}</h4>
                <div className="flex gap-1">
                  {item.health_score && (
                    <Badge variant="default" className="text-xs">
                      Health: {item.health_score}/100
                    </Badge>
                  )}
                  <Badge variant="secondary">{item.category}</Badge>
                </div>
              </div>
              {item.brand && <p className="text-sm text-gray-600 mb-1">{item.brand}</p>}
              {item.barcode && <p className="text-xs text-gray-500">Barcode: {item.barcode}</p>}
              {item.ingredients && (
                <p className="text-xs text-gray-500 mt-1">
                  {item.ingredients.length} ingredients
                </p>
              )}
            </div>
          );
        case 'pollutants':
          return (
            <div key={item.id || index} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{item.name}</h4>
                <Badge 
                  variant={item.toxicity_level === 'high' || item.toxicity_level === 'severe' ? 'destructive' : 'secondary'}
                >
                  {item.toxicity_level}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-1">{item.type} • {item.category}</p>
              {item.health_effects && item.health_effects.length > 0 && (
                <p className="text-xs text-gray-500">
                  {item.health_effects.length} health effects documented
                </p>
              )}
            </div>
          );
        case 'scans':
          return (
            <div key={item.id || index} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium capitalize">{item.scan_type} Scan</h4>
                <Badge variant="secondary">{item.scan_type}</Badge>
              </div>
              {item.analysis_results?.health_score && (
                <p className="text-sm text-gray-600 mb-1">
                  Health Score: {item.analysis_results.health_score}/100
                </p>
              )}
              <p className="text-xs text-gray-500">
                {healthScanApiUtils.formatTimestamp(item.created_at)}
              </p>
              {item.location?.country && (
                <p className="text-xs text-gray-500">Location: {item.location.country}</p>
              )}
            </div>
          );
        default:
          return (
            <div key={item.id || index} className="p-3 border rounded-lg">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(item, null, 2)}
              </pre>
            </div>
          );
      }
    };

    return (
      <ScrollArea className="h-96">
        <div className="space-y-3">
          {data.map(renderRow)}
        </div>
      </ScrollArea>
    );
  };

  // Search and Filter Controls
  const SearchControls = ({ type }: { type: string }) => (
    <div className="flex gap-2 mb-4">
      <div className="flex-1">
        <Input
          placeholder={`Search ${type}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>
      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Categories</SelectItem>
          {apiStats && (
            <>
              {type === 'nutrients' && Object.keys(apiStats.nutrients.categories).map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
              {type === 'ingredients' && Object.keys(apiStats.ingredients.categories).map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
              {type === 'products' && Object.keys(apiStats.products.categories).map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
      <Button 
        onClick={() => loadDataType(type)} 
        variant="outline" 
        disabled={loading}
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">HealthScan API Dashboard</h2>
          <p className="text-gray-600">Real-time data from HealthScan's production API</p>
        </div>
        <Button onClick={() => loadApiStats()} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh All
        </Button>
      </div>

      {/* API Status */}
      <ApiStatusCard />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="flex w-full min-w-max">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="nutrients">Nutrients</TabsTrigger>
            <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="pollutants">Pollutants</TabsTrigger>
            <TabsTrigger value="scans">Scans</TabsTrigger>
            <TabsTrigger value="meals">Meals</TabsTrigger>
            <TabsTrigger value="parasites">Parasites</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <StatsOverview />
        </TabsContent>

        <TabsContent value="nutrients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-600" />
                Nutrients Data
              </CardTitle>
              <CardDescription>
                Nutritional compounds from the HealthScan API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SearchControls type="nutrients" />
              <DataTable data={nutrients} type="nutrients" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ingredients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-600" />
                Ingredients Data
              </CardTitle>
              <CardDescription>
                Food ingredients and components from the HealthScan API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SearchControls type="ingredients" />
              <DataTable data={ingredients} type="ingredients" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Products Data
              </CardTitle>
              <CardDescription>
                Commercial food products from the HealthScan API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SearchControls type="products" />
              <DataTable data={products} type="products" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pollutants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-600" />
                Pollutants Data
              </CardTitle>
              <CardDescription>
                Environmental toxins and contaminants from the HealthScan API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SearchControls type="pollutants" />
              <DataTable data={pollutants} type="pollutants" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5 text-purple-600" />
                Scans Data
              </CardTitle>
              <CardDescription>
                User scans and analysis results from the HealthScan API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SearchControls type="scans" />
              <DataTable data={scans} type="scans" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-yellow-600" />
                Meals Data
              </CardTitle>
              <CardDescription>
                Meal plans and nutritional combinations from the HealthScan API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SearchControls type="meals" />
              <DataTable data={meals} type="meals" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parasites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-pink-600" />
                Parasites Data
              </CardTitle>
              <CardDescription>
                Parasites and harmful organisms from the HealthScan API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SearchControls type="parasites" />
              <DataTable data={parasites} type="parasites" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default HealthScanApiDashboard;