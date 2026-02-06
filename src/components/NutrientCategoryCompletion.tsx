import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  RefreshCw, 
  Target,
  TrendingUp,
  Zap,
  Leaf,
  Dna,
  Gem,
  Droplets,
  Pill,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface CategoryCompletion {
  category: string;
  current: number;
  target: number;
  percentage: number;
  completed: boolean;
}

interface CompletionData {
  completion: CategoryCompletion[];
  totals: {
    current: number;
    target: number;
    percentage: number;
  };
  categories: Record<string, number>;
  targets: Record<string, number>;
}

interface CreationResult {
  created: number;
  updated: number;
  skipped: number;
  total: number;
  finalCount: number;
  errors: string[];
  message: string;
  categoryBreakdown: Record<string, number>;
}

interface NutrientCategoryCompletionProps {
  onDataChanged?: () => void;
}

export function NutrientCategoryCompletion({ onDataChanged }: NutrientCategoryCompletionProps) {
  const [completionData, setCompletionData] = useState<CompletionData | null>(null);
  const [creationResult, setCreationResult] = useState<CreationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Category display configuration
  const categoryConfig = {
    phytonutrients: {
      label: 'Phytonutrients',
      icon: Leaf,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    amino_acids: {
      label: 'Amino Acids',
      icon: Dna,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    minerals: {
      label: 'Minerals',
      icon: Gem,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    fatty_acids: {
      label: 'Fatty Acids',
      icon: Droplets,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    vitamins: {
      label: 'Vitamins',
      icon: Pill,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    enzymes: {
      label: 'Enzymes',
      icon: Activity,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    }
  };

  const fetchCompletion = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching nutrient category completion...');

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/nutrient-category-completion`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch completion: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setCompletionData(result);
        console.log('✅ Completion data loaded:', result);
      } else {
        throw new Error(result.error || 'Failed to fetch completion data');
      }
    } catch (error: any) {
      console.error('❌ Completion fetch error:', error);
      toast.error(`❌ Failed to load completion data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNutrients = async () => {
    const confirmed = confirm(
      `🧬 This will create comprehensive nutrient records for all 98 specified nutrients across 6 categories.\n\n` +
      `This includes detailed scientific data for phytonutrients, amino acids, minerals, fatty acids, vitamins, and enzymes.\n\n` +
      `Continue with creation?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setCreating(true);
      console.log('🧬 Creating comprehensive nutrient records...');

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/create-comprehensive-nutrients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to create nutrients: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setCreationResult(result);
        
        // Refresh completion data
        await fetchCompletion();
        
        // Call the callback to refresh parent components
        if (onDataChanged) {
          onDataChanged();
        }
        
        let message = `✅ Successfully processed ${result.created + result.updated} nutrient records!`;
        if (result.created > 0) {
          message += `\n\n🆕 Created ${result.created} new records`;
        }
        if (result.updated > 0) {
          message += `\n\n🔄 Updated ${result.updated} existing records`;
        }
        if (result.skipped > 0) {
          message += `\n\n⏭️ Skipped ${result.skipped} unchanged records`;
        }
        if (result.errors.length > 0) {
          message += `\n\n⚠️ ${result.errors.length} errors occurred`;
        }
        
        toast.success(message);
        console.log('✅ Nutrient creation completed:', result);
      } else {
        throw new Error(result.error || 'Failed to create nutrients');
      }
    } catch (error: any) {
      console.error('❌ Creation error:', error);
      toast.error(`❌ Creation failed: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleRefresh = async () => {
    setCreationResult(null);
    await fetchCompletion();
  };

  // Load data on mount
  useEffect(() => {
    fetchCompletion();
  }, []);

  if (loading && !completionData) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-green-800">
          <Target className="h-5 w-5" />
          <span>Nutrient Category Completion</span>
          {completionData && (
            <Badge variant="outline" className="ml-2">
              {completionData.totals.current}/{completionData.totals.target} ({completionData.totals.percentage}%)
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-green-600">
          Progress toward comprehensive nutrient database with 98 essential nutrients across 6 categories
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Progress */}
        {completionData && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-green-800">Overall Progress</span>
              <span className="text-sm font-medium text-green-700">
                {completionData.totals.current} of {completionData.totals.target} nutrients
              </span>
            </div>
            <Progress 
              value={completionData.totals.percentage} 
              className="h-3"
            />
            <div className="flex items-center space-x-4 text-sm text-green-600">
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4" />
                <span>{completionData.totals.percentage}% Complete</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>{completionData.completion.filter(c => c.completed).length} Categories Complete</span>
              </div>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {completionData && (
          <div className="space-y-4">
            <h4 className="font-medium text-green-800 flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Category Breakdown</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completionData.completion.map((category) => {
                const config = categoryConfig[category.category as keyof typeof categoryConfig];
                const Icon = config.icon;
                
                return (
                  <div 
                    key={category.category}
                    className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        <span className="font-medium text-gray-900">{config.label}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {category.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400" />
                        )}
                        <Badge 
                          variant={category.completed ? "default" : "outline"}
                          className="text-xs"
                        >
                          {category.current}/{category.target}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Progress 
                        value={category.percentage} 
                        className="h-2"
                      />
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{category.percentage}% complete</span>
                        <span>{category.target - category.current} remaining</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-4 border-t border-green-200">
          <Button
            onClick={handleCreateNutrients}
            disabled={creating || loading}
            size="sm"
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
          >
            {creating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span>{creating ? 'Creating Nutrients...' : 'Create Comprehensive Nutrients'}</span>
          </Button>

          <Button
            onClick={handleRefresh}
            disabled={loading || creating}
            size="sm"
            variant="outline"
            className="flex items-center space-x-2"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>

        {/* Creation Results */}
        {creationResult && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-medium text-green-800">{creationResult.message}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Created: </span>
                    <Badge variant="default">{creationResult.created}</Badge>
                  </div>
                  <div>
                    <span className="font-medium">Updated: </span>
                    <Badge variant="secondary">{creationResult.updated}</Badge>
                  </div>
                  <div>
                    <span className="font-medium">Skipped: </span>
                    <Badge variant="outline">{creationResult.skipped}</Badge>
                  </div>
                  <div>
                    <span className="font-medium">Total Processed: </span>
                    <Badge variant="secondary">{creationResult.total}</Badge>
                  </div>
                  <div>
                    <span className="font-medium">Final Count: </span>
                    <Badge variant="default">{creationResult.finalCount}</Badge>
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="space-y-2">
                  <h5 className="font-medium text-green-800">Created by Category:</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {Object.entries(creationResult.categoryBreakdown).map(([category, count]) => {
                      const config = categoryConfig[category as keyof typeof categoryConfig];
                      return (
                        <div key={category} className="flex items-center space-x-2">
                          <span className="capitalize">{config?.label || category}:</span>
                          <Badge variant="outline" className="text-xs">{count}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {creationResult.errors.length > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs font-medium text-yellow-800 mb-1">
                      ⚠️ {creationResult.errors.length} errors occurred:
                    </p>
                    <div className="text-xs text-yellow-700 space-y-1 max-h-20 overflow-y-auto">
                      {creationResult.errors.map((error, index) => (
                        <div key={index}>{error}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Usage Instructions */}
        {!creationResult && (
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Comprehensive Nutrient Database:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Phytonutrients (25):</strong> Plant-based compounds like quercetin, curcumin, and resveratrol</li>
              <li><strong>Amino Acids (20):</strong> Essential and non-essential protein building blocks</li>
              <li><strong>Minerals (16):</strong> Essential trace elements like zinc, magnesium, and selenium</li>
              <li><strong>Fatty Acids (15):</strong> Omega-3, omega-6, and other essential fats</li>
              <li><strong>Vitamins (13):</strong> All essential vitamins A through K2</li>
              <li><strong>Enzymes (9):</strong> Digestive enzymes like protease, amylase, and lipase</li>
            </ul>
            <p className="text-green-600 font-medium">
              🧬 Click "Create Comprehensive Nutrients" to populate your database with 98 scientifically accurate nutrient records!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}