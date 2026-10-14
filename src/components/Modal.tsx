import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export default function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onPointerDown={onClose}
    >
      <motion.div
        className="w-full max-w-lg max-h-[92vh] overflow-auto rounded-2xl bg-[#fff3d6] p-5 shadow-2xl"
        initial={{ y: 60, opacity: 0, rotate: -1 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-hand text-3xl font-bold text-amber-950">{title}</h2>
          <button className="btn !px-3 !py-1" onClick={onClose} aria-label="Tutup">
            ✕
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}
