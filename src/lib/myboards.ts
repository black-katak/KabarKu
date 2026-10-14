// Daftar papan yang pernah dibuka dengan tautan edit, disimpan di browser ini.
export interface MyBoard {
  token: string // token edit
  title: string
  ts: number
}

const KEY = 'kabarku:mine'

export function getMine(): MyBoard[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]') as MyBoard[]
    return list.sort((a, b) => b.ts - a.ts)
  } catch {
    return []
  }
}

function write(list: MyBoard[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // Penyimpanan penuh atau diblokir. Daftar tidak tersimpan.
  }
}

export function rememberBoard(token: string, title: string) {
  const rest = getMine().filter((b) => b.token !== token)
  write([{ token, title, ts: Date.now() }, ...rest])
}

export function forgetBoard(token: string) {
  write(getMine().filter((b) => b.token !== token))
}

// Terima tautan penuh (/e/xxx atau /b/xxx) atau token mentah.
export function parseLink(input: string): { path: 'e' | 'b'; token: string } | null {
  const t = input.trim()
  if (!t) return null
  const m = t.match(/\/(e|b)\/([A-Za-z0-9]+)/)
  if (m) return { path: m[1] as 'e' | 'b', token: m[2] }
  if (/^[A-Za-z0-9]{16,}$/.test(t)) return { path: 'e', token: t }
  return null
}
