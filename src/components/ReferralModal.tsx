import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Copy, Share2, Users, TrendingUp, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { useReferral } from '../utils/useReferral';

interface ReferralModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userPosition?: number;
  totalWaitlist?: number;
}

export function ReferralModal({ 
  open, 
  onOpenChange, 
  userPosition,
  totalWaitlist 
}: ReferralModalProps) {
  const { referralCode, hasReferral } = useReferral();
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (referralCode) {
      const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/ref/${referralCode}`;
      setReferralLink(link);
    }
  }, [referralCode]);

  const copyToClipboard = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOnTwitter = () => {
    const text = `Join me on HealthScan! 🌱 Get early access to revolutionary AI-powered health scanning. Use my referral code: ${referralCode}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`;
    window.open(url, '_blank');
  };

  const shareOnLinkedIn = () => {
    const text = `I'm on the HealthScan waitlist! 🌱 Join me and get early access to revolutionary AI-powered health scanning. Use my referral code: ${referralCode}`;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share & Move Up
          </DialogTitle>
          <DialogDescription>
            Invite friends to HealthScan and move up in the queue
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Queue Position Info */}
          {userPosition && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Your Position</p>
                  <p className="text-2xl font-bold text-blue-600">#{userPosition}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600 opacity-50" />
              </div>
              {totalWaitlist && (
                <p className="text-xs text-gray-500 mt-2">
                  Out of {totalWaitlist} people on the waitlist
                </p>
              )}
            </div>
          )}

          {/* Referral Code */}
          {referralCode && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Your Referral Code</label>
              <div className="flex gap-2">
                <Input
                  value={referralCode}
                  readOnly
                  className="font-mono text-center"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyToClipboard}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          )}

          {/* Referral Link */}
          {referralLink && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Referral Link</label>
              <div className="flex gap-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyToClipboard}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Gift className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-gray-900">Move Up Faster</p>
                <p className="text-xs text-gray-600">Each referral moves you up 3-10 positions</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-gray-900">Earn Free Weeks</p>
                <p className="text-xs text-gray-600">Get free access when HealthScan launches</p>
              </div>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Share on Social</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={shareOnTwitter}
                className="flex-1"
              >
                𝕏 Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareOnLinkedIn}
                className="flex-1"
              >
                in LinkedIn
              </Button>
            </div>
          </div>

          {/* Close Button */}
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
