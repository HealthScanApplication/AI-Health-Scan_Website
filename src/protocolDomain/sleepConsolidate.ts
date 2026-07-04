/*
 * protocolDomain/sleepConsolidate — merge scattered sleep ACTION rows into the
 * day's two canonical sleep anchors (spec 4, 2026-07-04). A protocol can end up
 * with several sleep-ish action rows at once — an authored "Sleep 8h", a typed
 * "Start Sleep" anchor, an injected virtual anchor, a wearable "Slept 12:54am →
 * 8:56am" card — which read as duplicate sleep entries. The timeline should
 * show exactly ONE wake anchor (End Sleep) and ONE bedtime anchor (Start
 * Sleep).
 *
 * Selection per bucket, best first:
 *   1. recorded wearable sleep (source 'oura' / id 'oura_sleep_…') — a real
 *      measurement beats any plan;
 *   2. a real persisted protocol item;
 *   3. an injected virtual anchor ('__virtual_…').
 * Ties: the earliest time wins the WAKE bucket, the latest wins the BED bucket.
 * A dropped row's notes carry onto the winner when the winner has none, so
 * authored guidance ("Aim for 8 hours") isn't lost.
 *
 * Render-layer only — nothing is persisted, rules are untouched (they nest via
 * sleepRules.ts), and when each bucket already has ≤1 candidate the input
 * array is returned unchanged (same reference).
 *
 * SHARED, portable (no DOM/RN imports) — mirror to the web repo with the other
 * protocolDomain modules.
 */
import { isWakeName, isBedName, isSleepCategory, minutesOfTime } from './sleepWindow';

export interface SleepActionLike {
  id?: string | null;
  display_name?: string | null;
  scheduled_time?: string | null;
  category?: string | null;
  kind?: string | null;
  parent_protocol_item_id?: string | null;
  source?: string | null;
  notes?: string | null;
}

const isAction = (i: SleepActionLike) => i.kind === undefined || i.kind === null || i.kind === 'action';
const isRecorded = (i: SleepActionLike) =>
  (i.source || '').toLowerCase() === 'oura' || (i.id || '').startsWith('oura_sleep');
const isVirtual = (i: SleepActionLike) => (i.id || '').startsWith('__virtual_');

type Bucket = 'wake' | 'bed' | null;

/** Which sleep-anchor bucket an ACTION row belongs to, or null for non-sleep. */
export function sleepActionBucket(i: SleepActionLike): Bucket {
  if (!isAction(i) || i.parent_protocol_item_id) return null;
  const mins = minutesOfTime(i.scheduled_time);
  const beforeNoon = mins != null && mins < 12 * 60;
  if (isWakeName(i.display_name)) return 'wake';
  if (isBedName(i.display_name)) return 'bed';
  if (isSleepCategory(i.category)) return mins == null ? 'bed' : beforeNoon ? 'wake' : 'bed';
  return null;
}

/** 0 = best. */
function tier(i: SleepActionLike): number {
  if (isRecorded(i)) return 0;
  if (!isVirtual(i)) return 1;
  return 2;
}

function pickWinner<T extends SleepActionLike>(candidates: T[], bucket: 'wake' | 'bed'): T {
  return [...candidates].sort((a, b) => {
    const t = tier(a) - tier(b);
    if (t !== 0) return t;
    const ma = minutesOfTime(a.scheduled_time) ?? (bucket === 'wake' ? 1e9 : -1);
    const mb = minutesOfTime(b.scheduled_time) ?? (bucket === 'wake' ? 1e9 : -1);
    return bucket === 'wake' ? ma - mb : mb - ma;
  })[0];
}

/** Stamped onto a recorded wake winner that displaced a PLANNED anchor, so the
 *  wake-anchored rescheduler keeps its planned-vs-actual delta. Without this,
 *  dropping the planned anchor makes computeSleepWindow read the recorded time
 *  as "planned" too → delta 0 → the whole-day re-anchor silently disables
 *  (8:00 items rendering above an 8:56 recorded wake — the reported bug). */
export interface ConsolidatedSleepMeta {
  _plannedWakeMin?: number;
}

/**
 * Collapse duplicate sleep action rows to one wake + one bed anchor.
 * Returns the SAME array reference when nothing needs merging.
 */
export function consolidateSleepActions<T extends SleepActionLike>(
  items: T[],
): Array<T & ConsolidatedSleepMeta> {
  const wake: T[] = [];
  const bed: T[] = [];
  for (const i of items) {
    const b = sleepActionBucket(i);
    if (b === 'wake') wake.push(i);
    else if (b === 'bed') bed.push(i);
  }
  if (wake.length <= 1 && bed.length <= 1) return items;

  const drop = new Set<T>();
  const carryNotes = new Map<T, string>();
  const carryPlanned = new Map<T, number>();
  for (const [bucket, arr] of [['wake', wake], ['bed', bed]] as const) {
    if (arr.length <= 1) continue;
    const winner = pickWinner(arr, bucket);
    for (const loser of arr) {
      if (loser === winner) continue;
      drop.add(loser);
      // Preserve authored guidance when the winner carries none.
      if (!winner.notes && loser.notes && !carryNotes.has(winner)) carryNotes.set(winner, loser.notes);
      // Preserve the PLANNED wake time when a recorded measurement displaces a
      // planned anchor — earliest planned candidate wins the stamp.
      if (bucket === 'wake' && isRecorded(winner) && !isRecorded(loser)) {
        const m = minutesOfTime(loser.scheduled_time);
        if (m != null && (!carryPlanned.has(winner) || m < (carryPlanned.get(winner) as number))) {
          carryPlanned.set(winner, m);
        }
      }
    }
  }
  return items
    .filter((i) => !drop.has(i))
    .map((i) => {
      if (!carryNotes.has(i) && !carryPlanned.has(i)) return i;
      const out: T & ConsolidatedSleepMeta = { ...i };
      if (carryNotes.has(i)) out.notes = carryNotes.get(i);
      if (carryPlanned.has(i)) out._plannedWakeMin = carryPlanned.get(i);
      return out;
    });
}
