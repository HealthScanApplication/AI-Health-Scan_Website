"use client";

import { useState, useEffect } from "react";
import { UniversalWaitlist } from "./UniversalWaitlist";
import { ReferralInvitationBanner } from "./ReferralInvitationBanner";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { APP_STORE_URL } from "../config/appLinks";
import heroPoster from "../assets/5f38caf68dd6b8af22362056b70854ea4cf4b933.png";
import {
  ed,
  GRO,
  DISPLAY,
  coverStyle,
  deckStyle,
  folioStyle,
} from "../config/editorialTheme";

// Stylish Apple glyph for the "Try" CTA
function AppleMark({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" style={{ marginBottom: -2 }}>
      <path d="M17.05 12.54c-.02-2.06 1.68-3.05 1.76-3.1-.96-1.4-2.46-1.6-3-1.62-1.27-.13-2.49.75-3.14.75-.65 0-1.65-.73-2.71-.71-1.39.02-2.68.81-3.4 2.06-1.45 2.52-.37 6.25 1.04 8.3.69 1 1.51 2.13 2.58 2.09 1.04-.04 1.43-.67 2.69-.67 1.25 0 1.61.67 2.71.65 1.12-.02 1.83-1.02 2.51-2.03.79-1.16 1.12-2.29 1.13-2.35-.02-.01-2.17-.83-2.19-3.3zM15 5.88c.57-.69.96-1.65.85-2.61-.83.03-1.83.55-2.42 1.24-.53.61-.99 1.59-.87 2.53.93.07 1.87-.47 2.44-1.16z" />
    </svg>
  );
}

// Strava brandmark (orange chevron) for the integrations strip.
function StravaMark({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#FC4C02" aria-hidden="true">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.172" />
    </svg>
  );
}

// Ōura ring glyph (a band) for the integrations strip.
function OuraRing({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="#16140F" strokeWidth="3.4" />
    </svg>
  );
}

