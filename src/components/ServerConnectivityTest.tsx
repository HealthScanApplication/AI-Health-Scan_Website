import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Server, 
  Wifi, 
  CheckCircle, 
  XCircle, 
  Loader2,
  RefreshCw,
  AlertTriangle,
  Globe,
  Rss
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
  duration?: number;
}

export function ServerConnectivityTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const updateResult = (testName: string, status: 'success' | 'error', message: string, details?: any, duration?: number) => {
    setResults(prev => {
      const newResults = [...prev];
      const existingIndex = newResults.findIndex(r => r.test === testName);
      
      if (existingIndex >= 0) {
        newResults[existingIndex] = { test: testName, status, message, details, duration };
      } else {
        newResults.push({ test: testName, status, message, details, duration });
      }
      
      return newResults;
    });
  };

  const runServerConnectivityTests = async () => {
    setTesting(true);
    setResults([]);
    
    try {
      console.log('🔬 Running comprehensive server connectivity tests...');
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      // Test 1: Basic server health check
      await testServerHealth(projectId, publicAnonKey);
      
      // Test 2: Server status endpoint
      await testServerStatus(projectId, publicAnonKey);
      
      // Test 3: Blog RSS endpoint
      await testBlogRssEndpoint(projectId, publicAnonKey);
      
      // Test 4: Direct Substack RSS feed
      await testDirectSubstackRss();
      
      // Test 5: Blog health check endpoint
      await testBlogHealthEndpoint(projectId, publicAnonKey);
      
      console.log('✅ All connectivity tests completed');
      toast.success('🔬 Connectivity tests completed');
      
    } catch (error: any) {
      console.error('❌ Connectivity test suite failed:', error);
      toast.error(`🚨 Test suite error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const testServerHealth = async (projectId: string, publicAnonKey: string) => {
    const testName = 'Server Health Check';
    const startTime = Date.now();
    
    try {
      updateResult(testName, 'pending', 'Testing server health endpoint...');
      
      const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/health`;
      console.log('🔍 Testing health endpoint:', healthUrl);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Health check passed:', result);
        updateResult(testName, 'success', `Server is healthy (${response.status})`, result, duration);
      } else {
        const errorText = await response.text();
        console.error('❌ Health check failed:', response.status, errorText);
        updateResult(testName, 'error', `Health check failed: ${response.status} ${response.statusText}`, { errorText }, duration);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('❌ Health check error:', error);
      updateResult(testName, 'error', `Network error: ${error.message}`, { error: error.message }, duration);
    }
  };

  const testServerStatus = async (projectId: string, publicAnonKey: string) => {
    const testName = 'Server Status Check';
    const startTime = Date.now();
    
    try {
      updateResult(testName, 'pending', 'Testing server status endpoint...');
      
      const statusUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/status`;
      console.log('🔍 Testing status endpoint:', statusUrl);
      
      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Status check passed:', result);
        updateResult(testName, 'success', `Server status is online (${response.status})`, result, duration);
      } else {
        const errorText = await response.text();
        console.error('❌ Status check failed:', response.status, errorText);
        updateResult(testName, 'error', `Status check failed: ${response.status} ${response.statusText}`, { errorText }, duration);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('❌ Status check error:', error);
      updateResult(testName, 'error', `Network error: ${error.message}`, { error: error.message }, duration);
    }
  };

  const testBlogRssEndpoint = async (projectId: string, publicAnonKey: string) => {
    const testName = 'Blog RSS Endpoint';
    const startTime = Date.now();
    
    try {
      updateResult(testName, 'pending', 'Testing blog RSS endpoint...');
      
      const blogUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/blog/articles`;
      console.log('🔍 Testing blog RSS endpoint:', blogUrl);
      
      const response = await fetch(blogUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Blog RSS endpoint success:', result);
        
        if (result.success && result.data && result.data.length > 0) {
          updateResult(testName, 'success', `Blog RSS working - ${result.data.length} articles loaded (${response.status})`, 
            { articleCount: result.data.length, source: result.source }, duration);
        } else {
          updateResult(testName, 'error', `Blog RSS endpoint returned no articles`, result, duration);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Blog RSS endpoint failed:', response.status, errorText);
        updateResult(testName, 'error', `Blog RSS failed: ${response.status} ${response.statusText}`, { errorText }, duration);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('❌ Blog RSS endpoint error:', error);
      updateResult(testName, 'error', `Network error: ${error.message}`, { error: error.message }, duration);
    }
  };

  const testDirectSubstackRss = async () => {
    const testName = 'Direct Substack RSS';
    const startTime = Date.now();
    
    try {
      updateResult(testName, 'pending', 'Testing direct Substack RSS feed...');
      
      const substackUrl = 'https://healthscan.substack.com/feed';
      console.log('🔍 Testing direct Substack RSS:', substackUrl);
      
      // Try direct fetch first
      let response: Response;
      try {
        response = await fetch(substackUrl, {
          headers: {
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            'User-Agent': 'HealthScan Blog Reader Test',
          },
        });
        
        const duration = Date.now() - startTime;
        
        if (response.ok) {
          const textData = await response.text();
          console.log('✅ Direct Substack RSS fetch successful, content length:', textData.length);
          
          // Check if it's valid RSS/XML
          const hasRssContent = textData.includes('<rss') || textData.includes('<channel') || textData.includes('<item');
          
          if (hasRssContent) {
            updateResult(testName, 'success', `Direct RSS feed accessible (${textData.length} chars)`, 
              { contentLength: textData.length, hasRssStructure: hasRssContent }, duration);
          } else {
            updateResult(testName, 'error', `RSS feed returned invalid content`, 
              { contentLength: textData.length, preview: textData.substring(0, 200) }, duration);
          }
        } else {
          const errorText = await response.text();
          console.error('❌ Direct Substack RSS failed:', response.status, errorText);
          updateResult(testName, 'error', `Direct RSS failed: ${response.status} ${response.statusText}`, 
            { errorText: errorText.substring(0, 200) }, duration);
        }
      } catch (directError) {
        const duration = Date.now() - startTime;
        console.log('⚠️ Direct RSS fetch failed, trying CORS proxy...');
        
        // Fallback to CORS proxy
        try {
          const proxyUrl = 'https://api.allorigins.win/get?url=';
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          response = await fetch(`${proxyUrl}${encodeURIComponent(substackUrl)}`, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' },
          });
          
          clearTimeout(timeoutId);
          const proxyDuration = Date.now() - startTime;
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ CORS proxy fetch successful, content length:', data.contents?.length || 0);
            
            if (data.contents && data.contents.length > 0) {
              const hasRssContent = data.contents.includes('<rss') || data.contents.includes('<channel');
              updateResult(testName, 'success', `RSS feed accessible via CORS proxy (${data.contents.length} chars)`, 
                { contentLength: data.contents.length, method: 'cors-proxy', hasRssStructure: hasRssContent }, proxyDuration);
            } else {
              updateResult(testName, 'error', `CORS proxy returned empty content`, data, proxyDuration);
            }
          } else {
            clearTimeout(timeoutId);
            const errorText = await response.text();
            updateResult(testName, 'error', `CORS proxy failed: ${response.status}`, 
              { errorText: errorText.substring(0, 200) }, proxyDuration);
          }
        } catch (proxyError: any) {
          const proxyDuration = Date.now() - startTime;
          console.error('❌ CORS proxy also failed:', proxyError);
          updateResult(testName, 'error', `Both direct and proxy methods failed`, 
            { directError: directError.message, proxyError: proxyError.message }, proxyDuration);
        }
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('❌ Direct Substack RSS test error:', error);
      updateResult(testName, 'error', `Test error: ${error.message}`, { error: error.message }, duration);
    }
  };

  const testBlogHealthEndpoint = async (projectId: string, publicAnonKey: string) => {
    const testName = 'Blog Health Endpoint';
    const startTime = Date.now();
    
    try {
      updateResult(testName, 'pending', 'Testing blog health endpoint...');
      
      const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/blog/health`;
      console.log('🔍 Testing blog health endpoint:', healthUrl);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Blog health check passed:', result);
        
        if (result.success && result.healthy) {
          updateResult(testName, 'success', `Blog health check passed - RSS feed is accessible`, result, duration);
        } else {
          updateResult(testName, 'error', `Blog health check indicates RSS feed issues`, result, duration);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Blog health check failed:', response.status, errorText);
        updateResult(testName, 'error', `Blog health check failed: ${response.status} ${response.statusText}`, { errorText }, duration);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('❌ Blog health check error:', error);
      updateResult(testName, 'error', `Network error: ${error.message}`, { error: error.message }, duration);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Testing...</Badge>;
      case 'success':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Passed</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const pendingCount = results.filter(r => r.status === 'pending').length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                <Server className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>🔬 Server Connectivity Test</CardTitle>
                <p className="text-gray-600">Diagnose blog article fetch issues</p>
              </div>
            </div>
            
            <Button
              onClick={runServerConnectivityTests}
              disabled={testing}
              className="flex items-center gap-2"
            >
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {testing ? 'Testing...' : 'Run Tests'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Test Results Summary */}
          {results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{results.length}</div>
                <div className="text-sm text-gray-600">Total Tests</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{successCount}</div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
                <div className="text-sm text-gray-600">Running</div>
              </div>
            </div>
          )}

          {/* Test Results */}
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{result.test}</h4>
                        {getStatusBadge(result.status)}
                        {result.duration && (
                          <Badge variant="outline" className="text-xs">
                            {result.duration}ms
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600">{result.message}</p>
                      
                      {/* Show details for errors or detailed success info */}
                      {result.details && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                          <details>
                            <summary className="cursor-pointer text-gray-700 hover:text-gray-900">
                              Show Details
                            </summary>
                            <pre className="mt-2 text-gray-600 overflow-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Placeholder when no tests run yet */}
          {results.length === 0 && !testing && (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Test</h3>
              <p className="text-gray-600 mb-4">
                Click "Run Tests" to diagnose server connectivity and blog article fetch issues.
              </p>
              <p className="text-sm text-gray-500">
                This will test server health, RSS endpoints, and direct Substack feed access.
              </p>
            </div>
          )}

          {/* Overall Results */}
          {results.length > 0 && !testing && (
            <div className="border-t pt-6">
              {errorCount === 0 ? (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 p-4 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">
                    ✅ All tests passed! Blog functionality should be working correctly.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-4 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">
                    ⚠️ {errorCount} test(s) failed. Check the details above to diagnose the issue.
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}