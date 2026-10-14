import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { forgetBoard, getMine, parseLink } from '../lib/myboards'
import { store } from '../lib/store'

export default function Home() {
  const nav = useNavigate()
  const [title, setTitle] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [mine, setMine] = useState(getMine)
  const [link, setLink] = useState('')
  const [linkErr, setLinkErr] = useState('')

  const create = async () => {
    setBusy(true)
    setErr('')
    try {
      const t = await store.createBoard(title.trim() || 'Papan Kita', msg.trim())
      nav(`/e/${t.editToken}`)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal membuat papan')
      setBusy(false)
    }
  }

  const openLink = () => {
    const p = parseLink(link)
    if (!p) return setLinkErr('Tautan tidak dikenali. Tempel tautan lengkap yang diawali /e/ atau /b/.')
    nav(`/${p.path}/${p.token}`)
  }

  return (
    <div className="cork flex min-h-screen items-center justify-center p-5">
      <motion.div
        className="w-full max-w-md rounded-sm bg-[#fbfaf5] p-7 pb-9 shadow-2xl"
        initial={{ y: -500, rotate: 10, opacity: 0 }}
        animate={{ y: 0, rotate: -1.5, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 70, damping: 12 }}
      >
        <div className="pin" style={{ top: -8 }} />
        <h1 className="font-hand text-6xl font-bold text-stone-800">KabarKu 📌</h1>
        <p className="mb-5 font-note text-xl text-stone-600">
          Papan buletin untuk catatan, foto polaroid, stiker, dan lagu. Bagikan lewat tautan.
        </p>
        <label className="mb-1 block text-sm font-bold">Judul papan</label>
        <input className="field mb-3" maxLength={80} placeholder="Selamat Ulang Tahun!" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label className="mb-1 block text-sm font-bold">Pesan di sampul (opsional)</label>
        <textarea className="field mb-4" rows={2} maxLength={500} placeholder="Ada kejutan untukmu..." value={msg} onChange={(e) => setMsg(e.target.value)} />
        <button className="btn w-full !bg-amber-300 !py-3 !text-lg" disabled={busy} onClick={create}>
          {busy ? 'Membuat...' : 'Buat papan'}
        </button>
        {err && <p className="mt-2 text-sm font-bold text-red-700">{err}</p>}
        <div className="mt-6 border-t-2 border-dashed border-stone-300 pt-4">
          <h2 className="mb-2 font-hand text-3xl font-bold text-stone-800">Papan saya</h2>
          {mine.length === 0 ? (
            <p className="mb-3 text-sm text-stone-500">Belum ada. Papan yang Anda buat atau buka dengan tautan edit muncul di sini.</p>
          ) : (
            <ul className="mb-3 space-y-2">
              {mine.map((b) => (
                <li key={b.token} className="flex items-center gap-2">
                  <button className="btn flex-1 truncate !text-left !text-sm" onClick={() => nav(`/e/${b.token}`)}>
                    {b.title}
                  </button>
                  <button
                    className="btn btn-danger !px-3 !py-1 !text-xs"
                    aria-label={`Lupakan ${b.title}`}
                    onClick={() => {
                      forgetBoard(b.token)
                      setMine(getMine())
                    }}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          <label className="mb-1 block text-sm font-bold">Punya tautan edit atau lihat?</label>
          <div className="flex gap-2">
            <input
              className="field text-sm"
              placeholder="Tempel tautan di sini"
              value={link}
              onChange={(e) => {
                setLink(e.target.value)
                setLinkErr('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && openLink()}
            />
            <button className="btn !text-sm" onClick={openLink}>Buka</button>
          </div>
          {linkErr && <p className="mt-1 text-sm font-bold text-red-700">{linkErr}</p>}
          <p className="mt-2 text-xs text-stone-500">
            Daftar ini tersimpan di browser ini saja. Simpan tautan edit Anda di tempat aman agar bisa dibuka dari perangkat lain.
          </p>
        </div>
        {store.mode === 'local' && (
          <p className="mt-4 text-xs text-stone-500">
            Mode pratinjau: data tersimpan di browser ini saja. Isi .env dengan kunci Supabase agar bisa dibagikan.
          </p>
        )}
      </motion.div>
    </div>
  )
}
