import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { OfflineGamePage } from './pages/OfflineGamePage'
import { OnlineLobbyPage } from './pages/OnlineLobbyPage'
import { OnlineGamePage } from './pages/OnlineGamePage'
import { OnlineInvitePage } from './pages/OnlineInvitePage'
import { SettingsPage } from './pages/SettingsPage'
import { useSound } from './hooks/useSound'
import { useSettingsStore } from './state/settingsStore'
import { ToastHost } from './components/common/Toast'

/** Định tuyến SPA. Dùng HashRouter + base './' để bản build mở được
 * trực tiếp từ file:// — phục vụ yêu cầu chơi offline (mục 17). */
export default function App() {
  // Đồng bộ cài đặt âm thanh + nhạc nền cho toàn app
  useSound()

  // Áp dụng chế độ hiển thị (dark / dim / light) lên <html>
  const displayMode = useSettingsStore((s) => s.displayMode)
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('display-dim', displayMode === 'dim')
    root.classList.toggle('display-light', displayMode === 'light')
  }, [displayMode])

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/offline" element={<OfflineGamePage />} />
        <Route path="/online" element={<OnlineLobbyPage />} />
        <Route path="/online/game" element={<OnlineGamePage />} />
        {/* Trang đích của invite link: #/game/CODE */}
        <Route path="/game/:code" element={<OnlineInvitePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastHost />
    </HashRouter>
  )
}
