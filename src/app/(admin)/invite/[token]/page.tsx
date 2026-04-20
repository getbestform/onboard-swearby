import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getInviteDetail, type DrugEntry } from '@/app/actions/invite'
import { fmtDate, getInviteStatusClasses } from '@/lib/utils'

function statusBadge(status: string) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium border ${getInviteStatusClasses(status)}`}>
      {status}
    </span>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-secondary/15 overflow-hidden">
      <div className="px-6 py-4 border-b border-secondary/10">
        <h2 className="text-[10px] uppercase tracking-[0.15em] text-secondary font-semibold">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-secondary mb-1">{label}</p>
      <p className="text-sm text-primary">{value || <span className="text-secondary/50 italic">Not provided</span>}</p>
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-8 gap-y-5">{children}</div>
}

export default async function InviteDetailPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const result = await getInviteDetail(token)

  if ('error' in result) notFound()

  const { invite, draft } = result

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/invite" className="text-[10px] uppercase tracking-widest text-secondary hover:text-primary transition-colors flex items-center gap-1.5 mb-3">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            All Invites
          </Link>
          <p className="text-[10px] uppercase tracking-[0.15em] text-secondary mb-1">Submitted Application</p>
          <h1 className="font-display text-3xl text-primary leading-tight">{invite.ownerName}</h1>
          <p className="text-sm text-secondary mt-1">{invite.email}</p>
        </div>
        <div className="flex items-center gap-3 mt-2">
          {statusBadge(invite.status)}
          <span className="text-xs text-secondary">Submitted {fmtDate(invite.createdAt)}</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Invite meta */}
        <Section title="Invite Details">
          <Grid>
            <Field label="Entity Name" value={invite.entityName} />
            <Field label="Entity Type" value={invite.entityType} />
            <Field label="Expires" value={fmtDate(invite.expiresAt)} />
            <Field label="Token" value={token} />
          </Grid>
        </Section>

        {/* Business Info */}
        <Section title="Business Info">
          {draft ? (
            <Grid>
              <Field label="Business Name" value={draft.businessName} />
              <Field label="EIN" value={draft.ein} />
              <Field label="NPI" value={draft.npi} />
              <Field label="Phone" value={draft.phone} />
              <Field label="Website" value={draft.website} />
              <div className="col-span-2">
                <Field
                  label="Address"
                  value={[draft.street, draft.city, draft.state, draft.zip].filter(Boolean).join(', ') || undefined}
                />
              </div>
            </Grid>
          ) : <p className="text-sm text-secondary italic">No data submitted.</p>}
        </Section>

        {/* Prescribers */}
        <Section title="Prescriber Details">
          {draft ? (
            <Grid>
              <Field label="Prescriber Name" value={draft.prescriberName} />
              <Field label="Specialty" value={draft.specialty} />
              <Field label="DEA Number" value={draft.dea} />
              <Field label="License Number" value={draft.license} />
              <Field label="License State" value={draft.licenseState} />
            </Grid>
          ) : <p className="text-sm text-secondary italic">No data submitted.</p>}
        </Section>

        {/* Drug Catalog */}
        <Section title="Drug Catalog">
          {draft?.drugs?.length ? (
            <div className="space-y-4">
              {draft.drugs.map((drug: DrugEntry, i: number) => (
                <div key={i} className={`${i > 0 ? 'pt-4 border-t border-secondary/10' : ''}`}>
                  <p className="text-[10px] uppercase tracking-widest text-secondary mb-3">
                    {draft.drugs!.length > 1 ? `Drug ${i + 1}` : 'Drug'}
                  </p>
                  <Grid>
                    <Field label="Drug Name" value={drug.drugName} />
                    <Field label="Available Doses" value={drug.doses} />
                    <Field label="Unit Price" value={drug.unitPrice} />
                    <Field label="State Availability" value={drug.stateAvailability} />
                  </Grid>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-secondary italic">No drugs submitted.</p>}
        </Section>

        {/* Billing */}
        <Section title="Billing">
          {draft?.paymentIntentId ? (
            <Grid>
              <Field
                label="Card"
                value={draft.last4
                  ? `${draft.brand ? draft.brand.charAt(0).toUpperCase() + draft.brand.slice(1) : 'Card'} ••••${draft.last4}`
                  : undefined}
              />
              <Field label="Cardholder" value={draft.cardholderName} />
              <Field label="Payment Status" value={draft.paymentStatus} />
              <Field label="Payment Intent" value={draft.paymentIntentId} />
            </Grid>
          ) : <p className="text-sm text-secondary italic">No payment made.</p>}
        </Section>

        {/* Intake */}
        <Section title="Intake Setup">
          {draft?.displayName || draft?.description ? (
            <Grid>
              <Field label="Display Name" value={draft.displayName} />
              <Field label="Brand Color" value={draft.brandColor} />
              <Field label="Years in Practice" value={draft.yearsInPractice} />
              <Field label="Locations" value={draft.locations} />
              <div className="col-span-2">
                <Field label="Description" value={draft.description} />
              </div>
            </Grid>
          ) : <p className="text-sm text-secondary italic">No intake data submitted.</p>}
        </Section>
      </div>
    </div>
  )
}
