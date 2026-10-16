# Private Protocol Children Implementation Plan

**Goal:** Edit a user's Diet, Fitness and recipe copies within one parent Protocol; keep user recipes and scans private until published.

**Architecture:** Preserve ordinary protocol_items for existing app readers. Store a parent link on private child Protocols and mark copied parent items with their child source so saving a child replaces only that child's parent rows. Recipe customisation creates an owner-only catalogue copy and relinks only the selected plan item. Shared browsing requires publication; direct owner access remains available.

**Tech stack:** React, TypeScript, Supabase PostgreSQL/RLS, Vitest.

**Spec:** User-approved design in this conversation, 2026-10-16.

## Constraints
- Edits affect only the user's copy in the selected parent Protocol.
- User-created and scan recipes remain private unless explicitly published.
- Existing shared originals remain unchanged.
- Database permissions enforce privacy across web and mobile clients.

## Tasks
- [x] Inspect staging and production columns, policies and scan promotion functions through read-only SQL.
- [x] Write failing copy-isolation and private-recipe tests against real helpers and database transactions.
- [x] Add parent/child linkage, owner validation, private recipe cloning and child-to-parent synchronization; use transactions for linked writes.
- [x] Add nested navigation and parent-page edit actions; open existing Diet/Fitness builders with the selected child and return to parent.
- [x] Add recipe customisation from plan items and reuse the recipe editor for owner copies.
- [x] Restrict recipe browse queries to published entries and enforce publication/ownership with RLS; repair scan promotion defaults.
- [x] Verify two-user isolation, private/public search visibility, parent synchronization, full tests and build.
- [ ] Review, merge and verify deployment after schema compatibility is confirmed.

## Verification and rollout
- 145 Vitest tests pass; Vite production build passes.
- Transactional database regression covers parent/source isolation, two-parent recipe isolation, legacy snapshot conversion, ingredient edits, own recipe materialization, anonymous and second-user denial, and deliberate publication. All fixtures roll back. The staging suite takes approximately five seconds.
- Recipe privacy is applied and regression-tested on staging and production. Parent/child schema is applied to staging, where the existing Guardian tables and builders run; production does not yet have the earlier Guardian schema.
- The staging Guardian backend was deployed with published-only recipe hints.
- Legacy scan ownership is recovered only from unambiguous scan history. Ambiguous unpublished legacy recipes stay restricted rather than becoming public.
- Previously edited flattened Protocols stop automatic conversion with an explicit preservation message; unchanged snapshots can be adopted without duplicating steps.
