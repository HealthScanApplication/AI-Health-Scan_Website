# `protocol_items` cross-repo contract (web ⇄ mobile)

**Status:** authoritative as of 2026-06-24. This file is kept **identical** in both
repos so each side is aware of the shared shape:

- Mobile (React Native): `AI-Health-Scan_Mobile/docs/PROTOCOL_ITEMS_CONTRACT.md`
- Website (admin editor): `AI-Healthscan_Website/docs/PROTOCOL_ITEMS_CONTRACT.md`

The website **admin protocol editor** (`src/components/admin/ProtocolEditor.tsx` +
`src/utils/protocolAdmin.ts`) WRITES `protocols` / `protocol_items`. The mobile app
READS and RENDERS them (`src/features/protocol/hooks/useActiveProtocol.ts`,
`src/components/ProtocolWidget.tsx`) and also writes when a user adds/clones items.
Both talk to the same Supabase tables, so the column value-spaces below are a contract,
not an implementation detail. Schema source of truth:
`supabase/migrations/20260622_protocol_items_groups_taxonomy.sql`.

---

## Column value-spaces (write these exact strings)

| Column | Value space | Meaning |
|---|---|---|
| `category` | `consume` \| `do` \| `sleep` \| `supplement` (lowercase singular) | **App-driving bucket / folder.** Mobile maps this to the Consume/Do/Sleep/Supplements folder (tint). Falls back to `item_type` when null. |
| `subtype` | consume → `meal`\|`drink`\|`snack`\|`beverage`; do → `hygiene`\|`wellness`\|`exercise`; sleep → `sleep`; supplement → `supplement` | Finer classification. Mobile reads it but does not yet branch on it (safe to set). |
| `item_type` | `supplement` \| `consume` \| `recipe` \| `activity` \| `product` | The **catalog backing** (icon/subtitle/tap-routing on mobile). Keep consistent with `category`. There is **no** `item_type='sleep'` or `='ingredient'`. |
| `kind` | `action` \| `rule_do` \| `rule_dont` (null ⇒ treat as `action`) | `action` = timeline step (shows on the day view). `rule_do`/`rule_dont` = the Do's/Don'ts lists, never on the timeline. |
| `scope` | `none`(→null) \| `inside` \| `outside` \| `consume` \| `supplement` | Only meaningful for rules; buckets the Rules & Avoidances section. |
| `hidden` | boolean (NOT NULL default false) | In the protocol but **hidden from the day view** (e.g. background sleep anchors). Mobile filters these from the timeline **and** from the progress count. |
| `parent_protocol_item_id` | uuid \| null | Child rows: sub-items (faded checklist) and product suggestions (buy cards). Top-level items have null. |
| `scheduled_time` | `'HH:MM:SS'` \| null | **Part-of-day is DERIVED from this** on both sides (Morning `<12`, Afternoon `12–16`, Evening `≥17`). Not stored in `group_name`. |
| `group_name` | legacy / meal-slot strings | The editor does NOT author this. Mobile uses it as a part-of-day override + meal-slot band (`breakfast`/`lunch`/`dinner`/`snack`). |
| `sort_order` | int | Secondary ordering within a part-of-day band. |
| `day_number` | int (editor writes `1`) | Multi-day protocols; null ⇒ daily. |
| `has_children` | unmaintained | **Do not trust.** Derive children from `parent_protocol_item_id`. |

The editor never writes: `amount`, `amount_unit`, `meal_slot`. Catalog FK linking sets exactly
one of `catalog_recipe_id` / `catalog_ingredient_id` / `catalog_product_id` /
`catalog_activity_id` / `supplement_id` and clears the other four.

## Render rules (mobile day view = web mobile-preview)

- Show only items with `kind IN (null,'action')` **and** `parent_protocol_item_id IS NULL`.
- Drop `hidden = true`.
- Bucket folder by `category` (fallback `item_type`); section/order by `scheduled_time`.
- `rule_do`/`rule_dont` → Rules & Avoidances; children → sub-checklist / buy cards.

## Known divergence (kept in sync deliberately)

- Mobile derives the **top-level part-of-day** bucket from `scheduled_time`/`group_name`,
  NOT from `category`/`subtype`. So the editor must set a `scheduled_time` (and/or a
  recognizable `group_name`) to control which Morning/Afternoon/Evening band an item lands in.
- The website mobile-preview (`ProtocolHomeScreen.tsx`) historically categorized off
  `item_type`/`scope`/name. Post-migration both should read `category` first (mobile already does).

## Mobile alignment applied (2026-06-24)

- Clone from the Protocols library now carries `kind/scope/parent_protocol_item_id/hidden/
  category/subtype/catalog_ingredient_id` and remaps parent→child ids (two-pass), so web-authored
  rules / sub-items / taxonomy are no longer flattened on add.
- `hidden` items are excluded from the progress denominator (ring can reach 100%).
- Mobile add-item / fill-slot writes now set `category` (+`subtype` where unambiguous) so
  mobile-authored items appear correctly bucketed in the web editor.
- `src/types/database.ts` `protocol_items` Row/Insert/Update now includes
  `hidden`, `category`, `subtype`, `catalog_ingredient_id`.
