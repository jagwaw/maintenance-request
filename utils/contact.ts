/**
 * Field rules, shared by the forms (auto-imported) and the server
 * (imported in server/utils/validation.ts) so both always agree.
 * Each returns an error message, or '' when the value is valid or empty.
 */
const EMAIL = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i
const PHONE_CHARS = /^\+?[\d ().-]+$/
// Optional country code 1. The area code and the next three digits can't start with 0 or 1.
const US_CANADA_PHONE = /^1?[2-9]\d{2}[2-9]\d{6}$/
const HAS_LETTER = /\p{L}/u
const HAS_LETTER_OR_NUMBER = /[\p{L}\p{N}]/u
// Letters from any language. The curly ’ is what iPhones type for an apostrophe.
const NAME_CHAR = /[\p{L}\p{M} '’.,&-]/u
// Letters, numbers and everyday punctuation. No emoji or code-like symbols such as < > { } [ ].
const TEXT_CHAR = /[\p{L}\p{M}\p{N}\s.,!?'’"“”()\/:;&#%+@°$_…–—-]/u

/** The characters in value that aren't allowed, each listed once. */
function notAllowed(value: string, allowed: RegExp) {
  return [...new Set([...value].filter((c) => !allowed.test(c)))].join(' ')
}

/**
 * Used while typing, so a character that isn't allowed never appears.
 * Only for phone and email: they're plain keyboard characters. Names and free text
 * show an error instead, because removing text mid-word breaks some phone keyboards.
 */
export const cleanPhone = (value: string) => value.replace(/[^\d ().+-]/g, '').replace(/(?!^)\+/g, '')
export const cleanEmail = (value: string) => value.replace(/[^a-zA-Z0-9._%+@-]/g, '')

export function nameError(name: string) {
  const value = name.trim()
  if (!value) return ''
  const bad = notAllowed(value, NAME_CHAR)
  if (bad) return `Names can't include: ${bad}`
  return HAS_LETTER.test(value) ? '' : 'Enter a name using letters.'
}

export function textError(text: string) {
  const value = text.trim()
  if (!value) return ''
  const bad = notAllowed(value, TEXT_CHAR)
  if (bad) return `Please remove: ${bad}`
  return HAS_LETTER_OR_NUMBER.test(value) ? '' : 'Please use words or numbers.'
}

export function emailError(email: string) {
  const value = email.trim()
  if (!value) return ''
  return value.length <= 254 && EMAIL.test(value) ? '' : 'Enter a valid email, like name@example.com.'
}

export function phoneError(phone: string) {
  const value = phone.trim()
  if (!value) return ''
  if (!PHONE_CHARS.test(value)) return 'Use only numbers, spaces and ( ) - . with an optional + at the start.'
  const digits = value.replace(/\D/g, '')
  const foreign = value.startsWith('+') && !digits.startsWith('1')
  return !foreign && US_CANADA_PHONE.test(digits) ? '' : 'Enter a 10-digit US or Canada number, like (949) 201-4471.'
}
