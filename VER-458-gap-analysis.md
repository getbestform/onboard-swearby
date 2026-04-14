# VER-458: Launch Portal (Clinic Onboarding) — Implementation Gap Analysis

**Epic:** LAUNCH PORTAL (CLINIC ONBOARDING)
**URL:** https://getbestform.atlassian.net/browse/VER-458
**Date:** 2026-04-14
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
| POST | `/api/partner-invites/{token}/payment` | Create Stripe PaymentIntent | VER-377 |
| POST | `/api/partner-invites/{token}/payment/confirm` | Confirm payment success | VER-377 |
| PATCH | `/api/partner-invites/{token}/status` | Drive state machine transitions | VER-494 |

### DB Tables — Missing ❌

```sql
-- onboarding_agreements (VER-377)
id                  UUID
invite_id           UUID  FK → clinic_invite
agreement_type      ENUM  msa | rev_marketing | baa
docusign_envelope_id TEXT
status              ENUM  pending | signed
signed_at           TIMESTAMPTZ

-- onboarding_payments (VER-377)
id                       UUID
invite_id                UUID  FK → clinic_invite
stripe_payment_intent_id TEXT
amount_cents             INTEGER
method                   ENUM  card | ach
status                   ENUM  pending | succeeded | failed
paid_at                  TIMESTAMPTZ

-- clinic_account additions (VER-445)
partner_tier             TEXT     launch_partner | partner
partner_number           INTEGER  1–200 for launch partners
partner_tier_assigned_at TIMESTAMPTZ

-- clinic_invite additions (VER-494)
access_granted           BOOLEAN  DEFAULT false — admin flips after onboarding call
```

---

## Gap Analysis by Ticket

---

### VER-488 — Step 1: Deal Close / Admin Panel
**Status: Complete | ~100% implemented**

- ✅ `verti_admin` acts as the sales rep — no separate role needed; any Verti admin can close a deal and send an invite
- ✅ Admin can input email, name, entity name/type and send invite
- ✅ Backend generates UUID token + 5-digit code, sends branded email
- ✅ Invite table with status badges, approve/deny actions, pagination, search/filter
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
- ✅ Step sits between Schedule Call and Review in the wizard (step 6 of 8)
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
- ❌ `assign_partner_tier()` not called on submit — `partner_tier`/`partner_number` columns don't exist yet (blocked by VER-445)
- ❌ Submission sets status to `completed`, not `pending_review` — spec expects `pending_review` as an intermediate state before admin approval

---

### VER-489 — Step 6: Pharmacy Selection
**Status: To Do | 0% implemented**

- ❌ Not implemented on frontend or backend
- ℹ️ Jira note says "not sure we need this yet — skip for now" — intentionally deferred

---

### VER-490 — Step 7: Product Catalog
**Status: To Do | ~40% implemented**

- ✅ Drug Catalog step collects drug name, doses, unit price, state availability (saved to draft)
- ❌ No product category selection (Weight-loss, Hormone Therapy, Anti-Aging, Sexual Health, Hair & Skin, Peptides)
- ❌ Drug catalog is wizard step 2 (before payment) — may contradict intended order

---

### VER-491 — Step 8: Provider Network Setup
**Status: To Do | 0% implemented**

- ❌ Not implemented on frontend or backend
- ❌ No `networkId`, `networkPreference2/3`, `doctorsInPerson` in draft schema or wizard

---

### VER-492 — Step 11: Branding & White-Label
**Status: To Do | ~50% implemented**

- ✅ Display name, logo upload (Supabase Storage via backend), brand color picker
- ✅ Backend `POST /logo` stores in `clinic-assets/logos/{token}.{ext}`, returns public URL
- ❌ No subdomain/white-label domain config
- ❌ No email template branding
- ❌ No patient portal branding options

---

### VER-466 — Step 12: Go-Live Call Scheduling (Cal.com)
**Status: To Do | ~70% implemented**

- ✅ Cal.com embed via `@calcom/embed-react`, captures `bookingUid` + `startTime`
- ✅ Booking data saved to draft via `PATCH /draft`
- ❌ No explicit `PATCH /status` call to set invite status to `call_scheduled` after booking
- ❌ `access_granted` column doesn't exist in backend schema — admin has no mechanism to flip it post-call
- ❌ No post-booking confirmation screen ("Your portal will be activated after the call")
- ❌ Admin panel has no "Activate Portal" action (only approve/deny exists)

---

### VER-494 — Foundational: 12-State Status Machine
**Status: To Do | ~20% implemented**

- ✅ Backend `clinic_invite.status` has 5 states: `pending | completed | approved | denied | expired`
- ❌ **Major gap:** 7+ intermediate states missing. Expected full machine:
  ```
  pending → verified → payment_pending → payment_complete
    → agreements_signed → intake_in_progress → intake_submitted
    → call_scheduled → access_granted
  ```
- ❌ No state transition endpoint or guards — wizard doesn't enforce step ordering via invite status
- ❌ `access_granted` column missing from schema entirely

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
| VER-490 | Product Catalog | High | ~40% | ~40% | Product categories missing; order may be wrong |
| VER-491 | Provider Network | High | 0% | 0% | **Completely absent** |
| VER-492 | Branding | High | ~50% | ~70% | Subdomain/white-label config missing |
| VER-466 | Cal.com Scheduling | High | ~70% | ~30% | No status transition; no `access_granted` mechanism |
| VER-494 | 12-State Machine | Highest | ~20% | ~20% | **Only 5 states; no transitions; missing `access_granted`** |
| VER-445 | Launch Partner Badge | Low | 0% | 0% | Entire feature absent (blocked) |

---

## Critical Path Blockers (in order)

1. **VER-494 (state machine)** — Merge `feature/VER-ticket1-partner-clinic-invite` to main first; then extend `clinic_invite.status` with all intermediate states and add a transition endpoint
2. **VER-423 (password → Supabase user)** — ✅ Complete. Frontend form collects and saves password; `POST /approve` in verti-v2 now calls `supabaseAdmin.auth.admin.createUser()` with rollback on failure.
3. **VER-377 (DocuSign + Stripe backend)** — Stripe PaymentIntent creation needs to move into verti-v2; DocuSign envelope/webhook needs to be built from scratch on both sides
4. **VER-491 (provider network)** — Zero spec detail in code; needs design before any implementation
5. **VER-445 (partner badge DB)** — DB migration must land before VER-462 final submit can assign tier
