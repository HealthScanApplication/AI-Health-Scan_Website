"use client";

import { useState, useEffect } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  const launchDate = new Date("2026-02-27T00:00:00").getTime();

  useEffect(() => {
    // Calculate initial time immediately
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = launchDate - now;

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        };
      } else {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
    };

    // Set initial value
    setTimeLeft(calculateTimeLeft());
    setIsLoaded(true);

    // Start the timer
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [launchDate]);

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center bg-white rounded-lg shadow-md border p-3 min-w-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 opacity-50"></div>
      <span 
        className="text-2xl font-bold tabular-nums relative z-10 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent"
        style={{
          backgroundSize: '200% 200%',
          animation: 'gradient-x 4s ease infinite'
        }}
      >
        {isLoaded ? value.toString().padStart(2, "0") : "--"}
      </span>
      <span 
        className="text-xs uppercase mt-1 relative z-10 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent"
        style={{
          backgroundSize: '200% 200%',
          animation: 'gradient-x 4s ease infinite 0.5s'
        }}
      >
        {label}
      </span>
    </div>
  );

  // Show loading state if not loaded yet
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center gap-3">
        {["Days", "Hours", "Mins", "Secs"].map((label) => (
          <div key={label} className="flex flex-col items-center bg-white rounded-lg shadow-md border p-3 min-w-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 opacity-50"></div>
            <span className="text-2xl font-bold text-gray-300 tabular-nums relative z-10">
              --
            </span>
            <span className="text-xs text-gray-400 uppercase mt-1 relative z-10">
              {label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Check if launch date has passed
  const now = new Date().getTime();
  const hasLaunched = now >= launchDate;

  if (hasLaunched) {
    return (
      <div className="text-center">
        <div 
          className="inline-block px-6 py-3 rounded-lg shadow-lg relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #10b981, #14b8a6, #06b6d4)',
            backgroundSize: '200% 200%',
            animation: 'gradient-x 3s ease infinite'
          }}
        >
          <span className="text-white font-bold text-lg relative z-10">
            🚀 HealthScan is Live!
          </span>
        </div>
        <p 
          className="text-sm mt-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent font-medium"
          style={{
            backgroundSize: '200% 200%',
            animation: 'gradient-x 4s ease infinite 1s'
          }}
        >
          The beta launched on February 27, 2026 — download now!
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 mb-2">
        <TimeUnit value={timeLeft.days} label="Days" />
        <div 
          className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent"
          style={{
            backgroundSize: '200% 200%',
            animation: 'gradient-x 3s ease infinite 2s'
          }}
        >:</div>
        <TimeUnit value={timeLeft.hours} label="Hours" />
        <div 
          className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent"
          style={{
            backgroundSize: '200% 200%',
            animation: 'gradient-x 3s ease infinite 2.5s'
          }}
        >:</div>
        <TimeUnit value={timeLeft.minutes} label="Mins" />
        <div 
          className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent"
          style={{
            backgroundSize: '200% 200%',
            animation: 'gradient-x 3s ease infinite 3s'
          }}
        >:</div>
        <TimeUnit value={timeLeft.seconds} label="Secs" />
      </div>
      <p 
        className="text-sm font-medium bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent"
        style={{
          backgroundSize: '200% 200%',
          animation: 'gradient-x 5s ease infinite 1.5s'
        }}
      >
        Until HealthScan Beta Launch • Feb 27, 2026
      </p>
    </div>
  );
}