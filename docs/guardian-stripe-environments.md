# Guardian Stripe environment wiring

Guardian checkout selects its publishable key from the same Supabase project snapshot used for data/API calls. It does not use the hostname, a separate localStorage lookup, or the deprecated shared `VITE_STRIPE_PUBLISHABLE_KEY`.

| Database project | Frontend variable | Required key mode |
| --- | --- | --- |
| Staging `mofhvoudjxinvpplsytd` | `VITE_STRIPE_PUBLISHABLE_KEY_STAGING` | `pk_test_…` |
| Production `ermbkttsyvpenjjxaxcf` | `VITE_STRIPE_PUBLISHABLE_KEY_PRODUCTION` | `pk_live_…` |

Configure these public values in the frontend host's build environment (Netlify), then rebuild. `.env.example` documents local equivalents. No actual keys are committed. Missing keys, wrong-mode keys, secret/restricted keys mistakenly placed in frontend variables, and unknown database projects fail closed before Stripe.js or purchase creation.

## Live-payment hold

Production checkout is deliberately disabled in `resolveGuardianStripe`, including when a valid production key is present. No legacy key or environment enable flag overrides it. Removing this hold requires a reviewed code change after the full staging checkout checklist passes and explicit launch approval.

On 16 October 2026, `ALLOW_LIVE_PAYMENTS=false` was explicitly set in **both** Supabase projects. This server-side guard also blocks older browser bundles from starting live payments. Do not set it to true while staging is unverified. The frontend hold is defense in depth, not the payment security authority.

Both stored guard-value digests were verified against SHA-256 of `false`. A non-mutating staging endpoint probe returned HTTP 503 (live payments switched off). The production `guardian-payments` endpoint currently returns HTTP 404 (not deployed); it was not deployed as part of this wiring change. The production guard is configured for any future deployment, and the frontend production hold remains in place.

The server-side `STRIPE_SECRET_KEY` and endpoint-specific `STRIPE_WEBHOOK_SECRET` remain separate Supabase secrets in each project. No secret values were read, rotated or copied as part of this wiring fix. Staging's existing live key remains rejected; it still needs a matching sandbox/test server key, public key and webhook secret before end-to-end checkout testing can proceed.

Key mode validation cannot prove two keys belong to the same Stripe account. Sandbox integration tests must verify the account/key pair and webhook reconciliation. See [staging checks and remaining work](guardian-staging-publish-payments-2026-10-16.md).

Scope: Guardian offer checkout only; this does not reconfigure unrelated subscription, affiliate or externally hosted booking payment systems.
