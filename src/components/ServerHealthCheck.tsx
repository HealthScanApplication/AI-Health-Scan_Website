import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Server, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AlertTriangle,
  Wifi,
  Globe,
  Rss
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface HealthStatus {
  server: 'healthy' | 'unhealthy' | 'checking';
  blog: 'healthy' | 'unhealthy' | 'checking';
  rss: 'healthy' | 'unhealthy' | 'checking';
  lastChecked: string | null;
  error?: string;
}

export function ServerHealthCheck() {
  const [status, setStatus] = useState<HealthStatus>({
    server: 'checking',
    blog: 'checking', 
    rss: 'checking',
    lastChecked: null
  });
  
  const [isManualCheck, setIsManualCheck] = useState(false);

  const checkServerHealth = async () => {
    try {
      setIsManualCheck(true);
      
      // Reset status
      setStatus({
        server: 'checking',
        blog: 'checking',
        rss: 'checking',
        lastChecked: null
      });

      console.log('🔍 Checking server health...');
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');

      // Test 1: Server health endpoint
      let serverHealthy = false;
      try {
        const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/health`;
        const response = await fetch(healthUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        });

        serverHealthy = response.ok;
        
        if (response.ok) {
          console.log('✅ Server health check passed');
        } else {
          console.error('❌ Server health check failed:', response.status);
        }
      } catch (error) {
        console.error('❌ Server health check error:', error);
        serverHealthy = false;
      }

      // Update server status
      setStatus(prev => ({
        ...prev,
        server: serverHealthy ? 'healthy' : 'unhealthy'
      }));

      // Test 2: Blog articles endpoint
      let blogHealthy = false;
      try {
        const blogUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/blog/articles`;
        const response = await fetch(blogUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          blogHealthy = result.success && result.data && result.data.length > 0;
          console.log(blogHealthy ? '✅ Blog endpoint healthy' : '⚠️ Blog endpoint returned no data');
        } else {
          console.error('❌ Blog endpoint failed:', response.status);
          blogHealthy = false;
        }
      } catch (error) {
        console.error('❌ Blog endpoint error:', error);
        blogHealthy = false;
      }

      // Update blog status
      setStatus(prev => ({
        ...prev,
        blog: blogHealthy ? 'healthy' : 'unhealthy'
      }));

      // Test 3: Direct RSS feed
      let rssHealthy = false;
      try {
        const response = await fetch('https://healthscan.substack.com/feed', {
          headers: {
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            'User-Agent': 'HealthScan Health Check',
          }
        });

        rssHealthy = response.ok;
        console.log(rssHealthy ? '✅ RSS feed accessible' : '❌ RSS feed inaccessible');
      } catch (error) {
        console.error('❌ RSS feed error:', error);
        rssHealthy = false;
      }

      // Final update
      setStatus({
        server: serverHealthy ? 'healthy' : 'unhealthy',
        blog: blogHealthy ? 'healthy' : 'unhealthy',
        rss: rssHealthy ? 'healthy' : 'unhealthy',
        lastChecked: new Date().toISOString()
      });

      // Show result toast
      const allHealthy = serverHealthy && blogHealthy && rssHealthy;
      if (allHealthy) {
        toast.success('🌱 All systems healthy!');
      } else {
        const issues = [];
        if (!serverHealthy) issues.push('Server');
        if (!blogHealthy) issues.push('Blog');
        if (!rssHealthy) issues.push('RSS Feed');
        toast.error(`🚨 Issues detected: ${issues.join(', ')}`);
      }

    } catch (error: any) {
      console.error('❌ Health check failed:', error);
      setStatus({
        server: 'unhealthy',
        blog: 'unhealthy',
        rss: 'unhealthy',
        lastChecked: new Date().toISOString(),
        error: error.message
      });
      toast.error('🚨 Health check failed');
    } finally {
      setIsManualCheck(false);
    }
  };

  // Auto-check on mount
  useEffect(() => {
    checkServerHealth();
  }, []);

  const getStatusIcon = (status: 'healthy' | 'unhealthy' | 'checking') => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: 'healthy' | 'unhealthy' | 'checking') => {
    switch (status) {
      case 'checking':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Checking...</Badge>;
      case 'healthy':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Healthy</Badge>;
      case 'unhealthy':
        return <Badge variant="destructive">Unhealthy</Badge>;
    }
  };

  const isChecking = status.server === 'checking' || status.blog === 'checking' || status.rss === 'checking';
  const hasIssues = status.server === 'unhealthy' || status.blog === 'unhealthy' || status.rss === 'unhealthy';
  const allHealthy = status.server === 'healthy' && status.blog === 'healthy' && status.rss === 'healthy';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
              allHealthy ? 'bg-green-100' : hasIssues ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              <Server className={`w-6 h-6 ${
                allHealthy ? 'text-green-600' : hasIssues ? 'text-red-600' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                🏥 System Health
                {allHealthy && <span className="text-green-600">✅</span>}
                {hasIssues && <span className="text-red-600">🚨</span>}
                {isChecking && <span className="text-blue-600">🔍</span>}
              </CardTitle>
              <p className="text-gray-600">
                {status.lastChecked 
                  ? `Last checked: ${new Date(status.lastChecked).toLocaleTimeString()}`
                  : 'Checking system status...'
                }
              </p>
            </div>
          </div>
          
          <Button
            onClick={checkServerHealth}
            disabled={isManualCheck}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {isManualCheck ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wifi className="w-4 h-4" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Server Status */}
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            {getStatusIcon(status.server)}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900">Server</span>
                {getStatusBadge(status.server)}
              </div>
              <p className="text-sm text-gray-600">
                {status.server === 'healthy' ? 'API endpoints responding' :
                 status.server === 'unhealthy' ? 'Server unreachable' :
                 'Testing connection...'}
              </p>
            </div>
          </div>

          {/* Blog Status */}
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            {getStatusIcon(status.blog)}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900">Blog API</span>
                {getStatusBadge(status.blog)}
              </div>
              <p className="text-sm text-gray-600">
                {status.blog === 'healthy' ? 'Articles loading correctly' :
                 status.blog === 'unhealthy' ? 'Blog API not working' :
                 'Testing blog endpoint...'}
              </p>
            </div>
          </div>

          {/* RSS Status */}
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            {getStatusIcon(status.rss)}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900">RSS Feed</span>
                {getStatusBadge(status.rss)}
              </div>
              <p className="text-sm text-gray-600">
                {status.rss === 'healthy' ? 'Substack feed accessible' :
                 status.rss === 'unhealthy' ? 'RSS feed unreachable' :
                 'Testing RSS feed...'}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {status.error && (
          <div className="flex items-center gap-2 text-red-700 bg-red-50 p-3 rounded-lg">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{status.error}</span>
          </div>
        )}

        {/* Overall Status */}
        {!isChecking && (
          <div className="border-t pt-4">
            {allHealthy ? (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  ✅ All systems operational! Blog articles should load correctly.
                </span>
              </div>
            ) : hasIssues ? (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 p-3 rounded-lg">
                <XCircle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  🚨 System issues detected. Blog functionality may be impaired.
                </span>
              </div>
            ) : null}
          </div>
        )}

        {/* Action Buttons for Issues */}
        {hasIssues && !isChecking && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://healthscan.substack.com', '_blank')}
              className="flex items-center gap-2"
            >
              <Rss className="w-4 h-4" />
              Direct RSS
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const mailto = `mailto:support@healthscan.live?subject=Blog System Issues&body=The health check detected issues with: ${
                  [
                    status.server === 'unhealthy' ? 'Server' : '',
                    status.blog === 'unhealthy' ? 'Blog API' : '',
                    status.rss === 'unhealthy' ? 'RSS Feed' : ''
                  ].filter(Boolean).join(', ')
                }%0A%0ATimestamp: ${status.lastChecked}`;
                window.open(mailto);
              }}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Report Issue
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}