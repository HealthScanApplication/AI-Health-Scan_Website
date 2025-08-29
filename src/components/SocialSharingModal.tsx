"use client";

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import { Copy, Gift, Heart, Mail, MessageCircle, Send, Phone, Twitter, Facebook, Linkedin, Instagram, MessageSquare, Share2, Users, Star, Trophy } from 'lucide-react';
import { copyToClipboard } from '../utils/copyUtils';

interface SocialSharingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  userPosition?: number | null;
  referralCode?: string;
  referralCount?: number;
  userName?: string;
  showAccountCreatedTitle?: boolean;
}

// Simplified ReferralProgress component specifically for modal
function ModalReferralProgress({ referralCount = 0 }: { referralCount: number }) {
  const getCurrentTier = () => {
    if (referralCount < 5) return { name: 'Waitlisted', progress: (referralCount / 5) * 100, nextGoal: 5 - referralCount, nextReward: 'Early Access' };
    if (referralCount < 15) return { name: 'Early Access', progress: ((referralCount - 5) / 10) * 100, nextGoal: 15 - referralCount, nextReward: '4 Free Weeks' };
    if (referralCount < 30) return { name: '4 Free Weeks', progress: ((referralCount - 15) / 15) * 100, nextGoal: 30 - referralCount, nextReward: '8 Free Weeks' };
    if (referralCount < 50) return { name: '8 Free Weeks', progress: ((referralCount - 30) / 20) * 100, nextGoal: 50 - referralCount, nextReward: '16 Free Weeks' };
    if (referralCount < 100) return { name: '16 Free Weeks', progress: ((referralCount - 50) / 50) * 100, nextGoal: 100 - referralCount, nextReward: '10% Revenue' };
    if (referralCount < 5000) return { name: '10% Revenue', progress: ((referralCount - 100) / 4900) * 100, nextGoal: 5000 - referralCount, nextReward: '20% Revenue' };
    return { name: '20% Revenue', progress: 100, nextGoal: 0, nextReward: 'Max Level!' };
  };

  const tier = getCurrentTier();

  return (
    <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 rounded-xl border border-emerald-200/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <Trophy className="w-3 h-3 text-white" />
          </div>
          <div>
            <div className="font-medium text-emerald-900">{tier.name}</div>
            <div className="text-xs text-emerald-700">{referralCount} referrals</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-emerald-900">{Math.round(tier.progress)}%</div>
          <div className="text-xs text-emerald-700">to next</div>
        </div>
      </div>
      
      {tier.nextGoal > 0 && (
        <>
          <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden mb-2">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${Math.max(tier.progress, 5)}%` }}
            />
          </div>
          <div className="text-xs text-emerald-800 text-center">
            <span className="font-medium">{tier.nextGoal} more</span> for <span className="font-bold">{tier.nextReward}</span>
          </div>
        </>
      )}
      
      {tier.nextGoal === 0 && (
        <div className="text-xs text-emerald-800 text-center font-medium">🌱 Maximum level achieved!</div>
      )}
    </div>
  );
}

