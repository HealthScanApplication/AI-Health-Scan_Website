import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  RefreshCw,
  ExternalLink,
  Copy,
  Terminal
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';

interface DatabaseStatus {
  timestamp: string;
  environment: {
    supabaseUrl: boolean;
    serviceKey: boolean;
    hasCredentials: boolean;
  };
  table: {
    exists: boolean;
    accessible: boolean;
    error: string | null;
  };
  permissions: {
    canRead: boolean;
    canWrite: boolean;
  };
}

export function DatabaseSetupHelper() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [setupInProgress, setSetupInProgress] = useState(false);

  const sqlScript = `-- HealthScan Database Setup - Run this SQL in Supabase Dashboard → SQL Editor:

-- Step 1: Create the KV store table
CREATE TABLE IF NOT EXISTS kv_store_ed0fe4c2 (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 2: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_kv_store_ed0fe4c2_key_prefix 
ON kv_store_ed0fe4c2 USING btree (key text_pattern_ops);

-- Step 3: Disable Row Level Security for service access
ALTER TABLE kv_store_ed0fe4c2 DISABLE ROW LEVEL SECURITY;

-- Step 4: Grant all necessary permissions
GRANT ALL PRIVILEGES ON TABLE kv_store_ed0fe4c2 TO service_role;
GRANT ALL PRIVILEGES ON TABLE kv_store_ed0fe4c2 TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE kv_store_ed0fe4c2 TO anon;

-- Step 5: Create updated_at trigger (optional)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$ language 'plpgsql';

CREATE TRIGGER update_kv_store_ed0fe4c2_updated_at
  BEFORE UPDATE ON kv_store_ed0fe4c2
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`;

  const checkDatabaseStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/server/make-server-ed0fe4c2/diagnostics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data.database);
      } else {
        toast.error('Failed to check database status');
      }
    } catch (error) {
      console.error('Error checking database status:', error);
      toast.error('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  const setupDatabase = async () => {
    setSetupInProgress(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/server/make-server-ed0fe4c2/setup-database`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        await checkDatabaseStatus(); // Refresh status
      } else {
        toast.error(`Setup failed: ${result.error}`);
        if (result.manualSetupRequired) {
          toast.info('Manual setup required - see SQL script below');
        }
      }
    } catch (error) {
      console.error('Error setting up database:', error);
      toast.error('Database setup failed');
    } finally {
      setSetupInProgress(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('SQL script copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const getStatusColor = () => {
    if (!status) return 'gray';
    if (status.table.exists && status.table.accessible) return 'green';
    if (status.table.exists && !status.table.accessible) return 'yellow';
    return 'red';
  };

  const getStatusIcon = () => {
    if (loading) return <Loader2 className="w-5 h-5 animate-spin" />;
    if (!status) return <Database className="w-5 h-5" />;
    if (status.table.exists && status.table.accessible) return <CheckCircle className="w-5 h-5 text-green-600" />;
    return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
  };

  const getStatusText = () => {
    if (!status) return 'Checking...';
    if (status.table.exists && status.table.accessible) return 'Database Ready';
    if (status.table.exists && !status.table.accessible) return 'Permission Issues';
    return 'Table Missing';
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <CardTitle>Database Setup Status</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                HealthScan KV Store Configuration
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={getStatusColor() === 'green' ? 'default' : 'destructive'}>
              {getStatusText()}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={checkDatabaseStatus}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Environment Status */}
        {status && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${status.environment.supabaseUrl ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">Supabase URL</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${status.environment.serviceKey ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">Service Key</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${status.table.exists ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">Table Exists</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {status?.table.error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Database Error:</strong> {status.table.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={setupDatabase}
            disabled={setupInProgress || loading}
            className="flex-1"
          >
            {setupInProgress ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Database className="w-4 h-4 mr-2" />
            )}
            Auto-Setup Database
          </Button>

          <Button
            variant="outline"
            onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}/sql`, '_blank')}
            className="flex-1"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Supabase SQL Editor
          </Button>
        </div>

        {/* Manual Setup Instructions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center">
              <Terminal className="w-4 h-4 mr-2" />
              Manual Setup (if auto-setup fails)
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(sqlScript)}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy SQL
            </Button>
          </div>
          
          <div className="bg-gray-100 rounded-md p-4 font-mono text-sm overflow-x-auto">
            <pre>{sqlScript}</pre>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">
              <strong>Manual Setup Steps:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Copy the SQL script above</li>
                <li>Go to your Supabase Dashboard → SQL Editor</li>
                <li>Paste and run the SQL script</li>
                <li>Click "Refresh" to verify the setup</li>
              </ol>
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}