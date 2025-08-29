import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { 
  Trash2, 
  Eye, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  Calendar,
  Tag,
  Database
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ExtendedRecord {
  id: string;
  name: string;
  category: string;
  description: string;
  source: string;
  imported_at: string;
}

interface PreviewData {
  totalNutrients: number;
  extendedCount: number;
  previewRecords: ExtendedRecord[];
  message: string;
}

interface RemovalResult {
  removed: number;
  total: number;
  message: string;
  details: {
    originalTotal: number;
    remainingTotal: number;
    extendedFound: number;
    removedRecords: Array<{
      id: string;
      name: string;
      category: string;
    }>;
    errors: string[];
  };
}

interface ExtendedNutrientsCleanupProps {
  onDataChanged?: () => void;
}

export function ExtendedNutrientsCleanup({ onDataChanged }: ExtendedNutrientsCleanupProps) {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [removalResult, setRemovalResult] = useState<RemovalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handlePreview = async () => {
    try {
      setPreviewing(true);
      console.log('👁️ Previewing Extended nutrient records...');

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/preview-extended-nutrients`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to preview Extended nutrients: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setPreviewData(result);
        setRemovalResult(null); // Clear any previous removal results
        toast.success(`✅ Found ${result.extendedCount} Extended nutrient records`);
        console.log('✅ Preview completed:', result);
      } else {
        throw new Error(result.error || 'Failed to preview Extended nutrients');
      }
    } catch (error: any) {
      console.error('❌ Preview error:', error);
      toast.error(`❌ Preview failed: ${error.message}`);
      setPreviewData(null);
    } finally {
      setPreviewing(false);
    }
  };

  const handleRemove = async () => {
    if (!previewData || previewData.extendedCount === 0) {
      toast.error('No Extended records found to remove');
      return;
    }

    const confirmed = confirm(
      `⚠️ This will permanently delete ${previewData.extendedCount} Extended nutrient records.\n\n` +
      `This action cannot be undone. Are you sure you want to continue?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemoving(true);
      console.log(`🗑️ Removing ${previewData.extendedCount} Extended nutrient records...`);

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/remove-extended-nutrients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to remove Extended nutrients: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setRemovalResult(result);
        setPreviewData(null); // Clear preview data since records are now removed
        
        // Call the callback to refresh parent components
        if (onDataChanged) {
          onDataChanged();
        }
        
        let message = `✅ Successfully removed ${result.removed} Extended nutrient records`;
        if (result.details.errors.length > 0) {
          message += `\n\n⚠️ ${result.details.errors.length} errors occurred during removal`;
        }
        
        toast.success(message);
        console.log('✅ Removal completed:', result);
      } else {
        throw new Error(result.error || 'Failed to remove Extended nutrients');
      }
    } catch (error: any) {
      console.error('❌ Removal error:', error);
      toast.error(`❌ Removal failed: ${error.message}`);
    } finally {
      setRemoving(false);
    }
  };

  const handleReset = () => {
    setPreviewData(null);
    setRemovalResult(null);
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-orange-800">
          <Trash2 className="h-5 w-5" />
          <span>Extended Nutrients Cleanup</span>
        </CardTitle>
        <p className="text-sm text-orange-600">
          Remove all nutrient records containing "Extended" in their name, category, or description
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <Button
            onClick={handlePreview}
            disabled={previewing || removing}
            size="sm"
            variant="outline"
            className="flex items-center space-x-2"
          >
            {previewing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span>{previewing ? 'Scanning...' : 'Preview Extended Records'}</span>
          </Button>

          {previewData && previewData.extendedCount > 0 && (
            <Button
              onClick={handleRemove}
              disabled={removing || previewing}
              size="sm"
              variant="destructive"
              className="flex items-center space-x-2"
            >
              {removing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span>{removing ? 'Removing...' : `Remove ${previewData.extendedCount} Records`}</span>
            </Button>
          )}

          {(previewData || removalResult) && (
            <Button
              onClick={handleReset}
              disabled={previewing || removing}
              size="sm"
              variant="ghost"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset</span>
            </Button>
          )}
        </div>

        {/* Preview Results */}
        {previewData && (
          <div className="space-y-4">
            <Alert className={previewData.extendedCount > 0 ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">{previewData.message}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Nutrients: </span>
                      <Badge variant="outline">{previewData.totalNutrients.toLocaleString()}</Badge>
                    </div>
                    <div>
                      <span className="font-medium">Extended Records: </span>
                      <Badge variant={previewData.extendedCount > 0 ? "destructive" : "secondary"}>
                        {previewData.extendedCount.toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Extended Records List */}
            {previewData.extendedCount > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-orange-800 flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Extended Records Found ({previewData.previewRecords.length} of {previewData.extendedCount})</span>
                </h4>
                
                <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3 bg-white">
                  {previewData.previewRecords.map((record, index) => (
                    <div key={record.id} className="flex items-start justify-between p-2 border rounded bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm truncate">{record.name}</span>
                          <Badge variant="outline" className="text-xs">{record.category}</Badge>
                        </div>
                        <p className="text-xs text-gray-600 truncate">{record.description}</p>
                        <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Database className="h-3 w-3" />
                            <span>{record.source}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(record.imported_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                        #{index + 1}
                      </Badge>
                    </div>
                  ))}
                  
                  {previewData.previewRecords.length < previewData.extendedCount && (
                    <div className="text-center p-2 text-sm text-gray-500 border-t">
                      ... and {previewData.extendedCount - previewData.previewRecords.length} more records
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Removal Results */}
        {removalResult && (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium text-green-800">{removalResult.message}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Records Removed: </span>
                      <Badge variant="destructive">{removalResult.removed.toLocaleString()}</Badge>
                    </div>
                    <div>
                      <span className="font-medium">Remaining Total: </span>
                      <Badge variant="outline">{removalResult.details.remainingTotal.toLocaleString()}</Badge>
                    </div>
                  </div>
                  
                  {removalResult.details.errors.length > 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs font-medium text-yellow-800 mb-1">
                        ⚠️ {removalResult.details.errors.length} errors occurred:
                      </p>
                      <div className="text-xs text-yellow-700 space-y-1 max-h-20 overflow-y-auto">
                        {removalResult.details.errors.map((error, index) => (
                          <div key={index}>{error}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            {/* Successfully Removed Records Summary */}
            {removalResult.details.removedRecords.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-green-800 flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Successfully Removed ({removalResult.details.removedRecords.length})</span>
                </h4>
                
                <div className="max-h-32 overflow-y-auto space-y-1 border rounded-lg p-3 bg-white">
                  {removalResult.details.removedRecords.map((record, index) => (
                    <div key={record.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="truncate">{record.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{record.category}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Usage Instructions */}
        {!previewData && !removalResult && (
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Instructions:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Click "Preview Extended Records" to scan for Extended nutrient records</li>
              <li>Review the found records to confirm they should be removed</li>
              <li>Click "Remove X Records" to permanently delete them</li>
              <li>The operation will update your nutrient database and refresh the dashboard</li>
            </ol>
            <p className="text-orange-600 font-medium">
              ⚠️ This operation cannot be undone. Always preview before removing!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}