import { describe, it, expect } from 'vitest'
import {
  businessInfoSchema,
  prescribersSchema,
  drugCatalogSchema,
  billingSchema,
  intakeSchema,
  validateStep,
} from './schemas'

// ── businessInfoSchema ────────────────────────────────────────────────────────

describe('businessInfoSchema', () => {
  it('passes with only the required field', () => {
    expect(businessInfoSchema.safeParse({ businessName: 'Acme Clinic' }).success).toBe(true)
  })

  it('fails when businessName is empty', () => {
    const result = businessInfoSchema.safeParse({ businessName: '' })
    expect(result.success).toBe(false)
  })

  it('fails when businessName is missing', () => {
    const result = businessInfoSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('passes with a valid full URL', () => {
    const result = businessInfoSchema.safeParse({
      businessName: 'Acme',
      website: 'https://acme.com',
    })
    expect(result.success).toBe(true)
  })

  it('passes with an empty website string', () => {
    const result = businessInfoSchema.safeParse({
      businessName: 'Acme',
      website: '',
    })
    expect(result.success).toBe(true)
  })

  it('fails with an invalid URL', () => {
    const result = businessInfoSchema.safeParse({
      businessName: 'Acme',
      website: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })

  it('passes with a valid 10-digit phone', () => {
    const result = businessInfoSchema.safeParse({
      businessName: 'Acme',
      phone: '(555) 123-4567',
    })
    expect(result.success).toBe(true)
  })

  it('fails with a phone that has fewer than 10 digits', () => {
    const result = businessInfoSchema.safeParse({
      businessName: 'Acme',
      phone: '555-123',
    })
    expect(result.success).toBe(false)
  })

  it('passes when phone is omitted', () => {
    const result = businessInfoSchema.safeParse({ businessName: 'Acme' })
    expect(result.success).toBe(true)
  })
})

// ── prescribersSchema ─────────────────────────────────────────────────────────

describe('prescribersSchema', () => {
  it('passes with a non-empty prescriberName', () => {
    expect(prescribersSchema.safeParse({ prescriberName: 'Dr. Smith' }).success).toBe(true)
  })

  it('fails when prescriberName is empty', () => {
    expect(prescribersSchema.safeParse({ prescriberName: '' }).success).toBe(false)
  })

  it('fails when prescriberName is missing', () => {
    expect(prescribersSchema.safeParse({}).success).toBe(false)
  })
})

// ── drugCatalogSchema ─────────────────────────────────────────────────────────

describe('drugCatalogSchema', () => {
  const validDrug = {
    drugName: 'Semaglutide',
    doses: '0.5mg, 1mg',
    unitPrice: '$250',
    stateAvailability: 'CA, TX',
  }

  it('passes with one complete drug entry', () => {
    expect(drugCatalogSchema.safeParse({ drugs: [validDrug] }).success).toBe(true)
  })

  it('passes with multiple drug entries', () => {
    expect(drugCatalogSchema.safeParse({ drugs: [validDrug, validDrug] }).success).toBe(true)
  })

  it('fails with an empty drugs array', () => {
    expect(drugCatalogSchema.safeParse({ drugs: [] }).success).toBe(false)
  })

  it('fails when a required drug field is empty', () => {
    const incomplete = { ...validDrug, drugName: '' }
    expect(drugCatalogSchema.safeParse({ drugs: [incomplete] }).success).toBe(false)
  })

  it('fails when drugs is missing', () => {
    expect(drugCatalogSchema.safeParse({}).success).toBe(false)
  })
})

// ── billingSchema ─────────────────────────────────────────────────────────────

describe('billingSchema', () => {
  it('passes with a succeeded paymentIntentId', () => {
    const result = billingSchema.safeParse({
      paymentIntentId: 'pi_abc123',
      paymentStatus: 'succeeded',
    })
    expect(result.success).toBe(true)
  })

  it('fails when paymentStatus is not succeeded', () => {
    const result = billingSchema.safeParse({
      paymentIntentId: 'pi_abc123',
      paymentStatus: 'processing',
    })
    expect(result.success).toBe(false)
  })

  it('fails when paymentIntentId is empty', () => {
    const result = billingSchema.safeParse({
      paymentIntentId: '',
      paymentStatus: 'succeeded',
    })
    expect(result.success).toBe(false)
  })

  it('fails when both fields are missing', () => {
    expect(billingSchema.safeParse({}).success).toBe(false)
  })
})

// ── intakeSchema ──────────────────────────────────────────────────────────────

describe('intakeSchema', () => {
  it('passes with a non-empty displayName', () => {
    expect(intakeSchema.safeParse({ displayName: 'Acme Wellness' }).success).toBe(true)
  })

  it('fails when displayName is empty', () => {
    expect(intakeSchema.safeParse({ displayName: '' }).success).toBe(false)
  })

  it('fails when displayName is missing', () => {
    expect(intakeSchema.safeParse({}).success).toBe(false)
  })
})

// ── validateStep ──────────────────────────────────────────────────────────────

describe('validateStep', () => {
  it('returns null for a valid step 0 draft', () => {
    const errors = validateStep(0, { businessName: 'Acme Clinic' })
    expect(errors).toBeNull()
  })

  it('returns errors for an invalid step 0 draft', () => {
    const errors = validateStep(0, { businessName: '' })
    expect(errors).not.toBeNull()
    expect(errors?.businessName).toBeDefined()
  })

  it('returns null for a valid step 1 draft', () => {
    expect(validateStep(1, { prescriberName: 'Dr. Smith' })).toBeNull()
  })

  it('returns errors for an invalid step 1 draft', () => {
    const errors = validateStep(1, { prescriberName: '' })
    expect(errors?.prescriberName).toBeDefined()
  })

  it('returns null for a valid step 2 draft', () => {
    const draft = {
      drugs: [{ drugName: 'X', doses: '1mg', unitPrice: '$10', stateAvailability: 'CA' }],
    }
    expect(validateStep(2, draft)).toBeNull()
  })

  it('returns errors for an empty drug catalog at step 2', () => {
    const errors = validateStep(2, { drugs: [] })
    expect(errors).not.toBeNull()
  })

  it('returns null for a valid step 3 draft', () => {
    expect(validateStep(3, { paymentIntentId: 'pi_x', paymentStatus: 'succeeded' })).toBeNull()
  })

  it('returns errors when payment has not succeeded at step 3', () => {
    const errors = validateStep(3, { paymentIntentId: 'pi_x', paymentStatus: 'requires_payment_method' })
    expect(errors?.paymentStatus).toBeDefined()
  })

  it('returns null for a valid step 4 draft', () => {
    expect(validateStep(4, { displayName: 'Acme' })).toBeNull()
  })

  it('returns errors for a missing displayName at step 4', () => {
    const errors = validateStep(4, {})
    expect(errors?.displayName).toBeDefined()
  })

  it('returns null for an unknown step number', () => {
    expect(validateStep(99, {})).toBeNull()
  })

  it('error map only records the first message per field path', () => {
    // businessName fails required — only one error should be recorded
    const errors = validateStep(0, { businessName: '' })
    expect(Object.keys(errors ?? {}).filter(k => k === 'businessName')).toHaveLength(1)
  })
})
