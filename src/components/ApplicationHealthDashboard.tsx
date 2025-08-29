import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Shield,
  Code,
  Link,
  FileText,
  Activity,
  TrendingUp,
  Zap
} from 'lucide-react';
import { LinkIntegrityChecker } from './LinkIntegrityChecker';
import { ServerDiagnostic } from './ServerDiagnostic';
import { TroubleshootingGuide } from './TroubleshootingGuide';
import { getMockCodebaseHealth, codebaseValidator, type CodebaseHealth } from '../utils/codebaseValidator';

interface HealthMetrics {
  overallScore: number;
  linkIntegrity: {
    score: number;
    issues: number;
    status: 'excellent' | 'good' | 'needs-attention' | 'critical';
  };
  codeHealth: {
    score: number;
    issues: number;
    status: 'excellent' | 'good' | 'needs-attention' | 'critical';
  };
  securityScore: {
    score: number;
    issues: number;
    status: 'excellent' | 'good' | 'needs-attention' | 'critical';
  };
  performance: {
    score: number;
    issues: number;
    status: 'excellent' | 'good' | 'needs-attention' | 'critical';
  };
}

interface SecurityCheck {
  category: string;
  item: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export function ApplicationHealthDashboard() {
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [codeHealth, setCodeHealth] = useState<CodebaseHealth | null>(null);
  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([]);
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);

  useEffect(() => {
    // Initialize with mock data for demonstration
    initializeHealthMetrics();
  }, []);

  const initializeHealthMetrics = () => {
    const mockCodeHealth = getMockCodebaseHealth();
    setCodeHealth(mockCodeHealth);
    
    const metrics: HealthMetrics = {
      overallScore: 87,
      linkIntegrity: {
        score: 92,
        issues: 2,
        status: 'excellent'
      },
      codeHealth: {
        score: 85,
        issues: mockCodeHealth.criticalErrors + mockCodeHealth.warnings,
        status: 'good'
      },
      securityScore: {
        score: 88,
        issues: 3,
        status: 'good'
      },
      performance: {
        score: 83,
        issues: 5,
        status: 'good'
      }
    };
    
    setHealthMetrics(metrics);
    
    // Mock security checks
    const mockSecurityChecks: SecurityCheck[] = [
      {
        category: 'Authentication',
        item: 'Supabase Auth Implementation', 
        status: 'pass',
        message: 'Auth properly configured with secure tokens',
        severity: 'high'
      },
      {
        category: 'API Security',
        item: 'Service Role Key Protection',
        status: 'pass', 
        message: 'Service role key not exposed to frontend',
        severity: 'critical'
      },
      {
        category: 'Data Validation',
        item: 'Input Sanitization',
        status: 'warning',
        message: 'Some forms missing input validation',
        severity: 'medium'
      },
      {
        category: 'CORS Configuration',
        item: 'Server CORS Headers',
        status: 'pass',
        message: 'CORS properly configured for production',
        severity: 'medium'
      },
      {
        category: 'Environment Variables',
        item: 'Secret Management',
        status: 'warning',
        message: 'Consider using more secure secret storage',
        severity: 'low'
      }
    ];
    
    setSecurityChecks(mockSecurityChecks);
  };

