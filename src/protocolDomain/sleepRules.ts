/*
 * protocolDomain/sleepRules — classify protocol RULES (kind rule_do/rule_dont)
 * that are really sleep guidance, so the widget can nest them under the day's
 * sleep anchors (Start Sleep / End Sleep) instead of the generic bottom
 * "Rules & Avoidances" list (spec 4, 2026-07-04). Render-layer only — nothing
 * is persisted; a rule whose protocol has no matching anchor stays in the
 * bottom list.
 *
 * SHARED, portable (no DOM/RN imports) — safe to mirror to the web repo with
 * the other protocolDomain modules.
 */

export type SleepAnchor = 'wake' | 'bed';

// Evening / pre-bed sleep hygiene — the overwhelming majority of sleep rules.
const BED_RE = new RegExp(
  [
    '\\bsleep\\b', '\\bbed(time)?\\b', '\\blights?[- ]out\\b', '\\bwind[- ]?down\\b',
    'no screens?', 'screens? (before|after|at) ', 'blue light', '\\bmelatonin\\b',
    'caffeine after', 'no caffeine', 'cool bedroom', 'dark(ness)?( room)?', 'total darkness',
    'phone in (the )?bedroom', 'no phone', 'last meal', 'eat before bed',
  ].join('|'),
  'i',
);

// Morning / on-wake guidance.
const WAKE_RE = new RegExp(
  ['\\bwake\\b', '\\bwaking\\b', 'morning (sun)?light', 'sunlight (within|first)', '\\bsunrise\\b', 'on rising', 'upon waking'].join('|'),
  'i',
);

export interface SleepRuleLike {
  kind?: string | null;
  display_name?: string | null;
  notes?: string | null;
  parent_protocol_item_id?: string | null;
}

/**
 * Which sleep anchor a RULE belongs under, or null when it isn't sleep-themed.
 * Only top-level rules qualify — contextual sub-rules already have a parent.
 * Wake wins over bed when both match ("morning sunlight, no screens in bed"
 * reads as a wake habit).
 */
export function sleepRuleAnchor(rule: SleepRuleLike): SleepAnchor | null {
  if (rule.kind !== 'rule_do' && rule.kind !== 'rule_dont') return null;
  if (rule.parent_protocol_item_id) return null;
  const text = `${rule.display_name ?? ''} ${rule.notes ?? ''}`;
  if (WAKE_RE.test(text)) return 'wake';
  if (BED_RE.test(text)) return 'bed';
  return null;
}
