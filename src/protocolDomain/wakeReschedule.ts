/**
 * Wake-anchored rescheduling (view-only, derived).
 *
 * When the user's ACTUAL wake time (from Oura / Apple Health, via
 * `resolveActualWake` + `computeSleepWindow`) is later than the protocol's
 * planned wake anchor, the WHOLE day re-anchors to real wake so nothing sits
 * before the recorded wake time.
 *
 * Algorithm — RE-ANCHOR BY UNIFORM DELTA (cascade):
 *   delta  = clamp(actualWake − plannedWake, 0, cap)
 *   newT   = clamp(origT + delta, 0, 23:59)   for every eligible item
 * This maps the planned-wake point onto actual wake and slides every other item
 * by the same amount, so relative ORDER and SPACING are preserved. Because every
 * item scheduled at/after the planned wake shifts by (actual − planned), it lands
 * at/after actual wake — i.e. nothing in the day's routine precedes real wake
 * (the reported bug: an 8:00 "Water Throughout the Day" sitting above an 8:56
 * wake now moves to after wake). Shift-by-delta and re-anchor-at-wake are the
 * same operation when delta = actual − planned; we shift by that delta.
 *
 * This supersedes the earlier morning-only cutoff + meals-pinned behaviour:
 * EVERYTHING shifts (meals, afternoon, evening included), bounded only by the
 * safety cap and the per-item override.
 *
 * Pinned (never shifted) by default:
 *   • sleep bookends (End Sleep / Start Sleep / category:'sleep') — owned by
 *     computeSleepWindow, which already re-times the wake anchor to actual wake.
 *   • already-COMPLETED items — they happened at their real time; re-timing a
 *     done item would be misleading. (Un-completed items that are now "past"
 *     because you slept in are exactly what should move after wake, so they do.)
 *
 * Explicit per-item override (`protocol_items.wake_relative`, DEV-409 column):
 *   true  → always shift (ignores the pins above)
 *   false → always pin
 *   null  → the default rules above
 *
 * View-only: nothing is persisted; the caller (ProtocolWidget) applies this to
 * the timeline before sorting/bucketing, so it recomputes when wearable data
 * updates and is inherently today-only. Skipped entirely on past days.
 */
import { minutesOfTime, isSleepCategory, isWakeName, isBedName } from './sleepWindow';

const DAY_MAX_MIN = 24 * 60 - 1; // 23:59
export const DEFAULT_MAX_SHIFT_MIN = 4 * 60; // 4h safety cap

export interface WakeShiftItemLike {
  scheduled_time?: string | null;
  category?: string | null;
  display_name?: string | null;
  /** Explicit override (DEV-409 column). true = always shift, false = always pin. */
  wake_relative?: boolean | null;
  /** When true, the item is already done and is left at its real time. */
  completed?: boolean | null;
}

export interface WakeShiftOptions {
  /** Protocol's planned wake anchor, minutes-of-day (computeSleepWindow.plannedWakeMins). */
  plannedWakeMins?: number | null;
  /** Actual wake, minutes-of-day (computeSleepWindow.actualWakeMins / resolveActualWake). */
  actualWakeMins?: number | null;
  /** Safety cap on the shift, minutes. Default 240 (4h). */
  maxShiftMin?: number;
}

/** Format minutes-of-day to a 24h "HH:MM" clock string. */
function fmtHHMM(mins: number): string {
  const clamped = Math.max(0, Math.min(DAY_MAX_MIN, Math.round(mins)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Minutes to slide the day forward: `max(0, actual − planned)`, capped.
 * Returns 0 when the user woke early/on-time or either anchor is unknown.
 */
export function wakeShiftMinutes(opts: WakeShiftOptions): number {
  const { plannedWakeMins, actualWakeMins, maxShiftMin = DEFAULT_MAX_SHIFT_MIN } = opts;
  if (plannedWakeMins == null || actualWakeMins == null) return 0;
  const delta = actualWakeMins - plannedWakeMins;
  if (delta <= 0) return 0;
  return Math.min(delta, Math.max(0, maxShiftMin));
}

/** True for the sleep bookends, which computeSleepWindow owns. */
function isSleepBookend(it: WakeShiftItemLike): boolean {
  return isSleepCategory(it.category) || isWakeName(it.display_name) || isBedName(it.display_name);
}

/** Marker attached to items whose time this module derived, for optional UI badging. */
export interface WakeShiftMeta {
  _wakeShiftedFromMin?: number;
}

/**
 * Return `items` with a derived `scheduled_time` for every item that re-anchors
 * to actual wake. Non-eligible items are returned by reference. When there is no
 * shift to apply, the original array is returned unchanged.
 */
export function applyWakeShift<T extends WakeShiftItemLike>(
  items: T[],
  opts: WakeShiftOptions,
): Array<T & WakeShiftMeta> {
  const shift = wakeShiftMinutes(opts);
  if (shift <= 0) return items as Array<T & WakeShiftMeta>;

  return items.map((it) => {
    const mins = minutesOfTime(it.scheduled_time ?? null);
    if (mins == null) return it; // no time → nothing to place

    let eligible: boolean;
    if (it.wake_relative === true) {
      eligible = true; // explicit: always shift
    } else if (it.wake_relative === false) {
      eligible = false; // explicit: always pin
    } else {
      // Default: shift EVERYTHING except sleep bookends and completed items.
      eligible = !isSleepBookend(it) && it.completed !== true;
    }
    if (!eligible) return it;

    const shifted = Math.min(mins + shift, DAY_MAX_MIN);
    if (shifted === mins) return it;
    return { ...it, scheduled_time: fmtHHMM(shifted), _wakeShiftedFromMin: mins };
  });
}