// Apple Health heart for the integrations strip.
function AppleHealthMark({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#FB2C53" aria-hidden="true">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

const syncName: React.CSSProperties = { fontFamily: GRO, fontSize: 13, fontWeight: 600, letterSpacing: "0.02em", color: ed.ink };
const syncDivider: React.CSSProperties = { width: 1, height: 13, background: ed.hair };

interface HeroSectionProps {
  hasReferral?: boolean;
  isActive?: boolean;
  referralCode?: string | null;
}

const GOAL_WORDS = ["weight loss", "clearer skin", "lean muscle", "more energy", "better sleep", "gut health", "healthy kids", "longevity"];

const overline: React.CSSProperties = {
  fontFamily: GRO,
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  color: ed.inkSoft,
  margin: 0,
};

export function HeroSection({ hasReferral, isActive, referralCode }: HeroSectionProps = {}) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [allowVideo, setAllowVideo] = useState(false);
  const [backgroundVideos, setBackgroundVideos] = useState<string[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [wordVisible, setWordVisible] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduceMotion(reduce);
    const narrowMq = window.matchMedia("(max-width: 768px)");
    const applyNarrow = () => setIsNarrow(narrowMq.matches);
    applyNarrow();
    narrowMq.addEventListener?.("change", applyNarrow);
    const conn = (navigator as any).connection;
    const eff = conn?.effectiveType || "";
    const slow = conn?.saveData === true || /(^|-)2g$/.test(eff) || (typeof conn?.downlink === "number" && conn.downlink < 1.5);
    let videoTimer: ReturnType<typeof setTimeout> | undefined;
    if (!reduce && !conn?.saveData && !(window.matchMedia("(max-width: 600px)").matches && slow) && !/(^|-)2g$/.test(eff)) {
      // Let the poster image paint + the page settle before we fetch/stream video.
      videoTimer = setTimeout(() => setAllowVideo(true), 900);
    }
    return () => {
      narrowMq.removeEventListener?.("change", applyNarrow);
      if (videoTimer) clearTimeout(videoTimer);
    };
  }, []);

  useEffect(() => {
    if (!allowVideo) return;
    const fetchVideos = async () => {
      try {
        const base = `https://${projectId}.supabase.co/rest/v1`;
        const headers = { apikey: publicAnonKey, Authorization: `Bearer ${publicAnonKey}` };
        const [a, b, c] = await Promise.all([
          fetch(`${base}/catalog_ingredients?select=video_url&video_url=not.is.null&video_url=neq.&limit=8`, { headers }),
          fetch(`${base}/catalog_recipes?select=video_url&video_url=not.is.null&video_url=neq.&limit=8`, { headers }),
          fetch(`${base}/catalog_elements?select=video_url&video_url=not.is.null&video_url=neq.&limit=8`, { headers }),
        ]);
        const ja = a.ok ? await a.json() : [];
        const jb = b.ok ? await b.json() : [];
        const jc = c.ok ? await c.json() : [];
        const all = [...ja, ...jb, ...jc].map((r: any) => r.video_url).filter(Boolean).sort(() => Math.random() - 0.5).slice(0, 10);
        if (all.length > 0) setBackgroundVideos(all);
      } catch {
        /* poster remains */
      }
    };
    fetchVideos();
  }, [allowVideo]);

  useEffect(() => {
    if (backgroundVideos.length < 2) return;
    const t = setInterval(() => {
      setFadingOut(true);
      setTimeout(() => {
        setCurrentVideoIndex((p) => (p + 1) % backgroundVideos.length);
        setFadingOut(false);
      }, 800);
    }, 7000);
    return () => clearInterval(t);
  }, [backgroundVideos]);

  useEffect(() => {
    const t = setInterval(() => {
      setWordVisible(false);
      setTimeout(() => {
        setWordIndex((i) => (i + 1) % GOAL_WORDS.length);
        setWordVisible(true);
      }, 320);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <section
      id="hero-section"
      style={{ position: "relative", minHeight: "100svh", background: ed.paper, overflow: "hidden" }}
    >
      {/* Cover stock — faded photo under a heavy paper tint so it reads as printed paper */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }} aria-hidden="true">
        <img
          src={heroPoster}
          alt=""
          {...({ fetchpriority: "high" } as any)}
          decoding="async"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.9) contrast(1.02)" }}
        />
        {allowVideo && backgroundVideos.length > 0 && (
          <video
            key={backgroundVideos[currentVideoIndex]}
            src={backgroundVideos[currentVideoIndex]}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
            tabIndex={-1}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.9)", opacity: fadingOut ? 0 : 1, transition: "opacity 0.8s ease-in-out" }}
          />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(244,241,234,0.78) 0%, rgba(244,241,234,0.7) 55%, rgba(244,241,234,0.86) 100%)" }} />
      </div>

      {/* Cover content on the grid */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          maxWidth: 1440,
          margin: "0 auto",
          paddingLeft: "clamp(20px, 5vw, 72px)",
          paddingRight: "clamp(20px, 5vw, 72px)",
          paddingTop: "clamp(88px, 9vh, 104px)",
          paddingBottom: "clamp(32px, 5vh, 56px)",
        }}
      >
        {/* Top: issue line + folio */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: `1px solid ${ed.hair}`, paddingTop: 14 }}>
          <p style={overline}>HealthScan — Health · Beauty · Fitness</p>
          <p style={folioStyle}>Out now on iOS</p>
        </div>

        <div style={{ flex: 1, minHeight: "clamp(40px, 8vh, 120px)" }} />

        {/* Cover line + deck, lower-left */}
        <div style={{ width: "100%" }}>
          <h1 style={coverStyle}>
            <span style={{ display: "block" }}>Build a routine</span>
            <span style={{ display: "block" }}>
              for{" "}
              <span
                style={{
                  fontStyle: "italic",
                  color: ed.accent,
                  transition: reduceMotion ? undefined : "opacity 320ms ease",
                  opacity: wordVisible ? 1 : 0,
                }}
              >
                {GOAL_WORDS[wordIndex]}
              </span>
              .
            </span>
          </h1>
          <p style={{ ...deckStyle, marginTop: "clamp(20px, 3vw, 36px)", maxWidth: "34ch" }}>
            Daily to-dos, activity tracking, and a food scanner — set for whatever you want to achieve.
          </p>

          {/* Integrations — syncs with Apple Health, Ōura Ring & Strava */}
          <div style={{ marginTop: "clamp(22px, 3vw, 34px)", display: "flex", alignItems: "center", gap: "10px 16px", flexWrap: "wrap" }}>
            <span style={{ ...overline, color: ed.inkFaint }}>Syncs</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              <AppleHealthMark size={15} />
              <span style={syncName}>Apple Health</span>
            </span>
            <span aria-hidden="true" style={syncDivider} />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              <OuraRing size={14} />
              <span style={syncName}>Ōura Ring</span>
            </span>
            <span aria-hidden="true" style={syncDivider} />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              <StravaMark size={15} />
              <span style={syncName}>Strava</span>
            </span>
          </div>
        </div>

        {/* Bottom: waitlist (left) + cover credit (right) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 28, marginTop: "clamp(44px, 7vh, 88px)" }}>
          <div>
            <p style={{ ...overline, color: ed.accent, marginBottom: 16 }}>Out now on iOS — Android coming soon</p>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <a
                href={APP_STORE_URL || undefined}
                target={APP_STORE_URL ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="ed-cta"
              >
                <AppleMark />Try&nbsp;→
              </a>
              <span style={{ fontFamily: DISPLAY, fontStyle: "italic", fontSize: 17, color: ed.inkSoft }}>or</span>
              <UniversalWaitlist variant="editorial" submitLabel="Subscribe →" placeholder="you@email.com" />
            </div>
          </div>
        </div>
      </div>

      <ReferralInvitationBanner hasReferral={hasReferral || false} isActive={isActive || false} referralCode={referralCode || null} />
    </section>
  );
}
