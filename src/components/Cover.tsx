import { motion } from 'framer-motion'

interface Props {
  title: string
  message: string
  image?: string
  onOpen: () => void
}

export default function Cover({ title, message, image, onOpen }: Props) {
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Sampul ${title}`}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-auto bg-[#2b1d12] p-6 text-center"
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: -2 }}
        transition={{ type: 'spring', stiffness: 90, damping: 12 }}
        className="w-full max-w-sm rounded-sm bg-[#fbfaf5] px-6 pb-9 pt-6 shadow-2xl"
      >
        <div className={`mb-4 flex aspect-square w-full items-center justify-center overflow-hidden bg-gradient-to-br from-amber-300 to-rose-300 text-8xl shadow-inner ${image ? 'developing' : ''}`}>
          {image ? <img src={image} alt="Foto sampul" className="h-full w-full object-cover" draggable={false} /> : '💌'}
        </div>
        <h1 className="font-hand text-5xl font-bold text-stone-800">{title}</h1>
        {message && <p className="mt-2 font-hand text-2xl text-stone-600">{message}</p>}
      </motion.div>
      <motion.button
        className="btn mt-8 !px-8 !py-3 !text-lg"
        onClick={onOpen}
        autoFocus
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
      >
        Ketuk untuk masuk
      </motion.button>
    </motion.div>
  )
}
