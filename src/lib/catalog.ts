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

export const MAX_SONG_MB = 20
export const SONG_EXTS = ['mp3', 'm4a', 'aac', 'ogg', 'opus', 'wav', 'webm']

// Jenis berkas yang dikirim ke penyimpanan. Dipakai agar browser yang melaporkan jenis aneh tetap diterima.
export const MIME_BY_EXT: Record<string, string> = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
  opus: 'audio/ogg',
  oga: 'audio/ogg',
  wav: 'audio/wav',
  webm: 'audio/webm',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

// Ubah pesan galat unggah menjadi kalimat yang jelas.
export function friendlyUploadError(raw: string): string {
  const m = raw.toLowerCase()
  if (m.includes('exceed') || m.includes('too large') || m.includes('maximum allowed size') || m.includes('payload'))
    return `Berkas terlalu besar. Lagu maksimal ${MAX_SONG_MB} MB.`
  if (m.includes('mime') || m.includes('not supported') || m.includes('invalid file'))
    return 'Jenis berkas tidak didukung. Pakai mp3, m4a, aac, ogg, wav, atau webm.'
  if (m.includes('failed to fetch') || m.includes('network') || m.includes('load failed'))
    return 'Koneksi gagal. Periksa internet Anda lalu coba lagi.'
  if (m.includes('row-level security') || m.includes('unauthorized') || m.includes('policy'))
    return 'Unggahan ditolak oleh penyimpanan. Hubungi pemilik aplikasi.'
  return raw
}
