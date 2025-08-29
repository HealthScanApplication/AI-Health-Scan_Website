import { Camera, Search, Heart, ArrowRight } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: <Camera className="w-8 h-8" />,
      title: "Scan Any Food",
      description: "Point your camera at any food product, ingredient, or nutrition label. Our AI instantly recognizes what you're scanning."
    },
    {
      number: "02", 
      icon: <Search className="w-8 h-8" />,
      title: "Instant Analysis",
      description: "Get comprehensive insights about nutrition, ingredients, allergens, and potential health impacts in seconds."
    },
    {
      number: "03",
      icon: <Heart className="w-8 h-8" />,
      title: "Make Better Choices",
      description: "Receive personalized recommendations and track your health goals with actionable insights."
    }
  ];

  return (
    <section id="how-it-works" className="relative py-24 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white to-green-50/30"></div>
        
        {/* Floating blobs */}
        <div className="absolute w-80 h-80 rounded-full opacity-8 animate-blob-float-1"
             style={{
               background: `radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, rgba(22, 163, 74, 0.15) 50%, transparent 70%)`,
               top: "15%",
               right: "10%",
               filter: "blur(35px)",
             }}></div>
        
        <div className="absolute w-64 h-64 rounded-full opacity-6 animate-blob-float-2"
             style={{
               background: `radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.12) 50%, transparent 70%)`,
               top: "50%",
               left: "5%",
               filter: "blur(30px)",
             }}></div>
        
        <div className="absolute w-72 h-72 rounded-full opacity-7 animate-blob-float-3"
             style={{
               background: `radial-gradient(circle, rgba(251, 146, 60, 0.2) 0%, rgba(249, 115, 22, 0.1) 50%, transparent 70%)`,
               bottom: "20%",
               right: "20%",
               filter: "blur(40px)",
             }}></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
            Simple Process
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
            How HealthScan Works
          </h2>
          <p className="text-xl text-[var(--healthscan-text-muted)] max-w-3xl mx-auto leading-relaxed">
            Three simple steps to understanding what's really in your food and making healthier choices for you and your family.
          </p>
        </div>

        {/* Steps */}
        <div className="grid lg:grid-cols-3 gap-12 items-center">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-20 left-full w-12 z-10">
                  <ArrowRight className="w-8 h-8 text-[var(--healthscan-green)] mx-auto" />
                </div>
              )}
              
              {/* Step Card */}
              <div className="text-center">
                {/* Step Number */}
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--healthscan-green)] text-white rounded-2xl mb-6 text-2xl font-bold">
                  {step.number}
                </div>
                
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--healthscan-bg-light)] rounded-2xl mb-6 text-[var(--healthscan-green)]">
                  {step.icon}
                </div>
                
                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {step.title}
                </h3>
                
                <p className="text-[var(--healthscan-text-muted)] leading-relaxed max-w-sm mx-auto">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-4">
            <Heart className="w-4 h-4" />
            Join our growing community
          </div>
          <p className="text-lg text-[var(--healthscan-text-muted)] max-w-2xl mx-auto">
            Ready to take control of your nutrition? Get early access to the most comprehensive food analysis app ever created.
          </p>
        </div>
      </div>
    </section>
  );
}