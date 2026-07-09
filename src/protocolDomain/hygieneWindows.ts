/**
 * hygieneWindows — the single definition of "when is hygiene a morning/evening
 * bookend" (DEV-418, extracted from ProtocolWidget + ActiveProtocolCard where
 * the windows were defined twice and had started to drift).
 *
 * Two DISTINCT window families live here on purpose — they answer different
 * questions and must not be merged:
 *
 *   1. BANDING (hygieneSlotName): which band does a protocol's own hygiene item
 *      render under? Hour-granular, generous morning window (wake → wake+3h,
 *      capped at noon) so a 9am shower still lands in MORNING HYGIENE, evening
 *      from 17:00.
 *   2. SUPPRESSION (isNearWake / isNearBed): does the protocol's own hygiene
 *      item cover a Daily Basics default (so the basics row steps aside)?
 *      Minute-granular and tighter, anchored to the day's ACTUAL wake/bed.
 */

export const HYGIENE_SLOT_MORNING = 'Morning Hygiene';
export const HYGIENE_SLOT_EVENING = 'Evening Hygiene';

/** Minimal shape both call sites can satisfy without importing ProtocolItem. */
export interface HygieneBandable {
  group_name?: string | null;
  subtype?: string | null;
  scheduled_time?: string | null;
  /** rule_do / rule_dont rows never band as hygiene, whatever their group. */
  kind?: string | null;
}

const hourOf = (t?: string | null): number => {
  const m = String(t || '').match(/^(\d{1,2}):/);
  return m ? parseInt(m[1], 10) : -1;
};

/**
 * Hygiene-slot binding for the day timeline. Order:
 *   1. group_name 'Morning Hygiene' / 'Evening Hygiene' — the explicit contract
 *      written by the slot restructure (DEV-404); always wins.
 *   2. subtype 'hygiene' banded by scheduled_time — wake-relative: morning is
 *      wake → min(noon, wake+3h); evening is ≥ 17:00. Midday hygiene (e.g. an
 *      SPF touch-up, a 10am bowel cleanse) stays in the normal Do flow.
 * Returns the slot name, or null when the item is not a hygiene bookend.
 */
export function hygieneSlotName(
  item: HygieneBandable,
  wakeHour: number = 0,
): string | null {
  if (item.kind && item.kind !== 'action') return null;
  const g = String(item.group_name || '').trim().toLowerCase();
  if (g === 'morning hygiene') return HYGIENE_SLOT_MORNING;
  if (g === 'evening hygiene') return HYGIENE_SLOT_EVENING;
  if (String(item.subtype || '') !== 'hygiene') return null;
  const h = hourOf(item.scheduled_time);
  if (h < 0) return null;
  if (h >= wakeHour && h < Math.min(12, wakeHour + 3)) return HYGIENE_SLOT_MORNING;
  if (h >= 17) return HYGIENE_SLOT_EVENING;
  return null;
}

/** Suppression window around the actual wake: wake−30min … wake+2h30. */
export const WAKE_WINDOW_BEFORE_MIN = 30;
export const WAKE_WINDOW_AFTER_MIN = 150;
/** Suppression window around the actual bedtime: bed−2h30 … bed+30min. */
export const BED_WINDOW_BEFORE_MIN = 150;
export const BED_WINDOW_AFTER_MIN = 30;

/** Is minute-of-day `m` inside the wake bookend window anchored at `wakeMin`? */
export function isNearWake(m: number | null | undefined, wakeMin: number): boolean {
  return m != null && m >= wakeMin - WAKE_WINDOW_BEFORE_MIN && m <= wakeMin + WAKE_WINDOW_AFTER_MIN;
}

/** Is minute-of-day `m` inside the bed bookend window anchored at `bedMin`? */
export function isNearBed(m: number | null | undefined, bedMin: number): boolean {
  return m != null && m >= bedMin - BED_WINDOW_BEFORE_MIN && m <= bedMin + BED_WINDOW_AFTER_MIN;
}
