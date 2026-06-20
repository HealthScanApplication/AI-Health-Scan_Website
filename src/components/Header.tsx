import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './auth/AuthModal';
import { UniversalWaitlist } from './UniversalWaitlist';
import { SocialSharingModal } from './SocialSharingModal';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';
import { useScrollHeader } from '../hooks/useScrollHeader';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Shield,
  Menu,
  X,
  Share2
} from 'lucide-react';
import { isAdminUser, getAdminUserInfo } from '../utils/adminUtils';
import { oura, ouraButton } from '../config/ouraTheme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { PageType } from '../types/app';
import healthScanLogo from '../assets/cf2e65f2699becd01c6c8ddad2c65d7f0e9a7c42.png';

interface HeaderProps {
  onNavigateToProfile?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToHome?: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToBlog?: () => void;
  onNavigateToNetworkTest?: () => void;
  currentPage?: PageType;
  isAdmin?: boolean;
  user?: any;
  authLoading?: boolean;
  hasEmailBanner?: boolean;
}

export function Header({ 
  onNavigateToProfile, 
  onNavigateToSettings, 
  onNavigateToHome, 
  onNavigateToAdmin, 
  onNavigateToBlog,
  onNavigateToNetworkTest,
  currentPage = 'home',
  isAdmin = false,
  user: propUser,
  authLoading = false,
  hasEmailBanner = false
}: HeaderProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState<string | null>(null);
  const { user: contextUser, signOut } = useAuth();
  
  // Scroll header behavior
  const { isVisible, isScrolling, scrollDirection, animationState } = useScrollHeader({
    threshold: 10,
    showDelay: 150
  });
  
  // Use prop user if provided, otherwise fall back to context user
  const user = propUser || contextUser;
  
  // FIXED: Use proper admin detection functions
  const adminInfo = getAdminUserInfo(user);
  const userIsAdmin = isAdminUser(user);

  // Debug logging for header positioning
  if (process.env.NODE_ENV === "development") {
    console.log('🎯 Header Component Debug:', {
      propIsAdmin: isAdmin,
      userIsAdmin: userIsAdmin,
      adminInfoIsAdmin: adminInfo.isAdmin,
      hasAdminCallback: !!onNavigateToAdmin,
      userEmail: user?.email,
      adminLevel: adminInfo.level,
      hasEmailBanner,
      animationState,
      isVisible
    });
  }

  const handleSignIn = () => {
    setAuthMode('signin');
    setShowAuthModal(true);
  };

  const handleSignUp = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleWaitlistModal = () => {
    setShowWaitlistModal(true);
  };

  const handleReferralModal = () => {
    setShowReferralModal(true);
  };

  // Generate consistent referral code for user
  const generateConsistentReferralCode = (email: string): string => {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const positiveHash = Math.abs(hash);
    const code = positiveHash.toString(36).substring(0, 6).padEnd(6, '0');
    return `hs_${code}`;
  };

  const handleWaitlistSuccess = () => {
    setShowWaitlistModal(false);
    toast.success('Subscribed — welcome to HealthScan!');
    
    // Update waitlist position after successful signup
    setTimeout(() => {
      const storedPosition = localStorage.getItem('healthscan_user_position');
      if (storedPosition && storedPosition !== '0') {
        setWaitlistPosition(storedPosition);
      }
    }, 100);
  };

  // Get user's waitlist position from localStorage
  useEffect(() => {
    const updateWaitlistPosition = () => {
      const userEmail = localStorage.getItem('healthscan_user_email');
      const storedPosition = localStorage.getItem('healthscan_user_position');
      
      if (userEmail && storedPosition && storedPosition !== '0') {
        setWaitlistPosition(storedPosition);
      } else {
        setWaitlistPosition(null);
      }
    };

    // Update on mount
    updateWaitlistPosition();

    // Listen for waitlist signup events
    const handleUserSignedUp = () => {
      updateWaitlistPosition();
    };

    window.addEventListener('userSignedUp', handleUserSignedUp);
    return () => window.removeEventListener('userSignedUp', handleUserSignedUp);
  }, []);

  // Trigger shake animation periodically for header button
  useEffect(() => {
    if (!user && !waitlistPosition) { // Only shake when user is not logged in and not on waitlist
      const shakeInterval = setInterval(() => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 600);
      }, 4000); // Shake every 4 seconds

      return () => clearInterval(shakeInterval);
    } else if (user) {
      // Shake the "Refer Friends" button occasionally for logged-in users
      const referralShakeInterval = setInterval(() => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 600);
      }, 8000); // Shake every 8 seconds for refer friends button

      return () => clearInterval(referralShakeInterval);
    }
  }, [user, waitlistPosition]);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleNavClick = (callback?: () => void) => {
    setMobileMenuOpen(false);
    if (callback) {
      console.log('🔗 Navigation callback triggered');
      callback();
    } else {
      console.warn('⚠️ Navigation callback is undefined');
    }
  };

  const handleSectionScroll = (sectionId: string) => {
    setMobileMenuOpen(false);
    
    // If we're not on home page, navigate to home first
    if (currentPage !== 'home') {
      // Navigate to home and then scroll to section after a delay
      handleNavClick(onNavigateToHome);
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const headerHeight = 64; // Height of fixed header
          const bannerHeight = hasEmailBanner ? 64 : 0; // Height of email banner
          const totalOffset = headerHeight + bannerHeight;
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset - totalOffset;
          window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    } else {
      // We're already on home page, just scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        const headerHeight = 64; // Height of fixed header
        const bannerHeight = hasEmailBanner ? 64 : 0; // Height of email banner
        const totalOffset = headerHeight + bannerHeight;
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset - totalOffset;
        window.scrollTo({
          top: elementPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  const handleHomeNavigation = () => {
    handleNavClick(onNavigateToHome);
    // Scroll to top when navigating to home
    if (currentPage !== 'home') {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Enhanced admin panel click handler with comprehensive debugging
  const handleAdminClick = () => {
    console.log('🛡️ Admin panel clicked - COMPREHENSIVE DEBUG:');
    console.log('🔍 Props received:', {
      propIsAdmin: isAdmin,
      hasAdminCallback: !!onNavigateToAdmin,
      callbackType: typeof onNavigateToAdmin
    });
    console.log('🔍 User validation:', {
      userEmail: user?.email,
      userIsAdmin: userIsAdmin,
      adminInfoIsAdmin: adminInfo.isAdmin,
      adminLevel: adminInfo.level
    });
    
    // Use the most permissive admin check
    const shouldAllowAdmin = isAdmin || userIsAdmin || adminInfo.isAdmin;
    
    if (shouldAllowAdmin && onNavigateToAdmin) {
      console.log('✅ Admin access granted - navigating...');
      toast.info('🛡️ Opening Admin Dashboard...');
      handleNavClick(onNavigateToAdmin);
    } else {
      console.error('❌ Admin navigation failed:', {
        shouldAllowAdmin,
        hasCallback: !!onNavigateToAdmin,
        reasons: {
          propIsAdmin: isAdmin,
          userIsAdmin: userIsAdmin,
          adminInfoIsAdmin: adminInfo.isAdmin,
          hasCallback: !!onNavigateToAdmin
        }
      });
      
      if (!shouldAllowAdmin) {
        toast.error('🚫 Admin access denied - insufficient privileges');
      } else if (!onNavigateToAdmin) {
        toast.error('🚫 Admin navigation not available - missing callback');
      }
    }
  };

  // Show simplified header for admin and other non-home pages
  const showSimplifiedHeader = currentPage !== 'home';

  // Determine if admin button should be shown
  const showAdminButton = isAdmin || userIsAdmin || adminInfo.isAdmin;

  // Enhanced header animation classes with email banner awareness
  const getHeaderAnimationClasses = () => {
    if (animationState === 'hiding') {
      return 'animate-header-slide-up-away';
    } else if (animationState === 'showing') {
      return hasEmailBanner 
        ? 'animate-header-slide-down-return-with-banner' 
        : 'animate-header-slide-down-return';
    } else if (isVisible) {
      return hasEmailBanner ? 'header-visible-with-banner' : 'header-visible';
    } else {
      return 'header-hidden';
    }
  };

  return (
    <>
      <header
        style={{
          background: 'rgba(244,241,234,0.9)',
          borderBottom: '1px solid rgba(22,20,15,0.14)',
        }}
        className={`fixed left-0 right-0 z-40 backdrop-blur-sm header-transition ${
          hasEmailBanner ? 'top-[var(--email-banner-height)]' : 'top-0'
        } ${getHeaderAnimationClasses()}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:flex-row">
            {/* Logo & App Name */}
            <div className="flex items-center cursor-pointer flex-shrink-0 md:justify-start justify-center md:flex-none flex-1" onClick={handleHomeNavigation}>
              <img 
                src={healthScanLogo} 
                alt="HealthScan" 
                className="h-8 w-auto"
              />
              <div className="ml-3 flex flex-col">
                <div className="flex items-center gap-2">
                  <span
                    className="leading-tight"
                    style={{ color: '#16140F', fontFamily: '"Fraunces", Georgia, serif', fontWeight: 400, fontSize: 23, letterSpacing: '-0.01em' }}
                  >
                    HealthScan
                  </span>
                  <span
                    className="px-1.5 py-0.5 text-[10px]"
                    style={{
                      background: 'transparent',
                      color: oura.muted,
                      fontWeight: 500,
                      borderRadius: 999,
                      border: `1px solid ${oura.hairline}`,
                      letterSpacing: '0.08em',
                    }}
                  >
                    BETA
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation - Centered and Optimized */}
            <nav aria-label="Main navigation" className="hidden md:flex items-center justify-center flex-1 space-x-1">
              <button
                onClick={() => handleSectionScroll('routines')}
                className="px-4 py-2"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, color: oura.body, background: 'transparent', border: 'none', borderRadius: 999, cursor: 'pointer', transition: 'color 300ms cubic-bezier(0.4,0,0.2,1)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = oura.forest; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = oura.body; }}
              >
                Routines
              </button>
              <button
                onClick={() => handleSectionScroll('features')}
                className="px-4 py-2"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, color: oura.body, background: 'transparent', border: 'none', borderRadius: 999, cursor: 'pointer', transition: 'color 300ms cubic-bezier(0.4,0,0.2,1)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = oura.forest; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = oura.body; }}
              >
                Features
              </button>
              <button
                onClick={() => handleSectionScroll('how-it-works')}
                className="px-4 py-2"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, color: oura.body, background: 'transparent', border: 'none', borderRadius: 999, cursor: 'pointer', transition: 'color 300ms cubic-bezier(0.4,0,0.2,1)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = oura.forest; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = oura.body; }}
              >
                How It Works
              </button>
              <button
                onClick={() => handleSectionScroll('faq')}
                className="px-4 py-2"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, color: oura.body, background: 'transparent', border: 'none', borderRadius: 999, cursor: 'pointer', transition: 'color 300ms cubic-bezier(0.4,0,0.2,1)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = oura.forest; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = oura.body; }}
              >
                FAQ
              </button>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden absolute right-4">
              {user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-1"
                  style={{ color: oura.body }}
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Avatar className="w-8 h-8 avatar-with-hover-effects">
                      <AvatarImage
                        src={user.user_metadata?.avatar_url}
                        alt="Profile picture"
                        className="object-cover"
                      />
                      <AvatarFallback className="text-white text-sm avatar-fallback" style={{ background: oura.forest }}>
                        {getUserInitials(user.user_metadata?.name || user.email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  style={{ color: oura.body }}
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              )}
            </div>

            {/* User Authentication - Desktop */}
            <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
              {user ? (
                <div className="flex items-center space-x-3">
                  {/* User Information - Moved to left */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="flex items-center gap-2 h-auto p-2 hover:bg-gray-100"
                    >
                      <div className="hidden lg:flex flex-col items-end">
                        <span className="text-sm font-medium text-gray-900 text-right">
                          {user.email}
                        </span>
                      </div>
                      <Avatar className="w-8 h-8 avatar-with-hover-effects">
                        <AvatarImage 
                          src={user.user_metadata?.avatar_url} 
                          alt="Profile picture"
                          className="object-cover"
                        />
                        <AvatarFallback className="text-white text-sm avatar-fallback" style={{ background: oura.forest }}>
                          {getUserInitials(user.user_metadata?.name || user.email || 'U')}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => handleNavClick(onNavigateToProfile)}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleNavClick(onNavigateToSettings)}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    {showAdminButton && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={handleAdminClick} 
                          className="text-red-700 focus:text-red-700 focus:bg-red-50"
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Admin Panel</span>
                          <span className="ml-auto text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                            {adminInfo.level?.toUpperCase() || 'ADMIN'}
                          </span>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {/* Refer Friends Button - Moved to right */}
                  <div className={isShaking ? 'animate-button-shake' : ''}>
                    <button
                      onClick={handleReferralModal}
                      style={{ fontFamily: '"Archivo","Inter",sans-serif', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#16140F', background: 'none', border: 'none', padding: '8px 4px', textDecoration: 'underline', textUnderlineOffset: 4, textDecorationColor: '#9A6A2F', cursor: 'pointer', height: 'auto', boxShadow: 'none' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = oura.forestHover; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = oura.forest; }}
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Refer Friends</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    onClick={handleSignIn}
                    className="font-medium"
                    style={{ color: oura.ink }}
                  >
                    Sign In
                  </Button>

                  {/* Subscribe — unified outlined CTA */}
                  <div className={isShaking ? 'animate-button-shake' : ''}>
                    <button onClick={handleWaitlistModal} className="ed-cta" style={{ fontSize: 11, padding: '9px 18px' }}>
                      Subscribe
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div
              className="md:hidden"
              style={{ borderTop: `1px solid ${oura.hairline}`, background: oura.cream }}
            >
              <div className="py-4">
                {/* Navigation Section */}
                <div className="px-4 mb-4">
                  <h3 className="text-xs uppercase tracking-wider mb-3" style={{ color: oura.muted, fontWeight: 600 }}>
                    Navigation
                  </h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleSectionScroll('routines')}
                      className="block w-full text-left px-3 py-3 rounded-lg font-medium transition-colors"
                      style={{ color: oura.body }}
                    >
                      Routines
                    </button>
                    <button
                      onClick={() => handleSectionScroll('features')}
                      className="block w-full text-left px-3 py-3 rounded-lg font-medium transition-colors"
                      style={{ color: oura.body }}
                    >
                      Features
                    </button>
                    <button
                      onClick={() => handleSectionScroll('how-it-works')}
                      className="block w-full text-left px-3 py-3 rounded-lg font-medium transition-colors"
                      style={{ color: oura.body }}
                    >
                      How It Works
                    </button>
                    <button
                      onClick={() => handleSectionScroll('faq')}
                      className="block w-full text-left px-3 py-3 rounded-lg font-medium transition-colors"
                      style={{ color: oura.body }}
                    >
                      FAQ
                    </button>
                  </div>
                </div>

                {user ? (
                  <>
                    {/* User Account Section */}
                    <div className="px-4 mb-4">
                      <h3 className="text-xs uppercase tracking-wider mb-3" style={{ color: oura.muted, fontWeight: 600 }}>
                        Account
                      </h3>

                      <div className="space-y-1">
                        <button
                          onClick={() => handleNavClick(onNavigateToProfile)}
                          className="block w-full text-left px-3 py-3 rounded-lg font-medium transition-colors"
                          style={{ color: oura.body }}
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => handleNavClick(onNavigateToSettings)}
                          className="block w-full text-left px-3 py-3 rounded-lg font-medium transition-colors"
                          style={{ color: oura.body }}
                        >
                          Settings
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-3 py-3 rounded-lg font-medium transition-colors"
                          style={{ color: oura.body }}
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>

                    {/* Admin Section (if applicable) */}
                    {showAdminButton && (
                      <div className="px-4 mb-4">
                        <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3">
                          Admin Tools
                        </h3>
                        <button 
                          onClick={handleAdminClick}
                          className="block w-full text-left px-3 py-3 text-red-700 hover:text-red-800 hover:bg-red-50 rounded-lg font-medium transition-colors"
                        >
                          Admin Panel
                        </button>
                      </div>
                    )}

                    {/* Action Section */}
                    <div className="px-4">
                      <h3 className="text-xs uppercase tracking-wider mb-3" style={{ color: oura.muted, fontWeight: 600 }}>
                        Actions
                      </h3>
                      {/* Mobile Refer Friends Button */}
                      <div className={`w-full ${isShaking ? 'animate-button-shake' : ''}`}>
                        <button
                          onClick={handleReferralModal}
                          style={{ fontFamily: '"Archivo","Inter",sans-serif', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#16140F', background: 'none', border: 'none', padding: '10px 0', textDecoration: 'underline', textUnderlineOffset: 4, textDecorationColor: '#9A6A2F', cursor: 'pointer', width: '100%', height: 'auto', boxShadow: 'none', textAlign: 'left' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = oura.forestHover; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = oura.forest; }}
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Refer Friends</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Guest Actions Section */}
                    <div className="px-4">
                      <h3 className="text-xs uppercase tracking-wider mb-3" style={{ color: oura.muted, fontWeight: 600 }}>
                        Get Started
                      </h3>
                      <div className="space-y-3">
                        <button
                          onClick={handleSignIn}
                          className="block w-full text-center px-3 py-3 font-medium transition-colors"
                          style={{ color: oura.ink, background: 'transparent', border: `1px solid ${oura.hairline}`, borderRadius: 999 }}
                        >
                          Sign In
                        </button>

                        {/* Mobile Subscribe — unified outlined CTA */}
                        <div className={`w-full ${isShaking ? 'animate-button-shake' : ''}`}>
                          <button onClick={handleWaitlistModal} className="ed-cta" style={{ width: '100%' }}>
                            Subscribe
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
        defaultTab={authMode === 'signin' ? 'login' : 'signup'}
      />

      {/* Waitlist Modal */}
      <Dialog open={showWaitlistModal} onOpenChange={setShowWaitlistModal}>
        <DialogContent className="max-w-2xl">
          <DialogTitle className="sr-only">Subscribe to HealthScan</DialogTitle>
          <DialogDescription className="sr-only">
            Sign up for early access to HealthScan
          </DialogDescription>
          <UniversalWaitlist 
            onSignupSuccess={handleWaitlistSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Referral Modal */}
      <SocialSharingModal 
        open={showReferralModal}
        onOpenChange={setShowReferralModal}
        userEmail={user?.email}
        referralCode={user ? generateConsistentReferralCode(user.email) : undefined}
        userName={user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || ''}
      />
    </>
  );
}