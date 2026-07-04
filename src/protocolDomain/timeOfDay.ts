/*
 * protocolDomain/timeOfDay — top-level time-of-day bucketing for protocol items.
 * SHARED, portable (no DOM/RN/icon imports). Mirrored BYTE-FOR-BYTE in both repos
 * (web + mobile src/protocolDomain/timeOfDay.ts). Edit both together.
 */
import { isWakeName, isBedName, isSleepCategory } from './sleepWindow';

export type SimpleTod = 'Morning' | 'Afternoon' | 'Evening';
export const TOD_ORDER: SimpleTod[] = ['Morning', 'Afternoon', 'Evening'];

export function parseHM(t?: string | null): { h: number; m: number; mins: number } | null {
  if (!t) return null;
  const x = /^(\d{1,2}):(\d{2})/.exec(t);
  if (!x) return null;
  const h = parseInt(x[1], 10), m = parseInt(x[2], 10);
  return { h, m, mins: h * 60 + m };
}

/**
 * Map an item to one of the three top-level TOD buckets.
 *   1. group_name wins (Morning/Afternoon/Evening keywords, word-bounded so
 *      "equipment"/"amino" don't false-match "pm"/"am").
 *   2. else scheduled_time, with a wake-hour-shifted Morning floor: pre-wake
 *      items (e.g. 04:00 when you wake at 07:00) fall into the previous Evening.
 */
export function getItemTod(
  item: { group_name?: string | null; scheduled_time?: string | null; display_name?: string | null; category?: string | null },
  wakeHour = 5,
): SimpleTod {
  // Sleep bookends are deterministic and take priority over both the group
  // keyword regex and the wake-hour Morning floor:
  //   • a WAKE anchor ("End Sleep"/"Wake"/a morning sleep-category item) is
  //     ALWAYS Morning — otherwise a 07:00 End Sleep gets pushed to the previous
  //     Evening whenever the computed wakeHour (e.g. a wearable wake of 08:00) is
  //     later than the anchor's own time, and the '/sleep/' group regex would
  //     also mis-file it.
  //   • a BEDTIME anchor ("Start Sleep"/an afternoon-or-later sleep item) is
  //     ALWAYS Evening.
  const sleepHm = parseHM(item.scheduled_time);
  const sleepCat = isSleepCategory(item.category);
  if (isWakeName(item.display_name) || (sleepCat && sleepHm != null && sleepHm.h < 12)) return 'Morning';
  if (isBedName(item.display_name) || (sleepCat && sleepHm != null && sleepHm.h >= 12)) return 'Evening';

  const g = (item.group_name || '').toLowerCase();
  if (g) {
    if (/morning|wake|(^|\s)am(\s|$)/.test(g)) return 'Morning';
    if (/afternoon/.test(g)) return 'Afternoon';
    if (/evening|night|bed|sleep|(^|\s)pm(\s|$)/.test(g)) return 'Evening';
    // custom group names (detox, performance, week…) → fall through to time
  }
  const hm = parseHM(item.scheduled_time);
  if (!hm) return 'Morning';
  const morningStart = Math.max(0, Math.min(11, wakeHour));
  if (hm.h >= morningStart && hm.h < 12) return 'Morning';
  if (hm.h >= 12 && hm.h < 17) return 'Afternoon';
  return 'Evening';
}
