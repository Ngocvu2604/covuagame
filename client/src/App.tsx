import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { OfflineGamePage } from './pages/OfflineGamePage'
import { SettingsPage } from './pages/SettingsPage'

/** Định tuyến SPA. Dùng HashRouter + base './' để bản build mở được
 * trực tiếp từ file:// — phục vụ yêu cầu chơi offline (mục 17). */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/offline" element={<OfflineGamePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        {/* Route online sẽ bổ sung ở Phase 5–6 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
