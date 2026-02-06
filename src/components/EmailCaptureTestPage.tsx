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
  TestTube
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  errorDetails?: string;
  requestDetails?: any;
  responseDetails?: any;
}

export function EmailCaptureTestPage() {
  const [email, setEmail] = useState('johnferreira@gmail.com'); // Use the problematic email
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);

  const testEmailCapture = async () => {
    setTesting(true);
    setTestResult(null);

    const testStartTime = Date.now();
    console.log('🧪 Starting email capture test for:', email);

    try {
      const requestBody = {
        email: email.trim().toLowerCase(),
        name: email.split('@')[0],
        source: 'test-page'
      };

      console.log('📤 Sending request:', requestBody);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/email-waitlist`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(requestBody)
        }
      );

      const responseText = await response.text();
      const testDuration = Date.now() - testStartTime;
      
      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText,
        duration: `${testDuration}ms`
      });

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError);
        responseData = { rawResponse: responseText };
      }

      const result: TestResult = {
        success: response.ok && responseData.success,
        message: response.ok && responseData.success 
          ? `✅ Success: ${responseData.message}`
          : `❌ Error: ${responseData.error || `HTTP ${response.status}: ${response.statusText}`}`,
        data: responseData,
        requestDetails: {
          url: `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/email-waitlist`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey.substring(0, 20)}...`
          },
          body: requestBody,
          duration: `${testDuration}ms`
        },
        responseDetails: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseData,
          rawBody: responseText
        }
      };

      // Add detailed analysis
      if (result.success) {
        if (responseData.alreadyExists || responseData.isUpdate) {
          result.message = `✅ Existing User: Welcome back! You're already on the waitlist.`;
        } else {
          result.message = `✅ New Signup: Welcome to the waitlist!`;
        }
      } else {
        // Analyze the specific error type
        if (response.status === 200 && responseData.alreadyExists) {
          result.success = true;
          result.message = `✅ Existing User (Status 200): This should be treated as success`;
        } else if (responseData.errorType) {
          result.message = `❌ ${responseData.errorType}: ${responseData.error}`;
        }
      }

      setTestResult(result);
      setTestHistory(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 tests

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

    } catch (error: any) {
      console.error('❌ Test failed with exception:', error);
      
      const result: TestResult = {
        success: false,
        message: `❌ Network/Exception Error: ${error.message}`,
        errorDetails: error.stack,
        requestDetails: {
          url: `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/email-waitlist`,
          method: 'POST',
          error: error.message
        }
      };

      setTestResult(result);
      setTestHistory(prev => [result, ...prev.slice(0, 4)]);
      toast.error(result.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Email Capture Test Page
          </CardTitle>
          <p className="text-sm text-gray-600">
            Test the email capture functionality to diagnose "User already registered" issues.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email to Test</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="max-w-md"
              />
            </div>

            <Button
              onClick={testEmailCapture}
              disabled={testing || !email}
              className="flex items-center gap-2"
            >
              {testing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Test Email Capture
            </Button>
          </div>

          {/* Current Test Result */}
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

              {/* Response Data */}
              {testResult.data && (
                <div className="space-y-3">
                  <h4 className="font-medium">Response Data</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {testResult.data.success !== undefined && (
                      <div className="flex items-center gap-2">
                        {testResult.data.success ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-500" />
                        )}
                        Success: {testResult.data.success ? 'true' : 'false'}
                      </div>
                    )}
                    
                    {testResult.data.alreadyExists !== undefined && (
                      <div className="flex items-center gap-2">
                        {testResult.data.alreadyExists ? (
                          <CheckCircle className="w-3 h-3 text-blue-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-gray-400" />
                        )}
                        Already Exists: {testResult.data.alreadyExists ? 'true' : 'false'}
                      </div>
                    )}

                    {testResult.data.position && (
                      <div>Position: #{testResult.data.position}</div>
                    )}

                    {testResult.data.referralCode && (
                      <div>Referral Code: {testResult.data.referralCode}</div>
                    )}

                    {testResult.data.totalWaitlist && (
                      <div>Total Waitlist: {testResult.data.totalWaitlist}</div>
                    )}

                    {testResult.data.error && (
                      <div className="text-red-600">Error: {testResult.data.error}</div>
                    )}

                    {testResult.data.errorType && (
                      <div className="text-red-600">Error Type: {testResult.data.errorType}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Request/Response Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Request Details */}
                {testResult.requestDetails && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700">Request Details</h5>
                    <div className="text-xs bg-gray-50 p-3 rounded border">
                      <div>Method: {testResult.requestDetails.method}</div>
                      <div>URL: {testResult.requestDetails.url}</div>
                      <div>Duration: {testResult.requestDetails.duration}</div>
                      {testResult.requestDetails.body && (
                        <div>Body: {JSON.stringify(testResult.requestDetails.body, null, 2)}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Response Details */}
                {testResult.responseDetails && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700">Response Details</h5>
                    <div className="text-xs bg-gray-50 p-3 rounded border">
                      <div>Status: {testResult.responseDetails.status} {testResult.responseDetails.statusText}</div>
                      <div>Body: {JSON.stringify(testResult.responseDetails.body, null, 2)}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Details */}
              {testResult.errorDetails && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error Details:</strong>
                    <pre className="mt-2 text-xs overflow-auto">{testResult.errorDetails}</pre>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Test History */}
          {testHistory.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Recent Tests</h4>
              <div className="space-y-2">
                {testHistory.map((test, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                    {test.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span>{test.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Debug Information */}
          <Alert>
            <Bug className="h-4 w-4" />
            <AlertDescription>
              <strong>Debug Information:</strong>
              <div className="mt-2 space-y-1 text-sm">
                <p>• Project ID: {projectId}</p>
                <p>• Test Email: {email}</p>
                <p>• Endpoint: https://{projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/email-waitlist</p>
                <p>• Expected Behavior: Existing users should return success with alreadyExists: true</p>
                <p>• Issue: "User already registered" errors should be treated as successful existing user responses</p>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}