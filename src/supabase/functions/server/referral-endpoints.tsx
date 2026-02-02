import { Hono } from 'npm:hono'
import * as kv from './kv_store.tsx'

const app = new Hono()

interface LeaderboardUser {
  name: string
  email?: string
  referralCode: string
  referrals: number
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
    const leaderboardUsers: LeaderboardUser[] = allUsers
      .map((user: any, index: number) => ({
        name: user.name || `User ${index + 1}`,
        email: user.email || '',
        referralCode: user.referralCode || `ref_${index + 1}`,
        referrals: user.referralCount || 0,
        rank: index + 1,
        position_change: user.position_change || 0,
        joinedDate: user.signupDate,
        lastReferralDate: user.lastReferralDate,
        isAnonymous: user.isAnonymous || false
      }))
      // Sort by referral count descending
      .sort((a: LeaderboardUser, b: LeaderboardUser) => b.referrals - a.referrals)
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
    console.log(`📊 Fetching referral stats for code: ${referralCode}`)

    // Find user by referral code
    const allUsers = await kv.getByPrefix('waitlist_user_')
    const user = allUsers.find((u: any) => u.referralCode === referralCode)

    if (!user) {
      return c.json({
        success: false,
        error: 'Referral code not found'
      }, 404)
    }

    // Get all users who used this referral code
    const referredUsers = allUsers.filter((u: any) => u.usedReferralCode === referralCode)

    return c.json({
      success: true,
      stats: {
        referralCode: user.referralCode,
        email: user.email,
        name: user.name,
        totalReferrals: user.referralCount || 0,
        referredUsers: referredUsers.map((u: any) => ({
          email: u.email,
          name: u.name,
          joinedDate: u.signupDate
        })),
        joinedDate: user.signupDate,
        rewardTier: getRewardTier(user.referralCount || 0)
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Referral stats endpoint error:', error.message)
    return c.json({
      success: false,
      error: 'Failed to fetch referral stats',
      message: error.message
    }, 500)
  }
})

// Helper function to determine reward tier
function getRewardTier(referralCount: number): string {
  if (referralCount >= 50) return 'Premium (20 Weeks)'
  if (referralCount >= 40) return 'Premium (16 Weeks)'
  if (referralCount >= 30) return 'Premium (12 Weeks)'
  if (referralCount >= 20) return 'Premium (8 Weeks)'
  if (referralCount >= 10) return 'Premium (4 Weeks)'
  if (referralCount >= 5) return 'Early Access'
  return 'Basic Access'
}

export { app as referralApp }
