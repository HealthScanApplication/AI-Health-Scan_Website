import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw, 
  Wand2,
  Merge,
  BarChart3,
  Eye,
  Database,
  ImageIcon,
  Settings,
  FileText,
  Target,
  Zap
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface QualityAnalysisItem {
  id: string;
  name: string;
  category: string;
  completeness: number;
  dataQuality: number;
  missingFields: string[];
  emptyFields: string[];
  presentFields: number;
  totalExpected: number;
}

interface DuplicateGroup {
  name: string;
  count: number;
  records: Array<{
    id: string;
    category: string;
    source: string;
  }>;
}

interface QualitySummary {
  totalNutrients: number;
  averageCompleteness: number;
  averageDataQuality: number;
  duplicateGroups: number;
  totalDuplicates: number;
  needsStandardization: number;
}

interface QualityAnalysisData {
  summary: QualitySummary;
  qualityAnalysis: QualityAnalysisItem[];
  duplicates: DuplicateGroup[];
  needsStandardization: QualityAnalysisItem[];
  expectedFields: string[];
}

interface StandardizationResult {
  standardized: number;
  enhanced: number;
  total: number;
  errors: string[];
  processedRecords: Array<{
    id: string;
    name: string;
    category: string;
    enhanced: boolean;
  }>;
}

interface MergeResult {
  merged: number;
  deleted: number;
  duplicateGroups: number;
  finalCount: number;
  mergeResults: Array<{
    name: string;
    primaryId: string;
    mergedIds: string[];
    totalMerged: number;
  }>;
  errors: string[];
}

interface TargetNutrient {
  id: string;
  name: string;
  structure: string[];
}

interface FieldDefinition {
  label: string;
  description: string;
  type: string;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  example: string;
  helpText: string;
}

interface NutrientDataStandardizationProps {
  onDataChanged?: () => void;
}

