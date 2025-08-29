import React, { useEffect, useState } from 'react'
import { HeroSection } from './HeroSection'
import { ProfilePage } from './ProfilePage'
import { SettingsPage } from './SettingsPage'
import { AdminDashboard } from './AdminDashboard'
import { NetworkDiagnostic } from './NetworkDiagnostic'
import { LoginDiagnostic } from './LoginDiagnostic'
import { Blog } from './Blog'
import { ReferralTestPage } from './ReferralTestPage'
import { ConvertKitTestPage } from './ConvertKitTestPage'
import { EmailCaptureDebugger } from './EmailCaptureDebugger'
import { EmailCaptureTestPage } from './EmailCaptureTestPage'
import { AppFeaturesSection } from './AppFeaturesSection'
import { HowItWorksSection } from './HowItWorksSection'
import { FeatureShowcase } from './FeatureShowcase'
import { LaunchVideoSection } from './LaunchVideoSection'

import { SocialProofSection } from './SocialProofSection'
import { FAQSection } from './FAQSection'
import { EmailSubscribeSection } from './EmailSubscribeSection'
import { BlogPreviewSection } from './BlogPreviewSection'

import { DiscordCommunitySection } from './DiscordCommunitySection'
import { isAdminUser } from '../utils/adminUtils'
import { useAdminAuth, getAccessTokenDirect } from '../contexts/AuthContext'

interface PageRendererProps {
  currentPage: string
  setCurrentPage: (page: string) => void
  navigateToHome: () => void
  navigateToPage: (page: string) => void
  isAdmin: boolean
  user: any
  authLoading: boolean
  hasReferral: boolean
  isActive: boolean
  referralCode: string | null
}

