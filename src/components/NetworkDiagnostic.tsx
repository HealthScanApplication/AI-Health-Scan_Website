"use client";

import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { 
  Wifi, 
  WifiOff, 
  Server, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Globe,
  Shield,
  Clock,
  Database,
  Activity
} from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";

interface NetworkTest {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'HEAD';
  headers?: Record<string, string>;
  body?: string;
  timeout: number;
  description: string;
}

interface TestResult {
  test: string;
  success: boolean;
  duration: number;
  error?: string;
  status?: number;
  details?: any;
}

interface NetworkDiagnosticProps {
  onClose: () => void;
}

export function NetworkDiagnostic({ onClose }: NetworkDiagnosticProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [browserStatus, setBrowserStatus] = useState({
    online: navigator.onLine,
    userAgent: navigator.userAgent,
    language: navigator.language,
    cookiesEnabled: navigator.cookieEnabled
  });

  // Define network tests for the updated server
  const networkTests: NetworkTest[] = [
    {
      name: 'Internet Connectivity',
      url: 'https://www.google.com/generate_204',
      method: 'GET',
      timeout: 5000,
      description: 'Basic internet connectivity test'
    },
    {
      name: 'DNS Resolution',
      url: 'https://httpbin.org/status/200',
      method: 'HEAD',
      timeout: 5000,
      description: 'DNS resolution and HTTP connectivity test'
    },
    {
      name: 'Supabase Platform',
      url: `https://${projectId}.supabase.co/rest/v1/`,
      method: 'HEAD',
      headers: {
        'apikey': publicAnonKey,
        'Authorization': `Bearer ${publicAnonKey}`
      },
      timeout: 10000,
      description: 'Supabase database platform availability'
    },
    {
      name: 'HealthScan Server Health',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/health`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Accept': 'application/json'
      },
      timeout: 10000,
      description: 'HealthScan production server health check'
    },
    {
      name: 'Database Statistics API',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/database-stats`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Accept': 'application/json'
      },
      timeout: 15000,
      description: 'Admin dashboard database statistics endpoint'
    },
    {
      name: 'Waitlist Count API',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/waitlist/count`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Accept': 'application/json'
      },
      timeout: 10000,
      description: 'Referral system waitlist count endpoint'
    },
    {
      name: 'Referral Leaderboard API',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/referrals/leaderboard`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Accept': 'application/json'
      },
      timeout: 10000,
      description: 'Referral system leaderboard endpoint'
    },
    {
      name: 'Waitlist Join Test',
      url: `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/waitlist/join`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        email: `test-${Date.now()}@networkdiagnostic.com`,
        referralCode: 'diagnostic-test'
      }),
      timeout: 15000,
      description: 'Test waitlist signup functionality'
    }
  ];

  // Update browser status periodically
  useEffect(() => {
    const updateBrowserStatus = () => {
      setBrowserStatus({
        online: navigator.onLine,
        userAgent: navigator.userAgent,
        language: navigator.language,
        cookiesEnabled: navigator.cookieEnabled
      });
    };

    window.addEventListener('online', updateBrowserStatus);
    window.addEventListener('offline', updateBrowserStatus);

    const interval = setInterval(updateBrowserStatus, 1000);

    return () => {
      window.removeEventListener('online', updateBrowserStatus);
      window.removeEventListener('offline', updateBrowserStatus);
      clearInterval(interval);
    };
  }, []);

  const runSingleTest = async (test: NetworkTest): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 Running test: ${test.name}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), test.timeout);
      
      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          ...test.headers,
          'X-Test-Request': 'true',
          'X-Test-Source': 'HealthScan-NetworkDiagnostic'
        },
        body: test.body,
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit'
      });
      
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      
      let details = null;
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        try {
          details = await response.json();
        } catch {
          details = null;
        }
      }
      
      console.log(`✅ Test ${test.name} completed: ${response.status} in ${duration}ms`);
      
      return {
        test: test.name,
        success: response.ok,
        duration,
        status: response.status,
        details,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      console.log(`❌ Test ${test.name} failed:`, error);
      
      let errorMessage = error.message || 'Unknown error';
      if (error.name === 'AbortError') {
        errorMessage = `Timeout after ${test.timeout}ms`;
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Network connection failed - server may be unavailable or CORS blocked';
      } else if (error.message?.includes('CORS')) {
        errorMessage = 'CORS policy blocked the request';
      } else if (error.message?.includes('ERR_NETWORK')) {
        errorMessage = 'Network error - check internet connection';
      } else if (error.message?.includes('ERR_CONNECTION_REFUSED')) {
        errorMessage = 'Connection refused - server may be down';
      } else if (error.message?.includes('TypeError')) {
        errorMessage = 'Network connection error - possible DNS or connectivity issue';
      }
      
      return {
        test: test.name,
        success: false,
        duration,
        error: errorMessage
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    console.log('🏃‍♂️ Starting comprehensive network diagnostic tests...');
    
    const testResults: TestResult[] = [];
    
    for (const test of networkTests) {
      const result = await runSingleTest(test);
      testResults.push(result);
      setResults([...testResults]); // Update UI with each result
      
      // Small delay between tests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 750));
    }
    
    setIsRunning(false);
    
    const successCount = testResults.filter(r => r && r.success === true).length;
    const totalTests = testResults.length;
    
    // Analyze results for specific issues with safe filtering
    const criticalFailed = testResults.filter(r => 
      r && r.success === false && r.test && (
        r.test.includes('Internet') || 
        r.test.includes('Server Health') ||
        r.test.includes('Supabase Platform')
      )
    );
    
    if (successCount === totalTests) {
      toast.success(`🎉 All network tests passed! (${successCount}/${totalTests})`);
    } else if (criticalFailed.length > 0) {
      toast.error(`❌ Critical services failed (${successCount}/${totalTests} passed) - check server deployment`);
    } else if (successCount > totalTests / 2) {
      toast.warning(`⚠️ Some tests failed (${successCount}/${totalTests} passed) - partial connectivity`);
    } else {
      toast.error(`❌ Major network issues detected (${successCount}/${totalTests} passed)`);
    }
    
    console.log(`🏁 Network diagnostic complete: ${successCount}/${totalTests} tests passed`);
  };

  const getResultIcon = (result: TestResult) => {
    if (result.success) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else {
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
  };

  const getResultColor = (result: TestResult) => {
    if (result.success) {
      return 'text-green-700 bg-green-50 border-green-200';
    } else {
      return 'text-red-700 bg-red-50 border-red-200';
    }
  };

  const getDurationColor = (duration: number) => {
    if (duration < 1000) return 'text-green-600';
    if (duration < 3000) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTestIcon = (testName: string) => {
    if (testName.includes('Internet') || testName.includes('DNS')) {
      return <Globe className="w-4 h-4" />;
    } else if (testName.includes('Server') || testName.includes('Health')) {
      return <Activity className="w-4 h-4" />;
    } else if (testName.includes('Database') || testName.includes('Statistics')) {
      return <Database className="w-4 h-4" />;
    } else if (testName.includes('Supabase')) {
      return <Shield className="w-4 h-4" />;
    } else {
      return <Server className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Globe className="w-8 h-8 text-blue-600" />
              Network Diagnostic
            </h1>
            <p className="text-gray-600 mt-1">
              Test network connectivity and HealthScan server availability
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={async () => {
                try {
                  console.log('🏥 Running comprehensive diagnostic from UI...');
                  
                  // Safe access to diagnostic suite
                  const diagnostics = (window as any).healthScanDebug;
                  if (!diagnostics || typeof diagnostics.diagnosticSuite !== 'function') {
                    toast.error('Diagnostic suite not available - diagnostics not properly initialized');
                    return;
                  }
                  
                  const result = await diagnostics.diagnosticSuite();
                  if (result && Array.isArray(result)) {
                    const successCount = result.filter(r => r && r.status === 'pass').length;
                    const totalCount = result.length;
                    toast.success(`Comprehensive diagnostic completed: ${successCount}/${totalCount} tests passed - check console for details`);
                  } else {
                    toast.warning('Diagnostic completed but no results returned');
                  }
                } catch (error: any) {
                  console.error('Diagnostic suite failed:', error);
                  const errorMessage = error?.message || 'Unknown error occurred';
                  toast.error(`Diagnostic suite failed: ${errorMessage}`);
                }
              }}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Shield className="w-4 h-4 mr-2" />
              Quick Diagnostic
            </Button>
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Tests
                </>
              )}
            </Button>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>

        {/* Browser Status */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Browser Environment
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              {browserStatus.online ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm">
                Status: <Badge 
                  variant={browserStatus.online ? "default" : "destructive"}
                  className="ml-1"
                >
                  {browserStatus.online ? 'Online' : 'Offline'}
                </Badge>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Language: {browserStatus.language}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-600" />
              <span className="text-sm">
                Cookies: <Badge 
                  variant={browserStatus.cookiesEnabled ? "default" : "destructive"}
                  className="ml-1"
                >
                  {browserStatus.cookiesEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-sm">
                Updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              User Agent: {browserStatus.userAgent}
            </p>
          </div>
        </Card>

        {/* Test Results */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            HealthScan Server Tests
            {results.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {results.filter(r => r && r.success === true).length}/{results.length} passed
              </Badge>
            )}
          </h3>
          
          {!isRunning && results.length === 0 && (
            <Alert className="bg-blue-50 border-blue-200">
              <Globe className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Click "Run Tests" to diagnose network connectivity and HealthScan server availability.
                This will test all production endpoints including admin dashboard, referral system, and API integrations.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-3">
            {networkTests.map((test, index) => {
              const result = results[index];
              const isRunningThis = isRunning && !result && (results.length === index);
              
              return (
                <div 
                  key={test.name}
                  className={`p-4 rounded-lg border ${
                    result ? getResultColor(result) : 
                    isRunningThis ? 'bg-blue-50 border-blue-200' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {result ? (
                        getResultIcon(result)
                      ) : isRunningThis ? (
                        <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                      ) : (
                        getTestIcon(test.name)
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{test.name}</h4>
                          {test.name.includes('Test') && (
                            <Badge variant="outline" className="text-xs">
                              Test Only
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{test.description}</p>
                        <p className="text-xs text-gray-500 font-mono">
                          {test.method} {test.url.replace(publicAnonKey, '[AUTH_KEY]')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      {result && (
                        <>
                          {result.status && (
                            <Badge variant="outline">
                              {result.status}
                            </Badge>
                          )}
                          <span className={getDurationColor(result.duration)}>
                            {result.duration}ms
                          </span>
                        </>
                      )}
                      {isRunningThis && (
                        <span className="text-blue-600">Testing...</span>
                      )}
                    </div>
                  </div>
                  
                  {result && result.error && (
                    <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                      <p className="text-sm opacity-75">Error: {result.error}</p>
                    </div>
                  )}
                  
                  {result && result.details && (
                    <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                      <p className="text-sm opacity-75">
                        {result.details.status && `Status: ${result.details.status}`}
                        {result.details.server && ` • Server: ${result.details.server}`}
                        {result.details.version && ` • Version: ${result.details.version}`}
                        {result.details.count !== undefined && ` • Count: ${result.details.count}`}
                        {result.details.imported !== undefined && ` • Imported: ${result.details.imported}`}
                        {result.details.success !== undefined && ` • Success: ${result.details.success}`}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {isRunning && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-blue-700">Running comprehensive network diagnostic tests...</span>
              </div>
            </div>
          )}
          
          {results.length > 0 && !isRunning && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Diagnostic completed at {new Date().toLocaleTimeString()}
                </span>
                <Button 
                  onClick={runAllTests} 
                  variant="outline" 
                  size="sm"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Rerun Tests
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}