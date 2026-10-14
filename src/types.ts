export type ItemType = 'note' | 'photo' | 'sticker'

export type PaperStyle =
  | 'postit'
  | 'lined'
  | 'grid'
  | 'spiral'
  | 'folded'
  | 'postcard'
  | 'tag'
  | 'crumpled'

export interface Item {
  id: string
  type: ItemType
  content: string
  caption: string
  color: string
  paper: PaperStyle
  width: number
  height: number
  sticker: string
  image_url: string
  x: number
  y: number
  rotation: number
  z: number
}

export interface Board {
  title: string
  cover_message: string
  music_url: string
  cover_image?: string
  view_token: string
  edit_token?: string
}

export type Role = 'view' | 'edit'

export interface LoadedBoard {
  board: Board
  items: Item[]
  role: Role
}

export const CANVAS_W = 1200
export const CANVAS_H = 800
