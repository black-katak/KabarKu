import { createClient } from '@supabase/supabase-js'
import type { Board, Item, LoadedBoard } from '../types'
import { blobToDataUrl } from './image'

export interface Tokens {
  viewToken: string
  editToken: string
}

export interface BoardStore {
  readonly mode: 'local' | 'cloud'
  createBoard(title: string, coverMessage: string): Promise<Tokens>
  loadBoard(token: string): Promise<LoadedBoard | null>
  saveItem(editToken: string, item: Item): Promise<void>
  deleteItem(editToken: string, id: string): Promise<void>
  updateBoard(editToken: string, patch: Partial<Pick<Board, 'title' | 'cover_message' | 'music_url'>>): Promise<void>
  upload(file: Blob, ext: string): Promise<string>
}

const rand = (n = 24) =>
  Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, '0')).join('')

/* ---------- Mode lokal: data tersimpan di browser ini saja ---------- */

interface LocalBoard extends Board {
  edit_token: string
  items: Item[]
}

const LS_KEY = 'kabarku:boards'

function readAll(): LocalBoard[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  } catch {
    return []
  }
}

function writeAll(boards: LocalBoard[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(boards))
  } catch {
    throw new Error('Penyimpanan browser penuh. Hapus beberapa item atau pakai mode Supabase.')
  }
}

const localStore: BoardStore = {
  mode: 'local',
  async createBoard(title, cover_message) {
    const b: LocalBoard = {
      title,
      cover_message,
      music_url: '',
      view_token: rand(),
      edit_token: rand(),
      items: [],
    }
    writeAll([...readAll(), b])
    return { viewToken: b.view_token, editToken: b.edit_token }
  },
  async loadBoard(token) {
    const b = readAll().find((x) => x.view_token === token || x.edit_token === token)
    if (!b) return null
    const role = b.edit_token === token ? 'edit' : 'view'
    const { items, edit_token, ...board } = b
    return { board: role === 'edit' ? { ...board, edit_token } : board, items, role }
  },
  async saveItem(editToken, item) {
    const all = readAll()
    const b = all.find((x) => x.edit_token === editToken)
    if (!b) throw new Error('Token tidak valid')
    const i = b.items.findIndex((x) => x.id === item.id)
    if (i >= 0) b.items[i] = item
    else b.items.push(item)
    writeAll(all)
  },
  async deleteItem(editToken, id) {
    const all = readAll()
    const b = all.find((x) => x.edit_token === editToken)
    if (!b) throw new Error('Token tidak valid')
    b.items = b.items.filter((x) => x.id !== id)
    writeAll(all)
  },
  async updateBoard(editToken, patch) {
    const all = readAll()
    const b = all.find((x) => x.edit_token === editToken)
    if (!b) throw new Error('Token tidak valid')
    Object.assign(b, patch)
    writeAll(all)
  },
  async upload(file) {
    return blobToDataUrl(file)
  },
}

/* ---------- Mode cloud: Supabase (paket gratis) ---------- */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

function makeCloudStore(supaUrl: string, supaKey: string): BoardStore {
  const sb = createClient(supaUrl, supaKey, { auth: { persistSession: false } })
  const BUCKET = 'boards-media'
  const rpc = async <T,>(fn: string, args: Record<string, unknown>) => {
    const { data, error } = await sb.rpc(fn, args)
    if (error) throw new Error(error.message)
    return data as T
  }
  return {
    mode: 'cloud',
    async createBoard(title, cover_message) {
      const r = await rpc<{ view_token: string; edit_token: string }>('create_board', {
        p_title: title,
        p_cover: cover_message,
      })
      return { viewToken: r.view_token, editToken: r.edit_token }
    },
    async loadBoard(token) {
      const r = await rpc<LoadedBoard | null>('get_board', { p_token: token })
      return r ?? null
    },
    async saveItem(editToken, item) {
      await rpc('save_item', { p_edit_token: editToken, p_item: item })
    },
    async deleteItem(editToken, id) {
      await rpc('delete_item', { p_edit_token: editToken, p_id: id })
    },
    async updateBoard(editToken, patch) {
      await rpc('update_board', { p_edit_token: editToken, p_patch: patch })
    },
    async upload(file, ext) {
      const path = `${rand(16)}.${ext}`
      const { error } = await sb.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || undefined,
        cacheControl: '31536000',
      })
      if (error) throw new Error(error.message)
      return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
    },
  }
}

export const store: BoardStore = url && key ? makeCloudStore(url, key) : localStore
export const newId = () => rand(8)
