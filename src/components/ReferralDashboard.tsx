"use client";

import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner';
import { 
  Copy, 
  Share2, 
  Mail, 
  MessageCircle, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  Gift,
  TrendingUp,
  Send,
  Link as LinkIcon,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Star,
  Share,
  UserPlus,
  Award,
  RefreshCw,
  Trash2,
  Sparkles,
  AlertCircle,
  UserCheck,
  UserX
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { copyReferralLink } from '../utils/copyUtils';
import { ManualCopyInput } from './ManualCopyInput';

interface ReferralDashboardProps {
  userEmail: string;
  referralCode: string;
  currentReferrals: number;
}

interface PendingInvitation {
  invitationId: string;
  targetEmail: string;
  sentAt: string;
  status: 'pending' | 'accepted' | 'joined_without_referral';
  acceptedAt?: string;
  invitationType: string;
}

interface SentInvite {
  id: string;
  targetEmail: string;
  sentAt: string;
  status: 'sent' | 'accepted' | 'expired' | 'joined';
  acceptedAt?: string;
  lastSentAt: string;
  sentCount: number;
  emailExists?: boolean;
  isExistingUser?: boolean;
}

interface AcceptedReferral {
  email: string;
  name: string;
  joinedDate: string;
}

interface UserStats {
  linksShared: number;
  friendsJoined: number;
  totalPoints: number;
  sharePoints: number;
  joinPoints: number;
}

interface EmailValidationResult {
  exists: boolean;
  isUser: boolean;
  isInvited: boolean;
  message: string;
  type: 'success' | 'warning' | 'error';
}

export function ReferralDashboard({ userEmail, referralCode, currentReferrals }: ReferralDashboardProps) {
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [sentInvites, setSentInvites] = useState<SentInvite[]>([]);
  const [acceptedReferrals, setAcceptedReferrals] = useState<AcceptedReferral[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [emailValidation, setEmailValidation] = useState<EmailValidationResult | null>(null);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showSocialAfterEmail, setShowSocialAfterEmail] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    linksShared: 0,
    friendsJoined: currentReferrals,
    totalPoints: 0,
    sharePoints: 0,
    joinPoints: currentReferrals * 10
  });

  const referralLink = `${window.location.origin}/${referralCode}`;

  useEffect(() => {
    loadDashboardData();
  }, [userEmail, referralCode]);

  // Validate email when user types
  useEffect(() => {
    if (inviteEmail && inviteEmail.includes('@')) {
      const debounceTimer = setTimeout(() => {
        validateEmail(inviteEmail);
      }, 500);
      return () => clearTimeout(debounceTimer);
    } else {
      setEmailValidation(null);
    }
  }, [inviteEmail]);

  const validateEmail = async (email: string) => {
    setIsValidatingEmail(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/validate-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ 
            email: email.toLowerCase().trim(),
            senderEmail: userEmail 
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEmailValidation({
          exists: data.exists || false,
          isUser: data.isUser || false,
          isInvited: data.isInvited || false,
          message: data.message || '',
          type: data.type || 'success'
        });
      } else {
        setEmailValidation(null);
      }
    } catch (error) {
      console.error('Email validation error:', error);
      setEmailValidation(null);
    } finally {
      setIsValidatingEmail(false);
    }
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load user referral stats from real endpoint
      const userStatsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/user-referral-stats`,
        {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: userEmail, referralCode })
        }
      );

      if (userStatsResponse.ok) {
        const userData = await userStatsResponse.json();
        
        if (userData && userData.success && userData.stats) {
          // Safely access nested properties with comprehensive null checks
          const referralsData = userData.stats.referrals || {};
          const referredUsersArray = Array.isArray(referralsData.referredUsers) 
            ? referralsData.referredUsers 
            : [];
          
          // Set accepted referrals from real data with safe array handling
          const acceptedReferralsData = referredUsersArray.map((user: any, index: number) => ({
            email: `${user?.name || `user${index + 1}`}@example.com`, // Placeholder since we don't expose emails
            name: user?.name || `User ${index + 1}`,
            joinedDate: user?.joinedDate || new Date().toISOString()
          }));
          
          setAcceptedReferrals(acceptedReferralsData);
          
          // Calculate stats with safe access
          const referralsCount = typeof referralsData.count === 'number' 
            ? referralsData.count 
            : referredUsersArray.length;
          
          const friendsJoined = referralsCount;
          const linksShared = Math.max(friendsJoined, userData.stats.linksShared || 0);
          const sharePoints = linksShared * 1;
          const joinPoints = friendsJoined * 10;
          
          setUserStats({
            linksShared,
            friendsJoined,
            totalPoints: sharePoints + joinPoints,
            sharePoints,
            joinPoints
          });
        } else {
          // Set fallback data
          setPendingInvitations([]);
          setAcceptedReferrals([]);
          setUserStats({
            linksShared: 0,
            friendsJoined: currentReferrals,
            totalPoints: currentReferrals * 10,
            sharePoints: 0,
            joinPoints: currentReferrals * 10
          });
        }
      } else {
        setPendingInvitations([]);
        setAcceptedReferrals([]);
        setUserStats({
          linksShared: 0,
          friendsJoined: currentReferrals,
          totalPoints: currentReferrals * 10,
          sharePoints: 0,
          joinPoints: currentReferrals * 10
        });
      }

      // Load sent invites
      await loadSentInvites();

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSentInvites = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/get-sent-invites`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            senderEmail: userEmail,
            referralCode: referralCode
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.invites) {
          setSentInvites(data.invites);
        } else {
          setSentInvites([]);
        }
      } else {
        setSentInvites([]);
      }
    } catch (error) {
      setSentInvites([]);
    }
  };

  const trackShare = async (platform: string) => {
    try {
      // Track the share action and update stats
      const newLinksShared = userStats.linksShared + 1;
      const newSharePoints = newLinksShared * 1;
      const newTotalPoints = newSharePoints + userStats.joinPoints;
      
      setUserStats(prev => ({
        ...prev,
        linksShared: newLinksShared,
        sharePoints: newSharePoints,
        totalPoints: newTotalPoints
      }));

      console.log(`Tracked share on ${platform}`);
      
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  };

  const handleCopyReferralLink = async () => {
    await copyReferralLink(referralCode, window.location.origin, () => trackShare('copy'));
  };

  const shareViaEmail = async () => {
    try {
      const subject = encodeURIComponent('Join me on HealthScan - Know What You Eat!');
      const body = encodeURIComponent(
        `Hey! I wanted to share HealthScan with you - it's an amazing app that helps you scan food and uncover the truth about what you're eating.\n\nJoin the waitlist using my referral link and we'll both get rewards:\n${referralLink}\n\nLet's build a healthier future together! 🌱`
      );
      const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
      
      window.open(mailtoLink, '_blank');
      toast.success('📧 Email app opened with referral message!');
      await trackShare('email');
      setShowSocialModal(false);
      setShowSocialAfterEmail(false);
    } catch (error) {
      console.error('Email share failed:', error);
      handleCopyReferralLink(); // Fallback to copying the link
    }
  };

  const shareViaWhatsApp = async () => {
    try {
      const message = encodeURIComponent(
        `Hey! Check out HealthScan - scan any food and uncover the truth! Join using my link for rewards: ${referralLink}`
      );
      const whatsappLink = `https://wa.me/?text=${message}`;
      
      window.open(whatsappLink, '_blank', 'noopener,noreferrer');
      toast.success('📱 WhatsApp opened with referral message!');
      await trackShare('whatsapp');
      setShowSocialModal(false);
      setShowSocialAfterEmail(false);
    } catch (error) {
      console.error('WhatsApp share failed:', error);
      handleCopyReferralLink(); // Fallback to copying the link
    }
  };

  const shareViaTwitter = async () => {
    try {
      const text = encodeURIComponent(
        `Just joined @HealthScan waitlist! 🌱 Scan any food and uncover the truth. Join me for rewards:`
      );
      const twitterLink = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(referralLink)}`;
      
      window.open(twitterLink, '_blank', 'noopener,noreferrer');
      toast.success('🐦 Twitter opened with referral tweet!');
      await trackShare('twitter');
      setShowSocialModal(false);
      setShowSocialAfterEmail(false);
    } catch (error) {
      console.error('Twitter share failed:', error);
      handleCopyReferralLink(); // Fallback to copying the link
    }
  };

  const shareViaFacebook = async () => {
    try {
      const facebookLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
      
      window.open(facebookLink, '_blank', 'noopener,noreferrer');
      toast.success('📘 Facebook opened for sharing!');
      await trackShare('facebook');
      setShowSocialModal(false);
      setShowSocialAfterEmail(false);
    } catch (error) {
      console.error('Facebook share failed:', error);
      handleCopyReferralLink(); // Fallback to copying the link
    }
  };

  const shareViaLinkedIn = async () => {
    try {
      const linkedInLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`;
      
      window.open(linkedInLink, '_blank', 'noopener,noreferrer');
      toast.success('💼 LinkedIn opened for sharing!');
      await trackShare('linkedin');
      setShowSocialModal(false);
      setShowSocialAfterEmail(false);
    } catch (error) {
      console.error('LinkedIn share failed:', error);
      handleCopyReferralLink(); // Fallback to copying the link
    }
  };

  const shareViaNativeAPI = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'HealthScan - Know What You Eat',
          text: 'Join me on the HealthScan waitlist! Get early access to the app that reveals what\'s really in your food.',
          url: referralLink,
        });
        toast.success('📤 Shared successfully!');
        await trackShare('native');
        setShowSocialModal(false);
        setShowSocialAfterEmail(false);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Native share failed:', error);
          handleCopyReferralLink(); // Fallback to copying
        }
      }
    } else {
      handleCopyReferralLink(); // Fallback for browsers without native sharing
    }
  };

  const sendEmailInvitation = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Check validation status before sending
    if (emailValidation) {
      if (emailValidation.type === 'error') {
        toast.error(emailValidation.message);
        return;
      }
      if (emailValidation.type === 'warning' && (emailValidation.isUser || emailValidation.isInvited)) {
        toast.warning(emailValidation.message);
        return;
      }
    }

    setIsSendingInvite(true);
    const emailToSend = inviteEmail.toLowerCase().trim();
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/send-friend-invite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            targetEmail: emailToSend,
            senderEmail: userEmail,
            referralCode: referralCode,
            referralLink: referralLink
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        toast.success(`✉️ Invitation sent to ${emailToSend}!`);
        setInviteEmail('');
        setEmailValidation(null);
        
        // Add to sent invites list immediately for better UX
        const newInvite: SentInvite = {
          id: result.inviteId || `temp_${Date.now()}`,
          targetEmail: emailToSend,
          sentAt: new Date().toISOString(),
          lastSentAt: new Date().toISOString(),
          status: 'sent',
          sentCount: 1,
          emailExists: emailValidation?.exists || false,
          isExistingUser: emailValidation?.isUser || false
        };
        setSentInvites(prev => [newInvite, ...prev]);
        
        // Show social sharing modal after successful email send
        setTimeout(() => {
          setShowSocialAfterEmail(true);
        }, 800);
        
        // Also refresh from server to get the latest data
        setTimeout(async () => {
          await loadSentInvites();
        }, 500);
        
      } else {
        const errorText = await response.text();
        
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || 'Failed to send invitation';
        } catch {
          errorMessage = `Server error (${response.status}): ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }

    } catch (error) {
      console.error('❌ Error sending invitation:', error);
      toast.error(`Failed to send invitation: ${error.message}`);
    } finally {
      setIsSendingInvite(false);
    }
  };

  const resendInvitation = async (targetEmail: string, inviteId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/resend-friend-invite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            inviteId: inviteId,
            targetEmail: targetEmail,
            senderEmail: userEmail,
            referralCode: referralCode,
            referralLink: referralLink
          })
        }
      );

      if (response.ok) {
        toast.success(`✉️ Invitation resent to ${targetEmail}!`);
        
        // Update the sent invites list
        setSentInvites(prev => prev.map(invite => 
          invite.id === inviteId 
            ? { ...invite, lastSentAt: new Date().toISOString(), sentCount: invite.sentCount + 1 }
            : invite
        ));
        
        // Refresh dashboard data
        loadDashboardData();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resend invitation');
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error(`Failed to resend invitation: ${error.message}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'joined':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'joined_without_referral':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Accepted';
      case 'joined':
        return 'Joined';
      case 'joined_without_referral':
        return 'Joined without referral';
      case 'expired':
        return 'Expired';
      default:
        return 'Pending';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'joined':
        return 'default';
      case 'joined_without_referral':
      case 'expired':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getUserAvatarUrl = (email: string, index: number) => {
    // Generate a reliable avatar using UI Avatars service
    const emailPrefix = email.split('@')[0];
    
    // Create initials from email prefix
    let initials = '';
    if (emailPrefix.includes('.')) {
      const parts = emailPrefix.split('.');
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (emailPrefix.length >= 2) {
      initials = emailPrefix.substring(0, 2).toUpperCase();
    } else {
      initials = emailPrefix.toUpperCase().padEnd(2, 'X');
    }
    
    // Create a hash from email for consistent color selection
    const emailHash = email.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    
    // Define professional color combinations
    const colorPairs = [
      { bg: '16a34a', color: 'ffffff' }, // Green
      { bg: '3b82f6', color: 'ffffff' }, // Blue
      { bg: '8b5cf6', color: 'ffffff' }, // Purple
      { bg: 'f59e0b', color: 'ffffff' }, // Amber
      { bg: 'ef4444', color: 'ffffff' }, // Red
      { bg: '10b981', color: 'ffffff' }, // Emerald
      { bg: '6366f1', color: 'ffffff' }, // Indigo
      { bg: 'ec4899', color: 'ffffff' }, // Pink
      { bg: '059669', color: 'ffffff' }, // Teal
      { bg: 'd97706', color: 'ffffff' }, // Orange
    ];
    
    // Select color pair based on email hash and index
    const colorIndex = (emailHash + index) % colorPairs.length;
    const selectedColors = colorPairs[colorIndex];
    
    // Generate avatar URL with initials and colors
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=64&background=${selectedColors.bg}&color=${selectedColors.color}&rounded=true&bold=true&format=png`;
  };

  const EmailValidationDisplay = () => {
    if (!emailValidation && !isValidatingEmail) return null;

    if (isValidatingEmail) {
      return (
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
          <span>Checking email...</span>
        </div>
      );
    }

    if (!emailValidation) return null;

    const getValidationIcon = () => {
      switch (emailValidation.type) {
        case 'success':
          return <CheckCircle className="w-4 h-4 text-green-600" />;
        case 'warning':
          return <AlertCircle className="w-4 h-4 text-yellow-600" />;
        case 'error':
          return <XCircle className="w-4 h-4 text-red-600" />;
        default:
          return <AlertCircle className="w-4 h-4 text-gray-600" />;
      }
    };

    const getValidationColor = () => {
      switch (emailValidation.type) {
        case 'success':
          return 'text-green-700 bg-green-50 border-green-200';
        case 'warning':
          return 'text-yellow-700 bg-yellow-50 border-yellow-200';
        case 'error':
          return 'text-red-700 bg-red-50 border-red-200';
        default:
          return 'text-gray-700 bg-gray-50 border-gray-200';
      }
    };

    return (
      <div className={`flex items-center gap-2 text-sm p-2 border rounded-lg mt-2 ${getValidationColor()}`}>
        {getValidationIcon()}
        <span>{emailValidation.message}</span>
      </div>
    );
  };

  const SocialShareModalContent = ({ isFromEmail = false }) => (
    <DialogContent 
      className="sm:max-w-md bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-200"
      aria-describedby="social-share-description"
    >
      <DialogHeader>
        <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          Share to Earn Rewards
        </DialogTitle>
        <DialogDescription id="social-share-description" className="text-gray-600">
          {isFromEmail 
            ? "Great! Now multiply your reach by sharing on social media. Each share earns you 1 point!"
            : "Choose how you'd like to share your referral link. Each share earns you 1 point!"
          }
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid grid-cols-2 gap-3 mt-4">
        {navigator.share && (
          <Button 
            onClick={shareViaNativeAPI} 
            variant="outline" 
            className="h-16 flex flex-col gap-1 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-2 border-purple-300 hover:border-purple-400 transition-all duration-300"
          >
            <Share2 className="w-5 h-5 text-purple-600" />
            <span className="text-xs font-medium text-purple-700">Share</span>
          </Button>
        )}
        <Button 
          onClick={shareViaEmail} 
          variant="outline" 
          className="h-16 flex flex-col gap-1 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 border-2 border-red-300 hover:border-red-400 transition-all duration-300"
        >
          <Mail className="w-5 h-5 text-red-600" />
          <span className="text-xs font-medium text-red-700">Email</span>
        </Button>
        <Button 
          onClick={shareViaWhatsApp} 
          variant="outline" 
          className="h-16 flex flex-col gap-1 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-2 border-green-300 hover:border-green-400 transition-all duration-300"
        >
          <MessageCircle className="w-5 h-5 text-green-600" />
          <span className="text-xs font-medium text-green-700">WhatsApp</span>
        </Button>
        <Button 
          onClick={shareViaTwitter} 
          variant="outline" 
          className="h-16 flex flex-col gap-1 bg-gradient-to-r from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100 border-2 border-sky-300 hover:border-sky-400 transition-all duration-300"
        >
          <Twitter className="w-5 h-5 text-sky-600" />
          <span className="text-xs font-medium text-sky-700">Twitter</span>
        </Button>
        <Button 
          onClick={shareViaFacebook} 
          variant="outline" 
          className="h-16 flex flex-col gap-1 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-400 hover:border-blue-500 transition-all duration-300"
        >
          <Facebook className="w-5 h-5 text-blue-700" />
          <span className="text-xs font-medium text-blue-800">Facebook</span>
        </Button>
        <Button 
          onClick={shareViaLinkedIn} 
          variant="outline" 
          className="h-16 flex flex-col gap-1 bg-gradient-to-r from-cyan-50 to-teal-50 hover:from-cyan-100 hover:to-teal-100 border-2 border-cyan-300 hover:border-cyan-400 transition-all duration-300"
        >
          <Linkedin className="w-5 h-5 text-cyan-700" />
          <span className="text-xs font-medium text-cyan-800">LinkedIn</span>
        </Button>
      </div>

      <Separator className="my-4 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      
      <div className="space-y-3">
        <ManualCopyInput
          value={referralLink}
          successMessage="🔗 Link copied! +1 point earned"
          className="w-full border-2 border-blue-200 focus:border-blue-400"
          onCopy={() => trackShare('copy')}
        />
        <p className="text-xs text-gray-500 text-center bg-blue-50 p-2 rounded-lg">
          💡 Each share earns 1 point • Each friend who joins earns 10 points
        </p>
      </div>
    </DialogContent>
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Overview with new metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Links Shared</p>
              <p className="text-3xl font-bold text-blue-900">{userStats.linksShared}</p>
              <p className="text-xs text-blue-600 mt-1">+{userStats.sharePoints} points</p>
            </div>
            <div className="p-3 bg-blue-500 rounded-xl">
              <Share className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">Friends Joined</p>
              <p className="text-3xl font-bold text-green-900">{userStats.friendsJoined}</p>
              <p className="text-xs text-green-600 mt-1">+{userStats.joinPoints} points</p>
            </div>
            <div className="p-3 bg-green-500 rounded-xl">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-700 mb-1">Total Points</p>
              <p className="text-3xl font-bold text-yellow-900">{userStats.totalPoints}</p>
              <p className="text-xs text-yellow-600 mt-1">Rewards earned</p>
            </div>
            <div className="p-3 bg-yellow-500 rounded-xl">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Send Direct Invitation Section */}
      <Card className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-600" />
            Send Direct Invitation
          </h3>
        </div>
        
        <p className="text-sm text-[var(--healthscan-text-muted)] mb-4">
          ✉️ Send personalized email invitations directly to your friends and get notified when they join!
        </p>
        
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              type="email"
              placeholder="friend@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="h-12 border-2 border-emerald-200 focus:border-emerald-400"
              disabled={isSendingInvite}
            />
            <EmailValidationDisplay />
          </div>
          <Button 
            onClick={sendEmailInvitation}
            disabled={isSendingInvite || !inviteEmail || (emailValidation?.type === 'error')}
            className="h-12 px-6 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isSendingInvite ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Invite
              </>
            )}
          </Button>
        </div>

        {/* Sent Invitations History */}
        {sentInvites.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Sent Invitations ({sentInvites.length})
            </h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {sentInvites.map((invite, index) => (
                <div key={invite.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={getUserAvatarUrl(invite.targetEmail, index)} />
                      <AvatarFallback>{invite.targetEmail.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{invite.targetEmail}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Sent {formatDateTime(invite.sentAt)}</span>
                        {invite.sentCount > 1 && (
                          <span className="text-blue-600">• Resent {invite.sentCount - 1} times</span>
                        )}
                        {invite.isExistingUser && (
                          <Badge variant="secondary" className="text-xs">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Existing User
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(invite.status)} className="text-xs">
                      {getStatusIcon(invite.status)}
                      <span className="ml-1">{getStatusText(invite.status)}</span>
                    </Badge>
                    {invite.status === 'sent' && (
                      <Button
                        onClick={() => resendInvitation(invite.targetEmail, invite.id)}
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Resend
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Referral Link Section */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-green-600" />
            Your Referral Link
          </h3>
          
          <Dialog open={showSocialModal} onOpenChange={setShowSocialModal}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Users className="w-4 h-4 mr-2" />
                Refer Friends
              </Button>
            </DialogTrigger>
            <SocialShareModalContent />
          </Dialog>
        </div>
        
        <p className="text-sm text-[var(--healthscan-text-muted)] mb-4">
          🎁 Refer friends and earn rewards! Share your link and get points for every share and friend who joins.
        </p>
        
        <ManualCopyInput
          value={referralLink}
          successMessage="🔗 Referral link copied to clipboard!"
          className="w-full"
          onCopy={() => trackShare('copy')}
        />
      </Card>

      {/* Social Share Modal After Email */}
      <Dialog open={showSocialAfterEmail} onOpenChange={setShowSocialAfterEmail}>
        <DialogContent aria-describedby="social-share-after-email-description">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Share to Earn Rewards
            </DialogTitle>
            <DialogDescription id="social-share-after-email-description" className="text-gray-600">
              Great! Now multiply your reach by sharing on social media. Each share earns you 1 point!
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-3 mt-4">
            {navigator.share && (
              <Button 
                onClick={shareViaNativeAPI} 
                variant="outline" 
                className="h-16 flex flex-col gap-1 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-2 border-purple-300 hover:border-purple-400 transition-all duration-300"
              >
                <Share2 className="w-5 h-5 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">Share</span>
              </Button>
            )}
            <Button 
              onClick={shareViaEmail} 
              variant="outline" 
              className="h-16 flex flex-col gap-1 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 border-2 border-red-300 hover:border-red-400 transition-all duration-300"
            >
              <Mail className="w-5 h-5 text-red-600" />
              <span className="text-xs font-medium text-red-700">Email</span>
            </Button>
            <Button 
              onClick={shareViaWhatsApp} 
              variant="outline" 
              className="h-16 flex flex-col gap-1 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-2 border-green-300 hover:border-green-400 transition-all duration-300"
            >
              <MessageCircle className="w-5 h-5 text-green-600" />
              <span className="text-xs font-medium text-green-700">WhatsApp</span>
            </Button>
            <Button 
              onClick={shareViaTwitter} 
              variant="outline" 
              className="h-16 flex flex-col gap-1 bg-gradient-to-r from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100 border-2 border-sky-300 hover:border-sky-400 transition-all duration-300"
            >
              <Twitter className="w-5 h-5 text-sky-600" />
              <span className="text-xs font-medium text-sky-700">Twitter</span>
            </Button>
            <Button 
              onClick={shareViaFacebook} 
              variant="outline" 
              className="h-16 flex flex-col gap-1 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-400 hover:border-blue-500 transition-all duration-300"
            >
              <Facebook className="w-5 h-5 text-blue-700" />
              <span className="text-xs font-medium text-blue-800">Facebook</span>
            </Button>
            <Button 
              onClick={shareViaLinkedIn} 
              variant="outline" 
              className="h-16 flex flex-col gap-1 bg-gradient-to-r from-cyan-50 to-teal-50 hover:from-cyan-100 hover:to-teal-100 border-2 border-cyan-300 hover:border-cyan-400 transition-all duration-300"
            >
              <Linkedin className="w-5 h-5 text-cyan-700" />
              <span className="text-xs font-medium text-cyan-800">LinkedIn</span>
            </Button>
          </div>

          <Separator className="my-4 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          
          <div className="space-y-3">
            <ManualCopyInput
              value={referralLink}
              successMessage="🔗 Link copied! +1 point earned"
              className="w-full border-2 border-blue-200 focus:border-blue-400"
              onCopy={() => trackShare('copy')}
            />
            <p className="text-xs text-gray-500 text-center bg-blue-50 p-2 rounded-lg">
              💡 Each share earns 1 point • Each friend who joins earns 10 points
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}