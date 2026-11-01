import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'

const bodySchema = z.object({ name: vendorNameSchema.optional(), active: z.boolean().optional() })

/** Staff: rename a vendor, or deactivate/reactivate it. Vendors are never deleted, so history stays intact. */
export default defineEventHandler(async (event) => {
  await requireStaff(event)
  const id = parseOr400(z.uuid(), getRouterParam(event, 'id'))
  const body = parseOr400(bodySchema, await readBody(event))
  if (body.name) await assertVendorNameFree(event, body.name, id)

  const db = serverSupabaseServiceRole(event)
  const { data, error } = await db.from('vendors').update(body).eq('id', id).select('id, name, active').maybeSingle()
  if (error) throw serverError('staff/vendors/patch', error, 'Could not update vendor')
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Vendor not found' })
  return data
})
