import { randomInt } from 'node:crypto'

// No 0/O or 1/I, so codes are easy to read over the phone.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const generateRefCode = () =>
  'MR-' + Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
