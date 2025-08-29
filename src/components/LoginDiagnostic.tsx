"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { getSupabaseClient, getSupabaseClientDiagnostics, handleSupabaseError } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { 
  User, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Key,
  Database,
  Globe,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';

interface DiagnosticResult {
  status: 'success' | 'warning' | 'error' | 'pending';
  message: string;
  details?: string;
  timestamp: string;
}

interface LoginAttempt {
  email: string;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
  error?: string;
  userExists?: boolean;
}

export function LoginDiagnostic() {
  const { user, session, loading, signIn, signOut, refreshSession } = useAuth();
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  
  // Test login form
  const [testEmail, setTestEmail] = useState('johnferreira@gmail.com');
  const [testPassword, setTestPassword] = useState('');
  const [isTestingLogin, setIsTestingLogin] = useState(false);

  // Add diagnostic result helper
  const addResult = (status: DiagnosticResult['status'], message: string, details?: string) => {
    const result: DiagnosticResult = {
      status,
      message,
      details,
      timestamp: new Date().toLocaleTimeString()
    };
    setDiagnosticResults(prev => [result, ...prev]);
    return result;
  };

  // Run comprehensive auth diagnostics
  const runDiagnostics = async () => {
    setIsRunningTests(true);
    setDiagnosticResults([]);
    
    try {
      // 1. Check Supabase client configuration
      addResult('pending', 'Testing Supabase client configuration...');
      const clientDiagnostics = getSupabaseClientDiagnostics();
      
      if (clientDiagnostics.hasInstance) {
        addResult('success', 'Supabase client instance created successfully', 
          `Instance count: ${clientDiagnostics.instanceCount}, URL: ${clientDiagnostics.url}`);
      } else {
        addResult('error', 'No Supabase client instance found');
      }

      // 2. Test basic connectivity
      addResult('pending', 'Testing Supabase connectivity...');
      const supabase = getSupabaseClient();
      
      try {
        const { data: healthCheck, error: healthError } = await supabase
          .from('kv_store_ed0fe4c2')
          .select('id')
          .limit(1);
        
        if (healthError) {
          addResult('error', 'Database connectivity failed', healthError.message);
        } else {
          addResult('success', 'Database connectivity working');
        }
      } catch (dbError: any) {
        addResult('error', 'Database connection error', dbError.message);
      }

      // 3. Check current session
      addResult('pending', 'Checking current authentication session...');
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        addResult('error', 'Session check failed', sessionError.message);
      } else if (currentSession) {
        addResult('success', 'Active session found', 
          `User: ${currentSession.user?.email}, Expires: ${new Date(currentSession.expires_at! * 1000).toLocaleString()}`);
      } else {
        addResult('warning', 'No active session found');
      }

      // 4. Test user lookup for johnferreira@gmail.com
      addResult('pending', 'Checking if user exists in system...');
      try {
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
          addResult('warning', 'Cannot check user existence (admin API access required)', authError.message);
        } else {
          const targetUser = authUsers.users?.find(u => u.email === testEmail);
          if (targetUser) {
            addResult('success', `User ${testEmail} exists in authentication system`, 
              `Created: ${new Date(targetUser.created_at!).toLocaleString()}, Confirmed: ${targetUser.email_confirmed_at ? 'Yes' : 'No'}`);
          } else {
            addResult('warning', `User ${testEmail} not found in authentication system`);
          }
        }
      } catch (userCheckError: any) {
        addResult('warning', 'User existence check failed', userCheckError.message);
      }

      // 5. Check localStorage auth data
      addResult('pending', 'Checking local storage authentication data...');
      try {
        const authKeys = Object.keys(localStorage).filter(key => 
          key.includes('supabase') || key.includes('healthscan')
        );
        
        if (authKeys.length > 0) {
          const authData = authKeys.map(key => {
            try {
              const value = localStorage.getItem(key);
              return `${key}: ${value ? 'present' : 'null'}`;
            } catch {
              return `${key}: error reading`;
            }
          }).join(', ');
          
          addResult('success', 'Local storage auth data found', authData);
        } else {
          addResult('warning', 'No authentication data in local storage');
        }
      } catch (storageError: any) {
        addResult('error', 'Local storage check failed', storageError.message);
      }

      // 6. Test auth endpoint connectivity
      addResult('pending', 'Testing direct auth endpoint...');
      try {
        const response = await fetch(`https://${projectId}.supabase.co/auth/v1/settings`, {
          method: 'GET',
          headers: {
            'apikey': publicAnonKey,
            'Authorization': `Bearer ${publicAnonKey}`
          }
        });
        
        if (response.ok) {
          const settings = await response.json();
          addResult('success', 'Auth endpoint accessible', 
            `External providers: ${Object.keys(settings.external || {}).join(', ') || 'none'}`);
        } else {
          addResult('error', 'Auth endpoint not accessible', `Status: ${response.status}`);
        }
      } catch (authEndpointError: any) {
        addResult('error', 'Auth endpoint test failed', authEndpointError.message);
      }

    } catch (error: any) {
      addResult('error', 'Diagnostic test failed', error.message);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Test login with specific credentials
  const testLogin = async () => {
    if (!testEmail || !testPassword) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsTestingLogin(true);
    const timestamp = new Date().toLocaleTimeString();
    
    // Add pending attempt
    const attempt: LoginAttempt = {
      email: testEmail,
      timestamp,
      status: 'pending'
    };
    setLoginAttempts(prev => [attempt, ...prev]);

    try {
      console.log('🧪 Testing login for:', testEmail);
      const result = await signIn(testEmail, testPassword);
      
      if (result.error) {
        const failedAttempt: LoginAttempt = {
          email: testEmail,
          timestamp,
          status: 'failed',
          error: result.error.message || 'Unknown error',
          userExists: result.error.userExists
        };
        setLoginAttempts(prev => [failedAttempt, ...prev.slice(1)]);
        
        addResult('error', 'Login test failed', 
          `Error: ${result.error.message}${result.error.userExists !== undefined ? `, User exists: ${result.error.userExists}` : ''}`);
        
        toast.error(`Login failed: ${result.error.message}`);
      } else {
        const successAttempt: LoginAttempt = {
          email: testEmail,
          timestamp,
          status: 'success'
        };
        setLoginAttempts(prev => [successAttempt, ...prev.slice(1)]);
        
        addResult('success', 'Login test successful', `Successfully authenticated as ${testEmail}`);
        toast.success('Login test successful!');
      }
    } catch (error: any) {
      const failedAttempt: LoginAttempt = {
        email: testEmail,
        timestamp,
        status: 'failed',
        error: error.message || 'Network error'
      };
      setLoginAttempts(prev => [failedAttempt, ...prev.slice(1)]);
      
      addResult('error', 'Login test error', error.message);
      toast.error('Login test failed');
    } finally {
      setIsTestingLogin(false);
    }
  };

  // Clear all diagnostic results
  const clearResults = () => {
    setDiagnosticResults([]);
    setLoginAttempts([]);
  };

  // Reset auth state
  const resetAuthState = async () => {
    try {
      await signOut();
      localStorage.clear();
      await refreshSession();
      toast.success('Auth state reset successfully');
      addResult('success', 'Auth state reset completed');
    } catch (error: any) {
      toast.error('Failed to reset auth state');
      addResult('error', 'Auth state reset failed', error.message);
    }
  };

  useEffect(() => {
    // Run initial diagnostics on mount
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    const variants: Record<string, string> = {
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      pending: 'bg-blue-100 text-blue-800'
    };
    return variants[status] || variants.pending;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Login Diagnostic Tool</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Comprehensive authentication troubleshooting and testing tool for HealthScan login issues
          </p>
        </div>

        {/* Current Auth Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Current Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold mb-1">
                  {loading ? (
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600" />
                  ) : user ? (
                    <CheckCircle className="w-8 h-8 mx-auto text-green-600" />
                  ) : (
                    <XCircle className="w-8 h-8 mx-auto text-red-600" />
                  )}
                </div>
                <div className="text-sm font-medium">Authentication</div>
                <div className="text-xs text-gray-600 mt-1">
                  {loading ? 'Loading...' : user ? 'Authenticated' : 'Not authenticated'}
                </div>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold mb-1">
                  {session ? (
                    <Key className="w-8 h-8 mx-auto text-green-600" />
                  ) : (
                    <XCircle className="w-8 h-8 mx-auto text-red-600" />
                  )}
                </div>
                <div className="text-sm font-medium">Session</div>
                <div className="text-xs text-gray-600 mt-1">
                  {session ? 'Active' : 'No session'}
                </div>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold mb-1">
                  {user?.email ? (
                    <Mail className="w-8 h-8 mx-auto text-green-600" />
                  ) : (
                    <XCircle className="w-8 h-8 mx-auto text-red-600" />
                  )}
                </div>
                <div className="text-sm font-medium">User Email</div>
                <div className="text-xs text-gray-600 mt-1">
                  {user?.email || 'No email'}
                </div>
              </div>
            </div>

            {user && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">User Details:</h3>
                <div className="text-sm text-green-800 space-y-1">
                  <div><strong>Email:</strong> {user.email}</div>
                  <div><strong>ID:</strong> {user.id}</div>
                  <div><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</div>
                  <div><strong>Email Confirmed:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}</div>
                  <div><strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="diagnostics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="diagnostics">System Diagnostics</TabsTrigger>
            <TabsTrigger value="login-test">Login Test</TabsTrigger>
            <TabsTrigger value="history">Login History</TabsTrigger>
          </TabsList>

          {/* System Diagnostics Tab */}
          <TabsContent value="diagnostics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    System Diagnostics
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={clearResults}
                      variant="outline"
                      size="sm"
                    >
                      Clear Results
                    </Button>
                    <Button
                      onClick={runDiagnostics}
                      disabled={isRunningTests}
                      size="sm"
                    >
                      {isRunningTests ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Running Tests...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Run Diagnostics
                        </>
                      )}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {diagnosticResults.map((result, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{result.message}</span>
                          <Badge className={`text-xs ${getStatusBadge(result.status)}`}>
                            {result.status}
                          </Badge>
                          <span className="text-xs text-gray-500">{result.timestamp}</span>
                        </div>
                        {result.details && (
                          <p className="text-sm text-gray-600 mt-1">{result.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {diagnosticResults.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Click "Run Diagnostics" to start system tests</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Login Test Tab */}
          <TabsContent value="login-test">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Login Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); testLogin(); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-email">Email</Label>
                    <Input
                      id="test-email"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="Enter email to test"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="test-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="test-password"
                        type={showPassword ? "text" : "password"}
                        value={testPassword}
                        onChange={(e) => setTestPassword(e.target.value)}
                        placeholder="Enter password to test"
                        className="h-12 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={isTestingLogin || !testEmail || !testPassword}
                      className="flex-1"
                    >
                      {isTestingLogin ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Testing Login...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Test Login
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      onClick={resetAuthState}
                      variant="outline"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset Auth
                    </Button>
                  </div>
                </form>

                {/* Quick Actions */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Quick Actions:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                      onClick={() => {
                        setTestEmail('johnferreira@gmail.com');
                        setTestPassword('');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Set Target Email
                    </Button>
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(testEmail);
                        toast.success('Email copied to clipboard');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Copy Email
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Login History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Login Attempt History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loginAttempts.map((attempt, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      {attempt.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      ) : attempt.status === 'failed' ? (
                        <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin mt-0.5" />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{attempt.email}</span>
                          <Badge className={`text-xs ${
                            attempt.status === 'success' ? 'bg-green-100 text-green-800' :
                            attempt.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {attempt.status}
                          </Badge>
                          <span className="text-xs text-gray-500">{attempt.timestamp}</span>
                        </div>
                        
                        {attempt.error && (
                          <p className="text-sm text-red-600">{attempt.error}</p>
                        )}
                        
                        {attempt.userExists !== undefined && (
                          <p className="text-xs text-gray-600">
                            User exists in system: {attempt.userExists ? 'Yes' : 'No'}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {loginAttempts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No login attempts recorded yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help & Troubleshooting */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Common Login Issues & Solutions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Invalid Login Credentials:</strong> This usually means either the email doesn't exist in the system or the password is incorrect. 
                  Check the "Login Test" tab to verify if the account exists and test different passwords.
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Network Connection Issues:</strong> If you see connection errors, check your internet connection and try again. 
                  The diagnostic tests will help identify if the issue is with Supabase connectivity.
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Email Not Confirmed:</strong> Some accounts may require email confirmation. 
                  Check the current auth status section to see if email confirmation is pending.
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Session Conflicts:</strong> If you're experiencing auth conflicts, try using the "Reset Auth" button 
                  to clear all local authentication data and start fresh.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}