# ♟ Chess Arena

Website chơi cờ vua trên nền tảng Web với 2 chế độ: **chơi với máy (offline AI)** và **chơi online realtime**. Giao diện hiện đại (dark mode), responsive từ mobile đến desktop.

## Features

- **Chơi với máy Offline** — hoạt động 100% phía client, không cần Internet
- **3 mức độ AI**: 🟢 Tân Binh (dễ, có sai lầm chủ ý) · 🟡 Kỳ Thủ (trung bình) · 🔴 Đại Kiện Tướng (Minimax + Alpha-Beta + Quiescence, chạy trong Web Worker)
- **Chơi Online** — tạo phòng / tham gia bằng mã phòng 6 ký tự hoặc **invite link**, nước đi realtime
- **Online 24/7 với Appwrite Cloud** — Anonymous Session + Database + Realtime, không cần server riêng (xem `APPWRITE_SETUP.md`); client tự chọn provider qua env `VITE_APPWRITE_*` (không có env → Socket.IO server)
- **Đầy đủ luật cờ vua**: chiếu, chiếu hết, hòa (stalemate, lặp 3 lần, luật 50 nước, thiếu lực lượng), nhập thành 2 cánh, bắt tốt qua đường, phong cấp
- **8 Board Theme**: Classic / Wood / Green / Blue / Purple / Dark / Neon / Minimal — đổi ngay lập tức, lưu localStorage
- **8 Piece Set**: Classic / Modern / Minimal / Glass / 3D / Fantasy / Neon / Wooden — quân Trắng luôn sáng, quân Đen luôn tối
- **Tọa độ A–H / 1–8** trên bàn cờ (bật/tắt được, tự đảo theo góc nhìn)
- **Dark / Dim / Light** display mode
- **Nhạc nền ambient** tổng hợp bằng Web Audio (không cần file) — bật/tắt + volume; hoặc thay bằng file `client/public/audio/background.mp3` của bạn
- **Settings Drawer** trong game (slide-over desktop / bottom-sheet mobile) + trang Cài đặt đầy đủ
- **Đồng hồ cờ** cho cả offline và online (3/5/10/15 phút hoặc ∞), hết giờ xử thua
- **Lịch sử nước đi** đánh số, highlight nước cuối
- **Chat** giữa 2 người chơi trong phòng online
- **Xin hòa / Đầu hàng / Chơi lại (đổi màu)** trong phòng online
- **Xử lý mất kết nối**: banner đếm ngược 30s, tự động lấy lại chỗ, khôi phục state + lịch sử chat
- **Âm thanh** tổng hợp bằng Web Audio (đi/ăn/chiếu/hết cờ/nhập thành/phong cấp/thắng/thua) — không cần file âm thanh, bật/tắt trong Cài đặt
- **Animation** nhẹ (quân trượt, capture ring, king shake, modal), tôn trọng `prefers-reduced-motion`, tắt/bật được trong Settings
- **Responsive** từ mobile (375px) đến desktop
- **Lưu cài đặt** (tên, âm thanh, màu bàn cờ, độ khó mặc định) vào localStorage

## Tech Stack

**Frontend** (`client/`)

- React 19 + TypeScript (strict) + Vite
- Tailwind CSS v4
- React Router 7 (HashRouter — bản build mở được trực tiếp qua `file://`)
- chess.js 1.4 (luật cờ)
- zustand 5 (state, persist localStorage)
- socket.io-client 4.8

**Backend** (`server/`)

- Node.js + Express 5
- Socket.IO 4 — room, game, chat realtime
- chess.js phía server — **server là nguồn sự thật**, xác thực mọi nước đi

**AI** — Minimax + Alpha-Beta Pruning + Quiescence Search + Iterative Deepening (giới hạn thời gian), Evaluation: material + piece-square tables + cấu trúc tốt + an toàn vua. Chạy trong Web Worker để không khựng UI.

## Folder Structure

