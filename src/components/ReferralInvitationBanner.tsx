"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift, User } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ReferralInvitationBannerProps {
  hasReferral: boolean;
  isActive: boolean;
  referralCode: string | null;
}

interface ReferrerInfo {
  email: string;
  name?: string;
}

export function ReferralInvitationBanner({ hasReferral, isActive, referralCode }: ReferralInvitationBannerProps) {
  const [referrerInfo, setReferrerInfo] = useState<ReferrerInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch referrer information when referral code is available
  useEffect(() => {
    if (hasReferral && isActive && referralCode) {
      fetchReferrerInfo(referralCode);
    } else {
      setIsVisible(false);
      setReferrerInfo(null);
    }
  }, [hasReferral, isActive, referralCode]);

  const fetchReferrerInfo = async (code: string) => {
    setIsLoading(true);
    
    // Early validation: Check if the referral code looks valid
    const isValidReferralCode = (referralCode: string): boolean => {
      if (!referralCode || typeof referralCode !== 'string') return false;
      
      // Check length constraints
      if (referralCode.length < 6 || referralCode.length > 20) return false;
      
      // Check for invalid patterns
      const invalidPatterns = [
        /\.html$/i,
        /\.php$/i,
        /\.asp$/i,
        /\.jsp$/i,
        /^preview_/i,
        /^test_/i,
        /^demo_/i,
        /^example_/i,
        /^sample_/i
      ];
      
      if (invalidPatterns.some(pattern => pattern.test(referralCode))) return false;
      
      // Check for alphanumeric only
      if (!/^[A-Z0-9]+$/i.test(referralCode)) return false;
      
      return true;
    };
    
    // Validate the referral code before processing
    if (!isValidReferralCode(code)) {
      console.log('❌ Invalid referral code format:', code);
      setReferrerInfo({
        email: 'a friend',
        name: 'friend'
      });
      setIsVisible(true);
      setIsLoading(false);
      return;
    }
    
    // For now, since the referrer API endpoint may not be implemented,
    // we'll skip the actual fetch and use generic referrer info
    // This prevents "Failed to fetch" errors while maintaining functionality
    try {
      console.log('🔍 Processing valid referral code:', code);
      
      // First, let's test if the server is accessible with a quick check
      const testServerHealth = async () => {
        try {
          const healthResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/health`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`
              },
              signal: AbortSignal.timeout(2000) // Reduced timeout to 2 seconds
            }
          );
          console.log('🏥 Server health check:', healthResponse.status);
          return healthResponse.ok;
        } catch (error) {
          console.log('⚠️ Server health check failed (expected during development):', error.message);
          return false;
        }
      };
      
      const isServerHealthy = await testServerHealth();
      console.log('🔧 Server accessibility:', isServerHealthy ? 'accessible' : 'not accessible');
      
      // Check if we have environment configuration for referrer API
      const hasReferrerAPI = isServerHealthy; // Only try API if server is accessible
      
      if (hasReferrerAPI) {
        // Actual API call when implemented
        let response = null;
        try {
          console.log('🌐 Making API request for referral code:', code);
          console.log('🔗 API URL:', `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/get-referrer-info`);
          
          response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/get-referrer-info`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`
              },
              body: JSON.stringify({ referralCode: code }),
              // Add timeout to prevent hanging requests
              signal: AbortSignal.timeout(3000) // Reduced to 3 seconds
            }
          );

          console.log('📡 API Response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Referrer info response:', data);
            
            if (data.success && data.referrer) {
              setReferrerInfo({
                email: data.referrer.email,
                name: data.referrer.name || data.referrer.email.split('@')[0]
              });
              setIsVisible(true);
              return;
            }
          } else {
            // Try to get error details from response
            const errorData = await response.json().catch(() => null);
            console.warn('⚠️ Failed to fetch referrer info:', response.status, errorData);
            
            // If it's a 404, the referrer doesn't exist yet - show generic message
            if (response.status === 404) {
              console.log('💡 Referrer not found (404) - likely the referrer hasn\'t joined the waitlist yet');
            }
          }
        } catch (fetchError) {
          console.warn('⚠️ Network error fetching referrer info:', fetchError);
          response = null; // Ensure response is null on error
        }
        
        // Default fallback behavior - show generic referrer info
        console.log('💡 Using generic referrer info for referral code:', code);
        
        // Check if we got specific error information
        if (response && response.status === 404) {
          // Show a more specific message for 404 errors
          setReferrerInfo({
            email: 'someone special',
            name: 'someone special'
          });
        } else {
          // Generic fallback
          setReferrerInfo({
            email: 'a friend',
            name: 'friend'
          });
        }
        setIsVisible(true);
      } else {
        // API not available, use generic fallback
        console.log('💡 Server not accessible, using generic referrer info for referral code:', code);
        setReferrerInfo({
          email: 'a friend',
          name: 'friend'
        });
        setIsVisible(true);
      }
      
    } catch (error) {
      // Handle different types of errors gracefully
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          console.log('⏱️ API request timed out (expected during development), using fallback display');
        } else if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
          console.log('💡 Network issue accessing referrer API (expected during development), using fallback display');
        } else if (error.message.includes('Failed to fetch')) {
          console.log('🌐 Server not accessible (expected during development), using fallback display');
        } else {
          console.log('⚠️ API error (using fallback):', error.message);
        }
      } else {
        console.log('⚠️ Unknown API error (using fallback):', error);
      }
      
      // Always show generic message to ensure banner functionality
      setReferrerInfo({
        email: 'a friend',
        name: 'friend'
      });
      setIsVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent banner click when dismissing
    setIsVisible(false);
    // Mark banner as dismissed for this session
    sessionStorage.setItem('healthscan_referral_banner_dismissed', 'true');
    
    // Show confirmation feedback
    console.log('💚 Referral invitation banner dismissed');
  };

  // Check if banner was already dismissed this session
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('healthscan_referral_banner_dismissed');
    if (wasDismissed) {
      setIsVisible(false);
    }
  }, []);

  const formatReferrerDisplay = (info: ReferrerInfo) => {
    if (info.email === 'a friend') {
      return info.name;
    }
    
    // Always show the full email for transparency and clickability
    return info.email;
  };

  const handleBannerClick = () => {
    // First try to find the specific hero email input
    const heroEmailInput = document.getElementById('hero-email-input') as HTMLInputElement;
    
    if (heroEmailInput) {
      // Scroll to the email input directly
      heroEmailInput.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
      
      // Focus and select the email input after scroll completes
      setTimeout(() => {
        heroEmailInput.focus();
        heroEmailInput.select(); // Select any existing text for easy replacement
      }, 800);
    } else {
      // Fallback: scroll to hero section and find any email input
      const heroSection = document.getElementById('hero-section');
      if (heroSection) {
        heroSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
        
        setTimeout(() => {
          const emailInput = heroSection.querySelector('input[type="email"]') as HTMLInputElement;
          if (emailInput) {
            emailInput.focus();
            emailInput.select();
          }
        }, 800);
      }
    }
  };

  if (!hasReferral || !isActive || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -100, scale: 0.9 }}
          transition={{ 
            type: "spring", 
            stiffness: 100, 
            damping: 15,
            duration: 0.5
          }}
          className="fixed bottom-6 left-6 z-50 max-w-sm"
        >
          <div className="relative">
            {/* Subtle animated background gradient */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-400/20 via-emerald-400/20 to-teal-400/20 animate-gradient-shift"></div>
            
            {/* Main banner content */}
            <div 
              className="relative bg-white/95 backdrop-blur-md border border-green-200/60 rounded-2xl shadow-lg p-4 pr-12 cursor-pointer hover:bg-white/100 hover:border-green-300/80 transition-all duration-200 hover:scale-[1.02]"
              onClick={handleBannerClick}
            >
              {/* Enhanced Close button - More prominent and accessible */}
              <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white border border-gray-200 hover:border-red-300 text-gray-400 hover:text-red-500 transition-all duration-200 group z-10 shadow-sm hover:shadow-md"
                aria-label="Dismiss referral banner"
                title="Close this invitation"
              >
                <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
              
              {/* Content */}
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <Gift className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                {/* Text content */}
                <div className="flex-1 min-w-0 pr-2">
                  {isLoading ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    </div>
                  ) : referrerInfo ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900 leading-tight">
                        Invited by {formatReferrerDisplay(referrerInfo)}
                      </p>
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        Click to join now! 🎁
                      </p>
                      {/* Show friend's email in lower left corner */}
                      {referrerInfo.email !== 'a friend' && (
                        <p className="text-xs text-gray-500 mt-1 font-normal">
                          From: {referrerInfo.email}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-gray-900 leading-tight">
                        Invited by a friend
                      </p>
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        Click to join now! 🎁
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Subtle accent line */}
              <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-green-300/60 to-transparent"></div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}