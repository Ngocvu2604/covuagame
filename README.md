# ♟ Chess Arena

Website chơi cờ vua trên nền tảng Web: **chơi với máy (offline AI)** và **chơi online realtime**.

> Project đang được xây dựng theo từng phase. Phase hiện tại: **Phase 4 — Game UI (hoàn thành)**.

## Tech Stack

- **Frontend:** React 19, TypeScript (strict), Vite, Tailwind CSS v4, React Router 7
- **Chess logic:** chess.js 1.4
- **State:** zustand (+ persist localStorage)
- **AI:** Minimax + Alpha-Beta + Quiescence (Web Worker), 3 mức độ
- **Backend:** Node.js, Express, Socket.IO (Phase 5)

## Cấu trúc

```
chess-arena/
├── client/       # Frontend React + Vite + Tailwind
├── server/       # Backend Socket.IO (bổ sung ở Phase 5)
└── package.json  # npm workspaces, script chung
```

## Chạy project

```bash
# Cài dependencies (chạy ở root)
npm install

# Chạy frontend dev server → http://localhost:5173
npm run dev

# Kiểm tra TypeScript + build production
npm run build
```

## Lộ trình các phase

1. ✅ Project setup (React + TypeScript + Vite + Tailwind)
2. ✅ Chess engine + bàn cờ
3. ✅ Offline AI (Tân Binh / Kỳ Thủ / Đại Kiện Tướng)
4. ✅ Game UI (Home, tạo trận, player panel, đồng hồ cờ, lịch sử nước đi, kết quả, cài đặt)
5. Online backend (Node + Express + Socket.IO)
6. Online frontend (tạo phòng, tham gia phòng, realtime moves)
7. Chat + reconnect
8. Sound + animation
9. Responsive UI
10. Testing + bug fixing
