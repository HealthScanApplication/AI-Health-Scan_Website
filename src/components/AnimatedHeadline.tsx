import { useState, useEffect } from "react";

interface AnimatedHeadlineProps {
  baseText?: string;
  words?: string[];
  className?: string;
  interval?: number;
}

export function AnimatedHeadline({
  baseText = "Your health detective",
  words = ["products"],
  className = "",
  interval = 3000
}: AnimatedHeadlineProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [nextWordIndex, setNextWordIndex] = useState(1);
  const [showCurrent, setShowCurrent] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      // Start transition
      setShowCurrent(false);
      
      setTimeout(() => {
        // Update indices
        setCurrentWordIndex(nextWordIndex);
        setNextWordIndex((nextWordIndex + 1) % words.length);
        
        // Show new word
        setShowCurrent(true);
      }, 200); // Half of transition duration
      
    }, interval);

    return () => clearInterval(timer);
  }, [nextWordIndex, words.length, interval]);

  const currentWord = words[currentWordIndex];

  return (
    <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 leading-tight text-center ${className}`}>
      <div className="flex flex-col items-center leading-[1.05] max-w-full">
        <div className="mb-1 px-4">
          {baseText}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 px-4">
          <span>in your pocket for your</span>
          <span className="relative inline-block">
            <span 
              className={`
                bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-400
                bg-clip-text text-transparent 
                font-extrabold leading-tight
                transition-all duration-200 ease-in-out
                inline-block
                animate-gradient-x
                ${showCurrent 
                  ? 'opacity-100 translate-y-0 scale-100' 
                  : 'opacity-0 translate-y-1 scale-95'
                }
              `}
              style={{
                backgroundSize: '200% 200%',
                animation: 'gradient-x 3s ease infinite'
              }}
            >
              {currentWord}
            </span>
          </span>
        </div>
      </div>
    </h1>
  );
}