import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import { STATUSES } from '~~/config/maintenance'

const bodySchema = z.object({
  status: z.string().refine((s) => s in STATUSES, 'Unknown status').optional(),
  vendorId: z.uuid().nullable().optional(), // null = unassign
})

/** Staff: change status and/or vendor. Each change is written to the history. */
export default defineEventHandler(async (event) => {
  const staff = await requireStaff(event)
  const id = parseOr400(z.uuid(), getRouterParam(event, 'id'))
  const body = parseOr400(bodySchema, await readBody(event))
  const db = serverSupabaseServiceRole(event)

  const { data: current } = await db.from('requests').select('status, vendor_id, vendors(name)').eq('id', id).maybeSingle()
  if (!current) throw createError({ statusCode: 404, statusMessage: 'Request not found' })

  const update: Record<string, unknown> = {}
  const changes: Parameters<typeof logEvent>[1][] = []

  if (body.status !== undefined && body.status !== current.status) {
    update.status = body.status
    changes.push({ requestId: id, actor: staff.email, type: 'status_changed', fromValue: current.status, toValue: body.status })
  }

  if (body.vendorId !== undefined && body.vendorId !== current.vendor_id) {
    let vendorName: string | null = null
    if (body.vendorId) {
      const { data: vendor } = await db.from('vendors').select('name, active').eq('id', body.vendorId).maybeSingle()
      if (!vendor?.active) throw createError({ statusCode: 400, statusMessage: 'Unknown or inactive vendor' })
      vendorName = vendor.name
    }
    update.vendor_id = body.vendorId
    changes.push({ requestId: id, actor: staff.email, type: 'assigned', fromValue: (current.vendors as any)?.name ?? null, toValue: vendorName })
  }

  if (!changes.length) return { ok: true }

  const { error } = await db.from('requests').update(update).eq('id', id)
  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not update request' })
  for (const change of changes) await logEvent(event, change)
  return { ok: true }
})
