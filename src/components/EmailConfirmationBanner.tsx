"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { X, Mail, AlertCircle, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getSupabaseClient } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import healthScanLogo from 'figma:asset/1debfa3241af40447f297e52b30a6022740a996d.png';

interface EmailConfirmationBannerProps {
  userEmail: string;
  onDismiss?: () => void;
}

export function EmailConfirmationBanner({ userEmail, onDismiss }: EmailConfirmationBannerProps) {
  const [isResending, setIsResending] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastSentTime, setLastSentTime] = useState<number | null>(null);
  const [cooldownTime, setCooldownTime] = useState(0);

  // Cooldown timer effect
  useEffect(() => {
    if (lastSentTime && cooldownTime > 0) {
      const timer = setInterval(() => {
        const remaining = Math.max(0, 60 - Math.floor((Date.now() - lastSentTime) / 1000));
        setCooldownTime(remaining);
        
        if (remaining <= 0) {
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [lastSentTime, cooldownTime]);

  const openEmailApp = () => {
    try {
      // Try to open the user's default email app
      const emailDomain = userEmail.split('@')[1]?.toLowerCase();
      let emailUrl = 'mailto:';

      // Try to open specific email providers if we can detect them
      if (emailDomain?.includes('gmail')) {
        emailUrl = 'https://mail.google.com/mail/u/0/#inbox';
      } else if (emailDomain?.includes('outlook') || emailDomain?.includes('hotmail') || emailDomain?.includes('live')) {
        emailUrl = 'https://outlook.live.com/mail/0/inbox';
      } else if (emailDomain?.includes('yahoo')) {
        emailUrl = 'https://mail.yahoo.com/';
      } else if (emailDomain?.includes('icloud') || emailDomain?.includes('me.com')) {
        emailUrl = 'https://www.icloud.com/mail';
      }

      // Open email app/website
      window.open(emailUrl, '_blank', 'noopener,noreferrer');
      
      toast.success('📧 Opening your email app...');
    } catch (error) {
      console.warn('Could not open email app:', error);
      toast.info('💡 Please check your email inbox manually');
    }
  };

  const handleResendConfirmation = async () => {
    if (isResending || cooldownTime > 0) return;
    
    setIsResending(true);
    
    try {
      console.log(`📧 Resending email confirmation for: ${userEmail}`);
      
      const supabase = getSupabaseClient();
      
      // First, try the server endpoint for sending verification emails
      try {
        // Get the current user and their access token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!sessionError && session?.user?.id && session?.access_token) {
          console.log('🔄 Using server endpoint to send verification email...');
          
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/users/${session.user.id}/send-verification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}` // Use the actual user's access token
            },
            body: JSON.stringify({
              email: userEmail
            })
          });

          let result;
          try {
            result = await response.json();
          } catch (parseError) {
            console.warn('⚠️ Failed to parse server response:', parseError);
            throw new Error('Invalid server response format');
          }

          if (response.ok && result.success) {
            console.log('✅ Server verification email sent successfully');
            toast.success('📧 Verification email sent! Check your inbox and spam folder.');
            
            // Set cooldown
            const now = Date.now();
            setLastSentTime(now);
            setCooldownTime(60);
            
            // Show additional helpful message
            setTimeout(() => {
              toast.info('💡 Click the link in the email to verify your account', {
                duration: 6000
              });
            }, 2000);
            
            return; // Success, exit early
          } else {
            console.warn('⚠️ Server endpoint failed:', {
              status: response.status,
              statusText: response.statusText,
              error: result?.error || 'Unknown error',
              details: result?.details || 'No details provided'
            });
            
            // If it's a specific error that we should surface to the user
            if (result?.error && typeof result.error === 'string') {
              if (result.error.includes('rate limit') || result.error.includes('too many')) {
                toast.error('⏰ Too many verification requests. Please wait before trying again.');
                const now = Date.now();
                setLastSentTime(now);
                setCooldownTime(300); // 5 minute cooldown
                return;
              }
            }
          }
        } else {
          console.warn('⚠️ No valid session found for server endpoint');
        }
      } catch (serverError) {
        console.warn('⚠️ Server endpoint error, falling back to Supabase auth:', {
          error: serverError,
          message: serverError?.message,
          name: serverError?.name
        });
      }

      // Fallback to Supabase auth resend method
      console.log('🔄 Using Supabase auth resend as fallback...');
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        console.error('❌ Failed to resend confirmation email:', error);
        
        if (error.message?.includes('rate limit')) {
          toast.error('⏰ Please wait before requesting another confirmation email');
          // Set cooldown based on rate limit
          const now = Date.now();
          setLastSentTime(now);
          setCooldownTime(60);
        } else if (error.message?.includes('already confirmed')) {
          // Email is already confirmed - clean up localStorage and hide banner
          console.log('✅ Email already confirmed - cleaning up and hiding banner');
          localStorage.removeItem('healthscan_needs_confirmation');
          localStorage.setItem('healthscan_email_confirmed', 'true');
          setIsVisible(false);
          if (onDismiss) onDismiss();
          toast.success('✅ Your email is already confirmed!');
        } else if (error.message?.includes('Email rate limit exceeded')) {
          toast.error('📧 Too many emails sent. Please wait a few minutes before trying again.');
          const now = Date.now();
          setLastSentTime(now);
          setCooldownTime(300); // 5 minute cooldown for rate limit
        } else {
          toast.error('❌ Failed to send confirmation email. Please try again later.');
        }
      } else {
        console.log('✅ Fallback confirmation email sent successfully');
        toast.success('📧 Verification email sent! Check your inbox and spam folder.');
        
        // Set cooldown
        const now = Date.now();
        setLastSentTime(now);
        setCooldownTime(60);
        
        // Show additional helpful message
        setTimeout(() => {
          toast.info('💡 Click the link in the email to verify your account', {
            duration: 6000
          });
        }, 2000);
      }
    } catch (error: any) {
      console.error('💥 Exception while resending confirmation:', error);
      toast.error('🌐 Network error. Please check your connection and try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    
    // Clean up localStorage flags when manually dismissed
    localStorage.removeItem('healthscan_needs_confirmation');
    
    if (onDismiss) {
      onDismiss();
    }
    // Show confirmation that banner was dismissed
    toast.info('💚 Email banner dismissed. You can still check your email to verify your account.');
  };

  // Check if email is already confirmed on mount
  useEffect(() => {
    const checkEmailConfirmation = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.email_confirmed_at) {
          console.log('✅ Email already confirmed on mount - hiding banner');
          localStorage.removeItem('healthscan_needs_confirmation');
          localStorage.setItem('healthscan_email_confirmed', 'true');
          setIsVisible(false);
          if (onDismiss) {
            onDismiss();
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not check email confirmation status on mount:', error);
      }
    };

    checkEmailConfirmation();
  }, [userEmail, onDismiss]);

  // Auto-hide banner on successful verification (listen for auth state changes)
  useEffect(() => {
    const supabase = getSupabaseClient();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          console.log('🎉 Email verified! Hiding banner and cleaning up...');
          
          // Clear any waitlist confirmation flags from localStorage
          localStorage.removeItem('healthscan_needs_confirmation');
          localStorage.setItem('healthscan_email_confirmed', 'true');
          
          setIsVisible(false);
          toast.success('🎉 Email verified successfully!');
          
          // Notify parent to dismiss banner
          if (onDismiss) {
            onDismiss();
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [onDismiss]);

  if (!isVisible) return null;

  return (
    <>
      {/* Fixed banner that pushes content down - Enhanced with organic HealthScan styling */}
      <div className="fixed top-0 left-0 right-0 z-[100] animate-banner-slide-down">
        {/* Organic gradient background with subtle animation */}
        <div className="relative bg-gradient-to-r from-[var(--healthscan-bg-light)] via-green-50 to-emerald-50 backdrop-blur-sm animate-banner-organic-glow">
          {/* Subtle animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--healthscan-green)]/5 to-[var(--healthscan-light-green)]/5 animate-gradient-shift opacity-60"></div>
          
          {/* Organic pattern overlay for texture */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(22, 163, 74, 0.1) 0%, transparent 50%),
                             radial-gradient(circle at 80% 50%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
                             radial-gradient(circle at 40% 20%, rgba(22, 163, 74, 0.05) 0%, transparent 30%),
                             radial-gradient(circle at 60% 80%, rgba(34, 197, 94, 0.05) 0%, transparent 30%)`
          }}></div>
          
          {/* Enhanced border with organic feel and flow animation */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--healthscan-green)]/30 to-transparent animate-banner-border-flow"></div>
          
          {/* Content container with enhanced spacing */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4 gap-4">
              {/* Icon and Message - Enhanced with HealthScan styling */}
              <button
                onClick={openEmailApp}
                className="flex items-center gap-3 flex-1 min-w-0 hover:bg-white/60 rounded-xl p-2.5 -m-2 transition-all duration-300 group cursor-pointer hover:shadow-sm hover:scale-[1.02]"
                title="Open email"
              >
                {/* Enhanced icon with HealthScan logo and organic glow */}
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[var(--healthscan-green)] to-[var(--healthscan-light-green)] rounded-full flex items-center justify-center group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 shadow-sm animate-banner-icon-float overflow-hidden">
                  <img 
                    src={healthScanLogo}
                    alt="HealthScan" 
                    className="w-6 h-6 rounded-full object-cover border border-white/20"
                    onError={(e) => {
                      // Fallback to Mail icon if logo fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const mail = target.nextElementSibling as HTMLElement;
                      if (mail) mail.style.display = 'block';
                    }}
                  />
                  <Mail className="w-5 h-5 text-white drop-shadow-sm hidden" />
                </div>
                
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium text-gray-800 truncate text-sm leading-tight">
                    <span className="hidden sm:inline">🌱 Please verify your email</span>
                    <span className="sm:hidden">🌱 Verify email</span>
                  </p>
                  <p className="text-xs text-[var(--healthscan-text-muted)] mt-1 truncate leading-relaxed">
                    <span className="font-semibold text-[var(--healthscan-green)]">{userEmail}</span>
                  </p>
                </div>
              </button>

              {/* Action Buttons - Enhanced HealthScan styling */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <Button
                  onClick={handleResendConfirmation}
                  disabled={isResending || cooldownTime > 0}
                  size="sm"
                  className="h-9 px-4 bg-gradient-to-r from-[var(--healthscan-green)] to-[var(--healthscan-light-green)] hover:from-[var(--healthscan-light-green)] hover:to-[var(--healthscan-green)] disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-medium text-xs transition-all duration-300 hover:scale-105 hover:shadow-md active:scale-95 rounded-xl shadow-sm"
                >
                  {isResending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                      <span className="hidden sm:inline">Sending</span>
                      <span className="sm:hidden">•••</span>
                    </>
                  ) : cooldownTime > 0 ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1 animate-pulse" />
                      <span className="hidden sm:inline">{cooldownTime}s</span>
                      <span className="sm:hidden">{cooldownTime}</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5 mr-1" />
                      <span className="hidden sm:inline">Resend</span>
                      <span className="sm:hidden">↻</span>
                    </>
                  )}
                </Button>
                
                {/* Enhanced Close Button with organic styling */}
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-[var(--healthscan-text-muted)] hover:text-white hover:bg-gradient-to-br hover:from-[var(--healthscan-green)] hover:to-[var(--healthscan-light-green)] border border-gray-200 hover:border-[var(--healthscan-green)] transition-all duration-300 hover:scale-110 hover:shadow-md active:scale-95 rounded-xl bg-white/70 backdrop-blur-sm"
                  title="Dismiss"
                  aria-label="Close email confirmation banner"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Subtle bottom glow effect */}
          <div className="absolute -bottom-1 left-1/4 right-1/4 h-2 bg-gradient-to-r from-transparent via-[var(--healthscan-green)]/10 to-transparent blur-sm"></div>
        </div>
      </div>
      
      {/* Spacer div to push content down - exactly matches banner height with improved spacing */}
      <div className="h-[70px] sm:h-[76px] w-full bg-transparent" aria-hidden="true" />
    </>
  );
}