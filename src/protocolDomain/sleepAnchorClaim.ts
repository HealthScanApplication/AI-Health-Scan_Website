/**
 * May this ROW claim a sleep-anchor role?
 *
 * `isBedName` / `isWakeName` (sleepWindow.ts) answer a question about a STRING:
 * does this text read like a bedtime. That is all they can answer, and six
 * separate call sites treated the answer as though it were about the row —
 * with no category gate anywhere. So an ordinary consume item called
 * "Bedtime Snack" was treated as the day's bedtime, and because the day keeps
 * ONE bedtime, the real one was silently dropped (DEV-1101).
 *
 * A user names things. "Bedtime Snack", "Sleep Support Magnesium", "Lights Out
 * Tea" are all ordinary items, and the day model must not lose data because of
 * what someone typed.
 *
 * These predicates are the row-level question, and they live here rather than
 * in `sleepWindow.ts` because that file is mirrored byte-for-byte with the web
 * repo (see its header) — changing it is a two-repo change, and this rule is
 * mobile's day model, not shared sleep vocabulary.
 *
 * THE RULE: a name is not evidence on its own. A row whose category positively
 * says it is something else — consume, supplement — cannot also be tonight's
 * bedtime. A row with NO category still can: an authored bedtime is routinely
 * category-less ("Sleep 8h" is a real user row, and the catalog's own
 * `SLEEP_NAME` does not classify it either, since that pattern is anchored).
 *
 * Deliberately a CONTRADICTION test, not a confirmation test. Requiring
 * `isSleepCategory` looks tighter and drops genuine anchors.
 */
import { isBedName, isSleepCategory, isWakeName } from './sleepWindow';

export interface AnchorClaimLike {
  display_name?: string | null;
  category?: string | null;
}

/**
 * Has this row already declared itself something other than sleep?
 *
 * Absent category → no claim either way → the name is allowed to speak.
 */
export function declaresNonSleepCategory(i: AnchorClaimLike): boolean {
  const c = String(i.category || '').trim();
  return c.length > 0 && !isSleepCategory(c);
}

/** Does this row read as, and qualify as, the day's BEDTIME? */
export function claimsBedAnchor(i: AnchorClaimLike): boolean {
  if (declaresNonSleepCategory(i)) return false;
  return isBedName(i.display_name);
}

/** Does this row read as, and qualify as, the day's WAKE? */
export function claimsWakeAnchor(i: AnchorClaimLike): boolean {
  if (declaresNonSleepCategory(i)) return false;
  return isWakeName(i.display_name);
}
