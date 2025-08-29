import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { copyToClipboard } from '../utils/copyUtils';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralLink: string;
}

interface SocialPlatform {
  name: string;
  icon: string;
  color: string;
  shareUrl: (url: string, text: string) => string;
  customText?: string;
}

export function SocialShareModal({ isOpen, onClose, referralLink }: SocialShareModalProps) {
  const shareTitle = 'HealthScan - Know What You Eat';
  const shareText = `Mind-blowing! 🤯 HealthScan exposes what food companies have been hiding - toxin levels, nutrient density, chemical clearance times. Big Food is NOT going to like this level of transparency! Join NOW to lock in your early adopter spot!

Reserve your spot: ${referralLink}

Be part of the movement they fear most! 🍎`;
  
  const socialPlatforms: SocialPlatform[] = [
    {
      name: 'Twitter/X',
      icon: '𝕏',
      color: 'bg-black hover:bg-gray-800',
      shareUrl: (url, text) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      customText: `Mind-blowing! 🤯 HealthScan exposes what food companies have been hiding - toxin levels, nutrient density, chemical clearance times. Big Food is NOT going to like this level of transparency! Join NOW to lock in your early adopter spot!

Reserve your spot: ${referralLink}

Be part of the movement they fear most! 🍎`
    },
    {
      name: 'LinkedIn',
      icon: 'in',
      color: 'bg-blue-600 hover:bg-blue-700',
      shareUrl: (url, text) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`,
      customText: `Mind-blowing! 🤯 HealthScan exposes what food companies have been hiding - toxin levels, nutrient density, chemical clearance times. Big Food is NOT going to like this level of transparency! Join NOW to lock in your early adopter spot!

Reserve your spot: ${referralLink}

Be part of the movement they fear most! 🍎`
    },
    {
      name: 'Facebook',
      icon: 'f',
      color: 'bg-blue-500 hover:bg-blue-600',
      shareUrl: (url, text) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
      customText: `Mind-blowing! 🤯 HealthScan exposes what food companies have been hiding - toxin levels, nutrient density, chemical clearance times. Big Food is NOT going to like this level of transparency! Join NOW to lock in your early adopter spot!

Reserve your spot: ${referralLink}

Be part of the movement they fear most! 🍎`
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      color: 'bg-green-500 hover:bg-green-600',
      shareUrl: (url, text) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      customText: `Mind-blowing! 🤯 HealthScan exposes what food companies have been hiding - toxin levels, nutrient density, chemical clearance times. Big Food is NOT going to like this level of transparency! Join NOW to lock in your early adopter spot!

Reserve your spot: ${referralLink}

Be part of the movement they fear most! 🍎`
    },
    {
      name: 'Telegram',
      icon: '✈️',
      color: 'bg-blue-400 hover:bg-blue-500',
      shareUrl: (url, text) => `https://telegram.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      customText: `Mind-blowing! 🤯 HealthScan exposes what food companies have been hiding - toxin levels, nutrient density, chemical clearance times. Big Food is NOT going to like this level of transparency! Join NOW to lock in your early adopter spot!

Reserve your spot: ${referralLink}

Be part of the movement they fear most! 🍎`
    },
    {
      name: 'Reddit',
      icon: '🤖',
      color: 'bg-orange-500 hover:bg-orange-600',
      shareUrl: (url, text) => `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(shareTitle)}`,
      customText: `Mind-blowing! 🤯 HealthScan exposes what food companies have been hiding - toxin levels, nutrient density, chemical clearance times. Big Food is NOT going to like this level of transparency! Join NOW to lock in your early adopter spot!

Reserve your spot: ${referralLink}

Be part of the movement they fear most! 🍎`
    }
  ];

  const handleSocialShare = async (platform: SocialPlatform) => {
    const textToShare = platform.customText || shareText;
    const shareUrl = platform.shareUrl(referralLink, textToShare);
    
    try {
      window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
      toast.success(`Opened ${platform.name} to share your referral link!`);
    } catch (error) {
      console.error(`Error opening ${platform.name}:`, error);
      // Fallback - copy the text
      await copyToClipboard(textToShare, {
        successMessage: `${platform.name} share text copied! Paste it manually.`,
        errorMessage: `Failed to open ${platform.name}`
      });
    }
  };

  const handleCopyFullMessage = async () => {
    const fullMessage = `${shareText}\n\n${referralLink}`;
    await copyToClipboard(fullMessage, {
      successMessage: "Full share message copied! Paste it anywhere you'd like to share.",
      errorMessage: "Failed to copy share message"
    });
  };

  const handleCopyLinkOnly = async () => {
    await copyToClipboard(referralLink, {
      successMessage: "Referral link copied to clipboard!",
      errorMessage: "Failed to copy referral link"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Share Your Referral Link
            </DialogTitle>
            <DialogDescription className="sr-only">
              Share your HealthScan referral link on social media or copy it to share manually. Earn rewards for every person who joins using your link.
            </DialogDescription>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Social Platforms */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Share on social media</h4>
            <div className="grid grid-cols-2 gap-3">
              {socialPlatforms.map((platform) => (
                <Button
                  key={platform.name}
                  onClick={() => handleSocialShare(platform)}
                  className={`${platform.color} text-white font-medium h-12 flex items-center justify-center gap-2 border-0 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <span className="text-lg">{platform.icon}</span>
                  <span className="text-sm">{platform.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Copy Options */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Copy to share manually</h4>
            <div className="space-y-2">
              <Button
                onClick={handleCopyFullMessage}
                variant="outline"
                className="w-full h-12 font-medium hover:bg-gray-50 border-gray-200"
              >
                📋 Copy Full Message
              </Button>
              <Button
                onClick={handleCopyLinkOnly}
                variant="outline"
                className="w-full h-12 font-medium hover:bg-gray-50 border-gray-200"
              >
                🔗 Copy Link Only
              </Button>
            </div>
          </div>

          {/* Referral Link Preview */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Your referral link:</p>
            <div className="font-mono text-sm text-teal-600 break-all bg-white px-2 py-1 rounded border">
              {referralLink}
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Share your link to earn rewards for every person who joins!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}