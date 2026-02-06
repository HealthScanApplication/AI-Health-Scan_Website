# Referral System Testing Plan

## Current Architecture

### Data Flow
1. **User A signs up** → gets `referralCode` (e.g. `hs_27y5l8`) + `position`
2. **User A shares link** → `https://healthscan.live?ref=hs_27y5l8`
3. **User B clicks link** → `useReferral` hook stores code in localStorage
4. **User B signs up** → sends `referralCode: "hs_27y5l8"` to `/email-waitlist`
5. **Backend processes** → finds User A by code, increments `referrals`, applies position boost
6. **Leaderboard** → `/referral-leaderboard` reads all KV users, sorts by `referralCount`

### Current Reward Tiers (in `ReferralLeaderboard.tsx` + `referral-endpoints.tsx`)
| Referrals | Reward | Position Boost |
|-----------|--------|----------------|
| 0-4 | Basic Access | — |
| 5-9 | Early Access | Milestone boosts |
| 10-19 | Premium (4 Weeks) | Milestone boosts |
| 20-29 | Premium (8 Weeks) | Milestone boosts |
| 30-39 | Premium (12 Weeks) | Milestone boosts |
| 40-49 | Premium (16 Weeks) | Milestone boosts |
| 50+ | Premium (20 Weeks) | Milestone boosts |

### Milestone Boost System (in `waitlist-endpoints.tsx`)
Defined in `REFERRAL_MILESTONES` array — deterministic boosts at specific referral counts.

---

## Test Plan

### Phase 1: End-to-End Referral Flow (Manual)

#### Test 1.1 — New signup without referral
```
curl -X POST .../email-waitlist
  -d '{"email": "test-no-ref@example.com", "name": "No Ref User"}'

Expected:
- User created with referralCode, position, referrals: 0
- Confirmation email sent
- Slack notification sent
- No referral processing
```

#### Test 1.2 — New signup WITH referral code
```
curl -X POST .../email-waitlist
  -d '{"email": "test-with-ref@example.com", "name": "Ref User", "referralCode": "hs_27y5l8"}'

Expected:
- User created with usedReferralCode: "hs_27y5l8"
- Referrer (hs_27y5l8 owner) gets referrals incremented
- Referrer position boosted
- Slack notification includes "Referred By: hs_27y5l8"
```

#### Test 1.3 — Duplicate signup with referral
```
curl -X POST .../email-waitlist
  -d '{"email": "test-with-ref@example.com", "referralCode": "hs_27y5l8"}'

Expected:
- Returns "already on waitlist" — NO double referral credit
```

#### Test 1.4 — Self-referral prevention
```
curl -X POST .../email-waitlist
  -d '{"email": "owner@example.com", "referralCode": "<owner's own code>"}'

Expected:
- Should NOT credit referral to self
- CURRENT STATUS: Not explicitly prevented — NEEDS FIX
```

#### Test 1.5 — Invalid referral code
```
curl -X POST .../email-waitlist
  -d '{"email": "test-bad-ref@example.com", "referralCode": "INVALID_CODE"}'

Expected:
- User created normally
- Referral processing logs "code not found" warning
- No crash, no error to user
```

### Phase 2: Leaderboard Accuracy

#### Test 2.1 — Leaderboard reflects real data
```
curl .../referral-leaderboard

Expected:
- Returns users sorted by referral_count descending
- Ranks are sequential (1, 2, 3...)
- referral_count matches actual referred users
```

#### Test 2.2 — Referral stats endpoint
```
curl .../referral-stats/hs_27y5l8

Expected:
- Returns totalReferrals, referredUsers list, rewardTier
- referredUsers should list actual users who used this code
```

### Phase 3: Website UI Flow

#### Test 3.1 — Referral link landing
1. Open `https://healthscan.live?ref=hs_27y5l8` in incognito
2. Verify referral banner appears
3. Sign up with email
4. Verify referral code sent in API request
5. Verify toast: "Thanks for using a referral link!"

#### Test 3.2 — Leaderboard display
1. Navigate to leaderboard section
2. Verify it loads real data from API
3. Verify reward tiers display correctly
4. Verify position change indicators work

#### Test 3.3 — Share referral link
1. Sign up for waitlist
2. Verify referral code stored in localStorage
3. Verify share functionality works (if implemented)

---

## Issues Found During Audit

### Critical
1. **No self-referral prevention** — User can sign up with their own referral code
2. **`referralCount` vs `referrals` field naming inconsistency** — `waitlist-endpoints.tsx` uses `referrals`, `referral-endpoints.tsx` reads `referralCount`. The leaderboard may show 0 for everyone.
3. **No referral count in Slack message** — Fixed (now reads from KV data)

### Medium
4. **Leaderboard shows all users** — Even those with 0 referrals. Should filter to users with >= 1 referral.
5. **No referral link sharing UI** — After signup, user gets a referral code but no easy way to copy/share the link on the website.
6. **Website toast messages use emojis** — Inconsistent with the no-emoji email/Slack policy.

### Low
7. **Position change tracking** — `position_change` is always 0 (no historical tracking implemented).
8. **Reward tier thresholds are very high** — 50 referrals for max tier is unrealistic for most users. Consider lower thresholds.

---

## Recommended Incentive Improvements

### Current Problem
The reward tiers require 5-50 referrals. For a pre-launch waitlist, most users will refer 0-3 people. The tiers don't reward small contributions.

### Proposed New Tiers
| Referrals | Reward | Why |
|-----------|--------|-----|
| 1 | Priority Access (skip 5 spots) | Immediate gratification for first share |
| 3 | Early Access + 1 Week Premium | Achievable goal, real value |
| 5 | Early Access + 2 Weeks Premium | Sweet spot for engaged users |
| 10 | Early Access + 4 Weeks Premium | Power referrer |
| 25 | Lifetime Premium (Beta) | Top 1% — aspirational |

### Key Principles
- **Reward the first referral** — Most important conversion
- **Keep tiers achievable** — 80% of users should be able to reach tier 2
- **Make rewards tangible** — "Premium for X weeks" is clear value
- **Show progress** — Progress bar toward next tier

---

## Files to Update

| File | What to Change |
|------|---------------|
| `waitlist-endpoints.tsx` | Add self-referral prevention, fix field naming |
| `referral-endpoints.tsx` | Fix `referralCount` field read, filter 0-referral users from leaderboard |
| `ReferralLeaderboard.tsx` | Update reward tiers, remove emojis from badge, add share UI |
| `UniversalWaitlist.tsx` | Remove emojis from toast messages, add referral link copy button after signup |
| `email-service.tsx` | Emails already updated (clean, no emojis) |
| `index.tsx` | Slack messages already updated (geolocation, referral URL, count) |

---

## Execution Order
1. Fix `referralCount` vs `referrals` field naming (critical — leaderboard broken)
2. Add self-referral prevention
3. Update reward tiers to achievable levels
4. Filter 0-referral users from leaderboard
5. Remove emojis from website toast messages
6. Add referral link copy/share UI after signup
7. Run full E2E test sequence
8. Deploy and verify
