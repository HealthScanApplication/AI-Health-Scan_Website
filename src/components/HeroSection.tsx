"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { UniversalWaitlist } from "./UniversalWaitlist";
import { CountdownTimer } from "./CountdownTimer";
import { CelebrationElements } from "./CelebrationElements";
import { AnimatedHeadline } from "./AnimatedHeadline";

import { ReferralInvitationBanner } from "./ReferralInvitationBanner";
import { User } from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import {
  projectId,
  publicAnonKey,
} from "../utils/supabase/info";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import healthScanLogo from "figma:asset/cf2e65f2699becd01c6c8ddad2c65d7f0e9a7c42.png";
import heroBackground from "figma:asset/5f38caf68dd6b8af22362056b70854ea4cf4b933.png";

interface HeroSectionProps {
  hasReferral?: boolean;
  isActive?: boolean;
  referralCode?: string | null;
}

export function HeroSection({ hasReferral, isActive, referralCode }: HeroSectionProps = {}) {
  const { user } = useAuth();
  const [waitlistCount, setWaitlistCount] = useState<
    number | null
  >(null);
  const [userPosition, setUserPosition] = useState<
    number | null
  >(null);
  const [isLoadingCount, setIsLoadingCount] = useState(true);

  // Show celebration elements with higher probability during pre-launch
  const [showCelebration, setShowCelebration] = useState(
    Math.random() > 0.7,
  );

  // Curated words that work well with the HealthScan theme
  const animatedWords = [
    "kids",
    "treats",
    "meals",
    "snacks",
    "drinks",
    "supplements",
    "products",
  ];

  // Generate consistent referral code based on email
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

  useEffect(() => {
    // Randomize celebration elements every 10 seconds
    const interval = setInterval(() => {
      setShowCelebration(Math.random() > 0.6);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Load real waitlist count and user position
  useEffect(() => {
    const loadWaitlistData = async () => {
      try {
        setIsLoadingCount(true);
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/waitlist-count`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setWaitlistCount(data.count || 0);
        } else {
          setWaitlistCount(null);
        }

        // Get user position from localStorage if available (only for logged in users)
        if (user?.email) {
          const userEmail = localStorage.getItem('healthscan_user_email');
          const storedPosition = localStorage.getItem('healthscan_user_position');
          
          // Don't display user position - remove position indicator
          setUserPosition(null);
        } else {
          // Clear user position if not logged in
          setUserPosition(null);
        }
      } catch (error) {
        // Silently handle fetch errors - these are expected during development/offline mode
        setWaitlistCount(null);
        setUserPosition(null);
      } finally {
        setIsLoadingCount(false);
      }
    };

    loadWaitlistData();

    // Listen for user signup events to update count only (not position)
    const handleUserSignup = (event: CustomEvent) => {
      // Don't display individual user position
      setUserPosition(null);
      loadWaitlistData();
    };

    window.addEventListener("userSignedUp", handleUserSignup as EventListener);

    return () => {
      window.removeEventListener(
        "userSignedUp",
        handleUserSignup as EventListener,
      );
    };
  }, [user?.email]); // Add user?.email dependency to re-run when login status changes

  // Helper function to get the appropriate social proof text
  const getSocialProofText = () => {
    if (user?.email) {
      // Logged in user - show generic message instead of position
      return "You're on the waitlist! 🌱";
    } else if (!user?.email && waitlistCount !== null && waitlistCount > 0) {
      // Not logged in, show total queue size
      return `${waitlistCount} people in the queue`;
    } else {
      // Fallback text
      return "Join our growing community";
    }
  };

  return (
    <section
      id="hero-section"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Hero Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={heroBackground}
          alt="HealthScan Hero Background"
          className="absolute top-0 left-0 w-full h-full object-cover"
        />

        {/* White transparent overlay with animated gradient */}
        <div className="absolute inset-0 bg-white/15"></div>
        
        {/* Animated luminosity gradient overlay */}
        <div 
          className="absolute inset-0 opacity-30 animate-pulse"
          style={{
            background: `
              linear-gradient(45deg, 
                rgba(255, 255, 255, 0.2) 0%, 
                rgba(255, 255, 255, 0.05) 25%, 
                rgba(255, 255, 255, 0.3) 50%, 
                rgba(255, 255, 255, 0.1) 75%, 
                rgba(255, 255, 255, 0.2) 100%
              )
            `,
            backgroundSize: "400% 400%",
            animation: "gradientLuminosity 8s ease-in-out infinite"
          }}
        />

        {/* Subtle overlay for better text readability */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]"></div>
      </div>

      {/* Subtle enhancement overlay */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Light enhancement to complement the background image */}
        {/* Vintage Noise Texture Overlay */}
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.8'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Animated Gradient Overlay */}
        <div
          className="absolute inset-0 opacity-15 animate-gradient-flow"
          style={{
            background: `
              linear-gradient(45deg, 
                rgba(22, 163, 74, 0.1) 0%, 
                rgba(34, 197, 94, 0.15) 25%, 
                rgba(16, 185, 129, 0.1) 50%, 
                rgba(6, 182, 212, 0.12) 75%, 
                rgba(22, 163, 74, 0.08) 100%
              ),
              radial-gradient(ellipse at 30% 40%, rgba(255, 255, 255, 0.1) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 60%, rgba(22, 163, 74, 0.05) 0%, transparent 50%)
            `,
            backgroundSize: "400% 400%, 100% 100%, 100% 100%",
          }}
        />
      </div>

      {/* Celebration Elements */}
      {showCelebration && <CelebrationElements isActive={showCelebration} />}

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full flex flex-col justify-center min-h-screen sm:min-h-0">
        {/* Logo - Hidden on mobile */}
        <div className="hidden sm:flex justify-center mb-8">
          <img
            src={healthScanLogo}
            alt="HealthScan"
            className="h-16 w-auto sm:h-20"
          />
        </div>
        {/* Launch Badge */}
        <div className="flex justify-center items-center mb-6 mt-4 sm:mt-0">
          <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-xs font-normal border-gray-200 opacity-80">
            Beta Launch • Feb 27, 2026
          </Badge>
        </div>

        {/* Animated Main Headline */}
        <AnimatedHeadline
          words={animatedWords}
          interval={2800}
          className="text-center mb-3"
        />

        {/* Subheadline */}
        <p className="text-base sm:text-lg text-[rgba(0,0,0,0.47)] mb-8 max-w-2xl mx-auto leading-relaxed">
          Know exactly what you're eating before you eat it — protect your health with real-time ingredient analysis and personalized safety alerts.
        </p>

        {/* Countdown Timer */}
        <div className="mb-8">
          <CountdownTimer />
        </div>

        {/* Email Capture / Referral Section */}
        <div className="mb-8">
          <UniversalWaitlist 
            placeholder="Add your email" 
            autoFocus={true}
          />
        </div>



        {/* Position-Based Social Proof */}
        {!isLoadingCount && (
          <div className="flex justify-center items-center gap-4 text-sm text-[var(--healthscan-text-muted)]">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-blue-100 shadow-sm">
                  <ImageWithFallback
                    src="https://ui-avatars.com/api/?name=Sarah+Chen&size=32&background=3b82f6&color=ffffff&rounded=true&bold=true&format=png"
                    alt="HealthScan user - Sarah"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-green-100 shadow-sm">
                  <ImageWithFallback
                    src="https://ui-avatars.com/api/?name=Michael+Rodriguez&size=32&background=16a34a&color=ffffff&rounded=true&bold=true&format=png"
                    alt="HealthScan user - Michael"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-purple-100 shadow-sm">
                  <ImageWithFallback
                    src="https://ui-avatars.com/api/?name=Emma+Thompson&size=32&background=8b5cf6&color=ffffff&rounded=true&bold=true&format=png"
                    alt="HealthScan user - Emma"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-orange-100 shadow-sm">
                  <ImageWithFallback
                    src="https://ui-avatars.com/api/?name=James+Wilson&size=32&background=f59e0b&color=ffffff&rounded=true&bold=true&format=png"
                    alt="HealthScan user - James"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <span>{getSocialProofText()}</span>
            </div>
          </div>
        )}

        {/* Loading state for social proof */}
        {isLoadingCount && (
          <div className="flex justify-center items-center gap-4 text-sm text-[var(--healthscan-text-muted)]">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white animate-pulse overflow-hidden flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white animate-pulse overflow-hidden flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white animate-pulse overflow-hidden flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white animate-pulse overflow-hidden flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              <span>Loading your position...</span>
            </div>
            <div className="hidden sm:block w-1 h-1 bg-gray-300 rounded-full"></div>
            <span className="hidden sm:inline">
              No spam, ever 📧
            </span>
          </div>
        )}
      </div>

      {/* Floating Referral Invitation Banner */}
      <ReferralInvitationBanner 
        hasReferral={hasReferral || false}
        isActive={isActive || false}
        referralCode={referralCode || null}
      />
    </section>
  );
}