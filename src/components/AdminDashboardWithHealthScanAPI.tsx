import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { HealthScanApiDashboard } from './HealthScanApiDashboard';
import { UserManagement } from './UserManagement';
import { NutrientEditor } from './NutrientEditor';
import { IngredientEditor } from './IngredientEditor';
import { ProductEditor } from './ProductEditor';
import { PollutantEditor } from './PollutantEditor';
import { ScanEditor } from './ScanEditor';
import { MealEditor } from './MealEditor';
import { ParasiteEditor } from './ParasiteEditor';
import { ReferralLinkTester } from './ReferralLinkTester';
import { ThemeManager } from './ThemeManager';
import { toast } from 'sonner';
import { 
  Database, 
  Users, 
  Heart, 
  Zap, 
  Leaf, 
  Bug, 
  Scan, 
  Utensils, 
  Settings, 
  RefreshCw, 
  Menu, 
  X, 
  AlertTriangle,
  ExternalLink,
  Package,
  Globe,
  Upload,
  Palette,
  Share2,
  Mail
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface AdminDashboardProps {
  user: any;
  accessToken: string;
}

interface AdminStats {
  nutrients?: { total: number; withImages: number };
  ingredients?: { total: number; withImages: number };
  products?: { total: number; withImages: number };
  pollutants?: { total: number; withImages: number };
  scans?: { total: number; withImages: number };
  meals?: { total: number; withImages: number };
  parasites?: { total: number; withImages: number };
  users?: { total: number; confirmed: number };
}

export function AdminDashboardWithHealthScanAPI({ user, accessToken }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<AdminStats>({});
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [serverConnected, setServerConnected] = useState(true);
  const [lastFetchError, setLastFetchError] = useState<string | null>(null);

  // Enhanced fetch admin statistics
  const fetchStats = async () => {
    setLoading(true);
    setLastFetchError(null);
    
    try {
      console.log('📊 Fetching admin statistics...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/stats`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(30000)
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Admin stats fetched successfully:', data);
        
        if (data.success && data.detailedStats) {
          const transformedStats = transformServerStats(data.detailedStats);
          setStats(transformedStats);
          setServerConnected(true);
          setLastFetchError(null);
          toast.success('📊 Admin stats updated successfully');
        } else {
          console.warn('⚠️ Unexpected stats response format:', data);
          setStats(getFallbackStats());
          setServerConnected(false);
          setLastFetchError('Invalid response format from server');
          toast.warning('Received unexpected data format from server');
        }
      } else {
        console.warn('⚠️ Failed to fetch admin stats:', response.status, response.statusText);
        setServerConnected(false);
        setStats(getFallbackStats());
        
        if (response.status === 401) {
          setLastFetchError('Authentication failed - please refresh your login');
          toast.error('Session expired. Please refresh the page and log in again.');
        } else if (response.status === 403) {
          setLastFetchError('Admin access denied - insufficient permissions');
          toast.error('Admin access denied. Please verify your admin permissions.');
        } else {
          setLastFetchError(`HTTP ${response.status}: ${response.statusText}`);
          toast.error('Unable to fetch admin statistics. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('❌ Error fetching admin stats:', error);
      setServerConnected(false);
      setStats(getFallbackStats());
      
      if (error.name === 'AbortError') {
        setLastFetchError('Request timeout - server may be slow or unavailable');
        toast.error('Request timed out. Please check your internet connection and try again.');
      } else {
        setLastFetchError(error.message || 'Unknown network error');
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Transform server stats response to expected format
  const transformServerStats = (detailedStats: any): AdminStats => {
    const transformed: AdminStats = {};
    
    Object.keys(detailedStats).forEach(key => {
      const stat = detailedStats[key];
      transformed[key as keyof AdminStats] = {
        total: stat.current || 0,
        withImages: stat.withImages || 0
      };
    });
    
    return transformed;
  };

  // Provide fallback stats when server is unavailable
  const getFallbackStats = (): AdminStats => {
    return {
      nutrients: { total: 0, withImages: 0 },
      ingredients: { total: 0, withImages: 0 },
      products: { total: 0, withImages: 0 },
      pollutants: { total: 0, withImages: 0 },
      scans: { total: 0, withImages: 0 },
      meals: { total: 0, withImages: 0 },
      parasites: { total: 0, withImages: 0 },
      users: { total: 0, confirmed: 0 }
    };
  };

  // Server status indicator component
  const ServerStatusIndicator = () => (
    <div className="flex items-center gap-2 text-xs">
      {serverConnected ? (
        <>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-600 hidden sm:inline">Server Online</span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-red-600 hidden sm:inline">Server Issue</span>
        </>
      )}
    </div>
  );

  // Connection error banner
  const ConnectionErrorBanner = () => {
    if (serverConnected || !lastFetchError) return null;

    return (
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-yellow-800 text-sm">Connection Issue</h4>
            <p className="text-sm text-yellow-700 mt-1">{lastFetchError}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              onClick={fetchStats}
              variant="outline"
              size="sm"
              disabled={loading}
              className="h-8 text-xs bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats();
    }, 500);

    return () => clearTimeout(timer);
  }, [accessToken]);

  // Close mobile menu when tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setMobileMenuOpen(false);
  };

  // Tab configuration for mobile navigation
  const tabConfig = [
    { value: 'overview', label: 'Overview', icon: Database },
    { value: 'healthscan-api', label: 'HealthScan API', icon: ExternalLink },
    { value: 'users', label: 'Users', icon: Users },
    { value: 'nutrients', label: 'Nutrients', icon: Heart },
    { value: 'ingredients', label: 'Ingredients', icon: Leaf },
    { value: 'products', label: 'Products', icon: Package },
    { value: 'pollutants', label: 'Pollutants', icon: Zap },
    { value: 'scans', label: 'Scans', icon: Scan },
    { value: 'meals', label: 'Meals', icon: Utensils },
    { value: 'parasites', label: 'Parasites', icon: Bug },
    { value: 'referral-test', label: 'Referral Test', icon: Share2 },
    { value: 'theme', label: 'Theme', icon: Palette },
    { value: 'system', label: 'System', icon: Settings }
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Connection Error Banner */}
      <ConnectionErrorBanner />

      {/* Mobile-optimized Admin Header */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">
              Admin Dashboard
            </h1>
            <p className="text-sm lg:text-base text-gray-600 mt-1 truncate">
              Welcome back, {user?.email?.split('@')[0]} • Full access
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <ServerStatusIndicator />
            <Badge variant="default" className="bg-green-600 text-white">
              <Database className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Admin</span>
            </Badge>
            <Button 
              onClick={fetchStats} 
              variant="outline" 
              size="sm" 
              disabled={loading}
              className="h-10 w-10 p-0 sm:w-auto sm:px-3"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} ${window.innerWidth >= 640 ? 'mr-2' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Admin Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 lg:space-y-6">
        {/* Mobile Tab Navigation */}
        <div className="relative">
          {/* Mobile Menu Button */}
          <div className="block lg:hidden">
            <Button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              variant="outline"
              className="w-full h-12 justify-between"
            >
              <div className="flex items-center">
                {tabConfig.find(tab => tab.value === activeTab)?.icon && (
                  React.createElement(tabConfig.find(tab => tab.value === activeTab)!.icon, {
                    className: "h-4 w-4 mr-2"
                  })
                )}
                {tabConfig.find(tab => tab.value === activeTab)?.label}
              </div>
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                <div className="p-2 space-y-1">
                  {tabConfig.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.value}
                        onClick={() => handleTabChange(tab.value)}
                        className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                          activeTab === tab.value
                            ? 'bg-green-50 text-green-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Tab List */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <TabsList className="flex flex-wrap gap-1 h-auto p-1 w-full min-w-max">
                {tabConfig.map((tab) => (
                  <TabsTrigger 
                    key={tab.value}
                    value={tab.value} 
                    className="text-xs sm:text-sm whitespace-nowrap"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 lg:space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <Card className="p-3 lg:p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-lg lg:text-2xl font-bold">{stats.users?.total || 0}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {stats.users?.confirmed || 0} confirmed
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-3 lg:p-4">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 lg:h-5 lg:w-5 text-green-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Data Types</p>
                  <p className="text-lg lg:text-2xl font-bold">7</p>
                  <p className="text-xs text-gray-500">Active</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 lg:p-4">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 lg:h-5 lg:w-5 text-purple-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs lg:text-sm font-medium text-gray-600">HealthScan API</p>
                  <p className="text-lg lg:text-2xl font-bold">Live</p>
                  <p className="text-xs text-gray-500">Connected</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 lg:p-4">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 lg:h-5 lg:w-5 text-red-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Nutrients</p>
                  <p className="text-lg lg:text-2xl font-bold">{stats.nutrients?.total || 0}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {stats.nutrients?.withImages || 0} with images
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Access to HealthScan API */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">HealthScan API Integration</CardTitle>
              </div>
              <CardDescription>
                Access real-time data from the HealthScan production API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="font-medium text-green-800">API Status: Online</p>
                      <p className="text-sm text-green-600">https://api.healthscan.live</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setActiveTab('healthscan-api')}
                    variant="outline"
                    size="sm"
                    className="bg-green-100 border-green-300 text-green-800 hover:bg-green-200"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View API Data
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p><strong>Available Endpoints:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Nutrients database with detailed nutritional information</li>
                    <li>Ingredients catalog with allergen and health impact data</li>
                    <li>Products database with barcode and brand information</li>
                    <li>Pollutants data with toxicity levels and health effects</li>
                    <li>User scans and analysis results</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HealthScan API Tab */}
        <TabsContent value="healthscan-api" className="space-y-4 lg:space-y-6">
          <HealthScanApiDashboard accessToken={accessToken} />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4 lg:space-y-6">
          <UserManagement user={user} accessToken={accessToken} />
        </TabsContent>

        {/* Data Editor Tabs */}
        <TabsContent value="nutrients" className="space-y-4 lg:space-y-6">
          <NutrientEditor user={user} accessToken={accessToken} />
        </TabsContent>

        <TabsContent value="ingredients" className="space-y-4 lg:space-y-6">
          <IngredientEditor user={user} accessToken={accessToken} />
        </TabsContent>

        <TabsContent value="products" className="space-y-4 lg:space-y-6">
          <ProductEditor user={user} accessToken={accessToken} />
        </TabsContent>

        <TabsContent value="pollutants" className="space-y-4 lg:space-y-6">
          <PollutantEditor user={user} accessToken={accessToken} />
        </TabsContent>

        <TabsContent value="scans" className="space-y-4 lg:space-y-6">
          <ScanEditor user={user} accessToken={accessToken} />
        </TabsContent>

        <TabsContent value="meals" className="space-y-4 lg:space-y-6">
          <MealEditor user={user} accessToken={accessToken} />
        </TabsContent>

        <TabsContent value="parasites" className="space-y-4 lg:space-y-6">
          <ParasiteEditor user={user} accessToken={accessToken} />
        </TabsContent>

        {/* Referral Test Tab */}
        <TabsContent value="referral-test" className="space-y-4 lg:space-y-6">
          <ReferralLinkTester user={user} accessToken={accessToken} />
        </TabsContent>

        {/* Theme Tab */}
        <TabsContent value="theme" className="space-y-4 lg:space-y-6">
          <ThemeManager isAdmin={true} />
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4 lg:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-700">Database Status</p>
                    <p className="text-sm text-gray-600">
                      {serverConnected ? '✅ Connected' : '❌ Disconnected'}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-700">HealthScan API</p>
                    <p className="text-sm text-gray-600">✅ https://api.healthscan.live</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-700">Admin Access</p>
                    <p className="text-sm text-gray-600">✅ Full Permissions</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-700">Last Updated</p>
                    <p className="text-sm text-gray-600">{new Date().toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminDashboardWithHealthScanAPI;