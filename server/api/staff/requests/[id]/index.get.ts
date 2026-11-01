import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'

const PHOTO_URL_SECONDS = 10 * 60

/** Staff: one request with photos (short-lived signed URLs) and its full history. */
export default defineEventHandler(async (event) => {
  await requireStaff(event)
  const id = parseOr400(z.uuid(), getRouterParam(event, 'id'))
  const db = serverSupabaseServiceRole(event)

  const { data: r, error } = await db
    .from('requests')
    .select('*, units(label, status, properties(name)), tenants(name), vendors(id, name), request_photos(storage_path, created_at), request_events(id, actor, type, from_value, to_value, note, created_at)')
    .eq('id', id)
    .order('created_at', { referencedTable: 'request_events' })
    .maybeSingle()
  if (error) throw serverError('staff/request', error, 'Could not load request')
  if (!r) throw createError({ statusCode: 404, statusMessage: 'Request not found' })

  // Photos live in a private bucket: hand out links that expire, generated per view.
  const paths = r.request_photos.map((p: { storage_path: string }) => p.storage_path)
  let photoUrls: string[] = []
  if (paths.length) {
    const { data: signed, error: signErr } = await db.storage.from('request-photos').createSignedUrls(paths, PHOTO_URL_SECONDS)
    if (signErr) throw serverError('staff/request/photos', signErr, 'Could not load photos')
    photoUrls = signed.map((s) => s.signedUrl).filter((url): url is string => Boolean(url))
  }

  return {
    id: r.id as string,
    refCode: r.ref_code as string,
    createdAt: r.created_at as string,
    property: r.units.properties.name as string,
    unit: r.units.label as string,
    unitVacant: r.units.status === 'vacant',
    contactName: r.contact_name as string,
    contactEmail: r.contact_email as string | null,
    contactPhone: r.contact_phone as string | null,
    contactVerified: r.contact_verified as boolean,
    tenantName: (r.tenants?.name ?? null) as string | null,
    category: r.category as string,
    details: r.details as Record<string, string>,
    description: r.description as string,
    permissionToEnter: r.permission_to_enter as boolean,
    pets: r.pets as string | null,
    bestTimes: r.best_times as string | null,
    source: r.source as string,
    status: r.status as string,
    vendorId: (r.vendors?.id ?? null) as string | null,
    photoUrls,
    events: r.request_events as { id: string; actor: string; type: string; from_value: string | null; to_value: string | null; note: string | null; created_at: string }[],
  }
})
