/**
 * activitySteps — the catalog's HOW-TO steps become the user's sub-steps.
 *
 * John, 2026-07-31: "The routine has additional info about how to do it, ie
 * sub-steps." The STEPS shown on an activity's detail page and the Subtasks in
 * the edit modal are the SAME concept at two levels:
 *
 *   catalog_activity_steps  — the catalog's. Scoped to the activity, everywhere,
 *                             for everyone. Read-only. 3,120 rows today, with
 *                             instruction / duration / reps / sets / rest.
 *   sub-step rows           — the user's. Scoped to THIS row in THIS routine.
 *                             Editable, completable, timeable. Stored as
 *                             protocol_items children (parent_protocol_item_id).
 *
 * COPIED, NOT REFERENCED. Two requirements rule out a reference: the detail tray
 * must show the canonical how-to for an activity you have NOT adopted, and a user
 * must be able to delete step 3 of their own morning without editing the catalog
 * for everyone. A reference model has to break one of them. After the copy the
 * rows are the user's outright — editing a sub-step never writes back to the
 * catalog, and a catalog edit never silently rewrites someone's routine.
 *
 * COPIED ON REQUEST, NOT ON ADD (approved 2026-07-31). Materialising every step
 * automatically would turn a 5-step Wake Up into six timeline rows, and adopting
 * a whole routine would multiply the day. Steps stay read-only in the tray until
 * the user asks for them with "Use these steps".
 *
 * ALWAYS READ LIVE. The steps are being curated down to a minimal essential set
 * ("some activities are overblown with sub steps, keep it minimal"), so this
 * NEVER snapshots or caches them and never carries its own copy of a step list.
 * Whatever the catalog holds at the moment the user taps is what gets copied —
 * which is what makes the curation land here for free rather than needing a
 * second pass over already-materialised sub-steps.
 *
 * MULTI-TIMER FALLS OUT OF THIS. `duration_seconds` and `rest_seconds` are
 * already on the catalog step, and a sub-step is a protocol_item, which already
 * has duration_minutes / rest_seconds / work_seconds / rounds (DEV-340). So a
 * sauna's hot and cold segments are simply two steps with durations, and the
 * `timer_segments` jsonb proposed in DEV-778 is withdrawn as unnecessary.
 */

/** One row of `catalog_activity_steps`. Only the fields a sub-step needs. */
export interface CatalogActivityStep {
  id?: string;
  step_number?: number | null;
  /** Short label, when the catalog has one. Most rows carry only `instruction`. */
  title?: string | null;
  instruction?: string | null;
  description?: string | null;
  tips?: string | null;
  duration_seconds?: number | null;
  rest_seconds?: number | null;
  /** Optional catalog curriculum grouping; copied steps remain ordinary subtasks. */
  skill_group?: string | null;
  skill_group_order?: number | null;
}

/** A sub-step ready to be written as a protocol_items child. */
export interface MaterialisedSubStep {
  display_name: string;
  notes: string | null;
  sort_order: number;
  /** Rounded up from the catalog's seconds — see below. */
  duration_minutes: number | null;
  rest_seconds: number | null;
}

/** Longest a sub-step NAME may be before it is carried as notes instead. */
export const SUBSTEP_NAME_MAX = 80;

const clean = (v: unknown): string => String(v ?? '').replace(/\s+/g, ' ').trim();

/**
 * The sub-step's NAME.
 *
 * Prefers the catalog's own `title` when it has one. Otherwise the instruction
 * IS the name — but instructions are written as full sentences ("Set alarm for
 * 4:50 AM to allow 10 minutes before official wake time.") and a checklist row
 * is not a paragraph, so a long one is cut at its first sentence and the whole
 * text is kept in the notes. Nothing is lost, and the row stays readable.
 */
export function subStepName(step: CatalogActivityStep): string {
  const title = clean(step.title);
  if (title) return title;
  const instruction = clean(step.instruction);
  if (!instruction) return '';
  if (instruction.length <= SUBSTEP_NAME_MAX) return instruction.replace(/\.$/, '');
  const firstSentence = instruction.split(/(?<=[.!?])\s+/)[0] ?? instruction;
  const head = firstSentence.length <= SUBSTEP_NAME_MAX ? firstSentence : instruction.slice(0, SUBSTEP_NAME_MAX).trimEnd();
  return head.replace(/[.,;:]$/, '');
}

