import { useEffect } from 'react';
import { getSupabaseClient } from '../utils/supabase/client';
import { toast } from 'sonner';
import { projectId } from '../utils/supabase/info';

interface UseUrlParameterHandlingProps {
  setCurrentPage: (page: string) => void;
}

export function useUrlParameterHandling({ setCurrentPage }: UseUrlParameterHandlingProps) {
  // Handle custom /confirm-email?token=... links from waitlist confirmation emails
  useEffect(() => {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (path === '/confirm-email' && token) {
      (async () => {
        try {
          toast.loading('Confirming your email...', { id: 'confirm-email' });
          const res = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/confirm-email?token=${encodeURIComponent(token)}`
          );
          const data = await res.json();

          if (data.success) {
            toast.success(
              <div className="space-y-1">
                <p className="font-semibold">Email confirmed!</p>
                {data.position && <p className="text-sm opacity-90">You're <strong>#{data.position}</strong> in the queue</p>}
                <p className="text-xs opacity-75">Welcome to HealthScan</p>
              </div>,
              { id: 'confirm-email', duration: 8000 }
            );

            // Store confirmed state
            if (data.data?.email) {
              localStorage.setItem('healthscan_user_email', data.data.email);
              localStorage.setItem('healthscan_email_confirmed', 'true');
            }
            if (data.data?.referralCode) {
              localStorage.setItem('healthscan_referral_code', data.data.referralCode);
            }
          } else {
            toast.error(data.error || 'Confirmation failed. Please try again.', { id: 'confirm-email' });
          }
        } catch {
          toast.error('Could not confirm email. Please try again later.', { id: 'confirm-email' });
        }

        // Clean URL → home
        window.history.replaceState({}, document.title, '/');
        setCurrentPage('home');
      })();
    }
  }, [setCurrentPage]);

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // Check for email verification tokens in URL
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Check for various email verification parameters
        const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
        const type = urlParams.get('type') || hashParams.get('type');
        const tokenHash = urlParams.get('token_hash') || hashParams.get('token_hash');
        
        // Handle email verification callback
        if (type === 'signup' || type === 'email_confirmation' || (accessToken && refreshToken)) {
          console.log('📧 Email verification callback detected');
          
          try {
            // Handle the session from URL parameters
            const { data, error } = await supabase.auth.getSession();
            
            if (!error && data.session) {
              console.log('✅ Email verification successful - user session established');
              toast.success('🎉 Email verified successfully! Welcome to HealthScan!', {
                duration: 5000
              });
              
              // Clear URL parameters after successful verification
              clearUrlParameters();
              setCurrentPage('home');
            } else {
              await handleTokenHashVerification(tokenHash, supabase);
            }
          } catch (verificationError) {
            console.error('❌ Error during email verification:', verificationError);
            toast.error('Email verification failed. Please try again.');
          }
        }
        
        // Check for password reset callbacks
        if (type === 'recovery') {
          console.log('🔑 Password reset callback detected');
          toast.info('Please create a new password for your account.');
          clearUrlParameters();
        }
        
      } catch (error) {
        console.error('Error handling email verification:', error);
      }
    };

    const handleTokenHashVerification = async (tokenHash: string | null, supabase: any) => {
      if (tokenHash) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'email'
        });
        
        if (!verifyError) {
          console.log('✅ Email verification successful via token hash');
          toast.success('🎉 Email verified successfully! Welcome to HealthScan!', {
            duration: 5000
          });
          
          clearUrlParameters();
          setCurrentPage('home');
        } else {
          console.error('❌ Email verification failed:', verifyError);
          toast.error('Email verification failed. Please try requesting a new verification email.');
        }
      } else {
        console.warn('⚠️ Email verification callback detected but no valid session or token');
        toast.warning('Email verification link may be expired. Please request a new verification email.');
      }
    };

    const clearUrlParameters = () => {
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    };

    // Only run email verification check if there are relevant URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    const hasVerificationParams = 
      urlParams.get('type') || hashParams.get('type') ||
      urlParams.get('access_token') || hashParams.get('access_token') ||
      urlParams.get('token_hash') || hashParams.get('token_hash');
      
    if (hasVerificationParams) {
      handleEmailVerification();
    }
  }, [setCurrentPage]);

  useEffect(() => {
    const handleOTPCreation = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const createAccountToken = urlParams.get('create-account');
      const email = urlParams.get('email');
      
      if (createAccountToken && email) {
        // Store OTP data for the account creation flow
        localStorage.setItem('healthscan_otp_token', createAccountToken);
        localStorage.setItem('healthscan_otp_email', email);
        
        // Clear URL parameters
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // Trigger creation modal or page
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('showOTPAccountCreation', { 
            detail: { token: createAccountToken, email } 
          }));
        }, 100);
      }
    };

    handleOTPCreation();
  }, []);
}