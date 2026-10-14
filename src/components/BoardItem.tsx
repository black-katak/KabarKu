import { motion } from 'framer-motion'
import { useRef } from 'react'
import type { Item } from '../types'
import { CANVAS_H, CANVAS_W } from '../types'
import Paper from './Paper'
import Polaroid from './Polaroid'
import Sticker from './Sticker'

interface Props {
  item: Item
  index: number
  scale: number
  editable: boolean
  selected: boolean
  fresh: boolean
  onSelect: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
  onCommit: (id: string) => void
}

export default function BoardItem({ item, index, scale, editable, selected, fresh, onSelect, onMove, onCommit }: Props) {
  const drag = useRef<{ px: number; py: number; x: number; y: number; moved: boolean } | null>(null)

  const down = (e: React.PointerEvent) => {
    if (!editable) return
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { px: e.clientX, py: e.clientY, x: item.x, y: item.y, moved: false }
    onSelect(item.id)
  }
  const move = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = (e.clientX - d.px) / scale
    const dy = (e.clientY - d.py) / scale
    if (Math.abs(dx) + Math.abs(dy) > 2) d.moved = true
    const x = Math.max(-item.width / 2, Math.min(CANVAS_W - item.width / 2, d.x + dx))
    const y = Math.max(-item.height / 2, Math.min(CANVAS_H - item.height / 2, d.y + dy))
    onMove(item.id, x, y)
  }
  const up = () => {
    const d = drag.current
    drag.current = null
    if (d?.moved) onCommit(item.id)
  }

  const height = item.type === 'photo' ? item.width * 1.2 : item.height

  return (
    <div
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      style={{
        position: 'absolute',
        left: item.x,
        top: item.y,
        width: item.width,
        height,
        zIndex: item.z,
        touchAction: editable ? 'none' : 'auto',
        cursor: editable ? 'grab' : 'default',
      }}
    >
      <motion.div
        className={selected ? 'item-selected' : ''}
        style={{ width: '100%', height: '100%', transformOrigin: '50% 8%' }}
        initial={fresh ? { y: -700, opacity: 0, rotate: item.rotation + 40 } : false}
        animate={{ y: 0, opacity: 1, rotate: item.rotation }}
        transition={{ type: 'spring', stiffness: 70, damping: 11, delay: fresh ? 0.15 + index * 0.12 : 0 }}
        whileHover={editable ? undefined : { rotate: item.rotation + 3, scale: 1.04, transition: { type: 'spring', stiffness: 300 } }}
      >
        {item.type === 'note' && <Paper item={item} />}
        {item.type === 'photo' && <Polaroid item={item} fresh={fresh} />}
        {item.type === 'sticker' && <Sticker item={item} />}
      </motion.div>
    </div>
  )
}
