export type Competitor = {
  id: string
  name: string
  logo: string
  deathFeatureIndex: number | null
  isSwearby?: boolean
}

export type Feature = {
  id: string
  label: string
  goldOnly?: boolean
}

// Left-to-right as rendered in the logo row.
// Outside-in symmetry: weakest on the edges, strongest adjacent to Swearby.
// deathFeatureIndex references the index in FEATURES of the feature that kills this competitor.
export const COMPETITORS: Competitor[] = [
  { id: 'boulevard',        name: 'Boulevard',        logo: '/vertical-logo-1.svg', deathFeatureIndex: 3  },
  { id: 'zenoti',           name: 'Zenoti',           logo: '/vertical-logo-2.svg', deathFeatureIndex: 6  },
  { id: 'aesthetic-record', name: 'Aesthetic Record', logo: '/vertical-logo-3.svg', deathFeatureIndex: 7  },
  { id: 'swearby',          name: 'Swearby',          logo: '/vertical-logo-4.svg', deathFeatureIndex: null, isSwearby: true },
  { id: 'patientnow',       name: 'PatientNow',       logo: '/vertical-logo-5.svg', deathFeatureIndex: 10 },
  { id: 'telegra-md',       name: 'Telegra MD',       logo: '/vertical-logo-6.svg', deathFeatureIndex: 5  },
  { id: 'jane-app',         name: 'Jane App',         logo: '/vertical-logo-7.svg', deathFeatureIndex: 4  },
]

export const FEATURES: Feature[] = [
  { id: 'online-booking',        label: 'Online Booking' },
  { id: 'payment-processing',    label: 'Payment Processing' },
  { id: 'patient-communication', label: 'Patient Communication' },
  { id: 'virtual-visits',        label: 'Virtual Visits' },
  { id: 'e-prescribing',         label: 'E-Prescribing' },
  { id: 'ai-clinical-notes',     label: 'AI Clinical Notes' },
  { id: 'lab-ordering',          label: 'Lab Ordering' },
  { id: 'branded-patient-app',   label: 'Branded Patient App' },
  { id: 'glp1-protocol',         label: 'GLP-1 Protocol Tracking' },
  { id: 'patient-retention',     label: 'Patient Retention Engine' },
  { id: 'multi-pharmacy',        label: 'Multi-Pharmacy Routing' },
  { id: 'c2c-referrals',         label: 'Clinic-to-Clinic Referrals',        goldOnly: true },
  { id: 'recurring-revenue',     label: 'Recurring Revenue Marketplace',     goldOnly: true },
  { id: 'build-bundles',         label: 'Build-Your-Own-Bundles',            goldOnly: true },
  { id: 'delivery-network',      label: 'Consumer Patient Delivery Network', goldOnly: true },
  { id: 'post-churn',            label: 'Post-Churn Monetization',           goldOnly: true },
]

// The Coronation happens the moment PatientNow dies — i.e. feature index 10.
export const CORONATION_FEATURE_INDEX = 10

export const SWEARBY_INDEX = COMPETITORS.findIndex(c => c.isSwearby)

export const COLORS = {
  green: '#263C30',
  cream: '#FBF7F2',
  gold:  '#BDA763',
  ink:   '#1C1C1A',
} as const
