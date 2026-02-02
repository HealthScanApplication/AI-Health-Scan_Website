import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Trophy, Users, Gift, Crown, Medal, Award, Star, TrendingUp, AlertTriangle, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface LeaderboardUser {
  name: string;
  email?: string;
  referral_code: string;
  referral_count: number;
  reward?: string;
  created_at?: string;
  rank: number;
  position_change?: number; // Positive = moved up, negative = moved down, 0 = no change
  previous_rank?: number;
  joinedDate?: string;
  lastReferralDate?: string;
  isAnonymous?: boolean;
}

interface LeaderboardResponse {
  success: boolean;
  leaderboard: LeaderboardUser[];
  message?: string;
  databaseAvailable?: boolean;
}

export function ReferralLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [databaseConnected, setDatabaseConnected] = useState<boolean>(false);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏆 Fetching referral leaderboard...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/referral-leaderboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log(`🏆 Leaderboard endpoint not available (${response.status})`);
        
        setLeaderboard([]);
        setDatabaseConnected(false);
        setError(`Unable to load leaderboard (${response.status})`);
        return;
      }

      const data: LeaderboardResponse = await response.json();
      
      if (data.success && data.leaderboard && Array.isArray(data.leaderboard)) {
        console.log('✅ Real leaderboard loaded:', data.leaderboard.length, 'users');
        
        const transformedLeaderboard = data.leaderboard.map((user: any, index: number) => ({
          name: user.name || `User ${index + 1}`,
          email: user.email || '',
          referral_code: user.referral_code || user.referralCode || `ref_${index + 1}`,
          referral_count: user.referral_count ?? user.referrals ?? 0,
          reward: user.reward || getRewardTier(user.referral_count ?? user.referrals ?? 0).tier,
          created_at: user.created_at || user.joinedDate || new Date().toISOString(),
          rank: user.rank || (index + 1),
          position_change: user.position_change || 0,
          joinedDate: user.joinedDate,
          lastReferralDate: user.lastReferralDate,
          isAnonymous: user.isAnonymous || false
        }));
        
        setLeaderboard(transformedLeaderboard);
        setDatabaseConnected(data.databaseAvailable !== false);
        setError(null);
      } else {
        console.warn('⚠️ Leaderboard API returned failure or empty data');
        setLeaderboard([]);
        setDatabaseConnected(data?.databaseAvailable !== false);
        setError('No referral activity yet - start sharing to see the leaderboard!');
      }

    } catch (fetchError: any) {
      if (fetchError.name === 'AbortError') {
        console.error('🏆 Leaderboard request timeout');
        setError('Request timed out - please check your connection and try again');
      } else if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
        console.error('🏆 Network error:', fetchError.message);
        setError('Network error - unable to reach the server');
      } else {
        console.error('🏆 Leaderboard fetch error:', fetchError.message);
        setError('Unable to load leaderboard data - please try again');
      }
      setLeaderboard([]);
      setDatabaseConnected(false);
    } finally {
      setLoading(false);
    }
  };



  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <Star className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPositionGradient = (position: number) => {
    switch (position) {
      case 1:
        return "from-yellow-400 via-yellow-500 to-yellow-600";
      case 2:
        return "from-gray-300 via-gray-400 to-gray-500";
      case 3:
        return "from-amber-400 via-amber-500 to-amber-600";
      default:
        return "from-green-400 via-green-500 to-green-600";
    }
  };

  const getUserInitials = (name: string) => {
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getUserAvatarUrl = (name: string, email: string, index: number) => {
    // Create a reliable avatar using UI Avatars service
    // This service generates consistent avatars based on initials and colors
    const initials = getUserInitials(name);
    
    // Create a hash from email for consistent color selection
    const emailHash = email.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    
    // Define a set of professional color combinations
    const colorPairs = [
      { bg: '16a34a', color: 'ffffff' }, // Green
      { bg: '3b82f6', color: 'ffffff' }, // Blue
      { bg: '8b5cf6', color: 'ffffff' }, // Purple
      { bg: 'f59e0b', color: 'ffffff' }, // Amber
      { bg: 'ef4444', color: 'ffffff' }, // Red
      { bg: '10b981', color: 'ffffff' }, // Emerald
      { bg: '6366f1', color: 'ffffff' }, // Indigo
      { bg: 'ec4899', color: 'ffffff' }, // Pink
    ];
    
    // Select color pair based on email hash and position
    const colorIndex = (emailHash + index) % colorPairs.length;
    const selectedColors = colorPairs[colorIndex];
    
    // Generate avatar URL with initials and colors
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=64&background=${selectedColors.bg}&color=${selectedColors.color}&rounded=true&bold=true&format=png`;
  };

  const getPositionChangeIcon = (change: number) => {
    if (change > 0) {
      return <ArrowUp className="h-4 w-4 text-green-600" />;
    } else if (change < 0) {
      return <ArrowDown className="h-4 w-4 text-red-600" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPositionChangeText = (change: number) => {
    if (change > 0) {
      return `+${change}`;
    } else if (change < 0) {
      return `${change}`;
    } else {
      return "—";
    }
  };

  const getPositionChangeColor = (change: number) => {
    if (change > 0) {
      return "text-green-600 bg-green-50";
    } else if (change < 0) {
      return "text-red-600 bg-red-50";
    } else {
      return "text-gray-500 bg-gray-50";
    }
  };

  const getRewardTier = (referralCount: number) => {
    if (referralCount >= 50) {
      return { tier: "Premium (20 Weeks)", color: "bg-pink-100 text-pink-800" };
    } else if (referralCount >= 40) {
      return { tier: "Premium (16 Weeks)", color: "bg-orange-100 text-orange-800" };
    } else if (referralCount >= 30) {
      return { tier: "Premium (12 Weeks)", color: "bg-yellow-100 text-yellow-800" };
    } else if (referralCount >= 20) {
      return { tier: "Premium (8 Weeks)", color: "bg-purple-100 text-purple-800" };
    } else if (referralCount >= 10) {
      return { tier: "Premium (4 Weeks)", color: "bg-blue-100 text-blue-800" };
    } else if (referralCount >= 5) {
      return { tier: "Early Access", color: "bg-green-100 text-green-800" };
    } else {
      return { tier: "Basic Access", color: "bg-gray-100 text-gray-800" };
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <section id="leaderboard" className="py-16 bg-gradient-to-br from-emerald-100 via-green-50 to-teal-50 relative overflow-hidden">
      {/* Green theme background enhancement */}
      <div className="absolute inset-0">
        <div className="absolute w-96 h-96 rounded-full opacity-20 animate-blob-float-1"
             style={{
               background: `radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, rgba(22, 163, 74, 0.15) 50%, transparent 70%)`,
               top: "10%",
               left: "5%",
               filter: "blur(40px)",
             }}></div>
        <div className="absolute w-80 h-80 rounded-full opacity-15 animate-blob-float-3"
             style={{
               background: `radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)`,
               bottom: "15%",
               right: "10%",
               filter: "blur(35px)",
             }}></div>
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 bg-green-100 text-green-800">
            🏆 Leaderboard
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
            Share to Unlock Rewards
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Help friends discover HealthScan and earn exclusive rewards. The more you share, the more you save!
          </p>
        </div>

        {/* Status indicator for database connection */}
        {error && !loading && (
          <div className="mb-6">
            <Alert className="border-amber-200 bg-amber-50">
              <TrendingUp className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                {error} Join the waitlist and start sharing your referral link to see the leaderboard in action!
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {!databaseConnected && !loading && !error && (
          <div className="mb-6">
            <Alert className="border-blue-200 bg-blue-50">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Setting up live referral tracking... The leaderboard will populate as users start sharing!
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Leaderboard */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <Card className="border-green-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Trophy className="h-6 w-6" />
                      Top Referrers
                    </CardTitle>
                    <CardDescription className="text-green-100">
                      Leading the charge to healthier choices
                    </CardDescription>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={fetchLeaderboard}
                    disabled={loading}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    {loading ? "Loading..." : "Refresh"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading leaderboard...</p>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="p-6 lg:p-8 text-center">
                    <Users className="h-10 w-10 lg:h-12 lg:w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-2">Be the First!</h3>
                    <p className="text-sm lg:text-base text-gray-600">
                      Join the waitlist and start sharing your referral link to appear on the leaderboard
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {leaderboard.map((user, index) => {
                      const position = index + 1;
                      return (
                        <div 
                          key={`${user.referral_code}-${index}`}
                          className={`p-4 lg:p-6 hover:bg-gray-50 transition-colors ${
                            position <= 3 ? 'bg-gradient-to-r from-green-50 to-emerald-50' : ''
                          }`}
                        >
                          {/* Mobile Layout */}
                          <div className="flex flex-col sm:hidden space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {/* Rank Number */}
                                <div className={`
                                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                                  ${position <= 3 
                                    ? `bg-gradient-to-r ${getPositionGradient(position)} text-white shadow-md` 
                                    : 'bg-gray-100 text-gray-600'
                                  }
                                `}>
                                  {position <= 3 ? getPositionIcon(position) : position}
                                </div>
                                
                                {/* User Avatar */}
                                <Avatar className="w-10 h-10 border-2 border-white shadow-md">
                                  <AvatarImage 
                                    src={getUserAvatarUrl(user.name, user.email, index)} 
                                    alt={`${user.name} avatar`}
                                    className="object-cover"
                                  />
                                  <AvatarFallback className={`
                                    ${position <= 3 
                                      ? `bg-gradient-to-r ${getPositionGradient(position)} text-white` 
                                      : 'bg-gray-100 text-gray-600'
                                    } font-semibold text-sm
                                  `}>
                                    {getUserInitials(user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    {user.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {user.referral_count} referrals
                                  </div>
                                </div>
                              </div>
                              
                              {/* Position Change Indicator */}
                              <div className={`
                                flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                                ${getPositionChangeColor(user.position_change)}
                              `}>
                                {getPositionChangeIcon(user.position_change)}
                                <span>{getPositionChangeText(user.position_change)}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-gray-500">
                                <span>Code: {user.referral_code}</span>
                              </div>
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${getRewardTier(user.referral_count).color}`}
                              >
                                {getRewardTier(user.referral_count).tier}
                              </Badge>
                            </div>
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden sm:flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-3">
                                {/* Rank Number */}
                                <div className={`
                                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                                  ${position <= 3 
                                    ? `bg-gradient-to-r ${getPositionGradient(position)} text-white shadow-md` 
                                    : 'bg-gray-100 text-gray-600'
                                  }
                                `}>
                                  {position <= 3 ? getPositionIcon(position) : position}
                                </div>
                                
                                {/* User Avatar */}
                                <div className="relative">
                                  <Avatar className="w-12 h-12 border-2 border-white shadow-md">
                                    <AvatarImage 
                                      src={getUserAvatarUrl(user.name, user.email, index)} 
                                      alt={`${user.name} avatar`}
                                      className="object-cover"
                                    />
                                    <AvatarFallback className={`
                                      ${position <= 3 
                                        ? `bg-gradient-to-r ${getPositionGradient(position)} text-white` 
                                        : 'bg-gray-100 text-gray-600'
                                      } font-semibold
                                    `}>
                                      {getUserInitials(user.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <div className="font-semibold text-gray-900 text-lg">
                                    {user.name}
                                  </div>
                                  {/* Position Change Indicator */}
                                  <div className={`
                                    flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                                    ${getPositionChangeColor(user.position_change)}
                                  `}>
                                    {getPositionChangeIcon(user.position_change)}
                                    <span>{getPositionChangeText(user.position_change)}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <span>Code: {user.referral_code}</span>
                                  <span>•</span>
                                  <Badge 
                                    variant="secondary" 
                                    className={`text-xs ${getRewardTier(user.referral_count).color}`}
                                  >
                                    {getRewardTier(user.referral_count).tier}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="font-bold text-xl text-gray-900">
                                {user.referral_count}
                              </div>
                              <div className="text-sm text-gray-500">referrals</div>
                              {user.previous_rank && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Was #{user.previous_rank}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Rewards Info */}
          <div className="space-y-4 lg:space-y-6 order-1 lg:order-2">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Gift className="h-5 w-5" />
                  Reward Tiers
                </CardTitle>
                <CardDescription>
                  Unlock exclusive benefits based on your referrals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 lg:space-y-4">
                <div className="flex items-center justify-between p-2 lg:p-3 bg-pink-50 rounded-lg border border-pink-200">
                  <div>
                    <div className="font-medium text-pink-800 text-sm lg:text-base">50+ Referrals</div>
                    <div className="text-xs lg:text-sm text-pink-600">Premium (20 Weeks)</div>
                  </div>
                  <Crown className="h-5 w-5 lg:h-6 lg:w-6 text-pink-500 flex-shrink-0" />
                </div>
                
                <div className="flex items-center justify-between p-2 lg:p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <div className="font-medium text-orange-800 text-sm lg:text-base">40+ Referrals</div>
                    <div className="text-xs lg:text-sm text-orange-600">Premium (16 Weeks)</div>
                  </div>
                  <Medal className="h-5 w-5 lg:h-6 lg:w-6 text-orange-500 flex-shrink-0" />
                </div>
                
                <div className="flex items-center justify-between p-2 lg:p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <div className="font-medium text-yellow-800 text-sm lg:text-base">30+ Referrals</div>
                    <div className="text-xs lg:text-sm text-yellow-600">Premium (12 Weeks)</div>
                  </div>
                  <Award className="h-5 w-5 lg:h-6 lg:w-6 text-yellow-500 flex-shrink-0" />
                </div>
                
                <div className="flex items-center justify-between p-2 lg:p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div>
                    <div className="font-medium text-purple-800 text-sm lg:text-base">20+ Referrals</div>
                    <div className="text-xs lg:text-sm text-purple-600">Premium (8 Weeks)</div>
                  </div>
                  <Star className="h-5 w-5 lg:h-6 lg:w-6 text-purple-500 flex-shrink-0" />
                </div>
                
                <div className="flex items-center justify-between p-2 lg:p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <div className="font-medium text-blue-800 text-sm lg:text-base">10+ Referrals</div>
                    <div className="text-xs lg:text-sm text-blue-600">Premium (4 Weeks)</div>
                  </div>
                  <Star className="h-5 w-5 lg:h-6 lg:w-6 text-blue-500 flex-shrink-0" />
                </div>
                
                <div className="flex items-center justify-between p-2 lg:p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <div className="font-medium text-green-800 text-sm lg:text-base">5+ Referrals</div>
                    <div className="text-xs lg:text-sm text-green-600">Early Access</div>
                  </div>
                  <Star className="h-5 w-5 lg:h-6 lg:w-6 text-green-500 flex-shrink-0" />
                </div>

                <div className="mt-3 lg:mt-4 p-2 lg:p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2 text-sm lg:text-base">
                    <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4" />
                    Position Changes
                  </h4>
                  <div className="space-y-1 text-xs lg:text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <ArrowUp className="h-3 w-3 text-green-600 flex-shrink-0" />
                      <span>Green = moved up</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowDown className="h-3 w-3 text-red-600 flex-shrink-0" />
                      <span>Red = moved down</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Minus className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span>Dash = no change</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-4 lg:p-6 text-center">
                <div className="mb-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-green-800 mb-2 text-sm lg:text-base">Ready to Start?</h3>
                  <p className="text-green-700 text-xs lg:text-sm mb-4">
                    Join the waitlist to get your unique referral link and start earning rewards
                  </p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs lg:text-sm">
                  🚀 Get your link after signup
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}