"use client";

import { useState, useEffect } from "react";
import { getLaunchTime, hasLaunched as hasLaunchedNow, LAUNCH_LABEL } from "../config/launchConfig";
import { APP_STORE_URL, GOOGLE_PLAY_URL, APP_IS_LIVE } from "../config/appLinks";

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

  const launchDate = getLaunchTime();

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
  const countdownDone = now >= launchDate;

  // Only celebrate "Live" when the app is actually downloadable (real store links set).
  if (countdownDone && hasLaunchedNow(now)) {
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
            🚀 ROUTINE³ is Live!
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-3">
          {APP_STORE_URL && (
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-emerald-700 underline underline-offset-2">
              Download on the App Store
            </a>
          )}
          {GOOGLE_PLAY_URL && (
            <a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-emerald-700 underline underline-offset-2">
              Get it on Google Play
            </a>
          )}
        </div>
      </div>
    );
  }

  // Countdown reached zero but the app isn't downloadable yet — never claim it's live.
  if (countdownDone && !APP_IS_LIVE) {
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
            🌱 Launching soon
          </span>
        </div>
        <p className="text-sm mt-2 text-[var(--healthscan-text-muted)] font-medium">
          We're putting the finishing touches on the app — join the waitlist to be first in.
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
        Until ROUTINE³ Beta Launch • {LAUNCH_LABEL}
      </p>
    </div>
  );
}