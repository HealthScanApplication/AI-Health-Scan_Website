"use client";

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '../../contexts/AuthContext';
import { getSupabaseClient } from '../../utils/supabase/client';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, AlertTriangle, Eye, EyeOff, Shield, Heart, ArrowLeft, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'login' | 'signup';
  prefillEmail?: string;
}

interface RememberedCredentials {
  email: string;
  password: string;
}

export function AuthModal({ open, onOpenChange, defaultTab = 'login', prefillEmail }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [rememberMe, setRememberMe] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [userAlreadyExistsError, setUserAlreadyExistsError] = useState<string | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [networkError, setNetworkError] = useState<string | null>(null);
  
  // Refs for auto-focusing inputs
  const loginEmailRef = useRef<HTMLInputElement>(null);
  const signupNameRef = useRef<HTMLInputElement>(null);
  const signupPasswordRef = useRef<HTMLInputElement>(null);

  // Helper function to safely access localStorage
  const getStoredValue = (key: string, defaultValue: any = null) => {
    try {
      if (typeof window === 'undefined') return defaultValue;
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Failed to get ${key} from localStorage:`, error);
      return defaultValue;
    }
  };

  const setStoredValue = (key: string, value: any) => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to set ${key} in localStorage:`, error);
    }
  };

  const removeStoredValue = (key: string) => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove ${key} from localStorage:`, error);
    }
  };

  // Load remembered credentials when modal opens
  useEffect(() => {
    if (open) {
      // Reset tab to default when opening
      setActiveTab(defaultTab);
      
      // Reset password visibility when modal opens
      setShowLoginPassword(false);
      setShowSignupPassword(false);
      setShowSignupConfirmPassword(false);

      // Clear error states
      setUserAlreadyExistsError(null);
      setNetworkError(null);

      // Load remember me preference and credentials
      const rememberMePreference = getStoredValue('healthscan_remember_me', false);
      const savedCredentials = getStoredValue('healthscan_remembered_credentials', null);
      
      // Set remember me checkbox state
      setRememberMe(rememberMePreference);
      
      // Load saved credentials if they exist and remember me is enabled
      if (rememberMePreference && savedCredentials && savedCredentials.email && savedCredentials.password) {
        setLoginForm({
          email: savedCredentials.email,
          password: savedCredentials.password
        });
        toast.info('🌱 Welcome back! Loaded your saved login details', { duration: 4000 });
      } else if (rememberMePreference && !savedCredentials) {
        // If remember me is enabled but no credentials exist, clear the preference
        setRememberMe(false);
        removeStoredValue('healthscan_remember_me');
        setLoginForm({ email: '', password: '' });
      } else {
        // Clear login form if remember me is disabled
        setLoginForm({ email: '', password: '' });
      }

      // Prefill signup email if provided (separate from login)
      if (prefillEmail) {
        setSignupForm(prev => ({ ...prev, email: prefillEmail }));
      }
    } else {
      // Reset states when modal closes
      setLoading(false);
      setShowLoginPassword(false);
      setShowSignupPassword(false);
      setShowSignupConfirmPassword(false);
      setUserAlreadyExistsError(null);
      setNetworkError(null);
    }
  }, [open, defaultTab, prefillEmail]);

  // Auto-focus email input when modal opens or tab changes
  useEffect(() => {
    if (open) {
      // Small delay to ensure the modal and input are fully rendered
      const timer = setTimeout(() => {
        if (activeTab === 'login' && loginEmailRef.current) {
          loginEmailRef.current.focus();
        } else if (activeTab === 'signup' && signupNameRef.current) {
          signupNameRef.current.focus();
        }
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [open, activeTab]);

  // Save or clear credentials based on remember me preference
  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    setStoredValue('healthscan_remember_me', checked);
    
    if (checked) {
      if (loginForm.email && loginForm.password) {
        // Save current credentials immediately
        const credentials: RememberedCredentials = {
          email: loginForm.email,
          password: loginForm.password
        };
        setStoredValue('healthscan_remembered_credentials', credentials);
        toast.success('💚 Your login details will be remembered for next time!');
      } else {
        // Show info if no credentials to save yet
        toast.info('🌱 Enter your email and password, then they\'ll be saved automatically');
      }
    } else {
      // Clear saved credentials and preference
      removeStoredValue('healthscan_remembered_credentials');
      toast.info('🗑️ Saved login details have been cleared');
    }
  };

  // Auto-save credentials when form changes (if remember me is enabled)
  useEffect(() => {
    // Only auto-save if remember me is checked and we have both email and password
    if (rememberMe && loginForm.email.trim() && loginForm.password) {
      const credentials: RememberedCredentials = {
        email: loginForm.email,
        password: loginForm.password
      };
      setStoredValue('healthscan_remembered_credentials', credentials);
    }
  }, [loginForm.email, loginForm.password, rememberMe]);

  // Clear error states when user starts typing
  useEffect(() => {
    if (loginForm.email || loginForm.password) {
      setNetworkError(null);
    }
  }, [loginForm.email, loginForm.password]);

  useEffect(() => {
    if (signupForm.email || signupForm.name || signupForm.password) {
      setNetworkError(null);
      setUserAlreadyExistsError(null);
    }
  }, [signupForm.email, signupForm.name, signupForm.password]);

  // Password reset functionality
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail || !resetEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    const normalizedEmail = resetEmail.trim().toLowerCase();
    setLoading(true);

    try {
      console.log('🔄 Initiating password reset for:', normalizedEmail);
      const supabase = getSupabaseClient();
      
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        
        if (error.message?.includes('User not found')) {
          toast.error('📧 Account Not Found');
          setTimeout(() => {
            toast.info('No account found with this email. Please sign up first.', {
              duration: 8000,
              action: {
                label: 'Sign Up',
                onClick: () => {
                  setShowPasswordReset(false);
                  setActiveTab('signup');
                }
              }
            });
          }, 800);
        } else if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
          toast.error('⏰ Too Many Requests');
          toast.info('Please wait a few minutes before requesting another password reset.', { duration: 10000 });
        } else {
          toast.error('❌ Password Reset Failed');
          toast.info('Unable to send password reset email. Please try again later.', { duration: 8000 });
        }
      } else {
        console.log('✅ Password reset email sent successfully');
        toast.success('📧 Password Reset Sent!');
        toast.info('Check your email for a password reset link. It may take a few minutes to arrive.', { 
          duration: 12000 
        });
        setShowPasswordReset(false);
        setResetEmail('');
      }
    } catch (error: any) {
      console.error('❌ Unexpected error during password reset:', error);
      toast.error('❌ Reset Failed');
      toast.info('An unexpected error occurred. Please try again or contact support.', { duration: 8000 });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.email || !loginForm.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    setNetworkError(null);

    // Normalize email to prevent case sensitivity issues
    const normalizedEmail = loginForm.email.trim().toLowerCase();
    
    try {
      const { error } = await signIn(normalizedEmail, loginForm.password);
      
      if (error) {
        const errorMessage = error.message || 'Login failed';
        
        // Handle different types of authentication errors with enhanced feedback
        if (error.type === 'invalid_credentials') {
          // Different toast messages based on what we know about the user
          if (error.userExists === false) {
            toast.error('📧 Account Not Found');
            setTimeout(() => {
              toast.info('No account found with this email. Create one now!', { 
                duration: 10000,
                action: {
                  label: 'Sign Up',
                  onClick: () => setActiveTab('signup')
                }
              });
            }, 800);
            setNetworkError('No account found with this email address. Please sign up to create an account.');
            
          } else if (error.userExists === true) {
            toast.error('🔑 Incorrect Password');
            setTimeout(() => {
              toast.info('Your account exists, but the password is wrong. Double-check your password.', { 
                duration: 10000,
                action: {
                  label: 'Reset Password',
                  onClick: () => {
                    setShowPasswordReset(true);
                    setResetEmail(normalizedEmail);
                  }
                }
              });
            }, 800);
            setNetworkError('Your account exists but the password is incorrect. Please check your password.');
            
          } else {
            // Generic case when we can't determine user existence
            toast.error('🔑 Login Failed');
            setTimeout(() => {
              toast.info(error.helpMessage || 'Please check your email and password.', { 
                duration: 10000,
                action: error.actionType === 'signup_required' ? {
                  label: 'Sign Up',
                  onClick: () => setActiveTab('signup')
                } : undefined
              });
            }, 800);
            setNetworkError(error.helpMessage || 'Please check your login credentials.');
          }
          
        } else if (error.type === 'email_not_confirmed') {
          toast.error('📧 Email Not Confirmed');
          toast.info('Please check your email and click the confirmation link before signing in.', { duration: 10000 });
          setNetworkError('Email confirmation required. Check your inbox for a confirmation email.');
          
        } else if (error.type === 'rate_limited') {
          toast.error('⏰ Too Many Attempts');
          toast.info('You\'ve made too many attempts. Please wait 5-10 minutes before trying again.', { duration: 12000 });
          setNetworkError('Rate limit exceeded. Please wait 5-10 minutes before trying again.');
          
        } else if (error.type === 'network_error') {
          toast.error('🌐 Connection Failed');
          toast.info('Unable to connect to our servers. Please check your internet connection.', { duration: 8000 });
          setNetworkError('Network connection issue detected. Please check your internet connection and try again.');
          
        } else if (error.type === 'server_error') {
          toast.error('🔧 Server Issue');
          toast.info('Our servers are experiencing issues. Please try again in a few minutes.', { duration: 10000 });
          setNetworkError('Server temporarily unavailable. Please try again in a few minutes.');
          
        } else {
          // Generic error handling for unknown issues
          toast.error('❌ Login Failed');
          
          // Show help message if available
          if (error.helpMessage) {
            setTimeout(() => {
              toast.info(error.helpMessage, { duration: 10000 });
            }, 800);
          } else {
            setTimeout(() => {
              toast.info('An unexpected error occurred. Please try again.', { duration: 8000 });
            }, 800);
          }
          
          setNetworkError(error.helpMessage || 'Authentication failed. Please try again.');
        }
      } else {
        // Save credentials if remember me is checked (using normalized email)
        if (rememberMe) {
          const credentials: RememberedCredentials = {
            email: normalizedEmail,
            password: loginForm.password
          };
          setStoredValue('healthscan_remembered_credentials', credentials);
          setStoredValue('healthscan_remember_me', true);
        } else {
          // Clear saved credentials if remember me is not checked
          removeStoredValue('healthscan_remembered_credentials');
          removeStoredValue('healthscan_remember_me');
        }
        
        console.log('✅ Login success - clearing error states and closing modal');
        toast.success('Welcome back! You\'re now signed in. 🌱');
        onOpenChange(false);
        
        // Only clear form if remember me is not checked
        if (!rememberMe) {
          setLoginForm({ email: '', password: '' });
        }
      }
    } catch (error) {
      console.log('Login error:', error);
      toast.error('An unexpected error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle switching to login after user already exists error
  const handleSwitchToLogin = () => {
    setActiveTab('login');
    setUserAlreadyExistsError(null);
    setShowPasswordReset(false);
    toast.info('🔑 Switched to login. Your email is already filled in.', { duration: 5000 });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupForm.name || !signupForm.email || !signupForm.password || !signupForm.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (signupForm.password !== signupForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (signupForm.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setNetworkError(null);
    setUserAlreadyExistsError(null);

    // Normalize email to prevent case sensitivity issues  
    const normalizedEmail = signupForm.email.trim().toLowerCase();
    
    try {
      const { error } = await signUp(normalizedEmail, signupForm.password, signupForm.name);
      
      if (error) {
        // Extract error message from various possible properties
        let errorMessage = '';
        
        // Try different ways to extract the error message
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error?.message) {
          errorMessage = error.message;
        } else if (error?.error_description) {
          errorMessage = error.error_description;
        } else if (error?.error) {
          errorMessage = error.error;
        } else if (error?.msg) {
          errorMessage = error.msg;
        } else if (error?.toString) {
          errorMessage = error.toString();
        } else {
          errorMessage = String(error);
        }
        
        // Comprehensive error pattern matching for user already exists scenarios
        const isUserAlreadyExistsError = (
          // Direct message patterns
          errorMessage.includes('User already registered') ||
          errorMessage.includes('already registered') ||
          errorMessage.includes('already exists') ||
          errorMessage.includes('Email address already in use') ||
          errorMessage.includes('email_address_not_confirmed') ||
          errorMessage.includes('email_not_confirmed') ||
          
          // AuthApiError patterns - exact match for the reported error
          errorMessage === 'AuthApiError: User already registered' ||
          errorMessage.includes('AuthApiError: User already registered') ||
          errorMessage.includes('AuthApiError') && errorMessage.includes('registered') ||
          errorMessage.includes('AuthApiError') && errorMessage.includes('User already') ||
          
          // Case-insensitive patterns
          errorMessage.toLowerCase().includes('user') && errorMessage.toLowerCase().includes('exists') ||
          errorMessage.toLowerCase().includes('user') && errorMessage.toLowerCase().includes('registered') ||
          errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('already') ||
          errorMessage.toLowerCase().includes('authapiError') && errorMessage.toLowerCase().includes('registered') ||
          
          // Error codes
          error.code === 'user_already_exists' ||
          error.code === 'email_address_in_use' ||
          error.code === 'signup_disabled' ||
          error.code === 'email_address_not_confirmed' ||
          
          // Status codes
          error.status === 422 ||
          error.status === 409 ||
          
          // Error type patterns
          error.constructor?.name === 'AuthApiError' && (
            errorMessage.includes('registered') || 
            errorMessage.includes('already') ||
            errorMessage.includes('exists')
          ) ||
          
          // Error name patterns
          error.name === 'AuthApiError' && (
            errorMessage.includes('registered') || 
            errorMessage.includes('already') ||
            errorMessage.includes('exists')
          )
        );
        
        if (isUserAlreadyExistsError) {
          console.log('💚 Successfully detected and handled user already exists error');
          console.log('🔄 Switching to login flow with enhanced UX');
          
          // Set specific error state for user already exists
          setUserAlreadyExistsError(normalizedEmail);
          
          // Show more friendly error message
          toast.error('💡 This email is already registered');
          
          // Auto-fill login form with the normalized email they tried to sign up with
          setLoginForm(prev => ({ ...prev, email: normalizedEmail }));
          
          // Show helpful guidance with option to switch automatically
          setTimeout(() => {
            toast.info('🔑 Switch to "Login" to sign in with your existing account', { 
              duration: 8000,
              action: {
                label: 'Switch to Login',
                onClick: handleSwitchToLogin
              }
            });
          }, 1000);
          
          // Return early to prevent the error from being logged as an unhandled error
          return;
        }
        
        // Handle other signup errors
        console.error('❌ Signup error:', error);
        toast.error('Signup failed: ' + errorMessage);
        
        // Check if this is a network error
        if (errorMessage.includes('Network') || errorMessage.includes('connection') || errorMessage.includes('fetch') || errorMessage.includes('Server')) {
          setNetworkError('Network or server connection issue detected. This may prevent account creation.');
        } else {
          setNetworkError(null);
        }
      } else {
        // Clear error states on successful signup
        setNetworkError(null);
        setUserAlreadyExistsError(null);
        
        toast.success('Account created successfully! Welcome to HealthScan. 🌱');
        onOpenChange(false);
        setSignupForm({ name: '', email: '', password: '', confirmPassword: '' });
      }
    } catch (error) {
      console.log('Unexpected signup error:', error);
      toast.error('An unexpected error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="modal-fullscreen-8px sm:max-w-[425px] p-0 bg-white/95 backdrop-blur-sm border-gray-200/50">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              HealthScan
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600">
            Join HealthScan to access revolutionary AI-powered health scanning technology
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-4">
          {/* Network Error Alert */}
          {networkError && (
            <Alert className="mb-4 bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm">
                {networkError}
              </AlertDescription>
            </Alert>
          )}

          {/* User Already Exists Error Alert */}
          {userAlreadyExistsError && (
            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <Mail className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                <div className="space-y-2">
                  <div className="font-medium">This email is already registered!</div>
                  <div>Switch to the "Login" tab to sign in with your existing account.</div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Password Reset Form */}
          {showPasswordReset ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  onClick={() => {
                    setShowPasswordReset(false);
                    setResetEmail('');
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h3 className="font-semibold text-gray-900">Reset Password</h3>
                  <p className="text-sm text-gray-600">Enter your email to receive a reset link</p>
                </div>
              </div>

              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="h-12 pl-10 pr-4 input-standard consistent-text-size"
                      required
                      autoFocus
                      style={{ 
                        paddingLeft: '2.5rem',
                        zIndex: 1
                      }}
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-20" />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 btn-major bg-green-600 hover:bg-green-700 text-white consistent-text-size"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="text-sm consistent-text-size">Login</TabsTrigger>
                <TabsTrigger value="signup" className="text-sm consistent-text-size">Sign Up</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Input
                        ref={loginEmailRef}
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                        className="h-12 pl-10 pr-4 input-standard consistent-text-size"
                        required
                        style={{ 
                          paddingLeft: '2.5rem',
                          zIndex: 1
                        }}
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-20" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                        className="h-12 pl-10 pr-10 input-standard consistent-text-size"
                        required
                        style={{ 
                          paddingLeft: '2.5rem',
                          paddingRight: '2.5rem',
                          zIndex: 1
                        }}
                      />
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-20" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent z-20"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                      >
                        {showLoginPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember-me"
                        checked={rememberMe}
                        onCheckedChange={handleRememberMeChange}
                      />
                      <Label
                        htmlFor="remember-me"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 consistent-text-size"
                      >
                        Remember me
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 font-normal text-sm text-green-600 hover:text-green-700 consistent-text-size"
                      onClick={() => {
                        setShowPasswordReset(true);
                        setResetEmail(loginForm.email);
                      }}
                    >
                      Forgot password?
                    </Button>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 btn-major bg-green-600 hover:bg-green-700 text-white consistent-text-size"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <Input
                        ref={signupNameRef}
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={signupForm.name}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, name: e.target.value }))}
                        className="h-12 pl-10 pr-4 input-standard consistent-text-size"
                        required
                        style={{ 
                          paddingLeft: '2.5rem',
                          zIndex: 1
                        }}
                      />
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-20" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                        className="h-12 pl-10 pr-4 input-standard consistent-text-size"
                        required
                        style={{ 
                          paddingLeft: '2.5rem',
                          zIndex: 1
                        }}
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-20" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        ref={signupPasswordRef}
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={signupForm.password}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                        className="h-12 pl-10 pr-10 input-standard consistent-text-size"
                        required
                        style={{ 
                          paddingLeft: '2.5rem',
                          paddingRight: '2.5rem',
                          zIndex: 1
                        }}
                      />
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-20" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent z-20"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                      >
                        {showSignupPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-confirm-password"
                        type={showSignupConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={signupForm.confirmPassword}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="h-12 pl-10 pr-10 input-standard consistent-text-size"
                        required
                        style={{ 
                          paddingLeft: '2.5rem',
                          paddingRight: '2.5rem',
                          zIndex: 1
                        }}
                      />
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-20" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent z-20"
                        onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                      >
                        {showSignupConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 btn-major bg-green-600 hover:bg-green-700 text-white consistent-text-size"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <Heart className="mr-2 h-4 w-4" />
                        Create Account
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}