/**
 * The sub-step's NOTES: the full instruction when the name had to be shortened,
 * plus the catalog's description and tips. Joined rather than overwritten —
 * a tip and a description are both worth keeping.
 */
export function subStepNotes(step: CatalogActivityStep): string | null {
  const instruction = clean(step.instruction);
  const name = subStepName(step);
  const parts = [
    // Only when the name does not already say it.
    instruction && instruction.replace(/\.$/, '') !== name ? instruction : '',
    clean(step.description),
    clean(step.tips) ? `Tip: ${clean(step.tips)}` : '',
  ].filter(Boolean);
  return parts.length ? parts.join('\n\n') : null;
}

/**
 * Seconds → whole minutes, rounding UP, because a sub-step is planned in
 * minutes and a 90-second step that rounds to 1 min reads as shorter than it is.
 * Zero and negatives are absent, not zero: "0 min" on a card looks measured.
 */
export function stepDurationMinutes(seconds: number | null | undefined): number | null {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) return null;
  return Math.max(1, Math.ceil(seconds / 60));
}

const positiveInt = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v) : null;

/**
 * Turn ONE catalog step into a sub-step, or null when there is nothing to show.
 * A step with no title and no instruction is not a step.
 */
export function materialiseStep(step: CatalogActivityStep, index: number): MaterialisedSubStep | null {
  const display_name = subStepName(step);
  if (!display_name) return null;
  return {
    display_name,
    notes: subStepNotes(step),
    sort_order: index,
    duration_minutes: stepDurationMinutes(step.duration_seconds),
    rest_seconds: positiveInt(step.rest_seconds),
  };
}

/**
 * Turn a whole catalog step list into sub-steps, in the catalog's own order.
 *
 * Ordered by `step_number` and NOT by arrival order — a how-to is a sequence, and
 * PostgREST makes no ordering promise the caller can rely on. Steps without a
 * number keep their relative position after the numbered ones rather than
 * jumping to the front on a `?? 0` default.
 *
 * `sort_order` is re-indexed 0..n-1 so a curated list whose numbers now read
 * 1, 4, 7 still produces contiguous sub-steps.
 */
export function materialiseSteps(steps: readonly CatalogActivityStep[] | null | undefined): MaterialisedSubStep[] {
  if (!Array.isArray(steps) || steps.length === 0) return [];
  const ordered = steps
    .map((step, i) => ({ step, i, n: positiveInt(step.step_number) }))
    .sort((a, b) => {
      if (a.n != null && b.n != null) return a.n - b.n || a.i - b.i;
      if (a.n != null) return -1;
      if (b.n != null) return 1;
      return a.i - b.i;
    });
  const out: MaterialisedSubStep[] = [];
  for (const { step } of ordered) {
    const sub = materialiseStep(step, out.length);
    if (sub) out.push(sub);
  }
  return out;
}

/**
 * Which catalog steps are NOT yet present as sub-steps.
 *
 * "Use these steps" must be safe to press twice: the second press should add
 * only what the curation introduced since, never a second copy of everything.
 *
 * Matched on the NORMALISED NAME, and that is a real limitation worth stating
 * rather than hiding. The exact match would be the catalog step's id, but
 * `protocol_items` has no column to persist it — and adding a field the schema
 * cannot store would be the same mistake as writing `duration_minutes` on a sleep
 * row nothing reads (DEV-754). So: a sub-step the user RENAMED is no longer
 * recognised and would be added again. Adding a `source_step_id` column (staging
 * first) closes that gap if it turns out to bite.
 */
export function newStepsOnly(
  candidates: readonly MaterialisedSubStep[],
  existing: readonly { display_name?: string | null }[],
): MaterialisedSubStep[] {
  const names = new Set(existing.map(e => clean(e.display_name).toLowerCase()).filter(Boolean));
  return candidates.filter(c => !names.has(c.display_name.toLowerCase()));
}
