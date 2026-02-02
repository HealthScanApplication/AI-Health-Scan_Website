import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { JsonDataManager } from './JsonDataManager';
import { RecordsViewModal } from './RecordsViewModal';
import { toast } from "sonner@2.0.3";
import { 
  Database, 
  FileJson, 
  Upload, 
  Download, 
  Eye, 
  RefreshCw,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface AdminDataManagerProps {
  accessToken: string;
  user: any;
}

interface DataTypeStats {
  name: string;
  count: number;
  lastUpdate: string | null;
  status: 'healthy' | 'warning' | 'error';
}

const DATA_TYPES = [
  { key: 'nutrients', label: 'Nutrients (Beneficial)', icon: '�', table: 'catalog_elements', category: 'beneficial', description: 'Health-promoting elements' },
  { key: 'ingredients', label: 'Ingredients', icon: '�', table: 'catalog_ingredients', category: null, description: 'Food ingredients and components' },
  { key: 'pollutants', label: 'Pollutants (Hazardous)', icon: '⚠️', table: 'catalog_elements', category: 'hazardous', description: 'Environmental contaminants and toxins' },
  { key: 'products', label: 'Recipes/Meals', icon: '📦', table: 'catalog_recipes', category: null, description: 'Prepared foods and recipes' },
  { key: 'parasites', label: 'Parasites (Hazardous)', icon: '🦠', table: 'catalog_elements', category: 'hazardous', description: 'Parasites and pathogens' }
] as const;

export function AdminDataManager({ accessToken, user }: AdminDataManagerProps) {
  const [stats, setStats] = useState<Record<string, DataTypeStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDataType, setSelectedDataType] = useState<string>('pollutants');
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Fetch statistics for all data types
  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`https://mofhvoudjxinvpplsytd.supabase.co/functions/v1/make-server-ed0fe4c2/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.detailedStats) {
          const newStats: Record<string, DataTypeStats> = {};
          
          DATA_TYPES.forEach(({ key, label }) => {
            const stat = data.detailedStats[key] || data.detailedStats[key + 's'];
            newStats[key] = {
              name: label,
              count: stat?.current || 0,
              lastUpdate: stat?.lastImport || null,
              status: stat?.current > 0 ? 'healthy' : 'warning'
            };
          });
          
          setStats(newStats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load data statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [accessToken]);

  const handleDataImported = (count: number) => {
    toast.success(`🎉 Successfully imported ${count} records!`);
    fetchStats(); // Refresh stats after import
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
            <span className="ml-2">Loading data statistics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Type Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {DATA_TYPES.map(({ key, label, icon, description }) => {
          const stat = stats[key];
          return (
            <Card 
              key={key}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedDataType === key ? 'ring-2 ring-green-500 bg-green-50' : ''
              }`}
              onClick={() => setSelectedDataType(key)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{icon}</span>
                  {stat && getStatusIcon(stat.status)}
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-600">
                    {stat?.count || 0}
                  </div>
                  <div className="text-sm font-medium text-gray-900">{label}</div>
                  <div className="text-xs text-gray-500 line-clamp-2">
                    {description}
                  </div>
                  {stat?.lastUpdate && (
                    <div className="text-xs text-gray-400">
                      Updated: {new Date(stat.lastUpdate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Data Type Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-green-600" />
                {DATA_TYPES.find(t => t.key === selectedDataType)?.label} Management
              </CardTitle>
              <CardDescription>
                Import, export, and manage {selectedDataType} data using JSON files
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(stats[selectedDataType]?.status || 'warning')}>
                {stats[selectedDataType]?.count || 0} records
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Records
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="manage" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manage">JSON Management</TabsTrigger>
              <TabsTrigger value="info">Data Information</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manage">
              <JsonDataManager
                dataType={selectedDataType as any}
                onDataImported={handleDataImported}
                accessToken={accessToken}
              />
            </TabsContent>
            
            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Data Structure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div><strong>Format:</strong> JSON Array</div>
                      <div><strong>Required Fields:</strong> name, category</div>
                      <div><strong>Optional Fields:</strong> description, sources, health_effects</div>
                      <div><strong>Auto-generated:</strong> id, timestamps, image_url</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Import Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div><strong>Update Existing:</strong> Updates records with same name</div>
                      <div><strong>Schema Validation:</strong> Validates required fields</div>
                      <div><strong>Image Generation:</strong> Creates placeholder images</div>
                      <div><strong>Batch Processing:</strong> Imports in chunks of 50</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Best Practices:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Download the template first to see the expected format</li>
                    <li>Validate your JSON before importing</li>
                    <li>Include comprehensive health_effects and sources arrays</li>
                    <li>Use consistent naming conventions</li>
                    <li>Test with small batches before large imports</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Records View Modal */}
      {viewModalOpen && (
        <RecordsViewModal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          dataType={selectedDataType}
          accessToken={accessToken}
          title={`${DATA_TYPES.find(t => t.key === selectedDataType)?.label} Records`}
        />
      )}
    </div>
  );
}