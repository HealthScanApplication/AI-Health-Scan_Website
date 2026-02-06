import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Progress } from '../ui/progress'
import { toast } from 'sonner'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  TrendingUp, TrendingDown, Users, Share2, Award, Target,
  Calendar, DollarSign, Activity, Star, Crown, Trophy,
  RefreshCw, Download, Eye, ArrowUp, ArrowDown,
  UserPlus, Mail, CheckCircle, Clock, Gift
} from 'lucide-react'
import { healthscanAdminApi, formatApiError } from '../../services/healthscanAdminApiService'

interface ReferralMetrics {
  totalReferrals: number
  activeReferrals: number
  conversionRate: number
  avgRewardsPerUser: number
  totalRewardsDistributed: number
  topReferrerRewards: number
  pendingInvites: number
  confirmedInvites: number
  thisMonthGrowth: number
  lastMonthGrowth: number
}

interface LeaderboardEntry {
  userId: string
  userName: string
  userEmail: string
  totalReferrals: number
  confirmedReferrals: number
  totalRewards: number
  tier: string
  rank: number
  percentile: number
}

interface ConversionFunnel {
  step: string
  count: number
  conversionRate: number
  dropoffRate: number
}

interface TimeSeriesData {
  date: string
  referrals: number
  confirmations: number
  rewards: number
}

interface TierAnalysis {
  tier: string
  users: number
  avgReferrals: number
  conversionRate: number
  totalRewards: number
  color: string
}

interface ReferralAnalyticsDashboardProps {
  accessToken: string
}

