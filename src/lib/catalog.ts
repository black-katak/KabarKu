import type { PaperStyle } from '../types'

export const PAPERS: { key: PaperStyle; label: string }[] = [
  { key: 'postit', label: 'Post-it' },
  { key: 'lined', label: 'Bergaris' },
  { key: 'grid', label: 'Kotak-kotak' },
  { key: 'spiral', label: 'Spiral' },
  { key: 'folded', label: 'Lipat' },
  { key: 'postcard', label: 'Kartu pos' },
  { key: 'tag', label: 'Label' },
  { key: 'crumpled', label: 'Lusuh' },
]

export const COLORS = ['#fff176', '#ffab91', '#f8bbd0', '#b3e5fc', '#c8e6c9', '#e1bee7', '#ffe0b2', '#fffdf5']

export const SIZES: { key: string; label: string; w: number; h: number }[] = [
  { key: 's', label: 'Kecil', w: 160, h: 160 },
  { key: 'm', label: 'Sedang', w: 220, h: 220 },
  { key: 'l', label: 'Besar', w: 300, h: 280 },
]

export const STICKERS = [
  '❤️', '💖', '⭐', '🌟', '🌸', '🌻', '🎂', '🎈', '🎁', '🎉', '📷', '🎵',
  '🐱', '🐶', '🦋', '🌈', '☀️', '🌙', '🍓', '🍰', '🧸', '💌', '✨', '🔥',
  '😍', '🥰', '😂', '🥳', '👑', '🍀', '☁️', '🎀',
]

export const TAPES = ['#f48fb1', '#81d4fa', '#aed581', '#ffd54f', '#ce93d8']

export const randomRotation = (spread = 8) => Math.round((Math.random() * 2 - 1) * spread * 10) / 10
