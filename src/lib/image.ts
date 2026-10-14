// Kompres gambar di browser agar hemat penyimpanan gratis.
export async function compressImage(
  file: File,
  opts: { square?: boolean; max?: number; type?: string; quality?: number } = {},
): Promise<Blob> {
  const { square = false, max = 900, type = 'image/jpeg', quality = 0.8 } = opts
  const bmp = await createImageBitmap(file)
  let sx = 0
  let sy = 0
  let sw = bmp.width
  let sh = bmp.height
  if (square) {
    const s = Math.min(sw, sh)
    sx = (sw - s) / 2
    sy = (sh - s) / 2
    sw = sh = s
  }
  const scale = Math.min(1, max / Math.max(sw, sh))
  const w = Math.round(sw * scale)
  const h = Math.round(sh * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(bmp, sx, sy, sw, sh, 0, 0, w, h)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('gagal kompres'))), type, quality),
  )
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}
