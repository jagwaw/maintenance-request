const SIGNATURES: Record<string, (b: Buffer) => boolean> = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
}

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024

/** True if the declared MIME type is an allowed image AND the file's first bytes match it. */
export function isAllowedImage(type: string | undefined, data: Buffer) {
  const check = type ? SIGNATURES[type] : undefined
  return Boolean(check && data.length <= MAX_PHOTO_BYTES && check(data))
}

export const photoExtension = (type: string) => ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' })[type] ?? 'bin'
