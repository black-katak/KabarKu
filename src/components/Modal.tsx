import { motion } from 'framer-motion'
import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

export default function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    const el = panel.current
    // Fokus ke isian pertama bila ada, kalau tidak ke panel.
    const first = el?.querySelector<HTMLElement>('input:not([type=file]),textarea') ?? el
    first?.focus()
    return () => prev?.focus?.()
  }, [])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab') return
    const items = [...(panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter((n) => n.offsetParent !== null)
    if (!items.length) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onPointerDown={onClose}
    >
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="w-full max-w-lg max-h-[92vh] overflow-auto rounded-2xl bg-[#fff3d6] p-5 shadow-2xl outline-none"
        initial={{ y: 60, opacity: 0, rotate: -1 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id={titleId} className="font-hand text-3xl font-bold text-amber-950">{title}</h2>
          <button className="btn !px-3 !py-1" onClick={onClose} aria-label="Tutup">
            ✕
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}
