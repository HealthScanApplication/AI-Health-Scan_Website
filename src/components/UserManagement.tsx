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
import { toast } from 'sonner@2.0.3'
import { Trash2, Edit, Plus, Search, Download, Eye, EyeOff, ToggleLeft, ToggleRight, Users, UserCheck, UserX, Clock, Crown, Share2, Mail, Calendar, Activity, CheckCircle, XCircle, AlertCircle, ChevronUp, ChevronDown, Copy, Send, MailX, Link, TestTube, Loader2, MoreVertical, ChevronDown as ChevronDownIcon, Zap } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

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
    activeReferrals: number
  }
  waitlistData?: {
    queuePosition?: number
    position?: number // Backward compatibility
    joinDate?: string
    referralCode?: string
    usedReferralCode?: string
    emailConfirmed?: boolean
    needsConfirmation?: boolean
  }
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
}

interface UserManagementProps {
  accessToken: string
}

export function UserManagement({ accessToken }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showUserDetail, setShowUserDetail] = useState(false)

  // Selection and Batch Operation States
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [batchActionLoading, setBatchActionLoading] = useState(false)
  const [showBatchConfirmDialog, setShowBatchConfirmDialog] = useState(false)
  const [batchAction, setBatchAction] = useState<string>('')

  // Individual delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  // Loading states for individual actions
  const [sendingVerification, setSendingVerification] = useState<string | null>(null)
  const [unverifyingUser, setUnverifyingUser] = useState<string | null>(null)
  const [testingReferral, setTestingReferral] = useState<string | null>(null)
  
  // Email service status
  const [emailServiceStatus, setEmailServiceStatus] = useState<any>(null)
  const [checkingEmailService, setCheckingEmailService] = useState(false)

  // Form states
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  })

  const [editForm, setEditForm] = useState({
    email: '',
    name: '',
    phone: '',
    password: ''
  })

  // Check email service status
  const checkEmailServiceStatus = async () => {
    setCheckingEmailService(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/email-service-status`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setEmailServiceStatus(data.status)
        
        if (!data.status.configured) {
          console.warn('⚠️ Email service not configured:', data.status.missingKeys)
        } else {
          console.log('✅ Email service configured with provider:', data.status.provider)
        }
      }
    } catch (error) {
      console.error('❌ Error checking email service status:', error)
    } finally {
      setCheckingEmailService(false)
    }
  }

  // Initialize component data
  useEffect(() => {
    fetchUsers()
    fetchStats()
    checkEmailServiceStatus()
  }, [currentPage, searchTerm, statusFilter, sortBy, sortOrder])

  // Enhanced fetch users with waitlist data and frontend sorting
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '25',
        search: searchTerm,
        status: statusFilter,
        sortBy: ['created_at', 'email', 'last_sign_in_at'].includes(sortBy) ? sortBy : 'created_at',
        sortOrder
      })

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/users?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`)
      }

      const data = await response.json()
      
      // Enhance users with waitlist data
      const enhancedUsers = await Promise.all(
        (data.users || []).map(async (user: User) => {
          try {
            // Fetch waitlist data for each user
            const waitlistResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/user-waitlist-data`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${publicAnonKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: user.email })
              }
            )

            let waitlistData = {}
            if (waitlistResponse.ok) {
              const waitlistResult = await waitlistResponse.json()
              if (waitlistResult.success && waitlistResult.data) {
                waitlistData = waitlistResult.data
              }
            }

            return {
              ...user,
              waitlistData
            }
          } catch (error) {
            console.warn('Failed to fetch waitlist data for user:', user.email, error)
            return user
          }
        })
      )

      // Apply frontend sorting for columns not supported by backend
      let sortedUsers = [...enhancedUsers]
      if (!['created_at', 'email', 'last_sign_in_at'].includes(sortBy)) {
        sortedUsers = sortUsersByColumn(enhancedUsers, sortBy, sortOrder)
      }

      setUsers(sortedUsers)
      setTotalPages(data.pagination?.totalPages || 1)
      
      // Clear selections when data changes
      setSelectedUserIds(new Set())
      setSelectAll(false)
    } catch (error) {
      console.error('❌ Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  // Frontend sorting function for custom columns
  const sortUsersByColumn = (users: User[], column: string, order: string) => {
    return users.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (column) {
        case 'name':
          aValue = a.user_metadata?.name || ''
          bValue = b.user_metadata?.name || ''
          break
        case 'position':
          aValue = a.waitlistData?.queuePosition || a.waitlistData?.position || 999999
          bValue = b.waitlistData?.queuePosition || b.waitlistData?.position || 999999
          break
        case 'confirmation_status':
          aValue = getConfirmationSortValue(a)
          bValue = getConfirmationSortValue(b)
          break
        case 'total_referrals':
          aValue = a.referralStats?.totalReferrals || 0
          bValue = b.referralStats?.totalReferrals || 0
          break
        case 'referral_code':
          aValue = a.waitlistData?.referralCode || ''
          bValue = b.waitlistData?.referralCode || ''
          break
        default:
          return 0
      }

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase())
        return order === 'asc' ? comparison : -comparison
      }

      // Handle numeric comparison
      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
  }

  // Helper function to get numeric value for confirmation status sorting
  const getConfirmationSortValue = (user: User): number => {
    if (user.email_confirmed_at) return 3
    if (user.waitlistData?.emailConfirmed) return 2
    if (user.waitlistData?.needsConfirmation) return 1
    return 0
  }

  // Enhanced fetch user statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/users/stats`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        
        // Calculate additional stats from users data
        let totalReferrals = 0
        let totalPositions = 0
        let positionCount = 0

        users.forEach(user => {
          if (user.referralStats?.totalReferrals) {
            totalReferrals += user.referralStats.totalReferrals
          }
          const queuePosition = user.waitlistData?.queuePosition || user.waitlistData?.position
          if (queuePosition) {
            totalPositions += queuePosition
            positionCount++
          }
        })

        const avgPosition = positionCount > 0 ? Math.round(totalPositions / positionCount) : undefined

        setStats({
          ...data,
          avgPosition,
          totalReferrals
        })
      }
    } catch (error) {
      console.error('❌ Error fetching user stats:', error)
    }
  }

  // BATCH OPERATIONS

  // Handle individual row selection
  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUserIds)
    if (checked) {
      newSelected.add(userId)
    } else {
      newSelected.delete(userId)
    }
    setSelectedUserIds(newSelected)
    
    // Update select all state
    setSelectAll(newSelected.size === users.length && users.length > 0)
  }

  // Handle select all toggle
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(new Set(users.map(user => user.id)))
      setSelectAll(true)
    } else {
      setSelectedUserIds(new Set())
      setSelectAll(false)
    }
  }

  // Get selected users data
  const getSelectedUsers = () => {
    return users.filter(user => selectedUserIds.has(user.id))
  }

  // Batch send verification emails
  const handleBatchSendVerification = async () => {
    const selectedUsers = getSelectedUsers()
    setBatchActionLoading(true)
    
    try {
      console.log(`📧 Sending verification emails to ${selectedUsers.length} users`)
      
      const results = await Promise.allSettled(
        selectedUsers.map(user =>
          fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/users/${user.id}/send-verification`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: user.email })
          }).then(response => {
            if (!response.ok) {
              return response.json().then(error => Promise.reject(error))
            }
            return response.json()
          })
        )
      )

      const successful = results.filter(result => result.status === 'fulfilled').length
      const failed = results.length - successful

      if (successful > 0) {
        toast.success(`📧 Verification emails sent to ${successful} users`)
      }
      
      if (failed > 0) {
        // Check if failures are due to email service not being configured
        const rejectedResults = results.filter(result => result.status === 'rejected')
        const configErrors = rejectedResults.filter(result => 
          result.reason?.error?.includes('Email service not configured') ||
          result.reason?.configured === false
        )
        
        if (configErrors.length > 0) {
          toast.error(`📧 Email service not configured. Please set up RESEND_API_KEY, SENDGRID_API_KEY, or POSTMARK_API_KEY environment variable.`)
        } else {
          toast.error(`❌ Failed to send emails to ${failed} users`)
        }
      }

      setSelectedUserIds(new Set())
      setSelectAll(false)
    } catch (error) {
      console.error('❌ Error in batch send verification:', error)
      toast.error('Failed to send verification emails')
    } finally {
      setBatchActionLoading(false)
    }
  }

  // Batch unverify users - Updated for development
  const handleBatchUnverify = async () => {
    const selectedUsers = getSelectedUsers()
    setBatchActionLoading(true)
    
    try {
      // For development: Show success without actual API calls
      toast.success(`🔄 Development Mode: Would unverify ${selectedUsers.length} users for testing`)
      
      setSelectedUserIds(new Set())
      setSelectAll(false)
      fetchUsers() // Refresh to show updated status
    } catch (error) {
      console.error('❌ Error in batch unverify:', error)
      toast.error('Failed to unverify users')
    } finally {
      setBatchActionLoading(false)
    }
  }

  // Batch delete users
  const handleBatchDelete = async () => {
    const selectedUsers = getSelectedUsers()
    setBatchActionLoading(true)
    
    try {
      const results = await Promise.allSettled(
        selectedUsers.map(user =>
          fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/users/${user.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            }
          })
        )
      )

      const successful = results.filter(result => result.status === 'fulfilled').length
      const failed = results.length - successful

      if (successful > 0) {
        toast.success(`🗑️ ${successful} users deleted successfully`)
      }
      if (failed > 0) {
        toast.error(`❌ Failed to delete ${failed} users`)
      }

      setSelectedUserIds(new Set())
      setSelectAll(false)
      fetchUsers() // Refresh user list
      fetchStats() // Refresh stats
    } catch (error) {
      console.error('❌ Error in batch delete:', error)
      toast.error('Failed to delete users')
    } finally {
      setBatchActionLoading(false)
    }
  }

  // Batch copy referral links
  const handleBatchCopyReferralLinks = async () => {
    const selectedUsers = getSelectedUsers()
    const usersWithReferrals = selectedUsers.filter(user => user.waitlistData?.referralCode)
    
    if (usersWithReferrals.length === 0) {
      toast.error('No selected users have referral codes')
      return
    }

    try {
      const referralLinks = usersWithReferrals.map(user => 
        `${user.email}: ${window.location.origin}?ref=${user.waitlistData!.referralCode}`
      ).join('\n')
      
      // Copy to clipboard
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(referralLinks)
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement('textarea')
        textArea.value = referralLinks
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      
      toast.success(`📋 ${usersWithReferrals.length} referral links copied to clipboard`)
      setSelectedUserIds(new Set())
      setSelectAll(false)
    } catch (error) {
      console.error('❌ Error copying referral links:', error)
      toast.error('Failed to copy referral links')
    }
  }

  // Handle batch action confirmation
  const handleBatchActionConfirm = async () => {
    setShowBatchConfirmDialog(false)
    
    switch (batchAction) {
      case 'send-verification':
        await handleBatchSendVerification()
        break
      case 'unverify':
        await handleBatchUnverify()
        break
      case 'delete':
        await handleBatchDelete()
        break
      case 'copy-referrals':
        await handleBatchCopyReferralLinks()
        break
      default:
        toast.error('Unknown batch action')
    }
    
    setBatchAction('')
  }

  // Trigger batch action with confirmation
  const triggerBatchAction = (action: string) => {
    if (selectedUserIds.size === 0) {
      toast.error('Please select users first')
      return
    }
    
    setBatchAction(action)
    setShowBatchConfirmDialog(true)
  }

  // Get batch action description
  const getBatchActionDescription = () => {
    const count = selectedUserIds.size
    const selectedUsers = getSelectedUsers()
    
    switch (batchAction) {
      case 'send-verification':
        return `Send verification emails to ${count} selected user${count !== 1 ? 's' : ''}?`
      case 'unverify':
        return `Remove email confirmation from ${count} selected user${count !== 1 ? 's' : ''} for testing purposes?`
      case 'delete':
        return `Permanently delete ${count} selected user${count !== 1 ? 's' : ''}? This action cannot be undone.`
      case 'copy-referrals':
        const withReferrals = selectedUsers.filter(user => user.waitlistData?.referralCode).length
        return `Copy referral links for ${withReferrals} user${withReferrals !== 1 ? 's' : ''} with referral codes to clipboard?`
      default:
        return 'Confirm this action?'
    }
  }

  // INDIVIDUAL USER ACTIONS (Updated for development)

  // Send verification email to user
  const handleSendVerificationEmail = async (userEmail: string, userId: string) => {
    setSendingVerification(userId)
    try {
      console.log(`📧 Sending verification email to ${userEmail} (${userId})`)
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/users/${userId}/send-verification`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: userEmail })
        }
      )

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 503 && !result.configured) {
          // Email service not configured
          toast.error(`📧 Email service not configured. Please configure RESEND_API_KEY, SENDGRID_API_KEY, or POSTMARK_API_KEY environment variable.`)
          toast.info(`💡 The system needs an email provider API key to send verification emails from noreply@healthscan.live`)
        } else {
          throw new Error(result.error || result.details || 'Failed to send verification email')
        }
        return
      }

      toast.success(`📧 Verification email sent to ${userEmail}`)
      console.log(`✅ Email sent successfully at ${result.sentAt}`)
    } catch (error) {
      console.error('❌ Error sending verification email:', error)
      toast.error(`Failed to send verification email: ${error.message}`)
    } finally {
      setSendingVerification(null)
    }
  }

  // Unverify user for testing purposes - Updated for development
  const handleUnverifyUser = async (userId: string, userEmail: string) => {
    setUnverifyingUser(userId)
    try {
      // For development: Show success without actual API call
      toast.success(`🔄 Development Mode: Would unverify ${userEmail} for testing`)
      
      // Uncomment when server endpoint is ready:
      /*
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/users/${userId}/unverify`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to unverify user')
      }

      toast.success(`🔄 User ${userEmail} has been unverified for testing`)
      fetchUsers() // Refresh user list
      */
    } catch (error) {
      console.error('❌ Error unverifying user:', error)
      toast.error(`Development Mode: Unverify endpoint not yet implemented`)
    } finally {
      setUnverifyingUser(null)
    }
  }

  // Copy referral link for testing
  const handleCopyReferralLink = async (referralCode: string, userEmail: string) => {
    try {
      const referralLink = `${window.location.origin}?ref=${referralCode}`
      
      // Copy to clipboard
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(referralLink)
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement('textarea')
        textArea.value = referralLink
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      
      toast.success(`📋 Referral link copied for ${userEmail}`)
      toast.info(`🔗 ${referralLink}`, { duration: 8000 })
    } catch (error) {
      console.error('❌ Error copying referral link:', error)
      toast.error('Failed to copy referral link')
    }
  }

  // Test referral flow by simulating confirmed referral - Updated for development
  const handleTestReferralFlow = async (referralCode: string, userEmail: string) => {
    setTestingReferral(referralCode)
    try {
      // For development: Show success without actual API call
      toast.success(`🧪 Development Mode: Would test referral flow for ${userEmail}`)
      
      // Uncomment when server endpoint is ready:
      /*
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/test-referral-flow`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            referralCode,
            testEmail: `test-${Date.now()}@healthscan.test`,
            testName: `Test User ${Date.now()}`
          })
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to test referral flow')
      }

      toast.success(`🧪 Referral flow tested! ${userEmail} now has +1 confirmed referral`)
      fetchUsers() // Refresh to show updated referral count
      fetchStats() // Refresh stats
      */
    } catch (error) {
      console.error('❌ Error testing referral flow:', error)
      toast.error(`Development Mode: Test referral endpoint not yet implemented`)
    } finally {
      setTestingReferral(null)
    }
  }

  // Create new user
  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password) {
      toast.error('Email and password are required')
      return
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/users`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createForm)
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create user')
      }

      toast.success('User created successfully')
      setShowCreateDialog(false)
      setCreateForm({ email: '', password: '', name: '', phone: '' })
      fetchUsers()
      fetchStats()
    } catch (error) {
      console.error('❌ Error creating user:', error)
      toast.error(error.message || 'Failed to create user')
    }
  }

  // Update user
  const handleUpdateUser = async () => {
    if (!editUser || !editForm.email) {
      toast.error('Email is required')
      return
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/users/${editUser.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editForm)
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user')
      }

      toast.success('User updated successfully')
      setEditUser(null)
      setEditForm({ email: '', name: '', phone: '', password: '' })
      fetchUsers()
    } catch (error) {
      console.error('❌ Error updating user:', error)
      toast.error(error.message || 'Failed to update user')
    }
  }

  // Handle individual delete confirmation
  const handleDeleteUserClick = (user: User) => {
    setUserToDelete(user)
    setShowDeleteConfirm(true)
  }

  // Delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/users/${userToDelete.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete user')
      }

      toast.success(`User ${userToDelete.email} deleted successfully`)
      setShowDeleteConfirm(false)
      setUserToDelete(null)
      fetchUsers()
      fetchStats()
    } catch (error) {
      console.error('❌ Error deleting user:', error)
      toast.error(error.message || 'Failed to delete user')
    }
  }

  // Toggle user status
  const handleToggleUserStatus = async (userId: string, currentlyConfirmed: boolean) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/users/${userId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ confirmed: !currentlyConfirmed })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user status')
      }

      toast.success(`User ${!currentlyConfirmed ? 'confirmed' : 'unconfirmed'} successfully`)
      fetchUsers()
      fetchStats()
    } catch (error) {
      console.error('❌ Error updating user status:', error)
      toast.error(error.message || 'Failed to update user status')
    }
  }

  // Enhanced export users to CSV with all data
  const handleExportCSV = () => {
    const csvHeaders = [
      'Email', 'Name', 'Phone', 'Auth Status', 'Email Confirmed', 
      'Queue Position', 'Referral Code', 'Used Referral', 'Total Referrals', 
      'Active Referrals', 'Created Date', 'Last Sign In', 'Join Date'
    ]
    
    const usersToExport = selectedUserIds.size > 0 ? getSelectedUsers() : users
    
    const csvData = usersToExport.map(user => [
      user.email,
      user.user_metadata?.name || '',
      user.phone || '',
      user.email_confirmed_at ? 'Confirmed' : 'Unconfirmed',
      user.waitlistData?.emailConfirmed ? 'Yes' : user.waitlistData?.needsConfirmation ? 'Pending' : 'No',
      user.waitlistData?.queuePosition || user.waitlistData?.position || '',
      user.waitlistData?.referralCode || '',
      user.waitlistData?.usedReferralCode || '',
      user.referralStats?.totalReferrals || 0,
      user.referralStats?.activeReferrals || 0,
      new Date(user.created_at).toLocaleDateString(),
      user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never',
      user.waitlistData?.joinDate ? new Date(user.waitlistData.joinDate).toLocaleDateString() : ''
    ])

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const exportType = selectedUserIds.size > 0 ? 'selected' : 'all'
    a.download = `healthscan-users-${exportType}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success(`${usersToExport.length} user records exported to CSV`)
  }

  // Load user detail
  const handleViewUser = async (user: User) => {
    setSelectedUser(user)
    setShowUserDetail(true)
  }

  // Initialize edit form
  const handleEditUser = (user: User) => {
    setEditUser(user)
    setEditForm({
      email: user.email,
      name: user.user_metadata?.name || '',
      phone: user.phone || '',
      password: ''
    })
  }

  // Effects
  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchTerm, statusFilter, sortBy, sortOrder])

  useEffect(() => {
    if (users.length > 0) {
      fetchStats()
    }
  }, [users])

  // Debounced search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setCurrentPage(1) // Reset to first page on search
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  const getConfirmationStatus = (user: User) => {
    if (user.email_confirmed_at) return 'auth-confirmed'
    if (user.waitlistData?.emailConfirmed) return 'email-confirmed'
    if (user.waitlistData?.needsConfirmation) return 'pending'
    return 'unconfirmed'
  }

  const getConfirmationBadge = (user: User) => {
    const status = getConfirmationStatus(user)
    
    switch (status) {
      case 'auth-confirmed':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Auth Confirmed</Badge>
      case 'email-confirmed':
        return <Badge variant="default" className="bg-blue-600"><Mail className="w-3 h-3 mr-1" />Email Confirmed</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-600 text-white"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>
      default:
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Unconfirmed</Badge>
    }
  }

  // Handle column header click for sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new column and default to ascending
      setSortBy(column)
      setSortOrder('asc')
    }
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  // Get sort icon for header
  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ChevronUp className="w-4 h-4 text-gray-300" />
    }
    return sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-green-600" /> : 
      <ChevronDown className="w-4 h-4 text-green-600" />
  }

  // Sortable header component
  const SortableHeader = ({ column, children, className = "" }: { 
    column: string, 
    children: React.ReactNode, 
    className?: string 
  }) => (
    <TableHead 
      className={`cursor-pointer hover:bg-gray-50 transition-colors select-none ${className}`}
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-2">
        {children}
        {getSortIcon(column)}
      </div>
    </TableHead>
  )

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Enhanced Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
          <Card className="p-3 lg:p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs lg:text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-lg lg:text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 lg:p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 lg:h-5 lg:w-5 text-green-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs lg:text-sm font-medium text-gray-600">Confirmed</p>
                <p className="text-lg lg:text-2xl font-bold">{stats.confirmedUsers}</p>
                <p className="text-xs text-gray-500 truncate">{stats.confirmationRate}% rate</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 lg:p-4">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 lg:h-5 lg:w-5 text-purple-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs lg:text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-lg lg:text-2xl font-bold">{stats.totalReferrals || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 lg:p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 lg:h-5 lg:w-5 text-orange-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs lg:text-sm font-medium text-gray-600">Avg Queue</p>
                <p className="text-lg lg:text-2xl font-bold">{stats.avgPosition || 'N/A'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 lg:p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 lg:h-5 lg:w-5 text-indigo-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs lg:text-sm font-medium text-gray-600">This Week</p>
                <p className="text-lg lg:text-2xl font-bold">{stats.weekUsers}</p>
                <p className="text-xs text-gray-500 truncate">Today: {stats.todayUsers}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main User Management Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg lg:text-xl">Enhanced User Management</CardTitle>
              <CardDescription className="text-sm">
                Search by email address, select multiple users, and apply batch operations.
                <span className="hidden lg:inline"> Click headers to sort.</span>
                {selectedUserIds.size > 0 && (
                  <span className="ml-2 font-medium text-green-600">
                    {selectedUserIds.size} user{selectedUserIds.size !== 1 ? 's' : ''} selected
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Batch Actions Menu - Shows when users are selected */}
              {selectedUserIds.size > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-10 bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                      disabled={batchActionLoading}
                    >
                      {batchActionLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      Batch Actions ({selectedUserIds.size})
                      <ChevronDownIcon className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>Batch Operations</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => triggerBatchAction('send-verification')}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Verification Emails
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => triggerBatchAction('unverify')}>
                      <MailX className="h-4 w-4 mr-2" />
                      Unverify Users (Testing)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => triggerBatchAction('copy-referrals')}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Referral Links
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => triggerBatchAction('delete')}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected Users
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button onClick={handleExportCSV} variant="outline" size="sm" className="h-10">
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">
                  Export {selectedUserIds.size > 0 ? 'Selected' : 'All'} CSV
                </span>
                <span className="sm:hidden">Export</span>
              </Button>
              
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-10">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Add User</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Add a new user to the system. They will be automatically confirmed.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="create-email">Email *</Label>
                      <Input
                        id="create-email"
                        type="email"
                        value={createForm.email}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="user@example.com"
                        className="h-12"
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-password">Password *</Label>
                      <Input
                        id="create-password"
                        type="password"
                        value={createForm.password}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Secure password"
                        className="h-12"
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-name">Name</Label>
                      <Input
                        id="create-name"
                        value={createForm.name}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Full name"
                        className="h-12"
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-phone">Phone</Label>
                      <Input
                        id="create-phone"
                        value={createForm.phone}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1234567890"
                        className="h-12"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="h-12">
                        Cancel
                      </Button>
                      <Button onClick={handleCreateUser} className="h-12">
                        Create User
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by email address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-32 sm:w-40 h-12">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Auth Confirmed</SelectItem>
                  <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
                  <SelectItem value="pending">Email Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-')
                setSortBy(field)
                setSortOrder(order)
                setCurrentPage(1)
              }}>
                <SelectTrigger className="w-32 sm:w-40 h-12">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at-desc">Newest First</SelectItem>
                  <SelectItem value="created_at-asc">Oldest First</SelectItem>
                  <SelectItem value="email-asc">Email A-Z</SelectItem>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="position-asc">Queue (Low-High)</SelectItem>
                  <SelectItem value="total_referrals-desc">Most Referrals</SelectItem>
                  <SelectItem value="confirmation_status-desc">Confirmed First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Enhanced Users Table with Selection */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all users"
                      />
                    </TableHead>
                    <SortableHeader column="email">Email</SortableHeader>
                    <SortableHeader column="name" className="hidden sm:table-cell">Name</SortableHeader>
                    <TableHead className="hidden lg:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Queue #</TableHead>
                    <TableHead className="hidden lg:table-cell">Referrals</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-green-600 mr-2" />
                          Loading users...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow 
                        key={user.id} 
                        className={`hover:bg-gray-50 ${selectedUserIds.has(user.id) ? 'bg-green-50 hover:bg-green-100' : ''}`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedUserIds.has(user.id)}
                            onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                            aria-label={`Select user ${user.email}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="max-w-48 lg:max-w-none">
                            <div className="truncate">{user.email}</div>
                            <div className="text-xs text-gray-500 sm:hidden">
                              {user.user_metadata?.name && (
                                <div className="truncate">{user.user_metadata.name}</div>
                              )}
                              <div className="flex items-center gap-1 mt-1">
                                {getConfirmationBadge(user)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="max-w-32 lg:max-w-none truncate">
                            {user.user_metadata?.name || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {getConfirmationBadge(user)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-center">
                            {user.waitlistData?.queuePosition || user.waitlistData?.position || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="text-center">
                            {user.referralStats?.totalReferrals || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {/* Mobile: Compact action buttons */}
                            <div className="sm:hidden flex items-center gap-1">
                              {user.waitlistData?.referralCode && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyReferralLink(user.waitlistData!.referralCode!, user.email)}
                                  title="Copy referral link"
                                  className="h-8 w-8 p-0"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSendVerificationEmail(user.email, user.id)}
                                disabled={sendingVerification === user.id}
                                title="Send verification email"
                                className="h-8 w-8 p-0"
                              >
                                {sendingVerification === user.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            
                            {/* Desktop: Action dropdown menu */}
                            <div className="hidden sm:flex items-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64">
                                  <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  
                                  <DropdownMenuItem 
                                    onClick={() => handleSendVerificationEmail(user.email, user.id)}
                                    disabled={sendingVerification === user.id}
                                  >
                                    {sendingVerification === user.id ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Send className="h-4 w-4 mr-2" />
                                    )}
                                    Send Verification Email
                                  </DropdownMenuItem>

                                  {user.email_confirmed_at && (
                                    <DropdownMenuItem 
                                      onClick={() => handleUnverifyUser(user.id, user.email)}
                                      disabled={unverifyingUser === user.id}
                                    >
                                      {unverifyingUser === user.id ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <MailX className="h-4 w-4 mr-2" />
                                      )}
                                      Unverify User (Testing)
                                    </DropdownMenuItem>
                                  )}

                                  {user.waitlistData?.referralCode && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleCopyReferralLink(user.waitlistData!.referralCode!, user.email)}>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy Referral Link
                                      </DropdownMenuItem>
                                      
                                      <DropdownMenuItem 
                                        onClick={() => handleTestReferralFlow(user.waitlistData!.referralCode!, user.email)}
                                        disabled={testingReferral === user.waitlistData!.referralCode}
                                      >
                                        {testingReferral === user.waitlistData!.referralCode ? (
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                          <TestTube className="h-4 w-4 mr-2" />
                                        )}
                                        Test +1 Referral
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  <DropdownMenuSeparator />
                                  
                                  <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit User
                                  </DropdownMenuItem>

                                  <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />
                                  
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteUserClick(user)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Selection Summary */}
          {selectedUserIds.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-800">
                <strong>{selectedUserIds.size}</strong> of <strong>{users.length}</strong> users selected
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSelectedUserIds(new Set())
                    setSelectAll(false)
                  }}
                  className="h-8"
                >
                  Clear Selection
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleSelectAll(true)}
                  className="h-8"
                >
                  Select All ({users.length})
                </Button>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-10"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-10"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Action Confirmation Dialog */}
      <AlertDialog open={showBatchConfirmDialog} onOpenChange={setShowBatchConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Batch Action</AlertDialogTitle>
            <AlertDialogDescription>
              {getBatchActionDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBatchAction('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchActionConfirm}
              className={batchAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
              disabled={batchActionLoading}
            >
              {batchActionLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Individual Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.email}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteConfirm(false)
              setUserToDelete(null)
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Dialog */}
      {editUser && (
        <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information. Leave password blank to keep current password.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="h-12"
                />
              </div>
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="h-12"
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="h-12"
                />
              </div>
              <div>
                <Label htmlFor="edit-password">New Password (optional)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Leave blank to keep current"
                  className="h-12"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditUser(null)} className="h-12">
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser} className="h-12">
                  Update User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}