export function ReferralAnalyticsDashboard({ accessToken }: ReferralAnalyticsDashboardProps) {
  // Core data state
  const [metrics, setMetrics] = useState<ReferralMetrics | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [conversionFunnel, setConversionFunnel] = useState<ConversionFunnel[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [tierAnalysis, setTierAnalysis] = useState<TierAnalysis[]>([])

  // UI state
  const [loading, setLoading] = useState(false)
  const [timeframe, setTimeframe] = useState('30d')
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)

  // Set up API service
  useEffect(() => {
    if (accessToken) {
      healthscanAdminApi.setAccessToken(accessToken)
    }
  }, [accessToken])

  // Fetch all analytics data
  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      const [
        metricsResponse,
        leaderboardResponse,
        conversionResponse,
        performanceResponse,
        engagementResponse
      ] = await Promise.all([
        healthscanAdminApi.getReferralStats(),
        healthscanAdminApi.getLeaderboard({ timeframe, limit: 50 }),
        healthscanAdminApi.getConversionMetrics(timeframe),
        healthscanAdminApi.getReferralPerformance(timeframe),
        healthscanAdminApi.getEngagementStats(timeframe)
      ])

      if (metricsResponse.success && metricsResponse.data) {
        setMetrics(metricsResponse.data as ReferralMetrics)
      }

      if (leaderboardResponse.success && leaderboardResponse.data) {
        const entries = (leaderboardResponse.data as any).entries || leaderboardResponse.data
        setLeaderboard(Array.isArray(entries) ? entries as LeaderboardEntry[] : [])
      }

      if (conversionResponse.success && conversionResponse.data) {
        // Transform conversion data into funnel format
        const data = conversionResponse.data as any
        const funnelData: ConversionFunnel[] = [
          {
            step: 'Invites Sent',
            count: data?.invitesSent ?? 0,
            conversionRate: 100,
            dropoffRate: 0
          },
          {
            step: 'Invites Opened',
            count: data?.invitesOpened ?? 0,
            conversionRate: ((data?.invitesOpened ?? 0) / (data?.invitesSent ?? 1)) * 100,
            dropoffRate: 0
          },
          {
            step: 'Registrations',
            count: data?.registrations ?? 0,
            conversionRate: ((data?.registrations ?? 0) / (data?.invitesSent ?? 1)) * 100,
            dropoffRate: 0
          },
          {
            step: 'Confirmations',
            count: data?.confirmations ?? 0,
            conversionRate: ((data?.confirmations ?? 0) / (data?.invitesSent ?? 1)) * 100,
            dropoffRate: 0
          }
        ]
        setConversionFunnel(funnelData)
      }

      if (performanceResponse.success && performanceResponse.data) {
        // Transform performance data for time series
        const perfData = performanceResponse.data as any
        const timeData = (perfData?.dailyStats || []).map((stat: any) => ({
          date: new Date(stat?.date || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          referrals: stat?.referrals ?? 0,
          confirmations: stat?.confirmations ?? 0,
          rewards: stat?.rewards ?? 0
        }))
        setTimeSeriesData(timeData)
      }

      if (engagementResponse.success && engagementResponse.data) {
        // Transform engagement data for tier analysis
        const data = engagementResponse.data as any
        const tiers: TierAnalysis[] = [
          {
            tier: 'Basic',
            users: data?.basicUsers ?? 0,
            avgReferrals: data?.basicAvgReferrals ?? 0,
            conversionRate: data?.basicConversion ?? 0,
            totalRewards: data?.basicRewards ?? 0,
            color: '#6b7280'
          },
          {
            tier: 'Premium',
            users: data?.premiumUsers ?? 0,
            avgReferrals: data?.premiumAvgReferrals ?? 0,
            conversionRate: data?.premiumConversion ?? 0,
            totalRewards: data?.premiumRewards ?? 0,
            color: '#3b82f6'
          },
          {
            tier: 'Pro',
            users: data?.proUsers ?? 0,
            avgReferrals: data?.proAvgReferrals ?? 0,
            conversionRate: data?.proConversion ?? 0,
            totalRewards: data?.proRewards ?? 0,
            color: '#8b5cf6'
          },
          {
            tier: 'VIP',
            users: data?.vipUsers || 0,
            avgReferrals: data?.vipAvgReferrals || 0,
            conversionRate: data?.vipConversion || 0,
            totalRewards: data?.vipRewards || 0,
            color: '#f59e0b'
          }
        ]
        setTierAnalysis(tiers)
      }

    } catch (error) {
      console.error('❌ Error fetching analytics:', error)
      toast.error(`Failed to load analytics: ${formatApiError(error)}`)
    } finally {
      setLoading(false)
    }
  }

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalyticsData()
    setRefreshing(false)
    toast.success('Analytics data refreshed')
  }

  // Export analytics
  const handleExport = async () => {
    try {
      const response = await healthscanAdminApi.exportAnalytics('referral-comprehensive', {
        timeframe,
        includeLeaderboard: true,
        includeFunnel: true,
        includeTimeSeries: true
      })

      if (response.success) {
        toast.success('Analytics export initiated - check your downloads')
      }
    } catch (error) {
      toast.error(`Export failed: ${formatApiError(error)}`)
    }
  }

  // Initialize component
  useEffect(() => {
    fetchAnalyticsData()
  }, [timeframe])

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      Basic: 'bg-gray-100 text-gray-800',
      Premium: 'bg-blue-100 text-blue-800',
      Pro: 'bg-purple-100 text-purple-800',
      VIP: 'bg-yellow-100 text-yellow-800'
    }
    return <Badge className={colors[tier] || colors.Basic}>{tier}</Badge>
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUp className="h-4 w-4 text-green-600" />
    if (growth < 0) return <ArrowDown className="h-4 w-4 text-red-600" />
    return <Activity className="h-4 w-4 text-gray-400" />
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600'
    if (growth < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  if (loading && !metrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading referral analytics...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Referral Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your referral program performance
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                  <p className="text-3xl font-bold">{metrics.totalReferrals.toLocaleString()}</p>
                </div>
                <Share2 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                {getGrowthIcon(metrics.thisMonthGrowth)}
                <span className={`ml-1 ${getGrowthColor(metrics.thisMonthGrowth)}`}>
                  {formatPercentage(Math.abs(metrics.thisMonthGrowth))} from last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-3xl font-bold">{formatPercentage(metrics.conversionRate)}</p>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="ml-1 text-gray-600">
                  {metrics.confirmedInvites} of {metrics.totalReferrals} confirmed
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Rewards</p>
                  <p className="text-3xl font-bold">{formatCurrency(metrics.totalRewardsDistributed)}</p>
                </div>
                <Award className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <DollarSign className="h-4 w-4 text-yellow-600" />
                <span className="ml-1 text-gray-600">
                  {formatCurrency(metrics.avgRewardsPerUser)} avg per user
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Invites</p>
                  <p className="text-3xl font-bold">{metrics.pendingInvites}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <Mail className="h-4 w-4 text-orange-600" />
                <span className="ml-1 text-gray-600">
                  Awaiting response
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tier Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Tier</CardTitle>
                <CardDescription>
                  Referral activity across user tiers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tierAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tier" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgReferrals" fill="#3b82f6" name="Avg Referrals" />
                    <Bar dataKey="conversionRate" fill="#10b981" name="Conversion %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tier Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>
                  Users across different tiers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tierAnalysis}
                      dataKey="users"
                      nameKey="tier"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.tier}: ${entry.users}`}
                    >
                      {tierAnalysis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Top Referrers
              </CardTitle>
              <CardDescription>
                Most active referrers in the selected timeframe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Total Referrals</TableHead>
                    <TableHead>Confirmed</TableHead>
                    <TableHead>Rewards Earned</TableHead>
                    <TableHead>Percentile</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.slice(0, 20).map((entry) => (
                    <TableRow key={entry.userId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {entry.rank <= 3 ? (
                            <Crown className={`h-4 w-4 ${
                              entry.rank === 1 ? 'text-yellow-600' :
                              entry.rank === 2 ? 'text-gray-400' :
                              'text-orange-600'
                            }`} />
                          ) : (
                            <span className="font-medium">#{entry.rank}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entry.userName || 'Unnamed User'}</div>
                          <div className="text-sm text-gray-500">{entry.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getTierBadge(entry.tier)}</TableCell>
                      <TableCell className="font-medium">{entry.totalReferrals}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{entry.confirmedReferrals}</span>
                          <Progress 
                            value={(entry.confirmedReferrals / Math.max(entry.totalReferrals, 1)) * 100} 
                            className="w-16 h-2"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(entry.totalRewards)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          Top {formatPercentage(entry.percentile)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversion Funnel Tab */}
        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Referral Conversion Funnel</CardTitle>
              <CardDescription>
                Track user journey from invite to confirmation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionFunnel.map((step, index) => (
                  <div key={step.step} className="relative">
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{step.step}</h4>
                          <div className="flex items-center gap-4">
                            <span className="text-2xl font-bold">{step.count.toLocaleString()}</span>
                            <Badge variant="outline">
                              {formatPercentage(step.conversionRate)}
                            </Badge>
                          </div>
                        </div>
                        <Progress value={step.conversionRate} className="w-full h-2" />
                      </div>
                    </div>
                    {index < conversionFunnel.length - 1 && (
                      <div className="absolute left-6 top-full w-0.5 h-4 bg-gray-200" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Referral Trends Over Time</CardTitle>
              <CardDescription>
                Track referral activity and rewards over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="referrals" fill="#3b82f6" name="Referrals" />
                  <Bar yAxisId="left" dataKey="confirmations" fill="#10b981" name="Confirmations" />
                  <Line yAxisId="right" type="monotone" dataKey="rewards" stroke="#f59e0b" strokeWidth={3} name="Rewards ($)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}