import { serverSupabaseServiceRole } from '#supabase/server'

/** Public: property names and unit labels only — nothing about who lives there. */
export default defineEventHandler(async (event) => {
  const db = serverSupabaseServiceRole(event)
  const { data, error } = await db
    .from('properties')
    .select('id, name, units(id, label)')
    .order('name')
    .order('label', { referencedTable: 'units' })
  if (error) throw serverError('properties', error, 'Could not load properties')
  return data
})
