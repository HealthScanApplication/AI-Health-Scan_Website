# Staging payment runtime verification — 16 October 2026

## Change applied to staging only

`scripts/repair-guardian-payment-permissions-staging.sql` grants SELECT on
`guide_offers` and `guide_profiles` to the existing backend `service_role`.
The pre-fix runtime fixture reproduced HTTP 500 `Offer not found`; the role
lacked SELECT on both tables. No anon/authenticated grants, RLS policies,
production permissions, keys, or payment flags were changed.

## Runtime results

- Published frontend contains both environment-specific publishable keys and the production checkout hold.
- Staging PaymentIntent creation succeeds after the grant.
- Frontend test key retrieves the created intent: matching key pair, `livemode=false`.
- `pm_card_visa` confirmation succeeds for a disposable GBP 1.00 test purchase.
- Server confirmation verifies Stripe and returns `paid`.
- `pm_card_visa_chargeDeclined` returns HTTP 402 `card_declined`; server confirmation returns `failed`.
- Real webhook reconciliation **did not pass**: purchase remained pending through eight bounded checks before explicit server confirmation.
- Routine3 account `acct_1TLHer2fnWS5lMk2` test-mode webhook list is empty. The stored staging signing secret is present, but its corresponding destination/account is not yet identified. No new webhook was created or secret revealed.
- Both projects' `ALLOW_LIVE_PAYMENTS` hashes still match `false`.
- RLS remains enabled on both modified tables.
- Automated suite: 218 tests across 23 files passed.

Fixtures use the existing unused QA owner with a submitted (not approved) profile,
unique offer IDs, and `example.invalid` buyer addresses. Database fixtures are
deleted in finally blocks; Stripe retains sandbox payment/customer records for
diagnosis. No live payment was attempted.

## Remaining

Locate/create the test-mode webhook in the same account as the test keys, verify
its URL and selected PaymentIntent events, save its matching signing secret,
then prove signed delivery/replay and reconciliation without client confirmation.
Browser checkout/3DS, asynchronous flows, upsells, and file-access checks remain.

The staging security advisor also reports unrelated catalog-table RLS and
security-definer-view errors. These were not changed by this scoped permission
repair and were not repaired here; this is not a clean database security audit.

## Follow-up: webhook configured and verified

With explicit user confirmation, created test-mode endpoint
`we_1URI0c2fnWS5lMk2HhwYZvFn` in Routine3 `acct_1TLHer2fnWS5lMk2`.
The account's test publishable key digest matches the deployed staging key.
Endpoint URL: `https://mofhvoudjxinvpplsytd.supabase.co/functions/v1/guardian-payments`.
Snapshot payloads, API version `2026-03-25.dahlia`, four events:
`payment_intent.succeeded`, `payment_intent.payment_failed`,
`payment_intent.processing`, `payment_intent.canceled`.

Saved the generated signing credential directly in staging's
`STRIPE_WEBHOOK_SECRET`; verified its stored SHA-256 digest matches without
printing the credential. The earlier missing-webhook blocker above is resolved.

Fresh runtime tests both passed:

- GBP 1.00 test payment: `livemode=false`, Stripe `succeeded`; signed webhook
  updated the purchase to `paid` with `paid_at` BEFORE client/server confirmation.
- Decline: HTTP 402 `card_declined`; webhook updated the purchase to `failed`
  with null `paid_at` BEFORE client/server confirmation. No fulfillment.
- Stripe dashboard reported HTTP 200 and `{received:true}` for success delivery.
- Database fixtures cleaned after both tests. Sandbox Stripe records remain.
- Both projects' `ALLOW_LIVE_PAYMENTS` hashes still match `false`.

These are API/runtime integration checks, not full browser checkout/3DS,
asynchronous-method, upsell, replay-ordering, or file-access certification.
Production configuration was not changed and live checkout remains disabled.

## Browser verification follow-up — incomplete, merge held

Opened a disposable approved staging Guardian with a GBP 1.00 paid offer.
The browser details form and PaymentIntent creation work. In Brave, both the
published bundle and a local staging development build mount a Stripe secure
iframe, but its document remains an empty root and the widget never becomes
ready. Console output did not identify the cause. Browser blocking is a
hypothesis, not a verified diagnosis; no browser security settings were changed.
Requested permission to compare in Chrome.

Reproduced an independent app bug: Pay was enabled before widget readiness,
and submitting could remain indefinitely in Paying. Added failing regression
tests, then gated submission on Stripe's ready event with load-error handling
and a 15-second loading timeout. Local browser verification showed disabled
Pay and a clear loading-failure alert instead of accepting a submission.
220 automated tests passed and production build succeeded (existing chunk
size/import warnings remain). Changes are on
`codex/guardian-browser-3ds-verification`, not merged: browser 3DS success,
failure/cancel, retry, and redirect-return verification remain incomplete.
