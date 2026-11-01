import { serverSupabaseServiceRole } from '#supabase/server'

/** Staff: all vendors, active first. */
export default defineEventHandler(async (event) => {
  await requireStaff(event)
  const db = serverSupabaseServiceRole(event)
  const { data, error } = await db.from('vendors').select('id, name, active').order('active', { ascending: false }).order('name')
  if (error) throw serverError('staff/vendors', error, 'Could not load vendors')
  return data as { id: string; name: string; active: boolean }[]
})
