import { describe, expect, it } from 'vitest'
import { prepare } from './import-units'

const HEADER = 'property,unit,tenant_name,email,phone,status,lease_end'
const csv = (...rows: string[]) => [HEADER, ...rows].join('\n')

/** Warnings for one field, as "problem" strings. */
const problems = (warnings: { field: string; problem: string }[], field: string) =>
  warnings.filter((w) => w.field === field).map((w) => w.problem)

describe('prepare() — CSV import rules', () => {
  it('drops an exact duplicate after trimming and normalizing property case', () => {
    const { rows, warnings } = prepare(
      csv(
        'Bayview Flats,D,Ana Cruz,ana@example.com,5551234567,occupied,2027-05-31',
        'Bayview flats,D ,Ana Cruz,ana@example.com,5551234567,occupied,2027-05-31',
      ),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ property: 'Bayview Flats', unit: 'D' })
    expect(warnings).toContainEqual({ row: 3, field: '(row)', problem: 'exact duplicate of row 2', action: 'row dropped' })
  })

  it('keeps a likely-typo email unchanged and warns', () => {
    const { rows, warnings } = prepare(csv('Palm Court,108,Luis Herrera,luis.herrera@gmial.com,5551234567,occupied,'))
    expect(rows[0].email).toBe('luis.herrera@gmial.com')
    expect(problems(warnings, 'email')).toEqual(['likely typo "luis.herrera@gmial.com"'])
  })

  it('warns on an invalid email format', () => {
    const { rows, warnings } = prepare(csv('Palm Court,104,Denise Carter,denise.carter@gmail,5551234567,occupied,'))
    expect(rows[0].email).toBe('denise.carter@gmail')
    expect(problems(warnings, 'email')).toEqual(['invalid format "denise.carter@gmail"'])
  })

  it('keeps a short phone number and warns', () => {
    const { rows, warnings } = prepare(csv('Cedar Row,2,Sam Lee,sam@example.com,555-123,occupied,'))
    expect(rows[0].phoneDigits).toBe('555123')
    expect(problems(warnings, 'phone')).toEqual(['only 6 digits'])
  })

  it('sets an invalid lease_end to null and warns', () => {
    const { rows, warnings } = prepare(csv('Cedar Row,3,Kim Park,kim@example.com,5551234567,occupied,2027-13-01'))
    expect(rows[0].leaseEnd).toBeNull()
    expect(problems(warnings, 'lease_end')).toEqual(['invalid date "2027-13-01"'])
  })

  it('imports a vacant unit with a tenant as given and warns', () => {
    const { rows, warnings } = prepare(csv('Palm Court,105,Jo Diaz,jo@example.com,5551234567,vacant,'))
    expect(rows[0]).toMatchObject({ status: 'vacant', tenantName: 'Jo Diaz' })
    expect(problems(warnings, 'status')).toEqual(['unit is vacant but a tenant is listed'])
  })

  it('keeps two tenants on the same unit', () => {
    const { rows, warnings } = prepare(
      csv(
        'Palm Court,101,Maria Santos,maria@example.com,5551234567,occupied,',
        'Palm Court,101,Carlos Santos,carlos@example.com,5559876543,occupied,',
      ),
    )
    expect(rows.map((r) => r.tenantName)).toEqual(['Maria Santos', 'Carlos Santos'])
    expect(warnings).toEqual([])
  })
})
