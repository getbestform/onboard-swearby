import { z } from 'zod'

const requiredString = (msg: string) => z.string().min(1, msg)

export const businessInfoSchema = z.object({
  businessName: requiredString('Legal Business Name is required.'),
  website: z.string().url('Enter a valid URL (e.g. https://clinic.com)').or(z.literal('')).optional(),
  phone: z.string().refine(v => !v || v.replace(/\D/g, '').length === 10, 'Enter a valid 10-digit phone number').optional(),
})

export const prescribersSchema = z.object({
  prescriberName: requiredString('Full Name is required.'),
})

const drugEntrySchema = z.object({
  drugName:          requiredString('Drug Name is required.'),
  doses:             requiredString('Available Doses is required.'),
  unitPrice:         requiredString('Unit Price is required.'),
  stateAvailability: requiredString('State Availability is required.'),
})

export const drugCatalogSchema = z.object({
  drugs: z.array(drugEntrySchema).min(1, 'At least one drug entry is required.'),
})

// Billing is validated by Stripe Elements on the client.
// We only verify that a successful PaymentIntent was recorded before advancing.
export const billingSchema = z.object({
  paymentIntentId: requiredString('Payment is required to continue.'),
  paymentStatus:   z.literal('succeeded', { error: 'Payment must be completed before continuing.' }),
})

export const intakeSchema = z.object({
  displayName: requiredString('Clinic Display Name is required.'),
})

export type FieldErrors = Record<string, string>

/** Runs the schema for the given step and returns a flat errors map, or null if valid. */
export function validateStep(step: number, draft: Record<string, unknown>): FieldErrors | null {
  const schemas: Record<number, z.ZodTypeAny> = {
    // steps 0 (PasswordForm) and 1 (BillingForm) manage their own validation
    2: businessInfoSchema,
    3: prescribersSchema,
    4: drugCatalogSchema,
    5: intakeSchema,
  }

  const schema = schemas[step]
  if (!schema) return null

  const result = schema.safeParse(draft)
  if (result.success) return null

  const errors: FieldErrors = {}
  for (const issue of result.error.issues) {
    const key = issue.path.join('.')
    if (!errors[key]) errors[key] = issue.message
  }
  return errors
}
