import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { NutrientEditor } from './NutrientEditor'
import { IngredientEditor } from './IngredientEditor'
import { ProductEditor } from './ProductEditor'
import { PollutantEditor } from './PollutantEditor'
import { ScanEditor } from './ScanEditor'
import { MealEditor } from './MealEditor'
import { ParasiteEditor } from './ParasiteEditor'
import { UserManagement } from './UserManagement'
import { EnhancedUserManagement } from './EnhancedUserManagement'
import { UserReferralReview } from './UserReferralReview'
import { ReferralLinkTester } from './ReferralLinkTester'
import { QuickImport } from './QuickImport'
import { DataImportManager } from './DataImportManager'
import { RegionalRDIManager } from './RegionalRDIManager'
import { ApplicationHealthDashboard } from './ApplicationHealthDashboard'
import { DatabaseSeeder } from './DatabaseSeeder'
import { SupabaseDeploymentManager } from './SupabaseDeploymentManager'
import { ServerConnectionFixer } from './ServerConnectionFixer'
import { ThemeManager } from './ThemeManager'
import { HealthScanApiDashboard } from './HealthScanApiDashboard'
import { ApiMigrationUtility } from './admin/ApiMigrationUtility'
import { EmailServiceTest } from './EmailServiceTest'
import { ZapierIntegration } from './ZapierIntegration'

// Extracted components
import { QueuePositionMigration } from './admin/QueuePositionMigration'
import { QueueManagement } from './admin/QueueManagement'
import { ServerStatusIndicator } from './admin/ServerStatusIndicator'
import { ConnectionErrorBanner } from './admin/ConnectionErrorBanner'

// Helper functions and constants
import { transformServerStats, getFallbackStats, getCompletionPercentage, getStatusColor, AdminStats } from '../utils/adminHelpers/statsHelpers'
import { dataTypeCards, tabConfig } from '../constants/adminDashboardConstants'

import { toast } from 'sonner'
import { Database, Users, UserCheck, Package, Activity, ChevronRight, Heart, Zap, Leaf, Bug, Scan, Utensils, Settings, Upload, Globe, Server, RefreshCw, Wrench, ArrowUpDown, List, Trash, Menu, X, AlertTriangle, Wifi, Palette, Share2, Mail, ExternalLink } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface AdminDashboardProps {
  user: any
  accessToken: string
}

