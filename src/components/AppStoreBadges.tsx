"use client";

import {
  APP_STORE_URL,
  GOOGLE_PLAY_URL,
  APP_STORE_AVAILABLE,
  GOOGLE_PLAY_AVAILABLE,
} from "../config/appLinks";

interface AppStoreBadgesProps {
  className?: string;
  align?: "center" | "start";
  caption?: string;
}

/** Scrolls to the hero waitlist (used when a platform isn't live / has no link yet). */
function focusWaitlist() {
  const hero = document.getElementById("hero-section");
  if (hero) {
    hero.scrollIntoView({ behavior: "smooth", block: "start" });
    const input = hero.querySelector<HTMLInputElement>('input[type="email"]');
    if (input) setTimeout(() => input.focus(), 600);
  }
}

function AppleBadge() {
  return (
    <span className="flex items-center gap-2.5 rounded-xl bg-black px-4 h-12 text-white shadow-md transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]">
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current flex-shrink-0" aria-hidden="true">
        <path d="M17.05 12.54c-.02-2.06 1.68-3.05 1.76-3.1-0.96-1.4-2.46-1.6-3-1.62-1.27-.13-2.49.75-3.14.75-.65 0-1.65-.73-2.71-.71-1.39.02-2.68.81-3.4 2.06-1.45 2.52-.37 6.25 1.04 8.3.69 1 1.51 2.13 2.58 2.09 1.04-.04 1.43-.67 2.69-.67 1.25 0 1.61.67 2.71.65 1.12-.02 1.83-1.02 2.51-2.03.79-1.16 1.12-2.29 1.13-2.35-.02-.01-2.17-.83-2.19-3.3zM15.0 5.88c.57-.69.96-1.65.85-2.61-.83.03-1.83.55-2.42 1.24-.53.61-.99 1.59-.87 2.53.93.07 1.87-.47 2.44-1.16z" />
      </svg>
      <span className="flex flex-col items-start leading-none">
        <span className="text-[10px] opacity-80">{APP_STORE_AVAILABLE ? "Download on the" : "Coming soon to the"}</span>
        <span className="text-[15px] font-semibold -mt-0.5">App Store</span>
      </span>
    </span>
  );
}

function PlayBadge({ muted }: { muted?: boolean }) {
  return (
    <span
      className="flex items-center gap-2.5 rounded-xl bg-black px-4 h-12 text-white shadow-md transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
      style={muted ? { opacity: 0.62 } : undefined}
    >
      <svg viewBox="0 0 24 24" className="w-6 h-6 flex-shrink-0" aria-hidden="true">
        <path d="M3.6 2.2c-.3.3-.5.7-.5 1.2v17.2c0 .5.2.9.5 1.2l.1.1L13 12.1v-.2L3.7 2.1l-.1.1z" fill="#00D3FF" />
        <path d="M16.5 15.5L13 12.1v-.2l3.5-3.4.1.1 4.1 2.3c1.2.7 1.2 1.8 0 2.5l-4.1 2.3-.1-.1z" fill="#FFCE00" />
        <path d="M16.6 15.4L13 12 3.6 21.8c.4.4 1 .5 1.8.1l11.2-6.5z" fill="#FF3A44" />
        <path d="M16.6 8.6L5.4 2.1c-.8-.4-1.4-.3-1.8.1L13 12l3.6-3.4z" fill="#00F076" />
      </svg>
      <span className="flex flex-col items-start leading-none">
        <span className="text-[10px] opacity-80">{GOOGLE_PLAY_AVAILABLE ? "Get it on" : "Coming soon on"}</span>
        <span className="text-[15px] font-semibold -mt-0.5">Google Play</span>
      </span>
    </span>
  );
}

export function AppStoreBadges({ className = "", align = "center", caption }: AppStoreBadgesProps) {
  const alignClass = align === "center" ? "items-center text-center" : "items-start text-left";
  const justify = align === "center" ? "justify-center" : "justify-start";

  // App Store: live → link to the listing (or focus waitlist until the URL is set).
  const appleEl = APP_STORE_AVAILABLE && APP_STORE_URL ? (
    <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" aria-label="Download HealthScan on the App Store">
      <AppleBadge />
    </a>
  ) : (
    <button onClick={focusWaitlist} aria-label="HealthScan on the App Store" className="cursor-pointer">
      <AppleBadge />
    </button>
  );

  // Google Play: coming soon → muted, routes to the waitlist.
  const playEl = GOOGLE_PLAY_AVAILABLE && GOOGLE_PLAY_URL ? (
    <a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer" aria-label="Get HealthScan on Google Play">
      <PlayBadge />
    </a>
  ) : (
    <button onClick={focusWaitlist} aria-label="HealthScan is coming soon to Google Play" className="cursor-pointer">
      <PlayBadge muted />
    </button>
  );

  return (
    <div className={`flex flex-col ${alignClass} gap-2 ${className}`}>
      {caption && (
        <span className="text-xs font-medium text-[var(--healthscan-text-muted)]">{caption}</span>
      )}
      <div className={`flex flex-wrap ${justify} gap-3`}>
        {appleEl}
        {playEl}
      </div>
    </div>
  );
}
