/*
 * sleepWindow — the single source of truth for a protocol's sleep day-anchors.
 *
 * One protocol day is book-ended by a WAKE (End Sleep) and a BEDTIME (Start
 * Sleep). They can be real protocol_items (category 'sleep', e.g. "Wake at 4am")
 * or virtual defaults (06:00 / 22:00). This module owns:
 *   • detection of which item is the wake vs the bedtime (kept identical across
 *     the admin editor, the home-screen mockup, and the mobile widget),
 *   • the sleep-window calculation (bedtime → wake, crossing midnight),
 *   • an optional `actualWake` override (from Apple Health / a wearable sleep
 *     log) that re-times the wake and recomputes the hours slept.
 *
 * Keep this in sync with the mobile copy at
 * ~/Developer/AI-Health-Scan_Mobile/src/utils/sleepWindow.ts
 */

// Morning wake: "Wake", "Wake at 4am", "Wake Up", "End Sleep", "Rise", "Get Up"…
const WAKE_RE = /^(wake|end[\s-]?sleep|rise|get[\s-]?up|morning[\s-]?wake)\b/i;
export const isWakeName = (n?: string | null) => WAKE_RE.test((n || '').trim());
// Evening bedtime: a sleep/bed action that is NOT the morning wake and NOT a prep step.
export function isBedName(n?: string | null): boolean {
  const t = (n || '').trim();
  if (isWakeName(t)) return false;
  if (/(prep|prepare|wind[\s-]?down|reflection)/i.test(t)) return false;
  return /\b(start[\s-]?sleep|bed(time)?|lights[\s-]?out|sleep)\b/i.test(t);
}
export const isSleepCategory = (c?: string | null) => (c || '').toLowerCase() === 'sleep';

/** Minutes-since-midnight for an 'HH:MM[:SS]' string (null when unparseable). */
export function minutesOfTime(t?: string | null): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(t || '');
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
}
/** '8h' / '7h 30m' for a minute count. */
export function fmtDuration(mins: number | null | undefined): string {
  if (mins == null) return '';
  const h = Math.floor(mins / 60), m = Math.round(mins % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}
/** '6:00am' for minutes-since-midnight. */
export function fmtClock(mins: number | null | undefined): string {
  if (mins == null) return '';
  let h = Math.floor(mins / 60) % 24; const m = mins % 60;
  const ap = h < 12 ? 'am' : 'pm'; h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')}${ap}`;
}

export interface SleepItemLike { display_name?: string | null; scheduled_time?: string | null; category?: string | null }

export interface SleepWindow<T> {
  wakeItem?: T;            // the resolved wake (End Sleep) item, if any
  bedItem?: T;            // the resolved bedtime (Start Sleep) item, if any
  bedMins: number | null;          // bedtime, minutes since midnight
  plannedWakeMins: number | null;  // protocol's planned wake
  actualWakeMins: number | null;   // wearable/logged actual wake (if supplied)
  wakeMins: number | null;         // effective wake = actual ?? planned
  usingActual: boolean;            // true when the actual wake overrides the plan
  durationMins: number | null;     // hours slept = bedtime → effective wake
  wakeLabel: string;               // '6:00am'
  durationLabel: string;           // '8h'
}

/**
 * Resolve the wake/bedtime anchors and the sleep window for a list of items.
 * `actualWake` (HH:MM) — when provided (e.g. from Apple Health / a wearable),
 * overrides the planned wake and recomputes the hours slept.
 */
export function computeSleepWindow<T extends SleepItemLike>(
  items: T[],
  opts: { actualWake?: string | null } = {},
): SleepWindow<T> {
  const wakes = items
    .filter((i) => isWakeName(i.display_name) || (isSleepCategory(i.category) && (minutesOfTime(i.scheduled_time) ?? 1e9) < 720))
    .sort((a, b) => (minutesOfTime(a.scheduled_time) ?? 1e9) - (minutesOfTime(b.scheduled_time) ?? 1e9));
  const beds = items
    .filter((i) => isBedName(i.display_name) || (isSleepCategory(i.category) && (minutesOfTime(i.scheduled_time) ?? -1) >= 720))
    .sort((a, b) => (minutesOfTime(a.scheduled_time) ?? -1) - (minutesOfTime(b.scheduled_time) ?? -1));

  const wakeItem = wakes[0];
  const bedItem = beds[beds.length - 1];
  const plannedWakeMins = minutesOfTime(wakeItem?.scheduled_time ?? null);
  const bedMins = minutesOfTime(bedItem?.scheduled_time ?? null);
  const actualWakeMins = minutesOfTime(opts.actualWake ?? null);
  const usingActual = actualWakeMins != null;
  const wakeMins = actualWakeMins ?? plannedWakeMins;

  let durationMins: number | null = null;
  if (bedMins != null && wakeMins != null) {
    let d = wakeMins - bedMins;
    if (d <= 0) d += 24 * 60; // bedtime in the evening, wake the next morning
    durationMins = d;
  }

  return {
    wakeItem, bedItem, bedMins, plannedWakeMins, actualWakeMins, wakeMins, usingActual, durationMins,
    wakeLabel: fmtClock(wakeMins), durationLabel: fmtDuration(durationMins),
  };
}
