import { useEffect, useRef, useState } from 'react'

const START_DELAY_MS = 1500 // jeda sebelum musik terdengar setelah pengunjung masuk
const FADE_MS = 3000 // lama volume naik dari senyap ke penuh

// playSignal naik tiap kali pengunjung menekan "Ketuk untuk masuk" (gestur yang dibutuhkan browser).
export default function MusicPlayer({ url, playSignal }: { url: string; playSignal: number }) {
  const ref = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const timers = useRef<{ delay?: number; fade?: number }>({})

  const stopTimers = () => {
    window.clearTimeout(timers.current.delay)
    window.clearInterval(timers.current.fade)
  }

  useEffect(() => {
    const a = ref.current
    if (!playSignal || !a) return
    stopTimers()
    // Putar senyap dulu di dalam gestur, supaya browser mengizinkan. Volume naik setelah jeda.
    a.volume = 0
    a.play().catch(() => setPlaying(false))
    timers.current.delay = window.setTimeout(() => {
      const step = 100
      let t = 0
      timers.current.fade = window.setInterval(() => {
        t += step
        a.volume = Math.min(1, t / FADE_MS)
        if (t >= FADE_MS) window.clearInterval(timers.current.fade)
      }, step)
    }, START_DELAY_MS)
    return stopTimers
  }, [playSignal])

  useEffect(() => stopTimers, [])

  if (!url) return null
  const toggle = () => {
    const a = ref.current
    if (!a) return
    stopTimers() // tombol manual membatalkan jeda dan fade, volume langsung penuh
    a.volume = 1
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
      />
      <button className="btn flex items-center gap-2 !text-sm" onClick={toggle} aria-label={playing ? 'Jeda lagu' : 'Putar lagu'}>
        <span className={playing ? 'inline-block animate-spin' : ''} style={{ animationDuration: '3s' }}>
          💿
        </span>
        {playing ? 'Jeda' : 'Putar lagu'}
      </button>
    </>
  )
}
