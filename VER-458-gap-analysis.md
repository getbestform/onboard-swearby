# VER-458: Launch Portal (Clinic Onboarding) — Implementation Gap Analysis

**Epic:** LAUNCH PORTAL (CLINIC ONBOARDING)
**URL:** https://getbestform.atlassian.net/browse/VER-458
**Date:** 2026-04-15
**Frontend branch:** `feature/client-onboard` (onboard-swearby)
**Backend branch:** `feature/VER-ticket1-partner-clinic-invite` (verti-v2) — not yet merged to main

---

## Intended Flow (per spec)

```
Admin invite → Verify/Password → Payment → DocuSign → Drug Catalog → Intake Wizard → Cal.com Scheduling
```

## Current Wizard Step Order (implemented)

```
0  Account       — password + ToS/Privacy (first thing after welcome)
1  Payment       — $2,500 deposit via Stripe (renamed from Billing)
2  Business Info — legal name, EIN, NPI, address, phone, website
3  Prescribers   — DEA, license, specialty
4  Drug Catalog  — drugs, doses, pricing, state availability
5  Intake        — display name, logo, brand color, description
6  Schedule Call — Cal.com onboarding call booking
7  Review        — summary + final submit
```

---

## Backend API (verti-v2)

Served at `NEXT_PUBLIC_VERTI_API_URL`. All routes use `Authorization: Bearer <PARTNER_INVITE_API_KEY>` except `/verify` (public).

### Database Schema

**`clinic_invite` table** (`supabase/migrations/20260407020000_clinic_invites.sql`):
```
id            UUID          PRIMARY KEY
token         UUID          UNIQUE — used in invite URL
code          CHAR(5)       5-digit verification code
owner_name    TEXT          NOT NULL
email         TEXT          NOT NULL
entity_name   TEXT          NOT NULL
entity_type   TEXT          LLC | PLLC | Corporation | PC | Partnership | Sole Proprietor | Other
status        TEXT          pending | completed | approved | denied | expired
expires_at    TIMESTAMPTZ   7-day expiry
created_by    UUID          verti_admin UUID
created_at    TIMESTAMPTZ
clinic_id     TEXT          NULL until approved
```

**`onboarding_draft` table** (Drizzle `db/schema.ts`):
```
token         UUID          PRIMARY KEY — FK → clinic_invite.token CASCADE DELETE
data          JSONB         Free-form wizard data (businessName, phone, address, ein, logoUrl, etc.)
updated_at    TIMESTAMPTZ
```

**`clinic` table additions** (populated on approve):
```
onboarding_status   TEXT    'active' | 'onboarding' | ...
onboarding_data     JSONB   { draft: {...} }
website             TEXT
legal_name          TEXT
business_type       TEXT
ein                 TEXT
logo_url            TEXT
```

### API Routes — Implemented ✅

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/partner-invites` | Create invite, send email with code |
| GET | `/api/partner-invites` | List with pagination, search, status/entityType filter |
| GET | `/api/partner-invites/{token}` | Fetch invite details |
| POST | `/api/partner-invites/{token}/verify` | Verify 5-digit code + email (public) |
| GET | `/api/partner-invites/{token}/draft` | Load saved wizard draft |
| PATCH | `/api/partner-invites/{token}/draft` | Shallow-merge save draft (upsert) |
| POST | `/api/partner-invites/{token}/logo` | Upload to Supabase Storage (`clinic-assets/logos/{token}.{ext}`) |
| POST | `/api/partner-invites/{token}/submit` | Atomic pending→completed transition |
| POST | `/api/partner-invites/{token}/approve` | Creates `clinic` record from draft + invite data |
| POST | `/api/partner-invites/{token}/deny` | Sets status to denied |
| POST | `/api/partner-invites/{token}/payment` | Create Stripe PaymentIntent ($2,500), returns `clientSecret` |
| POST | `/api/partner-invites/{token}/payment/confirm` | Retrieve card details (`last4`, `brand`) after payment succeeds |

### API Routes — Missing ❌

| Method | Route | Purpose | Needed by |
|--------|-------|---------|-----------|
| POST | `/api/partner-invites/{token}/agreements/:type/sign` | Create DocuSign embedded envelope | VER-377 |
| POST | `/api/partner-invites/{token}/agreements/callback` | DocuSign webhook — update signing status | VER-377 |
| GET | `/api/partner-invites/{token}/agreements` | List agreements + signing status | VER-377 |
| PATCH | `/api/partner-invites/{token}/status` | Generic state machine transition endpoint | VER-494 |

### DB Tables — Missing ❌

```sql
-- onboarding_agreements (VER-377)
id                  UUID
invite_id           UUID  FK → clinic_invite
agreement_type      ENUM  msa | rev_marketing | baa
docusign_envelope_id TEXT
status              ENUM  pending | signed
signed_at           TIMESTAMPTZ