```
chess-arena/
├── client/                      # Frontend
│   ├── scripts/                 # Test tự động (luật cờ, AI)
│   ├── public/                  # favicon
│   └── src/
│       ├── ai/                  # AI engine: minimax, evaluation, moveOrdering,
│       │                        #   difficulty (3 mức), chessAI (điều phối), aiWorker (Web Worker)
│       ├── chess/               # ChessGame engine (bao bọc chess.js), moveValidator,
│       │                        #   chessRules (trạng thái/kết quả), chessUtils
│       ├── components/
│       │   ├── chess/           # ChessBoard, ChessSquare, ChessPiece, PromotionDialog,
│       │   │                    #   MoveIndicator, CheckIndicator
│       │   ├── player/          # PlayerPanel, PlayerAvatar, PlayerInfo, PlayerStatus
│       │   ├── clock/           # ChessClock, TimeDisplay
│       │   ├── moves/           # MoveHistory, MoveItem
│       │   ├── game/            # GameHeader, GameResult, GameControls, ResignButton,
│       │   │                    #   DrawButton, RematchButton
│       │   ├── chat/            # ChatBox, ChatMessage, ChatInput
│       │   ├── room/            # RoomCode, CopyRoomCodeButton, RoomStatus
│       │   └── common/          # Button, Modal, ErrorMessage, Toast
│       │   └── settings/        # SettingsContent (dùng chung), SettingsDrawer
│       ├── pages/               # HomePage, OfflineGamePage, OnlineLobbyPage,
│       │                        #   OnlineGamePage, SettingsPage
│       ├── online/              # socketClient, roomService, gameSync, reconnect
│       ├── state/               # gameStore, roomStore, settingsStore, playerStore, uiStore (zustand)
│       ├── services/            # soundService (SFX), musicService (nhạc nền), storageService
│       ├── hooks/               # useChessGame, useChessAI, useChessClock,
│       │                        #   useOnlineGame, useSound
│       ├── types/               # chess, room, socket (domain types)
│       ├── constants/           # chess (board themes), pieceSets, game, difficulty, socketEvents
│       └── utils/               # formatTime, localStorage, validation
│
├── server/                      # Backend Socket.IO
│   ├── scripts/                 # onlineSmokeTest.mjs (smoke test 24 assertions)
│   └── src/
│       ├── config/              # cấu hình (port, CORS, grace time, cleanup)
│       ├── game/                # GameManager (xác thực nước đi), GameState,
│       │                        #   MoveValidator, ChessClock (đồng hồ server)
│       ├── rooms/               # RoomManager, Room (entity phòng + chat history)
│       ├── services/            # roomService, gameService (điều phối)
│       ├── socket/              # socketServer, roomSocket, gameSocket, chatSocket
│       ├── middleware/          # socketAuth (xác thực handshake)
│       ├── controllers/         # REST: /health, /rooms/:code
│       ├── types/ utils/ config/
│       └── server.ts            # Entry point
│
└── package.json                 # npm workspaces + script chung
```

**Nguyên tắc kiến trúc**: UI → Hooks → State/Services → Core logic → Utils/Types. Một file = một trách nhiệm. Client và server giao tiếp qua hợp đồng Socket.IO events (mirror ở 2 bên).

## Installation

```bash
npm install
```

## Run Frontend

```bash
npm run dev
# → http://localhost:5173
```

## Run Backend

```bash
npm run server
# → http://localhost:3001 (chỉ cần khi chơi Online)
```

## Build

```bash
npm run build
# → client/dist — mở trực tiếp dist/index.html để chơi offline (AI vẫn chạy)
```
## web

```bash
http://vuacovua.id.vn
```
## Test tự động

```bash
# Luật cờ vua trên engine (15 assertions)
npm run test:rules --workspace client

# AI 3 mức độ + bắt chiếu hết
npm run test:ai --workspace client

# Smoke test backend (24 assertions, cần server đang chạy)
npm run test:online --workspace server
```

## How to Play Offline

1. Mở `http://localhost:5173` (hoặc mở thẳng `dist/index.html`)
2. Chọn **🤖 Chơi với máy**
3. Chọn **Độ khó** (🟢 Tân Binh / 🟡 Kỳ Thủ / 🔴 Đại Kiện Tướng), **Quân của bạn** (Trắng/Đen/Ngẫu nhiên), **Thời gian** (∞/3/5/10/15 phút)
4. Nhấn **Bắt đầu trận đấu** → chơi!

Mọi thứ chạy hoàn toàn phía client — mất Internet vẫn chơi bình thường.

## How to Create Online Room

1. Chọn **🌐 Chơi Online**
2. Nhập tên của bạn, chọn quân + thời gian
3. Nhấn **🏠 Tạo phòng** → hệ thống tạo **Room Code** (ví dụ `X7K9P2`)
4. Nhấn **🔗 Copy invite link** (hoặc 📋 copy mã) và gửi cho đối thủ — đối thủ mở link sẽ vào thẳng phòng
5. Chờ đối thủ tham gia — ván bắt đầu tự động

## How to Join Room

1. Chọn **🌐 Chơi Online**
2. Nhập tên của bạn
3. Nhập **mã phòng** nhận được (6 ký tự)
4. Nhấn **🚪 Tham gia phòng** → ván bắt đầu

Trong phòng bạn có thể: chat với đối thủ, **½ xin hòa**, **🏳️ đầu hàng**, **🔁 mời chơi lại** (tự đổi màu), hoặc rời phòng. Nếu đối thủ mất kết nối, màn hình hiện đếm ngược 30s — đối thủ quay lại trong thời gian đó thì ván tiếp tục nguyên vẹn.
