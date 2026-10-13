/*
 * protocolDomain/sleepWindow — single source of truth for a protocol's sleep
 * day-anchors. SHARED, portable logic: no repo-specific imports (no RN, no DOM,
 * no icon libs). This file is mirrored BYTE-FOR-BYTE in both repos:
 *   web:    src/protocolDomain/sleepWindow.ts
 *   mobile: src/protocolDomain/sleepWindow.ts
 * (scripts/check-domain-sync diffs them). Edit both together.
 *
 * A protocol day is book-ended by a WAKE (End Sleep) and a BEDTIME (Start Sleep).
 * They can be real protocol_items (category 'sleep', e.g. "Wake at 4am") or
 * virtual defaults (06:00 / 22:00). Owns wake/bedtime detection, the sleep-window
 * calc (bedtime → wake, crossing midnight), and an optional `actualWake` override
 * (Apple Health / a wearable sleep log) that re-times the wake and recomputes the
 * hours slept.
 */

const WAKE_RE = /^(wake|end[\s-]?sleep|rise|get[\s-]?up|morning[\s-]?wake)\b/i;
export const isWakeName = (n?: string | null) => WAKE_RE.test((n || '').trim());
export function isBedName(n?: string | null): boolean {
  const t = (n || '').trim();
  if (isWakeName(t)) return false;
  if (/(prep|prepare|wind[\s-]?down|reflection)/i.test(t)) return false;
  return /\b(start[\s-]?sleep|bed(time)?|lights[\s-]?out|sleep)\b/i.test(t);
}
export const isSleepCategory = (c?: string | null) => (c || '').toLowerCase() === 'sleep';

export function minutesOfTime(t?: string | null): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(t || '');
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
}
export function fmtDuration(mins: number | null | undefined): string {
  if (mins == null) return '';
  const h = Math.floor(mins / 60), m = Math.round(mins % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}
export function fmtClock(mins: number | null | undefined): string {
  if (mins == null) return '';
  let h = Math.floor(mins / 60) % 24; const m = Math.round(mins % 60);
  const ap = h < 12 ? 'am' : 'pm'; h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')}${ap}`;
}
/** A Date → 'HH:MM' (local), for feeding a wearable/logged wake time in. */
export function dateToHHMM(d?: Date | null): string | null {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return null;
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

export interface SleepItemLike {
  display_name?: string | null;
  scheduled_time?: string | null;
  category?: string | null;
  /** Which bookend this row IS, when the source knows. Wearable-derived rows set
   *  it (features/protocol/timeline/sleepAnchors); protocol items leave it unset
   *  and fall back to the name. Same field `sleepConsolidate.sleepActionBucket`
   *  already treats as authoritative — one claim, read the same way in both. */
  sleep_anchor?: 'wake' | 'bed' | null;
}

export interface SleepWindow<T> {
  wakeItem?: T; bedItem?: T;
  bedMins: number | null;
  plannedWakeMins: number | null;
  actualWakeMins: number | null;
  wakeMins: number | null;
  usingActual: boolean;
  durationMins: number | null;
  wakeLabel: string;
  durationLabel: string;
}

export function computeSleepWindow<T extends SleepItemLike>(
  items: T[],
  opts: { actualWake?: string | null } = {},
): SleepWindow<T> {
  /**
   * ROLE FIRST, then the name, and only then the clock.
   *
   * John, 2026-08-11: his Aug 9 read "Sleep 2:01am · woke 2:01am". 2:01am is when
   * he went TO sleep; the wake was 8:55am, and that row rendered bare.
   *
   * The cause was the clock branch below. A sleep-category row before noon was
   * counted as a WAKE, so the 02:01 sleep-START joined `wakes`, sorted first
   * (earliest wins) and became `wakeItem` — taking the wake subtitle, and worse,
   * supplying `plannedWakeMins`, which is what re-anchors the whole morning. The
   * day was being re-timed from a bedtime.
   *
   * This is the same inference #1060 removed from `hasStartSleep`, surviving in
   * the twin. `sleepSessions.ts` states the rule the model runs on: "Nothing
   * infers start-vs-end from the hour." A row's ROLE is data — wearable rows
   * carry `sleep_anchor`, exactly as `sleepActionBucket` reads it — so an
   * explicit claim is honoured before anything is guessed.
   *
   * The clock stays as the LAST resort for a planned protocol item with no claim
   * and no recognisable name, but it may no longer overrule a bed NAME: that is
   * what let "Sleep" at 02:01 read as a wake.
   */
  const claims = (i: T, bucket: 'wake' | 'bed') => i.sleep_anchor === bucket;
  const unclaimed = (i: T) => i.sleep_anchor !== 'wake' && i.sleep_anchor !== 'bed';
  const wakes = items
    .filter((i) => claims(i, 'wake') || (unclaimed(i) && (
      isWakeName(i.display_name)
      || (isSleepCategory(i.category) && !isBedName(i.display_name)
        && (minutesOfTime(i.scheduled_time) ?? 1e9) < 720))))
    .sort((a, b) => (minutesOfTime(a.scheduled_time) ?? 1e9) - (minutesOfTime(b.scheduled_time) ?? 1e9));
  const beds = items
    .filter((i) => claims(i, 'bed') || (unclaimed(i) && (
      isBedName(i.display_name)
      || (isSleepCategory(i.category) && !isWakeName(i.display_name)
        && (minutesOfTime(i.scheduled_time) ?? -1) >= 720))))
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
    if (d <= 0) d += 24 * 60;
    durationMins = d;
  }

  return {
    wakeItem, bedItem, bedMins, plannedWakeMins, actualWakeMins, wakeMins, usingActual, durationMins,
    wakeLabel: fmtClock(wakeMins), durationLabel: fmtDuration(durationMins),
  };
}
