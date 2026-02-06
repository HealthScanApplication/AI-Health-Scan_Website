import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner';
import { Zap, Plus, Settings, TestTube, Activity, Trash2, Copy, ExternalLink, CheckCircle, XCircle, Clock, AlertTriangle, BookOpen, HelpCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { ZapierSetupGuide } from './ZapierSetupGuide';

interface ZapierConfig {
  config_name: string;
  webhook_url: string;
  auth_token?: string;
  triggers: string[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface WebhookLog {
  trigger: string;
  status: 'success' | 'error';
  timestamp: string;
  error?: string;
  user_id?: string;
  email?: string;
  webhook_url?: string;
}

const AVAILABLE_TRIGGERS = [
  { id: 'user_registered', name: 'User Registration', description: 'Triggered when a new user signs up' },
  { id: 'waitlist_joined', name: 'Waitlist Signup', description: 'Triggered when someone joins the waitlist' },
  { id: 'scan_completed', name: 'Scan Completed', description: 'Triggered when a user completes a health scan' },
  { id: 'referral_milestone', name: 'Referral Milestone', description: 'Triggered when a user reaches referral milestones' }
];

export function ZapierIntegration() {
  const [configurations, setConfigurations] = useState<ZapierConfig[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [showNewConfigDialog, setShowNewConfigDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ZapierConfig | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  
  // New configuration form state
  const [newConfig, setNewConfig] = useState({
    config_name: '',
    webhook_url: '',
    auth_token: '',
    triggers: [] as string[],
    enabled: true
  });

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2`;

  // Load configurations and logs
  useEffect(() => {
    loadConfigurations();
    loadLogs();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${serverUrl}/zapier/webhook/config`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load configurations');
      }

      const data = await response.json();
      if (data.success) {
        setConfigurations(data.configurations || []);
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
      toast.error('Failed to load Zapier configurations');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await fetch(`${serverUrl}/zapier/webhook/logs`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load logs');
      }

      const data = await response.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Failed to load webhook logs');
    }
  };

  const saveConfiguration = async () => {
    try {
      setLoading(true);
      
      if (!newConfig.config_name || !newConfig.webhook_url) {
        toast.error('Configuration name and webhook URL are required');
        return;
      }

      const response = await fetch(`${serverUrl}/zapier/webhook/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(newConfig)
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Zapier configuration saved successfully');
        setShowNewConfigDialog(false);
        resetNewConfigForm();
        loadConfigurations();
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const deleteConfiguration = async (configName: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${serverUrl}/zapier/webhook/config/${configName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete configuration');
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Configuration deleted successfully');
        loadConfigurations();
      }
    } catch (error) {
      console.error('Error deleting configuration:', error);
      toast.error('Failed to delete configuration');
    } finally {
      setLoading(false);
    }
  };

  const testWebhook = async (config: ZapierConfig) => {
    try {
      setTestingWebhook(config.config_name);
      
      const response = await fetch(`${serverUrl}/zapier/webhook/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          webhook_url: config.webhook_url,
          auth_token: config.auth_token
        })
      });

      if (!response.ok) {
        throw new Error('Test webhook failed');
      }

      const data = await response.json();
      if (data.success) {
        toast.success(`Test webhook sent successfully (Status: ${data.webhook_response_status})`);
        loadLogs(); // Refresh logs to show the test
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast.error('Test webhook failed');
    } finally {
      setTestingWebhook(null);
    }
  };

  const resetNewConfigForm = () => {
    setNewConfig({
      config_name: '',
      webhook_url: '',
      auth_token: '',
      triggers: [],
      enabled: true
    });
  };

  const toggleTrigger = (triggerId: string) => {
    setNewConfig(prev => ({
      ...prev,
      triggers: prev.triggers.includes(triggerId)
        ? prev.triggers.filter(t => t !== triggerId)
        : [...prev.triggers, triggerId]
    }));
  };

  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Webhook URL copied to clipboard');
  };

  const getStatusBadge = (enabled: boolean) => {
    return enabled ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
        <XCircle className="w-3 h-3 mr-1" />
        Disabled
      </Badge>
    );
  };

  const getLogStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-orange-500" />
            Zapier Integration
          </h1>
          <p className="text-gray-600">
            Connect HealthScan with Zapier to automate workflows and integrate with thousands of apps
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowSetupGuide(true)}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Setup Guide
          </Button>
          <Dialog open={showNewConfigDialog} onOpenChange={setShowNewConfigDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowNewConfigDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Integration
              </Button>
            </DialogTrigger>
          <DialogContent className="modal-fullscreen-8px">
            <DialogHeader>
              <DialogTitle>Create New Zapier Integration</DialogTitle>
              <DialogDescription>
                Configure a new webhook connection to send HealthScan events to Zapier
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="config_name">Configuration Name</Label>
                <Input
                  id="config_name"
                  placeholder="e.g., Marketing Automation"
                  value={newConfig.config_name}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, config_name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="webhook_url">Zapier Webhook URL</Label>
                <Input
                  id="webhook_url"
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  value={newConfig.webhook_url}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, webhook_url: e.target.value }))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Get this URL from your Zapier webhook trigger
                </p>
              </div>

              <div>
                <Label htmlFor="auth_token">Authentication Token (Optional)</Label>
                <Input
                  id="auth_token"
                  type="password"
                  placeholder="Bearer token for additional security"
                  value={newConfig.auth_token}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, auth_token: e.target.value }))}
                />
              </div>

              <div>
                <Label>Event Triggers</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {AVAILABLE_TRIGGERS.map(trigger => (
                    <div key={trigger.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                      <Switch
                        checked={newConfig.triggers.includes(trigger.id)}
                        onCheckedChange={() => toggleTrigger(trigger.id)}
                      />
                      <div>
                        <p className="font-medium">{trigger.name}</p>
                        <p className="text-sm text-gray-500">{trigger.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newConfig.enabled}
                  onCheckedChange={(enabled) => setNewConfig(prev => ({ ...prev, enabled }))}
                />
                <Label>Enable this integration</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={saveConfiguration} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Configuration'}
                </Button>
                <Button variant="outline" onClick={() => setShowNewConfigDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Setup Guide Modal */}
      <Dialog open={showSetupGuide} onOpenChange={setShowSetupGuide}>
        <DialogContent className="modal-fullscreen-8px max-w-6xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Zapier Integration Setup Guide
            </DialogTitle>
            <DialogDescription>
              Complete guide to connecting HealthScan with Zapier
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[80vh]">
            <ZapierSetupGuide />
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="configurations" className="w-full">
        <TabsList>
          <TabsTrigger value="configurations">Configurations</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4">
          {configurations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Zapier integrations yet</h3>
                <p className="text-gray-500 mb-4">
                  Create your first integration to start automating workflows with HealthScan events
                </p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSetupGuide(true)}
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    View Setup Guide
                  </Button>
                  <Button onClick={() => setShowNewConfigDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Integration
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {configurations.map((config) => (
                <Card key={config.config_name}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{config.config_name}</h3>
                          {getStatusBadge(config.enabled)}
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <ExternalLink className="w-4 h-4" />
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                              {config.webhook_url.substring(0, 50)}...
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyWebhookUrl(config.webhook_url)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <div>
                            <strong>Triggers:</strong> {config.triggers.length > 0 ? config.triggers.join(', ') : 'None configured'}
                          </div>
                          
                          <div>
                            <strong>Created:</strong> {new Date(config.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testWebhook(config)}
                          disabled={testingWebhook === config.config_name}
                        >
                          <TestTube className="w-4 h-4 mr-1" />
                          {testingWebhook === config.config_name ? 'Testing...' : 'Test'}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteConfiguration(config.config_name)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Webhook Activity</h3>
            <Button variant="outline" size="sm" onClick={loadLogs}>
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {logs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No webhook activity yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {logs.map((log, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getLogStatusIcon(log.status)}
                        <div>
                          <p className="font-medium">{log.trigger.replace('_', ' ').toUpperCase()}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {log.email && (
                          <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            {log.email}
                          </p>
                        )}
                        {log.error && (
                          <p className="text-sm text-red-600 mt-1">{log.error}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How to Set Up Zapier Integration</CardTitle>
              <CardDescription>
                Follow these steps to connect HealthScan with your Zapier workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Create a Zap in Zapier</h4>
                    <p className="text-gray-600 mb-2">
                      Go to Zapier and create a new Zap. Choose "Webhooks by Zapier" as your trigger app.
                    </p>
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Make sure to select "Catch Hook" as the trigger event type
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Copy the Webhook URL</h4>
                    <p className="text-gray-600">
                      Zapier will provide you with a webhook URL that looks like:
                    </p>
                    <code className="block bg-gray-100 p-2 rounded mt-2 text-sm">
                      https://hooks.zapier.com/hooks/catch/123456/abcdef/
                    </code>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Configure HealthScan Integration</h4>
                    <p className="text-gray-600">
                      Use the "Add Integration" button above to create a new configuration with your webhook URL.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Test the Connection</h4>
                    <p className="text-gray-600">
                      Use the "Test" button to send a sample webhook to Zapier and verify the connection works.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Complete Your Zap</h4>
                    <p className="text-gray-600">
                      Continue setting up your Zap in Zapier by choosing actions like sending emails, 
                      adding contacts to your CRM, or posting to Slack.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-blue-900 mb-2">Available Event Types</h4>
                <ul className="text-blue-800 space-y-1 text-sm">
                  <li>• <strong>User Registration:</strong> When someone creates a new account</li>
                  <li>• <strong>Waitlist Signup:</strong> When someone joins the waitlist</li>
                  <li>• <strong>Scan Completed:</strong> When a user completes a health scan</li>
                  <li>• <strong>Referral Milestone:</strong> When users reach referral goals</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}