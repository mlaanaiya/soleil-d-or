/**
 * Hosting platforms cap request bodies (4.5 MB on Vercel). Large photos are therefore downscaled
 * in the browser before upload: the server still produces every responsive variant from the result.
 */
export const UPLOAD_TARGET_BYTES = 3.8 * 1024 * 1024
const EDGES = [2400, 2000, 1600, 1200]

function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

export async function prepareUpload(file: File, kind: 'photo' | 'cutout'): Promise<File> {
  if (file.size <= UPLOAD_TARGET_BYTES) return file
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return file // Undecodable here (e.g. HEIC): let the server explain.
  }
  try {
    const base = file.name.replace(/\.[a-z0-9]+$/i, '')
    for (const edge of EDGES) {
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(bitmap.width * scale)
      canvas.height = Math.round(bitmap.height * scale)
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      // Cut-outs keep their transparency (WebP, or PNG where WebP encoding is unavailable).
      const blob =
        kind === 'cutout' ? await encode(canvas, 'image/webp', 0.92) : await encode(canvas, 'image/jpeg', 0.9)
      if (blob && blob.size <= UPLOAD_TARGET_BYTES) {
        const ext = blob.type === 'image/jpeg' ? 'jpg' : blob.type.split('/')[1]
        return new File([blob], `${base}.${ext}`, { type: blob.type })
      }
    }
    return file
  } finally {
    bitmap.close()
  }
}
