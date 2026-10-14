import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import BoardPage from './pages/BoardPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/b/:token" element={<BoardPage />} />
      <Route path="/e/:token" element={<BoardPage />} />
    </Routes>
  )
}
