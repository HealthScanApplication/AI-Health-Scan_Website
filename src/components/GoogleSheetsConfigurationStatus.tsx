import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  ExternalLink,
  Copy,
  RefreshCw,
  Book,
  Edit
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface GoogleSheetsStatus {
  configured: boolean;
  hasApiKey: boolean;
  hasServiceAccount: boolean;
  hasSpreadsheetId: boolean;
  recommendedSetup: string;
  operationalMode: string;
  capabilities: string[];
}

interface ConnectionTestResult {
  success: boolean;
  error?: string;
  info?: {
    title: string;
    sheetCount: number;
    url: string;
    authMethod: string;
    writeSupported: boolean;
    currentMode: string;
  };
  skipped?: boolean;
}

export function GoogleSheetsConfigurationStatus() {
  const [status, setStatus] = useState<GoogleSheetsStatus | null>(null);
  const [connectionTest, setConnectionTest] = useState<ConnectionTestResult | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch Google Sheets configuration status
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/google-sheets-status`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setStatus(data.status);
    } catch (error) {
      console.error('Failed to fetch Google Sheets status:', error);
      toast.error('Failed to fetch Google Sheets configuration status');
    } finally {
      setLoading(false);
    }
  };

  // Test Google Sheets connection
  const testConnection = async () => {
    try {
      setIsTestingConnection(true);
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/google-sheets-test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setConnectionTest(data);
      
      if (data.success) {
        toast.success('Google Sheets connection test successful!');
      } else {
        toast.error(`Connection test failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionTest({
        success: false,
        error: `Network error: ${error.message}`
      });
      toast.error('Connection test failed');
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Copy environment variable template
  const copyEnvTemplate = () => {
    const template = `# Google Sheets Integration (Optional)
# Choose ONE of the following configurations:

# OPTION 1: Read-only access (API Key)
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SHEETS_API_KEY=your_api_key_here

# OPTION 2: Full functionality (Service Account - Recommended)
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SERVICE_ACCOUNT_CREDENTIALS={"type":"service_account","project_id":"...","private_key_id":"..."}

# To get the Spreadsheet ID:
# 1. Open your Google Sheet
# 2. Copy the ID from the URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
# 3. The ID is the long string between /d/ and /edit

# Note: The waitlist system works perfectly without Google Sheets integration!`;

    navigator.clipboard.writeText(template);
    toast.success('Environment template copied to clipboard!');
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Google Sheets Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading configuration status...</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    if (!status?.configured) return <XCircle className="w-5 h-5 text-gray-500" />;
    if (status.hasServiceAccount) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status.hasApiKey) return <Book className="w-5 h-5 text-blue-500" />;
    return <XCircle className="w-5 h-5 text-gray-500" />;
  };

  const getStatusBadge = () => {
    if (!status?.configured) return <Badge variant="secondary">Not Configured</Badge>;
    if (status.hasServiceAccount) return <Badge variant="default" className="bg-green-600">Full Access</Badge>;
    if (status.hasApiKey) return <Badge variant="default" className="bg-blue-600">Read-Only</Badge>;
    return <Badge variant="secondary">Misconfigured</Badge>;
  };

  const getOperationalModeColor = () => {
    if (status?.operationalMode.includes('Full functionality')) return 'text-green-600';
    if (status?.operationalMode.includes('Read-only')) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            Google Sheets Integration
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Operational Mode */}
        {status && (
          <div className="space-y-2">
            <h4 className="font-medium">Current Status</h4>
            <div className={`text-sm font-medium ${getOperationalModeColor()}`}>
              {status.operationalMode}
            </div>
            {status.capabilities.length > 0 && (
              <div className="text-sm text-muted-foreground">
                <strong>Capabilities:</strong>
                <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                  {status.capabilities.map((capability, index) => (
                    <li key={index}>{capability}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Configuration Details */}
        <div className="space-y-2">
          <h4 className="font-medium">Configuration Details</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              {status?.hasSpreadsheetId ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400" />
              )}
              Spreadsheet ID
            </div>
            <div className="flex items-center gap-2">
              {status?.hasApiKey ? (
                <CheckCircle className="w-4 h-4 text-blue-500" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400" />
              )}
              API Key
            </div>
            <div className="flex items-center gap-2">
              {status?.hasServiceAccount ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400" />
              )}
              Service Account
            </div>
            <div className="flex items-center gap-2">
              {status?.configured ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400" />
              )}
              Integration Active
            </div>
          </div>
        </div>

        {/* Current Setup Info */}
        {status && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Setup:</strong> {status.recommendedSetup}
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Test */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Connection Test</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={testConnection}
              disabled={isTestingConnection || !status?.configured}
            >
              {isTestingConnection ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
          </div>

          {connectionTest && (
            <div className="p-3 border rounded-lg">
              {connectionTest.success ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Connection Successful</span>
                  </div>
                  {connectionTest.info && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>Sheet:</strong> {connectionTest.info.title}</p>
                      <p><strong>Sheets Count:</strong> {connectionTest.info.sheetCount}</p>
                      <p><strong>Mode:</strong> {connectionTest.info.currentMode}</p>
                      <p><strong>Auth Method:</strong> {connectionTest.info.authMethod}</p>
                      <p><strong>Write Support:</strong> {connectionTest.info.writeSupported ? 'Yes' : 'No'}</p>
                      {connectionTest.info.url && (
                        <a
                          href={connectionTest.info.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          Open Sheet <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-4 h-4" />
                    <span className="font-medium">Connection Failed</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{connectionTest.error}</p>
                  {connectionTest.skipped && (
                    <p className="text-xs text-blue-600">
                      This is expected if Google Sheets is not configured.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status-specific guidance */}
        {status && (
          <div className="space-y-2">
            <h4 className="font-medium">Setup Information</h4>
            
            {!status.configured ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="space-y-3">
                  <div>
                    <p className="font-medium text-green-600">✅ System fully operational without Google Sheets!</p>
                    <p className="text-sm mt-1">Google Sheets integration is completely optional. All core functionality works perfectly without any Google Sheets configuration. It's only for optional external backup and data export.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">If you want to enable it:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Create or open a Google Sheet</li>
                      <li>Copy the Spreadsheet ID from the URL</li>
                      <li>Choose: API key (read-only) or Service Account (full access)</li>
                      <li>Set environment variables in your deployment</li>
                    </ol>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyEnvTemplate}
                    className="mt-2"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Environment Template
                  </Button>
                </AlertDescription>
              </Alert>
            ) : status.hasApiKey && !status.hasServiceAccount ? (
              <Alert>
                <Book className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium text-blue-600">Read-Only Mode Active</p>
                    <div className="text-sm space-y-1">
                      <p><strong>✅ Works:</strong> Reading data, connection testing, sheet verification</p>
                      <p><strong>ℹ️ Limited:</strong> Cannot write signup data (this is normal with API keys)</p>
                      <p><strong>💡 Result:</strong> All data is safely stored in the KV database</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>For automatic data sync to Google Sheets, consider setting up service account credentials.</p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium text-green-600">Full Functionality Active</p>
                    <p className="text-sm">Google Sheets integration is properly configured with service account credentials!</p>
                    <p className="text-sm text-muted-foreground">All waitlist signups will be automatically synced to your Google Sheet.</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Important Note */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">System Status: ✅ Fully Operational Without Google Sheets</p>
              <p className="text-sm">HealthScan operates completely independently of Google Sheets. All email signups, referrals, and user data are securely stored and managed in the primary KV database. Google Sheets is purely an optional external backup feature.</p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStatus}
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  );
}