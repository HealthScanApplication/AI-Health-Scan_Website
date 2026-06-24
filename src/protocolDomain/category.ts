/*
 * protocolDomain/category — canonical "is this a Sleep item (by name)" detection.
 * SHARED, portable. Mirrored BYTE-FOR-BYTE in both repos. Edit both together.
 *
 * This kills the THREE divergent SLEEP_NAME regexes the apps had (web
 * protocolCategories used a loose \bsleep\b anywhere; the mockup + mobile were
 * anchored). The canonical form is anchored AND complete (start/end sleep, wake,
 * dream-journal, nightly-reflection, wind-down, lights-out). It is broader than
 * sleepWindow's wake/bed anchors: it buckets anything into the Sleep CATEGORY.
 */

export type ProtocolCategory = 'supplements' | 'consume' | 'do' | 'sleep';
export const CATEGORY_ORDER: ProtocolCategory[] = ['supplements', 'consume', 'do', 'sleep'];

const SLEEP_NAME = /^sleep$|^start[\s-]?sleep|^end[\s-]?sleep|^wake(\s?up)?$|dream[\s-]?journal|nightly[\s-]?reflection|wind[\s-]?down|lights?[\s-]?out/i;

/** True when a display name reads as a sleep / wind-down / wake card. */
export function isSleepItemByName(displayName?: string | null): boolean {
  return SLEEP_NAME.test((displayName || '').trim());
}