export function AdminDashboard({ user, accessToken }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<AdminStats>({})
  const [loading, setLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [serverConnected, setServerConnected] = useState(true)
  const [lastFetchError, setLastFetchError] = useState<string | null>(null)

  // Enhanced fetch admin statistics with proper production error handling
  const fetchStats = async () => {
    setLoading(true)
    setLastFetchError(null)
    
    try {
      console.log('📊 Fetching admin statistics...')
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/stats`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(30000) // 30 second timeout
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Admin stats fetched successfully:', data)
        
        if (data.success && data.detailedStats) {
          const transformedStats = transformServerStats(data.detailedStats)
          setStats(transformedStats)
          setServerConnected(true)
          setLastFetchError(null)
          toast.success('📊 Admin stats updated successfully')
        } else {
          console.warn('⚠️ Unexpected stats response format:', data)
          setStats(getFallbackStats())
          setServerConnected(false)
          setLastFetchError('Invalid response format from server')
          toast.warning('Received unexpected data format from server')
        }
      } else {
        console.warn('⚠️ Failed to fetch admin stats:', response.status, response.statusText)
        
        // Handle different error scenarios
        if (response.status === 401) {
          setLastFetchError('Authentication failed - please refresh your login')
          toast.error('Session expired. Please refresh the page and log in again.')
        } else if (response.status === 403) {
          setLastFetchError('Admin access denied - insufficient permissions')
          toast.error('Admin access denied. Please verify your admin permissions.')
        } else if (response.status === 404) {
          setLastFetchError('Admin endpoint not found - server may be updating')
          toast.warning('Admin service temporarily unavailable. Please try again in a few minutes.')
        } else if (response.status >= 500) {
          setLastFetchError('Server error - please try again later')
          toast.error('Server error occurred. Our team has been notified.')
        } else {
          const errorText = await response.text().catch(() => 'Unknown error')
          setLastFetchError(`HTTP ${response.status}: ${response.statusText}`)
          toast.error('Unable to fetch admin statistics. Please try again.')
        }
        
        setServerConnected(false)
        setStats(getFallbackStats())
      }
    } catch (error: any) {
      console.error('❌ Error fetching admin stats:', error)
      
      // Handle different types of errors
      if (error.name === 'AbortError') {
        setLastFetchError('Request timeout - server may be slow or unavailable')
        toast.error('Request timed out. Please check your internet connection and try again.')
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setLastFetchError('Network error - please check your internet connection')
        toast.error('Network connection failed. Please check your internet connection.')
      } else if (error.message.includes('NetworkError')) {
        setLastFetchError('Network error - server may be unreachable')
        toast.error('Unable to connect to server. Please try again later.')
      } else {
        setLastFetchError(error.message || 'Unknown network error')
        toast.error('An unexpected error occurred. Please try again.')
      }
      
      setServerConnected(false)
      setStats(getFallbackStats())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats()
    }, 500)

    return () => clearTimeout(timer)
  }, [accessToken])

  useEffect(() => {
    if (!serverConnected) return

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !document.hidden) {
        fetchStats()
      }
    }, 120000) // 2 minutes for production stability

    return () => clearInterval(interval)
  }, [accessToken, serverConnected])

  const handleStatsUpdate = () => {
    fetchStats()
  }

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab)
    setMobileMenuOpen(false)
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Connection Error Banner */}
      <ConnectionErrorBanner 
        serverConnected={serverConnected}
        lastFetchError={lastFetchError}
        loading={loading}
        onRetry={fetchStats}
      />

      {/* Mobile-optimized Admin Header */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">
              Admin Dashboard
            </h1>
            <p className="text-sm lg:text-base text-gray-600 mt-1 truncate">
              Welcome back, {user?.email?.split('@')[0]} • Full access
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <ServerStatusIndicator serverConnected={serverConnected} />
            <Badge variant="default" className="bg-green-600 text-white">
              <Database className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Admin</span>
            </Badge>
            <Button 
              onClick={fetchStats} 
              variant="outline" 
              size="sm" 
              disabled={loading}
              className="h-10 w-10 p-0 sm:w-auto sm:px-3"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} ${window.innerWidth >= 640 ? 'mr-2' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Admin Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 lg:space-y-6">
        {/* Mobile Tab Navigation */}
        <div className="relative">
          {/* Mobile Menu Button */}
          <div className="block lg:hidden">
            <Button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              variant="outline"
              className="w-full h-12 justify-between"
            >
              <div className="flex items-center">
                {tabConfig.find(tab => tab.value === activeTab)?.icon && (
                  React.createElement(tabConfig.find(tab => tab.value === activeTab)!.icon, {
                    className: "h-4 w-4 mr-2"
                  })
                )}
                {tabConfig.find(tab => tab.value === activeTab)?.label}
              </div>
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                <div className="p-2 space-y-1">
                  {tabConfig.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.value}
                        onClick={() => handleTabChange(tab.value)}
                        className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                          activeTab === tab.value
                            ? 'bg-green-50 text-green-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Tab List */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <TabsList className="flex flex-wrap gap-1 h-auto p-1 w-full min-w-max">
                {tabConfig.map((tab) => (
                  <TabsTrigger 
                    key={tab.value}
                    value={tab.value} 
                    className="text-xs sm:text-sm whitespace-nowrap"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>
        </div>

        {/* Overview Tab - Mobile Optimized */}
        <TabsContent value="overview" className="space-y-4 lg:space-y-6">
          {/* Quick Stats - Mobile Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <Card className="p-3 lg:p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-lg lg:text-2xl font-bold">{stats.users?.total || 0}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {stats.users?.confirmed || 0} confirmed
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-3 lg:p-4">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 lg:h-5 lg:w-5 text-green-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Data Types</p>
                  <p className="text-lg lg:text-2xl font-bold">7</p>
                  <p className="text-xs text-gray-500 truncate">categories</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 lg:p-4 col-span-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 lg:h-5 lg:w-5 text-purple-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs lg:text-sm font-medium text-gray-600">System Status</p>
                  <p className={`text-lg lg:text-2xl font-bold ${serverConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {serverConnected ? 'Online' : 'Issues'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {serverConnected ? 'All systems operational' : 'Connection problems detected'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Data Type Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {dataTypeCards.map((dataType) => {
              const Icon = dataType.icon
              const currentStats = stats[dataType.id as keyof AdminStats]
              const completion = getCompletionPercentage(currentStats?.total || 0, dataType.target)
              
              return (
                <Card key={dataType.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setActiveTab(dataType.tab)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-50">
                          <Icon className="h-5 w-5 text-gray-700" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{dataType.title}</CardTitle>
                          <CardDescription className="text-sm line-clamp-2">
                            {dataType.description}
                          </CardDescription>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-gray-900">
                          {currentStats?.total || 0}
                        </span>
                        <span className={`text-sm font-medium ${getStatusColor(completion)}`}>
                          {completion}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(completion, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{currentStats?.withImages || 0} with images</span>
                        <span>Target: {dataType.target}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Queue Management Tools */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <QueuePositionMigration accessToken={accessToken} serverConnected={serverConnected} />
            <QueueManagement 
              accessToken={accessToken} 
              serverConnected={serverConnected}
              onStatsUpdate={handleStatsUpdate}
            />
          </div>
        </TabsContent>

        {/* HealthScan API Tab */}
        <TabsContent value="healthscan-api">
          <HealthScanApiDashboard accessToken={accessToken} />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <EnhancedUserManagement accessToken={accessToken} />
        </TabsContent>

        {/* API Migration Tab */}
        <TabsContent value="api-migration">
          <ApiMigrationUtility accessToken={accessToken} />
        </TabsContent>

        {/* Email Service Tab */}
        <TabsContent value="email-service">
          <EmailServiceTest accessToken={accessToken} />
        </TabsContent>

        {/* Referral Test Tab */}
        <TabsContent value="referral-test">
          <div className="space-y-6">
            <ReferralLinkTester />
            <UserReferralReview accessToken={accessToken} />
          </div>
        </TabsContent>

        {/* ConvertKit Tab */}
        <TabsContent value="convertkit">
          <div>ConvertKit Integration - Coming Soon</div>
        </TabsContent>

        {/* Zapier Tab */}
        <TabsContent value="zapier">
          <ZapierIntegration />
        </TabsContent>

        {/* Data Editor Tabs */}
        <TabsContent value="nutrients">
          <NutrientEditor />
        </TabsContent>

        <TabsContent value="ingredients">
          <IngredientEditor />
        </TabsContent>

        <TabsContent value="products">
          <ProductEditor />
        </TabsContent>

        <TabsContent value="pollutants">
          <PollutantEditor />
        </TabsContent>

        <TabsContent value="scans">
          <ScanEditor />
        </TabsContent>

        <TabsContent value="meals">
          <MealEditor />
        </TabsContent>

        <TabsContent value="parasites">
          <ParasiteEditor />
        </TabsContent>

        {/* RDI Tab */}
        <TabsContent value="rdi">
          <RegionalRDIManager />
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import">
          <div className="space-y-6">
            <QuickImport onStatsUpdate={handleStatsUpdate} />
            <DataImportManager onStatsUpdate={handleStatsUpdate} />
          </div>
        </TabsContent>

        {/* Theme Tab */}
        <TabsContent value="theme">
          <ThemeManager isAdmin={true} />
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <div className="space-y-6">
            <ApplicationHealthDashboard />
            <DatabaseSeeder onComplete={handleStatsUpdate} />
            <SupabaseDeploymentManager />
            <ServerConnectionFixer />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}