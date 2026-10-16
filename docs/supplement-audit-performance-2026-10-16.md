# Supplement database audit timeout — 2026-10-16

## Cause

The audit combined targeted supplement assertions with full-table integrity
queries over approximately 1.52 million product-element junctions. Query plans
showed a parallel sequential scan for dangling elements and a partitioned hash
aggregate for duplicates. The dangling-link assertion reproduced a timeout under
a 10-second statement budget. Merely walking all repeated index keys remained
slow; a standalone ordered duplicate scan also exceeded 60 seconds.

The expected-ingredient query itself completed in 319.7 ms with indexed lookups.
An earlier concurrent CLI run also hit temporary-login authentication failure;
that is distinct from PostgreSQL statement timeout and is not a data failure.

## Repair and retained coverage

- Global dangling-element detection now seeks each distinct element identity
  through the existing index, with a separate explicit NULL check. This covers
  all products, not just supplements, without revisiting every repeated key.
- Global uniqueness is proved by a ready, valid, immediate, unfiltered unique
  index on exactly the two NOT NULL identity columns (either column order).
  Partial/expression/extra-key/non-unique indexes cannot qualify. If this
  protection is absent, the audit falls back to an actual full duplicate check.
- Targeted dose/unit/classification and expected-link assertions remain intact.
- The runner executes both SQL assertion files serially in one read-only,
  repeatable-read transaction. A local 60-second statement budget and 120-second
  client deadline bound the run; no persistent database settings are changed.

## Commands

```sh
node scripts/run-supplement-database-audit.mjs
node scripts/test-supplement-audit-fixtures.mjs
node --import tsx scripts/audit-supplement-composition.ts
```

The fixture test copies catalogue data into temporary tables, deliberately adds
invalid rows, and rolls everything back. Cases include dangling and NULL element
IDs, duplicate links outside the supplement product set, a partial unique index
that excludes duplicate rows, and a missing expected ingredient. Success requires
the actual SQL audit to reject each case with the right error.

First full repaired run: **31.372 database seconds**, all assertions passed.
Inventory: 135 supplements, 131 with verified declared-ingredient links and four
correctly awaiting definite product labels/formulas. This audit is evidence for
these database invariants, not a claim that every unrelated application workflow
or every possible ingredient has been verified.
