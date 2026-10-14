import { useEffect, useRef, useState } from 'react'
import type { Item } from '../types'
import { CANVAS_H, CANVAS_W } from '../types'
import BoardItem from './BoardItem'

interface Props {
  items: Item[]
  editable: boolean
  selectedId: string | null
  freshIds: Set<string>
  onSelect: (id: string | null) => void
  onMove: (id: string, x: number, y: number) => void
  onCommit: (id: string) => void
}

const NARROW = 700 // di bawah lebar ini dianggap ponsel
const READ_SCALE = 0.6 // skala baca di ponsel (papan digeser dengan jari)
const CHROME = 28 // bingkai kayu kiri+kanan / atas+bawah
const RESERVED_H = 220 // tinggi judul + toolbar bawah di layar lebar

export default function Board({ items, editable, selectedId, freshIds, onSelect, onMove, onCommit }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 1250, vh: 800 })
  const [fitAll, setFitAll] = useState(false)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const update = () => setSize({ w: el.clientWidth, vh: window.innerHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  const narrow = size.w < NARROW
  const inner = size.w - CHROME
  let scale: number
  if (narrow) {
    scale = fitAll ? inner / CANVAS_W : READ_SCALE
  } else {
    // Laptop: seluruh papan harus muat di satu layar (lebar dan tinggi).
    const byH = (size.vh - RESERVED_H - CHROME) / CANVAS_H
    scale = Math.max(0.5, Math.min(1.4, inner / CANVAS_W, byH))
  }

  const contentW = CANVAS_W * scale
  const contentH = CANVAS_H * scale
  const frameW = narrow ? size.w : Math.min(size.w, contentW + CHROME)
  const frameH = narrow ? Math.min(contentH, size.vh - RESERVED_H - CHROME) + CHROME : contentH + CHROME

  return (
    <div ref={wrap} className="w-full">
      <div
        className="cork frame relative mx-auto"
        style={{ width: frameW, height: frameH, boxSizing: 'border-box' }}
        onPointerDown={() => onSelect(null)}
      >
        <div
          className="h-full w-full overflow-auto"
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
        >
          <div style={{ width: contentW, height: contentH, position: 'relative' }}>
            <div style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})`, transformOrigin: '0 0', position: 'absolute', top: 0, left: 0 }}>
              {items.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center font-hand text-4xl text-amber-950/50 select-none">
                  Papan masih kosong. Tempel sesuatu!
                </div>
              )}
              {items.map((it, i) => (
                <BoardItem
                  key={it.id}
                  item={it}
                  index={i}
                  scale={scale}
                  editable={editable}
                  selected={selectedId === it.id}
                  fresh={freshIds.has(it.id)}
                  onSelect={onSelect}
                  onMove={onMove}
                  onCommit={onCommit}
                />
              ))}
            </div>
          </div>
        </div>
        {narrow && (
          <button
            className="btn absolute right-2 top-2 z-10 !px-3 !py-1 !text-xs"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setFitAll((v) => !v)}
          >
            {fitAll ? '🔍 Perbesar' : '🗺 Lihat semua'}
          </button>
        )}
      </div>
    </div>
  )
}
