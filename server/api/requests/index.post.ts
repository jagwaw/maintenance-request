/**
 * Public: a tenant submits a request. Returns only the reference code, and the
 * response is the same whether or not the contact matched a tenant.
 */
export default defineEventHandler(async (event) => {
  const { data, photos } = await readRequestBody(event)

  // Honeypot: real people never fill the hidden "website" field. Pretend it worked.
  if (data && typeof data === 'object' && 'website' in data && data.website) return { refCode: generateRefCode() }

  const input = parseOr400(requestFieldsSchema, data)
  const { refCode } = await createRequest(event, input, photos, { actor: 'tenant', source: 'form' })
  return { refCode }
})
