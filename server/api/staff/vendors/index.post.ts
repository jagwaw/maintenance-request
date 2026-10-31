import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'

const bodySchema = z.object({ name: vendorNameSchema })

/** Staff: add a vendor. */
export default defineEventHandler(async (event) => {
  await requireStaff(event)
  const { name } = parseOr400(bodySchema, await readBody(event))
  await assertVendorNameFree(event, name)

  const db = serverSupabaseServiceRole(event)
  const { data, error } = await db.from('vendors').insert({ name }).select('id, name, active').single()
  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not add vendor' })
  return data
})
