/**
 * Import properties, units and tenants from a CSV.
 *
 *   npm run import:units                       # imports data/sample_units.csv
 *   npm run import:units -- path/to/file.csv
 *   npm run import:units -- --dry-run          # print the report, write nothing
 *
 * Idempotent: properties, units and tenants are upserted on their natural keys,
 * so running it twice changes nothing.
 */
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { parse } from 'csv-parse/sync'
import { createClient } from '@supabase/supabase-js'

type Warning = { row: number; field: string; problem: string; action: string }

type CleanRow = {
  row: number
  property: string
  unit: string
  tenantName: string | null
  email: string | null
  phoneDigits: string | null
  status: 'occupied' | 'vacant'
  leaseEnd: string | null
  warnings: Warning[]
}

const LIKELY_TYPOS = ['gmial', 'gmal', 'gamil', 'gmai.', 'hotmial', 'hotmal', 'yahooo', 'yaho.', 'outlok', '.con', '.cmo']
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/

const titleCase = (s: string) =>
  s.replace(/\s+/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())

/** Returns YYYY-MM-DD for a real calendar date (YYYY-MM-DD or M/D/YYYY), else null. */
function parseDate(raw: string): string | null {
  let y: number, m: number, d: number
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  const us = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (iso) [y, m, d] = [+iso[1], +iso[2], +iso[3]]
  else if (us) [y, m, d] = [+us[3], +us[1], +us[2]]
  else return null
  const date = new Date(Date.UTC(y, m - 1, d))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null
  return date.toISOString().slice(0, 10)
}

function cleanRow(raw: Record<string, string>, row: number): CleanRow {
  const warnings: Warning[] = []
  const warn = (field: string, problem: string, action: string) => warnings.push({ row, field, problem, action })
  const get = (key: string) => (raw[key] ?? '').trim()

  const email = get('email').toLowerCase() || null
  if (email) {
    if (!EMAIL_FORMAT.test(email)) warn('email', `invalid format "${email}"`, 'kept as given')
    else if (LIKELY_TYPOS.some((t) => email.includes(t))) warn('email', `likely typo "${email}"`, 'kept as given (not corrected)')
  }

  let phoneDigits: string | null = get('phone').replace(/\D/g, '') || null
  if (phoneDigits) {
    if (phoneDigits.length > 10) phoneDigits = phoneDigits.slice(-10)
    else if (phoneDigits.length < 10) warn('phone', `only ${phoneDigits.length} digits`, 'kept as given')
  }

  let leaseEnd: string | null = null
  const rawLease = get('lease_end')
  if (rawLease) {
    leaseEnd = parseDate(rawLease)
    if (!leaseEnd) warn('lease_end', `invalid date "${rawLease}"`, 'set to empty')
  }

  const tenantName = get('tenant_name').replace(/\s+/g, ' ') || null
  const hasTenant = Boolean(tenantName || email || phoneDigits)
  if (!tenantName && hasTenant) warn('tenant_name', 'contact given but no name', 'imported with blank name')

  const rawStatus = get('status').toLowerCase()
  let status: 'occupied' | 'vacant'
  if (rawStatus === 'occupied' || rawStatus === 'vacant') status = rawStatus
  else {
    status = hasTenant ? 'occupied' : 'vacant'
    warn('status', `unknown status "${get('status')}"`, `set to ${status}`)
  }
  if (status === 'vacant' && hasTenant) warn('status', 'unit is vacant but a tenant is listed', 'imported as given')

  return { row, property: titleCase(get('property')), unit: get('unit'), tenantName, email, phoneDigits, status, leaseEnd, warnings }
}

/** Parse and normalize the CSV. Pure: no database access. */
export function prepare(csv: string) {
  const records: Record<string, string>[] = parse(csv, { columns: true, skip_empty_lines: true, bom: true })
  const rows: CleanRow[] = []
  const warnings: Warning[] = []
  const seen = new Map<string, number>()

  records.forEach((raw, i) => {
    const row = cleanRow(raw, i + 2) // +2: header is line 1
    if (!row.property || !row.unit) {
      warnings.push({ row: row.row, field: 'property/unit', problem: 'missing', action: 'row skipped' })
      return
    }
    const key = JSON.stringify([row.property, row.unit, row.tenantName, row.email, row.phoneDigits, row.status, row.leaseEnd])
    if (seen.has(key)) {
      warnings.push({ row: row.row, field: '(row)', problem: `exact duplicate of row ${seen.get(key)}`, action: 'row dropped' })
      return
    }
    seen.set(key, row.row)
    rows.push(row)
    warnings.push(...row.warnings)
  })

  return { rows, warnings }
}

