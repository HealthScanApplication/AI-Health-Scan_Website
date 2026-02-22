// @ts-nocheck
// NOTE: Local reference copy only — deployed file is supabase/functions/make-server-ed0fe4c2/index.tsx
import { Hono } from 'npm:hono'
import * as kv from './kv_store.tsx'

const app = new Hono()

interface LeaderboardUser {
  name: string
  email?: string
  referral_code: string
  referral_count: number
  rank: number
  position_change?: number
  joinedDate?: string
  lastReferralDate?: string
  isAnonymous?: boolean
}

// Get referral leaderboard
app.get('/referral-leaderboard', async (c) => {
  try {
    console.log('🏆 Fetching referral leaderboard...')

    // Get all waitlist users from KV store
    const allUsers = await kv.getByPrefix('waitlist_user_')
    
    if (!allUsers || allUsers.length === 0) {
      console.log('📊 No waitlist users found')
      return c.json({
        success: true,
        leaderboard: [],
        message: 'No referral activity yet',
        databaseAvailable: true
      })
    }

    // Transform users into leaderboard format
    // Note: backend stores referral count in both 'referrals' and 'referralCount' fields
    const leaderboardUsers: LeaderboardUser[] = allUsers
      .map((user: any, index: number) => ({
        name: user.name || `User ${index + 1}`,
        email: user.email || '',
        referral_code: user.referralCode || `ref_${index + 1}`,
        referral_count: user.referrals || user.referralCount || 0,
        rank: index + 1,
        position_change: user.position_change || 0,
        joinedDate: user.signupDate,
        lastReferralDate: user.lastReferralDate,
        isAnonymous: user.isAnonymous || false
      }))
      // Filter out users with 0 referrals
      .filter((user: LeaderboardUser) => user.referral_count > 0)
      // Sort by referral count descending
      .sort((a: LeaderboardUser, b: LeaderboardUser) => b.referral_count - a.referral_count)
      // Add ranks after sorting
      .map((user: LeaderboardUser, index: number) => ({
        ...user,
        rank: index + 1
      }))

    console.log(`✅ Leaderboard loaded: ${leaderboardUsers.length} users`)

    return c.json({
      success: true,
      leaderboard: leaderboardUsers,
      databaseAvailable: true,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Leaderboard endpoint error:', error.message)
    return c.json({
      success: false,
      error: 'Failed to fetch leaderboard',
      message: error.message,
      leaderboard: [],
      databaseAvailable: false
    }, 500)
  }
})

// Get referral stats for a specific user
app.get('/referral-stats/:referralCode', async (c) => {
  try {
    const referralCode = c.req.param('referralCode')
    
    if (!referralCode || typeof referralCode !== 'string') {
      return c.json({
        success: false,
        error: 'Invalid referral code provided'
      }, 400)
    }
    
    console.log(`📊 Fetching referral stats for code: ${referralCode}`)

    // Find user by referral code
    const allUsers = await kv.getByPrefix('waitlist_user_')
    
    if (!allUsers || !Array.isArray(allUsers)) {
      return c.json({
        success: false,
        error: 'Unable to fetch user data'
      }, 500)
    }
    
    const user = allUsers.find((u: any) => u?.referralCode === referralCode)

    if (!user) {
      return c.json({
        success: false,
        error: 'Referral code not found'
      }, 404)
    }

    // Get all users who used this referral code
    const referredUsers = allUsers.filter((u: any) => u?.usedReferralCode === referralCode) || []

    return c.json({
      success: true,
      stats: {
        referralCode: user.referralCode || referralCode,
        email: user.email || '',
        name: user.name || 'Anonymous',
        totalReferrals: user.referrals || user.referralCount || 0,
        referredUsers: referredUsers.map((u: any) => ({
          email: u?.email || '',
          name: u?.name || 'Anonymous',
          joinedDate: u?.signupDate || new Date().toISOString()
        })),
        joinedDate: user.signupDate || new Date().toISOString(),
        rewardTier: getRewardTier(user.referralCount ?? 0)
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Referral stats endpoint error:', error?.message || 'Unknown error')
    return c.json({
      success: false,
      error: 'Failed to fetch referral stats',
      message: error?.message || 'An unexpected error occurred'
    }, 500)
  }
})

// Helper function to determine reward tier (matches REFERRAL_MILESTONES in waitlist-endpoints)
function getRewardTier(referralCount: number): string {
  if (referralCount >= 25) return 'Founding Member'
  if (referralCount >= 10) return 'Champion'
  if (referralCount >= 5) return 'Grower'
  if (referralCount >= 3) return 'Sprout'
  if (referralCount >= 1) return 'Seed'
  return 'No referrals yet'
}

export { app as referralApp }