  const runFullHealthCheck = async () => {
    setIsRunningCheck(true);
    
    try {
      console.log('🔄 Running comprehensive health check...');
      
      // Simulate a comprehensive check
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update metrics after check
      const updatedMetrics: HealthMetrics = {
        overallScore: 89,
        linkIntegrity: {
          score: 94,
          issues: 1,
          status: 'excellent'
        },
        codeHealth: {
          score: 87,
          issues: 4,
          status: 'good'
        },
        securityScore: {
          score: 90,
          issues: 2,
          status: 'excellent'
        },
        performance: {
          score: 85,
          issues: 3,
          status: 'good'
        }
      };
      
      setHealthMetrics(updatedMetrics);
      setLastCheckTime(new Date().toISOString());
      
      console.log('✅ Health check completed');
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
    } finally {
      setIsRunningCheck(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'needs-attention': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    
    return <Badge className={colors[severity as keyof typeof colors]}>{severity}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'fail': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return null;
    }
  };

  const getHealthRecommendations = () => {
    if (!healthMetrics) return [];
    
    const recommendations = [];
    
    if (healthMetrics.overallScore < 80) {
      recommendations.push('🚨 Overall health needs improvement - review critical issues first');
    }
    
    if (healthMetrics.linkIntegrity.score < 85) {
      recommendations.push('🔗 Fix broken links and endpoint issues');
    }
    
    if (healthMetrics.codeHealth.score < 80) {
      recommendations.push('🧹 Address code quality issues and dependencies');
    }
    
    if (healthMetrics.securityScore.score < 85) {
      recommendations.push('🔒 Review security vulnerabilities');
    }
    
    if (healthMetrics.performance.score < 80) {
      recommendations.push('⚡ Optimize performance bottlenecks');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✨ Application health looks excellent! Keep monitoring regularly');
    }
    
    return recommendations;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Application Health Dashboard</h1>
          <p className="text-gray-600">Monitor links, code quality, security, and performance</p>
        </div>
        <Button 
          onClick={runFullHealthCheck} 
          disabled={isRunningCheck}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRunningCheck ? 'animate-spin' : ''}`} />
          {isRunningCheck ? 'Checking...' : 'Run Full Check'}
        </Button>
      </div>

      {/* Overall Health Score */}
      {healthMetrics && (
        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Overall Health Score</CardTitle>
                <CardDescription>
                  {lastCheckTime ? `Last checked: ${new Date(lastCheckTime).toLocaleString()}` : 'Initial assessment'}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${getScoreColor(healthMetrics.overallScore)}`}>
                  {healthMetrics.overallScore}%
                </div>
                <Badge className={getStatusColor(healthMetrics.overallScore >= 90 ? 'excellent' : 
                                                 healthMetrics.overallScore >= 75 ? 'good' : 
                                                 healthMetrics.overallScore >= 60 ? 'needs-attention' : 'critical')}>
                  {healthMetrics.overallScore >= 90 ? 'Excellent' : 
                   healthMetrics.overallScore >= 75 ? 'Good' : 
                   healthMetrics.overallScore >= 60 ? 'Needs Attention' : 'Critical'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={healthMetrics.overallScore} className="w-full" />
          </CardContent>
        </Card>
      )}

      {/* Health Metrics Grid */}
      {healthMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Link Integrity</CardTitle>
              <Link className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(healthMetrics.linkIntegrity.score)}`}>
                {healthMetrics.linkIntegrity.score}%
              </div>
              <p className="text-xs text-gray-600">
                {healthMetrics.linkIntegrity.issues} issues found
              </p>
              <Badge className={`mt-2 ${getStatusColor(healthMetrics.linkIntegrity.status)}`}>
                {healthMetrics.linkIntegrity.status}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Code Health</CardTitle>
              <Code className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(healthMetrics.codeHealth.score)}`}>
                {healthMetrics.codeHealth.score}%
              </div>
              <p className="text-xs text-gray-600">
                {healthMetrics.codeHealth.issues} issues found
              </p>
              <Badge className={`mt-2 ${getStatusColor(healthMetrics.codeHealth.status)}`}>
                {healthMetrics.codeHealth.status}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security</CardTitle>
              <Shield className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(healthMetrics.securityScore.score)}`}>
                {healthMetrics.securityScore.score}%
              </div>
              <p className="text-xs text-gray-600">
                {healthMetrics.securityScore.issues} issues found
              </p>
              <Badge className={`mt-2 ${getStatusColor(healthMetrics.securityScore.status)}`}>
                {healthMetrics.securityScore.status}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <Zap className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(healthMetrics.performance.score)}`}>
                {healthMetrics.performance.score}%
              </div>
              <p className="text-xs text-gray-600">
                {healthMetrics.performance.issues} issues found
              </p>
              <Badge className={`mt-2 ${getStatusColor(healthMetrics.performance.status)}`}>
                {healthMetrics.performance.status}
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommendations */}
      {healthMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Health Recommendations
            </CardTitle>
            <CardDescription>
              Actionable steps to improve your application's health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getHealthRecommendations().map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                  <Activity className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analysis Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analysis</CardTitle>
          <CardDescription>
            In-depth analysis of different aspects of your application
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="links" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="server">Server</TabsTrigger>
              <TabsTrigger value="troubleshoot">Troubleshoot</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="links" className="p-6">
              <LinkIntegrityChecker />
            </TabsContent>
            
            <TabsContent value="server" className="p-6">
              <ServerDiagnostic />
            </TabsContent>
            
            <TabsContent value="troubleshoot" className="p-6">
              <TroubleshootingGuide error="Failed to fetch" />
            </TabsContent>
            
            <TabsContent value="code" className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Code className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-semibold">Code Quality Analysis</h3>
                </div>

                {codeHealth && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-600">{codeHealth.criticalErrors}</div>
                        <p className="text-sm text-gray-600">Critical Errors</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-yellow-600">{codeHealth.warnings}</div>
                        <p className="text-sm text-gray-600">Warnings</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">{codeHealth.suggestions}</div>
                        <p className="text-sm text-gray-600">Suggestions</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className="space-y-2">
                  {codeHealth?.analysisResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="font-medium text-sm mb-2">{result.file}</div>
                      {result.issues.length === 0 ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">No issues found</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {result.issues.map((issue, issueIndex) => (
                            <div key={issueIndex} className="flex items-start gap-2 text-sm">
                              {issue.type === 'error' && <XCircle className="w-4 h-4 text-red-500 mt-0.5" />}
                              {issue.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />}
                              {issue.type === 'info' && <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />}
                              <div>
                                <p>{issue.message}</p>
                                {issue.suggestion && (
                                  <p className="text-xs text-gray-500 mt-1">💡 {issue.suggestion}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="security" className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-red-500" />
                  <h3 className="text-lg font-semibold">Security Analysis</h3>
                </div>

                <div className="space-y-3">
                  {securityChecks.map((check, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                      {getStatusIcon(check.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{check.item}</p>
                          {getSeverityBadge(check.severity)}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{check.message}</p>
                        <p className="text-xs text-gray-500">Category: {check.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="performance" className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold">Performance Analysis</h3>
                </div>

                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    Performance analysis is coming soon. This will include bundle size analysis, 
                    loading time metrics, and optimization suggestions.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Bundle Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Component analysis and bundle size optimization recommendations
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Loading Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Page load times, lazy loading opportunities, and caching strategies
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}