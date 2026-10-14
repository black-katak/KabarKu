import { useCallback, useEffect, useRef, useState } from 'react'
import { cropLimits, cropToBlob, drawCrop } from '../lib/image'
import type { CropState } from '../lib/image'
import Modal from './Modal'

interface Props {
  file: File
  title?: string
  outSize: number // sisi hasil akhir dalam piksel
  quality: number
  onCancel: () => void
  onDone: (blob: Blob) => void
}

const VIEW = 300 // sisi bingkai pratinjau (piksel CSS)
const ZMIN = 1
const ZMAX = 4

export default function CropModal({ file, title = 'Atur potongan foto', outSize, quality, onCancel, onDone }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [bmp, setBmp] = useState<ImageBitmap | null>(null)
  const [crop, setCrop] = useState<CropState>({ zoom: 1, ox: 0, oy: 0, rot: 0 })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ dist: number; zoom: number } | null>(null)

  useEffect(() => {
    let alive = true
    createImageBitmap(file)
      .then((b) => alive && setBmp(b))
      .catch(() => alive && setErr('Foto tidak bisa dibuka. Coba foto lain.'))
    return () => {
      alive = false
    }
  }, [file])

  // Jaga agar foto selalu menutupi bingkai.
  const clamp = useCallback(
    (c: CropState): CropState => {
      if (!bmp) return c
      const zoom = Math.min(ZMAX, Math.max(ZMIN, c.zoom))
      const lim = cropLimits(bmp, { ...c, zoom })
      return { ...c, zoom, ox: Math.min(lim.x, Math.max(-lim.x, c.ox)), oy: Math.min(lim.y, Math.max(-lim.y, c.oy)) }
    },
    [bmp],
  )

  useEffect(() => {
    const el = canvas.current
    if (!el || !bmp) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    el.width = VIEW * dpr
    el.height = VIEW * dpr
    drawCrop(el.getContext('2d')!, bmp, crop, VIEW * dpr)
  }, [bmp, crop])

  // Roda mouse untuk zoom. Harus pendengar non-pasif agar halaman tidak ikut bergulir.
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setCrop((c) => clamp({ ...c, zoom: c.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08) }))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [clamp])

  const down = (e: React.PointerEvent) => {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: crop.zoom }
    }
  }
  const move = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      const base = pinch.current
      setCrop((c) => clamp({ ...c, zoom: base.zoom * (d / base.dist) }))
    } else if (pointers.current.size === 1) {
      const dx = (e.clientX - prev.x) / VIEW
      const dy = (e.clientY - prev.y) / VIEW
      setCrop((c) => clamp({ ...c, ox: c.ox + dx, oy: c.oy + dy }))
    }
  }
  const up = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
  }

  const key = (e: React.KeyboardEvent) => {
    const s = 0.03
    const m: Record<string, [number, number]> = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] }
    if (m[e.key]) {
      e.preventDefault()
      setCrop((c) => clamp({ ...c, ox: c.ox + m[e.key][0], oy: c.oy + m[e.key][1] }))
    } else if (e.key === '+' || e.key === '=') setCrop((c) => clamp({ ...c, zoom: c.zoom * 1.1 }))
    else if (e.key === '-') setCrop((c) => clamp({ ...c, zoom: c.zoom / 1.1 }))
  }

  const confirm = async () => {
    if (!bmp) return
    setBusy(true)
    try {
      onDone(await cropToBlob(bmp, crop, outSize, quality))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal memproses foto')
      setBusy(false)
    }
  }

  return (
    <Modal title={title} onClose={onCancel}>
      <p className="mb-2 text-sm">Geser foto untuk memilih bagian yang tampil. Atur zoom dengan slider, roda mouse, atau cubit dua jari.</p>
      <div className="mx-auto" style={{ width: VIEW, maxWidth: '100%' }}>
        <canvas
          ref={canvas}
          role="img"
          aria-label="Pratinjau potongan foto. Panah untuk menggeser, plus dan minus untuk zoom."
          tabIndex={0}
          onKeyDown={key}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          style={{ width: VIEW, height: VIEW, maxWidth: '100%', touchAction: 'none', cursor: 'grab' }}
          className="block rounded-sm bg-stone-900 shadow-inner outline-offset-2"
        />
      </div>
      {!bmp && !err && <p className="mt-2 text-center text-sm font-bold">Membuka foto...</p>}
      <div className="mt-3 flex items-center gap-3">
        <span aria-hidden>🔍</span>
        <input
          type="range"
          min={ZMIN}
          max={ZMAX}
          step={0.01}
          value={crop.zoom}
          aria-label="Zoom"
          className="flex-1"
          onChange={(e) => setCrop((c) => clamp({ ...c, zoom: Number(e.target.value) }))}
        />
        <button
          className="btn !text-sm"
          aria-label="Putar 90 derajat"
          onClick={() => setCrop((c) => clamp({ ...c, rot: ((c.rot + 1) % 4) as CropState['rot'], ox: 0, oy: 0 }))}
        >
          ⟳ Putar
        </button>
      </div>
      {err && <p className="mt-2 text-sm font-bold text-red-700">{err}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn" onClick={onCancel}>
          Batal
        </button>
        <button className="btn !bg-amber-300 disabled:opacity-50" disabled={!bmp || busy} onClick={confirm}>
          {busy ? 'Memproses...' : 'Pakai foto ini'}
        </button>
      </div>
    </Modal>
  )
}
