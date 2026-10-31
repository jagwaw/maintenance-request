export const normalizeEmail = (email?: string | null) => email?.trim().toLowerCase() || null

/** Digits only, last 10 (drops a leading country code). */
export const normalizePhone = (phone?: string | null) => phone?.replace(/\D/g, '').slice(-10) || null
