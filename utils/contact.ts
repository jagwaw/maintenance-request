/**
 * Contact field rules, shared by the form (auto-imported) and the server
 * (imported in server/utils/validation.ts) so both always agree.
 * Each returns an error message, or '' when the value is valid or empty.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/
const PHONE_CHARS = /^[\d\s()+.-]+$/

export function emailError(email: string) {
  const value = email.trim()
  if (!value) return ''
  return EMAIL.test(value) && value.length <= 254 ? '' : 'Enter a valid email, like name@example.com.'
}

export function phoneError(phone: string) {
  const value = phone.trim()
  if (!value) return ''
  if (!PHONE_CHARS.test(value)) return 'Use only numbers, spaces and + ( ) - .'
  const digits = value.replace(/\D/g, '').length
  return digits >= 10 && digits <= 15 ? '' : 'Enter a full phone number (10–15 digits).'
}
