import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Separator } from "./ui/separator";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Server,
  Globe,
  Database,
  Settings,
  Clock
} from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning' | 'testing';
  message: string;
  duration?: number;
  details?: any;
  troubleshooting?: string;
}

export function ServerStatusDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'testing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Pass</Badge>;
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'testing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Testing</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  // Simple server connectivity test
  const testServerConnectivity = async (): Promise<DiagnosticResult> => {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Testing basic server connectivity...');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No response body');
        
        return {
          test: 'Server Connectivity',
          status: 'fail',
          message: `Server returned ${response.status}: ${response.statusText}`,
          duration,
          details: {
            status: response.status,
            statusText: response.statusText,
            responseBody: errorText,
            url: `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/`
          },
          troubleshooting: getServerTroubleshooting(response.status)
        };
      }

      const data = await response.json().catch(() => ({}));
      
      return {
        test: 'Server Connectivity',
        status: 'pass',
        message: `Server is responding (${duration}ms)`,
        duration,
        details: {
          serverInfo: data,
          status: response.status,
          url: `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/`
        }
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      let status: 'fail' | 'warning' = 'fail';
      let message = 'Server connectivity failed';
      let troubleshooting = 'Check if the Edge Function is deployed and running';
      
      if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
        status = 'warning';
        message = 'Server response timeout (>10s)';
        troubleshooting = 'Server may be slow or under heavy load. Try again in a few minutes.';
      } else if (error.name === 'TypeError' && error.message?.includes('fetch')) {
        message = 'Network connection failed';
        troubleshooting = 'Check internet connection and Supabase Edge Function deployment';
      }
      
      return {
        test: 'Server Connectivity',
        status,
        message: `${message}: ${error.message}`,
        duration,
        details: {
          error: error.message,
          errorType: error.name,
          isTimeout: error.name === 'TimeoutError' || error.message?.includes('timeout'),
          isNetwork: error.name === 'TypeError' && error.message?.includes('fetch'),
          url: `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/`
        },
        troubleshooting
      };
    }
  };

  // Test configuration
  const testConfiguration = async (): Promise<DiagnosticResult> => {
    try {
      const hasProjectId = !!projectId;
      const hasAnonKey = !!publicAnonKey;
      
      if (!hasProjectId || !hasAnonKey) {
        return {
          test: 'Configuration',
          status: 'fail',
          message: 'Missing Supabase configuration',
          details: {
            projectId: hasProjectId ? 'configured' : 'missing',
            publicAnonKey: hasAnonKey ? 'configured' : 'missing'
          },
          troubleshooting: 'Check utils/supabase/info.tsx for proper configuration'
        };
      }

      return {
        test: 'Configuration',
        status: 'pass',
        message: 'Supabase configuration is complete',
        details: {
          projectId: projectId,
          supabaseUrl: `${projectId}.supabase.co`,
          publicAnonKey: 'configured'
        }
      };
    } catch (error: any) {
      return {
        test: 'Configuration',
        status: 'fail',
        message: `Configuration error: ${error.message}`,
        details: { error: error.message }
      };
    }
  };

  // Test specific endpoints
  const testEndpoints = async (): Promise<DiagnosticResult[]> => {
    const endpoints = [
      { path: '/health', name: 'Health Check' },
      { path: '/info', name: 'Server Info' },
      { path: '/waitlist/count', name: 'Waitlist Count' },
      { path: '/leaderboard', name: 'Referral Leaderboard' }
    ];

    const results: DiagnosticResult[] = [];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      
      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646${endpoint.path}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(5000)
        });

        const duration = Date.now() - startTime;
        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          results.push({
            test: `Endpoint: ${endpoint.name}`,
            status: 'pass',
            message: `${endpoint.path} responding (${duration}ms)`,
            duration,
            details: { data, status: response.status }
          });
        } else {
          results.push({
            test: `Endpoint: ${endpoint.name}`,
            status: 'fail',
            message: `${endpoint.path} failed: ${response.status}`,
            duration,
            details: { 
              error: data, 
              status: response.status,
              statusText: response.statusText 
            }
          });
        }

      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        results.push({
          test: `Endpoint: ${endpoint.name}`,
          status: 'fail',
          message: `${endpoint.path} error: ${error.message}`,
          duration,
          details: { 
            error: error.message, 
            errorType: error.name,
            path: endpoint.path
          }
        });
      }
    }

    return results;
  };

  const getServerTroubleshooting = (status: number): string => {
    switch (status) {
      case 404:
        return 'Edge Function may not be deployed. Check Supabase Functions dashboard and deploy the server function.';
      case 500:
        return 'Server internal error. Check Edge Function logs in Supabase dashboard.';
      case 403:
        return 'Permission denied. Check API key configuration.';
      case 429:
        return 'Rate limit exceeded. Wait a few minutes before retrying.';
      default:
        return 'Check Edge Function deployment and configuration in Supabase dashboard.';
    }
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      // Test configuration first
      const configTest = await testConfiguration();
      setResults([configTest]);

      // Only proceed if configuration is valid
      if (configTest.status === 'pass') {
        // Test server connectivity
        const serverTest = await testServerConnectivity();
        setResults([configTest, serverTest]);

        // If server is reachable, test endpoints
        if (serverTest.status === 'pass') {
          const endpointTests = await testEndpoints();
          setResults([configTest, serverTest, ...endpointTests]);
        }
      }
      
      setLastRun(new Date());
    } catch (error) {
      console.error('❌ Diagnostics error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // Run diagnostics on component mount
  useEffect(() => {
    runDiagnostics();
  }, []);

  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const warningCount = results.filter(r => r.status === 'warning').length;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Server Status Diagnostic
            </CardTitle>
            <CardDescription>
              Real-time server connectivity and endpoint testing
            </CardDescription>
          </div>
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isRunning ? 'Testing...' : 'Run Test'}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">{passCount} Passed</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm">{failCount} Failed</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">{warningCount} Warnings</span>
            </div>
            {lastRun && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Last run: {lastRun.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {results.length === 0 && !isRunning && (
          <div className="text-center py-8 text-muted-foreground">
            Click "Run Test" to start diagnostics
          </div>
        )}

        {results.map((result, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(result.status)}
                <span className="font-medium">{result.test}</span>
                {getStatusBadge(result.status)}
              </div>
              {result.duration && (
                <span className="text-sm text-muted-foreground">{result.duration}ms</span>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground ml-7">
              {result.message}
            </div>

            {result.troubleshooting && result.status !== 'pass' && (
              <Alert className="ml-7">
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  <strong>Troubleshooting:</strong> {result.troubleshooting}
                </AlertDescription>
              </Alert>
            )}

            {result.details && result.status === 'fail' && (
              <div className="ml-7 mt-2 p-3 bg-muted rounded-md">
                <div className="text-xs text-muted-foreground">
                  <strong>Error Details:</strong>
                  <pre className="mt-1 whitespace-pre-wrap">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {index < results.length - 1 && <Separator />}
          </div>
        ))}

        {isRunning && (
          <div className="text-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <div className="text-sm text-muted-foreground">
              Running diagnostics...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}