export function NutrientDataStandardization({ onDataChanged }: NutrientDataStandardizationProps) {
  const [qualityData, setQualityData] = useState<QualityAnalysisData | null>(null);
  const [targetNutrient, setTargetNutrient] = useState<TargetNutrient | null>(null);
  const [fieldDefinitions, setFieldDefinitions] = useState<Record<string, FieldDefinition> | null>(null);
  const [standardizationResult, setStandardizationResult] = useState<StandardizationResult | null>(null);
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [standardizing, setStandardizing] = useState(false);
  const [merging, setMerging] = useState(false);
  const [activeTab, setActiveTab] = useState('analysis');

  const fetchTargetNutrient = async () => {
    try {
      console.log('🎯 Fetching target nutrient record...');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/nutrient/nutrient_1753991765711_0`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTargetNutrient({
            id: result.nutrient.id,
            name: result.nutrient.name,
            structure: result.structure
          });
          console.log('✅ Target nutrient loaded:', result.nutrient.name);
        }
      }
    } catch (error: any) {
      console.error('❌ Target nutrient fetch error:', error);
    }
  };

  const fetchFieldDefinitions = async () => {
    try {
      console.log('📋 Fetching field definitions...');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/field-definitions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setFieldDefinitions(result.fieldDefinitions);
          console.log('✅ Field definitions loaded:', Object.keys(result.fieldDefinitions).length);
        }
      }
    } catch (error: any) {
      console.error('❌ Field definitions fetch error:', error);
    }
  };

  const analyzeQuality = async () => {
    try {
      setAnalyzing(true);
      console.log('🔬 Analyzing nutrient data quality...');

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/analyze-nutrient-quality`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze quality: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setQualityData(result);
        toast.success(`✅ Quality analysis completed: ${result.summary.totalNutrients} nutrients analyzed`);
        console.log('✅ Quality analysis completed:', result.summary);
      } else {
        throw new Error(result.error || 'Failed to analyze nutrient quality');
      }
    } catch (error: any) {
      console.error('❌ Quality analysis error:', error);
      toast.error(`❌ Analysis failed: ${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const standardizeNutrients = async () => {
    const confirmed = confirm(
      `🔧 This will standardize and enhance all nutrient records with:\n\n` +
      `• Complete field standardization\n` +
      `• High-quality images\n` +
      `• Enhanced scientific data\n` +
      `• Consistent formatting\n\n` +
      `This may take several minutes. Continue?`
    );

    if (!confirmed) return;

    try {
      setStandardizing(true);
      console.log('🔧 Starting nutrient standardization...');

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/standardize-nutrients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to standardize: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setStandardizationResult(result);
        
        // Refresh quality analysis
        await analyzeQuality();
        
        // Call the callback to refresh parent components
        if (onDataChanged) {
          onDataChanged();
        }
        
        let message = `✅ Standardized ${result.standardized} nutrients!`;
        if (result.enhanced > 0) {
          message += `\n\n🌟 Enhanced ${result.enhanced} records with detailed scientific data`;
        }
        if (result.errors.length > 0) {
          message += `\n\n⚠️ ${result.errors.length} errors occurred`;
        }
        
        toast.success(message);
        console.log('✅ Standardization completed:', result);
      } else {
        throw new Error(result.error || 'Failed to standardize nutrients');
      }
    } catch (error: any) {
      console.error('❌ Standardization error:', error);
      toast.error(`❌ Standardization failed: ${error.message}`);
    } finally {
      setStandardizing(false);
    }
  };

  const mergeDuplicates = async () => {
    if (!qualityData || qualityData.duplicates.length === 0) {
      toast.error('No duplicates found to merge');
      return;
    }

    const confirmed = confirm(
      `🔀 This will intelligently merge ${qualityData.duplicates.length} duplicate groups:\n\n` +
      `• Combines the best data from each duplicate\n` +
      `• Keeps the highest quality record as primary\n` +
      `• Merges sources, benefits, and other arrays\n` +
      `• Permanently deletes duplicate records\n\n` +
      `This action cannot be undone. Continue?`
    );

    if (!confirmed) return;

    try {
      setMerging(true);
      console.log('🔀 Starting duplicate merger...');

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/merge-duplicate-nutrients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to merge duplicates: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setMergeResult(result);
        
        // Refresh quality analysis
        await analyzeQuality();
        
        // Call the callback to refresh parent components
        if (onDataChanged) {
          onDataChanged();
        }
        
        let message = `✅ Merged ${result.merged} duplicate groups!`;
        message += `\n\n🗑️ Removed ${result.deleted} duplicate records`;
        if (result.errors.length > 0) {
          message += `\n\n⚠️ ${result.errors.length} errors occurred`;
        }
        
        toast.success(message);
        console.log('✅ Duplicate merger completed:', result);
      } else {
        throw new Error(result.error || 'Failed to merge duplicates');
      }
    } catch (error: any) {
      console.error('❌ Duplicate merger error:', error);
      toast.error(`❌ Merge failed: ${error.message}`);
    } finally {
      setMerging(false);
    }
  };

  const getQualityColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBadgeVariant = (percentage: number) => {
    if (percentage >= 90) return 'default';
    if (percentage >= 70) return 'secondary';
    return 'destructive';
  };

  // Load data on mount
  useEffect(() => {
    fetchTargetNutrient();
    fetchFieldDefinitions();
    analyzeQuality();
  }, []);

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-blue-800">
          <Database className="h-5 w-5" />
          <span>Nutrient Data Standardization</span>
          {qualityData && (
            <Badge variant="outline" className="ml-2">
              {qualityData.summary.totalNutrients} records
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-blue-600">
          Analyze, standardize, and enhance nutrient records with comprehensive data quality management
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analysis" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="standardization" className="flex items-center space-x-2">
              <Wand2 className="h-4 w-4" />
              <span>Standardize</span>
            </TabsTrigger>
            <TabsTrigger value="duplicates" className="flex items-center space-x-2">
              <Merge className="h-4 w-4" />
              <span>Duplicates</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Results</span>
            </TabsTrigger>
          </TabsList>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-blue-800">Data Quality Analysis</h4>
              <Button
                onClick={analyzeQuality}
                disabled={analyzing}
                size="sm"
                variant="outline"
                className="flex items-center space-x-2"
              >
                {analyzing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <BarChart3 className="h-4 w-4" />
                )}
                <span>{analyzing ? 'Analyzing...' : 'Refresh Analysis'}</span>
              </Button>
            </div>

            {/* Target Nutrient & Field Definitions Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {targetNutrient && (
                <Alert className="border-green-200 bg-green-50">
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium text-green-800">
                        Target Standard: {targetNutrient.name}
                      </p>
                      <p className="text-sm text-green-600">
                        Using this record as the quality standard with {targetNutrient.structure.length} fields
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {fieldDefinitions && (
                <Alert className="border-purple-200 bg-purple-50">
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium text-purple-800">
                        Field Definitions: {Object.keys(fieldDefinitions).length} rules
                      </p>
                      <p className="text-sm text-purple-600">
                        Validation rules and constraints loaded for standardization
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Quality Summary */}
            {qualityData ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">Data Completeness</span>
                    <Badge variant={getQualityBadgeVariant(qualityData.summary.averageCompleteness)}>
                      {qualityData.summary.averageCompleteness}%
                    </Badge>
                  </div>
                  <Progress value={qualityData.summary.averageCompleteness} className="h-2" />
                  <p className="text-xs text-gray-600 mt-1">
                    Average field completeness across all nutrients
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">Data Quality</span>
                    <Badge variant={getQualityBadgeVariant(qualityData.summary.averageDataQuality)}>
                      {qualityData.summary.averageDataQuality}%
                    </Badge>
                  </div>
                  <Progress value={qualityData.summary.averageDataQuality} className="h-2" />
                  <p className="text-xs text-gray-600 mt-1">
                    Average data quality (non-empty fields)
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">Issues Found</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{qualityData.duplicates.length} duplicates</Badge>
                      <Badge variant="destructive">{qualityData.summary.needsStandardization} need work</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    Records requiring standardization or duplicate resolution
                  </p>
                </div>
              </div>
            ) : analyzing ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : null}

            {/* Records Needing Attention */}
            {qualityData && qualityData.needsStandardization.length > 0 && (
              <div className="space-y-3">
                <h5 className="font-medium text-blue-800">Records Needing Standardization</h5>
                <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3 bg-white">
                  {qualityData.needsStandardization.slice(0, 10).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-2 border rounded bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm truncate">{record.name}</span>
                          <Badge variant="outline" className="text-xs">{record.category}</Badge>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <span>Completeness: {record.completeness}%</span>
                          <span>Quality: {record.dataQuality}%</span>
                          <span>Missing: {record.missingFields.length} fields</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getQualityBadgeVariant(record.completeness)} className="text-xs">
                          {record.completeness}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {qualityData.needsStandardization.length > 10 && (
                    <div className="text-center p-2 text-sm text-gray-500 border-t">
                      ... and {qualityData.needsStandardization.length - 10} more records
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Standardization Tab */}
          <TabsContent value="standardization" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-blue-800">Data Standardization</h4>
                <Button
                  onClick={standardizeNutrients}
                  disabled={standardizing || analyzing}
                  size="sm"
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                >
                  {standardizing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  <span>{standardizing ? 'Standardizing...' : 'Standardize All Nutrients'}</span>
                </Button>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-3">
                    <p className="font-medium text-blue-800">Standardization Process:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-blue-600">
                      <li><strong>Field Completion:</strong> Ensures all records have complete field sets</li>
                      <li><strong>Validation Rules:</strong> Applies character limits, format requirements, and data types</li>
                      <li><strong>Image Enhancement:</strong> Adds high-quality, category-specific images</li>
                      <li><strong>Scientific Data:</strong> Enhances with verified nutritional information</li>
                      <li><strong>Quality Scoring:</strong> Assigns quality scores and verification status</li>
                      <li><strong>Format Consistency:</strong> Standardizes units, descriptions, and formatting</li>
                    </ul>
                    {qualityData && fieldDefinitions && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                        <div>
                          <span className="font-medium">Total Records: </span>
                          <Badge variant="outline">{qualityData.summary.totalNutrients}</Badge>
                        </div>
                        <div>
                          <span className="font-medium">Need Standardization: </span>
                          <Badge variant="destructive">{qualityData.summary.needsStandardization}</Badge>
                        </div>
                        <div>
                          <span className="font-medium">Field Rules: </span>
                          <Badge variant="secondary">{Object.keys(fieldDefinitions).length}</Badge>
                        </div>
                        <div>
                          <span className="font-medium">Required Fields: </span>
                          <Badge variant="default">
                            {Object.values(fieldDefinitions).filter(def => def.required).length}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {standardizationResult && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <p className="font-medium text-green-800">
                        ✅ Standardization completed successfully!
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Standardized: </span>
                          <Badge variant="default">{standardizationResult.standardized}</Badge>
                        </div>
                        <div>
                          <span className="font-medium">Enhanced: </span>
                          <Badge variant="secondary">{standardizationResult.enhanced}</Badge>
                        </div>
                        <div>
                          <span className="font-medium">Total Processed: </span>
                          <Badge variant="outline">{standardizationResult.total}</Badge>
                        </div>
                        <div>
                          <span className="font-medium">Errors: </span>
                          <Badge variant={standardizationResult.errors.length > 0 ? "destructive" : "default"}>
                            {standardizationResult.errors.length}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          {/* Duplicates Tab */}
          <TabsContent value="duplicates" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-blue-800">Duplicate Management</h4>
                <Button
                  onClick={mergeDuplicates}
                  disabled={merging || analyzing || !qualityData?.duplicates.length}
                  size="sm"
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  {merging ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Merge className="h-4 w-4" />
                  )}
                  <span>{merging ? 'Merging...' : 'Smart Merge Duplicates'}</span>
                </Button>
              </div>

              {qualityData && qualityData.duplicates.length > 0 ? (
                <div className="space-y-3">
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium text-orange-800">
                        Found {qualityData.duplicates.length} duplicate groups with {qualityData.summary.totalDuplicates} total records
                      </p>
                      <p className="text-sm text-orange-600 mt-1">
                        Smart merge will combine the best data from each duplicate group
                      </p>
                    </AlertDescription>
                  </Alert>

                  <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3 bg-white">
                    {qualityData.duplicates.map((group, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm truncate capitalize">{group.name}</span>
                            <Badge variant="destructive" className="text-xs">{group.count} duplicates</Badge>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            {group.records.map((record, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {record.category}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {group.records.length} records
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium text-green-800">
                      ✅ No duplicate records found!
                    </p>
                    <p className="text-sm text-green-600">
                      All nutrient records have unique names
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {mergeResult && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <p className="font-medium text-green-800">
                        ✅ Duplicate merge completed successfully!
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Groups Merged: </span>
                          <Badge variant="default">{mergeResult.merged}</Badge>
                        </div>
                        <div>
                          <span className="font-medium">Records Deleted: </span>
                          <Badge variant="destructive">{mergeResult.deleted}</Badge>
                        </div>
                        <div>
                          <span className="font-medium">Final Count: </span>
                          <Badge variant="outline">{mergeResult.finalCount}</Badge>
                        </div>
                        <div>
                          <span className="font-medium">Errors: </span>
                          <Badge variant={mergeResult.errors.length > 0 ? "destructive" : "default"}>
                            {mergeResult.errors.length}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-medium text-blue-800">Operation Results</h4>

              {/* Overall Progress Summary */}
              {qualityData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border bg-white">
                    <h5 className="font-medium text-gray-900 mb-3">Quality Metrics</h5>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Completeness</span>
                          <span className={getQualityColor(qualityData.summary.averageCompleteness)}>
                            {qualityData.summary.averageCompleteness}%
                          </span>
                        </div>
                        <Progress value={qualityData.summary.averageCompleteness} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Data Quality</span>
                          <span className={getQualityColor(qualityData.summary.averageDataQuality)}>
                            {qualityData.summary.averageDataQuality}%
                          </span>
                        </div>
                        <Progress value={qualityData.summary.averageDataQuality} className="h-2" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border bg-white">
                    <h5 className="font-medium text-gray-900 mb-3">Database Health</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Records:</span>
                        <Badge variant="outline">{qualityData.summary.totalNutrients}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Need Attention:</span>
                        <Badge variant={qualityData.summary.needsStandardization > 0 ? "destructive" : "default"}>
                          {qualityData.summary.needsStandardization}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Duplicate Groups:</span>
                        <Badge variant={qualityData.duplicates.length > 0 ? "destructive" : "default"}>
                          {qualityData.duplicates.length}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Operations */}
              <div className="space-y-3">
                <h5 className="font-medium text-blue-800">Recent Operations</h5>
                
                {standardizationResult && (
                  <div className="p-3 rounded-lg border border-green-200 bg-green-50">
                    <div className="flex items-center space-x-2 mb-2">
                      <Wand2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Standardization Complete</span>
                    </div>
                    <p className="text-sm text-green-600">
                      Enhanced {standardizationResult.standardized} records with {standardizationResult.enhanced} receiving detailed scientific data
                    </p>
                  </div>
                )}

                {mergeResult && (
                  <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
                    <div className="flex items-center space-x-2 mb-2">
                      <Merge className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Duplicate Merge Complete</span>
                    </div>
                    <p className="text-sm text-blue-600">
                      Merged {mergeResult.merged} duplicate groups, removed {mergeResult.deleted} redundant records
                    </p>
                  </div>
                )}

                {!standardizationResult && !mergeResult && (
                  <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <p className="text-sm text-gray-600">
                      No operations completed yet. Run analysis and standardization to see results here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}