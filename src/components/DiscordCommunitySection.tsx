import React from 'react';
import { ExternalLink, Users, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

// Discord logo SVG component
const DiscordLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

export function DiscordCommunitySection() {
  const handleJoinDiscord = () => {
    window.open('https://discord.gg/4QJpFyTD44', '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-[var(--healthscan-bg-light)] to-green-50/50 relative overflow-hidden">
      {/* Clean background pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-emerald-100/20" />
        <div className="absolute top-20 left-10 w-64 h-64 bg-[var(--healthscan-green)]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Section - Clean and minimal */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-md border border-gray-100 mb-8">
            <DiscordLogo className="w-8 h-8 text-[#5865F2]" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Join Our Community
          </h2>
          
          <p className="text-lg text-[var(--healthscan-text-muted)] max-w-2xl mx-auto leading-relaxed">
            Connect with health-conscious people uncovering food transparency together
          </p>
        </div>

        {/* Community Benefits Cards - Clean design */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Health Community Card */}
          <Card className="p-6 bg-white border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--healthscan-green)]/10 rounded-xl mb-4">
                <Users className="w-6 h-6 text-[var(--healthscan-green)]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Health Community</h3>
              <p className="text-sm text-[var(--healthscan-text-muted)] leading-relaxed">
                Connect with like-minded people focused on food transparency and health
              </p>
            </div>
          </Card>

          {/* Live Support Card */}
          <Card className="p-6 bg-white border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--healthscan-green)]/10 rounded-xl mb-4">
                <MessageSquare className="w-6 h-6 text-[var(--healthscan-green)]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Live Support</h3>
              <p className="text-sm text-[var(--healthscan-text-muted)] leading-relaxed">
                Get direct help from our team and quick answers to your questions
              </p>
            </div>
          </Card>

          {/* Early Access Card */}
          <Card className="p-6 bg-white border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--healthscan-green)]/10 rounded-xl mb-4">
                <Sparkles className="w-6 h-6 text-[var(--healthscan-green)]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Early Access</h3>
              <p className="text-sm text-[var(--healthscan-text-muted)] leading-relaxed">
                Preview new features and provide feedback on upcoming tools
              </p>
            </div>
          </Card>
        </div>

        {/* CTA Section - Major CTA button design matching Back Project style */}
        <div className="text-center">
          <Button 
            onClick={handleJoinDiscord}
            className="btn-major w-80 mx-auto inline-flex bg-gradient-to-r from-[var(--healthscan-green)] to-[var(--healthscan-light-green)] hover:from-[var(--healthscan-light-green)] hover:to-[var(--healthscan-green)] text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:animate-button-shake group"
          >
            <span className="text-lg">Join Community</span>
            <ExternalLink className="w-4 h-4 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
          </Button>
          
          <p className="text-sm text-[var(--healthscan-text-muted)] mt-4">
            Free • No spam • Health-focused community
          </p>
        </div>
      </div>
    </section>
  );
}