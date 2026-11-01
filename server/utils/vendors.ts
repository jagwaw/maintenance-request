import type { H3Event } from 'h3'
import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'

export const vendorNameSchema = z.string().trim().min(1, 'Name is required').max(100)

/** 409 if another vendor already has this name (case-insensitive). */
export async function assertVendorNameFree(event: H3Event, name: string, exceptId?: string) {
  const db = serverSupabaseServiceRole(event)
  const { data, error } = await db.from('vendors').select('id, name')
  if (error) throw serverError('vendors/name-check', error, 'Could not save vendor')
  const clash = data?.find((v) => v.name.toLowerCase() === name.toLowerCase() && v.id !== exceptId)
  if (clash) throw createError({ statusCode: 409, statusMessage: `"${clash.name}" already exists` })
}
