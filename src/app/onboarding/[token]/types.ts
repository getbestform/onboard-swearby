export type DraftData = {
  // business
  businessName?: string; ein?: string; npi?: string
  street?: string; city?: string; state?: string; zip?: string
  phone?: string; website?: string
  // prescribers
  prescriberName?: string; dea?: string; license?: string; licenseState?: string; specialty?: string
  // catalog
  drugs?: { drugName: string; doses: string; unitPrice: string; stateAvailability: string }[]
  // billing — Stripe-safe fields only, never raw card data
  paymentIntentId?: string; paymentStatus?: string; paymentClientSecret?: string
  cardholderName?: string; last4?: string; brand?: string
  // intake
  displayName?: string; brandColor?: string; description?: string; yearsInPractice?: string; locations?: string; logoUrl?: string
  // schedule
  calBookingUid?: string; calBookingStartTime?: string
}

export const field = 'w-full bg-[#e4e2dd] border-none rounded px-4 py-3 text-sm text-[#1b1c19] placeholder:text-[#1b1c19]/30 outline-none focus:ring-1 focus:ring-[#1A3C2A]/20 focus:bg-white transition-all'
export const lbl   = 'block text-[10px] font-semibold text-[#424843] uppercase tracking-widest mb-2'
export const sec   = 'text-[10px] font-bold uppercase tracking-[0.2em] text-[#424843]/60 border-b border-[#e4e2dd] pb-2 mb-6'