async function write(rows: CleanRow[], warnings: Warning[]) {
  const url = process.env.NUXT_PUBLIC_SUPABASE_URL
  const key = process.env.NUXT_SUPABASE_SERVICE_KEY
  if (!url || !key) throw new Error('Set NUXT_PUBLIC_SUPABASE_URL and NUXT_SUPABASE_SERVICE_KEY in .env')
  const db = createClient(url, key, { auth: { persistSession: false } })

  // Properties
  const propertyNames = [...new Set(rows.map((r) => r.property))]
  const { data: properties, error: pErr } = await db
    .from('properties')
    .upsert(propertyNames.map((name) => ({ name })), { onConflict: 'name' })
    .select('id, name')
  if (pErr) throw pErr
  const propertyId = new Map(properties.map((p) => [p.name, p.id]))

  // Units (first row for a unit decides its status; conflicts are reported)
  const units = new Map<string, { property_id: string; label: string; status: string; row: number }>()
  for (const r of rows) {
    const k = `${r.property}|${r.unit}`
    const existing = units.get(k)
    if (!existing) units.set(k, { property_id: propertyId.get(r.property)!, label: r.unit, status: r.status, row: r.row })
    else if (existing.status !== r.status)
      warnings.push({ row: r.row, field: 'status', problem: `conflicts with row ${existing.row} for the same unit`, action: `kept ${existing.status}` })
  }
  const { data: unitRows, error: uErr } = await db
    .from('units')
    .upsert([...units.values()].map(({ row, ...u }) => u), { onConflict: 'property_id,label' })
    .select('id, property_id, label')
  if (uErr) throw uErr
  const unitId = new Map(unitRows.map((u) => [`${u.property_id}|${u.label}`, u.id]))

  // Tenants (one per row that lists someone; same unit+name+email counts as one tenant)
  const byKey = new Map<string, { row: number; tenant: Record<string, unknown> }>()
  for (const r of rows.filter((r) => r.tenantName || r.email || r.phoneDigits)) {
    const unit_id = unitId.get(`${propertyId.get(r.property)}|${r.unit}`)!
    const k = `${unit_id}|${r.tenantName ?? ''}|${r.email ?? ''}`
    const existing = byKey.get(k)
    if (existing) {
      warnings.push({ row: r.row, field: '(row)', problem: `same tenant as row ${existing.row} with different details`, action: `kept row ${existing.row}` })
      continue
    }
    byKey.set(k, {
      row: r.row,
      tenant: {
        unit_id,
        name: r.tenantName ?? '',
        email: r.email,
        phone_digits: r.phoneDigits,
        lease_end: r.leaseEnd,
        import_warnings: r.warnings.map((w) => `${w.field}: ${w.problem}`),
      },
    })
  }
  const tenants = [...byKey.values()].map((t) => t.tenant)
  if (tenants.length) {
    const { error: tErr } = await db.from('tenants').upsert(tenants, { onConflict: 'unit_id,name,email' })
    if (tErr) throw tErr
  }

  return { properties: propertyNames.length, units: units.size, tenants: tenants.length }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const file = args.find((a) => !a.startsWith('--')) ?? 'data/sample_units.csv'
  try {
    process.loadEnvFile()
  } catch {
    // No .env file — rely on the environment.
  }

  const { rows, warnings } = prepare(readFileSync(file, 'utf8'))
  const counts = dryRun ? null : await write(rows, warnings)

  console.log(`\nWarnings (${warnings.length})`)
  if (warnings.length) console.table(warnings.sort((a, b) => a.row - b.row))
  if (counts) console.log(`Imported ${counts.properties} properties, ${counts.units} units, ${counts.tenants} tenants.`)
  else console.log(`Dry run: ${rows.length} rows ready, nothing written.`)
}

// Only run when executed directly (npm run import:units), not when imported by tests.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