export function PageRenderer({
  currentPage,
  setCurrentPage,
  navigateToHome,
  navigateToPage,
  isAdmin,
  user,
  authLoading,
  hasReferral,
  isActive,
  referralCode
}: PageRendererProps) {
  
  // Get admin auth info including access token
  const { accessToken, isAdminAuthenticated, refreshSession } = useAdminAuth()
  const [fallbackToken, setFallbackToken] = useState<string | null>(null)
  
  // Handle admin page access
  useEffect(() => {
    if (currentPage === 'admin' && !authLoading) {
      // Double-check admin status using the utility function
      const userIsAdmin = isAdminUser(user)
      
      if (!userIsAdmin) {
        console.warn('🚫 Non-admin user attempted to access admin page, redirecting to home')
        setCurrentPage('home')
        return
      }
      
      console.log('✅ Admin access granted for:', user?.email)
      console.log('🔑 Access token available:', !!accessToken)
      
      // If no access token, try to refresh session and get direct token
      if (!accessToken) {
        console.log('🔄 No access token found, attempting to refresh session...')
        refreshSession()
        
        // Also try to get token directly as fallback
        getAccessTokenDirect().then(token => {
          if (token) {
            console.log('🔑 Got fallback access token directly from Supabase')
            setFallbackToken(token)
          }
        })
      }
    }
  }, [currentPage, user, authLoading, isAdmin, setCurrentPage, accessToken, refreshSession])

  // Don't render admin page for non-admin users
  if (currentPage === 'admin' && (!user || !isAdminUser(user))) {
    return (
      <>
        {/* Hero Section */}
        <HeroSection 
          hasReferral={hasReferral}
          isActive={isActive}
          referralCode={referralCode}
        />
        
        {/* App Features Section */}
        <AppFeaturesSection />
        
        {/* How It Works Section */}
        <HowItWorksSection />
        
        {/* Feature Showcase */}
        <FeatureShowcase />
        
        {/* Launch Video Section */}
        <LaunchVideoSection />
        
        {/* Social Proof Section */}
        <SocialProofSection />
        
        {/* FAQ Section */}
        <FAQSection />
        
        {/* Email Subscribe Section */}
        <EmailSubscribeSection />
        
        {/* Blog Preview Section */}
        <BlogPreviewSection />
        
        {/* Discord Community Section */}
        <DiscordCommunitySection />
      </>
    )
  }

  switch (currentPage) {
    case 'profile':
      return (
        <ProfilePage 
          user={user}
          onNavigateToSettings={() => navigateToPage('settings')}
        />
      )

    case 'settings':
      return (
        <SettingsPage 
          onNavigateBack={navigateToHome}
        />
      )

    case 'admin':
      // Additional security check
      if (!user || !isAdminUser(user)) {
        console.warn('🚫 Unauthorized admin access attempt')
        return (
          <>
            {/* Hero Section */}
            <HeroSection 
              hasReferral={hasReferral}
              isActive={isActive}
              referralCode={referralCode}
            />
            
            {/* App Features Section */}
            <AppFeaturesSection />
            
            {/* How It Works Section */}
            <HowItWorksSection />
            
            {/* Feature Showcase */}
            <FeatureShowcase />
            
            {/* Launch Video Section */}
            <LaunchVideoSection />
            
            {/* Social Proof Section */}
            <SocialProofSection />
            
            {/* FAQ Section */}
            <FAQSection />
            
            {/* Email Subscribe Section */}
            <EmailSubscribeSection />
            
            {/* Blog Preview Section */}
            <BlogPreviewSection />
            
            {/* Discord Community Section */}
            <DiscordCommunitySection />
          </>
        )
      }

      // Use the access token from context or fallback
      const finalAccessToken = accessToken || fallbackToken
      
      if (!finalAccessToken) {
        console.error('❌ No access token available for admin dashboard')
        console.log('🔍 Admin authenticated status:', isAdminAuthenticated)
        console.log('🔍 Context access token:', !!accessToken)
        console.log('🔍 Fallback access token:', !!fallbackToken)
        console.log('🔍 User object keys:', Object.keys(user || {}))
        
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="text-center max-w-md w-full">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Token Missing</h2>
              <p className="text-gray-600 mb-4">Unable to load admin dashboard without valid access token. Please refresh to re-authenticate.</p>
              <div className="space-y-2">
                <button 
                  onClick={refreshSession}
                  className="w-full h-12 btn-standard bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Refresh Session
                </button>
                <button 
                  onClick={navigateToHome}
                  className="w-full h-12 btn-major bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        )
      }

      return (
        <div className="min-h-screen bg-gray-50">
          {/* Mobile-optimized container with better padding */}
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 lg:py-8">
            <AdminDashboard 
              user={user}
              accessToken={finalAccessToken}
            />
          </div>
        </div>
      )

    case 'diagnostic':
      return <NetworkDiagnostic />
      
    case 'login-diagnostic':
      return <LoginDiagnostic />

    case 'blog':
      return <Blog onNavigateBack={navigateToHome} />

    case 'referral-test':
      return <ReferralTestPage />

    case 'convertkit-test':
      // Admin-only page for testing ConvertKit integration
      if (!user || !isAdminUser(user)) {
        console.warn('🚫 Non-admin user attempted to access ConvertKit test page')
        navigateToHome()
        return null
      }
      return (
        <ConvertKitTestPage 
          onNavigateBack={navigateToHome}
          onNavigateToAdmin={() => navigateToPage('admin')}
        />
      )

    case 'email-debug':
      // Admin-only page for debugging email capture
      if (!user || !isAdminUser(user)) {
        console.warn('🚫 Non-admin user attempted to access email debug page')
        navigateToHome()
        return null
      }
      return <EmailCaptureDebugger />

    case 'email-test':
      // Admin-only page for testing email capture
      if (!user || !isAdminUser(user)) {
        console.warn('🚫 Non-admin user attempted to access email test page')
        navigateToHome()
        return null
      }
      return <EmailCaptureTestPage />

    case 'home':
    default:
      return (
        <>
          {/* Hero Section */}
          <HeroSection 
            hasReferral={hasReferral}
            isActive={isActive}
            referralCode={referralCode}
          />
          
          {/* App Features Section */}
          <AppFeaturesSection />
          
          {/* How It Works Section */}
          <HowItWorksSection />
          
          {/* Feature Showcase */}
          <FeatureShowcase />
          
          {/* Launch Video Section */}
          <LaunchVideoSection />
          
          {/* Social Proof Section */}
          <SocialProofSection />
          
          {/* FAQ Section */}
          <FAQSection />
          
          {/* Email Subscribe Section */}
          <EmailSubscribeSection />
          
          {/* Blog Preview Section */}
          <BlogPreviewSection />
          
          {/* Discord Community Section */}
          <DiscordCommunitySection />
        </>
      )
  }
}