export function SocialSharingModal({ 
  open, 
  onOpenChange, 
  userEmail, 
  userPosition,
  referralCode = '',
  referralCount = 0,
  userName = '',
  showAccountCreatedTitle = false
}: SocialSharingModalProps) {
  const [shareMessage, setShareMessage] = useState('');
  const [viewportHeight, setViewportHeight] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<'partner' | 'friend' | 'parent' | 'sibling' | 'family' | 'colleague'>('friend');
  
  // Default share message with proper HealthScan link
  const getReferralLink = () => {
    if (referralCode) {
      return `https://healthscan.live/${referralCode}`;
    }
    return 'https://healthscan.live';
  };

  // Memoize message templates with potential language and only green emojis
  const messageTemplates = useMemo(() => {
    const currentReferralLink = getReferralLink();
    return {
      partner: `Hey love! I found something that might help us make better food choices together. HealthScan could potentially reveal what's really in our food - both nutrients and possible pollutants.

Want to check it out with me? ${currentReferralLink} 🌱💚`,

      friend: `Hey! Have you heard about HealthScan? This might help us understand what potential pollutants & nutrients could be in our food.

Could be worth checking out: ${currentReferralLink} 🌱💚`,

      parent: `Fellow parent! Found something that might help us make better choices for our kids. HealthScan could potentially reveal what pollutants & nutrients are in their food.

Early access here: ${currentReferralLink} 🌱💚`,

      sibling: `Hey! Your sibling here with something interesting. Found this app called HealthScan that might help us understand what's actually in our food - the good and potentially concerning stuff.

Thought you'd want to check it out: ${currentReferralLink} 🌱💚`,

      family: `Hi family! Wanted to share something that could help all of us make better food choices. HealthScan might reveal what potential pollutants and nutrients are in the food we eat.

Let's explore this together: ${currentReferralLink} 🌱💚`,

      colleague: `Hi! I came across something that might interest you from a health perspective. HealthScan could potentially help us understand what's in our food - both nutritionally and concerning contaminants.

Worth exploring: ${currentReferralLink} 🌱💚`
    };
  }, [referralCode]);

  const getDefaultMessage = () => messageTemplates[selectedTemplate];

  // Initialize and update message when modal opens or template/referral changes
  useEffect(() => {
    const defaultMessage = getDefaultMessage();
    if (open) {
      // Always set the full message when modal opens or dependencies change
      setShareMessage(defaultMessage);
    }
  }, [open, referralCode, selectedTemplate, messageTemplates]);

  // Handle mobile viewport height changes
  useEffect(() => {
    if (!open) return;

    const updateViewportHeight = () => {
      // Use visualViewport API if available (best for mobile)
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        // Fallback to window.innerHeight
        setViewportHeight(window.innerHeight);
      }
    };

    // Set initial height
    updateViewportHeight();

    // Listen for viewport changes (mobile keyboard, orientation, etc.)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);
    } else {
      window.addEventListener('resize', updateViewportHeight);
      window.addEventListener('orientationchange', updateViewportHeight);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
        window.visualViewport.removeEventListener('scroll', updateViewportHeight);
      } else {
        window.removeEventListener('resize', updateViewportHeight);
        window.removeEventListener('orientationchange', updateViewportHeight);
      }
    };
  }, [open]);

  const handleFinishSharing = () => {
    toast.success('🌱 Great! Share it to earn rewards and climb the queue.');
    onOpenChange(false);
  };

  // Sharing functionality
  const referralLink = getReferralLink();

  const copyMessageAndLink = async () => {
    // Get the current user's personal message text from the textarea
    const userPersonalMessage = shareMessage.trim();
    
    // Ensure the message contains the correct referral link
    let finalMessage = ensureCorrectReferralLink(userPersonalMessage);
    
    // Only use default template if the message is truly empty or just whitespace
    if (userPersonalMessage.length === 0) {
      finalMessage = getDefaultMessage();
    }
    
    // Try to copy with simple settings
    const isUserContent = userPersonalMessage.length > 0;
    const success = await copyToClipboard(finalMessage, {
      successMessage: isUserContent ? '🌱 Your personal message copied!' : '🌱 Template message copied!',
      errorMessage: 'Please copy manually from the text area above',
      showManualCopy: true,
      timeout: 3000
    });
    
    if (success) {
      // Additional feedback for successful copy removed
    }
  };

  // Helper function to ensure the correct referral link is used while preserving user's personal message
  const ensureCorrectReferralLink = (userMessage: string) => {
    // Only return default template if user message is truly empty
    if (!userMessage || userMessage.trim().length === 0) {
      return getDefaultMessage();
    }
    
    // If message is just the referral code with no other content, use default
    if (userMessage.trim() === referralCode) {
      return getDefaultMessage();
    }
    
    const currentReferralLink = getReferralLink();
    
    // PRESERVE USER'S MESSAGE: Replace any existing healthscan.live links with the correct one
    const updatedMessage = userMessage.replace(
      /https:\/\/healthscan\.live(?:\/[^\s]*)?/g,
      currentReferralLink
    );
    
    // If no HealthScan link was found in user's message, append the referral link
    if (!updatedMessage.includes('healthscan.live')) {
      const finalMessage = `${updatedMessage}\n\nJoin here: ${currentReferralLink}`;
      return finalMessage;
    }
    
    return updatedMessage;
  };

  const shareViaWhatsApp = () => {
    const finalMessage = ensureCorrectReferralLink(shareMessage);
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(finalMessage)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    toast.success('🌱 WhatsApp opened!');
  };

  const shareViaTwitter = () => {
    const finalMessage = ensureCorrectReferralLink(shareMessage);
    // Add @healthscan.live handle to Twitter shares
    const twitterMessage = `${finalMessage}\n\nFollow @healthscan.live for updates! 🌱`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterMessage)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    toast.success('💚 Twitter opened!');
  };

  const shareViaFacebook = () => {
    const finalMessage = ensureCorrectReferralLink(shareMessage);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(finalMessage)}`;
    window.open(facebookUrl, '_blank', 'noopener,noreferrer');
    toast.success('🌱 Facebook opened!');
  };

  const shareViaFacebookMessenger = async () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      try {
        const messageText = ensureCorrectReferralLink(shareMessage);
        const messengerDeepLink = `fb-messenger://share/?text=${encodeURIComponent(messageText)}`;
        
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = messengerDeepLink;
        document.body.appendChild(iframe);
        
        setTimeout(() => {
          document.body.removeChild(iframe);
          const smsUrl = `sms:?body=${encodeURIComponent(messageText)}`;
          window.open(smsUrl, '_blank');
        }, 1500);
        
        toast.success('💚 Opening Messenger app...');
      } catch (error) {
        const finalMessage = ensureCorrectReferralLink(shareMessage);
        await copyToClipboard(finalMessage, {
          successMessage: '💚 Message copied! Share it manually in Messenger.',
        });
      }
    } else {
      if (navigator.share) {
        const finalMessage = ensureCorrectReferralLink(shareMessage);
        navigator.share({
          title: 'HealthScan - Food Transparency Revolution',
          text: finalMessage,
          url: referralLink,
        }).then(() => {
          toast.success('💚 Content shared successfully!');
        }).catch((error) => {
          if (error.name !== 'AbortError') {
            shareViaFacebook();
          }
        });
      } else {
        const finalMessage = ensureCorrectReferralLink(shareMessage);
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(finalMessage)}`;
        window.open(facebookUrl, '_blank', 'noopener,noreferrer');
        toast.success('💚 Facebook opened!');
      }
    }
  };

  const shareViaInstagram = async () => {
    const finalMessage = ensureCorrectReferralLink(shareMessage);
    // Add Instagram handle
    const instagramMessage = `${finalMessage}\n\nFollow @healthscan.live for updates! 🌱`;
    
    await copyToClipboard(instagramMessage, {
      successMessage: '🌱 Message copied! Paste it in Instagram.',
    });
    
    const instagramUrl = 'https://www.instagram.com/';
    window.open(instagramUrl, '_blank', 'noopener,noreferrer');
  };

  const shareViaLinkedIn = () => {
    const finalMessage = ensureCorrectReferralLink(shareMessage);
    // Add LinkedIn company page reference
    const linkedinMessage = `${finalMessage}\n\nConnect with HealthScan on LinkedIn! 💚`;
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}&summary=${encodeURIComponent(linkedinMessage)}`;
    window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
    toast.success('💚 LinkedIn opened!');
  };

  const shareViaTelegram = () => {
    const finalMessage = ensureCorrectReferralLink(shareMessage);
    // Add Telegram channel reference
    const telegramMessage = `${finalMessage}\n\nJoin @healthscanlive for updates! 🌱`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(telegramMessage)}`;
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
    toast.success('🌱 Telegram opened!');
  };

  const shareViaSMS = () => {
    const finalMessage = ensureCorrectReferralLink(shareMessage);
    const smsUrl = `sms:?body=${encodeURIComponent(finalMessage)}`;
    window.open(smsUrl, '_blank');
    toast.success('🌱 SMS app opened!');
  };

  const shareViaEmail = () => {
    const finalMessage = ensureCorrectReferralLink(shareMessage);
    const subject = encodeURIComponent('Join me in bringing transparency to our food system');
    const body = encodeURIComponent(finalMessage);
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
    
    window.open(mailtoLink, '_blank');
    toast.success('💚 Email app opened!');
  };

  const shareViaNativeAPI = async () => {
    if (navigator.share) {
      try {
        const finalMessage = ensureCorrectReferralLink(shareMessage);
        await navigator.share({
          title: 'HealthScan - Food Transparency Together',
          text: finalMessage,
          url: referralLink,
        });
        toast.success('🌱 Shared successfully!');
      } catch (error) {
        if (error.name !== 'AbortError') {
          await copyToClipboard(ensureCorrectReferralLink(shareMessage), {
            successMessage: '💚 Message copied as fallback!',
          });
        }
      }
    } else {
      await copyToClipboard(ensureCorrectReferralLink(shareMessage), {
        successMessage: '💚 Message copied!',
      });
    }
  };

  const handleTemplateChange = (template: 'partner' | 'friend' | 'parent' | 'sibling' | 'family' | 'colleague') => {
    setSelectedTemplate(template);
    const newMessage = messageTemplates[template];
    setShareMessage(newMessage);
    toast.success(`Switched to ${template} template`);
  };

  const getTemplateLabel = (template: 'partner' | 'friend' | 'parent' | 'sibling' | 'family' | 'colleague') => {
    switch (template) {
      case 'partner': return 'Partner';
      case 'friend': return 'Friend';
      case 'parent': return 'Parent';
      case 'sibling': return 'Sibling';
      case 'family': return 'Family';
      case 'colleague': return 'Colleague';
    }
  };

  // Get mobile-specific styles with dynamic height
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 480;
  const mobileStyle = isMobile && viewportHeight > 0 ? {
    height: `${viewportHeight - 8}px`, // 8px total gaps (4px top + 4px bottom)
    maxHeight: `${viewportHeight - 8}px`,
    minHeight: `${viewportHeight - 8}px`
  } : {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="modal-fullscreen-8px bg-white/95 backdrop-blur-sm border-0 rounded-xl shadow-2xl overflow-hidden flex flex-col scrollable-content modal-no-scroll"
        style={mobileStyle}
      >
        {/* Consistent Header with DialogHeader Components */}
        <DialogHeader className="pb-4 px-4 sm:px-6 pt-4 sm:pt-6 flex-shrink-0">
          <div className="text-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[var(--healthscan-green)] to-[var(--healthscan-light-green)] rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-3 sm:mb-4">
              <Share2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-2">
            {showAccountCreatedTitle ? (
              <>🎉 Account Created!<br />
              <span className="text-[var(--healthscan-green)]">Share & Earn Free Weeks</span></>
            ) : userPosition ? (
              <>🌱 You're #{userPosition}!<br />
              <span className="text-[var(--healthscan-green)]">Share & Earn Free Weeks</span></>
            ) : (
              <>🌱 Welcome!<br />
              <span className="text-[var(--healthscan-green)]">Share & Earn Free Weeks</span></>
            )}
          </DialogTitle>
          <DialogDescription className="text-[var(--healthscan-text-muted)] text-center text-sm">
            Share with friends to earn early access, free weeks, and revenue share rewards
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content with proper mobile spacing */}
        <div className="px-4 sm:px-6 flex-1 overflow-y-auto space-y-4 sm:space-y-6 scrollable-content pb-20 sm:pb-24">
          {/* Enhanced Template Selection Grid - Mobile Optimized */}
          <div>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-2 bg-gray-100 rounded-xl">
              {(['friend', 'family', 'partner', 'parent', 'sibling', 'colleague'] as const).map((template) => (
                <button
                  key={template}
                  onClick={() => handleTemplateChange(template)}
                  className={`px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 text-xs font-medium ${
                    selectedTemplate === template
                      ? 'bg-[var(--healthscan-green)] text-white shadow-sm'
                      : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-white'
                  }`}
                >
                  {getTemplateLabel(template)}
                </button>
              ))}
            </div>
          </div>

          {/* Message Editor - Mobile Optimized */}
          <div>
            <div className="relative">
              <Textarea
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                className="w-full min-h-[100px] sm:min-h-[120px] resize-none border-2 border-gray-200/50 focus:border-[var(--healthscan-green)] focus:ring-[var(--healthscan-green)]/20 rounded-xl p-3 sm:p-4 pr-10 sm:pr-12 bg-white/80 backdrop-blur-sm text-sm sm:text-base"
                placeholder="Customize your share message..."
              />
              {/* Copy Icon in Textarea */}
              <button
                onClick={copyMessageAndLink}
                className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 p-2 text-[var(--healthscan-text-muted)] hover:text-[var(--healthscan-green)] hover:bg-[var(--healthscan-bg-light)] rounded-lg transition-colors"
                title="Copy message with referral link"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-[var(--healthscan-text-muted)]">{shareMessage.length} characters</span>
            </div>
          </div>

          {/* Social Sharing Grid - Mobile Optimized with 3-Column Layout */}
          <div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                onClick={shareViaWhatsApp}
                className="flex items-center justify-center gap-1 sm:gap-3 h-10 sm:h-12 px-2 sm:px-4 bg-[var(--healthscan-bg-light)] hover:bg-green-100 border-2 border-[var(--healthscan-green)]/30 hover:border-[var(--healthscan-green)] text-[var(--healthscan-green)] rounded-xl transition-all duration-200"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">WhatsApp</span>
              </button>

              <button
                onClick={shareViaTelegram}
                className="flex items-center justify-center gap-1 sm:gap-3 h-10 sm:h-12 px-2 sm:px-4 bg-[var(--healthscan-bg-light)] hover:bg-green-100 border-2 border-[var(--healthscan-green)]/30 hover:border-[var(--healthscan-green)] text-[var(--healthscan-green)] rounded-xl transition-all duration-200"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Telegram</span>
              </button>

              <button
                onClick={shareViaSMS}
                className="flex items-center justify-center gap-1 sm:gap-3 h-10 sm:h-12 px-2 sm:px-4 bg-[var(--healthscan-bg-light)] hover:bg-green-100 border-2 border-[var(--healthscan-green)]/30 hover:border-[var(--healthscan-green)] text-[var(--healthscan-green)] rounded-xl transition-all duration-200"
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">SMS</span>
              </button>

              <button
                onClick={shareViaFacebookMessenger}
                className="flex items-center justify-center gap-1 sm:gap-3 h-10 sm:h-12 px-2 sm:px-4 bg-[var(--healthscan-bg-light)] hover:bg-green-100 border-2 border-[var(--healthscan-green)]/30 hover:border-[var(--healthscan-green)] text-[var(--healthscan-green)] rounded-xl transition-all duration-200"
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Messenger</span>
              </button>

              <button
                onClick={shareViaTwitter}
                className="flex items-center justify-center gap-1 sm:gap-3 h-10 sm:h-12 px-2 sm:px-4 bg-[var(--healthscan-bg-light)] hover:bg-green-100 border-2 border-[var(--healthscan-green)]/30 hover:border-[var(--healthscan-green)] text-[var(--healthscan-green)] rounded-xl transition-all duration-200"
              >
                <Twitter className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Twitter</span>
              </button>

              <button
                onClick={shareViaFacebook}
                className="flex items-center justify-center gap-1 sm:gap-3 h-10 sm:h-12 px-2 sm:px-4 bg-[var(--healthscan-bg-light)] hover:bg-green-100 border-2 border-[var(--healthscan-green)]/30 hover:border-[var(--healthscan-green)] text-[var(--healthscan-green)] rounded-xl transition-all duration-200"
              >
                <Facebook className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Facebook</span>
              </button>

              <button
                onClick={shareViaInstagram}
                className="flex items-center justify-center gap-1 sm:gap-3 h-10 sm:h-12 px-2 sm:px-4 bg-[var(--healthscan-bg-light)] hover:bg-green-100 border-2 border-[var(--healthscan-green)]/30 hover:border-[var(--healthscan-green)] text-[var(--healthscan-green)] rounded-xl transition-all duration-200"
              >
                <Instagram className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Instagram</span>
              </button>

              <button
                onClick={shareViaLinkedIn}
                className="flex items-center justify-center gap-1 sm:gap-3 h-10 sm:h-12 px-2 sm:px-4 bg-[var(--healthscan-bg-light)] hover:bg-green-100 border-2 border-[var(--healthscan-green)]/30 hover:border-[var(--healthscan-green)] text-[var(--healthscan-green)] rounded-xl transition-all duration-200"
              >
                <Linkedin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">LinkedIn</span>
              </button>

              <button
                onClick={shareViaEmail}
                className="flex items-center justify-center gap-1 sm:gap-3 h-10 sm:h-12 px-2 sm:px-4 bg-[var(--healthscan-bg-light)] hover:bg-green-100 border-2 border-[var(--healthscan-green)]/30 hover:border-[var(--healthscan-green)] text-[var(--healthscan-green)] rounded-xl transition-all duration-200"
              >
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Email</span>
              </button>
            </div>
          </div>

          {/* Compact Modal-Optimized Referral Progress */}
          <ModalReferralProgress referralCount={referralCount} />
        </div>

        {/* Fixed Footer with Mobile Optimization */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent backdrop-blur-sm border-t border-gray-200/50 p-4 sm:p-6 flex-shrink-0">
          {/* Black Button using global styling similar to refer friends */}
          <Button
            onClick={copyMessageAndLink}
            className="w-full h-12 sm:h-14 bg-black hover:bg-gray-800 text-white font-medium shadow-lg hover:shadow-xl border-0 rounded-xl text-base sm:text-lg transition-all duration-300 hover:animate-button-shake-fast group btn-major"
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:animate-bounce" />
            Copy & Share Message
          </Button>

          {/* Help text - Mobile Optimized */}
          <p className="text-xs text-[var(--healthscan-text-muted)] text-center mt-2 sm:mt-3">
            Both you and your friends get rewards - share to unlock free weeks together!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}