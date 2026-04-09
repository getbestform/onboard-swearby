# VertiosEMR v2 — Integration Context for Clinic Onboarding UI

## What this project is

VertiosEMR v2 is a Next.js 15 / Drizzle ORM / Supabase multi-tenant EMR platform.
The clinic onboarding UI you are building collects data that ultimately writes to the
`clinic` table in this system. This document is a contract between the two projects.

---

## The Onboarding Data Model

### `OnboardingFormData` — the shape your UI must produce

```ts
interface StaffMember {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface OnboardingFormData {
  // Tab 1 — Account
  name: string;                   // clinic display name
  legalNameDifferent: boolean;
  legalName: string;              // only required if legalNameDifferent = true
  website: string;
  address: string;
  city: string;
  state: string;                  // 2-letter US state code
  zip: string;                    // format: XXXXX or XXXXX-XXXX
  phone: string;
  email: string;

  // Tab 2 — Legal
  businessType: string;           // one of: LLC | Corporation | Sole Proprietorship | Partnership | Non-Profit
  ein: string;                    // format: XX-XXXXXXX
  legitscriptUrl: string;         // https://...
  privacyPolicyUrl: string;       // https://...
  termsUrl: string;               // https://...
  inPersonConsults: string;       // 'yes' | '' (maps to boolean on write)
  needsPaymentProcessing: string; // 'yes' | '' (maps to boolean on write)
  productCategories: string[];    // subset of allowed categories (see Enums below)

  // Tab 3 — Staff
  staff: StaffMember[];           // at least 1 required
  mainContactIndex: number;       // index into staff[] for the primary clinic_admin

  // Tab 4 — Doctors
  networkId: string;              // FK → doctor_network.id (primary network)
  networkPreference2: string;     // FK → doctor_network.id (fallback)
  networkPreference3: string;     // FK → doctor_network.id (fallback)
  doctorsInPerson: boolean;

  // Tab 5 — Pharmacy
  pharmacyPartnerId: string;      // FK → pharmacy partner record

  // Tab 6 — Labs
  labId: string;                  // FK → lab record
}
```

---

## Tabs & Validation Rules

| Tab | Required fields | Notes |
|-----|----------------|-------|
| Account | name, address, city, state, zip, phone, email | website optional but must be a valid `https://` URL if provided |
| Legal | businessType, ein, legitscriptUrl, privacyPolicyUrl, termsUrl, inPersonConsults, needsPaymentProcessing, ≥1 productCategory | all URLs must start with `https://`; ein must match `XX-XXXXXXX` |
| Staff | firstName, lastName, email, phone per member | minimum 1 staff member |
| Doctors | networkId | networkPreference2 / networkPreference3 optional |
| Pharmacy | pharmacyPartnerId | |
| Labs | labId | |

---

## DB Column Mapping (`clinic` table)

| Form field | DB column | Type |
|------------|-----------|------|
| name | `name` | text |
| legalName | `legal_name` | text |
| website | `website` | text |
| address | `address` | text |
| city | `city` | text |
| state | `state` | text |
| zip | `zip` | text |
| phone | `phone` | text |
| email | `email` | text |
| businessType | `business_type` | text |
| ein | `ein` | text |
| legitscriptUrl | `legitscript_url` | text |
| privacyPolicyUrl | `privacy_policy_url` | text |
| termsUrl | `terms_url` | text |
| inPersonConsults | `in_person_consults` | boolean |
| needsPaymentProcessing | `needs_payment_processing` | boolean |
| productCategories | `product_categories` | text[] |
| networkId | `network_id` | text (FK → doctor_network) |
| networkPreference2 | `network_preference_2` | text |
| networkPreference3 | `network_preference_3` | text |
| doctorsInPerson | `doctors_in_person` | boolean |
| pharmacyPartnerId | `pharmacy_partner_id` | text |
| labId | `lab_id` | text |
| staff + mainContactIndex | `onboarding_data` (jsonb) | `{ staff: StaffMember[], mainContactIndex: number }` |

`onboarding_status` is a separate column managed by verti_admin post-submission — the UI does not set it.

---

## User Roles

```ts
type UserRole =
  | 'verti_admin'   // Verti internal — manages all clinics, runs the wizard
  | 'network_admin' // Doctor network operator
  | 'network_staff' // Doctor network staff
  | 'doctor'
  | 'clinic_admin'  // Primary contact of the onboarded clinic
  | 'clinic_user'   // Additional clinic staff
  | 'patient'
  | 'none';
```

Staff collected during onboarding are provisioned as:
- `clinic_admin` — the staff member at `mainContactIndex`
- `clinic_user` — all other staff members

Each gets a `user_profile` row with `clinic_id` set to the newly created clinic.

---

## Enums / Allowed Values

```ts
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV',
  'NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN',
  'TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const BUSINESS_TYPES = [
  'LLC', 'Corporation', 'Sole Proprietorship', 'Partnership', 'Non-Profit',
];

const PRODUCT_CATEGORIES = [
  'Weight-loss', 'Hormone Therapy', 'Anti-Aging',
  'Sexual Health', 'Hair & Skin', 'Peptides',
];
```

---

## What verti-v2 does with the submitted data

1. Creates a `clinic` row with all mapped fields above.
2. Stores `{ staff, mainContactIndex }` in `clinic.onboarding_data` (jsonb).
3. For each staff member: creates an `auth.users` entry + `user_profile` row with the
   appropriate role (`clinic_admin` or `clinic_user`) and `clinic_id` set to the new clinic.
4. `onboarding_status` defaults to `'active'`; a `verti_admin` reviews and transitions it post-submission.

---

## Out of scope for the onboarding UI

These fields exist on the `clinic` table but are configured by verti_admin post-onboarding:

- GHL integration (`ghl_api_key`, `ghl_location_id`)
- Stripe billing (`stripe_customer_id`, `stripe_subscription_id`, `billing_plan`, `setup_fee_paid`)
- A2P SMS status (`a2p_status`, `a2p_brand_id`)
- `doctor_source` — defaults to `'network_only'`
- `states_served` — configured post-onboarding
- DispensePro credentials (`dp_site_id`, `dp_api_key`, `dp_api_username`)
- Logo / brand colors (`logo_url`, `brand_colors`)
- `onboarding_status` — managed by verti_admin, not the onboarding form

---

## API Contract

Submit a `POST` request to the verti-v2 admin API with the `OnboardingFormData` JSON body.

> **Endpoint TBD** — fill in once defined in verti-v2.

The verti-v2 side validates the payload with the same rules described in the Tabs section
before writing to the database.
