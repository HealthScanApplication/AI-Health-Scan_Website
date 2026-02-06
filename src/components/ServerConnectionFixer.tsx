import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { 
  Server, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Settings,
  Zap,
  Clock,
  Database,
  Globe,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  serverHealthManager, 
  checkServerHealth, 
  fetchDatabaseStats,
  getServerStatus,
  clearServerHealthCache,
  startHealthMonitoring,
  stopHealthMonitoring 
} from '../utils/serverHealth';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ConnectionTest {
  name: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  duration?: number;
  error?: string;
  details?: string;
}

export function ServerConnectionFixer() {
  const [isRunning, setIsRunning] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [tests, setTests] = useState<ConnectionTest[]>([
    {
      name: 'Basic Connectivity',
      description: 'Test if the Supabase Edge Function is reachable',
      status: 'pending'
    },
    {
      name: 'Authentication',
      description: 'Verify API key and authentication headers',
      status: 'pending'
    },
    {
      name: 'Health Endpoint',
      description: 'Check server health endpoint response',
      status: 'pending'
    },
    {
      name: 'Database Connection',
      description: 'Test database connectivity and basic queries',
      status: 'pending'
    },
    {
      name: 'Stats Endpoint',
      description: 'Verify statistics endpoint functionality',
      status: 'pending'
    },
    {
      name: 'CORS Configuration',
      description: 'Check Cross-Origin Resource Sharing setup',
      status: 'pending'
    }
  ]);

  const [serverInfo, setServerInfo] = useState<{
    status: string;
    lastCheck?: number;
    responseTime?: number;
    fallbackActive: boolean;
  }>({
    status: 'unknown',
    fallbackActive: false
  });

  useEffect(() => {
    updateServerInfo();
  }, []);

  const updateServerInfo = async () => {
    const status = getServerStatus();
    const healthStatus = await checkServerHealth(5000);
    
    setServerInfo({
      status,
      lastCheck: healthStatus.timestamp,
      responseTime: healthStatus.responseTime,
      fallbackActive: healthStatus.fallbackActive
    });
  };

  const updateTestStatus = (index: number, updates: Partial<ConnectionTest>) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, ...updates } : test
    ));
  };

  const runConnectivityTest = async (testIndex: number): Promise<void> => {
    const startTime = Date.now();
    updateTestStatus(testIndex, { status: 'running' });
    setCurrentTest(tests[testIndex].name);
    
    try {
      switch (testIndex) {
        case 0: // Basic Connectivity
          const basicResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/ping`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`
            },
            signal: AbortSignal.timeout(10000)
          });
          
          if (!basicResponse.ok) {
            throw new Error(`HTTP ${basicResponse.status}: ${basicResponse.statusText}`);
          }
          
          updateTestStatus(testIndex, {
            status: 'success',
            duration: Date.now() - startTime,
            details: `Connected successfully (${basicResponse.status})`
          });
          break;

        case 1: // Authentication
          try {
            const authResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/auth-test`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json'
              },
              signal: AbortSignal.timeout(8000)
            });

            if (authResponse.status === 404) {
              // Try fallback: just test if we can authenticate to any endpoint
              const fallbackResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/health`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${publicAnonKey}`,
                  'Content-Type': 'application/json'
                },
                signal: AbortSignal.timeout(6000)
              });
              
              updateTestStatus(testIndex, {
                status: fallbackResponse.ok ? 'success' : 'failed',
                duration: Date.now() - startTime,
                details: fallbackResponse.ok ? 'Authentication verified (fallback test)' : 'Authentication failed',
                error: fallbackResponse.ok ? undefined : `HTTP ${fallbackResponse.status}`
              });
              break;
            }

            const authData = await authResponse.json();
            
            updateTestStatus(testIndex, {
              status: authResponse.ok ? 'success' : 'failed',
              duration: Date.now() - startTime,
              details: authResponse.ok ? 'Authentication verified' : authData.error || 'Auth failed',
              error: authResponse.ok ? undefined : authData.error
            });
          } catch (error: any) {
            updateTestStatus(testIndex, {
              status: 'failed',
              duration: Date.now() - startTime,
              error: error.message,
              details: error.message.includes('404') ? 'Auth endpoint not implemented (expected in development)' : 'Authentication endpoint not reachable'
            });
          }
          break;

        case 2: // Health Endpoint
          const healthStatus = await checkServerHealth(8000);
          updateTestStatus(testIndex, {
            status: healthStatus.healthy ? 'success' : 'failed',
            duration: healthStatus.responseTime || Date.now() - startTime,
            details: healthStatus.healthy ? 'Server is healthy' : 'Health check failed',
            error: healthStatus.error
          });
          break;

        case 3: // Database Connection
          try {
            const dbResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/db-test`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json'
              },
              signal: AbortSignal.timeout(10000)
            });

            const dbData = await dbResponse.json();
            
            updateTestStatus(testIndex, {
              status: dbResponse.ok && dbData.success ? 'success' : 'failed',
              duration: Date.now() - startTime,
              details: dbResponse.ok ? `Database connected (${dbData.tables || 0} tables)` : 'Database connection failed',
              error: !dbResponse.ok || !dbData.success ? dbData.error : undefined
            });
          } catch (error: any) {
            updateTestStatus(testIndex, {
              status: 'failed',
              duration: Date.now() - startTime,
              error: error.message,
              details: 'Database test endpoint not reachable'
            });
          }
          break;

        case 4: // Stats Endpoint
          const stats = await fetchDatabaseStats(10000);
          const statsWorking = stats && typeof stats.totalRecords === 'number';
          
          updateTestStatus(testIndex, {
            status: statsWorking ? 'success' : 'failed',
            duration: Date.now() - startTime,
            details: statsWorking ? `Retrieved stats (${stats.totalRecords} records)` : 'Stats endpoint failed',
            error: statsWorking ? undefined : 'No valid stats data returned'
          });
          break;

        case 5: // CORS Configuration
          try {
            // Test preflight request
            const corsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/health`, {
              method: 'OPTIONS',
              headers: {
                'Origin': window.location.origin,
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'authorization,content-type'
              },
              signal: AbortSignal.timeout(8000)
            });

            const corsHeaders = {
              'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
              'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
              'Access-Control-Allow-Headers': corsResponse.headers.get('Access-Control-Allow-Headers')
            };

            const corsOk = corsHeaders['Access-Control-Allow-Origin'] === '*' || 
                          corsHeaders['Access-Control-Allow-Origin'] === window.location.origin;

            updateTestStatus(testIndex, {
              status: corsOk ? 'success' : 'failed',
              duration: Date.now() - startTime,
              details: corsOk ? 'CORS properly configured' : 'CORS configuration issues detected',
              error: corsOk ? undefined : 'CORS headers missing or incorrect'
            });
          } catch (error: any) {
            updateTestStatus(testIndex, {
              status: 'failed',
              duration: Date.now() - startTime,
              error: error.message,
              details: 'CORS preflight request failed'
            });
          }
          break;
      }
    } catch (error: any) {
      updateTestStatus(testIndex, {
        status: 'failed',
        duration: Date.now() - startTime,
        error: error.message,
        details: 'Test execution failed'
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setOverallProgress(0);
    setCurrentTest('Starting diagnostics...');

    // Reset all tests
    setTests(prev => prev.map(test => ({ ...test, status: 'pending' as const, duration: undefined, error: undefined, details: undefined })));

    try {
      for (let i = 0; i < tests.length; i++) {
        await runConnectivityTest(i);
        setOverallProgress(((i + 1) / tests.length) * 100);
        
        // Small delay between tests
        if (i < tests.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setCurrentTest('Tests completed');
      await updateServerInfo();
      
      const failedTests = tests.filter(test => test.status === 'failed').length;
      if (failedTests === 0) {
        toast.success('✅ All connectivity tests passed!');
      } else {
        toast.warning(`⚠️ ${failedTests} test(s) failed. Check details below.`);
      }
      
    } catch (error: any) {
      toast.error(`❌ Test suite failed: ${error.message}`);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const clearCacheAndRetest = () => {
    clearServerHealthCache();
    toast.info('🧹 Server cache cleared. Running fresh tests...');
    runAllTests();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'running': return 'text-blue-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      case 'running': return <RefreshCw className="h-4 w-4 animate-spin" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getServerStatusBadge = () => {
    const { status, fallbackActive } = serverInfo;
    
    if (fallbackActive) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Fallback Mode</Badge>;
    }
    
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'unhealthy':
        return <Badge variant="destructive">Unhealthy</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-blue-800">
          <Server className="h-5 w-5" />
          <span>Server Connection Diagnostics</span>
          {getServerStatusBadge()}
        </CardTitle>
        <p className="text-sm text-blue-600">
          Diagnose and fix server connectivity issues with comprehensive testing
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Server Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
            <Globe className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium">Project ID</p>
              <p className="text-xs text-gray-600">{projectId}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
            <Zap className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium">Response Time</p>
              <p className="text-xs text-gray-600">
                {serverInfo.responseTime ? `${serverInfo.responseTime}ms` : 'Unknown'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
            <Shield className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium">Last Check</p>
              <p className="text-xs text-gray-600">
                {serverInfo.lastCheck ? new Date(serverInfo.lastCheck).toLocaleTimeString() : 'Never'}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-3">
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="flex items-center space-x-2"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Wifi className="h-4 w-4" />
            )}
            <span>{isRunning ? 'Running Tests...' : 'Run Diagnostics'}</span>
          </Button>

          <Button 
            variant="outline" 
            onClick={clearCacheAndRetest}
            disabled={isRunning}
            className="flex items-center space-x-2"
          >
            <Database className="h-4 w-4" />
            <span>Clear Cache & Test</span>
          </Button>

          <Button 
            variant="outline" 
            onClick={updateServerInfo}
            disabled={isRunning}
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            {currentTest && (
              <p className="text-xs text-blue-600 animate-pulse">{currentTest}</p>
            )}
          </div>
        )}

        {/* Test Results */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Test Results</h3>
          <div className="space-y-2">
            {tests.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className={getStatusColor(test.status)}>
                    {getStatusIcon(test.status)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{test.name}</p>
                    <p className="text-xs text-gray-600">{test.description}</p>
                    {test.details && (
                      <p className="text-xs text-blue-600 mt-1">{test.details}</p>
                    )}
                    {test.error && (
                      <p className="text-xs text-red-600 mt-1">Error: {test.error}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {test.duration && (
                    <p className="text-xs text-gray-500">{test.duration}ms</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Troubleshooting Tips */}
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            <strong>Common Issues:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Edge Function not deployed: Run <code>supabase functions deploy server</code></li>
              <li>Wrong project ID: Check your Supabase project URL</li>
              <li>Invalid API key: Verify SUPABASE_ANON_KEY in environment</li>
              <li>CORS issues: Ensure server includes proper CORS headers</li>
              <li>Network timeout: Check your internet connection</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}