-- clinic_account additions (VER-445)
partner_tier             TEXT     launch_partner | partner
partner_number           INTEGER  1–200 for launch partners
partner_tier_assigned_at TIMESTAMPTZ

-- clinic_invite additions (VER-494)
-- call_scheduled (and other intermediate states) need to be valid values in status column
```

---

## Gap Analysis by Ticket

---

### VER-488 — Step 1: Deal Close / Admin Panel
**Status: Complete | ~100% implemented**

- ✅ `verti_admin` acts as the sales rep — no separate role needed; any Verti admin can close a deal and send an invite
- ✅ Admin can input email, name, entity name/type and send invite
- ✅ Backend generates UUID token + 5-digit code, sends branded email
- ✅ Invite table with status badges, pagination, search/filter, and `call_scheduled` in status filter
- ✅ "Activate Portal" button shown for `call_scheduled` invites (creates clinic + Supabase user); "Awaiting call" shown for `completed`; Deny available at both stages
- ✅ Backend `approve` endpoint creates `clinic` record from draft + invite data
- ✅ Password is collected from the clinic owner during onboarding (VER-423) — invite email sends the access code; password is set by the owner themselves in the wizard
- ✅ `POST /approve` reads `accountPassword` from draft, calls `supabaseAdmin.auth.admin.createUser()` with `email_confirm: true`, sets `clinic_admin` role in `user_metadata`, and rolls back the auth user if the clinic DB insert fails

---

### VER-423 — Step 2: Welcome & Password Setup
**Status: In Progress | ~90% implemented**

- ✅ `POST /verify` validates code + email (backend done)
- ✅ 4-phase animated welcome screen (frontend done)
- ✅ Password setup form implemented (`steps/PasswordForm.tsx`) — locked email, password + confirm fields with show/hide toggle, live requirements checklist (12 chars, uppercase, number, special char), ToS + Privacy Policy checkboxes
- ✅ Password and agreement flags (`tosAccepted`, `privacyAccepted`) saved to draft via `PATCH /draft` so admin can use `accountPassword` to create the Supabase user on approval
- ✅ Full client-side validation (match check, all requirements, both checkboxes) before saving
- ✅ Step is first in the wizard (step 0 — Account), immediately after the welcome/verify flow
- ✅ Backend: `POST /approve` now reads `accountPassword` from draft, calls `supabaseAdmin.auth.admin.createUser()` with `email_confirm: true` (skipping re-verification since they already verified via access code), sets `clinic_admin` role in `user_metadata`, and rolls back the auth user if the clinic DB insert fails.

---

### VER-377 — Step 3 & 4: Contracts (DocuSign) + Payment (Stripe)
**Status: To Do | ~70% implemented**

The spec says: **Payment BEFORE DocuSign**. Current wizard order puts **Payment at step 1** (immediately after Account setup) — correct position.

- ✅ Frontend: Stripe `PaymentElement` collects $2,500 deposit, saves `paymentIntentId`/`last4`/`brand` to draft
- ✅ Backend: `POST /api/partner-invites/{token}/payment` creates a Stripe PaymentIntent ($2,500), validates invite state, returns `clientSecret`
- ✅ Backend: `POST /api/partner-invites/{token}/payment/confirm` retrieves card details (`last4`, `brand`) after `stripe.confirmPayment()` succeeds on the client, and INSERTs a row into `onboarding_payments` (idempotent via `onConflictDoNothing`)
- ✅ `createPaymentIntent()` and `retrievePaymentDetails()` in onboard-swearby now call verti-v2 — Stripe logic fully moved to the backend
- ✅ `onboarding_payments` table created (`supabase/migrations/20260414000000_onboarding_payments.sql`) — `invite_token`, `stripe_payment_intent_id`, `amount_cents`, `currency`, `method`, `cardholder_name`, `last4`, `brand`, `paid_at`; RLS enabled, service_role only
- ✅ `onboardingPayments` added to Drizzle schema (`db/schema.ts`) so confirm route can insert via ORM
- ❌ **DocuSign: completely missing on both sides.** No envelope creation, no embedded signing, no webhook handler, no `onboarding_agreements` table
- ❌ No gate blocking wizard progression until agreements are signed

---

### VER-462 — Step 5: Intake Wizard / Business Info
**Status: To Do | ~75% implemented**

- ✅ Business info, prescribers, drug catalog, branding all collected in wizard
- ✅ `PATCH /draft` saves progress server-side (backend done, shallow-merge upsert)
- ✅ `POST /submit` atomically transitions pending→completed (backend done)
- ✅ `POST /approve` creates clinic record from draft data (backend done)
- ✅ Step validation schema mapping fixed — `validateStep()` now correctly maps steps 2–5 after PasswordForm was inserted at step 0
- ✅ Save & Continue button disables and shows spinner while draft is saving
- ❌ `assign_partner_tier()` not called on submit — `partner_tier`/`partner_number` columns don't exist yet (blocked by VER-445)
- ❌ Submission sets status to `completed`, not `pending_review` — spec expects `pending_review` as an intermediate state before admin approval

---

### VER-489 — Step 6: Pharmacy Selection
**Status: To Do | 0% implemented**

- ❌ Not implemented on frontend or backend
- ℹ️ Jira note says "not sure we need this yet — skip for now" — intentionally deferred

---

### VER-490 — Step 7: Product Catalog
**Status: Complete | ~100% implemented**

- ✅ Drug Catalog step collects drug name, doses, unit price, state availability (saved to draft)

---

### VER-491 — Step 8: Provider Network Setup
**Status: To Do | 0% implemented**

- ❌ Not implemented on frontend or backend
- ❌ No `networkId`, `networkPreference2/3`, `doctorsInPerson` in draft schema or wizard

---

### VER-492 — Step 11: Branding & White-Label
**Status: Complete | ~100% implemented**

- ✅ Display name, logo upload (Supabase Storage via backend), brand color picker
- ✅ Backend `POST /logo` stores in `clinic-assets/logos/{token}.{ext}`, returns public URL

---

### VER-466 — Step 12: Go-Live Call Scheduling (Cal.com)
**Status: Complete | ~100% implemented**

- ✅ Cal.com embed via `@calcom/embed-react`, captures `bookingUid` + `startTime`
- ✅ Booking data saved to draft via `PATCH /draft`
- ✅ Post-booking confirmation screen with portal activation message ("portal will be activated after the call")
- ✅ Admin panel shows "Activate Portal" + "Deny" for both `completed` and `call_scheduled` statuses
- ✅ `POST /api/partner-invites/{token}/schedule` in verti-v2 — transitions `completed → call_scheduled` (intermediate state when booking happens before submit)
- ✅ `onBooked` callback calls `markCallScheduled(token)` fire-and-forget after saving draft
- ✅ `POST /submit` transitions `pending → completed` AND `call_scheduled → completed` — `completed` is the true final state the admin acts on
- ✅ `POST /approve` accepts both `completed` and `call_scheduled`; creates clinic record + `user_profile` row (required for `custom_access_token_hook` to stamp `clinic_admin` into JWT)
- ✅ `access_granted` as a separate concept is not needed — `approved` status is the access gate

**Status flow:**
```
pending → call_scheduled → completed → approved
           (cal booked)    (submitted)  (portal active)
