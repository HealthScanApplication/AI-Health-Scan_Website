"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { CheckCircle, Gift, Users, Zap, Sparkles, Star, Trophy, ArrowRight } from 'lucide-react';
import { UniversalWaitlist } from './UniversalWaitlist';
import { ReferralStatsCards } from './ReferralStatsCards';
import { useAuth } from '../contexts/AuthContext';

interface ReferralInvitationSectionProps {
  hasReferral?: boolean;
  isActive?: boolean;
  referralCode?: string | null;
  referrerName?: string;
  onJoinWaitlist?: () => void;
}

export function ReferralInvitationSection({ 
  hasReferral,
  isActive,
  referralCode, 
  referrerName,
  onJoinWaitlist 
}: ReferralInvitationSectionProps) {
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const { user } = useAuth();

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

  const benefits = [
    {
      icon: <Gift className="w-6 h-6" />,
      title: "Free Premium Weeks",
      description: "Earn multiple free weeks of HealthScan Premium through referrals",
      color: "text-[var(--healthscan-green)]"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Early Access",
      description: "Skip the line and get access before the official launch",
      color: "text-blue-600"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Exclusive Community",
      description: "Join a private community of health-conscious early adopters",
      color: "text-purple-600"
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: "Referral Rewards",
      description: "Earn additional rewards for every friend you invite",
      color: "text-orange-600"
    }
  ];

  const socialProofStats = [
    { number: "50K+", label: "People on waitlist" },
    { number: "4.9★", label: "App Store rating" },
    { number: "92%", label: "Satisfaction rate" }
  ];

  const handleJoinClick = () => {
    if (user) {
      onJoinWaitlist?.();
    } else {
      setShowEmailCapture(true);
    }
  };

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-green-50"></div>
        
        {/* Floating blobs */}
        <div className="absolute w-80 h-80 rounded-full opacity-8 animate-blob-float-1"
             style={{
               background: `radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, rgba(22, 163, 74, 0.15) 50%, transparent 70%)`,
               top: "15%",
               right: "10%",
               filter: "blur(35px)",
             }}></div>
        
        <div className="absolute w-64 h-64 rounded-full opacity-6 animate-blob-float-2"
             style={{
               background: `radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.12) 50%, transparent 70%)`,
               top: "50%",
               left: "5%",
               filter: "blur(30px)",
             }}></div>
        
        <div className="absolute w-72 h-72 rounded-full opacity-7 animate-blob-float-3"
             style={{
               background: `radial-gradient(circle, rgba(251, 146, 60, 0.2) 0%, rgba(249, 115, 22, 0.1) 50%, transparent 70%)`,
               bottom: "20%",
               right: "20%",
               filter: "blur(40px)",
             }}></div>
        
        <div className="absolute w-48 h-48 rounded-full opacity-9 animate-blob-float-4"
             style={{
               background: `radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, transparent 70%)`,
               top: "75%",
               left: "15%",
               filter: "blur(25px)",
             }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            🎉 Special Invitation
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            You've Been{' '}
            <span className="text-[var(--healthscan-green)]">Invited</span>
          </h1>
          
          <div className="max-w-3xl mx-auto mb-8">
            <p className="text-xl text-gray-600 mb-4">
              {referrerName ? (
                <>
                  <span className="font-semibold text-[var(--healthscan-green)]">{referrerName}</span> invited you to join HealthScan,
                  the revolutionary app that reveals what's really in your food.
                </>
              ) : (
                <>
                  A friend invited you to join HealthScan, the revolutionary app that reveals what's really in your food.
                </>
              )}
            </p>
            <p className="text-lg text-[var(--healthscan-text-muted)]">
              Join thousands of health-conscious people who are already transforming their relationship with food.
            </p>
          </div>

          {referralCode && (
            <div className="inline-flex items-center bg-white rounded-xl px-6 py-3 border border-gray-200 shadow-sm">
              <span className="text-sm text-[var(--healthscan-text-muted)] mr-2">Your referral code:</span>
              <code className="bg-[var(--healthscan-bg-light)] text-[var(--healthscan-green)] px-3 py-1 rounded-lg text-sm font-mono font-medium">
                {referralCode}
              </code>
            </div>
          )}
        </div>

        {/* Social Proof Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {socialProofStats.map((stat, index) => (
            <div key={index} className="text-center p-8 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="text-3xl md:text-4xl text-[var(--healthscan-green)] font-bold mb-2">{stat.number}</div>
              <div className="text-[var(--healthscan-text-muted)]">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Referral Stats Cards - Show for logged in users */}
        {user?.email && (
          <div className="mb-20">
            <h3 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-gray-900">
              Your Progress
            </h3>
            <div className="max-w-4xl mx-auto">
              <ReferralStatsCards
                userEmail={user.email}
                referralCode={generateConsistentReferralCode(user.email)}
                layout="vertical"
                size="md"
                className=""
              />
            </div>
          </div>
        )}

        {/* Benefits Grid */}
        <div className="mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-gray-900">
            Exclusive Benefits Just for You
          </h2>
          <p className="text-center text-[var(--healthscan-text-muted)] mb-12 text-lg">
            As a referred friend, you get special perks that regular users don't receive
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-8 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 mb-6 group-hover:scale-110 transition-transform duration-300 ${benefit.color}`}>
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">{benefit.title}</h3>
                <p className="text-[var(--healthscan-text-muted)] leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>



        {/* Testimonial */}
        <div className="mb-20">
          <div className="max-w-4xl mx-auto p-8 md:p-12 bg-gradient-to-r from-[var(--healthscan-green)] to-[var(--healthscan-light-green)] rounded-2xl text-white">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-current text-yellow-300" />
                ))}
              </div>
              <blockquote className="text-xl md:text-2xl mb-8 italic leading-relaxed">
                "HealthScan completely changed how I shop for food. I finally understand what I'm putting in my body, and I've never felt healthier!"
              </blockquote>
              <div className="flex items-center justify-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-white/30 shadow-lg">
                  <AvatarImage 
                    src="https://ui-avatars.com/api/?name=Sarah+Johnson&size=128&background=3b82f6&color=ffffff&rounded=true&bold=true&format=png" 
                    alt="Sarah Johnson - HealthScan user"
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-white/20 text-white font-semibold">SJ</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="text-lg font-semibold">Sarah Johnson</div>
                  <div className="text-green-100">Early Beta User</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="max-w-2xl mx-auto p-8 md:p-12 bg-white rounded-2xl border border-gray-200 shadow-lg">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-900">
              Ready to Transform Your Health?
            </h2>
            <p className="text-lg text-[var(--healthscan-text-muted)] mb-8">
              Join the waitlist now and be among the first to experience the future of food awareness.
            </p>
            
            {!showEmailCapture ? (
              <Button 
                onClick={handleJoinClick}
                className="bg-gradient-to-r from-[var(--healthscan-green)] to-[var(--healthscan-light-green)] hover:from-[var(--healthscan-green)]/90 hover:to-[var(--healthscan-light-green)]/90 text-white px-12 py-6 text-xl rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0"
              >
                <Gift className="w-6 h-6 mr-3" />
                {user ? 'Join Waitlist Now' : 'Claim Your Free Premium Weeks'}
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
            ) : (
              <div className="max-w-md mx-auto">
                <UniversalWaitlist
                  placeholder="Add your email"
                  onSignupSuccess={() => {
                    setShowEmailCapture(false);
                    onJoinWaitlist?.();
                  }}
                />
              </div>
            )}
            
            <div className="mt-6 flex items-center justify-center gap-4 text-sm text-[var(--healthscan-text-muted)]">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-[var(--healthscan-green)]" />
                Free to join
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-[var(--healthscan-green)]" />
                No spam
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-[var(--healthscan-green)]" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}