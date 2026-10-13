/**
 * activityKind — "Every activity is a task or a routine." (John, 2026-07-31)
 *
 * THE DISTINCTION ALREADY EXISTED; IT JUST HAD NO NAME. Three surfaces were each
 * rebuilding it from `recurrence_type`:
 *   • ProtocolsScreen — `recurrence_type && recurrence_type !== 'one_off'` marks a
 *     routine item; anything else is "task data, not a personal routine"
 *   • TaskEditorSheet — an `isRoutine` flag driving the "Routine · Daily" header
 *   • the Routines / Tasks list filters
 *
 * Three copies of one rule is how they drift, so this is the one definition. It
 * adds no column and changes no data: a task is a one-off occurrence, a routine
 * is a recurring one, and both are the same `protocol_items` row.
 *
 * WHY SUB-STEPS ARE NOT PART OF THE KIND. John's framing — "the routine has
 * additional info about how to do it, ie sub-steps" — describes what a routine
 * TYPICALLY carries, and it is deliberately not encoded as a rule here (approved
 * 2026-07-31). If sub-steps were routine-only, flipping Repeats from Daily to
 * One-off would have to silently delete the user's sub-steps — data loss caused
 * by a toggle. A task may carry them; a routine usually does.
 */

/** The two kinds of activity. */
export type ActivityKind = 'task' | 'routine';

/**
 * The stored recurrence value meaning "this happens once".
 * A null/absent recurrence means the same thing — it was never made repeating.
 */
export const ONE_OFF_RECURRENCE = 'one_off';

/** Everything the kind can be derived from. Structural, so callers need not
 *  import ProtocolItem (this file is shared, portable domain logic). */
export interface ActivityKindLike {
  recurrence_type?: string | null;
}

export function activityKind(item: ActivityKindLike | null | undefined): ActivityKind {
  const recurrence = String(item?.recurrence_type ?? '').trim().toLowerCase();
  return recurrence && recurrence !== ONE_OFF_RECURRENCE ? 'routine' : 'task';
}

export function isRoutineActivity(item: ActivityKindLike | null | undefined): boolean {
  return activityKind(item) === 'routine';
}

export function isTaskActivity(item: ActivityKindLike | null | undefined): boolean {
  return activityKind(item) === 'task';
}
