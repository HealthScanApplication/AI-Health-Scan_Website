import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Server,
  Database,
  Globe,
  Key,
  Info,
  ExternalLink
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DiagnosticResult {
  category: string;
  test: string;
  status: 'pass' | 'fail' | 'warning' | 'info';
  message: string;
  details?: string;
  solution?: string;
}

export function ServerDiagnostic() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [serverInfo, setServerInfo] = useState<any>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnosticResults: DiagnosticResult[] = [];

    // 1. Check environment configuration
    diagnosticResults.push({
      category: 'Configuration',
      test: 'Supabase Project ID',
      status: projectId ? 'pass' : 'fail',
      message: projectId ? `Project ID configured: ${projectId}` : 'Project ID not configured',
      details: projectId ? undefined : 'The SUPABASE_URL environment variable is missing or invalid',
      solution: projectId ? undefined : 'Check that SUPABASE_URL is properly set in your environment'
    });

    diagnosticResults.push({
      category: 'Configuration',
      test: 'Supabase Public Key',
      status: publicAnonKey ? 'pass' : 'fail',
      message: publicAnonKey ? 'Public anon key configured' : 'Public anon key not configured',
      details: publicAnonKey ? `Key starts with: ${publicAnonKey.substring(0, 20)}...` : 'The SUPABASE_ANON_KEY environment variable is missing',
      solution: publicAnonKey ? undefined : 'Check that SUPABASE_ANON_KEY is properly set in your environment'
    });

    if (!projectId || !publicAnonKey) {
      diagnosticResults.push({
        category: 'Configuration',
        test: 'Overall Configuration',
        status: 'fail',
        message: 'Cannot run server tests without proper configuration',
        details: 'Missing required Supabase environment variables',
        solution: 'Ensure SUPABASE_URL and SUPABASE_ANON_KEY are properly configured'
      });
    } else {
      // 2. Test basic connectivity
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/health`;
        console.log('🔍 Testing health endpoint:', healthUrl);

        const healthResponse = await fetch(healthUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (healthResponse.ok) {
          const data = await healthResponse.json();
          setServerInfo(data);
          diagnosticResults.push({
            category: 'Connectivity',
            test: 'Server Health Endpoint',
            status: 'pass',
            message: `Server responding: ${data.status || 'healthy'}`,
            details: `Server version: ${data.version || 'Unknown'}, Mode: ${data.mode || 'Unknown'}`
          });
        } else {
          diagnosticResults.push({
            category: 'Connectivity',
            test: 'Server Health Endpoint',
            status: 'fail',
            message: `Server returned error: ${healthResponse.status}`,
            details: `Status: ${healthResponse.status} ${healthResponse.statusText}`,
            solution: 'Check if the Supabase Edge Function is deployed and running'
          });
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            diagnosticResults.push({
              category: 'Connectivity',
              test: 'Server Health Endpoint',
              status: 'fail',
              message: 'Health check timed out',
              details: 'Server did not respond within 5 seconds',
              solution: 'Check if the Supabase Edge Function is running and not overloaded'
            });
          } else if (error.message.includes('Failed to fetch')) {
            diagnosticResults.push({
              category: 'Connectivity',
              test: 'Server Health Endpoint',
              status: 'fail',
              message: 'Cannot reach server',
              details: 'Network error or server is offline',
              solution: 'Check internet connection and verify Supabase Edge Function deployment'
            });
          } else {
            diagnosticResults.push({
              category: 'Connectivity',
              test: 'Server Health Endpoint',
              status: 'fail',
              message: `Connection failed: ${error.message}`,
              details: error.stack?.substring(0, 200) || 'No additional details',
              solution: 'Check network connectivity and server configuration'
            });
          }
        }
      }

      // 3. Test admin endpoints
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const statsUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/database-stats`;
        const statsResponse = await fetch(statsUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          const totalRecords = Object.values(stats).reduce((sum: number, count) => sum + (count as number), 0);
          diagnosticResults.push({
            category: 'Database',
            test: 'Database Stats Endpoint',
            status: 'pass',
            message: `Database accessible, ${totalRecords} total records`,
            details: `Records: ${JSON.stringify(stats, null, 2)}`
          });
        } else {
          const errorText = await statsResponse.text().catch(() => 'Could not read error');
          diagnosticResults.push({
            category: 'Database',
            test: 'Database Stats Endpoint',
            status: 'fail',
            message: `Database stats failed: ${statsResponse.status}`,
            details: errorText.substring(0, 200),
            solution: 'Check database connection and KV store configuration'
          });
        }
      } catch (error) {
        if (error instanceof Error) {
          diagnosticResults.push({
            category: 'Database',
            test: 'Database Stats Endpoint',
            status: 'fail',
            message: `Database test failed: ${error.message}`,
            details: error.stack?.substring(0, 200) || 'No additional details',
            solution: 'Verify database connectivity and admin endpoint configuration'
          });
        }
      }

      // 4. Test CORS configuration
      try {
        const corsUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/health`;
        const corsResponse = await fetch(corsUrl, {
          method: 'OPTIONS',
          headers: {
            'Origin': window.location.origin,
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type, Authorization'
          }
        });

        const corsHeaders = {
          'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
          'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
          'Access-Control-Allow-Headers': corsResponse.headers.get('Access-Control-Allow-Headers')
        };

        if (corsResponse.ok && corsHeaders['Access-Control-Allow-Origin']) {
          diagnosticResults.push({
            category: 'CORS',
            test: 'CORS Configuration',
            status: 'pass',
            message: 'CORS headers properly configured',
            details: `Allowed origin: ${corsHeaders['Access-Control-Allow-Origin']}`
          });
        } else {
          diagnosticResults.push({
            category: 'CORS',
            test: 'CORS Configuration',
            status: 'warning',
            message: 'CORS configuration may have issues',
            details: `Response: ${corsResponse.status}, Headers: ${JSON.stringify(corsHeaders)}`,
            solution: 'Check server CORS configuration in the Edge Function'
          });
        }
      } catch (error) {
        diagnosticResults.push({
          category: 'CORS',
          test: 'CORS Configuration',
          status: 'warning',
          message: 'Could not test CORS configuration',
          details: error instanceof Error ? error.message : 'Unknown error',
          solution: 'Manually verify CORS headers are set correctly'
        });
      }
    }

    setResults(diagnosticResults);
    setIsRunning(false);
  };

  useEffect(() => {
    // Run diagnostics on component mount
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'fail': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass': return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'fail': return <Badge className="bg-red-100 text-red-800">Fail</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'info': return <Badge className="bg-blue-100 text-blue-800">Info</Badge>;
      default: return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Configuration': return <Key className="w-4 h-4" />;
      case 'Connectivity': return <Globe className="w-4 h-4" />;
      case 'Database': return <Database className="w-4 h-4" />;
      case 'CORS': return <Server className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, DiagnosticResult[]>);

  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const warningCount = results.filter(r => r.status === 'warning').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Server Diagnostic</h2>
          <p className="text-gray-600">Diagnose and troubleshoot server connectivity issues</p>
        </div>
        <Button 
          onClick={runDiagnostics} 
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Diagnosing...' : 'Run Diagnostics'}
        </Button>
      </div>

      {/* Summary */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-900">{results.length}</div>
              <p className="text-sm text-gray-600">Total Tests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{passCount}</div>
              <p className="text-sm text-gray-600">Passed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
              <p className="text-sm text-gray-600">Warnings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{failCount}</div>
              <p className="text-sm text-gray-600">Failed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overall Status */}
      {results.length > 0 && (
        <>
          {failCount > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-800">
                {failCount} critical issues found. Server functionality may be impaired. Review failed tests below.
              </AlertDescription>
            </Alert>
          )}

          {failCount === 0 && warningCount > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-800">
                {warningCount} potential issues found. Server is functional but some features may have problems.
              </AlertDescription>
            </Alert>
          )}

          {failCount === 0 && warningCount === 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-800">
                All diagnostic tests passed! Server is functioning correctly.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Server Info */}
      {serverInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-500" />
              Server Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="text-lg">{serverInfo.status || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Version</p>
                <p className="text-lg">{serverInfo.version || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Mode</p>
                <p className="text-lg">{serverInfo.mode || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Server</p>
                <p className="text-lg">{serverInfo.server || 'Unknown'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results */}
      {Object.keys(groupedResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupedResults).map(([category, categoryResults]) => (
                <div key={category}>
                  <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
                    {getCategoryIcon(category)}
                    {category}
                  </h3>
                  <div className="space-y-3">
                    {categoryResults.map((result, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(result.status)}
                            <div>
                              <p className="font-medium text-sm">{result.test}</p>
                              <p className="text-sm text-gray-600">{result.message}</p>
                            </div>
                          </div>
                          {getStatusBadge(result.status)}
                        </div>
                        
                        {result.details && (
                          <div className="mt-3 p-3 bg-gray-50 rounded text-xs font-mono">
                            <p className="font-medium text-gray-700 mb-1">Details:</p>
                            <p className="text-gray-600">{result.details}</p>
                          </div>
                        )}
                        
                        {result.solution && (
                          <div className="mt-3 p-3 bg-blue-50 rounded">
                            <p className="font-medium text-blue-700 mb-1">💡 Solution:</p>
                            <p className="text-sm text-blue-600">{result.solution}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Helpful Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-blue-500" />
            Helpful Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Supabase Dashboard:</strong>{' '}
              <a 
                href={`https://supabase.com/dashboard/project/${projectId}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View your project dashboard
              </a>
            </p>
            <p className="text-sm">
              <strong>Edge Functions:</strong>{' '}
              <a 
                href={`https://supabase.com/dashboard/project/${projectId}/functions`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Manage Edge Functions
              </a>
            </p>
            <p className="text-sm">
              <strong>Logs:</strong>{' '}
              <a 
                href={`https://supabase.com/dashboard/project/${projectId}/logs/edge-functions`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View function logs
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}