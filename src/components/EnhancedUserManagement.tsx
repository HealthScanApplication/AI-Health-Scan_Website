import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Checkbox } from './ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { toast } from 'sonner@2.0.3'
import { 
  Trash2, Edit, Plus, Search, Download, Eye, EyeOff, ToggleLeft, ToggleRight, 
  Users, UserCheck, UserX, Clock, Crown, Share2, Mail, Calendar, Activity, 
  CheckCircle, XCircle, AlertCircle, ChevronUp, ChevronDown, Copy, Send, 
  MailX, Link, TestTube, Loader2, MoreVertical, Zap, Gift, Target, 
  TrendingUp, Award, Star, UserPlus, Globe, Filter, RefreshCw, Download as DownloadIcon, Upload
} from 'lucide-react'

interface User {
  id: string
  email: string
  phone?: string
  created_at: string
  updated_at: string
  last_sign_in_at?: string
  email_confirmed_at?: string
  phone_confirmed_at?: string
  user_metadata?: any
  app_metadata?: any
  referralStats?: {
    totalReferrals: number
    confirmedReferrals: number
    pendingReferrals: number
    totalRewards: number
    lifetimeValue: number
  }
  waitlistData?: {
    queuePosition?: number
    position?: number
    joinDate?: string
    referralCode?: string
    usedReferralCode?: string
    emailConfirmed?: boolean
    needsConfirmation?: boolean
    tier?: string
    rewards?: any[]
  }
}

interface ReferralInvite {
  id: string
  referrer_id: string
  invitee_email: string
  invitee_name?: string
  referral_code: string
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled'
  created_at: string
  confirmed_at?: string
  reward_earned?: number
  notes?: string
}

interface UserStats {
  totalUsers: number
  confirmedUsers: number
  unconfirmedUsers: number
  todayUsers: number
  weekUsers: number
  confirmationRate: string
  avgPosition?: number
  totalReferrals?: number
  activeInvites?: number
  totalRewards?: number
}

interface EnhancedUserManagementProps {
  accessToken: string
}

const API_BASE = 'https://api.healthscan.live'

