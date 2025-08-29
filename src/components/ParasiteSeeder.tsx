import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { Bug, Database, Upload, CheckCircle, AlertCircle, Info, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { syncParasitesToDatabase, checkParasitesInDatabase, forceParasiteDatabaseSync } from "../utils/supabase/parasiteSync";

export function ParasiteSeeder() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [seedingProgress, setSeedingProgress] = useState(0);
  const [seedingStatus, setSeedingStatus] = useState<string>('');
  const [lastSeedResult, setLastSeedResult] = useState<any>(null);
  const [databaseStatus, setDatabaseStatus] = useState<any>(null);

  const checkDatabaseStatus = async () => {
    setIsChecking(true);
    try {
      const status = await checkParasitesInDatabase();
      setDatabaseStatus(status);
      console.log('🦠 Database status:', status);
    } catch (error) {
      console.error('❌ Failed to check database status:', error);
      toast.error('Failed to check database status');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSeedParasites = async () => {
    setIsSeeding(true);
    setSeedingProgress(0);
    setSeedingStatus('Preparing parasite sync...');
    
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

      setSeedingStatus('Checking database schema...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSeedingStatus('Syncing parasites to database...');
      const result = await forceParasiteDatabaseSync();
      
      clearInterval(progressInterval);
      setSeedingProgress(100);
      setSeedingStatus('Parasite sync completed!');
      setLastSeedResult(result);
      
      // Refresh database status after seeding
      if (result.success) {
        await checkDatabaseStatus();
      }
      
      if (result.success) {
        toast.success(`✅ ${result.message}`);
      } else {
        toast.error(`❌ ${result.message}`);
      }
    } catch (error) {
      setSeedingStatus('Parasite sync failed!');
      setLastSeedResult({
        success: false,
        message: `Unexpected error: ${error.message}`
      });
      toast.error(`💥 Sync failed: ${error.message}`);
    } finally {
      setIsSeeding(false);
      setTimeout(() => {
        setSeedingProgress(0);
        setSeedingStatus('');
      }, 3000);
    }
  };

  // Auto-check on component mount
  React.useEffect(() => {
    checkDatabaseStatus();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold flex items-center space-x-2">
          <Bug className="w-5 h-5 text-orange-500" />
          <span>Parasite Database Sync</span>
          <Badge variant="outline" className="bg-orange-50 text-orange-700">
            100+ Records
          </Badge>
        </h2>
        <p className="text-gray-600 mt-1">
          Sync comprehensive parasite data from memory to database
        </p>
      </div>

      {/* Database Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-blue-500" />
            <span>Database Status</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkDatabaseStatus}
              disabled={isChecking}
            >
              {isChecking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isChecking ? (
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span>Checking database status...</span>
            </div>
          ) : databaseStatus ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {databaseStatus.count || 0}
                  </div>
                  <div className="text-sm text-blue-700">Database Records</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {databaseStatus.usingDatabase ? 'Yes' : 'No'}
                  </div>
                  <div className="text-sm text-green-700">Using Database</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {databaseStatus.exists ? 'Ready' : 'Needs Sync'}
                  </div>
                  <div className="text-sm text-orange-700">Sync Status</div>
                </div>
              </div>

              {databaseStatus.usingDatabase && databaseStatus.count > 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-green-800 font-medium">Database Sync Complete</p>
                      <p className="text-green-700 text-sm mt-1">
                        Your database has {databaseStatus.count} parasite records and is properly synced.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-orange-800 font-medium">Database Sync Needed</p>
                      <p className="text-orange-700 text-sm mt-1">
                        Your database needs to be synced with the comprehensive parasite data. 
                        Click "Sync Parasites" to transfer 100+ parasite records to the database.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Failed to check database status
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-orange-500" />
            <span>Parasite Data Sync</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-blue-800 font-medium">About Parasite Data Sync</p>
                <p className="text-blue-700 text-sm mt-1">
                  This will sync 100+ comprehensive parasite records from memory to your Supabase database. 
                  Includes detailed information about Protozoa, Nematodes, Cestodes, Trematodes, Bacteria, Viruses, and Fungi 
                  with scientific accuracy and health information.
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
                {lastSeedResult.syncedCount && (
                  <Badge variant="outline" className="text-xs">
                    {lastSeedResult.syncedCount} synced
                  </Badge>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleSeedParasites}
              disabled={isSeeding || isChecking}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isSeeding ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Sync Parasites (100+)
                </>
              )}
            </Button>

            <Button 
              variant="outline"
              onClick={checkDatabaseStatus}
              disabled={isSeeding || isChecking}
            >
              <Eye className="w-4 h-4 mr-2" />
              Check Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parasite Database Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">🔬 Scientific Data</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 100+ comprehensive pathogen species</li>
                <li>• Scientific and common names</li>
                <li>• Detailed transmission information</li>
                <li>• Symptoms and health risks</li>
                <li>• Treatment and prevention methods</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">🌍 Global Coverage</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Protozoa (Giardia, Cryptosporidium, Malaria, etc.)</li>
                <li>• Nematodes (Roundworms, Hookworms, etc.)</li>
                <li>• Cestodes (Tapeworms)</li>
                <li>• Trematodes (Flukes)</li>
                <li>• Bacteria (Salmonella, E. coli, Listeria, etc.)</li>
                <li>• Viruses (Norovirus, Hepatitis A, etc.)</li>
                <li>• Fungi (Candida, Aspergillus, etc.)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}