import React from 'react';
import { Card } from './ui/card';
import { Users, MessageSquare, Sparkles } from 'lucide-react';

interface DiscordCommunityCardsProps {
  layout?: 'vertical' | 'horizontal';
  className?: string;
}

// Discord logo SVG component
const DiscordLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

export function DiscordCommunityCards({ layout = 'vertical', className = '' }: DiscordCommunityCardsProps) {

  // Responsive configuration
  const config = {
    padding: 'p-4 lg:p-6',
    iconSize: 'w-6 h-6 lg:w-7 lg:h-7',
    iconPadding: 'p-2.5 lg:p-3',
    numberSize: 'text-2xl lg:text-3xl',
    labelSize: 'text-sm lg:text-base',
  };

  const cardWidth = 'w-full sm:w-80 lg:w-96';

  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col sm:flex-row gap-3 lg:gap-4 ${className}`}>
        
        {/* Health Community Card - Purple Theme */}
        <Card className={`${config.padding} flex-1 lg:min-w-[200px] bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 hover:shadow-lg transition-all duration-300`}>
          <div className="flex flex-col items-center text-center h-full">
            {/* Icon Section */}
            <div className={`${config.iconPadding} bg-purple-500 rounded-xl mb-3`}>
              <Users className={`${config.iconSize} text-white`} />
            </div>
            
            {/* Content Section */}
            <div className="flex-1 flex flex-col justify-between w-full space-y-2">
              <div className="space-y-1">
                <p className={`${config.labelSize} font-medium text-purple-700`}>Health Community</p>
                <p className={`text-sm font-bold text-black`}>Connect & Learn</p>
              </div>
              
              {/* Bottom Section */}
              <div className="pt-2 border-t border-purple-200/50">
                <div className="flex items-center justify-center gap-2 text-xs">
                  <span className="text-purple-600">Health-focused discussions</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Live Support Card - Blue Theme */}
        <Card className={`${config.padding} flex-1 lg:min-w-[200px] bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200 hover:shadow-lg transition-all duration-300`}>
          <div className="flex flex-col items-center text-center h-full">
            {/* Icon Section */}
            <div className={`${config.iconPadding} bg-blue-500 rounded-xl mb-3`}>
              <MessageSquare className={`${config.iconSize} text-white`} />
            </div>
            
            {/* Content Section */}
            <div className="flex-1 flex flex-col justify-between w-full space-y-2">
              <div className="space-y-1">
                <p className={`${config.labelSize} font-medium text-blue-700`}>Live Support</p>
                <p className={`text-sm font-bold text-black`}>Get Help Fast</p>
              </div>
              
              {/* Bottom Section */}
              <div className="pt-2 border-t border-blue-200/50">
                <div className="flex items-center justify-center gap-2 text-xs">
                  <span className="text-blue-600">Direct team support</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Early Access Card - Green Theme */}
        <Card className={`${config.padding} flex-1 lg:min-w-[200px] bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 hover:shadow-lg transition-all duration-300`}>
          <div className="flex flex-col items-center text-center h-full">
            {/* Icon Section */}
            <div className={`${config.iconPadding} bg-green-500 rounded-xl mb-3`}>
              <Sparkles className={`${config.iconSize} text-white`} />
            </div>
            
            {/* Content Section */}
            <div className="flex-1 flex flex-col justify-between w-full space-y-2">
              <div className="space-y-1">
                <p className={`${config.labelSize} font-medium text-green-700`}>Early Access</p>
                <p className={`text-sm font-bold text-black`}>Beta Features</p>
              </div>
              
              {/* Bottom Section */}
              <div className="pt-2 border-t border-green-200/50">
                <div className="flex items-center justify-center gap-2 text-xs">
                  <span className="text-green-600">Preview new tools</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

      </div>
    );
  }

  // Horizontal layout for other use cases
  return (
    <div className={`flex flex-col gap-3 lg:gap-4 ${className}`}>
      
      {/* Health Community Card */}
      <Card className={`${config.padding} ${cardWidth} bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`${config.labelSize} font-medium text-purple-700 mb-1`}>Health Community</p>
            <p className={`text-sm font-bold text-black`}>Connect & Learn</p>
            <p className="text-xs text-purple-600 mt-1">Health-focused discussions</p>
          </div>
          <div className={`${config.iconPadding} bg-purple-500 rounded-xl`}>
            <Users className={`${config.iconSize} text-white`} />
          </div>
        </div>
      </Card>

      {/* Live Support Card */}
      <Card className={`${config.padding} ${cardWidth} bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`${config.labelSize} font-medium text-blue-700 mb-1`}>Live Support</p>
            <p className={`text-sm font-bold text-black`}>Get Help Fast</p>
            <p className="text-xs text-blue-600 mt-1">Direct team support</p>
          </div>
          <div className={`${config.iconPadding} bg-blue-500 rounded-xl`}>
            <MessageSquare className={`${config.iconSize} text-white`} />
          </div>
        </div>
      </Card>

      {/* Early Access Card */}
      <Card className={`${config.padding} ${cardWidth} bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`${config.labelSize} font-medium text-green-700 mb-1`}>Early Access</p>
            <p className={`text-sm font-bold text-black`}>Beta Features</p>
            <p className="text-xs text-green-600 mt-1">Preview new tools</p>
          </div>
          <div className={`${config.iconPadding} bg-green-500 rounded-xl`}>
            <Sparkles className={`${config.iconSize} text-white`} />
          </div>
        </div>
      </Card>

    </div>
  );
}