import { useState } from 'react'
import type { Item, ItemType, PaperStyle } from '../types'
import { COLORS, PAPERS, SIZES, STICKERS, randomRotation } from '../lib/catalog'
import { compressImage } from '../lib/image'
import { newId, store } from '../lib/store'
import { CANVAS_H, CANVAS_W } from '../types'
import type { Viewport } from './Board'
import Modal from './Modal'
import Paper from './Paper'

interface Props {
  type: ItemType
  item?: Item
  topZ: number
  area: Viewport // area papan yang sedang terlihat
  onSave: (item: Item) => void
  onClose: () => void
}

// Taruh item acak di dalam area yang terlihat, dengan sisa jarak 20px dari tepi.
function place(start: number, span: number, size: number, max: number) {
  const lo = Math.max(0, start + 20)
  const hi = Math.min(max - size, start + span - size - 20)
  return Math.round(hi > lo ? lo + Math.random() * (hi - lo) : Math.max(0, Math.min(max - size, start)))
}

function blank(type: ItemType, z: number, area: Viewport): Item {
  const w = type === 'photo' ? 230 : type === 'sticker' ? 110 : 220
  return {
    id: newId(),
    type,
    content: '',
    caption: '',
    color: COLORS[0],
    paper: 'postit',
    width: w,
    height: type === 'photo' ? w * 1.2 : type === 'sticker' ? 110 : 220,
    sticker: '',
    image_url: '',
    x: place(area.x, area.w, w, CANVAS_W),
    y: place(area.y, area.h, type === 'photo' ? w * 1.2 : w, CANVAS_H),
    rotation: randomRotation(type === 'sticker' ? 20 : 7),
    z,
  }
}

export default function Composer({ type, item, topZ, area, onSave, onClose }: Props) {
  const [it, setIt] = useState<Item>(() => item ?? blank(type, topZ + 1, area))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (p: Partial<Item>) => setIt((o) => ({ ...o, ...p }))
  const isNew = !item

  const pickFile = async (file: File | undefined, mode: 'photo' | 'sticker') => {
    if (!file) return
    setBusy(true)
    setErr('')
    try {
      const local = store.mode === 'local'
      const blob =
        mode === 'photo'
          ? await compressImage(file, { square: true, max: local ? 520 : 900, quality: local ? 0.7 : 0.8 })
          : await compressImage(file, { max: local ? 220 : 400, type: 'image/png' })
      const url = await store.upload(blob, mode === 'photo' ? 'jpg' : 'png')
      set({ image_url: url, sticker: '' })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal mengunggah gambar')
    } finally {
      setBusy(false)
    }
  }

  const canSave =
    !busy &&
    ((it.type === 'note' && it.content.trim()) ||
      (it.type === 'photo' && it.image_url) ||
      (it.type === 'sticker' && (it.sticker || it.image_url)))

  const title = { note: 'Tulis catatan', photo: 'Tempel foto', sticker: 'Pilih stiker' }[it.type]

  return (
    <Modal title={isNew ? title : 'Ubah'} onClose={onClose}>
      {it.type === 'note' && (
        <div className="space-y-3">
          <textarea
            className="field font-note text-lg"
            rows={4}
            maxLength={300}
            placeholder="Tulis pesan di sini..."
            value={it.content}
            onChange={(e) => set({ content: e.target.value })}
            autoFocus
          />
          <div>
            <p className="mb-1 text-sm font-bold">Bentuk kertas</p>
            <div className="grid grid-cols-4 gap-2">
              {PAPERS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => set({ paper: p.key as PaperStyle })}
                  className={`rounded-lg border-2 p-1 text-xs font-bold ${it.paper === p.key ? 'border-amber-700 bg-amber-100' : 'border-transparent bg-white/60'}`}
                >
                  <div className="mx-auto h-12 w-12">
                    <Paper item={{ ...it, paper: p.key as PaperStyle, content: 'Aa', width: 160 }} />
                  </div>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm font-bold">Warna</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  aria-label={c}
                  onClick={() => set({ color: c })}
                  className={`h-8 w-8 rounded-full border-2 ${it.color === c ? 'border-amber-900 scale-110' : 'border-white'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm font-bold">Ukuran</p>
            <div className="flex gap-2">
              {SIZES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => set({ width: s.w, height: s.h })}
                  className={`btn !text-sm ${it.width === s.w ? '!bg-amber-300' : ''}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {it.type === 'photo' && (
        <div className="space-y-3">
          <label className="block cursor-pointer rounded-xl border-2 border-dashed border-amber-700/50 bg-white/50 p-4 text-center font-bold">
            {it.image_url ? (
              <img src={it.image_url} alt="pratinjau" className="mx-auto h-40 w-40 rounded object-cover" />
            ) : (
              'Pilih foto dari galeri atau kamera'
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0], 'photo')} />
          </label>
          <input
            className="field font-hand text-xl"
            maxLength={40}
            placeholder="Tulisan di bawah foto (opsional)"
            value={it.caption}
            onChange={(e) => set({ caption: e.target.value })}
          />
          <div>
            <p className="mb-1 text-sm font-bold">Ukuran</p>
            <div className="flex gap-2">
              {[190, 240, 300].map((w, i) => (
                <button
                  key={w}
                  onClick={() => set({ width: w })}
                  className={`btn !text-sm ${it.width === w ? '!bg-amber-300' : ''}`}
                >
                  {['Kecil', 'Sedang', 'Besar'][i]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {it.type === 'sticker' && (
        <div className="space-y-3">
          <div className="grid grid-cols-8 gap-1">
            {STICKERS.map((s) => (
              <button
                key={s}
                onClick={() => set({ sticker: s, image_url: '' })}
                className={`rounded-lg p-1 text-2xl ${it.sticker === s ? 'bg-amber-300' : 'bg-white/60'}`}
              >
                {s}
              </button>
            ))}
          </div>
          <label className="btn inline-block !text-sm">
            Unggah stiker sendiri (PNG)
            <input type="file" accept="image/png,image/webp,image/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0], 'sticker')} />
          </label>
          {it.image_url && <img src={it.image_url} alt="stiker" className="h-16 w-16 object-contain" />}
        </div>
      )}

      {busy && <p className="mt-2 text-sm font-bold">Memproses gambar...</p>}
      {err && <p className="mt-2 text-sm font-bold text-red-700">{err}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn" onClick={onClose}>
          Batal
        </button>
        <button className="btn !bg-amber-300 disabled:opacity-50" disabled={!canSave} onClick={() => onSave(it)}>
          {isNew ? 'Tempel ke papan' : 'Simpan'}
        </button>
      </div>
    </Modal>
  )
}
