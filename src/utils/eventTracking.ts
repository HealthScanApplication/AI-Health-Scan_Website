/**
 * Event Tracking Utility for HealthScan Funnel Analytics
 * Tracks: lp_view, cta_click, signup_start, signup_submit, email_confirm,
 *         share_click, referral_link_open, referral_signup_submit, referral_email_confirm
 * 
 * Uses anonymous_id (session) that merges into user_id on signup_submit.
 * Persists events to server via POST /events endpoint.
 * Captures UTM params + referral_code on first landing.
 */

import { projectId } from './supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2`;

// Event types for the funnel
export type FunnelEventType =
  | 'lp_view'
  | 'cta_click'
  | 'signup_start'
  | 'signup_submit'
  | 'email_confirm'
  | 'share_click'
  | 'referral_link_open'
  | 'referral_signup_submit'
  | 'referral_email_confirm';

export interface FunnelEvent {
  event: FunnelEventType;
  anonymous_id: string;
  user_id?: string;
  timestamp: string;
  referral_code?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  metadata?: Record<string, any>;
}

// Storage keys
const ANON_ID_KEY = 'hs_anonymous_id';
const UTM_KEY = 'hs_utm_params';
const REF_CODE_KEY = 'healthscan_pending_referral';
const USER_ID_KEY = 'hs_user_id';

// Generate a random anonymous ID
function generateAnonId(): string {
  return 'anon_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
}

// Get or create anonymous ID
function getAnonymousId(): string {
  if (typeof window === 'undefined') return generateAnonId();
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = generateAnonId();
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

// Get stored user ID (set after signup)
function getUserId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem(USER_ID_KEY) || undefined;
}

// Set user ID (called on signup_submit to merge anonymous session)
export function setUserId(userId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_ID_KEY, userId);
}

// Capture UTM params from URL on first visit
function captureUtmParams(): { utm_source?: string; utm_medium?: string; utm_campaign?: string } {
  if (typeof window === 'undefined') return {};
  
  // Check if already captured this session
  const cached = sessionStorage.getItem(UTM_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch { /* fall through */ }
  }
  
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  if (params.get('utm_source')) utm.utm_source = params.get('utm_source')!;
  if (params.get('utm_medium')) utm.utm_medium = params.get('utm_medium')!;
  if (params.get('utm_campaign')) utm.utm_campaign = params.get('utm_campaign')!;
  
  if (Object.keys(utm).length > 0) {
    sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
  }
  return utm;
}

// Get referral code from storage
function getReferralCode(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem(REF_CODE_KEY) || 
         new URLSearchParams(window.location.search).get('ref') || 
         undefined;
}

// Event queue for batching (sends every 5s or on page unload)
let eventQueue: FunnelEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 5000;

async function flushEvents(): Promise<void> {
  if (eventQueue.length === 0) return;
  
  const batch = [...eventQueue];
  eventQueue = [];
  
  try {
    await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
      keepalive: true, // Ensures delivery on page unload
    });
  } catch (err) {
    // Re-queue on failure (best effort)
    console.warn('⚠️ Event tracking flush failed:', err);
    eventQueue.unshift(...batch);
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushEvents();
  }, FLUSH_INTERVAL);
}

// Track a funnel event
export function trackEvent(
  event: FunnelEventType,
  metadata?: Record<string, any>
): void {
  const utm = captureUtmParams();
  const funnelEvent: FunnelEvent = {
    event,
    anonymous_id: getAnonymousId(),
    user_id: getUserId(),
    timestamp: new Date().toISOString(),
    referral_code: getReferralCode(),
    ...utm,
    metadata,
  };

  eventQueue.push(funnelEvent);
  scheduleFlush();
}

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushEvents();
    }
  });
  window.addEventListener('beforeunload', () => {
    flushEvents();
  });
}

// Convenience helpers
export const trackLpView = () => trackEvent('lp_view', { path: window?.location?.pathname });
export const trackCtaClick = (ctaLabel?: string) => trackEvent('cta_click', { label: ctaLabel });
export const trackSignupStart = () => trackEvent('signup_start');
export const trackSignupSubmit = (email: string) => {
  setUserId(email);
  trackEvent('signup_submit', { email });
};
export const trackEmailConfirm = (email: string) => trackEvent('email_confirm', { email });
export const trackShareClick = (method: string) => trackEvent('share_click', { method });
export const trackReferralLinkOpen = (refCode: string) => trackEvent('referral_link_open', { referral_code: refCode });
export const trackReferralSignupSubmit = (email: string, refCode: string) => trackEvent('referral_signup_submit', { email, referral_code: refCode });
export const trackReferralEmailConfirm = (email: string, refCode: string) => trackEvent('referral_email_confirm', { email, referral_code: refCode });
