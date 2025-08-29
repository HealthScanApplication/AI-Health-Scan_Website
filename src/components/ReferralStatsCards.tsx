"use client";

import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Share, UserPlus, Award, Trophy, Users, Crown, Star, Gift, Share2 } from 'lucide-react';
import { Progress } from './ui/progress';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ReferralStatsCardsProps {
  userEmail?: string;
  referralCode?: string;
  className?: string;
  layout?: 'horizontal' | 'grid' | 'vertical';
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

interface UserStats {
  linksShared: number;
  friendsJoined: number;
  totalPoints: number;
  sharePoints: number;
  joinPoints: number;
  queuePosition?: number;
}

interface RewardLevel {
  name: string;
  icon: any;
  pointsRequired: number;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

export function ReferralStatsCards({ 
  userEmail, 
  referralCode, 
  className = '',
  layout = 'vertical',
  size = 'sm'
}: ReferralStatsCardsProps) {
  const [userStats, setUserStats] = useState<UserStats>({
    linksShared: 0,
    friendsJoined: 0,
    totalPoints: 0,
    sharePoints: 0,
    joinPoints: 0,
    queuePosition: undefined
  });
  const [isLoading, setIsLoading] = useState(true);

  // Reward levels configuration with tier-based system and revenue sharing
  // Points are calculated as: (referrals * 10) + (shares * 1)
  const rewardLevels: RewardLevel[] = [
    {
      name: "Tier 1",
      icon: Users,
      pointsRequired: 0,
      color: "text-gray-700",
      bgColor: "from-gray-50 to-gray-100",
      borderColor: "border-gray-200",
      description: "Waitlisted"
    },
    {
      name: "Tier 2",
      icon: Share,
      pointsRequired: 50, // ~5 referrals
      color: "text-emerald-700",
      bgColor: "from-emerald-50 to-green-100",
      borderColor: "border-emerald-200",
      description: "Early Access"
    },
    {
      name: "Tier 3",
      icon: Star,
      pointsRequired: 150, // ~15 referrals
      color: "text-blue-700",
      bgColor: "from-blue-50 to-indigo-100",
      borderColor: "border-blue-200",
      description: "4 Free Weeks"
    },
    {
      name: "Tier 4",
      icon: Trophy,
      pointsRequired: 300, // ~30 referrals
      color: "text-purple-700",
      bgColor: "from-purple-50 to-violet-100",
      borderColor: "border-purple-200",
      description: "8 Free Weeks"
    },
    {
      name: "Tier 5",
      icon: Crown,
      pointsRequired: 500, // ~50 referrals
      color: "text-yellow-700",
      bgColor: "from-yellow-50 to-amber-100",
      borderColor: "border-yellow-200",
      description: "16 Free Weeks"
    },
    {
      name: "Tier 6",
      icon: Gift,
      pointsRequired: 1000, // ~100 referrals
      color: "text-orange-700",
      bgColor: "from-orange-50 to-red-100",
      borderColor: "border-orange-200",
      description: "10% Revenue Share"
    },
    {
      name: "Tier 7",
      icon: Award,
      pointsRequired: 50000, // ~5000 referrals
      color: "text-pink-700",
      bgColor: "from-pink-50 to-rose-100",
      borderColor: "border-pink-200",
      description: "20% Revenue Share"
    }
  ];

  useEffect(() => {
    if (userEmail) {
      loadUserStats();
    } else {
      setIsLoading(false);
    }
  }, [userEmail, referralCode]);

  const loadUserStats = async () => {
    if (!userEmail) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/user-referral-stats`,
        {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            email: userEmail, 
            referralCode
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📊 ReferralStatsCards: Raw response data:', data);
        
        if (data && data.success) {
          // Handle new API response structure
          const referralCount = data.referralCount || 0;
          const queuePosition = data.queuePosition || undefined;
          
          // Calculate points based on referral count
          const linksShared = Math.max(referralCount, 0); // Assume at least as many shares as referrals
          const friendsJoined = referralCount;
          const sharePoints = linksShared * 1;
          const joinPoints = friendsJoined * 10;
          
          console.log('✅ ReferralStatsCards: Processed stats:', {
            friendsJoined,
            linksShared,
            sharePoints,
            joinPoints,
            queuePosition: 'hidden' // Position tracking disabled
          });
          
          setUserStats({
            linksShared,
            friendsJoined,
            totalPoints: sharePoints + joinPoints,
            sharePoints,
            joinPoints,
            queuePosition: undefined // Don't display queue position
          });
        } else if (data && data.stats) {
          // Handle legacy API response structure (for backward compatibility)
          const referralsData = data.stats.referrals || {};
          const referredUsersArray = Array.isArray(referralsData.referredUsers) 
            ? referralsData.referredUsers 
            : [];
          
          const referralsCount = typeof referralsData.count === 'number' 
            ? referralsData.count 
            : (typeof referralsData === 'number' ? referralsData : 0);
          
          const friendsJoined = referredUsersArray.length > 0 
            ? referredUsersArray.length 
            : referralsCount;
          
          const linksShared = Math.max(friendsJoined, data.stats.linksShared || 0);
          const sharePoints = linksShared * 1;
          const joinPoints = friendsJoined * 10;
          
          const queuePosition = data.stats.queuePosition || 
            (localStorage.getItem('healthscan_user_position') ? 
              parseInt(localStorage.getItem('healthscan_user_position') || '0', 10) : undefined);
          
          setUserStats({
            linksShared,
            friendsJoined,
            totalPoints: sharePoints + joinPoints,
            sharePoints,
            joinPoints,
            queuePosition: undefined // Don't display queue position
          });
        } else {
          console.warn('⚠️ ReferralStatsCards: Invalid response structure:', data);
          // Fallback with default values
          setUserStats({
            linksShared: 0,
            friendsJoined: 0,
            totalPoints: 0,
            sharePoints: 0,
            joinPoints: 0,
            queuePosition: undefined
          });
        }
      } else {
        // Fallback with default values
        setUserStats({
          linksShared: 0,
          friendsJoined: 0,
          totalPoints: 0,
          sharePoints: 0,
          joinPoints: 0,
          queuePosition: undefined // Don't display queue position
        });
      }
    } catch (error) {
      console.error('Error loading user referral stats:', error);
      // Set default fallback values
      setUserStats({
        linksShared: 0,
        friendsJoined: 0,
        totalPoints: 0,
        sharePoints: 0,
        joinPoints: 0,
        queuePosition: undefined // Don't display queue position
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for reward level calculations
  const getCurrentLevel = (points: number): RewardLevel => {
    const currentLevel = rewardLevels
      .slice()
      .reverse()
      .find(level => points >= level.pointsRequired);
    return currentLevel || rewardLevels[0];
  };

  const getNextLevel = (points: number): RewardLevel | null => {
    const nextLevel = rewardLevels.find(level => points < level.pointsRequired);
    return nextLevel || null;
  };

  const getProgressToNextLevel = (points: number): number => {
    const currentLevel = getCurrentLevel(points);
    const nextLevel = getNextLevel(points);
    
    if (!nextLevel) return 100; // Max level reached
    
    const pointsInCurrentLevel = points - currentLevel.pointsRequired;
    const pointsNeededForNextLevel = nextLevel.pointsRequired - currentLevel.pointsRequired;
    
    return Math.min(100, (pointsInCurrentLevel / pointsNeededForNextLevel) * 100);
  };

  // Size configurations
  const sizeConfig = {
    xs: {
      padding: 'p-3',
      numberSize: 'text-lg',
      labelSize: 'text-xs',
      iconSize: 'w-3 h-3',
      iconPadding: 'p-1.5'
    },
    sm: {
      padding: 'p-4',
      numberSize: 'text-xl',
      labelSize: 'text-xs',
      iconSize: 'w-4 h-4',
      iconPadding: 'p-2'
    },
    md: {
      padding: 'p-6',
      numberSize: 'text-3xl',
      labelSize: 'text-sm',
      iconSize: 'w-6 h-6',
      iconPadding: 'p-3'
    },
    lg: {
      padding: 'p-8',
      numberSize: 'text-4xl',
      labelSize: 'text-base',
      iconSize: 'w-8 h-8',
      iconPadding: 'p-4'
    }
  };

  const config = sizeConfig[size];

  // Layout configurations
  const layoutClass = layout === 'vertical'
    ? 'flex flex-col gap-3'
    : layout === 'horizontal' 
    ? 'flex flex-wrap gap-2 sm:gap-3 justify-center' 
    : 'grid grid-cols-2 lg:grid-cols-3 gap-4';

  const cardWidth = layout === 'horizontal' ? 'flex-1 min-w-[140px] max-w-[180px]' : '';

  if (isLoading) {
    return (
      <div className={`${layoutClass} ${className}`}>
        {layout === 'vertical' ? (
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Loading Card Template - Repeated 3 times */}
            {[1, 2, 3].map((index) => (
              <Card key={index} className={`${config.padding} flex-1 animate-pulse`}>
                <div className="flex flex-col items-center text-center h-full">
                  {/* Icon Section Loading */}
                  <div className={`${config.iconPadding} bg-gray-200 rounded-xl mb-3`}>
                    <div className={`${config.iconSize} bg-gray-300 rounded`}></div>
                  </div>
                  
                  {/* Content Section Loading */}
                  <div className="flex-1 flex flex-col justify-between w-full space-y-2">
                    <div className="space-y-1">
                      <div className="h-3 bg-gray-200 rounded mx-auto w-20"></div>
                      <div className="h-6 bg-gray-200 rounded mx-auto w-16"></div>
                    </div>
                    
                    {/* Bottom Section Loading */}
                    <div className="pt-2 border-t border-gray-100 space-y-1">
                      <div className="h-2 bg-gray-200 rounded w-full"></div>
                      <div className="h-2 bg-gray-200 rounded w-3/4 mx-auto"></div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          [...Array(3)].map((_, index) => (
            <Card key={index} className={`${config.padding} ${cardWidth} animate-pulse`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className={`${config.iconPadding} bg-gray-200 rounded-xl`}>
                  <div className={`${config.iconSize} bg-gray-300 rounded`}></div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    );
  }

  const currentLevel = getCurrentLevel(userStats.totalPoints);
  const nextLevel = getNextLevel(userStats.totalPoints);
  const progressPercent = getProgressToNextLevel(userStats.totalPoints);

  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>


        {/* Referrals Activity Card - Teal Theme */}
        <Card className={`${config.padding} flex-1 min-w-0 bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200 hover:shadow-lg transition-all duration-300`}>
          <div className="flex flex-col items-center text-center h-full">
            {/* Icon Section */}
            <div className={`${config.iconPadding} bg-teal-500 rounded-xl mb-3`}>
              <Share2 className={`${config.iconSize} text-white`} />
            </div>
            
            {/* Content Section */}
            <div className="flex-1 flex flex-col justify-between w-full space-y-2">
              <div className="space-y-1">
                <p className={`${config.labelSize} font-medium text-teal-700`}>Referrals</p>
                <p className={`${config.numberSize} font-bold text-black`}>{userStats.friendsJoined}</p>
                <p className="text-xs text-teal-600">Sent: {userStats.linksShared}</p>
              </div>
              
              {/* Bottom Section */}
              <div className="pt-2 border-t border-teal-200/50">
                <div className="flex items-center justify-center gap-2 text-xs">
                  <span className="text-teal-600">Successful</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Current & Next Rewards Card - Teal Theme */}
        <Card className={`${config.padding} flex-1 min-w-0 bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200 hover:shadow-lg transition-all duration-300`}>
          <div className="flex flex-col items-center text-center h-full">
            {/* Icon Section */}
            <div className={`${config.iconPadding} bg-teal-500 rounded-xl mb-3`}>
              <currentLevel.icon className={`${config.iconSize} text-white`} />
            </div>
            
            {/* Content Section */}
            <div className="flex-1 flex flex-col justify-between w-full space-y-2">
              <div className="space-y-1">
                <p className={`${config.labelSize} font-medium text-teal-700`}>Reward</p>
                <p className={`text-sm font-bold text-black`}>{currentLevel.description}</p>
              </div>
              
              {/* Bottom Section */}
              <div className="pt-2 border-t border-teal-200/50 space-y-2">
                {nextLevel ? (
                  <>
                    <div className="text-xs text-teal-600">
                      <span className="font-medium">Next:</span> {nextLevel.description}
                    </div>
                    <Progress 
                      value={progressPercent} 
                      className="h-1.5 bg-white/40"
                    />
                    <div className="text-xs text-teal-600">
                      {Math.ceil((nextLevel.pointsRequired - userStats.totalPoints) / 10)} more referrals
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-1">
                    <Crown className="w-3 h-3 text-yellow-500" />
                    <p className="text-xs text-teal-700 font-medium">Max level reached!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Fallback to original horizontal/grid layout for backward compatibility
  return (
    <div className={`${layoutClass} ${className}`}>
      {/* Links Shared Card */}
      <Card className={`${config.padding} ${cardWidth} bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`${config.labelSize} font-medium text-emerald-700 mb-1`}>Links Shared</p>
            <p className={`${config.numberSize} font-bold text-black`}>{userStats.linksShared}</p>
            <p className="text-xs text-emerald-600 mt-1">Sharing activity</p>
          </div>
          <div className={`${config.iconPadding} bg-emerald-500 rounded-xl`}>
            <Share className={`${config.iconSize} text-white`} />
          </div>
        </div>
      </Card>

      {/* Referrals Activity Card */}
      <Card className={`${config.padding} ${cardWidth} bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`${config.labelSize} font-medium text-teal-700 mb-1`}>Confirmed</p>
            <p className={`${config.numberSize} font-bold text-black`}>{userStats.friendsJoined}</p>
            <p className="text-xs text-teal-600 mt-1">Sent: {userStats.linksShared}</p>
          </div>
          <div className={`${config.iconPadding} bg-teal-500 rounded-xl`}>
            <UserPlus className={`${config.iconSize} text-white`} />
          </div>
        </div>
      </Card>

      {/* Current & Next Rewards Card */}
      <Card className={`${config.padding} ${cardWidth} bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`${config.labelSize} font-medium text-blue-700 mb-1`}>Current Reward</p>
            <p className={`text-sm font-bold text-black`}>{currentLevel.description}</p>
            {nextLevel ? (
              <p className="text-xs text-blue-600 mt-1">Next: {nextLevel.description}</p>
            ) : (
              <p className="text-xs text-blue-600 mt-1">Max level reached!</p>
            )}
          </div>
          <div className={`${config.iconPadding} bg-blue-500 rounded-xl`}>
            <currentLevel.icon className={`${config.iconSize} text-white`} />
          </div>
        </div>
      </Card>
    </div>
  );
}