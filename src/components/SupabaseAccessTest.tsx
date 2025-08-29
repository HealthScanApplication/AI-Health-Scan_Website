"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Server,
  Key,
  Globe,
  Lock,
  Zap,
  Bug
} from "lucide-react";
import { getSupabaseClient } from "../utils/supabase/client";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
  timestamp?: string;
}

interface SupabaseConfig {
  projectId: string;
  hasPublicKey: boolean;
  hasServiceKey: boolean;
  hasDbUrl: boolean;
  supabaseUrl: string;
}

export function SupabaseAccessTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [config, setConfig] = useState<SupabaseConfig | null>(null);
  const [serverHealth, setServerHealth] = useState<any>(null);

  useEffect(() => {
    // Initialize configuration check
    checkConfiguration();
  }, []);

  const checkConfiguration = () => {
    console.log('🔍 Checking Supabase configuration...');
    
    const supabaseUrl = `https://${projectId}.supabase.co`;
    
    const configResult: SupabaseConfig = {
      projectId,
      hasPublicKey: !!publicAnonKey,
      hasServiceKey: false, // We can't check this from frontend
      hasDbUrl: false, // We can't check this from frontend  
      supabaseUrl
    };
    
    setConfig(configResult);
    console.log('✅ Configuration loaded:', configResult);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    console.log('🚀 Starting comprehensive Supabase access tests...');

    const results: TestResult[] = [];
    
    try {
      // Test 1: Basic configuration
      results.push(await testBasicConfiguration());
      
      // Test 2: Frontend client connection
      results.push(await testFrontendClient());
      
      // Test 3: Server health check
      results.push(await testServerHealth());
      
      // Test 4: Server database access
      results.push(await testServerDatabaseAccess());
      
      // Test 5: Table permissions
      results.push(await testTablePermissions());
      
      // Test 6: KV store operations
      results.push(await testKVStoreOperations());
      
      // Test 7: Authentication system
      results.push(await testAuthenticationSystem());
      
    } catch (error) {
      console.error('💥 Test suite failed:', error);
      results.push({
        name: 'Test Suite',
        status: 'error',
        message: `Test suite crashed: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }
    
    setTestResults(results);
    setIsRunning(false);
    console.log('🏁 Test suite completed:', results);
  };

  const testBasicConfiguration = async (): Promise<TestResult> => {
    console.log('🔧 Testing basic configuration...');
    
    try {
      if (!projectId) {
        return {
          name: 'Basic Configuration',
          status: 'error',
          message: 'Missing project ID',
          timestamp: new Date().toISOString()
        };
      }
      
      if (!publicAnonKey) {
        return {
          name: 'Basic Configuration',
          status: 'error',
          message: 'Missing public anon key',
          timestamp: new Date().toISOString()
        };
      }
      
      if (publicAnonKey.length < 100) {
        return {
          name: 'Basic Configuration',
          status: 'warning',
          message: 'Public key seems too short',
          details: { keyLength: publicAnonKey.length },
          timestamp: new Date().toISOString()
        };
      }
      
      return {
        name: 'Basic Configuration',
        status: 'success',
        message: 'Project ID and public key are present',
        details: { 
          projectId: projectId,
          keyLength: publicAnonKey.length,
          supabaseUrl: `https://${projectId}.supabase.co`
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        name: 'Basic Configuration',
        status: 'error',
        message: `Configuration check failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  };

  const testFrontendClient = async (): Promise<TestResult> => {
    console.log('👤 Testing frontend client connection...');
    
    try {
      const supabase = getSupabaseClient();
      
      // Test basic connectivity with a simple query
      const { data, error } = await supabase
        .from('kv_store_557a7646')
        .select('key')
        .limit(1);
      
      if (error) {
        // Check if it's a table not found error vs permission error
        if (error.message.includes('does not exist') || error.message.includes('relation')) {
          return {
            name: 'Frontend Client',
            status: 'warning',
            message: 'Connected to Supabase but table does not exist',
            details: { 
              error: error.message,
              code: error.code,
              hint: error.hint 
            },
            timestamp: new Date().toISOString()
          };
        } else if (error.message.includes('permission denied')) {
          return {
            name: 'Frontend Client',
            status: 'warning',
            message: 'Connected but no read permissions for anon user',
            details: { 
              error: error.message,
              code: error.code 
            },
            timestamp: new Date().toISOString()
          };
        } else {
          return {
            name: 'Frontend Client',
            status: 'error',
            message: `Database query failed: ${error.message}`,
            details: { 
              error: error.message,
              code: error.code,
              hint: error.hint 
            },
            timestamp: new Date().toISOString()
          };
        }
      }
      
      return {
        name: 'Frontend Client',
        status: 'success',
        message: 'Successfully connected and can read from database',
        details: { 
          recordsFound: data?.length || 0,
          connectionTest: 'passed'
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        name: 'Frontend Client',
        status: 'error',
        message: `Client connection failed: ${error.message}`,
        details: { 
          errorType: error.constructor.name,
          stack: error.stack 
        },
        timestamp: new Date().toISOString()
      };
    }
  };

  const testServerHealth = async (): Promise<TestResult> => {
    console.log('🏥 Testing server health...');
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/health`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          signal: AbortSignal.timeout(10000)
        }
      );
      
      if (!response.ok) {
        return {
          name: 'Server Health',
          status: 'error',
          message: `Server returned HTTP ${response.status}: ${response.statusText}`,
          details: { 
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          },
          timestamp: new Date().toISOString()
        };
      }
      
      const healthData = await response.json();
      setServerHealth(healthData);
      
      return {
        name: 'Server Health',
        status: healthData.status === 'healthy' ? 'success' : 'warning',
        message: `Server status: ${healthData.status}, Database: ${healthData.database}`,
        details: healthData,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        name: 'Server Health',
        status: 'error',
        message: `Server health check failed: ${error.message}`,
        details: { 
          errorType: error.constructor.name 
        },
        timestamp: new Date().toISOString()
      };
    }
  };

  const testServerDatabaseAccess = async (): Promise<TestResult> => {
    console.log('💾 Testing server database access...');
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/waitlist/count`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          signal: AbortSignal.timeout(15000)
        }
      );
      
      if (!response.ok) {
        return {
          name: 'Server Database Access',
          status: 'error',
          message: `Database query failed: HTTP ${response.status}`,
          details: { 
            status: response.status,
            statusText: response.statusText 
          },
          timestamp: new Date().toISOString()
        };
      }
      
      const data = await response.json();
      
      return {
        name: 'Server Database Access',
        status: data.offlineMode ? 'warning' : 'success',
        message: data.offlineMode ? 'Server running in offline mode' : 'Server can access database',
        details: { 
          count: data.count,
          offlineMode: data.offlineMode,
          fromCache: data.fromCache 
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        name: 'Server Database Access',
        status: 'error',
        message: `Server database test failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  };

  const testTablePermissions = async (): Promise<TestResult> => {
    console.log('🔐 Testing table permissions...');
    
    try {
      // Test if we can setup the database
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/setup-database`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          signal: AbortSignal.timeout(20000)
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        return {
          name: 'Table Permissions',
          status: 'error',
          message: `Table setup failed: HTTP ${response.status}`,
          details: { 
            status: response.status,
            error: errorText 
          },
          timestamp: new Date().toISOString()
        };
      }
      
      const result = await response.json();
      
      return {
        name: 'Table Permissions',
        status: result.success ? 'success' : 'warning',
        message: result.message || 'Table permissions test completed',
        details: result,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        name: 'Table Permissions',
        status: 'error',
        message: `Permission test failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  };

  const testKVStoreOperations = async (): Promise<TestResult> => {
    console.log('🗃️ Testing KV store operations...');
    
    try {
      const testEmail = `test_${Date.now()}@example.com`;
      
      // Test email waitlist registration (which uses KV store)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/email-waitlist`,
        {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            email: testEmail,
            referralCode: null 
          }),
          signal: AbortSignal.timeout(15000)
        }
      );
      
      if (!response.ok) {
        return {
          name: 'KV Store Operations',
          status: 'error',
          message: `KV operation failed: HTTP ${response.status}`,
          details: { 
            status: response.status 
          },
          timestamp: new Date().toISOString()
        };
      }
      
      const result = await response.json();
      
      return {
        name: 'KV Store Operations',
        status: result.success ? 'success' : 'warning',
        message: result.offlineMode ? 'KV operations work in offline mode' : 'KV operations successful',
        details: { 
          testEmail,
          referralCode: result.referralCode,
          offlineMode: result.offlineMode 
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        name: 'KV Store Operations',
        status: 'error',
        message: `KV store test failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  };

  const testAuthenticationSystem = async (): Promise<TestResult> => {
    console.log('🔐 Testing authentication system...');
    
    try {
      const supabase = getSupabaseClient();
      
      // Test getting current session (should work without errors)
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        return {
          name: 'Authentication System',
          status: 'error',
          message: `Auth session check failed: ${sessionError.message}`,
          details: { 
            error: sessionError.message 
          },
          timestamp: new Date().toISOString()
        };
      }
      
      return {
        name: 'Authentication System',
        status: 'success',
        message: 'Authentication system is working',
        details: { 
          hasSession: !!sessionData.session,
          sessionUser: sessionData.session?.user?.email || null 
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        name: 'Authentication System',
        status: 'error',
        message: `Auth test failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Database className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'pending':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🔍 Supabase Access Diagnostic
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Comprehensive testing of Supabase configuration and database access
        </p>
        
        <div className="flex justify-center gap-4 mb-6">
          <Button 
            onClick={runAllTests}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
      </div>

      {/* Configuration Overview */}
      {config && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Configuration Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <span className="text-sm">
                <strong>Project ID:</strong> {config.projectId}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-green-600" />
              <span className="text-sm">
                <strong>Public Key:</strong> {config.hasPublicKey ? '✅ Present' : '❌ Missing'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-orange-600" />
              <span className="text-sm">
                <strong>Service Key:</strong> 🤷 Unknown (Server-side)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-600" />
              <span className="text-sm">
                <strong>URL:</strong> {config.supabaseUrl.substring(0, 30)}...
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Server Health Summary */}
      {serverHealth && (
        <Alert className={`${serverHealth.status === 'healthy' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <Server className="h-4 w-4" />
          <AlertDescription>
            <strong>Server Status:</strong> {serverHealth.status} | 
            <strong> Database:</strong> {serverHealth.database} | 
            <strong> Offline Mode:</strong> {serverHealth.offlineMode ? '🔶 Yes' : '🟢 No'}
            {serverHealth.permissionErrors > 0 && (
              <span> | <strong>Permission Errors:</strong> {serverHealth.permissionErrors}</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Test Results
          </h2>
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <h3 className="font-semibold">{result.name}</h3>
                      <p className="text-sm text-gray-600">{result.message}</p>
                      {result.timestamp && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant="secondary"
                    className={`
                      ${result.status === 'success' ? 'bg-green-100 text-green-800' : ''}
                      ${result.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${result.status === 'error' ? 'bg-red-100 text-red-800' : ''}
                      ${result.status === 'pending' ? 'bg-blue-100 text-blue-800' : ''}
                    `}
                  >
                    {result.status.toUpperCase()}
                  </Badge>
                </div>
                
                {showDetails && result.details && (
                  <div className="mt-4 p-3 bg-white rounded border">
                    <h4 className="text-sm font-semibold mb-2">Technical Details:</h4>
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-gray-50 p-2 rounded">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Summary and Recommendations */}
      {testResults.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Summary & Recommendations
          </h2>
          <div className="space-y-3">
            {testResults.filter(r => r.status === 'error').length > 0 && (
              <Alert className="bg-red-50 border-red-200">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Critical Issues Found:</strong> {testResults.filter(r => r.status === 'error').length} tests failed. 
                  Check server configuration and database permissions.
                </AlertDescription>
              </Alert>
            )}
            
            {testResults.filter(r => r.status === 'warning').length > 0 && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Warnings:</strong> {testResults.filter(r => r.status === 'warning').length} tests have warnings. 
                  System may be running in offline/fallback mode.
                </AlertDescription>
              </Alert>
            )}
            
            {testResults.filter(r => r.status === 'success').length === testResults.length && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>All Systems Operational:</strong> All {testResults.length} tests passed successfully. 
                  Supabase access is working correctly.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}