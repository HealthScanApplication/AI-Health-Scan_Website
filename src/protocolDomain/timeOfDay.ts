/*
 * protocolDomain/timeOfDay — top-level time-of-day bucketing for protocol items.
 * SHARED, portable (no DOM/RN/icon imports). Mirrored BYTE-FOR-BYTE in both repos
 * (web + mobile src/protocolDomain/timeOfDay.ts). Edit both together.
 */
import { isSleepCategory } from './sleepWindow';
import { claimsBedAnchor, claimsWakeAnchor } from './sleepAnchorClaim';

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
 *   2. else scheduled_time, banded by the clock alone — see `todForHour`. The
 *      wake-hour Morning floor that used to send pre-wake items to the previous
 *      Evening was removed in DEV-1157; it filed a third of a seeded morning
 *      routine under EVENING whenever the wearable reported a late wake.
 */
export function getItemTod(
  item: { group_name?: string | null; scheduled_time?: string | null; display_name?: string | null; category?: string | null },
  wakeHour = 5,
): SimpleTod {
  // Sleep bookends are deterministic and take priority over the group keyword
  // regex:
  //   • a WAKE anchor ("End Sleep"/"Wake"/a morning sleep-category item) is
  //     ALWAYS Morning — the '/sleep/' group regex would otherwise mis-file it
  //     as Evening. (It also used to be pushed to the previous Evening by the
  //     wake-hour floor when the wearable reported a later wake than the
  //     anchor's own time; that floor is gone as of DEV-1157, but this rule
  //     still earns its place against the group regex.)
  //   • a BEDTIME anchor ("Start Sleep"/an afternoon-or-later sleep item) is
  //     ALWAYS Evening.
  const sleepHm = parseHM(item.scheduled_time);
  const sleepCat = isSleepCategory(item.category);
  // Row-level: banding by NAME alone sent every "Bedtime Snack" to Evening
  // regardless of its clock, which makes "the item lands where you added it"
  // structurally unreachable for anything a user happens to name that way.
  if (claimsWakeAnchor(item) || (sleepCat && sleepHm != null && sleepHm.h < 12)) return 'Morning';
  if (claimsBedAnchor(item) || (sleepCat && sleepHm != null && sleepHm.h >= 12)) return 'Evening';

  const g = (item.group_name || '').toLowerCase();
  if (g) {
    if (/morning|wake|(^|\s)am(\s|$)/.test(g)) return 'Morning';
    if (/afternoon/.test(g)) return 'Afternoon';
    if (/evening|night|bed|sleep|(^|\s)pm(\s|$)/.test(g)) return 'Evening';
    // custom group names (detox, performance, week…) → fall through to time
  }
  const hm = parseHM(item.scheduled_time);
  if (!hm) return 'Morning';
  return todForHour(hm.h, wakeHour);
}

/**
 * The band an HOUR falls in. Extracted from getItemTod so anything that needs
 * "which part of the day is it" — including surfaces with no scheduled_time,
 * like the Add Item suggestions (DEV-812) — bands identically to the timeline
 * instead of re-picking its own boundaries.
 *
 * ── THE BANDS PARTITION THE CLOCK, AND NOTHING SHIFTS THEM (DEV-1157) ───────
 *
 * [00:00,12:00) Morning · [12:00,17:00) Afternoon · [17:00,24:00) Evening.
 * Three contiguous windows, in clock order, covering the whole day.
 *
 * This used to carry a wake-hour Morning FLOOR, so any hour before your wake
 * fell past the Morning test and hit the trailing `return 'Evening'` — the idea
 * being that 04:00 when you wake at 07:00 belongs to the previous evening.
 *
 * That is the bug John reported as "the morning/afternoon/evening headers are
 * wrong", and it is much bigger than the 4am edge case it was written for.
 * `wakeHour` is derived from the WEARABLE's actual wake, so it moves every day:
 * measured against the repo's own seeded protocols, a 07:00 wake files 34 real
 * morning items under EVENING, an 08:00 wake files 80, and a 09:00 wake files
 * 111 of 362. Sleep in and half your morning routine jumps to the bottom of the
 * day. Group names accidentally rescued some rows ("Morning Skincare" matches
 * the keyword branch above) and not others, which is why the result looked
 * arbitrary rather than simply shifted.
 *
 * It also broke the timeline's contract that rail times ascend top→bottom
 * (John, 2026-07-27): a 06:30 row banded Evening sorts to the TOP of Evening,
 * so the section read 06:30 → 18:00 → 21:00. ANY rule mapping an early hour to
 * a late band breaks that, so the bands must stay contiguous — the previous
 * evening is the previous DAY's section in the continuum, never a late band on
 * this one.
 *
 * The case the floor existed for still works: a 4am riser has wakeHour 4 and
 * a 04:30 item, and 04:30 is Morning here because every pre-noon hour is.
 *
 * `wakeHour` is kept in the signature — callers thread it positionally and this
 * module is mirrored byte-for-byte in the web repo — but it no longer moves a
 * boundary. Wake-awareness still belongs to FREE TIME, where you genuinely
 * cannot plan into the hours before you are up: see `bandWindows` in
 * features/protocol/timeline/sectionFreeTime.ts, which opens Morning at wake
 * and, notably, never sent those early hours to Evening either. The two models
 * now agree.
 */
export function todForHour(hour: number, _wakeHour = 5): SimpleTod {
  if (hour >= 17) return 'Evening';
  if (hour >= 12) return 'Afternoon';
  return 'Morning';
}
