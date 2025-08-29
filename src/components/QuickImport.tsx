import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Globe, 
  Database, 
  Zap, 
  AlertTriangle,
  Info,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface QuickImportProps {
  onImportComplete?: (count: number) => void;
}

interface ImportSource {
  id: string;
  name: string;
  description: string;
  dataType: string;
  region: string;
  authority: string;
  isActive: boolean;
  isOfficial: boolean;
  estimatedRecords: number;
  icon: React.ComponentType<any>;
  color: string;
  status: 'ready' | 'maintenance' | 'limited' | 'mock';
}

const QUICK_IMPORT_SOURCES: ImportSource[] = [
  {
    id: 'usda-quick',
    name: 'USDA FoodData Central',
    description: 'US Department of Agriculture nutrition database',
    dataType: 'nutrients',
    region: 'USA',
    authority: 'USDA',
    isActive: true,
    isOfficial: true,
    estimatedRecords: 25,
    icon: Database,
    color: 'text-green-600',
    status: 'mock'
  },
  {
    id: 'openfood-quick',
    name: 'OpenFood Facts',
    description: 'Global collaborative food products database',
    dataType: 'products',
    region: 'Global',
    authority: 'Open Food Facts',
    isActive: true,
    isOfficial: false,
    estimatedRecords: 50,
    icon: Globe,
    color: 'text-emerald-600',
    status: 'mock'
  },
  {
    id: 'spoonacular-quick',
    name: 'Spoonacular API',
    description: 'Commercial food and recipe database',
    dataType: 'ingredients',
    region: 'Global',
    authority: 'Spoonacular',
    isActive: true,
    isOfficial: false,
    estimatedRecords: 20,
    icon: Zap,
    color: 'text-orange-500',
    status: 'mock'
  },
  {
    id: 'openaq-quick',
    name: 'OpenAQ Air Quality',
    description: 'Global air quality and pollutant data',
    dataType: 'pollutants',
    region: 'Global',
    authority: 'OpenAQ',
    isActive: true,
    isOfficial: false,
    estimatedRecords: 100,
    icon: AlertTriangle,
    color: 'text-orange-600',
    status: 'mock'
  }
];

