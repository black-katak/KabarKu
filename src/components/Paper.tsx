import type { Item } from '../types'
import { TAPES } from '../lib/catalog'

// Hiasan atas (pita atau paku) dipilih tetap dari id supaya tidak berubah tiap render.
function hash(s: string) {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

export default function Paper({ item }: { item: Item }) {
  const h = hash(item.id)
  const deco = h % 3 // 0 pita, 1 paku, 2 kosong
  const tape = TAPES[h % TAPES.length]
  const noTop = item.paper === 'spiral' || item.paper === 'tag'
  return (
    <div className={`paper paper-${item.paper}`} style={{ ['--paper-color' as string]: item.color }}>
      {!noTop && deco === 0 && <div className="washi" style={{ ['--tape' as string]: tape }} />}
      {!noTop && deco === 1 && <div className="pin" />}
      <div className="paper-text" style={{ fontSize: item.width < 190 ? '1rem' : item.width > 260 ? '1.35rem' : '1.15rem' }}>
        {item.content}
      </div>
    </div>
  )
}
