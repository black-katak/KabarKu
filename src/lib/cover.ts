import { compressImage } from './image'
import { store } from './store'

// Foto sampul dipotong persegi dan dikompres agar hemat penyimpanan gratis.
export async function uploadCover(file: File): Promise<string> {
  const local = store.mode === 'local'
  const blob = await compressImage(file, { square: true, max: local ? 520 : 900, quality: local ? 0.7 : 0.8 })
  return store.upload(blob, 'jpg')
}
