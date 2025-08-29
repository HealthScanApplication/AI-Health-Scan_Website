"use client";

import { useEffect, useState } from "react";

interface CelebrationElementsProps {
  isActive: boolean;
}

export function CelebrationElements({ isActive }: CelebrationElementsProps) {
  const [showElements, setShowElements] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShowElements(true);
      const timer = setTimeout(() => {
        setShowElements(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (!showElements) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {/* Plant-themed floating emojis - only green ones */}
      <div className="absolute top-1/4 left-1/4 text-4xl animate-bounce-float opacity-90">
        🌱
      </div>
      <div className="absolute top-1/3 right-1/4 text-4xl animate-bounce-float-delayed opacity-90">
        💚
      </div>
      <div className="absolute top-1/2 left-1/6 text-3xl animate-bounce-float-slow opacity-90">
        🌱
      </div>
      <div className="absolute top-2/3 right-1/6 text-3xl animate-bounce-float-delayed-slow opacity-90">
        💚
      </div>
      <div className="absolute top-1/5 right-1/3 text-4xl animate-bounce-float opacity-90">
        🌱
      </div>

      {/* Plant green success pulse */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-32 h-32 bg-[var(--healthscan-green)] rounded-full opacity-20 animate-ping"></div>
      </div>
    </div>
  );
}