export function QuickImport({ onImportComplete }: QuickImportProps) {
  const [importingSource, setImportingSource] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<Record<string, { success: boolean; count: number; message: string }>>({});

  const handleQuickImport = async (source: ImportSource) => {
    setImportingSource(source.id);
    setImportProgress(0);
    
    try {
      // Show initial progress
      setImportProgress(10);
      
      // Determine the appropriate endpoint
      let endpoint = '';
      let requestBody = {};
      
      switch (source.id) {
        case 'usda-quick':
          endpoint = `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/import-real-usda`;
          requestBody = { query: 'vitamin', limit: 25 };
          break;
        case 'openfood-quick':
          endpoint = `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/import`;
          requestBody = {
            source: 'openfood-facts',
            dataType: 'products',
            region: 'Global',
            authority: 'Open Food Facts'
          };
          break;
        case 'spoonacular-quick':
          endpoint = `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/import-real-spoonacular`;
          requestBody = { query: 'apple', limit: 20 };
          break;
        case 'openaq-quick':
          endpoint = `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/import-real-openaq`;
          requestBody = { country: 'US', limit: 100 };
          break;
        default:
          throw new Error(`No handler for source: ${source.id}`);
      }
      
      setImportProgress(30);
      
      console.log(`🔄 Starting quick import from ${source.name}...`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      setImportProgress(60);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Quick import failed: ${response.status} ${response.statusText}`, errorText);
        
        // Handle specific error cases
        if (response.status === 404) {
          throw new Error(`API endpoint not found - ${source.name} may be temporarily unavailable`);
        } else if (response.status === 500) {
          throw new Error(`Server error - ${source.name} service may be down`);
        } else {
          throw new Error(`Import failed: ${response.status} ${response.statusText}`);
        }
      }
      
      const result = await response.json();
      setImportProgress(90);
      
      // Simulate final progress
      setTimeout(() => {
        setImportProgress(100);
        
        const importedCount = result.imported || 0;
        const successMessage = importedCount > 0 
          ? `Successfully imported ${importedCount} ${source.dataType} from ${source.name}`
          : `Import completed but no new data was available from ${source.name}`;
        
        setImportResults(prev => ({
          ...prev,
          [source.id]: {
            success: true,
            count: importedCount,
            message: successMessage
          }
        }));
        
        if (importedCount > 0) {
          toast.success(`✅ ${successMessage}`);
        } else {
          toast.info(`📭 ${successMessage}`);
        }
        
        onImportComplete?.(importedCount);
        setImportingSource(null);
        setImportProgress(0);
      }, 500);
      
    } catch (error) {
      console.error(`❌ Quick import error for ${source.name}:`, error);
      
      setImportResults(prev => ({
        ...prev,
        [source.id]: {
          success: false,
          count: 0,
          message: error.message
        }
      }));
      
      // Provide user-friendly error messages
      let userMessage = error.message;
      if (userMessage.includes('404')) {
        userMessage = `${source.name} API is temporarily unavailable. Please try again later.`;
      } else if (userMessage.includes('500')) {
        userMessage = `${source.name} service is experiencing issues. Please try again later.`;
      } else if (userMessage.includes('not found')) {
        userMessage = `${source.name} service is not currently available.`;
      }
      
      toast.error(`❌ ${userMessage}`);
      
      setImportingSource(null);
      setImportProgress(0);
    }
  };

  const getStatusBadge = (source: ImportSource) => {
    const result = importResults[source.id];
    
    if (result) {
      return result.success ? (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          {result.count} imported
        </Badge>
      ) : (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    }
    
    switch (source.status) {
      case 'ready':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            ✅ Ready
          </Badge>
        );
      case 'mock':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            🔄 Mock Data
          </Badge>
        );
      case 'maintenance':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            🔧 Maintenance
          </Badge>
        );
      case 'limited':
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
            ⚠️ Limited
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Quick Import</h3>
          <p className="text-sm text-gray-600">
            Import data from trusted sources with one click
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          {QUICK_IMPORT_SOURCES.length} Sources Available
        </Badge>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-blue-800 font-medium">Demo Mode Active</p>
            <p className="text-blue-700 text-sm mt-1">
              Currently using mock data for demonstration. In production, this would connect to real APIs 
              including USDA FoodData Central, OpenFood Facts, and other official databases.
            </p>
          </div>
        </div>
      </div>

      {/* Import Sources */}
      <div className="grid gap-4">
        {QUICK_IMPORT_SOURCES.map((source) => {
          const Icon = source.icon;
          const isImporting = importingSource === source.id;
          const result = importResults[source.id];
          
          return (
            <Card key={source.id} className="transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${source.color}`} />
                    <div>
                      <CardTitle className="text-base">{source.name}</CardTitle>
                      <p className="text-sm text-gray-600">{source.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(source)}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Source Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Data Type:</span>
                      <span className="ml-2 capitalize">{source.dataType}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Region:</span>
                      <span className="ml-2">{source.region}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Authority:</span>
                      <span className="ml-2">{source.authority}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Records:</span>
                      <span className="ml-2">~{source.estimatedRecords}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {isImporting && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Importing {source.dataType}...</span>
                        <span>{Math.round(importProgress)}%</span>
                      </div>
                      <Progress value={importProgress} className="h-2" />
                    </div>
                  )}

                  {/* Result Message */}
                  {result && (
                    <div className={`text-sm p-2 rounded ${
                      result.success 
                        ? 'bg-green-50 text-green-800 border border-green-200' 
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {result.message}
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleQuickImport(source)}
                      disabled={!source.isActive || isImporting}
                      className="flex-1"
                      variant={source.isOfficial ? "default" : "outline"}
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Quick Import
                        </>
                      )}
                    </Button>
                    
                    {source.isOfficial && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://${source.authority.toLowerCase().replace(/\s+/g, '')}.gov`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      {Object.keys(importResults).length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Import Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(importResults).map(([sourceId, result]) => {
                const source = QUICK_IMPORT_SOURCES.find(s => s.id === sourceId);
                return (
                  <div key={sourceId} className="flex items-center justify-between text-sm">
                    <span>{source?.name || sourceId}</span>
                    <div className="flex items-center space-x-2">
                      {result.success ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span>{result.success ? `${result.count} imported` : 'Failed'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}