import { describe, expect, it } from 'vitest'
import { formatDate } from '../utils/date'

// Intl may use a narrow no-break space before AM/PM, so normalize spaces before comparing.
const format = (iso: string) => formatDate(iso).replace(/\s/g, ' ')

describe('formatDate', () => {
  it('shows winter times in EST (UTC-5)', () => {
    expect(format('2026-11-07T08:22:00Z')).toBe('Nov 7, 2026, 3:22 AM EST')
  })
  it('shows summer times in EDT (UTC-4)', () => {
    expect(format('2026-07-01T16:05:00Z')).toBe('Jul 1, 2026, 12:05 PM EDT')
  })
  it('moves to the previous day when it is still yesterday in Eastern time', () => {
    expect(format('2026-11-07T02:00:00Z')).toBe('Nov 6, 2026, 9:00 PM EST')
  })
})
