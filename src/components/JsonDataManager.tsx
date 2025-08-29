import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { toast } from "sonner@2.0.3";
import { Download, Upload, FileJson, FileSpreadsheet, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface JsonDataManagerProps {
  dataType: 'pollutants' | 'nutrients' | 'ingredients' | 'products' | 'parasites';
  onDataImported?: (count: number) => void;
  accessToken: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  warnings: string[];
  duplicates: number;
  updated: number;
}

interface ExportResult {
  success: boolean;
  data?: any[];
  filename?: string;
  error?: string;
}

export function JsonDataManager({ dataType, onDataImported, accessToken }: JsonDataManagerProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  // Handle file selection and reading
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Please select a JSON file');
      return;
    }

    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
      
      try {
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
          toast.success(`📄 Loaded JSON file with ${data.length} records`);
        } else {
          toast.warning('JSON file should contain an array of records');
        }
      } catch (error) {
        toast.error('Invalid JSON format');
        setFileContent('');
      }
    };
    
    reader.readAsText(file);
  }, []);

  // Import JSON data to server
  const handleImport = useCallback(async () => {
    if (!fileContent) {
      toast.error('Please select a JSON file first');
      return;
    }

    try {
      setIsImporting(true);
      setImportProgress(0);
      setImportResult(null);

      const data = JSON.parse(fileContent);
      if (!Array.isArray(data)) {
        throw new Error('JSON must contain an array of records');
      }

      console.log(`🚀 Starting import of ${data.length} ${dataType} records...`);

      // Send data in chunks for better performance
      const chunkSize = 50;
      let totalImported = 0;
      let totalErrors: string[] = [];
      let totalWarnings: string[] = [];
      let totalDuplicates = 0;
      let totalUpdated = 0;

      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        setImportProgress(Math.round((i / data.length) * 100));

        const response = await fetch(`https://mofhvoudjxinvpplsytd.supabase.co/functions/v1/make-server-ed0fe4c2/admin/import-json/${dataType}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            data: chunk,
            options: {
              updateExisting: true,
              validateSchema: true,
              generateImages: true,
              batchSize: chunkSize
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Import failed: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        if (result.success) {
          totalImported += result.imported || 0;
          totalDuplicates += result.duplicates || 0;
          totalUpdated += result.updated || 0;
          if (result.errors) totalErrors.push(...result.errors);
          if (result.warnings) totalWarnings.push(...result.warnings);
        }
      }

      setImportProgress(100);
      
      const finalResult: ImportResult = {
        success: true,
        imported: totalImported,
        errors: totalErrors,
        warnings: totalWarnings,
        duplicates: totalDuplicates,
        updated: totalUpdated
      };

      setImportResult(finalResult);
      
      toast.success(`✅ Successfully imported ${totalImported} ${dataType} records!`);
      onDataImported?.(totalImported);

    } catch (error) {
      console.error('Import error:', error);
      const errorResult: ImportResult = {
        success: false,
        imported: 0,
        errors: [error.message],
        warnings: [],
        duplicates: 0,
        updated: 0
      };
      setImportResult(errorResult);
      toast.error(`❌ Import failed: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  }, [fileContent, dataType, accessToken, onDataImported]);

  // Export data as JSON
  const handleJsonExport = useCallback(async () => {
    try {
      setIsExporting(true);
      
      const response = await fetch(`https://mofhvoudjxinvpplsytd.supabase.co/functions/v1/make-server-ed0fe4c2/admin/export-json/${dataType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const jsonContent = JSON.stringify(result.data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `healthscan_${dataType}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success(`📥 Downloaded ${result.data.length} ${dataType} records as JSON`);
      } else {
        throw new Error(result.error || 'Export failed');
      }

    } catch (error) {
      console.error('Export error:', error);
      toast.error(`❌ Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  }, [dataType, accessToken]);

  // Export data as CSV
  const handleCsvExport = useCallback(async () => {
    try {
      setIsExporting(true);
      
      const response = await fetch(`https://mofhvoudjxinvpplsytd.supabase.co/functions/v1/make-server-ed0fe4c2/admin/export/${dataType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`CSV export failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.content) {
        const blob = new Blob([result.content], { type: 'text/csv' });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename || `healthscan_${dataType}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success(`📊 Downloaded ${result.recordCount} ${dataType} records as CSV`);
      } else {
        throw new Error(result.error || 'CSV export failed');
      }

    } catch (error) {
      console.error('CSV export error:', error);
      toast.error(`❌ CSV export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  }, [dataType, accessToken]);

  // Generate example JSON structure
  const generateExampleJson = useCallback(() => {
    const examples = {
      pollutants: [
        {
          name: "Bisphenol A (BPA)",
          category: "Chemical Pollutants",
          type: "Endocrine Disruptor",
          toxicity_level: "Moderate",
          regulatory_limit: 0.05,
          unit: "mg/kg",
          description: "Chemical compound used in plastic production that can leach into food and beverages.",
          health_effects: ["Hormonal disruption", "Reproductive issues", "Cardiovascular effects"],
          sources: ["Plastic containers", "Canned foods", "Thermal receipts"],
          detection_methods: ["HPLC-MS/MS", "ELISA"],
          mitigation: ["Use BPA-free products", "Avoid heating plastic", "Choose glass containers"],
          cas_number: "80-05-7",
          molecular_formula: "C15H16O2",
          solubility: "Water soluble",
          persistence: "Moderate",
          bioaccumulation: "Low to moderate"
        }
      ],
      nutrients: [
        {
          name: "Vitamin A (Retinol)",
          vitamin_name: "Retinol / Carotenoid",
          category: "Vitamins",
          unit: "μg",
          rdi: 900,
          type: "Fat-soluble vitamin",
          description_text_simple: "Essential for vision, immune function, and cellular growth.",
          health_benefits: ["Improves Vision", "Immune Defence", "Cellular Growth"],
          food_strategy_animal: "Liver, fish, dairy products provide highly bioavailable forms.",
          food_strategy_plant: "Carrots, sweet potatoes, leafy greens provide beta-carotene."
        }
      ],
      ingredients: [
        {
          name: "Organic Quinoa",
          category: "Grains",
          type: "Whole Grain",
          description: "Complete protein grain with all essential amino acids.",
          allergens: [],
          nutritional_value: {
            protein: 14.1,
            fiber: 7.0,
            iron: 4.6
          },
          uses: ["Salads", "Side dishes", "Protein bowls"],
          benefits: ["Complete protein", "Gluten-free", "High fiber"]
        }
      ],
      products: [
        {
          name: "Organic Blueberry Yogurt",
          brand: "Nature Valley",
          category: "Dairy",
          type: "Yogurt",
          barcode: "123456789012",
          ingredients: ["Organic milk", "Organic blueberries", "Live cultures"],
          nutrition_facts: {
            calories: 150,
            protein: 12,
            carbs: 18,
            fat: 4
          },
          allergens: ["Milk"],
          serving_size: "1 cup (170g)"
        }
      ],
      parasites: [
        {
          name: "Giardia lamblia",
          scientific_name: "Giardia duodenalis",
          category: "Intestinal Parasites",
          type: "Protozoan",
          transmission: ["Contaminated water", "Person-to-person"],
          symptoms: ["Diarrhea", "Abdominal cramps", "Bloating"],
          prevention: ["Water purification", "Good hygiene"],
          treatment: ["Metronidazole", "Tinidazole"]
        }
      ]
    };

    const exampleData = examples[dataType] || [];
    const jsonContent = JSON.stringify(exampleData, null, 2);
    
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${dataType}_example_template.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`📋 Downloaded example ${dataType} JSON template`);
  }, [dataType]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="w-5 h-5 text-green-600" />
          JSON Data Manager - {dataType.charAt(0).toUpperCase() + dataType.slice(1)}
        </CardTitle>
        <CardDescription>
          Import data from JSON files or export existing data as JSON/CSV
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import Data</TabsTrigger>
            <TabsTrigger value="export">Export Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="json-file">Select JSON File</Label>
                <Input
                  id="json-file"
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="mt-2"
                />
                {fileName && (
                  <div className="mt-2 flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-600">{fileName}</span>
                  </div>
                )}
              </div>

              {fileContent && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    JSON file loaded successfully. Ready to import {JSON.parse(fileContent).length} records.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleImport}
                  disabled={!fileContent || isImporting}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {isImporting ? 'Importing...' : 'Import Data'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={generateExampleJson}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </Button>
              </div>

              {isImporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Import Progress</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="w-full" />
                </div>
              )}

              {importResult && (
                <div className="space-y-3">
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div>
                        <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                        <div className="text-sm text-gray-600">Imported</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{importResult.updated}</div>
                        <div className="text-sm text-gray-600">Updated</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</div>
                        <div className="text-sm text-gray-600">Duplicates</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <div>
                        <div className="text-2xl font-bold text-red-600">{importResult.errors.length}</div>
                        <div className="text-sm text-gray-600">Errors</div>
                      </div>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <div className="font-medium mb-2">Import Errors:</div>
                        <ul className="list-disc list-inside space-y-1">
                          {importResult.errors.slice(0, 5).map((error, i) => (
                            <li key={i} className="text-sm">{error}</li>
                          ))}
                          {importResult.errors.length > 5 && (
                            <li className="text-sm italic">...and {importResult.errors.length - 5} more errors</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {importResult.warnings.length > 0 && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <Info className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <div className="font-medium mb-2">Warnings:</div>
                        <ul className="list-disc list-inside space-y-1">
                          {importResult.warnings.slice(0, 3).map((warning, i) => (
                            <li key={i} className="text-sm">{warning}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="export" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileJson className="w-5 h-5 text-blue-600" />
                      JSON Export
                    </CardTitle>
                    <CardDescription>
                      Export as structured JSON for importing into other systems
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={handleJsonExport}
                      disabled={isExporting}
                      className="w-full flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {isExporting ? 'Exporting...' : 'Download JSON'}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileSpreadsheet className="w-5 h-5 text-green-600" />
                      CSV Export
                    </CardTitle>
                    <CardDescription>
                      Export as CSV for spreadsheet applications and analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={handleCsvExport}
                      disabled={isExporting}
                      className="w-full flex items-center gap-2"
                      variant="outline"
                    >
                      <Download className="w-4 h-4" />
                      {isExporting ? 'Exporting...' : 'Download CSV'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Export Information:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>JSON exports include all record fields and metadata</li>
                    <li>CSV exports are formatted for spreadsheet compatibility</li>
                    <li>All exports include current data with timestamps</li>
                    <li>Files are named with the current date for organization</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}