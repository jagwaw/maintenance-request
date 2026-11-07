import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import { PAGE_SIZE } from '~~/config/maintenance'

const querySchema = z.object({
  propertyId: z.uuid().optional(),
  status: z.string().max(50).optional(),
  category: z.string().max(50).optional(),
  contact: z.enum(['verified', 'unverified']).optional(),
  page: z.coerce.number().int().min(1).default(1),
})

export type RequestRow = {
  id: string
  refCode: string
  createdAt: string
  property: string
  unit: string
  unitVacant: boolean
  contactName: string
  contactVerified: boolean
  category: string
  description: string
  status: string
  source: string
  vendor: string | null
}

export type RequestPage = { requests: RequestRow[]; total: number; page: number; lastPage: number }

const COLUMNS = 'id, ref_code, created_at, contact_name, contact_verified, category, description, status, source, vendors(name), units!inner(label, status, property_id, properties(name))'

/** Staff: one page of requests, newest first, with optional filters. */
export default defineEventHandler(async (event): Promise<RequestPage> => {
  await requireStaff(event)
  const filters = parseOr400(querySchema, getQuery(event))

  const db = serverSupabaseServiceRole(event)
  const filtered = (options?: { count: 'exact'; head: true }) => {
    let query = db.from('requests').select(COLUMNS, options)
    if (filters.propertyId) query = query.eq('units.property_id', filters.propertyId)
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.category) query = query.eq('category', filters.category)
    if (filters.contact) query = query.eq('contact_verified', filters.contact === 'verified')
    return query
  }

  // Count first, so a page past the end can become the last page.
  const { count, error: countError } = await filtered({ count: 'exact', head: true })
  if (countError) throw serverError('staff/requests', countError, 'Could not load requests')
  const total = count ?? 0
  const { page, lastPage, from, to } = pageRange(total, filters.page, PAGE_SIZE)

  // id breaks ties, so a request can't appear on two pages when times are equal.
  const { data, error } = await filtered()
    .order('created_at', { ascending: false })
    .order('id')
    .range(from, to)
  if (error) throw serverError('staff/requests', error, 'Could not load requests')

  const requests = data.map((r: any) => ({
    id: r.id,
    refCode: r.ref_code,
    createdAt: r.created_at,
    property: r.units.properties.name,
    unit: r.units.label,
    unitVacant: r.units.status === 'vacant',
    contactName: r.contact_name,
    contactVerified: r.contact_verified,
    category: r.category,
    description: r.description,
    status: r.status,
    source: r.source,
    vendor: r.vendors?.name ?? null,
  }))
  return { requests, total, page, lastPage }
})
