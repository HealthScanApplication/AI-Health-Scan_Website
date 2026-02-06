"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, Lock, ChevronLeft, ChevronRight, Eye, EyeOff, Heart } from 'lucide-react';
import { SocialSharingModal } from '../SocialSharingModal';
import { ConfettiCelebration } from '../ConfettiCelebration';
import { PurpleConfettiCelebration } from '../PurpleConfettiCelebration';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface PasswordUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  userPosition?: number | null;
  emailExistsInAuth?: boolean;
  referralCode?: string;
}

export function PasswordUpgradeModal({ 
  open, 
  onOpenChange, 
  email,
  userPosition,
  emailExistsInAuth = false,
  referralCode = ''
}: PasswordUpgradeModalProps) {
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'main' | 'password2'>('main');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPurpleConfetti, setShowPurpleConfetti] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);

  // Safe email access with fallback
  const userEmail = email || '';

  // Generate consistent referral code for user
  const generateConsistentReferralCode = (emailAddr: string): string => {
    if (!emailAddr || typeof emailAddr !== 'string') {
      return 'hs_default';
    }
    
    let hash = 0;
    for (let i = 0; i < emailAddr.length; i++) {
      const char = emailAddr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const positiveHash = Math.abs(hash);
    const code = positiveHash.toString(36).substring(0, 6).padEnd(6, '0');
    return `hs_${code}`;
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setStep('main');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setShowConfetti(false);
      setShowPurpleConfetti(false);
      setAccountCreated(false);
      setShowSocialModal(false);
    }
  }, [open]);

  // Debug logging for step changes
  useEffect(() => {
    console.log('🔄 Password modal step changed to:', step);
  }, [step]);

  // Calculate potential queue boost with safe fallbacks
  const queueBoost = userPosition && typeof userPosition === 'number' ? Math.max(5, Math.floor(userPosition * 0.15)) : 10;
  const newPosition = userPosition && typeof userPosition === 'number' ? Math.max(1, userPosition - queueBoost) : 1;

  const handleNextStep = () => {
    if (step === 'main') {
      if (!password) {
        toast.error('Please enter a password');
        return;
      }
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      setStep('password2');
    } else if (step === 'password2') {
      handleCreateAccount();
    }
  };

  const handlePrevStep = () => {
    if (step === 'password2') {
      setStep('main');
    }
  };

  const handleCreateAccount = async () => {
    if (!password || !confirmPassword) {
      toast.error('Please fill in both password fields');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!userEmail) {
      toast.error('Email is required to create account');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Starting account creation for:', userEmail);
      
      // Check if this is an OTP-based account creation
      const otpToken = localStorage.getItem('healthscan_otp_token');
      const otpEmail = localStorage.getItem('healthscan_otp_email');
      
      if (otpToken && otpEmail === userEmail) {
        console.log('🎫 Using OTP verification flow');
        
        // Use OTP verification endpoint
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/verify-otp`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              token: otpToken, 
              password: password, 
              email: userEmail 
            })
          }
        );

        const result = await response.json();

        if (response.ok && result.success) {
          // Clear OTP data
          localStorage.removeItem('healthscan_otp_token');
          localStorage.removeItem('healthscan_otp_email');
          
          console.log('✅ OTP verification successful');
          setAccountCreated(true);
          setShowPurpleConfetti(true); // Use plant green confetti for account creation
          
          // Show social sharing modal after confetti
          setTimeout(() => {
            console.log('🔗 Opening social sharing modal (OTP flow)');
            setShowPurpleConfetti(false);
            setShowSocialModal(true);
          }, 2000);
        } else {
          console.error('❌ OTP verification failed:', result.error);
          throw new Error(result.error || 'Failed to verify OTP');
        }
      } else {
        console.log('🔑 Using regular account creation flow');
        
        // Regular account creation
        const { error } = await signUp(userEmail, password, 'HealthScan User');
        
        if (error) {
          if (error.signupSuccess) {
            console.log('✅ Account creation successful with signupSuccess flag');
            setAccountCreated(true);
            setShowPurpleConfetti(true); // Use plant green confetti for account creation
            
            // Show social sharing modal after confetti
            setTimeout(() => {
              console.log('🔗 Opening social sharing modal (regular flow)');
              setShowPurpleConfetti(false);
              setShowSocialModal(true);
            }, 2000);
          } else if (error.type === 'existing_account' || error.type === 'user_already_registered') {
            console.error('❌ Account already exists');
            toast.error('Account already exists. Please sign in instead.');
            onOpenChange(false);
          } else {
            console.error('❌ Account creation failed:', error.message);
            toast.error('Failed to create account: ' + (error.message || 'Unknown error'));
          }
        } else {
          console.log('✅ Account creation successful without error');
          setAccountCreated(true);
          setShowPurpleConfetti(true); // Use plant green confetti for account creation
          
          // Show social sharing modal after confetti
          setTimeout(() => {
            console.log('🔗 Opening social sharing modal (no error flow)');
            setShowPurpleConfetti(false);
            setShowSocialModal(true);
          }, 2000);
        }
      }
      
    } catch (error) {
      console.error('💥 Account creation error:', error);
      toast.error('An error occurred while creating your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialModalClose = () => {
    console.log('✅ User finished sharing flow');
    setShowSocialModal(false);
    toast.success('🎉 Welcome to HealthScan! Start sharing to earn rewards and climb the queue.');
    onOpenChange(false);
  };

  // If email exists in Auth, don't show the modal
  if (emailExistsInAuth) {
    return null;
  }

  // Don't render if no email is provided
  if (!userEmail) {
    return null;
  }

  return (
    <>
      {showConfetti && <ConfettiCelebration />}
      {showPurpleConfetti && (
        <PurpleConfettiCelebration 
          onComplete={() => setShowPurpleConfetti(false)}
        />
      )}
      <Dialog open={open} onOpenChange={(newOpen) => {
        console.log('🔄 Modal open state changing to:', newOpen);
        // Only allow closing if we're not in the middle of account creation
        if (!newOpen && !accountCreated) {
          // Add small delay to protect any ongoing confetti animations
          setTimeout(() => {
            onOpenChange(newOpen);
          }, 100);
        } else if (!newOpen && accountCreated) {
          // Allow closing after account creation with delay to protect confetti
          setTimeout(() => {
            onOpenChange(newOpen);
          }, 100);
        }
      }}>
        <DialogContent className="bg-white/95 backdrop-blur-sm border-0 rounded-xl shadow-2xl overflow-hidden">
        {step === 'main' && (
          <>
            <DialogHeader className="pb-4 px-6 pt-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[var(--healthscan-green)] to-[var(--healthscan-light-green)] rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4">
                  <Lock className="w-7 h-7 text-white" />
                </div>
              </div>
              <DialogTitle className="text-xl font-bold text-gray-900 text-center mb-2">
                {userPosition ? (
                  <>
                    You're #{userPosition} on the List!
                  </>
                ) : (
                  <>
                    You're on the List!
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-[var(--healthscan-text-muted)] text-center text-sm">
                Add password to improve your ranking and earn rewards
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 pb-6">
              <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="mb-6">
                <div className="relative">
                  <Lock className="absolute left-4 top-4 h-5 w-5 text-[var(--healthscan-text-muted)]" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && password && password.length >= 6) {
                        e.preventDefault();
                        handleNextStep();
                      }
                    }}
                    className="pl-12 pr-12 h-14 border-2 border-gray-200/50 focus:border-[var(--healthscan-green)] focus:ring-[var(--healthscan-green)]/20 rounded-xl text-center bg-white/80 backdrop-blur-sm consistent-text-size"
                    minLength={6}
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-[var(--healthscan-text-muted)] hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-[var(--healthscan-text-muted)] text-center mt-2">
                  At least 6 characters
                </p>
              </form>

              <div className="space-y-3">
                <Button
                  onClick={handleNextStep}
                  disabled={!password || password.length < 6}
                  className="w-full h-12 bg-[var(--healthscan-green)] hover:bg-[var(--healthscan-green)]/90 text-white font-medium shadow-sm border-0 rounded-xl consistent-text-size"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'password2' && (
          <>
            <DialogHeader className="pb-4 px-6 pt-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[var(--healthscan-green)] to-[var(--healthscan-light-green)] rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4">
                  <Lock className="w-7 h-7 text-white" />
                </div>
              </div>
              <DialogTitle className="text-xl font-bold text-gray-900 text-center mb-2">
                Confirm Password
              </DialogTitle>
              <DialogDescription className="text-[var(--healthscan-text-muted)] text-center text-sm">
                Enter your password again
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 pb-6">
              <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="mb-6">
                <div className="relative">
                  <Lock className="absolute left-4 top-4 h-5 w-5 text-[var(--healthscan-text-muted)]" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && confirmPassword && password === confirmPassword && !loading) {
                        e.preventDefault();
                        handleNextStep();
                      }
                    }}
                    className="pl-12 pr-12 h-14 border-2 border-gray-200/50 focus:border-[var(--healthscan-green)] focus:ring-[var(--healthscan-green)]/20 rounded-xl text-center bg-white/80 backdrop-blur-sm consistent-text-size"
                    minLength={6}
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-4 text-[var(--healthscan-text-muted)] hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                {confirmPassword && (
                  <div className={`text-xs text-center mt-2 font-medium ${
                    password === confirmPassword ? 'text-[var(--healthscan-green)]' : 'text-[var(--healthscan-red-accent)]'
                  }`}>
                    {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}
              </form>

              {/* Action Buttons - Back and Create */}
              <div className="flex gap-3">
                {/* Back Button to Compare Passwords */}
                <Button
                  onClick={handlePrevStep}
                  disabled={loading}
                  className="btn-major bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] flex-shrink-0"
                  title="Go back to see original password"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                {/* Create Account Button */}
                <Button
                  onClick={handleNextStep}
                  disabled={loading || !confirmPassword || password !== confirmPassword}
                  className="flex-1 btn-major bg-[var(--healthscan-green)] hover:bg-[var(--healthscan-green)]/90 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 mr-2" />
                      Create
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
        </DialogContent>
      </Dialog>

      {/* Social Sharing Modal */}
      <SocialSharingModal
        open={showSocialModal}
        onOpenChange={handleSocialModalClose}
        userEmail={userEmail}
        referralCode={generateConsistentReferralCode(userEmail)}
        userName={userEmail.split('@')[0] || 'User'}
        userPosition={userPosition}
        showAccountCreatedTitle={true}
      />
    </>
  );
}