import type { Item } from '../types'

export default function Sticker({ item }: { item: Item }) {
  if (item.image_url) {
    return (
      <img
        src={item.image_url}
        alt="stiker"
        draggable={false}
        className="w-full h-full object-contain pointer-events-none select-none"
        style={{ filter: 'drop-shadow(0 0 0 #fff) drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 3px 4px rgba(0,0,0,.35))' }}
      />
    )
  }
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span className="sticker" style={{ fontSize: item.width * 0.8 }}>
        {item.sticker}
      </span>
    </div>
  )
}
