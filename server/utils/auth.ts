import type { H3Event } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

/**
 * First line of every /api/staff/** route. Requires a valid Supabase session
 * AND an email listed in the staff table. Returns the staff row.
 */
export async function requireStaff(event: H3Event) {
  const user = await serverSupabaseUser(event).catch(() => null)
  const email = typeof user?.email === 'string' ? user.email.toLowerCase() : null
  if (!email) throw createError({ statusCode: 401, statusMessage: 'Not signed in' })

  const db = serverSupabaseServiceRole(event)
  const { data: staff, error } = await db.from('staff').select('id, email, name').eq('email', email).maybeSingle()
  if (error) throw serverError('requireStaff', error, 'Could not check staff access')
  if (!staff) throw createError({ statusCode: 403, statusMessage: 'Not a staff account' })
  return staff
}
