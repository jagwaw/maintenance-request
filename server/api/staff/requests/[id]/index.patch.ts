import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import { STATUSES } from '~~/config/maintenance'

const bodySchema = z.object({
  status: z.string().refine((s) => s in STATUSES, 'Unknown status').optional(),
  vendorId: z.uuid().nullable().optional(), // null = unassign
})

/**
 * Staff: change status and/or vendor. The change and its history entry are saved
 * together by the update_request database function (see 0002 migration).
 */
export default defineEventHandler(async (event) => {
  const staff = await requireStaff(event)
  const id = parseOr400(z.uuid(), getRouterParam(event, 'id'))
  const body = parseOr400(bodySchema, await readBody(event))
  const db = serverSupabaseServiceRole(event)

  const { error } = await db.rpc('update_request', {
    p_id: id,
    p_actor: staff.email,
    p_status: body.status ?? null,
    p_set_vendor: body.vendorId !== undefined,
    p_vendor_id: body.vendorId ?? null,
  })
  if (error?.message === 'not_found') throw createError({ statusCode: 404, statusMessage: 'Request not found' })
  if (error?.message === 'bad_vendor') throw createError({ statusCode: 400, statusMessage: 'Unknown or inactive vendor' })
  if (error) {
    console.error('[staff/requests/patch]', error.code, error.message)
    throw createError({ statusCode: 500, statusMessage: 'Could not update request' })
  }
  return { ok: true }
})
