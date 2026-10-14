import { AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import Board from '../components/Board'
import type { Viewport } from '../components/Board'
import Composer from '../components/Composer'
import Cover from '../components/Cover'
import Modal from '../components/Modal'
import MusicPlayer from '../components/MusicPlayer'
import CropModal from '../components/CropModal'
import { MAX_SONG_MB, SONG_EXTS, friendlyUploadError } from '../lib/catalog'
import { rememberBoard } from '../lib/myboards'
import { store } from '../lib/store'
import type { Item, ItemType, LoadedBoard } from '../types'

export default function BoardPage() {
  const { token = '' } = useParams()
  const location = useLocation()
  const [welcome, setWelcome] = useState(() => !!(location.state as { created?: boolean } | null)?.created)
  const getViewport = useRef<() => Viewport>(() => ({ x: 0, y: 0, w: 1200, h: 800 }))
  const registerViewport = useCallback((fn: () => Viewport) => {
    getViewport.current = fn
  }, [])
  const [undo, setUndo] = useState<Item | null>(null)
  const undoTimer = useRef<number | undefined>(undefined)
  const [data, setData] = useState<LoadedBoard | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [items, setItems] = useState<Item[]>([])
  const [fresh, setFresh] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<string | null>(null)
  const [composer, setComposer] = useState<{ type: ItemType; item?: Item } | null>(null)
  const [panel, setPanel] = useState<'share' | 'settings' | null>(null)
  const [covered, setCovered] = useState(true)
  const [playSignal, setPlaySignal] = useState(0)
  const [toast, setToast] = useState('')
  const known = useRef<Set<string>>(new Set())
  const busy = useRef(false)

  const editable = data?.role === 'edit'
  const editToken = data?.board.edit_token ?? ''

  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(''), 3500)
  }

  const load = useCallback(
    async (first: boolean) => {
      try {
        const r = await store.loadBoard(token)
        if (!r) return setState('missing')
        setData(r)
        if (r.role === 'edit') rememberBoard(token, r.board.title)
        const incoming = r.items
        const newOnes = incoming.filter((i) => !known.current.has(i.id)).map((i) => i.id)
        incoming.forEach((i) => known.current.add(i.id))
        if (first) setFresh(new Set(newOnes))
        else if (newOnes.length) setFresh((f) => new Set([...f, ...newOnes]))
        setItems((cur) => (first || !busy.current ? incoming : cur))
        setState('ready')
      } catch (e) {
        if (first) setState('missing')
        else console.warn(e)
      }
    },
    [token],
  )

  useEffect(() => {
    known.current = new Set()
    setState('loading')
    load(true)
  }, [load])

  // Pembaruan berkala di mode cloud supaya perubahan orang lain muncul (tanpa biaya realtime).
  useEffect(() => {
    if (store.mode !== 'cloud') return
    const t = setInterval(() => {
      if (!document.hidden && !busy.current && !composer) load(false)
    }, 8000)
    return () => clearInterval(t)
  }, [load, composer])

  const persist = async (item: Item) => {
    try {
      await store.saveItem(editToken, item)
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Gagal menyimpan')
    }
  }

  const topZ = items.reduce((m, i) => Math.max(m, i.z), 0)
  const sel = items.find((i) => i.id === selected)

  const patch = (id: string, p: Partial<Item>, save = true) => {
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, ...p } : i)))
    if (save) {
      const it = items.find((i) => i.id === id)
      if (it) persist({ ...it, ...p })
    }
  }

  const saveFromComposer = (it: Item) => {
    const isNew = !items.some((i) => i.id === it.id)
    known.current.add(it.id)
    if (isNew) {
      setFresh((f) => new Set(f).add(it.id))
      setItems((cur) => [...cur, it])
    } else {
      setItems((cur) => cur.map((i) => (i.id === it.id ? it : i)))
    }
    persist(it)
    setComposer(null)
  }

  const remove = async (id: string) => {
    const gone = items.find((i) => i.id === id)
    setItems((cur) => cur.filter((i) => i.id !== id))
    setSelected(null)
    try {
      await store.deleteItem(editToken, id)
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Gagal menghapus')
      return
    }
    if (!gone) return
    setUndo(gone)
    window.clearTimeout(undoTimer.current)
    undoTimer.current = window.setTimeout(() => setUndo(null), 7000)
  }

  const undoRemove = () => {
    if (!undo) return
    const back = undo
    window.clearTimeout(undoTimer.current)
    setUndo(null)
    known.current.add(back.id)
    setItems((cur) => [...cur, back])
    persist(back)
  }

  const scaleItem = (f: number) => {
    if (!sel) return
    const width = Math.round(Math.max(70, Math.min(480, sel.width * f)))
    patch(sel.id, { width, height: Math.round(sel.height * (width / sel.width)) })
  }

  if (state === 'loading') return <div className="cork flex min-h-screen items-center justify-center font-hand text-4xl">Memuat papan...</div>
  if (state === 'missing' || !data)
    return (
      <div className="cork flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-hand text-5xl">Papan tidak ditemukan</p>
        <p className="font-note text-xl">Periksa tautan atau buat papan baru.</p>
        <Link to="/" className="btn">Buat papan</Link>
      </div>
    )

  const origin = window.location.origin
  const viewLink = `${origin}/b/${data.board.view_token}`
  const editLink = editToken ? `${origin}/e/${editToken}` : ''

  return (
    <div className="min-h-screen bg-[#3b2a1e] px-3 pb-32 pt-4">
      <AnimatePresence>
        {covered && (
          <Cover
            title={data.board.title}
            message={data.board.cover_message}
            image={data.board.cover_image}
            onOpen={() => {
              setPlaySignal((n) => n + 1)
              setCovered(false)
            }}
          />
        )}
      </AnimatePresence>

      <header className="mx-auto mb-3 flex max-w-[1250px] flex-wrap items-center justify-between gap-2">
        {editable ? (
          <TitleEditor
            title={data.board.title}
            onSave={async (title) => {
              try {
                await store.updateBoard(editToken, { title })
                setData((d) => (d ? { ...d, board: { ...d.board, title } } : d))
              } catch (e) {
                flash(e instanceof Error ? e.message : 'Gagal menyimpan judul')
              }
            }}
          />
        ) : (
          <h1 className="font-hand text-4xl font-bold text-amber-50 sm:text-5xl">{data.board.title}</h1>
        )}
        <div className="flex items-center gap-2">
          <MusicPlayer url={data.board.music_url} playSignal={playSignal} />
          {editable && (
            <>
              <button className="btn !text-sm" onClick={() => setPanel('share')}>Bagikan</button>
              <button className="btn !text-sm" onClick={() => setPanel('settings')}>Pengaturan</button>
            </>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-[1250px]">
        <Board
          items={items}
          editable={!!editable}
          selectedId={selected}
          freshIds={fresh}
          registerViewport={registerViewport}
          onSelect={(id) => {
            setSelected(id)
            if (id) {
              const top = items.reduce((m, i) => Math.max(m, i.z), 0)
              const it = items.find((i) => i.id === id)
              if (it && it.z < top) patch(id, { z: top + 1 }, true)
            }
          }}
          onRemove={remove}
          onMove={(id, x, y) => {
            busy.current = true
            patch(id, { x, y }, false)
          }}
          onCommit={(id) => {
            busy.current = false
            setItems((cur) => {
              const it = cur.find((i) => i.id === id)
              if (it) persist(it)
              return cur
            })
          }}
        />
        {!editable && <p className="mt-3 text-center font-note text-lg text-amber-100/70">Kamu sedang melihat papan ini.</p>}
      </div>

      {editable && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2 bg-gradient-to-t from-black/70 to-transparent p-3">
          {sel && (
            <div className="flex flex-wrap justify-center gap-2 rounded-2xl bg-black/50 p-2">
              <button className="btn !text-sm" onClick={() => patch(sel.id, { rotation: sel.rotation - 5 })}>⟲</button>
              <button className="btn !text-sm" onClick={() => patch(sel.id, { rotation: sel.rotation + 5 })}>⟳</button>
              <button className="btn !text-sm" onClick={() => scaleItem(0.88)}>−</button>
              <button className="btn !text-sm" onClick={() => scaleItem(1.14)}>＋</button>
              <button className="btn !text-sm" onClick={() => patch(sel.id, { z: topZ + 1 })}>Ke depan</button>
              {sel.type !== 'sticker' && (
                <button className="btn !text-sm" onClick={() => setComposer({ type: sel.type, item: sel })}>Ubah</button>
              )}
              <button className="btn btn-danger !text-sm" onClick={() => remove(sel.id)}>Hapus</button>
            </div>
          )}
          <div className="flex gap-2">
            <button className="btn" onClick={() => setComposer({ type: 'note' })}>📝 Catatan</button>
            <button className="btn" onClick={() => setComposer({ type: 'photo' })}>📷 Foto</button>
            <button className="btn" onClick={() => setComposer({ type: 'sticker' })}>⭐ Stiker</button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {composer && (
          <Composer key={composer.item?.id ?? composer.type} type={composer.type} item={composer.item} topZ={topZ} area={getViewport.current()} onSave={saveFromComposer} onClose={() => setComposer(null)} />
        )}
        {welcome && !covered && editable && (
          <Modal
            title="Papan siap! Simpan tautan ini"
            onClose={() => {
              setWelcome(false)
              window.history.replaceState({}, '')
            }}
          >
            <p className="mb-3 text-sm">
              Tautan edit adalah satu-satunya kunci untuk mengubah papan ini. Jika hilang, papan tidak bisa dibuka lagi dari perangkat lain.
              Salin dan simpan di catatan atau kirim ke diri sendiri.
            </p>
            <LinkRow label="Tautan edit (rahasia, untuk Anda)" value={editLink} />
            <LinkRow label="Tautan lihat (aman dibagikan)" value={viewLink} />
            {store.mode === 'local' && (
              <p className="mt-2 text-sm font-bold text-red-800">Mode pratinjau: tautan hanya bekerja di browser ini.</p>
            )}
            <div className="mt-4 flex justify-end">
              <button
                className="btn !bg-amber-300"
                onClick={() => {
                  setWelcome(false)
                  window.history.replaceState({}, '')
                }}
              >
                Sudah saya simpan
              </button>
            </div>
          </Modal>
        )}
        {panel === 'share' && (
          <Modal title="Bagikan papan" onClose={() => setPanel(null)}>
            <LinkRow label="Tautan lihat (aman dibagikan)" value={viewLink} />
            <LinkRow label="Tautan edit (rahasia, hanya untuk yang boleh mengubah)" value={editLink} />
            {store.mode === 'local' && (
              <p className="mt-3 text-sm font-bold text-red-800">
                Mode pratinjau: tautan hanya bekerja di browser ini. Hubungkan Supabase agar orang lain bisa membuka.
              </p>
            )}
          </Modal>
        )}
        {panel === 'settings' && (
          <SettingsModal
            board={data.board}
            onClose={() => setPanel(null)}
            onSave={async (p) => {
              try {
                await store.updateBoard(editToken, p)
                setData((d) => (d ? { ...d, board: { ...d.board, ...p } } : d))
                setPanel(null)
              } catch (e) {
                flash(e instanceof Error ? e.message : 'Gagal menyimpan')
              }
            }}
          />
        )}
      </AnimatePresence>

      {undo && (
        <div role="status" className="fixed bottom-24 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-3 rounded-xl bg-stone-900 px-4 py-2 font-bold text-white shadow-lg">
          Item dihapus
          <button className="btn !px-3 !py-1 !text-sm" onClick={undoRemove}>
            Urungkan
          </button>
        </div>
      )}
      {toast && (
        <div className="fixed left-1/2 top-4 z-[70] -translate-x-1/2 rounded-xl bg-red-700 px-4 py-2 font-bold text-white shadow-lg">{toast}</div>
      )}
    </div>
  )
}

function LinkRow({ label, value }: { label: string; value: string }) {
  const [ok, setOk] = useState(false)
  if (!value) return null
  return (
    <div className="mb-3">
      <p className="mb-1 text-sm font-bold">{label}</p>
      <div className="flex gap-2">
        <input readOnly className="field text-sm" value={value} onFocus={(e) => e.currentTarget.select()} />
        <button
          className="btn !text-sm"
          onClick={() => navigator.clipboard.writeText(value).then(() => setOk(true), () => undefined)}
        >
          {ok ? 'Tersalin' : 'Salin'}
        </button>
      </div>
    </div>
  )
}

function SettingsModal({
  board,
  onClose,
  onSave,
}: {
  board: LoadedBoard['board']
  onClose: () => void
  onSave: (p: { title: string; cover_message: string; music_url: string; cover_image: string }) => Promise<void>
}) {
  const [title, setTitle] = useState(board.title)
  const [cover, setCover] = useState(board.cover_message)
  const [music, setMusic] = useState(board.music_url)
  const [coverImg, setCoverImg] = useState(board.cover_image ?? '')
  const [coverFile, setCoverFile] = useState<File | null>(null) // foto yang sedang dipotong
  const [coverSrc, setCoverSrc] = useState<File | null>(null) // foto asli untuk atur ulang
  const [song, setSong] = useState<{ name: string; size: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const uploadCover = async (blob: Blob) => {
    setCoverFile(null)
    setBusy(true)
    setErr('')
    try {
      setCoverImg(await store.upload(blob, 'jpg'))
    } catch (e) {
      setErr(e instanceof Error ? friendlyUploadError(e.message) : 'Gagal mengunggah foto sampul')
    } finally {
      setBusy(false)
    }
  }

  const pickSong = async (f: File | undefined) => {
    if (!f) return
    const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
    if (!SONG_EXTS.includes(ext)) return setErr(`Jenis berkas .${ext || '?'} belum didukung. Pakai ${SONG_EXTS.join(', ')}.`)
    if (f.size > MAX_SONG_MB * 1024 * 1024)
      return setErr(`Lagu ${(f.size / 1048576).toFixed(1)} MB terlalu besar. Maksimal ${MAX_SONG_MB} MB.`)
    setBusy(true)
    setErr('')
    try {
      setMusic(await store.upload(f, ext))
      setSong({ name: f.name, size: f.size })
    } catch (e) {
      setErr(e instanceof Error ? friendlyUploadError(e.message) : 'Gagal mengunggah lagu')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
    <Modal title="Pengaturan" onClose={onClose}>
      <div className="space-y-3">
        <input className="field" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul papan" />
        <textarea className="field" rows={2} maxLength={500} value={cover} onChange={(e) => setCover(e.target.value)} placeholder="Pesan di sampul" />
        <div>
          <p className="mb-1 text-sm font-bold">Foto sampul</p>
          <div className="flex items-center gap-3">
            {coverImg ? (
              <img src={coverImg} alt="Foto sampul" className="h-16 w-16 rounded object-cover" />
            ) : (
              <span className="text-4xl">💌</span>
            )}
            <label className="btn inline-block !text-sm">
              {coverImg ? 'Ganti foto' : 'Pilih foto'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) {
                    setCoverSrc(f)
                    setCoverFile(f)
                  }
                  e.target.value = ''
                }}
              />
            </label>
            {coverSrc && coverImg && (
              <button className="btn !text-sm" onClick={() => setCoverFile(coverSrc)}>
                ✂ Atur potongan
              </button>
            )}
            {coverImg && (
              <button className="btn btn-danger !text-sm" onClick={() => setCoverImg('')}>
                Hapus
              </button>
            )}
          </div>
        </div>
        <div>
          <p className="mb-1 text-sm font-bold">Lagu latar</p>
          {store.mode === 'cloud' ? (
            <label className="block cursor-pointer rounded-xl border-2 border-dashed border-amber-700/50 bg-white/50 p-3 text-center font-bold">
              🎵 {music ? 'Ganti lagu dari perangkat' : 'Pilih lagu dari perangkat'}
              <span className="mt-1 block text-xs font-normal text-stone-600">
                Format {SONG_EXTS.join(', ')}. Maksimal {MAX_SONG_MB} MB.
              </span>
              <input
                type="file"
                accept="audio/*,.mp3,.m4a,.aac,.ogg,.opus,.wav,.webm"
                className="hidden"
                onChange={(e) => {
                  pickSong(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </label>
          ) : (
            <p className="rounded-lg bg-red-100 p-2 text-xs font-bold text-red-800">
              Mode pratinjau: unggah lagu dari perangkat belum aktif karena Supabase belum tersambung. Pakai tautan mp3 di bawah.
            </p>
          )}
          {music && (
            <div className="mt-2 rounded-lg bg-white/60 p-2 text-sm">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate font-bold">
                  {song ? `${song.name} (${(song.size / 1048576).toFixed(1)} MB)` : 'Lagu terpasang'}
                </span>
                <button
                  className="btn btn-danger !px-3 !py-1 !text-xs"
                  onClick={() => {
                    setMusic('')
                    setSong(null)
                  }}
                >
                  Hapus lagu
                </button>
              </div>
              <audio controls src={music} className="w-full" />
            </div>
          )}
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-bold">Atau pakai tautan mp3</summary>
            <input
              className="field mt-2"
              value={music}
              onChange={(e) => {
                setMusic(e.target.value)
                setSong(null)
              }}
              placeholder="https://.../lagu.mp3"
            />
          </details>
        </div>
        {busy && <p className="text-sm font-bold">Mengunggah...</p>}
        {err && <p className="text-sm font-bold text-red-700">{err}</p>}
        <div className="flex justify-end gap-2">
          <button className="btn" onClick={onClose}>Batal</button>
          <button
            className="btn !bg-amber-300"
            disabled={busy}
            onClick={() => onSave({ title: title.trim() || 'Papan Kita', cover_message: cover.trim(), music_url: music.trim(), cover_image: coverImg })}
          >
            Simpan
          </button>
        </div>
      </div>
    </Modal>
    {coverFile && (
      <CropModal
        file={coverFile}
        title="Atur potongan foto sampul"
        outSize={store.mode === 'local' ? 520 : 900}
        quality={store.mode === 'local' ? 0.7 : 0.8}
        onCancel={() => setCoverFile(null)}
        onDone={uploadCover}
      />
    )}
    </>
  )
}

function TitleEditor({ title, onSave }: { title: string; onSave: (t: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(title)
  const commit = () => {
    setEditing(false)
    const t = val.trim() || 'Papan Kita'
    setVal(t)
    if (t !== title) onSave(t)
  }
  if (editing)
    return (
      <input
        autoFocus
        className="field !w-auto max-w-full font-hand !text-3xl font-bold sm:!text-4xl"
        maxLength={80}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        aria-label="Judul papan"
      />
    )
  return (
    <button
      className="group flex min-h-[44px] items-center gap-2 text-left"
      onClick={() => {
        setVal(title)
        setEditing(true)
      }}
      aria-label="Ubah judul"
    >
      <h1 className="font-hand text-4xl font-bold text-amber-50 sm:text-5xl">{title}</h1>
      <span className="text-lg opacity-60 group-hover:opacity-100">✏️</span>
    </button>
  )
}
