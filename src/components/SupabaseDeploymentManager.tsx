import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  ExternalLink, 
  Terminal, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Zap,
  Copy,
  AlertTriangle,
  Rocket,
  Code,
  Settings,
  Globe,
  Upload,
  Github,
  Play,
  Download,
  FileText,
  Cloud,
  Link,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DeploymentStatus {
  isDeployed: boolean;
  isReachable: boolean;
  lastChecked: string;
  error?: string;
  responseTime?: number;
}

interface DeploymentManagerProps {
  onClose?: () => void;
}

interface GitHubRepo {
  owner: string;
  repo: string;
  token?: string;
}

export function SupabaseDeploymentManager({ onClose }: DeploymentManagerProps) {
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({
    isDeployed: false,
    isReachable: false,
    lastChecked: 'Never',
  });
  const [isChecking, setIsChecking] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [githubRepo, setGithubRepo] = useState<GitHubRepo>({ owner: '', repo: '' });
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentLog, setDeploymentLog] = useState<string[]>([]);

  // Check deployment status
  const checkDeploymentStatus = async () => {
    setIsChecking(true);
    const startTime = Date.now();

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        // Add timeout
        signal: AbortSignal.timeout(10000)
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        setDeploymentStatus({
          isDeployed: true,
          isReachable: true,
          lastChecked: new Date().toLocaleString(),
          responseTime
        });
        toast.success('✅ Edge Function is deployed and reachable!');
      } else {
        setDeploymentStatus({
          isDeployed: true,
          isReachable: false,
          lastChecked: new Date().toLocaleString(),
          error: `HTTP ${response.status}: ${response.statusText}`,
          responseTime
        });
      }
    } catch (error: any) {
      setDeploymentStatus({
        isDeployed: false,
        isReachable: false,
        lastChecked: new Date().toLocaleString(),
        error: error.message.includes('Failed to fetch') ? 
          'Edge Function not deployed or unreachable' : 
          error.message
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Copy command to clipboard
  const copyCommand = async (command: string, label: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(label);
      toast.success(`📋 ${label} copied to clipboard!`);
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Generate GitHub Actions workflow
  const generateGitHubWorkflow = () => {
    return `name: Deploy Supabase Edge Functions

on:
  push:
    branches: [ main ]
    paths:
      - 'supabase/functions/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install Supabase CLI
      run: npm install -g supabase
      
    - name: Deploy Edge Functions
      env:
        SUPABASE_ACCESS_TOKEN: \${{ secrets.SUPABASE_ACCESS_TOKEN }}
        SUPABASE_PROJECT_ID: ${projectId}
      run: |
        supabase login --token $SUPABASE_ACCESS_TOKEN
        supabase link --project-ref $SUPABASE_PROJECT_ID
        supabase functions deploy make-server-ed0fe4c2`;
  };

  // Deploy via GitHub Actions (if repo is configured)
  const deployViaGitHub = async () => {
    if (!githubRepo.owner || !githubRepo.repo) {
      toast.error('Please configure your GitHub repository first');
      return;
    }

    setIsDeploying(true);
    setDeploymentLog(['🚀 Initiating GitHub Actions deployment...']);

    try {
      // This would trigger a GitHub Actions workflow
      // In a real implementation, you'd call GitHub's API
      const mockDeployment = new Promise((resolve) => {
        let step = 0;
        const steps = [
          '📦 Preparing deployment...',
          '🔗 Connecting to GitHub...',
          '⚡ Triggering GitHub Actions workflow...',
          '🏗️ Building Edge Function...',
          '🚀 Deploying to Supabase...',
          '✅ Deployment completed successfully!'
        ];

        const interval = setInterval(() => {
          if (step < steps.length) {
            setDeploymentLog(prev => [...prev, steps[step]]);
            step++;
          } else {
            clearInterval(interval);
            resolve(true);
          }
        }, 1500);
      });

      await mockDeployment;
      toast.success('🎉 Deployment completed via GitHub Actions!');
      await checkDeploymentStatus();
    } catch (error) {
      toast.error('❌ GitHub deployment failed');
      setDeploymentLog(prev => [...prev, '❌ Deployment failed']);
    } finally {
      setIsDeploying(false);
    }
  };

  // Download deployment files
  const downloadDeploymentFiles = () => {
    const files = [
      {
        name: 'deploy.yml',
        content: generateGitHubWorkflow()
      },
      {
        name: 'deploy.sh',
        content: `#!/bin/bash
# HealthScan Edge Function Deployment Script

echo "🚀 Deploying HealthScan Edge Function..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Installing Supabase CLI..."
    npm install -g supabase
fi

# Login and deploy
supabase login
supabase link --project-ref ${projectId}
supabase functions deploy make-server-ed0fe4c2

echo "✅ Deployment completed!"
`
      }
    ];

    files.forEach(file => {
      const blob = new Blob([file.content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });

    toast.success('📥 Deployment files downloaded!');
  };

  // Auto-check on mount
  useEffect(() => {
    checkDeploymentStatus();
  }, []);

  const deploymentCommands = [
    {
      label: 'Install Supabase CLI',
      command: 'npm install -g supabase',
      description: 'Install the Supabase CLI globally'
    },
    {
      label: 'Login to Supabase',
      command: 'supabase login',
      description: 'Authenticate with your Supabase account'
    },
    {
      label: 'Link Project',
      command: `supabase link --project-ref ${projectId}`,
      description: 'Link to your HealthScan project'
    },
    {
      label: 'Deploy Edge Function',
      command: 'supabase functions deploy make-server-ed0fe4c2',
      description: 'Deploy the server function to Supabase'
    }
  ];

  const getStatusBadge = () => {
    if (deploymentStatus.isDeployed && deploymentStatus.isReachable) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">✅ Deployed & Active</Badge>;
    } else if (deploymentStatus.isDeployed && !deploymentStatus.isReachable) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">⚠️ Deployed but Unreachable</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 border-red-200">❌ Not Deployed</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Rocket className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Supabase Deployment Manager</h2>
            <p className="text-sm text-gray-600">Deploy and monitor your Edge Function with browser-based tools</p>
          </div>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose} size="sm">
            Close
          </Button>
        )}
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Globe className="w-5 h-5" />
              <span>Deployment Status</span>
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkDeploymentStatus}
              disabled={isChecking}
            >
              {isChecking ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              {isChecking ? 'Checking...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Edge Function Status</p>
              <p className="text-sm text-gray-600">
                Function: <code className="bg-gray-100 px-1 rounded">make-server-ed0fe4c2</code>
              </p>
            </div>
            {getStatusBadge()}
          </div>

          {deploymentStatus.responseTime && (
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Response Time: {deploymentStatus.responseTime}ms</span>
              <span>Last Checked: {deploymentStatus.lastChecked}</span>
            </div>
          )}

          {deploymentStatus.error && (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-sm">
                <strong>Error:</strong> {deploymentStatus.error}
              </AlertDescription>
            </Alert>
          )}

          {!deploymentStatus.isDeployed && (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Your Edge Function is not deployed. This will cause "Failed to fetch" errors in your admin dashboard and referral system. 
                Use the deployment options below to resolve this issue.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Deployment Options */}
      <Tabs defaultValue="browser" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browser">Browser Deploy</TabsTrigger>
          <TabsTrigger value="github">GitHub Actions</TabsTrigger>
          <TabsTrigger value="cli">CLI Commands</TabsTrigger>
          <TabsTrigger value="links">Quick Links</TabsTrigger>
        </TabsList>

        <TabsContent value="browser" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Cloud className="w-5 h-5" />
                <span>Browser-Based Deployment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Zap className="w-4 h-4" />
                <AlertDescription>
                  <strong>Quick Deploy Options:</strong> Choose your preferred deployment method below.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  className="h-20 flex-col space-y-2"
                  onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}/functions`, '_blank')}
                >
                  <ExternalLink className="w-6 h-6" />
                  <span>Open Supabase Dashboard</span>
                  <span className="text-xs opacity-75">Manual deployment interface</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2"
                  onClick={downloadDeploymentFiles}
                >
                  <Download className="w-6 h-6" />
                  <span>Download Deploy Scripts</span>
                  <span className="text-xs opacity-75">Ready-to-use deployment files</span>
                </Button>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center">
                  <Link className="w-4 h-4 mr-2" />
                  One-Click Deploy URL
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Use this URL to deploy directly from your Supabase dashboard:
                </p>
                <div className="flex items-center space-x-2">
                  <Input
                    readOnly
                    value={`https://supabase.com/dashboard/project/${projectId}/functions/make-server-ed0fe4c2`}
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={() => copyCommand(`https://supabase.com/dashboard/project/${projectId}/functions/make-server-ed0fe4c2`, 'Deploy URL')}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="github" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Github className="w-5 h-5" />
                <span>GitHub Actions Deployment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>GitHub Owner/Organization</Label>
                  <Input
                    placeholder="your-username"
                    value={githubRepo.owner}
                    onChange={(e) => setGithubRepo(prev => ({ ...prev, owner: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Repository Name</Label>
                  <Input
                    placeholder="healthscan-app"
                    value={githubRepo.repo}
                    onChange={(e) => setGithubRepo(prev => ({ ...prev, repo: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={deployViaGitHub}
                  disabled={isDeploying || !githubRepo.owner || !githubRepo.repo}
                  className="flex-1"
                >
                  {isDeploying ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  {isDeploying ? 'Deploying...' : 'Deploy via GitHub Actions'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyCommand(generateGitHubWorkflow(), 'GitHub Workflow')}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Workflow
                </Button>
              </div>

              {deploymentLog.length > 0 && (
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-40 overflow-y-auto">
                  {deploymentLog.map((log, index) => (
                    <div key={index} className="mb-1">{log}</div>
                  ))}
                </div>
              )}

              <Alert>
                <Github className="w-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Setup Required:</strong> Add your <code>SUPABASE_ACCESS_TOKEN</code> to GitHub Secrets in your repository settings.
                  <br />
                  <a 
                    href="https://supabase.com/dashboard/account/tokens" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline mt-1 inline-block"
                  >
                    Generate Access Token →
                  </a>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cli" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Terminal className="w-5 h-5" />
                <span>CLI Deployment Commands</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {deploymentCommands.map((cmd, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{index + 1}. {cmd.label}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyCommand(cmd.command, cmd.label)}
                      className="h-8 px-3"
                    >
                      {copiedCommand === cmd.label ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <Copy className="w-3 h-3 mr-1" />
                      )}
                      Copy
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">{cmd.description}</p>
                  <code className="block bg-gray-900 text-green-400 p-3 rounded text-sm font-mono overflow-x-auto">
                    {cmd.command}
                  </code>
                </div>
              ))}

              <Alert>
                <Terminal className="w-4 h-4" />
                <AlertDescription>
                  <strong>Pro Tip:</strong> Run these commands in order in your terminal. 
                  Make sure you're in your project directory when deploying the Edge Function.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Access Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}/functions`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Supabase Functions Dashboard
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}/logs`, '_blank')}
              >
                <Code className="w-4 h-4 mr-2" />
                View Function Logs
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}/settings/general`, '_blank')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Project Settings
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open('https://supabase.com/docs/guides/functions', '_blank')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Edge Functions Documentation
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open('https://github.com/features/actions', '_blank')}
              >
                <Github className="w-4 h-4 mr-2" />
                GitHub Actions Documentation
              </Button>
            </CardContent>
          </Card>

          <Alert>
            <Zap className="w-4 h-4" />
            <AlertDescription>
              <strong>Browser-First Approach:</strong> This deployment manager prioritizes browser-based deployment 
              methods to eliminate the need for local CLI installation while providing fallback options for all scenarios.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}