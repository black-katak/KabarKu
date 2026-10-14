import type { Item } from '../types'

export default function Polaroid({ item, fresh }: { item: Item; fresh: boolean }) {
  return (
    <div className="polaroid">
      <div className={`polaroid-photo ${fresh ? 'developing' : ''}`}>
        <img src={item.image_url} alt={item.caption || 'foto'} draggable={false} />
      </div>
      <div className="polaroid-caption">{item.caption}</div>
    </div>
  )
}
