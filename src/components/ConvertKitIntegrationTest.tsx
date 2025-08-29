"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { toast } from "sonner@2.0.3";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Mail, 
  Database, 
  Settings, 
  Play,
  Eye,
  RefreshCw
} from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface TestResult {
  step: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
  timestamp: string;
}

interface ConvertKitStatus {
  configured: boolean;
  hasApiKey: boolean;
  hasSecret: boolean;
  formId: string;
}

export function ConvertKitIntegrationTest() {
  const [testEmail, setTestEmail] = useState("marketing@healthscan.live");
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [convertKitStatus, setConvertKitStatus] = useState<ConvertKitStatus | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const addResult = (step: string, status: TestResult['status'], message: string, details?: any) => {
    const result: TestResult = {
      step,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    setTestResults(prev => [...prev, result]);
    
    // Also log to console for debugging
    console.log(`ConvertKit Test - ${step}:`, { status, message, details });
  };

  const checkConvertKitStatus = async () => {
    try {
      addResult("Status Check", "pending", "Checking ConvertKit configuration...");
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/convertkit-status`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        addResult("Status Check", "error", `Failed to check ConvertKit status: ${response.status}`, errorText);
        return false;
      }

      const data = await response.json();
      setConvertKitStatus(data.status);
      
      if (data.status.configured) {
        addResult("Status Check", "success", "ConvertKit is properly configured", data.status);
      } else {
        addResult("Status Check", "warning", "ConvertKit is not configured - API key missing", data.status);
      }
      
      return data.status.configured;
    } catch (error: any) {
      addResult("Status Check", "error", `ConvertKit status check failed: ${error.message}`, error);
      return false;
    }
  };

  const testWaitlistSignup = async () => {
    try {
      addResult("Waitlist Signup", "pending", `Testing waitlist signup for ${testEmail}...`);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/email-waitlist`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ 
            email: testEmail,
            name: "ConvertKit Test User"
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        addResult("Waitlist Signup", "error", `Waitlist signup failed: ${response.status}`, errorData);
        return null;
      }

      const data = await response.json();
      
      if (data.success) {
        addResult("Waitlist Signup", "success", `Successfully added to waitlist at position #${data.position}`, data);
        
        // Check ConvertKit integration result
        if (data.convertKit) {
          if (data.convertKit.subscribed) {
            addResult("ConvertKit Integration", "success", "Email successfully subscribed to ConvertKit", data.convertKit);
          } else if (!data.convertKit.configured) {
            addResult("ConvertKit Integration", "warning", "ConvertKit not configured - skipped subscription", data.convertKit);
          } else {
            addResult("ConvertKit Integration", "error", `ConvertKit subscription failed: ${data.convertKit.error}`, data.convertKit);
          }
        }
        
        return data;
      } else {
        addResult("Waitlist Signup", "error", `Waitlist signup failed: ${data.error}`, data);
        return null;
      }
    } catch (error: any) {
      addResult("Waitlist Signup", "error", `Waitlist signup request failed: ${error.message}`, error);
      return null;
    }
  };

  const testUserPosition = async () => {
    try {
      addResult("Position Check", "pending", `Checking queue position for ${testEmail}...`);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/user-queue-position`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ email: testEmail })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        addResult("Position Check", "error", `Position check failed: ${response.status}`, errorData);
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        addResult("Position Check", "success", `User found at position #${data.position} out of ${data.totalUsers} users`, data);
      } else {
        addResult("Position Check", "warning", `User not found in queue: ${data.error}`, data);
      }
    } catch (error: any) {
      addResult("Position Check", "error", `Position check request failed: ${error.message}`, error);
    }
  };

  const runFullTest = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setTestResults([]);
    
    try {
      // Step 1: Check ConvertKit Configuration
      const isConfigured = await checkConvertKitStatus();
      
      // Step 2: Test Waitlist Signup (includes ConvertKit integration)
      const signupResult = await testWaitlistSignup();
      
      // Step 3: Verify user position in queue
      if (signupResult) {
        await testUserPosition();
      }
      
      // Final summary
      const hasErrors = testResults.some(r => r.status === 'error');
      const hasWarnings = testResults.some(r => r.status === 'warning');
      
      if (hasErrors) {
        addResult("Test Summary", "error", "Test completed with errors - check ConvertKit API key configuration");
        toast.error("ConvertKit integration test failed - check the results below");
      } else if (hasWarnings) {
        addResult("Test Summary", "warning", "Test completed with warnings - ConvertKit may not be fully configured");
        toast.warning("ConvertKit integration test completed with warnings");
      } else {
        addResult("Test Summary", "success", "All tests passed successfully! ConvertKit integration is working correctly.");
        toast.success("ConvertKit integration test passed successfully!");
      }
      
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setConvertKitStatus(null);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'pending':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'pending':
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-green-600" />
            ConvertKit Integration Test
          </CardTitle>
          <p className="text-sm text-gray-600">
            Test the ConvertKit integration with your waitlist signup process. This will verify that emails are properly synchronized between your Supabase database and ConvertKit.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Configuration */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Test Email Address</label>
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter email to test"
              className="input-standard"
            />
            <p className="text-xs text-gray-500">
              This email will be added to your waitlist and ConvertKit (if configured)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={runFullTest}
              disabled={isRunning || !testEmail}
              className="btn-major bg-green-600 hover:bg-green-700"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Full Test
                </>
              )}
            </Button>
            
            <Button
              onClick={checkConvertKitStatus}
              disabled={isRunning}
              variant="outline"
              className="btn-standard"
            >
              <Settings className="w-4 h-4 mr-2" />
              Check Status Only
            </Button>
            
            <Button
              onClick={clearResults}
              disabled={isRunning}
              variant="outline"
              className="btn-standard"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear Results
            </Button>
            
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="ghost"
              className="btn-standard"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ConvertKit Status */}
      {convertKitStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ConvertKit Configuration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Badge variant={convertKitStatus.configured ? "default" : "destructive"}>
                  {convertKitStatus.configured ? "Configured" : "Not Configured"}
                </Badge>
                <span className="text-sm">Overall Status</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={convertKitStatus.hasApiKey ? "default" : "secondary"}>
                  {convertKitStatus.hasApiKey ? "Present" : "Missing"}
                </Badge>
                <span className="text-sm">API Key</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={convertKitStatus.hasSecret ? "default" : "secondary"}>
                  {convertKitStatus.hasSecret ? "Present" : "Missing"}
                </Badge>
                <span className="text-sm">API Secret</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {convertKitStatus.formId}
                </Badge>
                <span className="text-sm">Form ID</span>
              </div>
            </div>
            
            {!convertKitStatus.configured && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> ConvertKit API key is not configured. Emails will still be added to your Supabase waitlist, 
                  but won't be synchronized to ConvertKit. Upload your API key using the secret manager to enable full integration.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Results</CardTitle>
            <p className="text-sm text-gray-600">
              Detailed log of the integration test process
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded-lg ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(result.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{result.step}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{result.message}</p>
                      
                      {showDetails && result.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            Show technical details
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Use This Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium">What this test does:</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Checks if ConvertKit is properly configured with your API key</li>
              <li>• Tests the waitlist signup process with ConvertKit integration</li>
              <li>• Verifies the email is added to both Supabase and ConvertKit</li>
              <li>• Checks the user's position in the waitlist queue</li>
            </ul>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-medium">Expected Results:</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• <strong>Green (Success):</strong> Everything is working correctly</li>
              <li>• <strong>Yellow (Warning):</strong> ConvertKit may not be configured, but Supabase works</li>
              <li>• <strong>Red (Error):</strong> There's an issue that needs to be fixed</li>
            </ul>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-medium">Troubleshooting:</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• If ConvertKit shows "Not Configured": Upload your CONVERTER_KIT_API_KEY in the secret manager</li>
              <li>• If waitlist signup fails: Check your server logs and Supabase connection</li>
              <li>• If emails aren't appearing in ConvertKit: Verify your form ID (293a519eba) is correct</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}