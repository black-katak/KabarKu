import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { store } from '../lib/store'

export default function Home() {
  const nav = useNavigate()
  const [title, setTitle] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

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
        {store.mode === 'local' && (
          <p className="mt-4 text-xs text-stone-500">
            Mode pratinjau: data tersimpan di browser ini saja. Isi .env dengan kunci Supabase agar bisa dibagikan.
          </p>
        )}
      </motion.div>
    </div>
  )
}
