import Stripe from 'stripe'

// Lazy singleton — callers in actions/invite.ts guard STRIPE_SECRET_KEY
// before importing, so this is never reached without a valid key.
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return _stripe
}
