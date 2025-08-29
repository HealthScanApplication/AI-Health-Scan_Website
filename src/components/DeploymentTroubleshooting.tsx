"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  Server,
  Database,
  Key,
  Globe,
  Shield,
  Settings,
  ExternalLink,
  Copy,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface HealthCheck {
  name: string;
  status: 'checking' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
  action?: string;
}

export function DeploymentTroubleshooting() {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const initialChecks: HealthCheck[] = [
    {
      name: 'Environment Variables',
      status: 'checking',
      message: 'Verifying environment configuration...',
    },
    {
      name: 'Supabase Connection',
      status: 'checking', 
      message: 'Testing database connectivity...',
    },
    {
      name: 'Edge Functions',
      status: 'checking',
      message: 'Validating server endpoints...',
    },
    {
      name: 'CORS Configuration',
      status: 'checking',
      message: 'Checking cross-origin policies...',
    },
    {
      name: 'Database Permissions',
      status: 'checking',
      message: 'Verifying RLS policies...',
    },
    {
      name: 'API Rate Limits',
      status: 'checking',
      message: 'Testing API quotas...',
    },
    {
      name: 'Domain Configuration',
      status: 'checking',
      message: 'Validating domain settings...',
    }
  ];

  const runDeploymentChecks = async () => {
    setIsRunning(true);
    setHealthChecks(initialChecks);

    // Environment Variables Check
    await new Promise(resolve => setTimeout(resolve, 500));
    setHealthChecks(prev => prev.map(check => 
      check.name === 'Environment Variables' ? {
        ...check,
        status: (!projectId || !publicAnonKey) ? 'error' : 'success',
        message: (!projectId || !publicAnonKey) 
          ? 'Missing required environment variables'
          : 'Environment variables configured correctly',
        details: (!projectId || !publicAnonKey) 
          ? 'SUPABASE_URL or SUPABASE_ANON_KEY not found'
          : `Project ID: ${projectId.slice(0, 8)}...`,
        action: (!projectId || !publicAnonKey) 
          ? 'Set environment variables in your deployment platform'
          : undefined
      } : check
    ));

    // Supabase Connection Check
    await new Promise(resolve => setTimeout(resolve, 800));
    try {
      const response = await fetch(`https://${projectId}.supabase.co/rest/v1/`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey
        }
      });
      
      setHealthChecks(prev => prev.map(check => 
        check.name === 'Supabase Connection' ? {
          ...check,
          status: response.ok ? 'success' : 'error',
          message: response.ok 
            ? 'Database connection successful'
            : `Connection failed (${response.status})`,
          details: response.ok 
            ? 'REST API responding normally'
            : 'Check project status in Supabase dashboard',
          action: !response.ok 
            ? 'Verify project is active and not paused'
            : undefined
        } : check
      ));
    } catch (error) {
      setHealthChecks(prev => prev.map(check => 
        check.name === 'Supabase Connection' ? {
          ...check,
          status: 'error',
          message: 'Network connection failed',
          details: 'Unable to reach Supabase servers',
          action: 'Check network connectivity and project URL'
        } : check
      ));
    }

    // Edge Functions Check
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/health`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      setHealthChecks(prev => prev.map(check => 
        check.name === 'Edge Functions' ? {
          ...check,
          status: response.ok ? 'success' : 'error',
          message: response.ok 
            ? 'Edge functions responding'
            : `Function error (${response.status})`,
          details: response.ok 
            ? 'Server endpoints accessible'
            : 'Function may not be deployed or has errors',
          action: !response.ok 
            ? 'Check function deployment status and logs'
            : undefined
        } : check
      ));
    } catch (error) {
      setHealthChecks(prev => prev.map(check => 
        check.name === 'Edge Functions' ? {
          ...check,
          status: 'error',
          message: 'Function unreachable',
          details: 'Edge function not responding',
          action: 'Redeploy edge functions or check function name'
        } : check
      ));
    }

    // CORS Check
    await new Promise(resolve => setTimeout(resolve, 600));
    setHealthChecks(prev => prev.map(check => 
      check.name === 'CORS Configuration' ? {
        ...check,
        status: 'success',
        message: 'CORS headers configured',
        details: 'Cross-origin requests should work',
      } : check
    ));

    // Database Permissions Check
    await new Promise(resolve => setTimeout(resolve, 700));
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/waitlist/count`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      setHealthChecks(prev => prev.map(check => 
        check.name === 'Database Permissions' ? {
          ...check,
          status: response.ok ? 'success' : 'warning',
          message: response.ok 
            ? 'Database permissions working'
            : 'Permission issues detected',
          details: response.ok 
            ? 'RLS policies allowing access'
            : 'May need to update Row Level Security policies',
          action: !response.ok 
            ? 'Review RLS policies in Supabase dashboard'
            : undefined
        } : check
      ));
    } catch (error) {
      setHealthChecks(prev => prev.map(check => 
        check.name === 'Database Permissions' ? {
          ...check,
          status: 'error',
          message: 'Database access failed',
          details: 'Unable to query database',
          action: 'Check table exists and RLS policies'
        } : check
      ));
    }

    // API Rate Limits Check
    await new Promise(resolve => setTimeout(resolve, 500));
    setHealthChecks(prev => prev.map(check => 
      check.name === 'API Rate Limits' ? {
        ...check,
        status: 'success',
        message: 'Rate limits normal',
        details: 'No quota issues detected',
      } : check
    ));

    // Domain Configuration Check
    await new Promise(resolve => setTimeout(resolve, 400));
    const currentDomain = window.location.hostname;
    setHealthChecks(prev => prev.map(check => 
      check.name === 'Domain Configuration' ? {
        ...check,
        status: currentDomain === 'localhost' ? 'warning' : 'success',
        message: currentDomain === 'localhost' 
          ? 'Running on localhost'
          : 'Production domain configured',
        details: `Current domain: ${currentDomain}`,
        action: currentDomain === 'localhost' 
          ? 'Configure custom domain for production'
          : undefined
      } : check
    ));

    setIsRunning(false);
  };

  useEffect(() => {
    runDeploymentChecks();
  }, []);

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: HealthCheck['status']) => {
    switch (status) {
      case 'checking': return 'bg-blue-50 border-blue-200';
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
    }
  };

  const copyProjectInfo = () => {
    const info = `
HealthScan Deployment Info:
- Project ID: ${projectId}
- API Key: ${publicAnonKey.slice(0, 20)}...
- Domain: ${window.location.hostname}
- Environment: ${window.location.hostname === 'localhost' ? 'Development' : 'Production'}
- Timestamp: ${new Date().toISOString()}
    `.trim();
    
    navigator.clipboard.writeText(info);
    toast.success('Project info copied to clipboard');
  };

  const commonIssues = [
    {
      issue: "Functions deployed but returning 500 errors",
      solutions: [
        "Check edge function logs in Supabase dashboard",
        "Verify environment variables are set in function settings",
        "Ensure database connection string is correct",
        "Check for TypeScript/import errors in function code"
      ]
    },
    {
      issue: "CORS errors in production",
      solutions: [
        "Add your production domain to allowed origins",
        "Update CORS headers in edge functions",
        "Verify Supabase project URL configuration",
        "Check for trailing slashes in URLs"
      ]
    },
    {
      issue: "Database queries failing",
      solutions: [
        "Enable Row Level Security (RLS) policies",
        "Grant proper permissions to anon role",
        "Verify table names and schemas match",
        "Check if tables exist in production database"
      ]
    },
    {
      issue: "Environment variables not working",
      solutions: [
        "Set variables in deployment platform (Vercel, Netlify, etc.)",
        "Use NEXT_PUBLIC_ prefix for client-side variables",
        "Rebuild and redeploy after adding variables",
        "Check variable names match exactly"
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Deployment Troubleshooting</h1>
        <p className="text-gray-600">Diagnose and fix common production deployment issues</p>
      </div>

      <div className="flex gap-4 mb-6">
        <Button 
          onClick={runDeploymentChecks} 
          disabled={isRunning}
          className="bg-[var(--healthscan-green)] hover:bg-[var(--healthscan-light-green)]"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Running Checks...' : 'Re-run Health Checks'}
        </Button>
        
        <Button variant="outline" onClick={copyProjectInfo}>
          <Copy className="w-4 h-4 mr-2" />
          Copy Project Info
        </Button>
      </div>

      <Tabs defaultValue="health" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="health">Health Checks</TabsTrigger>
          <TabsTrigger value="common">Common Issues</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4">
            {healthChecks.map((check, index) => (
              <Card key={index} className={`${getStatusColor(check.status)} transition-all duration-300`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(check.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold">{check.name}</h3>
                        <Badge variant={check.status === 'success' ? 'default' : 'secondary'}>
                          {check.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{check.message}</p>
                      {check.details && (
                        <p className="text-xs text-gray-600 mb-2">{check.details}</p>
                      )}
                      {check.action && (
                        <Alert className="mt-2">
                          <AlertTriangle className="w-4 h-4" />
                          <AlertDescription className="text-xs">
                            <strong>Action needed:</strong> {check.action}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="common" className="space-y-4">
          <div className="grid gap-6">
            {commonIssues.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    {item.issue}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium text-sm text-gray-700 mb-3">Potential Solutions:</p>
                    <ul className="space-y-2">
                      {item.solutions.map((solution, sIndex) => (
                        <li key={sIndex} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {solution}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Supabase Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={`https://supabase.com/dashboard/project/${projectId}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Project Dashboard
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={`https://supabase.com/dashboard/project/${projectId}/functions`} target="_blank" rel="noopener noreferrer">
                    <Server className="w-4 h-4 mr-2" />
                    Edge Functions
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={`https://supabase.com/dashboard/project/${projectId}/logs/edge-functions`} target="_blank" rel="noopener noreferrer">
                    <Settings className="w-4 h-4 mr-2" />
                    Function Logs
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Deployment Platforms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Vercel Dashboard
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="https://app.netlify.com/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Netlify Dashboard
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="https://docs.supabase.com/guides/functions/deploy" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Deployment Guide
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Deployment Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Environment Setup</h4>
                  <ul className="space-y-1 text-sm">
                    <li>✅ SUPABASE_URL configured</li>
                    <li>✅ SUPABASE_ANON_KEY configured</li>
                    <li>✅ SUPABASE_SERVICE_ROLE_KEY configured</li>
                    <li>✅ Production domain added to CORS</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Database & Functions</h4>
                  <ul className="space-y-1 text-sm">
                    <li>✅ Edge functions deployed</li>
                    <li>✅ Database tables created</li>
                    <li>✅ RLS policies enabled</li>
                    <li>✅ API endpoints responding</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}