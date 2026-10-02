import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { OfflineGamePage } from './pages/OfflineGamePage'
import { OnlineLobbyPage } from './pages/OnlineLobbyPage'
import { OnlineGamePage } from './pages/OnlineGamePage'
import { SettingsPage } from './pages/SettingsPage'
import { useSound } from './hooks/useSound'

/** Định tuyến SPA. Dùng HashRouter + base './' để bản build mở được
 * trực tiếp từ file:// — phục vụ yêu cầu chơi offline (mục 17). */
export default function App() {
  // Đồng bộ cài đặt âm thanh cho toàn app
  useSound()

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/offline" element={<OfflineGamePage />} />
        <Route path="/online" element={<OnlineLobbyPage />} />
        <Route path="/online/game" element={<OnlineGamePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
