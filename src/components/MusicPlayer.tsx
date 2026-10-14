import { useEffect, useRef, useState } from 'react'

// playSignal naik tiap kali pengguna menekan "Buka" di sampul (gestur yang dibutuhkan browser).
export default function MusicPlayer({ url, playSignal }: { url: string; playSignal: number }) {
  const ref = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playSignal || !ref.current) return
    ref.current.play().catch(() => setPlaying(false))
  }, [playSignal])

  if (!url) return null
  const toggle = () => {
    const a = ref.current
    if (!a) return
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
