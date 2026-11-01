import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'

const querySchema = z.object({
  propertyId: z.uuid().optional(),
  status: z.string().max(50).optional(),
  category: z.string().max(50).optional(),
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
  status: string
  source: string
  vendor: string | null
}

/** Staff: list requests, newest first, with optional filters. */
export default defineEventHandler(async (event): Promise<RequestRow[]> => {
  await requireStaff(event)
  const filters = parseOr400(querySchema, getQuery(event))

  const db = serverSupabaseServiceRole(event)
  let query = db
    .from('requests')
    .select('id, ref_code, created_at, contact_name, contact_verified, category, status, source, vendors(name), units!inner(label, status, property_id, properties(name))')
    .order('created_at', { ascending: false })
    .limit(500)
  if (filters.propertyId) query = query.eq('units.property_id', filters.propertyId)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.category) query = query.eq('category', filters.category)

  const { data, error } = await query
  if (error) throw serverError('staff/requests', error, 'Could not load requests')

  return data.map((r: any) => ({
    id: r.id,
    refCode: r.ref_code,
    createdAt: r.created_at,
    property: r.units.properties.name,
    unit: r.units.label,
    unitVacant: r.units.status === 'vacant',
    contactName: r.contact_name,
    contactVerified: r.contact_verified,
    category: r.category,
    status: r.status,
    source: r.source,
    vendor: r.vendors?.name ?? null,
  }))
})
