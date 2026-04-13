import { describe, it, expect } from 'vitest'
import { cn, fmtDate, getInviteStatusClasses, formatPhone, formatEIN } from './utils'

// ── cn ────────────────────────────────────────────────────────────────────────

describe('cn', () => {
  it('joins multiple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('filters out falsy values', () => {
    expect(cn('foo', undefined, null, false, 'bar')).toBe('foo bar')
  })

  it('returns empty string when all values are falsy', () => {
    expect(cn(undefined, null, false)).toBe('')
  })

  it('handles a single class', () => {
    expect(cn('only')).toBe('only')
  })
})

// ── fmtDate ───────────────────────────────────────────────────────────────────

describe('fmtDate', () => {
  it('formats an ISO date string to readable US format', () => {
    expect(fmtDate('2025-01-15T00:00:00.000Z')).toMatch(/Jan/)
    expect(fmtDate('2025-01-15T00:00:00.000Z')).toMatch(/2025/)
  })

  it('handles end-of-year dates', () => {
    expect(fmtDate('2024-12-31T00:00:00.000Z')).toMatch(/Dec/)
    expect(fmtDate('2024-12-31T00:00:00.000Z')).toMatch(/2024/)
  })
})

// ── getInviteStatusClasses ────────────────────────────────────────────────────

describe('getInviteStatusClasses', () => {
  it('returns amber classes for pending', () => {
    expect(getInviteStatusClasses('pending')).toContain('amber')
  })

  it('returns emerald classes for completed', () => {
    expect(getInviteStatusClasses('completed')).toContain('emerald')
  })

  it('returns emerald classes for accepted', () => {
    expect(getInviteStatusClasses('accepted')).toContain('emerald')
  })

  it('returns blue classes for approved', () => {
    expect(getInviteStatusClasses('approved')).toContain('blue')
  })

  it('returns rose classes for denied', () => {
    expect(getInviteStatusClasses('denied')).toContain('rose')
  })

  it('returns red classes for expired', () => {
    expect(getInviteStatusClasses('expired')).toContain('red')
  })

  it('returns fallback classes for unknown status', () => {
    expect(getInviteStatusClasses('unknown')).toContain('secondary')
  })
})

// ── formatPhone ───────────────────────────────────────────────────────────────

describe('formatPhone', () => {
  it('formats a full 10-digit number', () => {
    expect(formatPhone('5551234567')).toBe('(555) 123-4567')
  })

  it('strips non-digit characters before formatting', () => {
    expect(formatPhone('(555) 123-4567')).toBe('(555) 123-4567')
  })

  it('handles partial input: fewer than 4 digits', () => {
    expect(formatPhone('555')).toBe('555')
  })

  it('handles partial input: 4–6 digits', () => {
    expect(formatPhone('5551')).toBe('(555) 1')
    expect(formatPhone('555123')).toBe('(555) 123')
  })

  it('handles partial input: 7–9 digits', () => {
    expect(formatPhone('5551234')).toBe('(555) 123-4')
  })

  it('truncates input beyond 10 digits', () => {
    expect(formatPhone('55512345678999')).toBe('(555) 123-4567')
  })

  it('returns empty string for empty input', () => {
    expect(formatPhone('')).toBe('')
  })
})

// ── formatEIN ─────────────────────────────────────────────────────────────────

describe('formatEIN', () => {
  it('formats a full 9-digit EIN with hyphen', () => {
    expect(formatEIN('123456789')).toBe('12-3456789')
  })

  it('strips non-digit characters before formatting', () => {
    expect(formatEIN('12-3456789')).toBe('12-3456789')
  })

  it('does not add hyphen for 2 or fewer digits', () => {
    expect(formatEIN('1')).toBe('1')
    expect(formatEIN('12')).toBe('12')
  })

  it('adds hyphen once third digit is entered', () => {
    expect(formatEIN('123')).toBe('12-3')
  })

  it('truncates input beyond 9 digits', () => {
    expect(formatEIN('1234567890000')).toBe('12-3456789')
  })

  it('returns empty string for empty input', () => {
    expect(formatEIN('')).toBe('')
  })
})
