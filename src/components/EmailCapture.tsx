"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { useReferral, ReferralUtils } from "../utils/useReferral";
import { retryOperation, handleSupabaseError } from "../utils/supabase/client";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { Users, Share2, Gift } from "lucide-react";

interface EmailCaptureProps {
  onSignupSuccess?: () => void;
  placeholder?: string;
  onOpenReferralPanel?: () => void;
}

interface UserReferralStats {
  referrals: number;
  pendingInvites: number;
  totalSent: number;
}

export function EmailCapture({ onSignupSuccess, placeholder = "Add your email", onOpenReferralPanel }: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [userStats, setUserStats] = useState<UserReferralStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const { referralCode, hasReferral, isActive } = useReferral();
  const { user } = useAuth();

  // Fetch user referral stats when user is logged in
  useEffect(() => {
    if (user?.email) {
      fetchUserReferralStats();
    }
  }, [user?.email]);

  const fetchUserReferralStats = async () => {
    if (!user?.email) return;
    
    setStatsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/user-referral-stats`,
        {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: user.email })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stats) {
          setUserStats({
            referrals: data.stats.referrals.count || 0,
            pendingInvites: 0, // We'll implement this later
            totalSent: data.stats.referrals.count || 0
          });
        }
      } else {
        // Fallback to empty stats if API fails
        setUserStats({
          referrals: 0,
          pendingInvites: 0,
          totalSent: 0
        });
      }
    } catch (error) {
      console.warn('Failed to fetch user referral stats:', error);
      // Fallback to empty stats
      setUserStats({
        referrals: 0,
        pendingInvites: 0,
        totalSent: 0
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleOpenReferralPanel = () => {
    if (onOpenReferralPanel) {
      onOpenReferralPanel();
    } else {
      // Fallback: navigate to profile page
      window.dispatchEvent(new CustomEvent('navigateToPage', { detail: 'profile' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    try {
      // Get the referral code from our hook or pending storage
      const activeReferralCode = referralCode || ReferralUtils.getPendingReferral();
      
      console.log('Submitting email with referral code:', activeReferralCode);
      
      const data = await retryOperation(async () => {
        console.log('📤 Sending email waitlist request...', { email, referralCode: activeReferralCode });
        
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/email-waitlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ 
            email,
            name: email.split('@')[0], // Use email prefix as name fallback
            referralCode: activeReferralCode 
          })
        });

        console.log('📥 Email waitlist response status:', response.status, response.statusText);

        if (!response.ok) {
          const responseText = await response.text();
          console.log('❌ Email waitlist error response:', responseText);
          
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch (parseError) {
            console.warn('Could not parse error response as JSON:', parseError);
            errorData = { error: `HTTP ${response.status}: ${response.statusText}`, details: responseText };
          }
          
          const error = new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
          error.status = response.status;
          error.details = errorData.details || responseText;
          error.errorType = errorData.errorType || 'HTTP_ERROR';
          
          console.error('❌ Enhanced error details:', {
            message: error.message,
            status: error.status,
            details: error.details,
            errorType: error.errorType,
            responseBody: responseText
          });
          
          throw error;
        }

        const responseText = await response.text();
        console.log('✅ Successful response:', responseText);
        
        try {
          return JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse successful response:', parseError);
          throw new Error('Invalid response format from server');
        }
      }, 2); // 2 retries for email capture

      // Store user data in localStorage
      localStorage.setItem('healthscan_user_email', email);
      localStorage.setItem('healthscan_referral_code', data.referralCode);
      localStorage.setItem('healthscan_signup_date', new Date().toISOString());
      localStorage.setItem('healthscan_user_position', data.position?.toString() || '0');
      
      // Clear the pending referral since it's been used
      if (activeReferralCode) {
        ReferralUtils.clearPendingReferral();
      }
      
      // Also store in a fallback format for offline mode
      const localUsers = JSON.parse(localStorage.getItem('healthscan_local_users') || '[]');
      const userData = {
        email,
        referralCode: data.referralCode,
        signupDate: new Date().toISOString(),
        referrals: 0,
        usedReferralCode: activeReferralCode,
        joinedDate: new Date().toISOString(),
        name: email.split('@')[0] // Use email prefix as name fallback
      };
      
      const existingIndex = localUsers.findIndex((u: any) => u.email === email);
      if (existingIndex >= 0) {
        localUsers[existingIndex] = userData;
      } else {
        localUsers.push(userData);
      }
      localStorage.setItem('healthscan_local_users', JSON.stringify(localUsers));
      
      // Trigger confetti celebration
      if (onSignupSuccess) {
        onSignupSuccess();
      }
      
      // Show success message without position numbers
      if (data.isUpdate) {
        toast.success(`👋 Welcome back! You're on the waitlist.`);
      } else {
        toast.success(`🎉 You're on the list! Welcome to HealthScan!`);
      }
      
      // Show referral success message if they were referred
      if (activeReferralCode && hasReferral && isActive) {
        toast.success(`✨ Thanks for using a referral link! Both you and your friend will get rewards.`);
      }
      
      setEmail("");
      
      // Trigger a custom event to update referral stats
      window.dispatchEvent(new CustomEvent('userSignedUp', { 
        detail: { 
          email, 
          referralCode: data.referralCode,
          usedReferralCode: activeReferralCode,
          position: data.position,
          totalWaitlist: data.totalWaitlist
        } 
      }));
      
      // Trigger a custom event to refresh referral status (hide banner)
      window.dispatchEvent(new CustomEvent('referralStatusChanged'));
      
    } catch (error) {
      console.log('🔍 Email capture error analysis:', {
        errorMessage: error?.message,
        errorStatus: error?.status,
        errorDetails: error?.details,
        errorType: error?.errorType,
        isUserAlreadyExists: (
          error?.message?.includes('User already registered') || 
          error?.message?.includes('already exists') ||
          error?.message?.includes('Welcome back')
        )
      });
      
      // Special handling for "User already registered" case - treat as success
      if (error?.message?.includes('User already registered') || 
          error?.message?.includes('already exists') ||
          error?.message?.includes('Welcome back')) {
        console.log('✅ User already exists - treating as successful signup');
        
        // Store user data in localStorage
        localStorage.setItem('healthscan_user_email', email);
        
        // Generate a fallback referral code if not provided in error response
        const fallbackReferralCode = `existing_${Date.now().toString().slice(-6)}`;
        localStorage.setItem('healthscan_referral_code', fallbackReferralCode);
        localStorage.setItem('healthscan_signup_date', new Date().toISOString());
        
        // Also store in fallback format
        const localUsers = JSON.parse(localStorage.getItem('healthscan_local_users') || '[]');
        const existingIndex = localUsers.findIndex((u: any) => u.email === email);
        const userData = {
          email,
          referralCode: fallbackReferralCode,
          signupDate: new Date().toISOString(),
          referrals: 0,
          usedReferralCode: referralCode || ReferralUtils.getPendingReferral(),
          joinedDate: new Date().toISOString(),
          name: email.split('@')[0],
          isExistingUser: true
        };
        
        if (existingIndex >= 0) {
          localUsers[existingIndex] = userData;
        } else {
          localUsers.push(userData);
        }
        localStorage.setItem('healthscan_local_users', JSON.stringify(localUsers));
        
        // Clear pending referral
        const activeReferralCode = referralCode || ReferralUtils.getPendingReferral();
        if (activeReferralCode) {
          ReferralUtils.clearPendingReferral();
        }
        
        // Trigger confetti celebration
        if (onSignupSuccess) {
          onSignupSuccess();
        }
        
        // Show success message for existing users
        toast.success(`👋 Welcome back! You're already on the waitlist.`);
        setEmail("");
        
        // Trigger events
        window.dispatchEvent(new CustomEvent('userSignedUp', { 
          detail: { 
            email, 
            referralCode: fallbackReferralCode,
            usedReferralCode: activeReferralCode,
            isUpdate: true,
            isExistingUser: true
          } 
        }));
        
        window.dispatchEvent(new CustomEvent('referralStatusChanged'));
        return; // Exit early for existing users
      }
      
      const enhancedError = handleSupabaseError(error, 'email capture');
      console.error("Email capture error - DETAILED DEBUG:", {
        originalError: error,
        enhancedError: enhancedError,
        errorMessage: enhancedError.message,
        errorStack: error?.stack,
        errorStatus: error?.status,
        errorDetails: error?.details,
        errorType: error?.errorType,
        requestEmail: email,
        timestamp: new Date().toISOString(),
        // Additional debugging info
        errorName: error?.name,
        errorCause: error?.cause,
        errorConstructor: error?.constructor?.name,
        errorKeys: error ? Object.keys(error) : [],
        stringified: JSON.stringify(error, Object.getOwnPropertyNames(error))
      });
      
      // Try to extract more specific error information
      let specificErrorMessage = enhancedError.message;
      
      // Check for server error details first
      if (error?.details) {
        console.log('🔍 Found error details:', error.details);
        if (typeof error.details === 'string' && error.details !== error.message) {
          specificErrorMessage = error.details;
        }
      }
      
      // Check for specific error types
      if (error?.errorType) {
        console.log('🔍 Found error type:', error.errorType);
        if (error.errorType === 'KV_STORE_ERROR') {
          specificErrorMessage = 'Database storage error. Please try again.';
        }
      }
      
      if (error?.message?.includes('HTTP')) {
        try {
          const httpMatch = error.message.match(/HTTP (\d+):/);
          if (httpMatch) {
            const statusCode = httpMatch[1];
            console.log(`🔍 HTTP ${statusCode} error detected for email capture`);
            
            if (statusCode === '400') {
              specificErrorMessage = 'Invalid request. Please check your email format.';
            } else if (statusCode === '500') {
              specificErrorMessage = 'Server error. Please try again in a moment.';
            } else if (statusCode === '404') {
              specificErrorMessage = 'Service unavailable. Please try again later.';
            }
          }
        } catch (parseError) {
          console.warn('Could not parse HTTP error details:', parseError);
        }
      }
      
      // Show the specific error message (but only for actual errors, not existing user cases)
      if (!error?.message?.includes('User already registered') && 
          !error?.message?.includes('already exists') &&
          !error?.message?.includes('Welcome back')) {
        
        // More specific error messages based on error type
        let userMessage = specificErrorMessage;
        if (error?.errorType === 'KV_STORE_ERROR') {
          userMessage = 'Database storage error. Please try again in a moment.';
        } else if (error?.status === 503) {
          userMessage = 'Server temporarily unavailable. Please try again later.';
        } else if (error?.status === 500) {
          userMessage = 'Server error. Please try again.';
        } else if (error?.message?.includes('timeout')) {
          userMessage = 'Request timed out. Please check your connection and try again.';
        }
        
        toast.error(`${userMessage}`);
        
        // Show debug info for troubleshooting
        setShowDebugInfo(true);
      } else {
        // Clear debug info for successful existing user cases
        setShowDebugInfo(false);
      }
      
      // For offline fallback, generate a simple referral code without hardcoded baseline
      const localUsers = JSON.parse(localStorage.getItem('healthscan_local_users') || '[]');
      const existingUser = localUsers.find((u: any) => u.email === email);
      
      if (existingUser) {
        // Update existing user in local storage instead of showing error
        const activeReferralCode = referralCode || ReferralUtils.getPendingReferral();
        
        if (activeReferralCode && activeReferralCode !== existingUser.usedReferralCode) {
          existingUser.usedReferralCode = activeReferralCode;
          existingUser.updatedDate = new Date().toISOString();
          
          const userIndex = localUsers.findIndex((u: any) => u.email === email);
          localUsers[userIndex] = existingUser;
          localStorage.setItem('healthscan_local_users', JSON.stringify(localUsers));
        }
        
        localStorage.setItem('healthscan_user_email', email);
        localStorage.setItem('healthscan_referral_code', existingUser.referralCode);
        
        // Clear pending referral
        if (activeReferralCode) {
          ReferralUtils.clearPendingReferral();
        }
        
        // Trigger confetti for returning users too
        if (onSignupSuccess) {
          onSignupSuccess();
        }
        
        toast.success(`👋 Welcome back! You're on the waitlist (Offline mode)`);
        setEmail("");
        
        window.dispatchEvent(new CustomEvent('userSignedUp', { 
          detail: { 
            email, 
            referralCode: existingUser.referralCode,
            usedReferralCode: activeReferralCode,
            isUpdate: true
          } 
        }));
        
        // Trigger a custom event to refresh referral status (hide banner)
        window.dispatchEvent(new CustomEvent('referralStatusChanged'));
      } else {
        const fallbackReferralCode = `local_${Date.now().toString().slice(-6)}`;
        const activeReferralCode = referralCode || ReferralUtils.getPendingReferral();
        
        const userData = {
          email,
          referralCode: fallbackReferralCode,
          signupDate: new Date().toISOString(),
          referrals: 0,
          usedReferralCode: activeReferralCode,
          joinedDate: new Date().toISOString(),
          name: email.split('@')[0]
        };
        
        localUsers.push(userData);
        localStorage.setItem('healthscan_local_users', JSON.stringify(localUsers));
        localStorage.setItem('healthscan_user_email', email);
        localStorage.setItem('healthscan_referral_code', fallbackReferralCode);
        
        // Clear pending referral
        if (activeReferralCode) {
          ReferralUtils.clearPendingReferral();
        }
        
        // Trigger confetti even in offline mode
        if (onSignupSuccess) {
          onSignupSuccess();
        }
        
        // Show success message without position numbers
        toast.success(`🎉 You're on the list! (Offline mode)`);
        setEmail("");
        
        window.dispatchEvent(new CustomEvent('userSignedUp', { 
          detail: { 
            email, 
            referralCode: fallbackReferralCode,
            usedReferralCode: activeReferralCode 
          } 
        }));
        
        // Trigger a custom event to refresh referral status (hide banner)
        window.dispatchEvent(new CustomEvent('referralStatusChanged'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If user is logged in, show referral section instead
  if (user?.email) {
    return (
      <div>
        <div className="w-full max-w-none">
          <motion.div 
            className="relative w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Animated gradient background */}
            <motion.div
              className="absolute inset-0 rounded-3xl bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 opacity-75"
              animate={{
                background: [
                  "linear-gradient(45deg, #10b981, #3b82f6, #8b5cf6)",
                  "linear-gradient(45deg, #3b82f6, #8b5cf6, #10b981)",
                  "linear-gradient(45deg, #8b5cf6, #10b981, #3b82f6)",
                  "linear-gradient(45deg, #10b981, #3b82f6, #8b5cf6)"
                ]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{ padding: "2px" }}
            />
            
            {/* Main referral container */}
            <div className="relative bg-white rounded-3xl m-[2px]">
              <div className="flex flex-col p-4">
                {/* Header */}
                <motion.div 
                  className="text-center mb-4"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <h3 className="font-['Poppins',_sans-serif] font-semibold text-[16px] text-gray-800 mb-2">
                    Refer Friends & Earn Rewards
                  </h3>
                  
                  {/* Stats display */}
                  {statsLoading ? (
                    <div className="flex justify-center items-center py-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full"
                      />
                    </div>
                  ) : userStats ? (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <Users className="w-4 h-4 text-green-600" />
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">{userStats.referrals}</p>
                          <p className="text-xs text-green-700">Friends Joined</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <Gift className="w-4 h-4 text-blue-600" />
                        <div className="text-center">
                          <p className="text-lg font-bold text-blue-600">{userStats.referrals * 2}</p>
                          <p className="text-xs text-blue-700">Rewards Earned</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </motion.div>
                
                {/* Refer Friends Button */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <Button 
                    onClick={handleOpenReferralPanel}
                    className="bg-black hover:bg-gray-800 h-[48px] relative rounded-[20px] w-full border-0 font-['Poppins',_sans-serif] font-semibold text-white text-[16px] px-[120px] py-3 flex items-center justify-center text-center transition-all duration-300 hover:shadow-lg gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Refer Friends
                  </Button>
                </motion.div>
                
                {/* Subtitle */}
                <p className="text-center text-xs text-gray-600 mt-2">
                  Share your link and earn rewards when friends join
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Default email capture for non-logged-in users
  return (
    <div>
      {hasReferral && isActive && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-sm text-green-800">
            🎉 You were invited by a friend! Join now to unlock rewards for both of you.
          </p>
        </div>
      )}
      
      <div className="w-full max-w-none">
        <motion.div 
          className="relative w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Animated gradient background */}
          <motion.div
            className="absolute inset-0 rounded-3xl bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 opacity-75"
            animate={{
              background: [
                "linear-gradient(45deg, #10b981, #3b82f6, #8b5cf6)",
                "linear-gradient(45deg, #3b82f6, #8b5cf6, #10b981)",
                "linear-gradient(45deg, #8b5cf6, #10b981, #3b82f6)",
                "linear-gradient(45deg, #10b981, #3b82f6, #8b5cf6)"
              ]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ padding: "2px" }}
          />
          
          {/* Main form container */}
          <div className="relative bg-white rounded-3xl m-[2px]">
            <form onSubmit={handleSubmit} className="flex flex-col p-1">
              <motion.div 
                className="bg-white h-[48px] relative rounded-t-[20px] w-full transition-all duration-300"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div className="flex flex-row items-center justify-center relative size-full">
                  <div className="box-border content-stretch flex flex-row gap-2 h-[44px] items-center justify-center px-[22px] py-[8px] relative w-full">
                    <Input
                      type="email"
                      placeholder={placeholder}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      required
                      className="border-0 bg-transparent p-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-transparent outline-none font-['Poppins',_sans-serif] font-semibold text-[14px] text-[#797a89] placeholder:text-[#797a89] placeholder:text-center w-full text-center transition-all duration-300 leading-[1.1]"
                    />
                  </div>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-black hover:bg-gray-800 h-[48px] relative rounded-b-[20px] rounded-t-[6px] w-full border-0 font-['Poppins',_sans-serif] font-semibold text-white text-[16px] px-[120px] py-3 flex items-center justify-center text-center transition-all duration-300 hover:shadow-lg"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                  ) : null}
                  {isLoading ? "Joining..." : "Join Waitlist"}
                </Button>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </div>
      
      {/* Debug Information (only show after errors) */}
      {showDebugInfo && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-700">Debug Information</span>
            <button 
              onClick={() => setShowDebugInfo(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <div className="space-y-1 text-gray-600">
            <p>Email: {email}</p>
            <p>Project: {projectId}</p>
            <p>Endpoint: https://{projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/email-waitlist</p>
            <div className="mt-2 pt-2 border-t border-gray-300">
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('navigateToPage', { detail: 'email-debug' }))}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Open Email Capture Debugger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}