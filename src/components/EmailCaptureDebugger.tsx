import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Bug,
  Send,
  Database,
  Server,
  Mail
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface TestResult {
  success: boolean;
  message: string;
  testResults?: any;
  recommendations?: string[];
  errorDetails?: string;
}

export function EmailCaptureDebugger() {
  const [email, setEmail] = useState('test@example.com');
  const [name, setName] = useState('Test User');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const runDiagnostics = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      console.log('🧪 Running email capture diagnostics...');

      // Test 1: System health check
      const healthResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/debug-email-capture`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            name: name.trim(),
            debugRequest: true
          })
        }
      );

      const healthData = await healthResponse.json();
      
      if (!healthResponse.ok) {
        setTestResult({
          success: false,
          message: `System health check failed: ${healthData.error || 'Unknown error'}`,
          errorDetails: healthData.details,
          testResults: healthData.testResults
        });
        return;
      }

      // Test 2: Actual email capture
      console.log('🧪 Testing actual email capture endpoint...');
      
      const captureResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/email-waitlist`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            name: name.trim(),
            source: 'debug-test'
          })
        }
      );

      const captureData = await captureResponse.json();
      
      if (captureResponse.ok && captureData.success) {
        setTestResult({
          success: true,
          message: 'Email capture system is working correctly!',
          testResults: {
            healthCheck: healthData.debug,
            emailCapture: {
              success: true,
              position: captureData.position,
              referralCode: captureData.referralCode,
              totalWaitlist: captureData.totalWaitlist
            }
          }
        });
        toast.success('🎉 Email capture test successful!');
      } else {
        setTestResult({
          success: false,
          message: `Email capture failed: ${captureData.error || 'Unknown error'}`,
          errorDetails: captureData.details || captureData.errorMessage,
          testResults: {
            healthCheck: healthData.debug,
            emailCapture: {
              success: false,
              errorType: captureData.errorType,
              errorMessage: captureData.errorMessage,
              debugInfo: captureData.debugInfo
            }
          }
        });
      }

    } catch (error: any) {
      console.error('❌ Diagnostics failed:', error);
      setTestResult({
        success: false,
        message: `Diagnostics failed: ${error.message}`,
        errorDetails: error.stack
      });
    } finally {
      setTesting(false);
    }
  };

  const testDirectCapture = async () => {
    setTesting(true);
    
    try {
      console.log('🧪 Testing direct email capture (production flow)...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/email-waitlist`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            name: name.trim(),
            source: 'direct-test'
          })
        }
      );

      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('✅ Direct email capture successful!');
        setTestResult({
          success: true,
          message: 'Direct email capture successful!',
          testResults: {
            directCapture: {
              success: true,
              position: data.position,
              referralCode: data.referralCode,
              isUpdate: data.isUpdate,
              alreadyExists: data.alreadyExists
            }
          }
        });
      } else {
        toast.error('❌ Direct email capture failed');
        setTestResult({
          success: false,
          message: `Direct capture failed: ${data.error}`,
          errorDetails: data.details || data.errorMessage,
          testResults: {
            directCapture: {
              success: false,
              status: response.status,
              errorType: data.errorType,
              errorMessage: data.errorMessage,
              debugInfo: data.debugInfo
            }
          }
        });
      }

    } catch (error: any) {
      console.error('❌ Direct capture test failed:', error);
      toast.error('❌ Direct capture test failed');
      setTestResult({
        success: false,
        message: `Direct test failed: ${error.message}`,
        errorDetails: error.stack
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Email Capture System Debugger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Test Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Test Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Test User"
              />
            </div>
          </div>

          {/* Test Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={runDiagnostics}
              disabled={testing || !email}
              className="flex items-center gap-2"
            >
              {testing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Server className="w-4 h-4" />
              )}
              Run Full Diagnostics
            </Button>
            
            <Button
              onClick={testDirectCapture}
              disabled={testing || !email}
              variant="outline"
              className="flex items-center gap-2"
            >
              {testing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Test Direct Capture
            </Button>
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Success
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="w-3 h-3 mr-1" />
                    Failed
                  </Badge>
                )}
                <span className="font-medium">{testResult.message}</span>
              </div>

              {/* Detailed Results */}
              {testResult.testResults && (
                <div className="space-y-3">
                  <h4 className="font-medium">Detailed Test Results</h4>
                  
                  {/* Health Check Results */}
                  {testResult.testResults.healthCheck && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-700">System Health Check</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          {testResult.testResults.healthCheck.requestParsing?.success ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                          Request Parsing
                        </div>
                        <div className="flex items-center gap-2">
                          {testResult.testResults.healthCheck.kvStoreTests?.write?.success ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                          KV Store Write
                        </div>
                        <div className="flex items-center gap-2">
                          {testResult.testResults.healthCheck.kvStoreTests?.read?.success ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                          KV Store Read
                        </div>
                        <div className="flex items-center gap-2">
                          {testResult.testResults.healthCheck.kvStoreTests?.tableAccess?.success ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                          Table Access
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email Capture Results */}
                  {testResult.testResults.emailCapture && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-700">Email Capture Test</h5>
                      <div className="text-xs space-y-1">
                        {testResult.testResults.emailCapture.success ? (
                          <div className="space-y-1">
                            <p>✅ Position: #{testResult.testResults.emailCapture.position}</p>
                            <p>✅ Referral Code: {testResult.testResults.emailCapture.referralCode}</p>
                            <p>✅ Total Waitlist: {testResult.testResults.emailCapture.totalWaitlist}</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p>❌ Error Type: {testResult.testResults.emailCapture.errorType}</p>
                            <p>❌ Error Message: {testResult.testResults.emailCapture.errorMessage}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error Details */}
              {testResult.errorDetails && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error Details:</strong> {testResult.errorDetails}
                  </AlertDescription>
                </Alert>
              )}

              {/* Recommendations */}
              {testResult.recommendations && testResult.recommendations.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Recommendations:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {testResult.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Additional Information */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Debug Information:</strong>
              <div className="mt-2 space-y-1 text-sm">
                <p>• Project ID: {projectId}</p>
                <p>• Server Endpoint: {`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/email-waitlist`}</p>
                <p>• Debug Endpoint: {`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/debug-email-capture`}</p>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}