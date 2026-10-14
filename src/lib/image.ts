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

export interface CropState {
  zoom: number // 1 = pas menutupi bingkai
  ox: number // geser horizontal, satuan: bagian dari lebar bingkai (-0.5 sampai 0.5 kira-kira)
  oy: number
  rot: 0 | 1 | 2 | 3 // putaran 90 derajat searah jarum jam
}

export function rotatedSize(bmp: ImageBitmap, rot: number) {
  return rot % 2 === 0 ? { w: bmp.width, h: bmp.height } : { w: bmp.height, h: bmp.width }
}

// Batas geser supaya foto selalu menutupi seluruh bingkai. Nilai dalam bagian dari ukuran bingkai.
export function cropLimits(bmp: ImageBitmap, c: CropState) {
  const { w, h } = rotatedSize(bmp, c.rot)
  const cover = 1 / Math.min(w, h) // skala agar sisi terpendek = 1 bingkai
  return { x: Math.max(0, (w * cover * c.zoom - 1) / 2), y: Math.max(0, (h * cover * c.zoom - 1) / 2) }
}

// Satu jalur gambar untuk pratinjau dan hasil akhir, supaya yang terlihat sama dengan yang tersimpan.
export function drawCrop(ctx: CanvasRenderingContext2D, bmp: ImageBitmap, c: CropState, size: number) {
  const { w, h } = rotatedSize(bmp, c.rot)
  const scale = (size / Math.min(w, h)) * c.zoom
  ctx.save()
  ctx.fillStyle = '#1d1d1d'
  ctx.fillRect(0, 0, size, size)
  ctx.translate(size / 2 + c.ox * size, size / 2 + c.oy * size)
  ctx.rotate((c.rot * Math.PI) / 2)
  ctx.scale(scale, scale)
  ctx.drawImage(bmp, -bmp.width / 2, -bmp.height / 2)
  ctx.restore()
}

export function cropToBlob(bmp: ImageBitmap, c: CropState, size: number, quality: number): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  drawCrop(canvas.getContext('2d')!, bmp, c, size)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal memproses foto'))), 'image/jpeg', quality),
  )
}
