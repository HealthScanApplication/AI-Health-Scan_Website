# Guardian modal and payment-flow verification

## Scope and safety

- Guardian-owned dialogs use one 640 × 760 CSS-pixel frame, clamped to the viewport with a scrolling body and fixed header/footer. Stripe/bank-owned authentication UI remains externally controlled.
- Staging database: `mofhvoudjxinvpplsytd`; Routine3 Stripe test account: `acct_1TLHer2fnWS5lMk2`.
- Live payments remain disabled in the frontend and backend. No production payment function, keys, permissions, or payment-method settings were changed.
- SEPA Direct Debit was enabled in Stripe **test mode only** to exercise asynchronous outcomes. Synthetic test payment methods and `example.invalid` addresses are used; no real payment instruments or customer data.

## Fixes

- Session-scoped checkout recovery survives non-card redirects and reloads. Stripe client secrets/card data are not persisted; Stripe return parameters are removed after recovery.
- Pending orders never show success before server verification. Interrupted upsell authentication resumes the same intent. Missing records after lost responses remain unresolved, not permission to charge again.
- Upsells reuse existing attempts, with Stripe idempotency and the unique intent constraint preventing concurrent duplicate charges.
- Webhooks reconcile current Stripe state, preserve terminal paid status/original `paid_at`, and return a retryable failure when persistence fails.
- The displayed discount uses the server deadline. A changed price is rejected before creating a charge, requiring review.
- Verified failed upsells can start a separate checkout at the listed price with another payment method; uncertain/pending attempts cannot.

## Verification

- Regression tests cover modal sizing/footer placement/focus, redirect session recovery, async pending/failed/paid states, interrupted authentication, unknown responses, changed prices, concurrent upsells, stale webhooks, persistence failures, and live-mode guards.
- Real staging card success reconciled through the signed webhook before client verification.
- Concurrent/repeated real test-mode upsells produced one discounted purchase (£1.40 from £2.00).
- Real SEPA test payment entered `processing`, then a separate database check observed webhook-driven `paid` with `paid_at` set. The first polling run hit a stalled CLI read; it was stopped and its disposable fixtures were cleaned. The QA script now bounds database commands to 30 seconds.
- Browser layout checks: sign-in and suggestion dialogs have identical 760px height and viewport-clamped 574px width in the current 606px viewport; footer bottom stays at the panel bottom and body uses `overflow-y:auto`.

- Real SEPA failure test entered `processing`, then its signed webhook set the purchase to `failed` with no paid timestamp; fixtures were cleaned.
- Chrome Bancontact success: external Stripe bank simulator → original Guardian route → recovered pending checkout with Stripe URL parameters removed → server verification → correct discounted upsell. A bank-specific saved-method defect was reproduced and fixed separately before merge.

- Chrome Bancontact failure: bank simulator failure → recovered checkout → server-confirmed failure → editable retry, with no false success. A new attempt then completed the bank redirect successfully.
- The corrected bank upsell uses the generated reusable SEPA method, accepts the discounted €14 amount, and displays pending while the asynchronous debit settles. Rechecking status never recharges.
- Full regression suite: 249 tests across 26 files; production build passes (existing chunk-size/dynamic-import warnings remain).
- Final security checks: staging and production `ALLOW_LIVE_PAYMENTS` digests both match `false`; the frontend production hold is unchanged. Existing catalog security-advisor findings predate this change; no schema/grant changes are included.

Final asynchronous bank-upsell outcome and merge verification are recorded below when completed.
