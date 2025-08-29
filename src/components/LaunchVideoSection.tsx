import { Button } from "./ui/button";
import { ExternalLink, Heart } from "lucide-react";

export function LaunchVideoSection() {
  const handleDonateClick = () => {
    window.open(
      "https://jfd.gumroad.com/coffee",
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <section id="video" className="relative py-20 px-4 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50"></div>
        
        {/* Floating blobs */}
        <div className="absolute w-72 h-72 rounded-full opacity-6 animate-blob-float-2"
             style={{
               background: `radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.08) 50%, transparent 70%)`,
               top: "12%",
               right: "8%",
               filter: "blur(36px)",
             }}></div>
        
        <div className="absolute w-84 h-84 rounded-full opacity-5 animate-blob-float-4"
             style={{
               background: `radial-gradient(circle, rgba(251, 146, 60, 0.2) 0%, rgba(249, 115, 22, 0.1) 50%, transparent 70%)`,
               top: "60%",
               left: "8%",
               filter: "blur(45px)",
             }}></div>
        
        <div className="absolute w-64 h-64 rounded-full opacity-7 animate-blob-float-6"
             style={{
               background: `radial-gradient(circle, rgba(34, 197, 94, 0.18) 0%, rgba(22, 163, 74, 0.09) 50%, transparent 70%)`,
               bottom: "20%",
               right: "25%",
               filter: "blur(32px)",
             }}></div>
        
        <div className="absolute w-48 h-48 rounded-full opacity-8 animate-blob-float-1"
             style={{
               background: `radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, transparent 70%)`,
               top: "35%",
               left: "30%",
               filter: "blur(24px)",
             }}></div>
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            HealthScan Backer Video
          </h2>
          <p className="text-lg text-[var(--healthscan-text-muted)] max-w-2xl mx-auto">
            Watch how we change the way people make food choices.
          </p>
        </div>

        {/* YouTube Video Embed */}
        <div className="relative max-w-4xl mx-auto mb-8">
          <div className="aspect-video bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
            <iframe
              src="https://www.youtube.com/embed/BWSJ3OJGB5A"
              title="HealthScan - Know What You Eat - Official Launch Video"
              className="w-full h-full rounded-2xl"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          </div>

          {/* Video caption */}
          <div className="text-center mt-4">
            <p className="text-sm text-[var(--healthscan-text-muted)]">
              🎬 Watch the official HealthScan promo video
            </p>
          </div>
        </div>

        {/* Support CTA */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={handleDonateClick}
            className="w-full sm:w-80 h-12 bg-[var(--healthscan-green)] hover:bg-green-700 text-white px-8 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Heart className="w-5 h-5 mr-2" />
            Support the Mission
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
          <p className="text-sm text-[var(--healthscan-text-muted)] mt-3">
            Help us bring transparency to the food industry
          </p>
        </div>

        {/* Additional project info */}
      </div>
    </section>
  );
}