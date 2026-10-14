import { useEffect, useRef, useState } from 'react'

const START_DELAY_MS = 1500 // jeda sebelum musik terdengar setelah pengunjung masuk
const FADE_MS = 3000 // lama volume naik dari senyap ke volume pilihan
const DEFAULT_VOLUME = 0.4 // volume bawaan, cukup pelan untuk lagu yang direkam keras
const VOL_KEY = 'kabarku:volume'

function loadVolume(): number {
  try {
    const v = parseFloat(localStorage.getItem(VOL_KEY) ?? '')
    if (v >= 0 && v <= 1) return v
  } catch {
    // penyimpanan diblokir: pakai bawaan
  }
  return DEFAULT_VOLUME
}

// playSignal naik tiap kali pengunjung menekan "Ketuk untuk masuk" (gestur yang dibutuhkan browser).
// Musik diputar bisu dulu (diizinkan browser), lalu dibunyikan setelah jeda dan naik pelan ke volume pilihan.
// Safari iPhone mengabaikan pengaturan volume dari halaman web. Di sana penggeser disembunyikan,
// musik masuk setelah jeda, dan volumenya diatur dengan tombol volume perangkat.
export default function MusicPlayer({ url, playSignal }: { url: string; playSignal: number }) {
  const ref = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  const [volume, setVolume] = useState(loadVolume)
  const [canSetVolume, setCanSetVolume] = useState(true)
  const volRef = useRef(volume)
  const timers = useRef<{ delay?: number; fade?: number }>({})

  const stopTimers = () => {
    window.clearTimeout(timers.current.delay)
    window.clearInterval(timers.current.fade)
  }

  // Deteksi apakah browser mengizinkan pengaturan volume.
  useEffect(() => {
    const a = ref.current
    if (!a) return
    const before = a.volume
    a.volume = 0.5
    setCanSetVolume(Math.abs(a.volume - 0.5) < 0.01)
    a.volume = before
  }, [url])

  useEffect(() => {
    const a = ref.current
    if (!playSignal || !a) return
    stopTimers()
    a.muted = true
    a.volume = 0
    a.play().catch(() => setPlaying(false))
    timers.current.delay = window.setTimeout(() => {
      a.muted = false
      const step = 100
      let t = 0
      timers.current.fade = window.setInterval(() => {
        t += step
        a.volume = Math.min(1, t / FADE_MS) * volRef.current
        if (t >= FADE_MS) window.clearInterval(timers.current.fade)
      }, step)
    }, START_DELAY_MS)
    return stopTimers
  }, [playSignal])

  useEffect(() => stopTimers, [])
  useEffect(() => setFailed(false), [url])

  const changeVolume = (v: number) => {
    stopTimers() // geser manual membatalkan fade
    volRef.current = v
    setVolume(v)
    const a = ref.current
    if (a) {
      a.muted = false
      a.volume = v
    }
    try {
      localStorage.setItem(VOL_KEY, String(v))
    } catch {
      // abaikan
    }
  }

  if (!url) return null
  const toggle = () => {
    const a = ref.current
    if (!a) return
    stopTimers() // tombol manual membatalkan jeda dan fade
    a.muted = false
    a.volume = volRef.current
    if (a.paused) a.play().catch(() => undefined)
    else a.pause()
  }
  return (
    <>
      <audio
        ref={ref}
        src={url}
        loop
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => {
          setFailed(true)
          setPlaying(false)
        }}
        onCanPlay={() => setFailed(false)}
      />
      <button className="btn flex items-center gap-2 !text-sm" onClick={toggle} aria-label={playing ? 'Jeda lagu' : 'Putar lagu'}>
        <span className={playing ? 'inline-block animate-spin' : ''} style={{ animationDuration: '3s' }}>
          💿
        </span>
        {playing ? 'Jeda' : 'Putar lagu'}
      </button>
      {canSetVolume && (
        <label className="flex items-center gap-1 rounded-full bg-black/30 px-3 py-1 text-xs font-bold text-amber-50">
          <span aria-hidden>{volume === 0 ? '🔇' : '🔊'}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            aria-label="Volume lagu"
            className="w-20"
            onChange={(e) => changeVolume(Number(e.target.value))}
          />
        </label>
      )}
      {failed && (
        <span role="alert" className="rounded-lg bg-red-100 px-2 py-1 text-xs font-bold text-red-800">
          Lagu tidak bisa dimuat. Pemilik papan perlu mengganti tautannya.
        </span>
      )}
    </>
  )
}
