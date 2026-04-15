# VER-377: DocuSign Integration Plan

**Ticket:** [VER-377 — Step 3 & 4: Contracts + Payment](https://getbestform.atlassian.net/browse/VER-377)
**Date:** 2026-04-15
**Status:** Payment ✅ done · DocuSign ❌ not started

---

## Scope (DocuSign only — Payment is complete)

Sign 3 agreements using DocuSign embedded signing before the clinic owner can proceed:

1. **MSA** — Master Services Agreement
2. **Rev/Marketing** — Revenue & Marketing Agreement
3. **BAA** — Business Associate Agreement

Signer name and entity are pre-filled from the `clinic_invite` record.

---

## Architecture

```
Frontend (onboard-swearby)          Backend (verti-v2)
──────────────────────────          ──────────────────
ContractsStep                       GET  /api/partner-invites/[token]/agreements
  → click agreement         ──────► POST /api/partner-invites/[token]/agreements/[type]/sign
  ← { signingUrl }          ◄──────   creates envelope + recipient view URL
  → opens in popup window
  → DocuSign redirects      ──────► POST /api/partner-invites/[token]/agreements/webhook
    to /return?type=msa               (DocuSign Connect HMAC-verified)
  → return page posts msg   ──────►  update onboarding_agreements.status = 'signed'
  ← re-fetches /agreements  ◄──────
```

---

## Sprint 1 — Foundation (DB + DocuSign auth lib)

**Goal:** Everything in place so Sprint 2 routes have what they need.

### Tasks

- [x] `supabase/migrations/20260415200000_onboarding_agreements.sql`
- [x] `db/schema.ts` — add `onboardingAgreements` table
- [x] `lib/docusign.ts` — JWT auth singleton + `createSigningUrl()` helper
- [ ] `npm install docusign-esign` in verti-v2
- [ ] Add env vars to `.env.local` (see below)

### Env vars needed

```env
DOCUSIGN_ACCOUNT_ID=
DOCUSIGN_INTEGRATION_KEY=
DOCUSIGN_USER_ID=
DOCUSIGN_PRIVATE_KEY=          # RSA private key, base64 encoded
DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi
DOCUSIGN_TEMPLATE_ID_MSA=
DOCUSIGN_TEMPLATE_ID_REV_MARKETING=
DOCUSIGN_TEMPLATE_ID_BAA=
DOCUSIGN_WEBHOOK_HMAC_KEY=     # set in DocuSign Connect config
```

---

## Sprint 2 — Backend API Routes

**Goal:** All 3 routes implemented and callable.

### Tasks

- [ ] `GET /api/partner-invites/[token]/agreements/route.ts`
  - Ensure 3 rows exist (upsert defaults on first read)
  - Return `[{ type, status, signedAt }]`

- [ ] `POST /api/partner-invites/[token]/agreements/[type]/sign/route.ts`
  - Validate `type` ∈ `msa | rev_marketing | baa`
  - Get DocuSign access token (JWT)
  - Create envelope from template, pre-fill `ownerName` + `entityName` + `email`
  - Store `envelopeId` on the agreement row
  - Return `{ signingUrl }` (recipient view URL, expires ~5 min)
  - Set `returnUrl` → `{FRONTEND_URL}/onboarding/[token]/agreements/return?type=[type]`

- [ ] `POST /api/partner-invites/[token]/agreements/webhook/route.ts`
  - Verify DocuSign Connect HMAC-SHA256 signature header
  - On `envelope-completed` event, find agreement by `docusignEnvelopeId`
  - Set `status = 'signed'`, `signedAt = now()`
  - Return 200

---

## Sprint 3 — Frontend

**Goal:** Contracts step in wizard, fully blocking payment progression.

### Tasks

- [ ] `src/app/onboarding/[token]/steps/ContractsStep.tsx`
  - Fetch `GET /agreements` on mount
  - Render 3 agreement rows: name, description, signed/pending badge
  - On click → call `POST /agreements/[type]/sign` → `window.open(signingUrl)`
  - Listen for `message` event from return page → re-fetch statuses
  - "Continue to Payment" button disabled until all 3 are `signed`

- [ ] `src/app/onboarding/[token]/agreements/return/page.tsx`
  - Tiny page: posts `{ type: 'docusign-complete', agreementType }` to opener
  - Auto-closes the popup

- [ ] Wire `ContractsStep` into `OnboardingWizard.tsx`
  - Insert at index 1 (after Account, before Payment)
  - Update `STEPS`, `STEP_META`, and `renderStepForm()` case numbers

---

## Sprint 4 — Status Machine Integration + Polish

**Goal:** Invite status reflects agreement progress; no regression.

### Tasks

- [ ] After all 3 signed, advance invite status to `agreements_signed` (VER-494 state)
- [ ] Add invite status guard in sign route — reject if `expired` or `denied`
- [ ] Handle DocuSign sandbox → production toggle via env
- [ ] Manual QA: full flow in DocuSign demo environment
- [ ] Update `VER-458-gap-analysis.md` — VER-377 completion status

---

## File Map

```
verti-v2/
  supabase/migrations/
    20260415200000_onboarding_agreements.sql   ← Sprint 1
  db/
    schema.ts                                  ← Sprint 1 (add table)
  lib/
    docusign.ts                                ← Sprint 1
  app/api/partner-invites/[token]/
    agreements/
      route.ts                                 ← Sprint 2 (GET)
      [type]/
        sign/
          route.ts                             ← Sprint 2 (POST sign)
      webhook/
        route.ts                               ← Sprint 2 (POST webhook)

onboard-swearby/
  src/app/onboarding/[token]/
    steps/
      ContractsStep.tsx                        ← Sprint 3
    agreements/
      return/
        page.tsx                               ← Sprint 3
    OnboardingWizard.tsx                       ← Sprint 3 (wire step)
```

---

## Key DocuSign Notes

- **JWT consent**: Must grant consent once in browser before server calls work
  → `https://account-d.docusign.com/oauth/auth?response_type=code&scope=impersonation%20signature&client_id={KEY}&redirect_uri=https://docusign.com`
- **Embedded signing URL** expires in 5 minutes — generate on click only
- **`returnUrl`** must be whitelisted in DocuSign app redirect URIs
- **Webhook HMAC**: Set in DocuSign → Settings → Connect → Add HMAC Key
- Sandbox: `demo.docusign.net` · Production: `na.docusign.net`
