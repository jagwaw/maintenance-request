import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'
import type { MultiPartData } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { MAX_PHOTOS } from '~~/config/maintenance'

/** Split a multipart body into the JSON "data" part and validated photo parts. */
export async function readRequestBody(event: H3Event) {
  const parts = (await readMultipartFormData(event)) ?? []
  const dataPart = parts.find((p) => p.name === 'data')
  let data: unknown
  try {
    data = JSON.parse(dataPart?.data.toString('utf8') ?? '')
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  }

  const photos = parts.filter((p) => p.name === 'photos')
  if (photos.length > MAX_PHOTOS) throw createError({ statusCode: 400, statusMessage: `At most ${MAX_PHOTOS} photos` })
  if (!photos.every((p) => isAllowedImage(p.type, p.data)))
    throw createError({ statusCode: 400, statusMessage: 'Photos must be JPEG, PNG or WebP images under 2 MB' })

  return { data, photos }
}

/**
 * Create a request: match the contact to a tenant on the unit, upload photos,
 * insert the request and log the "created" event. Returns the reference code.
 */
export async function createRequest(
  event: H3Event,
  input: RequestFields,
  photos: MultiPartData[],
  opts: { actor: string; source: string; createdByStaffId?: string },
) {
  const db = serverSupabaseServiceRole(event)

  const { data: unit } = await db.from('units').select('id').eq('id', input.unitId).maybeSingle()
  if (!unit) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  // Contact matching: email OR phone matches any tenant on this unit.
  const email = normalizeEmail(input.contactEmail)
  const phone = normalizePhone(input.contactPhone)
  const { data: tenants, error: tErr } = await db.from('tenants').select('id, email, phone_digits').eq('unit_id', unit.id)
  if (tErr) throw createError({ statusCode: 500, statusMessage: 'Could not save request' })
  const match = tenants.find((t) => (email && t.email === email) || (phone && t.phone_digits?.slice(-10) === phone))

  // Upload photos first so a failed upload doesn't leave a request without its photos.
  const requestId = randomUUID()
  const paths: string[] = []
  for (const photo of photos) {
    const path = `${requestId}/${randomUUID()}.${photoExtension(photo.type!)}`
    const { error } = await db.storage.from('request-photos').upload(path, photo.data, { contentType: photo.type })
    if (error) throw createError({ statusCode: 500, statusMessage: 'Could not upload photos' })
    paths.push(path)
  }

  // Retry on the (very unlikely) chance of a duplicate reference code.
  let refCode = ''
  for (let attempt = 0; attempt < 5 && !refCode; attempt++) {
    const candidate = generateRefCode()
    const { error } = await db.from('requests').insert({
      id: requestId,
      ref_code: candidate,
      unit_id: unit.id,
      tenant_id: match?.id ?? null,
      contact_name: input.contactName,
      contact_email: email,
      contact_phone: input.contactPhone || null,
      contact_verified: Boolean(match),
      category: input.category,
      details: input.details,
      description: input.description,
      permission_to_enter: input.permissionToEnter,
      pets: input.pets,
      best_times: input.bestTimes,
      source: opts.source,
      created_by_staff_id: opts.createdByStaffId ?? null,
    })
    if (!error) refCode = candidate
    else if (error.code !== '23505') throw createError({ statusCode: 500, statusMessage: 'Could not save request' })
  }
  if (!refCode) throw createError({ statusCode: 500, statusMessage: 'Could not save request' })

  if (paths.length) {
    const { error } = await db.from('request_photos').insert(paths.map((storage_path) => ({ request_id: requestId, storage_path })))
    if (error) throw createError({ statusCode: 500, statusMessage: 'Could not save photos' })
  }

  await logEvent(event, { requestId, actor: opts.actor, type: 'created', toValue: 'new' })
  return { id: requestId, refCode }
}
