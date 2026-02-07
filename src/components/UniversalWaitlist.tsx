"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { useReferral, ReferralUtils } from "../utils/useReferral";
import { retryOperation, handleSupabaseError } from "../utils/supabase/client";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { Users, Share2, Gift, Lock, Eye, EyeOff, TrendingUp, UserCheck } from "lucide-react";

import { PasswordUpgradeModal } from "./auth/PasswordUpgradeModal";
import { ConfettiCelebration } from "./ConfettiCelebration";


interface UniversalWaitlistProps {
  onSignupSuccess?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}



interface QueuePositionInfo {
  position: number;
  totalUsers: number;
  lastUpdated: string;
}

export function UniversalWaitlist({ 
  onSignupSuccess, 
  placeholder = "Add your email",
  className = "",
  autoFocus = false
}: UniversalWaitlistProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState<string | null>(null);
  const [queueInfo, setQueueInfo] = useState<QueuePositionInfo | null>(null);

  const [showPasswordUpgrade, setShowPasswordUpgrade] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPosition, setSignupPosition] = useState<number | null>(null);
  const [emailExistsInAuth, setEmailExistsInAuth] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const confettiStateRef = useRef<{ isActive: boolean; startTime: number }>({ isActive: false, startTime: 0 });

  
  // NEW: Track if we're in the middle of a signup flow to prevent premature modal closing
  const [isInSignupFlow, setIsInSignupFlow] = useState(false);
  
  const { referralCode, hasReferral, isActive } = useReferral();
  const { user, signIn, signUp } = useAuth();

  const emailInputRef = useRef<HTMLInputElement>(null);

  // Debug logging for user changes
  useEffect(() => {
    console.log('🔄 UniversalWaitlist: User changed:', user?.email || 'null', 'isInSignupFlow:', isInSignupFlow);
  }, [user, isInSignupFlow]);

  // Auto-scroll and focus email input when arriving via referral link
  useEffect(() => {
    if (hasReferral && isActive && referralCode && emailInputRef.current) {
      console.log('🎯 Referral detected! Auto-scrolling to email input. Code:', referralCode);
      // Small delay to let the page render
      setTimeout(() => {
        emailInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          emailInputRef.current?.focus();
        }, 500);
      }, 300);
    }
  }, [hasReferral, isActive, referralCode]);

  // Fetch queue position when user is logged in
  useEffect(() => {
    if (user?.email) {
      fetchQueuePosition();
    }
  }, [user?.email]);

  const fetchQueuePosition = async () => {
    if (!user?.email) return;
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/user-queue-position`,
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
        if (data.success && data.position) {
          setQueueInfo({
            position: data.position,
            totalUsers: data.totalUsers || 0,
            lastUpdated: new Date().toISOString()
          });
          setWaitlistPosition(data.position.toString());
          
          // Don't store user position
          localStorage.setItem('healthscan_user_position', '0');
        }
      }
    } catch (error) {
      console.log('Queue position fetch failed (expected during development):', error);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    try {
      // Get the referral code from our hook or pending storage
      const activeReferralCode = referralCode || ReferralUtils.getPendingReferral();
      
      console.log('🔗 Referral debug:', {
        hookReferralCode: referralCode,
        pendingReferral: ReferralUtils.getPendingReferral(),
        activeReferralCode,
        hasReferral,
        isActive,
        localStorage_pending: localStorage.getItem('healthscan_pending_referral'),
        localStorage_timestamp: localStorage.getItem('healthscan_referral_timestamp'),
      });
      
      const data = await retryOperation(async () => {
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

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      }, 2); // 2 retries for email capture

      // Store user data in localStorage
      localStorage.setItem('healthscan_user_email', email);
      localStorage.setItem('healthscan_referral_code', data.referralCode);
      localStorage.setItem('healthscan_signup_date', new Date().toISOString());
      localStorage.setItem('healthscan_user_position', '0'); // Don't store position
      
      // Update local state
      if (data.position && data.position !== 'Unknown') {
        setWaitlistPosition(data.position?.toString());
        setSignupPosition(data.position);
        
        // Update queue info
        setQueueInfo({
          position: data.position,
          totalUsers: data.totalWaitlist || 0,
          lastUpdated: new Date().toISOString()
        });
      }
      
      // Clear the pending referral since it's been used
      if (activeReferralCode) {
        ReferralUtils.clearPendingReferral();
      }
      
      // Trigger confetti celebration - ONLY ONE plant green confetti with auto-hide
      const startTime = Date.now();
      confettiStateRef.current = { isActive: true, startTime };
      setShowConfetti(true);
      // Clear any existing timeout
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
      }
      // Set new timeout with cleanup tracking
      confettiTimeoutRef.current = setTimeout(() => {
        console.log('🎉 Confetti auto-hide timeout triggered');
        setShowConfetti(false);
        confettiStateRef.current = { isActive: false, startTime: 0 };
        confettiTimeoutRef.current = null;
      }, 4000); // Auto-hide after 4 seconds
      
      if (onSignupSuccess) {
        onSignupSuccess();
      }

      // Enhanced success messages for existing users with email confirmation status
      if (data.isUpdate || data.alreadyExists || data.isDuplicate) {
        const posMsg = data.position ? ` You're #${data.position} on the waitlist.` : ` You're on the waitlist.`;
        const emailMsg = data.emailResent ? ' Confirmation email resent.' : '';
        toast.success(`Welcome back!${posMsg}${emailMsg}`);
        setEmail("");
        
        // Trigger events for existing users with enhanced data
        window.dispatchEvent(new CustomEvent('userSignedUp', { 
          detail: { 
            email, 
            referralCode: data.referralCode,
            usedReferralCode: activeReferralCode,
            position: data.position,
            totalWaitlist: data.totalWaitlist,
            isUpdate: true,
            isDuplicate: data.isDuplicate || false,
            needsConfirmation: data.needsConfirmation || false,
            emailConfirmed: data.emailConfirmed || false
          } 
        }));
        
        window.dispatchEvent(new CustomEvent('referralStatusChanged'));
        return; // Exit early for existing users - don't show password upgrade modal
        
      } else if (data.emailExists) {
        // Email exists in Supabase Auth, show login form
        setSignupEmail(email);
        setSignupPosition(data.position || null);
        setEmailExistsInAuth(true); // Track that email exists in Auth
        setShowLoginForm(true);
        toast.info(`This email already has an account. Please sign in with your password.`);
      } else {
        // Enhanced success messages for new signups
        toast.success(`You're on the list! Welcome to HealthScan.`);
        
        // Show password upgrade modal for new signups
        console.log('🔐 UniversalWaitlist: Starting signup flow - Showing PasswordUpgradeModal for new signup');
        setIsInSignupFlow(true); // CRITICAL: Mark that we're starting the signup flow
        setSignupEmail(email);
        setSignupPosition(data.position || null);
        setEmailExistsInAuth(false); // Email doesn't exist in Auth
        setShowPasswordUpgrade(true);
      }
      
      // Show referral success message without position info  
      if (activeReferralCode && hasReferral && isActive) {
        toast.success(`Thanks for using a referral link! Both you and your friend will get rewards.`);
      }
      
      // Only clear email and trigger events for new users (not existing users)
      if (!data.isUpdate && !data.alreadyExists) {
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
      }
      
    } catch (error) {
      const enhancedError = handleSupabaseError(error, 'email capture');
      toast.error(`Email capture failed: ${enhancedError.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPassword || !signupEmail) return;

    setLoginLoading(true);
    try {
      const result = await signIn(signupEmail, loginPassword);
      
      if (result?.error) {
        if (result.error.message.includes('Invalid login credentials')) {
          toast.error("Incorrect password. Please try again or reset your password.");
        } else {
          toast.error(`Sign in failed: ${result.error.message}`);
        }
        return;
      }

      // Success - the user object will be updated through the auth context
      toast.success("Welcome back! Successfully signed in. 🌱");
      
      // Close the login form
      setShowLoginForm(false);
      setLoginPassword("");
      setEmailExistsInAuth(false);
      
      // Clear email input
      setEmail("");
      
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(`Sign in failed: ${error.message}`);
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle password upgrade completion
  const handlePasswordUpgradeComplete = (success: boolean) => {
    console.log('🔐 UniversalWaitlist: Password upgrade completed, success:', success);
    
    if (success) {
      toast.success("Account created successfully! Welcome to HealthScan! 🌱✅");
    }
    
    // Always close the modal and reset flow state
    setShowPasswordUpgrade(false);
    setIsInSignupFlow(false); // CRITICAL: Clear signup flow state
    setSignupEmail("");
    setSignupPosition(null);
    setEmailExistsInAuth(false);
    
    // Clear email input on successful signup
    if (success) {
      setEmail("");
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main waitlist form */}
      <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
        <div className="flex gap-3 w-full">
          <Input
            ref={emailInputRef}
            type="email"
            placeholder={hasReferral && isActive ? "Enter your email to claim referral" : placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`flex-1 h-12 px-4 bg-[var(--input-background)] border-2 rounded-xl text-gray-900 placeholder:text-gray-500 focus:border-[var(--healthscan-green)] focus:outline-none focus:ring-0 transition-colors ${
              hasReferral && isActive ? 'border-[var(--healthscan-green)] ring-2 ring-[var(--healthscan-green)]/30' : 'border-gray-200'
            } ${isShaking ? 'animate-button-shake' : ''}`}
            disabled={isLoading}
            required
          />
          <Button
            type="submit"
            disabled={isLoading || !email}
            className={`h-12 px-6 bg-[var(--healthscan-green)] hover:bg-[var(--healthscan-light-green)] text-white font-medium rounded-xl transition-all duration-200 whitespace-nowrap ${
              isShaking ? 'animate-button-shake' : ''
            }`}
          >
            {isLoading ? 'Joining...' : 'Join Waitlist'}
          </Button>
        </div>
      </form>



      {/* Login form modal */}
      {showLoginForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4 text-center">Sign In to Your Account</h2>
            <p className="text-gray-600 mb-4 text-center">
              This email already has an account. Please enter your password to continue.
            </p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="loginEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  id="loginEmail"
                  type="email"
                  value={signupEmail}
                  disabled
                  className="w-full h-12 bg-gray-100 text-gray-600"
                />
              </div>
              
              <div>
                <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="loginPassword"
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-12 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowLoginForm(false);
                    setLoginPassword("");
                    setEmailExistsInAuth(false);
                  }}
                  className="flex-1 h-12"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loginLoading || !loginPassword}
                  className="flex-1 h-12 bg-[var(--healthscan-green)] hover:bg-[var(--healthscan-light-green)]"
                >
                  {loginLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password upgrade modal */}
      <PasswordUpgradeModal
        isOpen={showPasswordUpgrade}
        onClose={() => handlePasswordUpgradeComplete(false)}
        onComplete={handlePasswordUpgradeComplete}
        email={signupEmail}
        queuePosition={signupPosition}
        emailExistsInAuth={emailExistsInAuth}
      />



      {/* Confetti celebration */}
      {showConfetti && (
        <ConfettiCelebration
          type="plant"
          autoHide={false}
          onComplete={() => {
            // Don't auto-hide here since we manage it with timeout
          }}
        />
      )}
    </div>
  );
}