import { useState, useEffect } from "react";
import { UniversalWaitlist } from "./UniversalWaitlist";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Mail, Bell, Gift, Zap } from "lucide-react";
import { motion } from "motion/react";
import { ConfettiCelebration } from "./ConfettiCelebration";
import heroBackground from "figma:asset/5f38caf68dd6b8af22362056b70854ea4cf4b933.png";

interface Benefit {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const benefits: Benefit[] = [
  {
    icon: <Gift className="h-6 w-6 text-green-600" />,
    title: "Free Weeks Access",
    description: "Earn free weeks of access when you join our waitlist and refer friends"
  },
  {
    icon: <Bell className="h-6 w-6 text-blue-600" />,
    title: "Early Access",
    description: "Be the first to access HealthScan before the public launch"
  },
  {
    icon: <Zap className="h-6 w-6 text-purple-600" />,
    title: "Exclusive Features",
    description: "Access premium scanning features not available to regular users"
  },
  {
    icon: <Mail className="h-6 w-6 text-orange-600" />,
    title: "Launch Updates",
    description: "Get insider updates and tips directly to your inbox"
  }
];

export function EmailSubscribeSection() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState<string | null>(null);

  const handleSignupSuccess = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    
    // Update waitlist position after successful signup
    setTimeout(() => {
      const storedPosition = localStorage.getItem('healthscan_user_position');
      if (storedPosition && storedPosition !== '0') {
        setWaitlistPosition(storedPosition);
      }
    }, 100);
  };

  // Get user's waitlist position from localStorage
  useEffect(() => {
    const updateWaitlistPosition = () => {
      const userEmail = localStorage.getItem('healthscan_user_email');
      const storedPosition = localStorage.getItem('healthscan_user_position');
      
      if (userEmail && storedPosition && storedPosition !== '0') {
        setWaitlistPosition(storedPosition);
      } else {
        setWaitlistPosition(null);
      }
    };

    // Update on mount
    updateWaitlistPosition();

    // Listen for waitlist signup events
    const handleUserSignedUp = () => {
      updateWaitlistPosition();
    };

    window.addEventListener('userSignedUp', handleUserSignedUp);
    return () => window.removeEventListener('userSignedUp', handleUserSignedUp);
  }, []);

  return (
    <section className="relative py-16 overflow-hidden">
      {showConfetti && <ConfettiCelebration />}
      
      {/* Hero Background Image - Same as HeroSection */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={heroBackground}
          alt="HealthScan Background"
          className="absolute top-0 left-0 w-full h-full object-cover"
        />

        {/* White transparent overlay with animated gradient */}
        <div className="absolute inset-0 bg-white/15"></div>
        
        {/* Animated luminosity gradient overlay */}
        <div 
          className="absolute inset-0 opacity-30 animate-pulse"
          style={{
            background: `
              linear-gradient(45deg, 
                rgba(255, 255, 255, 0.2) 0%, 
                rgba(255, 255, 255, 0.05) 25%, 
                rgba(255, 255, 255, 0.3) 50%, 
                rgba(255, 255, 255, 0.1) 75%, 
                rgba(255, 255, 255, 0.2) 100%
              )
            `,
            backgroundSize: "400% 400%",
            animation: "gradientLuminosity 8s ease-in-out infinite"
          }}
        />

        {/* Subtle overlay for better text readability */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]"></div>
      </div>
      {/* Subtle enhancement overlay */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Light enhancement to complement the background image */}
        {/* Vintage Noise Texture Overlay */}
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.8'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Animated Gradient Overlay */}
        <div
          className="absolute inset-0 opacity-15 animate-gradient-flow"
          style={{
            background: `
              linear-gradient(45deg, 
                rgba(22, 163, 74, 0.1) 0%, 
                rgba(34, 197, 94, 0.15) 25%, 
                rgba(16, 185, 129, 0.1) 50%, 
                rgba(6, 182, 212, 0.12) 75%, 
                rgba(22, 163, 74, 0.08) 100%
              ),
              radial-gradient(ellipse at 30% 40%, rgba(255, 255, 255, 0.1) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 60%, rgba(22, 163, 74, 0.05) 0%, transparent 50%)
            `,
            backgroundSize: "400% 400%, 100% 100%, 100% 100%",
          }}
        />
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 bg-green-100 text-green-800">
            📧 Join the HealthScan Community
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
            Get Early Access + Earn Free Weeks
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Be among the first to experience HealthScan's revolutionary food scanning technology. 
            Join our waitlist and get exclusive benefits when we launch.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="bg-white border-green-100 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                      <p className="text-gray-600 text-sm">{benefit.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Email Capture */}
        <motion.div 
          className="max-w-md mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <UniversalWaitlist 
            onSignupSuccess={handleSignupSuccess} 
            placeholder="Add your email"
          />
        </motion.div>

        {/* Bottom note */}
        <motion.div 
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p className="text-sm text-gray-500">
            🔒 We respect your privacy. No spam, just updates about HealthScan.
          </p>
        </motion.div>
      </div>
    </section>
  );
}