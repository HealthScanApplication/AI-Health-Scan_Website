import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { 
  Zap, 
  ExternalLink, 
  Copy, 
  ChevronDown, 
  CheckCircle, 
  ArrowRight, 
  Code, 
  Users, 
  UserPlus, 
  Scan, 
  Gift,
  Mail,
  Webhook,
  Settings,
  Play,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';

interface WebhookExample {
  trigger: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  samplePayload: any;
  zapierUseCase: string;
}

const webhookExamples: WebhookExample[] = [
  {
    trigger: 'user_registered',
    name: 'User Registration',
    description: 'Triggered when a new user creates an account',
    icon: UserPlus,
    zapierUseCase: 'Add to email marketing list, send welcome email, create CRM record',
    samplePayload: {
      trigger: 'user_registered',
      timestamp: '2024-01-15T10:30:00Z',
      data: {
        id: 'user_123abc',
        email: 'john@example.com',
        name: 'John Doe',
        created_at: '2024-01-15T10:30:00Z',
        email_confirmed: false,
        last_sign_in: null,
        metadata: {
          name: 'John Doe',
          signup_source: 'homepage'
        },
        registration_source: 'healthscan_app',
        app_version: '1.0.0'
      }
    }
  },
  {
    trigger: 'waitlist_joined',
    name: 'Waitlist Signup',
    description: 'Triggered when someone joins the waitlist',
    icon: Users,
    zapierUseCase: 'Add to ConvertKit, send confirmation email, update Google Sheets',
    samplePayload: {
      trigger: 'waitlist_joined',
      timestamp: '2024-01-15T10:30:00Z',
      data: {
        id: 'waitlist_456def',
        email: 'sarah@example.com',
        referral_code: 'FRIEND123',
        position: 2847,
        created_at: '2024-01-15T10:30:00Z',
        source: 'referral',
        utm_source: 'facebook',
        utm_medium: 'social',
        utm_campaign: 'health_awareness'
      }
    }
  },
  {
    trigger: 'scan_completed',
    name: 'Health Scan Completed',
    description: 'Triggered when a user completes a health scan',
    icon: Scan,
    zapierUseCase: 'Send results to CRM, trigger follow-up sequences, notify healthcare provider',
    samplePayload: {
      trigger: 'scan_completed',
      timestamp: '2024-01-15T10:30:00Z',
      data: {
        id: 'scan_789ghi',
        user_id: 'user_123abc',
        product_name: 'Organic Apple',
        scan_type: 'nutritional_analysis',
        results_summary: 'High in vitamin C, low pesticide risk',
        health_score: 85,
        pollutants_detected: 0,
        nutrients_analyzed: 12,
        created_at: '2024-01-15T10:30:00Z',
        scan_source: 'healthscan_app'
      }
    }
  },
  {
    trigger: 'referral_milestone',
    name: 'Referral Milestone',
    description: 'Triggered when a user reaches referral goals',
    icon: Gift,
    zapierUseCase: 'Send reward emails, update loyalty program, notify sales team',
    samplePayload: {
      trigger: 'referral_milestone',
      timestamp: '2024-01-15T10:30:00Z',
      data: {
        user_email: 'john@example.com',
        milestone_type: '5_referrals',
        referral_count: 5,
        achievement_level: '5_referrals',
        achieved_at: '2024-01-15T10:30:00Z',
        app_source: 'healthscan_referral_program'
      }
    }
  }
];

export function ZapierSetupGuide() {
  const [expandedExample, setExpandedExample] = useState<string | null>(null);
  const [copiedPayload, setCopiedPayload] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPayload(id);
    toast.success('Copied to clipboard!');
    
    setTimeout(() => {
      setCopiedPayload(null);
    }, 2000);
  };

  const formatJSON = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-orange-100 rounded-full">
            <Zap className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold">Zapier Integration Guide</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Connect HealthScan with over 6,000+ apps through Zapier. Automate workflows, 
          sync data, and streamline your operations with powerful webhook integrations.
        </p>
      </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">
            <Settings className="w-4 h-4 mr-2" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Webhook className="w-4 h-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="examples">
            <Code className="w-4 h-4 mr-2" />
            Examples
          </TabsTrigger>
          <TabsTrigger value="troubleshooting">
            <BookOpen className="w-4 h-4 mr-2" />
            Help
          </TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-blue-600" />
                Quick Start Guide
              </CardTitle>
              <CardDescription>
                Follow these steps to connect HealthScan with Zapier in minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Create a Zap in Zapier</h3>
                  <p className="text-gray-600 mb-3">
                    Log into your Zapier account and create a new Zap. Search for "Webhooks by Zapier" 
                    and select it as your trigger app.
                  </p>
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription>
                      Choose "Catch Hook" as the trigger event type to receive data from HealthScan
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Copy Your Webhook URL</h3>
                  <p className="text-gray-600 mb-3">
                    Zapier will provide you with a unique webhook URL. Copy this URL - you'll need it in the next step.
                  </p>
                  <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm">
                    https://hooks.zapier.com/hooks/catch/12345678/abcdef/
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Configure HealthScan Integration</h3>
                  <p className="text-gray-600 mb-3">
                    Go to the HealthScan Admin Dashboard → Zapier tab and create a new integration 
                    using your webhook URL.
                  </p>
                  <Button variant="outline" className="mr-2">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Go to Admin Dashboard
                  </Button>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold">
                  ✓
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Test & Complete Your Zap</h3>
                  <p className="text-gray-600">
                    Test the connection from HealthScan, then continue building your Zap by 
                    adding actions like sending emails, creating records, or posting to Slack.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Popular Zap Ideas */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Automation Ideas</CardTitle>
              <CardDescription>
                Get inspired with these common HealthScan + Zapier workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold">Email Marketing</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Automatically add new users to ConvertKit, Mailchimp, or other email platforms
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold">CRM Integration</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Create contacts in HubSpot, Salesforce, or Airtable when users sign up
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Scan className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold">Health Tracking</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Log scan results to Google Sheets or send reports to healthcare providers
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-orange-600" />
                    <h4 className="font-semibold">Loyalty Programs</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Trigger rewards and special offers when users reach referral milestones
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Webhook Events</CardTitle>
              <CardDescription>
                HealthScan can send these types of events to your Zapier webhooks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {webhookExamples.map((webhook) => {
                  const Icon = webhook.icon;
                  return (
                    <Card key={webhook.trigger} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <Icon className="w-5 h-5 text-gray-700" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{webhook.name}</h3>
                              <p className="text-sm text-gray-600">{webhook.description}</p>
                              <Badge variant="outline" className="mt-1">
                                {webhook.trigger}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Common Use Cases:</strong> {webhook.zapierUseCase}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Examples Tab */}
        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Payload Examples</CardTitle>
              <CardDescription>
                Sample JSON payloads that HealthScan sends to your Zapier webhooks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {webhookExamples.map((webhook) => {
                const Icon = webhook.icon;
                const isExpanded = expandedExample === webhook.trigger;
                
                return (
                  <Collapsible 
                    key={webhook.trigger}
                    open={isExpanded}
                    onOpenChange={(open) => setExpandedExample(open ? webhook.trigger : null)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between p-4 h-auto">
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5" />
                          <div className="text-left">
                            <p className="font-semibold">{webhook.name}</p>
                            <p className="text-sm text-gray-600">{webhook.trigger}</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="mt-2">
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">JSON Payload</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(formatJSON(webhook.samplePayload), webhook.trigger)}
                          >
                            {copiedPayload === webhook.trigger ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        
                        <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
                          {formatJSON(webhook.samplePayload)}
                        </pre>
                        
                        <div className="mt-3 p-3 bg-blue-50 rounded">
                          <p className="text-sm text-blue-800">
                            <strong>Use this data in Zapier:</strong> Access any field using dot notation 
                            like <code className="bg-white px-1 rounded">data.email</code> or <code className="bg-white px-1 rounded">data.health_score</code>
                          </p>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Troubleshooting Tab */}
        <TabsContent value="troubleshooting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Common Issues & Solutions</CardTitle>
              <CardDescription>
                Troubleshoot problems with your Zapier integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border-l-4 border-l-yellow-500 bg-yellow-50">
                  <h4 className="font-semibold text-yellow-800">Webhook not receiving data?</h4>
                  <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                    <li>• Check that your webhook URL is correct and starts with https://hooks.zapier.com</li>
                    <li>• Verify the integration is enabled in HealthScan admin dashboard</li>
                    <li>• Make sure the correct event triggers are selected</li>
                    <li>• Test the connection using the test button in HealthScan</li>
                  </ul>
                </div>

                <div className="p-4 border-l-4 border-l-red-500 bg-red-50">
                  <h4 className="font-semibold text-red-800">Getting authentication errors?</h4>
                  <ul className="mt-2 text-sm text-red-700 space-y-1">
                    <li>• Ensure you're using the latest webhook URL from Zapier</li>
                    <li>• Check if your Zap is turned on in Zapier</li>
                    <li>• Verify the webhook URL hasn't expired</li>
                    <li>• Remove and re-add the auth token if using one</li>
                  </ul>
                </div>

                <div className="p-4 border-l-4 border-l-blue-500 bg-blue-50">
                  <h4 className="font-semibold text-blue-800">Data not formatted correctly?</h4>
                  <ul className="mt-2 text-sm text-blue-700 space-y-1">
                    <li>• Use the payload examples above to understand the data structure</li>
                    <li>• Check Zapier's data tab to see what fields are available</li>
                    <li>• Use Zapier's formatter tools to transform data as needed</li>
                    <li>• Test with sample data first before going live</li>
                  </ul>
                </div>

                <div className="p-4 border-l-4 border-l-green-500 bg-green-50">
                  <h4 className="font-semibold text-green-800">Need help with advanced setups?</h4>
                  <ul className="mt-2 text-sm text-green-700 space-y-1">
                    <li>• Check the webhook activity logs in HealthScan admin dashboard</li>
                    <li>• Use Zapier's built-in testing tools to debug issues</li>
                    <li>• Consider using filters to process only specific events</li>
                    <li>• Contact support if you need custom webhook events</li>
                  </ul>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Best Practices</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Always test your webhooks before going live with real data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Use descriptive names for your Zapier integrations in HealthScan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Monitor the activity logs regularly to ensure webhooks are working</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Set up error handling in your Zaps for failed webhook deliveries</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Use filters to avoid processing duplicate or unwanted events</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}