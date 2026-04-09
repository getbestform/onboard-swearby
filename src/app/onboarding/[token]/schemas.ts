import { z } from 'zod'

const requiredString = (msg: string) => z.string().min(1, msg)

export const businessInfoSchema = z.object({
  businessName: requiredString('Legal Business Name is required.'),
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

export const billingCardSchema = z.object({
  cardholderName: requiredString('Cardholder Name is required.'),
  cardNumber:     z.string().min(19, 'Enter a valid 16-digit card number.'),
  expiry:         z.string().min(7, 'Enter a valid expiry date.'),
  cvc:            z.string().min(3, 'Enter a valid CVC.'),
})

export const billingAchSchema = z.object({
  accountName:   requiredString('Account Holder Name is required.'),
  routingNumber: z.string().length(9, 'Routing number must be 9 digits.'),
  accountNumber: z.string().min(4, 'Account number is required.'),
})

export const intakeSchema = z.object({
  displayName: requiredString('Clinic Display Name is required.'),
})

export type FieldErrors = Record<string, string>

/** Runs the schema for the given step and returns a flat errors map, or null if valid. */
export function validateStep(step: number, draft: Record<string, unknown>): FieldErrors | null {
  const schemas: Record<number, z.ZodTypeAny> = {
    0: businessInfoSchema,
    1: prescribersSchema,
    2: drugCatalogSchema,
    3: draft.billingMode === 'ach' ? billingAchSchema : billingCardSchema,
    4: intakeSchema,
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
