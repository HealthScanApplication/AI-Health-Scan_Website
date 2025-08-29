import React from 'react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Users, Star, Trophy, Crown, Gift, Award, Sparkles } from 'lucide-react';

interface ReferralTierProgressProps {
  referralCount: number;
  className?: string;
}

interface Tier {
  id: number;
  name: string;
  minReferrals: number;
  maxReferrals: number;
  reward: string;
  icon: React.ComponentType<any>;
  colors: {
    bg: string;
    border: string;
    text: string;
    progress: string;
  };
}

export function ReferralTierProgress({ referralCount = 0, className = '' }: ReferralTierProgressProps) {
  const tiers: Tier[] = [
    {
      id: 1,
      name: "Tier 1",
      minReferrals: 0,
      maxReferrals: 4,
      reward: "Waitlisted",
      icon: Users,
      colors: {
        bg: "from-teal-50/40 to-teal-100/40",
        border: "border-teal-200/60",
        text: "text-teal-700",
        progress: "bg-gradient-to-r from-teal-300/60 to-teal-400/60"
      }
    },
    {
      id: 2,
      name: "Tier 2",
      minReferrals: 5,
      maxReferrals: 14,
      reward: "Early Access",
      icon: Sparkles,
      colors: {
        bg: "from-teal-100/50 to-teal-150/50",
        border: "border-teal-300/60",
        text: "text-teal-800",
        progress: "bg-gradient-to-r from-teal-400/60 to-teal-500/60"
      }
    },
    {
      id: 3,
      name: "Tier 3",
      minReferrals: 15,
      maxReferrals: 29,
      reward: "4 Free Weeks",
      icon: Star,
      colors: {
        bg: "from-teal-150/50 to-teal-200/50",
        border: "border-teal-400/60",
        text: "text-teal-800",
        progress: "bg-gradient-to-r from-teal-500/60 to-teal-600/60"
      }
    },
    {
      id: 4,
      name: "Tier 4",
      minReferrals: 30,
      maxReferrals: 49,
      reward: "8 Free Weeks",
      icon: Trophy,
      colors: {
        bg: "from-teal-200/60 to-teal-250/60",
        border: "border-teal-400/60",
        text: "text-teal-900",
        progress: "bg-gradient-to-r from-teal-600/60 to-teal-700/60"
      }
    },
    {
      id: 5,
      name: "Tier 5",
      minReferrals: 50,
      maxReferrals: 99,
      reward: "16 Free Weeks",
      icon: Crown,
      colors: {
        bg: "from-teal-250/60 to-teal-300/60",
        border: "border-teal-500/60",
        text: "text-teal-900",
        progress: "bg-gradient-to-r from-teal-700/60 to-teal-800/60"
      }
    },
    {
      id: 6,
      name: "Tier 6",
      minReferrals: 100,
      maxReferrals: 4999,
      reward: "10% Revenue Share",
      icon: Gift,
      colors: {
        bg: "from-teal-300/50 to-teal-400/50",
        border: "border-teal-500/60",
        text: "text-teal-900",
        progress: "bg-gradient-to-r from-teal-800/60 to-teal-900/60"
      }
    },
    {
      id: 7,
      name: "Tier 7",
      minReferrals: 5000,
      maxReferrals: Infinity,
      reward: "20% Revenue Share",
      icon: Award,
      colors: {
        bg: "from-teal-400/60 to-teal-500/60",
        border: "border-teal-600/60",
        text: "text-teal-950",
        progress: "bg-gradient-to-r from-teal-900/60 to-teal-950/60"
      }
    }
  ];

  // Find current tier
  const currentTierIndex = tiers.findIndex(tier => 
    referralCount >= tier.minReferrals && referralCount <= tier.maxReferrals
  );
  const currentTier = tiers[currentTierIndex] || tiers[0];
  const nextTier = tiers[currentTierIndex + 1] || null;

  // Calculate progress to next tier
  const getProgressToNextTier = () => {
    if (!nextTier) return 100; // Max tier reached
    
    const progressInCurrentTier = referralCount - currentTier.minReferrals;
    const totalReferralsNeededForNextTier = nextTier.minReferrals - currentTier.minReferrals;
    
    return Math.min(100, (progressInCurrentTier / totalReferralsNeededForNextTier) * 100);
  };

  const progress = getProgressToNextTier();

  return (
    <Card className={`p-6 bg-gradient-to-br from-white to-teal-50/30 border-teal-200/60 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h4 className="text-lg font-bold text-gray-900 mb-2">Referral Rewards System</h4>
          <p className="text-sm text-gray-600">Unlock amazing rewards by sharing HealthScan with friends</p>
        </div>

        {/* Current Tier Display */}
        <div className={`p-4 rounded-xl bg-gradient-to-r ${currentTier.colors.bg} border-2 ${currentTier.colors.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-white/80 rounded-lg shadow-sm`}>
                <currentTier.icon className={`w-5 h-5 ${currentTier.colors.text}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xl font-bold ${currentTier.colors.text}`}>{currentTier.reward}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{currentTier.name}</span>
                  <span className="text-xs bg-white/70 px-2 py-1 rounded-full text-gray-700 font-medium">
                    {referralCount} referrals
                  </span>
                </div>
              </div>
            </div>
            {currentTierIndex === 6 && (
              <div className="text-lg font-bold text-teal-800">MAX</div>
            )}
          </div>

          {/* Progress to Next Tier */}
          {nextTier && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-700">Progress to next reward</span>
                <span className="text-gray-700 font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full ${currentTier.colors.progress} transition-all duration-500 ease-out rounded-full animate-pulse`}
                  style={{ width: `${Math.max(progress, 10)}%` }}
                />
              </div>
              <div className="text-xs text-gray-700 text-center">
                <span className="font-medium">
                  {nextTier.minReferrals - referralCount} more referrals
                </span>
                {' '}for <span className={`font-bold ${nextTier.colors.text}`}>{nextTier.reward}</span>
              </div>
            </div>
          )}
        </div>

        {/* All Tiers Overview */}
        <div className="space-y-3">
          <h5 className="font-semibold text-gray-900 text-sm">All Available Rewards</h5>
          <div className="grid grid-cols-1 gap-2">
            {tiers.map((tier, index) => {
              const isCompleted = referralCount >= tier.minReferrals;
              const isCurrent = currentTier.id === tier.id;
              const isNext = nextTier?.id === tier.id;
              
              return (
                <div
                  key={tier.id}
                  className={`
                    flex items-center justify-between p-3 rounded-lg border transition-all duration-300
                    ${isCurrent 
                      ? `bg-gradient-to-r ${tier.colors.bg} ${tier.colors.border} border-2` 
                      : isCompleted 
                      ? 'bg-teal-50/60 border-teal-200/60' 
                      : isNext
                      ? `bg-gradient-to-r ${nextTier.colors.bg} ${nextTier.colors.border}`
                      : 'bg-gray-50/60 border-gray-200/60'
                    }
                    ${isCurrent ? 'shadow-md scale-[1.02]' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      p-1.5 rounded-lg
                      ${isCurrent 
                        ? 'bg-white/80 shadow-sm' 
                        : isCompleted 
                        ? 'bg-teal-100/60' 
                        : isNext
                        ? 'bg-white/80'
                        : 'bg-gray-100/60'
                      }
                    `}>
                      <tier.icon className={`
                        w-4 h-4
                        ${isCurrent 
                          ? tier.colors.text 
                          : isCompleted 
                          ? 'text-teal-700' 
                          : isNext
                          ? nextTier.colors.text
                          : 'text-gray-500'
                        }
                      `} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`
                          text-base font-bold
                          ${isCurrent 
                            ? tier.colors.text 
                            : isCompleted 
                            ? 'text-teal-800' 
                            : isNext
                            ? nextTier.colors.text
                            : 'text-gray-600'
                          }
                        `}>
                          {tier.reward}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">{tier.name}</span>
                        {tier.maxReferrals === Infinity ? (
                          <span className="text-xs text-gray-400">{tier.minReferrals}+ referrals</span>
                        ) : (
                          <span className="text-xs text-gray-400">{tier.minReferrals}-{tier.maxReferrals} referrals</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {isCompleted && !isCurrent && (
                      <div className="text-teal-600">✓</div>
                    )}
                    {isCurrent && (
                      <div className={`${tier.colors.text} animate-pulse`}>•</div>
                    )}
                    {isNext && (
                      <div className={`${nextTier.colors.text}`}>→</div>
                    )}
                    {!isCompleted && !isCurrent && !isNext && (
                      <div className="text-gray-300">○</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Motivational Message */}
        <div className={`text-center p-4 rounded-lg border ${ 
          currentTierIndex === 6 
            ? `bg-gradient-to-r ${currentTier.colors.bg} ${currentTier.colors.border}`
            : nextTier 
            ? `bg-gradient-to-r ${nextTier.colors.bg} ${nextTier.colors.border}`
            : 'bg-gradient-to-r from-gray-50/60 to-gray-100/60 border-gray-200/60'
        }`}>
          <p className="text-sm text-gray-700">
            {currentTierIndex === 6 ? (
              <span><strong>Congratulations!</strong> You've reached the maximum reward level with <strong className={currentTier.colors.text}>20% Revenue Share</strong>!</span>
            ) : nextTier ? (
              <span>You're <strong>{nextTier.minReferrals - referralCount} referrals away</strong> from <strong className={nextTier.colors.text}>{nextTier.reward}</strong></span>
            ) : (
              <span>Keep sharing to unlock valuable rewards</span>
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}