import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Leaf, Database, Trash2, Upload, CheckCircle, AlertCircle, Info, ExternalLink, RefreshCw, Eye, Hash, Zap, Bug } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { seedNutrients, clearNutrients, getExistingNutrients, analyzeNutrientFormat, getSmartNutrientSeedData, formatIdDisplay } from "../utils/seedingUtils";
import { projectId } from "../utils/supabase/info";
import { ParasiteSeeder } from "./ParasiteSeeder";

interface DatabaseSeederProps {
  onClose?: () => void;
}

export function DatabaseSeeder({ onClose }: DatabaseSeederProps) {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [seedingProgress, setSeedingProgress] = useState(0);
  const [seedingStatus, setSeedingStatus] = useState<string>('');
  const [lastSeedResult, setLastSeedResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [existingAnalysis, setExistingAnalysis] = useState<any>(null);
  const [seedPreview, setSeedPreview] = useState<any[]>([]);

  useEffect(() => {
    analyzeExistingData();
  }, []);

  const analyzeExistingData = async () => {
    setIsAnalyzing(true);
    try {
      const existingNutrients = await getExistingNutrients();
      const analysis = analyzeNutrientFormat(existingNutrients);
      setExistingAnalysis(analysis);
      
      // Generate preview of what would be seeded
      const preview = getSmartNutrientSeedData(analysis).slice(0, 5);
      setSeedPreview(preview);
      
      console.log('📊 Database analysis complete:', analysis);
    } catch (error) {
      console.error('❌ Failed to analyze existing data:', error);
      toast.error('Failed to analyze existing database structure');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSeedNutrients = async () => {
    setIsSeeding(true);
    setSeedingProgress(0);
    setSeedingStatus('Preparing smart seeding...');
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSeedingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 200);

      setSeedingStatus('Analyzing existing database format...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSeedingStatus('Seeding nutrients with format adaptation...');
      const result = await seedNutrients();
      
      clearInterval(progressInterval);
      setSeedingProgress(100);
      setSeedingStatus('Smart seeding completed!');
      setLastSeedResult(result);
      
      // Refresh analysis after seeding
      if (result.success) {
        await analyzeExistingData();
      }
      
      if (result.success) {
        toast.success(`✅ ${result.message}`);
      } else {
        toast.error(`❌ ${result.message}`);
      }
    } catch (error) {
      setSeedingStatus('Smart seeding failed!');
      setLastSeedResult({
        success: false,
        message: `Unexpected error: ${error.message}`
      });
      toast.error(`💥 Seeding failed: ${error.message}`);
    } finally {
      setIsSeeding(false);
      setTimeout(() => {
        setSeedingProgress(0);
        setSeedingStatus('');
      }, 3000);
    }
  };

  const handleClearNutrients = async () => {
    if (!confirm('⚠️ Are you sure you want to clear ALL nutrients from the database? This action cannot be undone.')) {
      return;
    }
    
    setIsClearing(true);
    setSeedingStatus('Clearing nutrients from database...');
    
    try {
      const result = await clearNutrients();
      setLastSeedResult(result);
      
      // Refresh analysis after clearing
      await analyzeExistingData();
      
      if (result.success) {
        toast.success(`✅ ${result.message}`);
      } else {
        toast.error(`❌ ${result.message}`);
      }
    } catch (error) {
      setLastSeedResult({
        success: false,
        message: `Clear failed: ${error.message}`
      });
      toast.error(`💥 Clear failed: ${error.message}`);
    } finally {
      setIsClearing(false);
      setSeedingStatus('');
    }
  };

  const openSupabaseTable = () => {
    const supabaseUrl = `https://supabase.com/dashboard/project/${projectId}/editor/nutrients`;
    window.open(supabaseUrl, '_blank');
    toast.success('Opening nutrients table in Supabase');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold flex items-center space-x-2">
          <Database className="w-6 h-6 text-healthscan-green" />
          <span>Smart Database Seeder</span>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Zap className="w-3 h-3 mr-1" />
            Adaptive
          </Badge>
        </h1>
        <p className="text-gray-600 mt-1">
          Intelligently seed the database with scientific data that matches your existing format
        </p>
      </div>

      {/* Tabs for different data types */}
      <Tabs defaultValue="nutrients" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="nutrients" className="flex items-center space-x-2">
            <Leaf className="w-4 h-4" />
            <span>Nutrients</span>
          </TabsTrigger>
          <TabsTrigger value="parasites" className="flex items-center space-x-2">
            <Bug className="w-4 h-4" />
            <span>Parasites</span>
          </TabsTrigger>
        </TabsList>

        {/* Nutrients Tab */}
        <TabsContent value="nutrients" className="space-y-6">
          {/* Existing Database Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-blue-500" />
                <span>Current Database Analysis</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={analyzeExistingData}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAnalyzing ? (
                <div className="flex items-center space-x-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span>Analyzing existing database structure...</span>
                </div>
              ) : existingAnalysis ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {existingAnalysis.existingCount || 0}
                      </div>
                      <div className="text-sm text-blue-700">Existing Nutrients</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {existingAnalysis.fields?.length || 0}
                      </div>
                      <div className="text-sm text-green-700">Database Fields</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {existingAnalysis.hasData ? 'Detected' : 'Empty'}
                      </div>
                      <div className="text-sm text-purple-700">Database Status</div>
                    </div>
                  </div>

                  {existingAnalysis.hasData && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-blue-800 font-medium">Smart Seeding Status</p>
                          <p className="text-blue-700 text-sm mt-1">
                            Found existing nutrients in your database. The smart seeder will skip seeding to prevent 
                            duplicates. Use "Clear All Nutrients" first if you want to re-seed with fresh data.
                          </p>
                          <div className="mt-2">
                            <p className="text-blue-700 text-xs">
                              Detected fields: {existingAnalysis.fields?.slice(0, 5).join(', ')}
                              {existingAnalysis.fields?.length > 5 && ` + ${existingAnalysis.fields.length - 5} more...`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!existingAnalysis.hasData && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-green-800 font-medium">Ready for Smart Seeding</p>
                          <p className="text-green-700 text-sm mt-1">
                            Your nutrients table is empty and ready for seeding. The smart seeder will populate it with 
                            100 comprehensive nutrient records with numeric IDs and complete data fields.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Failed to analyze database structure
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seeding Preview */}
          {seedPreview.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Leaf className="w-5 h-5 text-green-500" />
                  <span>Seeding Preview</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {seedPreview.length} Sample Records
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  Preview of nutrients that will be seeded (showing first 5 of 100 total):
                </p>
                <div className="space-y-2">
                  {seedPreview.map((nutrient, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Badge variant="outline" className="bg-green-50 text-green-700 font-mono">
                        <Hash className="w-3 h-3 mr-1" />
                        {formatIdDisplay(nutrient.id)}
                      </Badge>
                      <div className="flex-1">
                        <span className="font-medium">{nutrient.name}</span>
                        <span className="text-gray-500 text-sm ml-2">({nutrient.category})</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {nutrient.id}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {nutrient.dailyValue} {nutrient.unit}
                      </Badge>
                    </div>
                  ))}
                  {seedPreview.length < 100 && (
                    <div className="text-center text-sm text-gray-500 py-2">
                      + {100 - seedPreview.length} more nutrients will be seeded...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Smart Seeding Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Leaf className="w-5 h-5 text-green-500" />
                <span>Smart Nutrient Seeding</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  100 Records Ready
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-blue-800 font-medium">About Smart Seeding</p>
                    <p className="text-blue-700 text-sm mt-1">
                      The smart seeder analyzes your existing database structure and adapts the seeding data to match. 
                      It uses numeric IDs (1, 2, 3...) for database storage while displaying them as formatted IDs 
                      (#01, #02, #03...) in the interface. Includes comprehensive nutrient information with scientific accuracy.
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {(isSeeding || seedingProgress > 0) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{seedingStatus}</span>
                    <span className="text-gray-500">{Math.round(seedingProgress)}%</span>
                  </div>
                  <Progress value={seedingProgress} className="h-2" />
                </div>
              )}

              {/* Last Result */}
              {lastSeedResult && (
                <div className={`border rounded-lg p-3 ${
                  lastSeedResult.success 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-center space-x-2">
                    {lastSeedResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      lastSeedResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {lastSeedResult.message}
                    </span>
                    {lastSeedResult.count && (
                      <Badge variant="outline" className="text-xs">
                        {lastSeedResult.count} records
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={handleSeedNutrients}
                  disabled={isSeeding || isClearing}
                  className="bg-healthscan-green hover:bg-healthscan-light-green"
                >
                  {isSeeding ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Smart Seeding...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Smart Seed Nutrients (100)
                    </>
                  )}
                </Button>

                <Button 
                  variant="outline"
                  onClick={handleClearNutrients}
                  disabled={isSeeding || isClearing || !existingAnalysis?.hasData}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {isClearing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All Nutrients
                    </>
                  )}
                </Button>

                <Button 
                  variant="outline"
                  onClick={openSupabaseTable}
                  disabled={isSeeding || isClearing}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View in Supabase
                </Button>

                <Button 
                  variant="outline"
                  onClick={analyzeExistingData}
                  disabled={isSeeding || isClearing || isAnalyzing}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Refresh Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parasites Tab */}
        <TabsContent value="parasites" className="space-y-6">
          <ParasiteSeeder />
        </TabsContent>
      </Tabs>
    </div>
  );
}