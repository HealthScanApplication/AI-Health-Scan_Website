/**
 * occurrences — an item happens at N times a day, and can offer options.
 *
 * DEV-836 + DEV-838, John: "Brush Teeth" is ONE item that recurs morning and
 * evening, not two items; and a meal slot holds several recipes with a choice
 * that can differ per day. He was explicit that N is arbitrary — staging already
 * has items with 9 and 10 occurrences (a contrast-therapy block), so nothing here
 * may assume a morning/evening pair.
 *
 * Pure, so the rules can be tested without a database or a renderer, and so the
 * timeline, the Routines list and the item editor all resolve identically. Every
 * function degrades to today's behaviour when there are no occurrences and no
 * options, which is what lets the tables ship inert.
 */

/** A row of `protocol_item_occurrences`. */
export interface ItemOccurrence {
  /** THE completion key for this occurrence — see the migration for why. */
  id: string;
  scheduled_time: string;
  recurrence_type?: string | null;
  recurrence_days_of_week?: number[] | null;
  recurrence_interval_days?: number | null;
  sort_order?: number | null;
}

/** A row of `protocol_item_options`. */
export interface ItemOption {
  id: string;
  catalog_recipe_id?: string | null;
  catalog_activity_id?: string | null;
  label?: string | null;
  duration_minutes?: number | null;
  sort_order?: number | null;
  is_default?: boolean | null;
}

/** The minimum an item must expose to be expanded. */
export interface OccurrenceItemLike {
  id: string;
  scheduled_time?: string | null;
}

/** One rendered point on the day: which item, at which time, ticking which id. */
export interface ResolvedOccurrence {
  /** The item this came from — identity, name, catalog link all live there. */
  itemId: string;
  /** What toggles when the user ticks it. The occurrence id when there is one,
   *  else the item's own id, so pre-occurrence items behave exactly as before. */
  completionId: string;
  scheduled_time: string | null;
  /** 1-based position among the item's occurrences; null when it has none. */
  index: number | null;
  count: number;
  occurrence: ItemOccurrence | null;
}

const timeKey = (t?: string | null) => String(t ?? '').slice(0, 5);

/**
 * Expand one item into the points it occupies on a day.
 *
 * No occurrences → a single point at the item's own `scheduled_time`, ticking the
 * item's own id. That is the entire backward-compatibility story: every existing
 * item takes this branch and nothing about it changes.
 *
 * Ordered by time, because the timeline reads top-to-bottom by clock and a
 * `sort_order` that disagreed with the times would render out of sequence.
 */
export function expandOccurrences(
  item: OccurrenceItemLike,
  occurrences: readonly ItemOccurrence[] | null | undefined,
): ResolvedOccurrence[] {
  const list = (occurrences ?? []).filter(o => o && o.id && o.scheduled_time);
  if (list.length === 0) {
    return [{
      itemId: item.id,
      completionId: item.id,
      scheduled_time: item.scheduled_time ?? null,
      index: null,
      count: 0,
      occurrence: null,
    }];
  }
  const ordered = [...list].sort((a, b) =>
    timeKey(a.scheduled_time).localeCompare(timeKey(b.scheduled_time))
    || (a.sort_order ?? 0) - (b.sort_order ?? 0)
    || a.id.localeCompare(b.id));
  return ordered.map((o, i) => ({
    itemId: item.id,
    completionId: o.id,
    scheduled_time: o.scheduled_time,
    index: i + 1,
    count: ordered.length,
    occurrence: o,
  }));
}

/** A stored per-day choice. `occurrence_id` null = the choice applies item-wide. */
export interface DaySelection {
  local_date: string;
  option_id: string;
  occurrence_id?: string | null;
}

export type OptionSource = 'day' | 'default' | 'first' | 'none';

export interface ResolvedOption {
  option: ItemOption | null;
  /** WHERE the answer came from, so the UI can say "just for today" honestly
   *  rather than showing a default as if the user had picked it. */
  source: OptionSource;
}

/**
 * Which option applies, for this day and this occurrence.
 *
 * Order: the day's own choice → the item default → the first option → none.
 *
 * A day-level choice (no `occurrence_id`) applies to every occurrence that has
 * no choice of its own, so "pancakes today" can be said once without repeating
 * it per sitting — while a per-occurrence choice still wins for its own sitting.
 */
export function resolveOptionForDay(
  options: readonly ItemOption[] | null | undefined,
  selections: readonly DaySelection[] | null | undefined,
  localDate: string,
  occurrenceId?: string | null,
): ResolvedOption {
  const list = (options ?? []).filter(Boolean);
  if (list.length === 0) return { option: null, source: 'none' };
  const byId = new Map(list.map(o => [o.id, o]));

  const today = (selections ?? []).filter(s => s && s.local_date === localDate);
  // The occurrence's own choice outranks a day-wide one.
  const exact = occurrenceId ? today.find(s => s.occurrence_id === occurrenceId) : undefined;
  const itemWide = today.find(s => !s.occurrence_id);
  for (const s of [exact, itemWide]) {
    const chosen = s && byId.get(s.option_id);
    // A selection pointing at a deleted option falls through rather than
    // resolving to nothing — the user still gets the default, not a blank row.
    if (chosen) return { option: chosen, source: 'day' };
  }

  const dflt = list.find(o => o.is_default);
  if (dflt) return { option: dflt, source: 'default' };

  const ordered = [...list].sort((a, b) =>
    (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id.localeCompare(b.id));
  return { option: ordered[0], source: 'first' };
}

/** Display name for an option — its label, else the caller's catalog lookup. */
export function optionLabel(option: ItemOption | null, fallback?: string | null): string | null {
  if (!option) return fallback ?? null;
  const label = String(option.label ?? '').trim();
  return label || fallback || null;
}
