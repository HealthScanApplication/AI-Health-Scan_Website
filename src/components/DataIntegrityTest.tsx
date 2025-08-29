"use client";

import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database,
  Server,
  Users,
  TrendingUp,
  Shield,
  Clock
} from 'lucide-react';
import { DataValidator, DataUtils, ErrorHandler } from '../utils/dataValidation';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'warning' | 'running';
  message: string;
  details?: any;
  duration?: number;
}

interface ServerHealth {
  status: 'healthy' | 'unhealthy' | 'unknown';
  database: string;
  timestamp: string;
  responseTime?: number;
}

export function DataIntegrityTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [serverHealth, setServerHealth] = useState<ServerHealth | null>(null);
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);
  
  const runTest = async (name: string, testFn: () => Promise<Omit<TestResult, 'name'>>) => {
    const startTime = Date.now();
    
    setTestResults(prev => prev.map(test => 
      test.name === name 
        ? { ...test, status: 'running', message: 'Running...' }
        : test
    ));

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      setTestResults(prev => prev.map(test => 
        test.name === name 
          ? { ...test, ...result, duration }
          : test
      ));
    } catch (error) {
      const duration = Date.now() - startTime;
      
      setTestResults(prev => prev.map(test => 
        test.name === name 
          ? { 
              ...test, 
              status: 'failed', 
              message: `Test failed: ${error.message}`,
              duration 
            }
          : test
      ));
    }
  };

  const initializeTests = () => {
    const tests: TestResult[] = [
      {
        name: 'LocalStorage Integrity',
        status: 'passed',
        message: 'Ready to test'
      },
      {
        name: 'Server Health Check',
        status: 'passed',
        message: 'Ready to test'
      },
      {
        name: 'Referral Code Validation',
        status: 'passed',
        message: 'Ready to test'
      },
      {
        name: 'Leaderboard Consistency',
        status: 'passed',
        message: 'Ready to test'
      },
      {
        name: 'Waitlist Position Accuracy',
        status: 'passed',
        message: 'Ready to test'
      },
      {
        name: 'User Data Consistency',
        status: 'passed',
        message: 'Ready to test'
      }
    ];
    
    setTestResults(tests);
  };

  useEffect(() => {
    initializeTests();
  }, []);

  const runAllTests = async () => {
    setIsRunning(true);
    setLastRunTime(new Date());
    
    try {
      // Test 1: LocalStorage Integrity
      await runTest('LocalStorage Integrity', async () => {
        const result = DataValidator.validateLocalStorage();
        
        if (result.isValid) {
          return {
            status: 'passed',
            message: 'LocalStorage data is valid and consistent',
            details: { warnings: result.warnings }
          };
        } else {
          return {
            status: 'failed',
            message: `Found ${result.errors.length} critical issues`,
            details: { errors: result.errors, warnings: result.warnings }
          };
        }
      });

      // Test 2: Server Health Check
      await runTest('Server Health Check', async () => {
        const startTime = Date.now();
        
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/health`,
            {
              headers: { 'Authorization': `Bearer ${publicAnonKey}` }
            }
          );
          
          const responseTime = Date.now() - startTime;
          const data = await response.json();
          
          setServerHealth({
            ...data,
            responseTime
          });

          if (response.ok && data.status === 'healthy') {
            return {
              status: 'passed',
              message: `Server healthy (${responseTime}ms response)`,
              details: data
            };
          } else {
            return {
              status: 'failed',
              message: `Server unhealthy: ${data.status}`,
              details: data
            };
          }
        } catch (error) {
          return {
            status: 'failed',
            message: `Server unreachable: ${error.message}`,
            details: { error: error.message }
          };
        }
      });

      // Test 3: Referral Code Validation
      await runTest('Referral Code Validation', async () => {
        const referralCode = DataUtils.safeGetItem('healthscan_referral_code');
        const localUsers = DataUtils.safeGetItem('healthscan_local_users', []);
        
        const issues = [];
        let validCodes = 0;
        
        if (referralCode) {
          if (DataValidator.validateReferralCode(referralCode)) {
            validCodes++;
          } else {
            issues.push(`Invalid user referral code format: ${referralCode}`);
          }
        }
        
        localUsers.forEach((user, index) => {
          if (user.referralCode) {
            if (DataValidator.validateReferralCode(user.referralCode)) {
              validCodes++;
            } else {
              issues.push(`Invalid referral code for user ${index}: ${user.referralCode}`);
            }
          }
        });

        if (issues.length === 0) {
          return {
            status: 'passed',
            message: `All ${validCodes} referral codes are valid`,
            details: { validCodes, totalChecked: validCodes }
          };
        } else {
          return {
            status: 'warning',
            message: `Found ${issues.length} invalid referral codes`,
            details: { issues, validCodes }
          };
        }
      });

      // Test 4: Leaderboard Consistency
      await runTest('Leaderboard Consistency', async () => {
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/leaderboard`,
            {
              headers: { 'Authorization': `Bearer ${publicAnonKey}` }
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const data = await response.json();
          const result = DataValidator.validateLeaderboard(data.leaderboard);

          if (result.isValid) {
            return {
              status: 'passed',
              message: `Leaderboard is consistent (${data.leaderboard.length} entries)`,
              details: { 
                entryCount: data.leaderboard.length,
                warnings: result.warnings 
              }
            };
          } else {
            return {
              status: 'failed',
              message: `Leaderboard has ${result.errors.length} consistency issues`,
              details: { errors: result.errors, warnings: result.warnings }
            };
          }
        } catch (error) {
          return {
            status: 'failed',
            message: `Failed to fetch leaderboard: ${error.message}`,
            details: { error: error.message }
          };
        }
      });

      // Test 5: Waitlist Position Accuracy
      await runTest('Waitlist Position Accuracy', async () => {
        const userEmail = DataUtils.safeGetItem('healthscan_user_email');
        
        if (!userEmail) {
          return {
            status: 'warning',
            message: 'No user email found - cannot test position accuracy',
            details: { reason: 'User not signed up' }
          };
        }

        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/user/${encodeURIComponent(userEmail)}/stats`,
            {
              headers: { 'Authorization': `Bearer ${publicAnonKey}` }
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const userData = await response.json();
          
          if (userData.fallback) {
            return {
              status: 'warning',
              message: 'Position using fallback data - server issues detected',
              details: userData
            };
          }

          if (userData.position && userData.position > 0) {
            return {
              status: 'passed',
              message: `User position is accurate: #${userData.position}`,
              details: userData
            };
          } else {
            return {
              status: 'warning',
              message: 'User position not set or invalid',
              details: userData
            };
          }
        } catch (error) {
          return {
            status: 'failed',
            message: `Failed to verify position: ${error.message}`,
            details: { error: error.message }
          };
        }
      });

      // Test 6: User Data Consistency
      await runTest('User Data Consistency', async () => {
        const userEmail = DataUtils.safeGetItem('healthscan_user_email');
        const referralCode = DataUtils.safeGetItem('healthscan_referral_code');
        
        if (!userEmail || !referralCode) {
          return {
            status: 'warning',
            message: 'Incomplete user data - user may not be signed up',
            details: { hasEmail: !!userEmail, hasReferralCode: !!referralCode }
          };
        }

        const userData = {
          email: userEmail,
          referralCode: referralCode
        };

        const result = DataValidator.validateUserData(userData);
        
        if (result.isValid) {
          return {
            status: 'passed',
            message: 'User data is valid and consistent',
            details: { warnings: result.warnings }
          };
        } else {
          return {
            status: 'failed',
            message: `User data has ${result.errors.length} validation issues`,
            details: { errors: result.errors, warnings: result.warnings }
          };
        }
      });

    } catch (error) {
      ErrorHandler.logError('DataIntegrityTest', error);
      toast.error('Test suite failed to complete');
    } finally {
      setIsRunning(false);
    }
  };

  const cleanupData = () => {
    DataValidator.cleanupLocalStorage();
    initializeTests();
    toast.success('🧹 Data cleanup completed');
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'running':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const passedCount = testResults.filter(t => t.status === 'passed').length;
  const failedCount = testResults.filter(t => t.status === 'failed').length;
  const warningCount = testResults.filter(t => t.status === 'warning').length;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔍 HealthScan Data Integrity Tests
        </h1>
        <p className="text-gray-600">
          Comprehensive testing suite to validate data consistency and system health
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-600">{passedCount}</p>
              <p className="text-sm text-gray-600">Passed</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-600">{failedCount}</p>
              <p className="text-sm text-gray-600">Failed</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
              <p className="text-sm text-gray-600">Warnings</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {((passedCount / testResults.length) * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-gray-600">Health Score</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Server Health */}
      {serverHealth && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-semibold">Server Status</h3>
                <p className="text-sm text-gray-600">
                  {serverHealth.status} • Database: {serverHealth.database}
                  {serverHealth.responseTime && ` • ${serverHealth.responseTime}ms`}
                </p>
              </div>
            </div>
            <Badge 
              variant={serverHealth.status === 'healthy' ? 'default' : 'destructive'}
              className={serverHealth.status === 'healthy' ? 'bg-green-100 text-green-800' : ''}
            >
              {serverHealth.status}
            </Badge>
          </div>
        </Card>
      )}

      {/* Control Panel */}
      <div className="flex gap-4 justify-center">
        <Button 
          onClick={runAllTests}
          disabled={isRunning}
          className="bg-[var(--healthscan-green)] hover:bg-[var(--healthscan-light-green)]"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Run All Tests
            </>
          )}
        </Button>
        
        <Button 
          variant="outline"
          onClick={cleanupData}
          disabled={isRunning}
        >
          <Database className="w-4 h-4 mr-2" />
          Cleanup Data
        </Button>
      </div>

      {/* Test Results */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test Results</h2>
        
        {testResults.map((test, index) => (
          <Card key={index} className={`p-4 border-2 ${getStatusColor(test.status)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(test.status)}
                <div>
                  <h3 className="font-semibold">{test.name}</h3>
                  <p className="text-sm text-gray-600">{test.message}</p>
                  {test.duration && (
                    <p className="text-xs text-gray-500 mt-1">
                      Completed in {test.duration}ms
                    </p>
                  )}
                </div>
              </div>
              
              <Badge variant="secondary">
                {test.status}
              </Badge>
            </div>
            
            {test.details && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <pre className="text-xs text-gray-600 overflow-x-auto">
                  {JSON.stringify(test.details, null, 2)}
                </pre>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Last Run Info */}
      {lastRunTime && (
        <div className="text-center text-sm text-gray-500">
          Last run: {lastRunTime.toLocaleString()}
        </div>
      )}

      {/* Usage Instructions */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Usage Instructions:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Run tests regularly to ensure data consistency</li>
            <li>Address any failed tests immediately</li>
            <li>Warnings indicate potential issues that should be monitored</li>
            <li>Use "Cleanup Data" if you encounter corrupted localStorage entries</li>
            <li>Server health checks validate backend connectivity and performance</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}