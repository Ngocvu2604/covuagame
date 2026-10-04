import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' để bản build chạy được từ file:// (chơi offline không cần server)
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 700,
  },
  server: {
    port: 5173,
  },
})
