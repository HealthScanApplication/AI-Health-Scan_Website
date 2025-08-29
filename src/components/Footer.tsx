import {
  Heart,
  Mail,
  Twitter,
  Instagram,
  Facebook,
  ExternalLink,
  TreePine,
  Shield,
  Users,
  Zap,
  Target,
  Coffee,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner@2.0.3";
import healthScanLogo from 'figma:asset/cf2e65f2699becd01c6c8ddad2c65d7f0e9a7c42.png';

interface FooterProps {}

// Brand logo SVG components
const TikTokLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const DiscordLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const LinktreeLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" strokeWidth="2">
    <path d="M12 3L20 12L12 21L4 12L12 3Z" stroke="currentColor" fill="none"/>
    <path d="M8 12H16" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 8V16" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
  </svg>
);

const TelegramLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.58 7.44c-.12.539-.432.667-.864.416l-2.388-1.764-1.152 1.116c-.128.128-.236.236-.484.236l.172-2.436 4.456-4.028c.196-.172-.04-.268-.308-.096L9.788 13.22l-2.304-.724c-.5-.156-.508-.5.108-.74L19.544 7.368c.42-.156.78.096.656.792z"/>
  </svg>
);

const WhatsAppLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
  </svg>
);

export function Footer({}: FooterProps = {}) {
  const [contactForm, setContactForm] = useState({ email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDonateClick = () => {
    window.open(
      "https://jfd.gumroad.com/coffee",
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.email || !contactForm.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create mailto link as fallback since we don't have a backend endpoint for contact form
      const subject = encodeURIComponent('Contact from HealthScan Website');
      const body = encodeURIComponent(`From: ${contactForm.email}\n\nMessage:\n${contactForm.message}`);
      const mailtoLink = `mailto:hello@healthscan.live?subject=${subject}&body=${body}`;
      
      window.open(mailtoLink);
      toast.success('Opening your email client...');
      setContactForm({ email: '', message: '' });
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-slate-900 text-white py-16 px-4 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Floating blobs with darker tones for footer */}
        <div className="absolute w-80 h-80 rounded-full opacity-3 animate-blob-float-1"
             style={{
               background: `radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, rgba(22, 163, 74, 0.08) 50%, transparent 70%)`,
               top: "10%",
               right: "5%",
               filter: "blur(40px)",
             }}></div>
        
        <div className="absolute w-64 h-64 rounded-full opacity-4 animate-blob-float-3"
             style={{
               background: `radial-gradient(circle, rgba(251, 146, 60, 0.12) 0%, rgba(249, 115, 22, 0.06) 50%, transparent 70%)`,
               bottom: "20%",
               left: "10%",
               filter: "blur(35px)",
             }}></div>
        
        <div className="absolute w-56 h-56 rounded-full opacity-5 animate-blob-float-5"
             style={{
               background: `radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(79, 70, 229, 0.09) 50%, transparent 70%)`,
               top: "50%",
               left: "50%",
               filter: "blur(30px)",
             }}></div>
        
        <div className="absolute w-44 h-44 rounded-full opacity-6 animate-blob-float-7"
             style={{
               background: `radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)`,
               bottom: "10%",
               right: "30%",
               filter: "blur(25px)",
             }}></div>
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 items-start">
          
          {/* Brand Section with Mission */}
          <div className="md:col-span-1 pb-4 md:pb-0 border-b md:border-b-0 border-gray-700/50 flex flex-col justify-center min-h-[240px]">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="flex items-center mb-4">
                <img 
                  src={healthScanLogo} 
                  alt="HealthScan" 
                  className="h-8 w-auto mr-3"
                />
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">
                    HealthScan
                  </h3>
                  <span className="px-1 py-0.5 bg-gray-600 text-gray-300 text-[10px] font-medium rounded-sm opacity-60">
                    BETA
                  </span>
                </div>
              </div>
              
              {/* Mission Statement */}
              <div className="space-y-3">

                
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm text-gray-300">
                    <Shield className="w-4 h-4 mt-0.5 text-[var(--healthscan-green)] flex-shrink-0" />
                    <span>Protect your health with real-time ingredient analysis</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-300">
                    <Users className="w-4 h-4 mt-0.5 text-[var(--healthscan-green)] flex-shrink-0" />
                    <span>Empower families to make informed food choices</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-300">
                    <Target className="w-4 h-4 mt-0.5 text-[var(--healthscan-green)] flex-shrink-0" />
                    <span>Create transparency in the food industry</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-300">
                    <TreePine className="w-4 h-4 mt-0.5 text-[var(--healthscan-green)] flex-shrink-0" />
                    <span>Build a healthier world for future generations</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Section */}
          <div className="pb-4 md:pb-0 border-b md:border-b-0 border-gray-700/50 flex flex-col justify-center min-h-[240px]">
            <div className="flex flex-col items-center">
              <h4 className="font-semibold text-gray-200 mb-4 text-center">Contact Us</h4>
              
              {/* Contact Form with Connected Inputs */}
              <div className="w-full max-w-sm">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <form onSubmit={handleContactSubmit} className="space-y-0">
                    <div>
                      <input
                        type="email"
                        id="contact-email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your@email.com"
                        className="w-full h-12 px-3 bg-gray-700/50 border border-gray-600 rounded-t-md text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--healthscan-green)] focus:border-transparent text-center border-b-0"
                        required
                      />
                    </div>
                    <div>
                      <textarea
                        id="contact-message"
                        value={contactForm.message}
                        onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                        rows={2}
                        placeholder="How can we help you?"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--healthscan-green)] focus:border-transparent resize-none text-center border-b-0"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 flex items-center justify-center gap-2 px-3 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-b-md transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="pb-4 md:pb-0 flex flex-col justify-center min-h-[240px]">
            <div className="flex flex-col items-center">
              <h4 className="font-semibold text-gray-200 mb-4 text-center">Quick Links</h4>
              <ul className="space-y-2 text-gray-300 text-sm text-center">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#leaderboard" className="hover:text-white transition-colors">
                    Leaderboard
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@healthscan.live" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Major CTA Section - Back Project */}
        <div className="border-t border-gray-700/50 pt-6 mb-6">
          <div className="text-center">
            <h4 className="text-xl font-bold text-white mb-2">Support Our Mission</h4>
            <p className="text-gray-300 text-sm mb-4 max-w-2xl mx-auto">
              Help us build the future of food transparency.
            </p>
            
            {/* Major CTA Button with Green Theme and Quick Wobble Animation */}
            <div className="flex justify-center">
              <button
                onClick={handleDonateClick}
                className="btn-major w-80 bg-gradient-to-r from-[var(--healthscan-green)] to-[var(--healthscan-light-green)] hover:from-[var(--healthscan-light-green)] hover:to-[var(--healthscan-green)] text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:animate-button-shake group"
                aria-label="Back Our Project"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-lg">Back Project</span>
                  <ExternalLink className="w-4 h-4 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="border-t border-gray-700/50 pt-6 pb-6">
          {/* Social Links Grid */}
          <div className="flex flex-wrap gap-4 justify-center items-center max-w-6xl mx-auto">
            {/* Discord */}
            <a
              href="https://discord.gg/4QJpFyTD44"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-all duration-300 rounded-lg group"
              aria-label="Join Discord"
            >
              <DiscordLogo className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Discord</span>
            </a>
            
            {/* TikTok */}
            <a
              href="https://www.tiktok.com/@healthscan.live"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-all duration-300 rounded-lg group"
              aria-label="Follow on TikTok"
            >
              <TikTokLogo className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">TikTok</span>
            </a>

            {/* Telegram */}
            <a
              href="https://t.me/healthscanai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-all duration-300 rounded-lg group"
              aria-label="Join Telegram"
            >
              <TelegramLogo className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Telegram</span>
            </a>

            {/* Twitter */}
            <a
              href="https://twitter.com/healthscanlive"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-all duration-300 rounded-lg group"
              aria-label="Follow on Twitter"
            >
              <Twitter className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Twitter</span>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/healthscan.live/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-all duration-300 rounded-lg group"
              aria-label="Follow on Instagram"
            >
              <Instagram className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Instagram</span>
            </a>

            {/* Facebook */}
            <a
              href="https://www.facebook.com/profile.php?id=61579058123361"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-all duration-300 rounded-lg group"
              aria-label="Follow on Facebook"
            >
              <Facebook className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Facebook</span>
            </a>

            {/* Linktree */}
            <a
              href="https://linktr.ee/healthscan"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-all duration-300 rounded-lg group"
              aria-label="All Our Links"
            >
              <LinktreeLogo className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Linktree</span>
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <a href="#privacy" className="hover:text-gray-200 transition-colors">Privacy</a>
            <a href="#terms" className="hover:text-gray-200 transition-colors">Terms</a>
            <a href="#cookies" className="hover:text-gray-200 transition-colors">Cookies</a>
          </div>

          <div className="text-center md:text-right">
            <p className="text-gray-400 text-sm flex items-center justify-center md:justify-end gap-2">
              Made with{" "}
              <Heart className="w-4 h-4 text-red-500" /> for a
              healthier world
            </p>
            <p className="text-gray-500 text-xs mt-2">
              © 2025 HealthScan. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}