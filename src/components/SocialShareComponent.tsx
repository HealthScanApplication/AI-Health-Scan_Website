"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Copy, ExternalLink, MessageCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface SocialShareComponentProps {
  title: string;
  description: string;
  url: string;
  hashtags?: string[];
  imageUrl?: string;
  layout?: 'grid' | 'list' | 'compact';
  showTitle?: boolean;
  className?: string;
}

interface SocialPlatform {
  name: string;
  icon: React.ReactNode;
  color: string;
  hoverColor: string;
  generateUrl: (title: string, description: string, url: string, hashtags: string[], imageUrl?: string) => string;
  copyAction?: boolean;
}

export function SocialShareComponent({
  title,
  description,
  url,
  hashtags = [],
  imageUrl,
  layout = 'grid',
  showTitle = true,
  className = ''
}: SocialShareComponentProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, platform: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(platform);
      toast.success(`${platform} content copied to clipboard!`);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(platform);
      toast.success(`${platform} content copied to clipboard!`);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const socialPlatforms: SocialPlatform[] = [
    {
      name: 'Twitter',
      icon: (
        <div className="w-5 h-5 bg-blue-500 rounded text-white flex items-center justify-center text-xs font-bold">
          𝕏
        </div>
      ),
      color: 'border-blue-200',
      hoverColor: 'hover:bg-blue-50 hover:border-blue-300',
      generateUrl: (title, description, url, hashtags) => {
        const text = `${title}\n\n${description}`;
        const hashtagString = hashtags.map(tag => `#${tag}`).join(' ');
        const fullText = hashtagString ? `${text}\n\n${hashtagString}` : text;
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}&url=${encodeURIComponent(url)}`;
      }
    },
    {
      name: 'Facebook',
      icon: (
        <div className="w-5 h-5 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold">
          f
        </div>
      ),
      color: 'border-blue-200',
      hoverColor: 'hover:bg-blue-50 hover:border-blue-300',
      generateUrl: (title, description, url) => {
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(`${title}\n\n${description}`)}`;
      }
    },
    {
      name: 'LinkedIn',
      icon: (
        <div className="w-5 h-5 bg-blue-700 rounded text-white flex items-center justify-center text-xs font-bold">
          in
        </div>
      ),
      color: 'border-blue-200',
      hoverColor: 'hover:bg-blue-50 hover:border-blue-300',
      generateUrl: (title, description, url) => {
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(`${title}\n\n${description}`)}`;
      }
    },
    {
      name: 'WhatsApp',
      icon: (
        <div className="w-5 h-5 bg-green-500 rounded text-white flex items-center justify-center text-xs font-bold">
          W
        </div>
      ),
      color: 'border-green-200',
      hoverColor: 'hover:bg-green-50 hover:border-green-300',
      generateUrl: (title, description, url) => {
        const text = `${title}\n\n${description}\n\n${url}`;
        return `https://wa.me/?text=${encodeURIComponent(text)}`;
      }
    },
    {
      name: 'Discord',
      icon: (
        <div className="w-5 h-5 bg-indigo-600 rounded text-white flex items-center justify-center text-xs font-bold">
          D
        </div>
      ),
      color: 'border-indigo-200',
      hoverColor: 'hover:bg-indigo-50 hover:border-indigo-300',
      generateUrl: (title, description, url) => {
        return `${title}\n\n${description}\n\n${url}`;
      },
      copyAction: true
    },
    {
      name: 'Telegram',
      icon: (
        <div className="w-5 h-5 bg-blue-500 rounded text-white flex items-center justify-center text-xs font-bold">
          T
        </div>
      ),
      color: 'border-blue-200',
      hoverColor: 'hover:bg-blue-50 hover:border-blue-300',
      generateUrl: (title, description, url) => {
        const text = `${title}\n\n${description}`;
        return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
      }
    },
    {
      name: 'Reddit',
      icon: (
        <div className="w-5 h-5 bg-orange-500 rounded text-white flex items-center justify-center text-xs font-bold">
          R
        </div>
      ),
      color: 'border-orange-200',
      hoverColor: 'hover:bg-orange-50 hover:border-orange-300',
      generateUrl: (title, description, url) => {
        return `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
      }
    }
  ];

  const handleShare = (platform: SocialPlatform) => {
    const shareUrl = platform.generateUrl(title, description, url, hashtags, imageUrl);
    
    if (platform.copyAction) {
      copyToClipboard(shareUrl, platform.name);
    } else {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const copyLink = () => {
    copyToClipboard(url, 'Link');
  };

  const getLayoutClasses = () => {
    switch (layout) {
      case 'list':
        return 'flex flex-col gap-2';
      case 'compact':
        return 'flex flex-wrap gap-2';
      case 'grid':
      default:
        return 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3';
    }
  };

  const getButtonSize = () => {
    return layout === 'compact' ? 'w-10 h-10' : layout === 'list' ? 'w-full h-12 justify-start' : 'h-12';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {showTitle && (
        <div className="text-center">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Share with friends</h4>
          <p className="text-sm text-[var(--healthscan-text-muted)]">
            Help spread the word about HealthScan!
          </p>
        </div>
      )}

      {/* Social Platform Buttons */}
      <div className={getLayoutClasses()}>
        {socialPlatforms.map((platform) => (
          <Button
            key={platform.name}
            onClick={() => handleShare(platform)}
            variant="outline"
            className={`${getButtonSize()} flex items-center ${layout === 'list' ? 'gap-3' : layout === 'compact' ? 'justify-center p-0' : 'justify-center gap-2'} ${platform.color} ${platform.hoverColor} transition-colors`}
          >
            {platform.icon}
            {layout !== 'compact' && (
              <span className={`${layout === 'list' ? 'text-sm' : 'text-sm'} font-medium text-gray-700`}>
                {platform.name}
              </span>
            )}
            {copied === platform.name && layout !== 'compact' && (
              <span className="text-xs text-[var(--healthscan-green)]">✓</span>
            )}
          </Button>
        ))}
      </div>

      {/* Copy Link Button */}
      <div className="pt-2 border-t border-gray-100">
        <Button
          onClick={copyLink}
          variant="outline"
          className="w-full h-12 border-[var(--healthscan-green)]/30 hover:bg-[var(--healthscan-green)]/10 hover:border-[var(--healthscan-green)]/50 transition-colors"
        >
          <Copy className="w-4 h-4 mr-2" />
          <span className="text-[var(--healthscan-green)] font-medium">
            {copied === 'Link' ? 'Link Copied!' : 'Copy Link'}
          </span>
          {copied === 'Link' && (
            <span className="text-xs text-[var(--healthscan-green)] ml-1">✓</span>
          )}
        </Button>
      </div>

      {/* Share Message Preview */}
      {layout === 'list' && (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <h5 className="font-medium text-gray-900 mb-2">Preview</h5>
          <div className="text-sm text-gray-700 space-y-1">
            <p className="font-medium">{title}</p>
            <p>{description}</p>
            <p className="text-[var(--healthscan-green)] break-all">{url}</p>
            {hashtags.length > 0 && (
              <p className="text-blue-600">
                {hashtags.map(tag => `#${tag}`).join(' ')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}