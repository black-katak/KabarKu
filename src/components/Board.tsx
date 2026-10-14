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

export default function Board({ items, editable, selectedId, freshIds, onSelect, onMove, onCommit }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const update = () => setScale(Math.min(1.4, el.clientWidth / CANVAS_W))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={wrap} className="w-full">
      <div
        className="cork frame relative overflow-hidden mx-auto"
        style={{ width: CANVAS_W * scale + 28, height: CANVAS_H * scale + 28, maxWidth: '100%', boxSizing: 'border-box' }}
        onPointerDown={() => onSelect(null)}
      >
        <div style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})`, transformOrigin: '0 0', position: 'relative' }}>
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
  )
}