```

---

### VER-494 — Foundational: 12-State Status Machine
**Status: To Do | ~20% implemented**

- ✅ Implemented states: `pending | call_scheduled | completed | approved | denied | expired`
- ✅ `call_scheduled` added via `POST /schedule` endpoint; `completed` is the final wizard state; `approved` gates portal access
- ❌ Remaining intermediate states not implemented: `verified | payment_pending | payment_complete | agreements_signed | intake_in_progress`
- ❌ No state transition guards — wizard doesn't enforce step ordering via invite status
- ✅ `access_granted` handled via `approved` status — no separate column needed

---

### VER-445 — Stretch: Launch Partner Badge System
**Status: BLOCKED | 0% implemented**

- ❌ `partner_tier`, `partner_number`, `partner_tier_assigned_at` columns missing from `clinic_account`
- ❌ `assign_partner_tier()` Postgres function not created
- ❌ No `LaunchPartnerBadge` component
- ❌ `partner_tier` not in session/auth context
- **Blocked by VER-462** (function must be called at clinic creation)

---

## Summary Table

| Ticket | Step | Priority | FE % | BE % | Biggest Gap |
|--------|------|----------|------|------|-------------|
| VER-488 | Admin Invite Panel | Highest | ~100% | ~100% | Complete |
| VER-423 | Welcome & Password Setup | High | ~100% | ~100% | Complete |
| VER-377 | Contracts + Payment | High | ~70% | ~70% | DocuSign absent both sides; payment table ✅ done |
| VER-462 | Business Info Wizard | High | ~75% | ~80% | Partner tier not assigned; wrong final status |
| VER-489 | Pharmacy Selection | High | 0% | 0% | Intentionally skipped |
| VER-490 | Product Catalog | High | ~100% | ~100% | Complete |
| VER-491 | Provider Network | High | 0% | 0% | **Completely absent** |
| VER-492 | Branding | High | ~100% | ~100% | Complete |
| VER-466 | Cal.com Scheduling | High | ~100% | ~100% | Complete |
| VER-494 | 12-State Machine | Highest | ~40% | ~40% | 5 of ~11 states done; no transition guards |
| VER-445 | Launch Partner Badge | Low | 0% | 0% | Entire feature absent (blocked) |

---

## Critical Path Blockers (in order)

1. **VER-494 (state machine)** — Merge `feature/VER-ticket1-partner-clinic-invite` to main first; remaining intermediate states (`verified`, `payment_pending`, `payment_complete`, `agreements_signed`, `intake_in_progress`) and transition guards still needed
2. **VER-466** — ✅ Complete. Status flow: `pending → call_scheduled → completed → approved`. Submit always lands on `completed`; admin acts on `completed`/`call_scheduled` via "Activate Portal".
3. **VER-423 (password → Supabase user)** — ✅ Complete. Frontend form collects and saves password; `POST /approve` in verti-v2 now calls `supabaseAdmin.auth.admin.createUser()` with rollback on failure.
4. **VER-377 (DocuSign)** — ✅ Stripe fully done on both sides. DocuSign envelope/webhook still needs to be built from scratch on both sides
5. **VER-491 (provider network)** — Zero spec detail in code; needs design before any implementation
6. **VER-445 (partner badge DB)** — DB migration must land before VER-462 final submit can assign tier
