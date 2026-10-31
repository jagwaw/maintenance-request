import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'

const bodySchema = z.object({ note: z.string().trim().min(1).max(2000) })

/** Staff: add a note. Notes are history events, so they appear in the timeline. */
export default defineEventHandler(async (event) => {
  const staff = await requireStaff(event)
  const id = parseOr400(z.uuid(), getRouterParam(event, 'id'))
  const { note } = parseOr400(bodySchema, await readBody(event))

  const db = serverSupabaseServiceRole(event)
  const { data: exists } = await db.from('requests').select('id').eq('id', id).maybeSingle()
  if (!exists) throw createError({ statusCode: 404, statusMessage: 'Request not found' })

  await logEvent(event, { requestId: id, actor: staff.email, type: 'note_added', note })
  return { ok: true }
})
