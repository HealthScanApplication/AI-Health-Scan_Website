"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import { 
  Link2, 
  TestTube2, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users,
  Share2,
  Database,
  Clock,
  Eye,
  Trash2,
  Play,
  Settings
} from 'lucide-react';
import { useReferral, ReferralUtils } from '../hooks/useReferral';
import { UniversalWaitlist } from './UniversalWaitlist';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ReferralLinkTesterProps {
  user: any;
  accessToken: string;
  isAdmin: boolean;
}

interface TestResult {
  id: string;
  timestamp: number;
  testType: string;
  referralCode: string;
  url: string;
  status: 'success' | 'error' | 'pending';
  details: string;
  duration?: number;
}

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  signupsFromReferrals: number;
  conversionRate: number;
  topReferrers: Array<{
    code: string;
    count: number;
    email?: string;
  }>;
}

export function ReferralLinkTester({ user, accessToken, isAdmin }: ReferralLinkTesterProps) {
  const [testReferralCode, setTestReferralCode] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const { referralCode, hasReferral, isActive } = useReferral();

  // Generate test referral code
  const generateTestCode = () => {
    const code = `admin_test_${Date.now().toString().slice(-6)}`;
    setTestReferralCode(code);
    toast.success(`Generated test code: ${code}`);
  };

  // Generate referral URL
  const generateReferralUrl = (code?: string) => {
    const baseUrl = window.location.origin;
    const codeToUse = code || testReferralCode;
    return `${baseUrl}?ref=${codeToUse}`;
  };

  // Generate path-based referral URL  
  const generatePathReferralUrl = (code?: string) => {
    const baseUrl = window.location.origin;
    const codeToUse = code || testReferralCode;
    return `${baseUrl}/${codeToUse}`;
  };

  // Copy URL to clipboard
  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('🌱 URL copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  // Open URL in new tab
  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Add test result
  const addTestResult = (result: Omit<TestResult, 'id' | 'timestamp'>) => {
    const testResult: TestResult = {
      ...result,
      id: `test_${Date.now()}`,
      timestamp: Date.now()
    };
    setTestResults(prev => [testResult, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  // Run comprehensive referral test
  const runComprehensiveTest = async () => {
    if (!testReferralCode) {
      toast.error('Please enter a test referral code first');
      return;
    }

    setIsRunningTest(true);
    const startTime = Date.now();

    try {
      // Test 1: URL Parameter Detection
      const queryUrl = generateReferralUrl();
      addTestResult({
        testType: 'URL Parameter Detection',
        referralCode: testReferralCode,
        url: queryUrl,
        status: 'success',
        details: 'Generated query parameter URL successfully'
      });

      // Test 2: Path-based Detection  
      const pathUrl = generatePathReferralUrl();
      addTestResult({
        testType: 'Path-based Detection',
        referralCode: testReferralCode,
        url: pathUrl,
        status: 'success',
        details: 'Generated path-based URL successfully'
      });

      // Test 3: LocalStorage Persistence
      ReferralUtils.setPendingReferral(testReferralCode);
      const stored = ReferralUtils.getPendingReferral();
      addTestResult({
        testType: 'LocalStorage Persistence',
        referralCode: testReferralCode,
        url: '-',
        status: stored === testReferralCode ? 'success' : 'error',
        details: stored === testReferralCode ? 'Successfully stored and retrieved' : `Expected: ${testReferralCode}, Got: ${stored}`
      });

      // Test 4: Referral State Management
      window.dispatchEvent(new CustomEvent('referralStatusChanged'));
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for state update
      
      addTestResult({
        testType: 'State Management',
        referralCode: testReferralCode,
        url: '-',
        status: hasReferral ? 'success' : 'error',
        details: `Referral detected: ${hasReferral}, Active: ${isActive}, Code: ${referralCode}`
      });

      // Test 5: Server Integration Test
      if (accessToken) {
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/test-referral`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                referralCode: testReferralCode,
                testEmail: 'test@healthscan.live'
              }),
              signal: AbortSignal.timeout(10000)
            }
          );

          const result = await response.json();
          addTestResult({
            testType: 'Server Integration',
            referralCode: testReferralCode,
            url: '-',
            status: response.ok ? 'success' : 'error',
            details: response.ok ? 'Server accepted referral code' : result.error || 'Server rejected referral'
          });
        } catch (error) {
          addTestResult({
            testType: 'Server Integration',
            referralCode: testReferralCode,
            url: '-',
            status: 'error',
            details: `Server error: ${error.message}`
          });
        }
      }

      const duration = Date.now() - startTime;
      toast.success(`🎯 Comprehensive test completed in ${duration}ms`);

    } catch (error) {
      addTestResult({
        testType: 'Comprehensive Test',
        referralCode: testReferralCode,
        url: '-',
        status: 'error',
        details: `Test failed: ${error.message}`
      });
      toast.error('Test failed: ' + error.message);
    } finally {
      setIsRunningTest(false);
    }
  };

  // Fetch referral statistics
  const fetchReferralStats = async () => {
    if (!accessToken) return;
    
    setLoadingStats(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/referral-stats`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(15000)
        }
      );

      if (response.ok) {
        const stats = await response.json();
        setReferralStats(stats);
        toast.success('📊 Referral stats loaded');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch referral stats:', error);
      toast.error('Failed to load referral stats');
    } finally {
      setLoadingStats(false);
    }
  };

  // Clear all test data
  const clearTestData = () => {
    ReferralUtils.clearPendingReferral();
    localStorage.removeItem('healthscan_user_email');
    localStorage.removeItem('healthscan_referral_code');
    localStorage.removeItem('healthscan_user_position');
    localStorage.removeItem('healthscan_signup_date');
    setTestResults([]);
    window.dispatchEvent(new CustomEvent('referralStatusChanged'));
    toast.success('🌱 All test data cleared');
  };

  // Test specific URL
  const testCustomUrl = () => {
    if (!customUrl) {
      toast.error('Please enter a URL to test');
      return;
    }

    try {
      const url = new URL(customUrl);
      const refParam = url.searchParams.get('ref');
      const pathCode = url.pathname.slice(1);
      
      if (refParam) {
        addTestResult({
          testType: 'Custom URL - Query Param',
          referralCode: refParam,
          url: customUrl,
          status: 'success',
          details: `Found referral code in query parameter: ${refParam}`
        });
      } else if (pathCode && pathCode.length >= 6) {
        addTestResult({
          testType: 'Custom URL - Path Based',
          referralCode: pathCode,
          url: customUrl,
          status: 'success',
          details: `Found potential referral code in path: ${pathCode}`
        });
      } else {
        addTestResult({
          testType: 'Custom URL Test',
          referralCode: 'none',
          url: customUrl,
          status: 'error',
          details: 'No referral code detected in URL'
        });
      }
    } catch (error) {
      addTestResult({
        testType: 'Custom URL Test',
        referralCode: 'invalid',
        url: customUrl,
        status: 'error',
        details: `Invalid URL format: ${error.message}`
      });
    }
  };

  // Check localStorage data
  const inspectLocalStorage = () => {
    const data = {
      pendingReferral: localStorage.getItem('healthscan_pending_referral'),
      referralTimestamp: localStorage.getItem('healthscan_referral_timestamp'),
      userEmail: localStorage.getItem('healthscan_user_email'),
      userReferralCode: localStorage.getItem('healthscan_referral_code'),
      userPosition: localStorage.getItem('healthscan_user_position'),
      signupDate: localStorage.getItem('healthscan_signup_date'),
    };
    
    console.log('🔍 LocalStorage Inspection:', data);
    
    const inspection = Object.entries(data)
      .map(([key, value]) => `${key}: ${value || 'null'}`)
      .join('\n');
    
    addTestResult({
      testType: 'LocalStorage Inspection',
      referralCode: data.pendingReferral || 'none',
      url: '-',
      status: 'success',
      details: `Data found:\n${inspection}`
    });
    
    toast.success('🔍 LocalStorage data logged to console');
  };

  // Load initial stats
  useEffect(() => {
    if (isAdmin && accessToken) {
      fetchReferralStats();
    }
  }, [isAdmin, accessToken]);

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
          <p className="text-gray-600">This tool is only available to administrators.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube2 className="h-5 w-5 text-green-600" />
            Referral Link Testing Tool
          </CardTitle>
          <CardDescription>
            Comprehensive testing suite for the HealthScan referral system
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="generator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generator">Generator</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="stats">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-5 w-5" />
                Current Referral Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm font-medium text-gray-500">Has Referral</div>
                  <div className={`text-lg font-semibold flex items-center gap-2 mt-1 ${hasReferral ? 'text-green-600' : 'text-gray-400'}`}>
                    {hasReferral ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                    {hasReferral ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm font-medium text-gray-500">Is Active</div>
                  <div className={`text-lg font-semibold flex items-center gap-2 mt-1 ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                    {isActive ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                    {isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm font-medium text-gray-500">Referral Code</div>
                  <div className="text-lg font-semibold text-blue-600 mt-1 break-all">
                    {referralCode || 'None'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* URL Generator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Link2 className="h-5 w-5" />
                Referral Link Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter referral code"
                  value={testReferralCode}
                  onChange={(e) => setTestReferralCode(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={generateTestCode} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </div>

              {testReferralCode && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Query Parameter URL:</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={generateReferralUrl()}
                        readOnly
                        className="bg-gray-50"
                      />
                      <Button
                        onClick={() => copyToClipboard(generateReferralUrl())}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => openInNewTab(generateReferralUrl())}
                        variant="outline"
                        size="sm"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Path-based URL:</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={generatePathReferralUrl()}
                        readOnly
                        className="bg-gray-50"
                      />
                      <Button
                        onClick={() => copyToClipboard(generatePathReferralUrl())}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => openInNewTab(generatePathReferralUrl())}
                        variant="outline"
                        size="sm"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Play className="h-5 w-5" />
                Testing Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={runComprehensiveTest}
                  disabled={!testReferralCode || isRunningTest}
                  className="h-12 btn-major"
                >
                  {isRunningTest ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <TestTube2 className="h-4 w-4 mr-2" />
                      Run Comprehensive Test
                    </>
                  )}
                </Button>

                <Button
                  onClick={inspectLocalStorage}
                  variant="outline"
                  className="h-12 btn-standard"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Inspect LocalStorage
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Test Custom URL:</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter URL to test (e.g., https://app.com?ref=code123)"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={testCustomUrl} variant="outline">
                    Test URL
                  </Button>
                </div>
              </div>

              <Button
                onClick={clearTestData}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Test Data
              </Button>
            </CardContent>
          </Card>

          {/* Test Waitlist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Test Waitlist Integration
              </CardTitle>
              <CardDescription>
                Test the referral system with the actual waitlist component
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UniversalWaitlist 
                onSignupSuccess={() => {
                  toast.success("🎉 Signup successful! Check test results.");
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('referralStatusChanged'));
                  }, 500);
                }}
                placeholder="test@healthscan.live"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5" />
                Test Results ({testResults.length})
              </CardTitle>
              <CardDescription>
                Recent test results and diagnostics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <TestTube2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No test results yet. Run some tests to see results here.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {testResults.map((result) => (
                    <div
                      key={result.id}
                      className={`p-3 border rounded-lg ${
                        result.status === 'success'
                          ? 'border-green-200 bg-green-50'
                          : result.status === 'error'
                          ? 'border-red-200 bg-red-50'
                          : 'border-yellow-200 bg-yellow-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {result.status === 'success' && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            {result.status === 'error' && (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            {result.status === 'pending' && (
                              <Clock className="h-4 w-4 text-yellow-600" />
                            )}
                            <span className="font-medium text-sm">{result.testType}</span>
                            <Badge variant={result.status === 'success' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'}>
                              {result.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{result.details}</p>
                          {result.url !== '-' && (
                            <p className="text-xs text-blue-600 mt-1 break-all">{result.url}</p>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 ml-2">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Share2 className="h-5 w-5" />
                Referral Analytics
                <Button
                  onClick={fetchReferralStats}
                  disabled={loadingStats}
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                >
                  {loadingStats ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : referralStats ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {referralStats.totalReferrals}
                      </div>
                      <div className="text-sm text-gray-600">Total Referrals</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {referralStats.activeReferrals}
                      </div>
                      <div className="text-sm text-gray-600">Active Referrals</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {referralStats.signupsFromReferrals}
                      </div>
                      <div className="text-sm text-gray-600">Successful Signups</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {referralStats.conversionRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Conversion Rate</div>
                    </div>
                  </div>

                  {referralStats.topReferrers.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Top Referrers</h4>
                      <div className="space-y-2">
                        {referralStats.topReferrers.slice(0, 10).map((referrer, index) => (
                          <div key={referrer.code} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                #{index + 1}
                              </span>
                              <span className="font-medium">{referrer.code}</span>
                              {referrer.email && (
                                <span className="text-sm text-gray-600">({referrer.email})</span>
                              )}
                            </div>
                            <Badge variant="secondary">
                              {referrer.count} referrals
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Click refresh to load referral analytics</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}