# Staging publishing and payment checks — 16 October 2026

## Safety boundary

Target: Supabase staging `mofhvoudjxinvpplsytd`, not production `ermbkttsyvpenjjxaxcf`. No live payment flag, credentials, webhooks, or production data were changed. No Stripe charge was attempted.

The staging `guardian-payments` function is deployed and active. A non-mutating request using an unknown action returned HTTP 503: `Live payments are switched off on this environment.` This establishes that the deployed function is refusing its configured live key; it does **not** establish a working Stripe test integration. Test-mode secret/publishable keys and a matching test webhook secret must be configured before real sandbox checkout, 3DS, decline, upsell and webhook delivery can be tested end to end. Do not enable `ALLOW_LIVE_PAYMENTS` to bypass this blocker.

The Supabase connector required reauthentication. The already-authorized Supabase CLI worked as an alternative; all remote queries explicitly targeted staging.

## Publishing database checks — passed

Executed `scripts/qa-guardian-publishing-staging.sql` against staging. It uses an existing unused QA auth owner and a single transaction, with real database roles/JWT claims, RLS policies and privilege triggers:

- Owner can submit a profile at setup step 5 and create a published offer/path.
- Owner cannot self-approve or alter the platform commission.
- Anonymous visitors cannot read the submitted profile's offers/path.
- Privileged approval makes the published profile, offer and path readable anonymously.
- Pausing the profile hides its offer and path.

The transaction rolled back. A subsequent independent query confirmed the QA profile, offer and path are absent. No moderation emails or actual site publication occurred. This covers database publishing boundaries, **not** a complete browser Publish-site submission with a separate QA account.

## Checkout component defects repaired

- Processing payments previously showed “You're all set!” and a purchased-item checkmark.
- Server confirmation errors were swallowed before showing success.
- A thrown Stripe transport error could leave checkout stuck in Paying.
- The completion message claimed that a receipt had been sent without evidence.

Checkout now distinguishes pending from paid, confirms the server's paid status before marking an item purchased, provides a status-only retry that does not submit a second charge, and reports confirmed payment rather than promising email delivery.

Seven component interaction tests cover processing, verification failure, decline/retry, verified success, check-without-recharge, transport rejection and restoring card entry after a failed pending payment. Review identified the card-widget remount edge case; a lifecycle-aware test reproduced it before the fix. Stripe.js and remote payment calls are controlled external-boundary doubles; component rendering, event handling and state transitions are real. These tests do **not** replace Stripe sandbox integration tests.

Reference: [Stripe payment status updates](https://docs.stripe.com/payments/payment-intents/verifying-status).

## Still required after staging credentials are configured

- Dedicated QA account: browser Publish-site submission, admin approval/pause and public visibility, without touching existing Guardian data.
- Test-mode first purchase, decline, authentication, async pending/success/failure and redirected return.
- Upsell pricing, expiry, duplicate submission and authentication.
- Signed webhook delivery/replay, purchase-row reconciliation and purchased-file access.
- Confirm that no real emails, real payment methods or production records are used.