export function EnhancedUserManagement({ accessToken }: EnhancedUserManagementProps) {
  // Core state
  const [users, setUsers] = useState<User[]>([])
  const [referralInvites, setReferralInvites] = useState<ReferralInvite[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('users')

  // Filtering and sorting
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tierFilter, setTierFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Modal and dialog states
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showUserDetail, setShowUserDetail] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  // Batch operations
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [batchActionLoading, setBatchActionLoading] = useState(false)
  const [showBatchConfirmDialog, setShowBatchConfirmDialog] = useState(false)
  const [batchAction, setBatchAction] = useState<string>('')

  // Individual action loading states
  const [sendingVerification, setSendingVerification] = useState<string | null>(null)
  const [processingReferral, setProcessingReferral] = useState<string | null>(null)
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)

  // Forms
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    tier: 'basic'
  })

  const [editForm, setEditForm] = useState({
    email: '',
    name: '',
    phone: '',
    tier: 'basic',
    password: ''
  })

  const [inviteForm, setInviteForm] = useState({
    referrer_id: '',
    invitee_email: '',
    invitee_name: '',
    custom_message: ''
  })

  // API helper function
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE}${endpoint}`
    const defaultHeaders = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchUsers(),
        fetchReferralInvites(),
        fetchStats()
      ])
    } catch (error) {
      console.error('❌ Error fetching data:', error)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  // Fetch users with enhanced data
  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '25',
        search: searchTerm,
        status: statusFilter === 'all' ? '' : statusFilter,
        tier: tierFilter === 'all' ? '' : tierFilter,
        sortBy,
        sortOrder,
        includeReferralData: 'true',
        includeWaitlistData: 'true'
      })

      const data = await apiCall(`/admin/users?${params}`)
      setUsers(data.users || [])
      setTotalPages(data.pagination?.totalPages || 1)
      
      // Clear selections when data changes
      setSelectedUserIds(new Set())
      setSelectAll(false)
    } catch (error) {
      console.error('❌ Error fetching users:', error)
      toast.error('Failed to fetch users')
    }
  }

  // Fetch referral invites
  const fetchReferralInvites = async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
        includeUserData: 'true'
      })

      const data = await apiCall(`/admin/referral-invites?${params}`)
      setReferralInvites(data.invites || [])
    } catch (error) {
      console.error('❌ Error fetching referral invites:', error)
      toast.error('Failed to fetch referral invites')
    }
  }

  // Fetch enhanced statistics
  const fetchStats = async () => {
    try {
      const data = await apiCall('/admin/stats/comprehensive')
      setStats(data.stats)
    } catch (error) {
      console.error('❌ Error fetching stats:', error)
    }
  }

  // Initialize component
  useEffect(() => {
    fetchAllData()
  }, [currentPage, searchTerm, statusFilter, tierFilter, sortBy, sortOrder])

  // USER MANAGEMENT FUNCTIONS

  // Create new user with referral setup
  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password) {
      toast.error('Email and password are required')
      return
    }

    try {
      const userData = {
        ...createForm,
        autoGenerateReferralCode: true,
        sendWelcomeEmail: true
      }

      await apiCall('/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      })

      toast.success('User created successfully with referral code')
      setShowCreateDialog(false)
      setCreateForm({ email: '', password: '', name: '', phone: '', tier: 'basic' })
      fetchAllData()
    } catch (error) {
      console.error('❌ Error creating user:', error)
      toast.error(error.message || 'Failed to create user')
    }
  }

  // Update user with enhanced data
  const handleUpdateUser = async () => {
    if (!editUser || !editForm.email) {
      toast.error('Email is required')
      return
    }

    setUpdatingUser(editUser.id)
    try {
      await apiCall(`/admin/users/${editUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      })

      toast.success('User updated successfully')
      setEditUser(null)
      setEditForm({ email: '', name: '', phone: '', tier: 'basic', password: '' })
      fetchUsers()
    } catch (error) {
      console.error('❌ Error updating user:', error)
      toast.error(error.message || 'Failed to update user')
    } finally {
      setUpdatingUser(null)
    }
  }

  // Delete user with cascade
  const handleDeleteUser = async (userId: string) => {
    try {
      await apiCall(`/admin/users/${userId}`, {
        method: 'DELETE',
        body: JSON.stringify({ 
          cascadeReferrals: true,
          notifyConnections: false
        })
      })

      toast.success('User deleted successfully')
      fetchAllData()
    } catch (error) {
      console.error('❌ Error deleting user:', error)
      toast.error(error.message || 'Failed to delete user')
    }
  }

  // REFERRAL MANAGEMENT FUNCTIONS

  // Create manual referral invite
  const handleCreateInvite = async () => {
    if (!inviteForm.referrer_id || !inviteForm.invitee_email) {
      toast.error('Referrer and invitee email are required')
      return
    }

    try {
      await apiCall('/admin/referral-invites', {
        method: 'POST',
        body: JSON.stringify(inviteForm)
      })

      toast.success('Referral invite created successfully')
      setShowInviteDialog(false)
      setInviteForm({ referrer_id: '', invitee_email: '', invitee_name: '', custom_message: '' })
      fetchReferralInvites()
    } catch (error) {
      console.error('❌ Error creating invite:', error)
      toast.error(error.message || 'Failed to create referral invite')
    }
  }

  // Confirm referral invite manually
  const handleConfirmReferral = async (inviteId: string) => {
    setProcessingReferral(inviteId)
    try {
      await apiCall(`/admin/referral-invites/${inviteId}/confirm`, {
        method: 'POST',
        body: JSON.stringify({
          manualConfirmation: true,
          adminNotes: 'Manually confirmed by admin'
        })
      })

      toast.success('Referral confirmed successfully')
      fetchAllData()
    } catch (error) {
      console.error('❌ Error confirming referral:', error)
      toast.error(error.message || 'Failed to confirm referral')
    } finally {
      setProcessingReferral(null)
    }
  }

  // Cancel referral invite
  const handleCancelReferral = async (inviteId: string) => {
    try {
      await apiCall(`/admin/referral-invites/${inviteId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Admin cancellation',
          refundRewards: false
        })
      })

      toast.success('Referral cancelled successfully')
      fetchReferralInvites()
    } catch (error) {
      console.error('❌ Error cancelling referral:', error)
      toast.error(error.message || 'Failed to cancel referral')
    }
  }

  // Send verification email
  const handleSendVerificationEmail = async (userId: string, userEmail: string) => {
    setSendingVerification(userId)
    try {
      await apiCall(`/admin/users/${userId}/send-verification`, {
        method: 'POST',
        body: JSON.stringify({ 
          email: userEmail,
          template: 'admin_verification'
        })
      })

      toast.success(`Verification email sent to ${userEmail}`)
    } catch (error) {
      console.error('❌ Error sending verification:', error)
      toast.error(error.message || 'Failed to send verification email')
    } finally {
      setSendingVerification(null)
    }
  }

  // Batch operations
  const handleBatchAction = async (action: string) => {
    if (selectedUserIds.size === 0) {
      toast.error('Please select users first')
      return
    }

    setBatchActionLoading(true)
    const selectedUsers = users.filter(user => selectedUserIds.has(user.id))

    try {
      switch (action) {
        case 'send-verification':
          await apiCall('/admin/users/batch-send-verification', {
            method: 'POST',
            body: JSON.stringify({ userIds: Array.from(selectedUserIds) })
          })
          toast.success(`Verification emails sent to ${selectedUsers.length} users`)
          break

        case 'update-tier':
          // Would open a dialog to select tier
          break

        case 'export-data':
          await apiCall('/admin/users/export', {
            method: 'POST',
            body: JSON.stringify({ 
              userIds: Array.from(selectedUserIds),
              includeReferralData: true
            })
          })
          toast.success('User data export initiated')
          break

        default:
          toast.error('Unknown action')
      }

      setSelectedUserIds(new Set())
      setSelectAll(false)
    } catch (error) {
      console.error('❌ Error in batch action:', error)
      toast.error(error.message || 'Batch operation failed')
    } finally {
      setBatchActionLoading(false)
    }
  }

  // Selection handlers
  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUserIds)
    if (checked) {
      newSelected.add(userId)
    } else {
      newSelected.delete(userId)
    }
    setSelectedUserIds(newSelected)
    setSelectAll(newSelected.size === users.length && users.length > 0)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(new Set(users.map(user => user.id)))
      setSelectAll(true)
    } else {
      setSelectedUserIds(new Set())
      setSelectAll(false)
    }
  }

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (user: User) => {
    if (user.email_confirmed_at) {
      return <Badge variant="default" className="bg-green-600">Confirmed</Badge>
    }
    if (user.waitlistData?.emailConfirmed) {
      return <Badge variant="secondary">Waitlist Confirmed</Badge>
    }
    return <Badge variant="destructive">Unconfirmed</Badge>
  }

  const getTierBadge = (tier: string) => {
    const colors = {
      basic: 'bg-gray-600',
      premium: 'bg-blue-600',
      pro: 'bg-purple-600',
      vip: 'bg-gold-600'
    }
    return <Badge className={colors[tier] || colors.basic}>{tier.toUpperCase()}</Badge>
  }

  const getReferralStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-600',
      confirmed: 'bg-green-600',
      expired: 'bg-red-600',
      cancelled: 'bg-gray-600'
    }
    return <Badge className={colors[status] || colors.pending}>{status.toUpperCase()}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats?.confirmedUsers || 0} confirmed • {stats?.todayUsers || 0} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Referrals</p>
                <p className="text-3xl font-bold">{stats?.totalReferrals || 0}</p>
              </div>
              <Share2 className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats?.activeInvites || 0} pending invites
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Confirmation Rate</p>
                <p className="text-3xl font-bold">{stats?.confirmationRate || '0%'}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This week: +{stats?.weekUsers || 0} users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Rewards</p>
                <p className="text-3xl font-bold">${stats?.totalRewards || 0}</p>
              </div>
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Lifetime value distributed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="referrals">
              <Share2 className="h-4 w-4 mr-2" />
              Referrals ({referralInvites.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button 
              onClick={fetchAllData} 
              variant="outline" 
              size="sm" 
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={() => setShowCreateDialog(true)} 
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by email, name, or referral code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
                <SelectItem value="waitlist">Waitlist</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Batch Actions */}
          {selectedUserIds.size > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedUserIds.size} user{selectedUserIds.size !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleBatchAction('send-verification')}
                      disabled={batchActionLoading}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send Verification
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleBatchAction('export-data')}
                      disabled={batchActionLoading}
                    >
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Queue Position</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUserIds.has(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.user_metadata?.name || 'Unnamed User'}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.waitlistData?.referralCode && (
                            <div className="text-xs text-blue-600 font-mono">
                              {user.waitlistData.referralCode}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(user)}</TableCell>
                      <TableCell>
                        {getTierBadge(user.waitlistData?.tier || 'basic')}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {user.referralStats?.confirmedReferrals || 0} confirmed
                          </div>
                          <div className="text-gray-500">
                            {user.referralStats?.pendingReferrals || 0} pending
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.waitlistData?.queuePosition ? (
                          <Badge variant="outline">#{user.waitlistData.queuePosition}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user)
                              setShowUserDetail(true)
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setEditUser(user)
                              setEditForm({
                                email: user.email,
                                name: user.user_metadata?.name || '',
                                phone: user.phone || '',
                                tier: user.waitlistData?.tier || 'basic',
                                password: ''
                              })
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleSendVerificationEmail(user.id, user.email)}
                              disabled={sendingVerification === user.id}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Send Verification
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Referral Invites Management</h3>
            <Button onClick={() => setShowInviteDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Invite
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Invitee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Confirmed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referralInvites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell>
                        <div className="text-sm">
                          {/* You would populate this from user data */}
                          <div className="font-medium">Referrer User</div>
                          <div className="text-gray-500">{invite.referrer_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{invite.invitee_name || 'Unnamed'}</div>
                          <div className="text-gray-500">{invite.invitee_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getReferralStatusBadge(invite.status)}</TableCell>
                      <TableCell className="font-mono text-sm">{invite.referral_code}</TableCell>
                      <TableCell className="text-sm">{formatDate(invite.created_at)}</TableCell>
                      <TableCell className="text-sm">
                        {invite.confirmed_at ? formatDate(invite.confirmed_at) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {invite.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleConfirmReferral(invite.id)}
                              disabled={processingReferral === invite.id}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirm
                            </Button>
                          )}
                          {invite.status !== 'cancelled' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleCancelReferral(invite.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user with automatic referral code generation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Secure password"
              />
            </div>
            <div>
              <Label htmlFor="tier">Tier</Label>
              <Select value={createForm.tier} onValueChange={(value) => 
                setCreateForm(prev => ({ ...prev, tier: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser}>
              Create User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Referral Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Referral Invite</DialogTitle>
            <DialogDescription>
              Manually create a referral invite for a user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="referrer">Referrer User ID *</Label>
              <Input
                id="referrer"
                value={inviteForm.referrer_id}
                onChange={(e) => setInviteForm(prev => ({ ...prev, referrer_id: e.target.value }))}
                placeholder="User ID of referrer"
              />
            </div>
            <div>
              <Label htmlFor="invitee_email">Invitee Email *</Label>
              <Input
                id="invitee_email"
                type="email"
                value={inviteForm.invitee_email}
                onChange={(e) => setInviteForm(prev => ({ ...prev, invitee_email: e.target.value }))}
                placeholder="invitee@example.com"
              />
            </div>
            <div>
              <Label htmlFor="invitee_name">Invitee Name</Label>
              <Input
                id="invitee_name"
                value={inviteForm.invitee_name}
                onChange={(e) => setInviteForm(prev => ({ ...prev, invitee_name: e.target.value }))}
                placeholder="Optional name"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvite}>
              Create Invite
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}