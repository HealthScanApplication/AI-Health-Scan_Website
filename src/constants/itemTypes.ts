/**
 * itemTypes — single source of truth for the string literals used to
 * discriminate protocol items, catalog rows, and supply categories.
 *
 * Before this file existed, these strings (`'rule_do'`, `'consume'`,
 * `'supplement'`, `'product'`, etc.) were scattered as inline literals
 * across ~6+ files. That made refactors risky: rename one value and the
 * other call sites silently broke at runtime.
 *
 * Every comparison and switch on these fields should import from here.
 * The exported `as const` arrays let TypeScript narrow the type via
 * `(typeof X)[number]` so the union of valid values stays in sync with
 * the runtime constants.
 *
 *   import { PROTOCOL_ITEM_KINDS, ProtocolItemKind } from '../constants/itemTypes';
 *   if (item.kind === PROTOCOL_ITEM_KINDS.RULE_DO) { ... }
 *
 * Type predicates (`isRuleItem`, `isActionItem`, etc.) are exported so
 * callers can pattern-match without remembering which literal is which.
 */

// ── Protocol item kind ───────────────────────────────────────────────────
// Stored on `protocol_items.kind` in the database.
export const PROTOCOL_ITEM_KINDS = {
  ACTION:    'action',
  RULE_DO:   'rule_do',
  RULE_DONT: 'rule_dont',
} as const;
export type ProtocolItemKind = (typeof PROTOCOL_ITEM_KINDS)[keyof typeof PROTOCOL_ITEM_KINDS];

export const isRuleKind = (k: string | null | undefined): boolean =>
  k === PROTOCOL_ITEM_KINDS.RULE_DO || k === PROTOCOL_ITEM_KINDS.RULE_DONT;
export const isActionKind = (k: string | null | undefined): boolean =>
  !k || k === PROTOCOL_ITEM_KINDS.ACTION;

// ── Protocol item scope ─────────────────────────────────────────────────
// Stored on `protocol_items.scope` — categorises do/don't rules into
// buckets so the detail tray can group them ("Consume" rules vs "Outside" rules).
export const PROTOCOL_ITEM_SCOPES = {
  CONSUME:    'consume',
  SUPPLEMENT: 'supplement',
  INSIDE:     'inside',
  OUTSIDE:    'outside',
} as const;
export type ProtocolItemScope = (typeof PROTOCOL_ITEM_SCOPES)[keyof typeof PROTOCOL_ITEM_SCOPES];

// ── Protocol item type ──────────────────────────────────────────────────
// Stored on `protocol_items.item_type`. Determines which catalog FK to
// follow (catalog_recipe_id vs catalog_product_id vs catalog_activity_id).
export const PROTOCOL_ITEM_TYPES = {
  ACTIVITY:   'activity',
  RECIPE:     'recipe',
  PRODUCT:    'product',
  SUPPLEMENT: 'supplement',
  CONSUME:    'consume',
  INGREDIENT: 'ingredient',
  RULE:       'rule',
  // Synthesized by the scan-row builders for a scanned meal — never written to
  // protocol_items by the app, but it reaches every consumer that categorises a
  // timeline row, so it belongs in the known set (DEV-1245).
  MEAL:       'meal',
} as const;
export type ProtocolItemType = (typeof PROTOCOL_ITEM_TYPES)[keyof typeof PROTOCOL_ITEM_TYPES];

// ── Catalog type ────────────────────────────────────────────────────────
// Used by the supplies system + detail tray to know which table a row
// came from. Aligned with the catalog_* table names in Supabase.
export const CATALOG_TYPES = {
  INGREDIENT: 'ingredient',
  RECIPE:     'recipe',
  PRODUCT:    'product',
  ACTIVITY:   'activity',
  ELEMENT:    'element',
} as const;
export type CatalogType = (typeof CATALOG_TYPES)[keyof typeof CATALOG_TYPES];

// ── Supply source ───────────────────────────────────────────────────────
// Distinguishes "I added this myself" from "the protocol→supplies sync
// seeded this" so the sync cleanup logic doesn't trash manual entries.
export const SUPPLY_SOURCES = {
  MANUAL:    'manual',     // user added; never auto-removed
  PROTOCOL:  'protocol',   // seeded from active protocol's items
  EQUIPMENT: 'equipment',  // seeded from an activity's required gear
} as const;
export type SupplySource = (typeof SUPPLY_SOURCES)[keyof typeof SUPPLY_SOURCES];

// ── Supply category ─────────────────────────────────────────────────────
// Drives the icon + colour in the supplies list and the default location
// when seeded from a protocol item.
export const SUPPLY_CATEGORIES = {
  FOOD:       'food',
  SUPPLEMENT: 'supplement',
  COOKING:    'cooking',
  EXERCISE:   'exercise',
  OTHER:      'other',
} as const;
export type SupplyCategory = (typeof SUPPLY_CATEGORIES)[keyof typeof SUPPLY_CATEGORIES];

// ── Time-of-day section ─────────────────────────────────────────────────
// Used by ProtocolWidget + ProtocolsScreen to bucket items into morning /
// midday / evening sections + the pinned "Recommended" row at the top.
export const TIME_OF_DAY_SECTIONS = [
  'Recommended',
  'Morning',
  'Midday',
  'Evening',
  'Daily',
  'Weekly',
  'Other',
] as const;
export type TimeOfDaySection = (typeof TIME_OF_DAY_SECTIONS)[number];
