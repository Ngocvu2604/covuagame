# 🛠 Appwrite Setup — Chess Arena Online 24/7

Hướng dẫn từng bước cấu hình Appwrite Cloud để chế độ **Chơi Online** chạy 24/7
(không cần máy cá nhân bật), không cần đăng ký/đăng nhập tài khoản cho người chơi.

> Không dùng Appwrite? Project vẫn chạy được với Socket.IO server tự host
> (provider cũ, tự động được dùng khi thiếu biến `VITE_APPWRITE_*`).

---

## 0. TỰ ĐỘNG SETUP BẰNG SCRIPT (khuyến nghị — thay cho mục 3→7)

Tất cả Database / Collections / Attributes / Indexes / Permissions được tạo
tự động bằng một script **idempotent** (chạy lại an toàn, resource đã tồn tại
sẽ được bỏ qua, không xóa document nào).

### Install

```bash
npm install node-appwrite
```

(Đã cài sẵn ở root workspace của project — bỏ qua bước này.)

### PowerShell

```powershell
$env:APPWRITE_ENDPOINT="https://YOUR_REGION.cloud.appwrite.io/v1"
$env:APPWRITE_PROJECT_ID="YOUR_PROJECT_ID"
$env:APPWRITE_API_KEY="YOUR_API_KEY"

node scripts/setup-appwrite.js
```

### Git Bash / Linux / macOS

```bash
export APPWRITE_ENDPOINT="https://YOUR_REGION.cloud.appwrite.io/v1"
export APPWRITE_PROJECT_ID="YOUR_PROJECT_ID"
export APPWRITE_API_KEY="YOUR_API_KEY"

node scripts/setup-appwrite.js
```

Hoặc dùng file `.env` ở root (copy từ `.env.example`, điền key):

```bash
node --env-file=.env scripts/setup-appwrite.js
```

### Script làm những gì

```
Appwrite
└── Database: chess-arena
    ├── Collection: rooms    (18 attributes + unique index `code`)
    ├── Collection: moves    (8 attributes + index moves-by-room)
    └── Collection: messages (5 attributes + index messages-by-room)
```

- Tạo xong attributes, script **poll trạng thái** (30 lần × 2s, không sleep mù)
  cho tới khi tất cả `available` rồi mới tạo indexes; nếu có attribute `stuck`/timeout
  sẽ báo đúng tên attribute.
- Resource đã tồn tại → in `ℹ Already exists` và tiếp tục (không lỗi, không xóa gì).
- Terminal in `APPWRITE SETUP COMPLETED` khi xong, hoặc `APPWRITE_SETUP_COMPLETE = NO`
  kèm lý do nếu dừng giữa chừng.

### Troubleshooting: "The maximum number of databases allowed for the selected plan has reached" (HTTP 403)

Gói Free của bạn đã dùng hết số lượng database trong organization/project. Script hỗ trợ 3 lựa chọn:

- **A. Tái sử dụng database có sẵn** (nhanh nhất): script sẽ in ra danh sách database hiện có →
  chạy lại với `APPWRITE_DATABASE_ID=<database-id>` — collections `rooms/moves/messages`
  được tạo trong database đó, không đụng dữ liệu cũ. Nhớ đặt `VITE_APPWRITE_DATABASE_ID`
  (client) bằng đúng giá trị này.
- **B. Free slot**: Appwrite Console → Databases → xoá 1 database không còn dùng → chạy lại script.
- **C. Organization/Project mới**: tạo organization mới (miễn phí) → project mới → API key mới →
  chạy lại script với endpoint/project id của project đó.

### Permissions được script thiết lập

Mỗi collection: **Any authenticated user** (`users` — bao gồm anonymous session)
cho **Create / Read / Update / Delete** + `documentSecurity: true`.
Chi tiết cơ chế bảo mật nước đi: xem mục 9 bên dưới.

### API Key cần scopes gì

Console → **Integrations → API Keys → Create API Key** — tick đủ các scope sau
(hoặc chọn **All scopes** cho nhanh — key chỉ dùng cục bộ trên máy bạn, không commit):

```
databases.read      databases.write
collections.read    collections.write
attributes.read     attributes.write
indexes.read        indexes.write
```

⚠️ Nếu thiếu scope, script sẽ báo `missing scopes (["collections.read"])` và in ra
đúng scope cần bổ sung — sửa key rồi chạy lại.

---

## 1. Tạo Project + Web Platform (vẫn cần làm tay)

1. Đăng ký [cloud.appwrite.io](https://cloud.appwrite.io) (gói **Free**, có thể đăng nhập bằng GitHub).
2. **Create project** → tên `chess-arena` → tạo xong, vào **Settings** ghi lại:
   - **Project ID** → dùng cho `VITE_APPWRITE_PROJECT_ID`
   - **API Endpoint** → dùng cho `VITE_APPWRITE_ENDPOINT` (dạng `https://<region>.cloud.appwrite.io/v1`)
3. **Settings → Platforms → Add platform → Web app**:
   - Name: `chess-arena-web`
   - Hostname: domain của bạn (ví dụ `mydomain.com`) — **thêm cả `localhost`** để dev local.
     (Appwrite chỉ kiểm tra hostname cho CORS/web — nhớ thêm cả hai.)

## 2. Bật Anonymous Authentication

**Auth → Sign in methods → Anonymous → bật ON → Update.**

Mỗi người chơi mở web sẽ có một anonymous session + `userId` riêng — đây chính là
`anonymousUserId` dùng để phân ghế Trắng/Đen, KHÔNG cần email/password.

## 3. Tạo Database

**Databases → Create database** → name `chess-arena` → ghi lại **Database ID**
(dùng cho `VITE_APPWRITE_DATABASE_ID`, ví dụ đặt id là `chess-arena`).

## 4. Collection `rooms` — 1 document = 1 phòng

**Databases → chess-arena → Create collection** → Collection ID: `rooms` (hoặc tự sinh, ghi lại).

### Attributes (Settings → Attributes → Add attribute)

| Key               | Type    | Size | Required | Default | Ghi chú |
|-------------------|---------|------|----------|---------|---------|
| `code`            | String  | 8    | ✅       | —       | Mã phòng 6 ký tự |
| `status`          | String  | 16   | ✅       | —       | `waiting` / `playing` / `finished` / `abandoned` |
| `timeMinutes`     | Integer | —    | ✅       | `0`     | 0 = không giới hạn |
| `whitePlayerId`   | String  | 64   | ✅       | —       | anonymous user id cầm Trắng |
| `whitePlayerName` | String  | 32   | ✅       | —       | |
| `blackPlayerId`   | String  | 64   | ✅       | —       | |
| `blackPlayerName` | String  | 32   | ✅       | —       | |
| `whiteMs`         | Integer | —    | ✅       | `0`     | ms còn lại |
| `blackMs`         | Integer | —    | ✅       | `0`     | ms còn lại |
| `turnStartedAt`   | Integer | —    | ✅       | `0`     | epoch ms lượt hiện tại bắt đầu |
| `turn`            | String  | 8    | ✅       | `white` | Bên tới lượt |
| `gameNumber`      | Integer | —    | ✅       | `1`     | Tăng khi rematch |
| `winner`          | String  | 16   | ✅       | —       | `white` / `black` / rỗng (hòa) |
| `resultReason`    | String  | 32   | ✅       | —       | checkmate/resignation/... |
| `drawOfferedBy`   | String  | 64   | ✅       | —       | userId đang xin hòa |
| `rematchOfferedBy`| String  | 64   | ✅       | —       | userId đang mời chơi lại |
| `whiteLastSeenAt` | Integer | —    | ✅       | `0`     | presence |
| `blackLastSeenAt` | Integer | —    | ✅       | `0`     | presence |

### Indexes (Settings → Indexes → Create index)

| Index  | Type | Attributes | Order |
|--------|------|------------|-------|
| `code` | Unique | `code` (ASC) | — |

## 5. Collection `moves` — 1 document = 1 nước đi (append-only)

Attributes:

| Key         | Type    | Size | Required | Default |
|-------------|---------|------|----------|---------|
| `roomId`    | String  | 64   | ✅       | —       | `$id` của room document |
| `gameNumber`| Integer | —    | ✅       | `1`     | |
| `ply`       | Integer | —    | ✅       | —       | Số thứ tự nước (1, 2, 3…) |
| `userId`    | String  | 64   | ✅       | —       | Ai đi nước này |
| `color`     | String  | 8    | ✅       | —       | `white` / `black` |
| `from`      | String  | 8    | ✅       | —       | ví dụ `e2` |
| `to`        | String  | 8    | ✅       | —       | ví dụ `e4` |
| `promotion` | String  | 4    | ✅       | —       | `q`/`r`/`b`/`n` hoặc rỗng |

Indexes:

| Index  | Type | Attributes |
|--------|------|------------|
| `moves-by-room` | Key | `roomId` (ASC), `gameNumber` (ASC), `ply` (ASC) |

## 6. Collection `messages` — chat

Attributes:

| Key      | Type    | Size | Required | Default |
|----------|---------|------|----------|---------|
| `roomId` | String  | 64   | ✅       | —       |
| `userId` | String  | 64   | ✅       | —       |
| `name`   | String  | 32   | ✅       | —       |
| `text`   | String  | 200  | ✅       | —       |
| `sentAt` | Integer | —    | ✅       | —       |

Indexes: Key `roomId` (ASC) + `sentAt` (ASC).

## 7. Permissions cho cả 3 collection

Mỗi collection → **Settings → Permissions → Add role**:

- **Any authenticated user** (tức `users`) cho **Create, Read, Update, Delete**.

> Vì tất cả người chơi đều là anonymous session (= authenticated user), quyền này
> cho phép client tạo phòng, vào phòng, đi quân, chat trực tiếp mà không cần server.
>
> **Bảo mật nước đi KHÔNG dựa vào quyền ghi** mà dựa vào lớp **replay** ở
> `client/src/online/appwrite/stateReplay.ts`: mọi client tự replay toàn bộ nước đi
> qua chess.js và **loại bỏ** nước không hợp lệ / đi sai lượt / tự nhận màu người khác.
> Muốn cứng hơn nữa: thêm Appwrite Function xác thực move (xem mục 9).

## 8. Environment Variables

Local: copy `client/.env.example` → `client/.env` và điền thật.

Vercel: **Project → Settings → Environment Variables** thêm cùng các biến sau:

```env
VITE_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=xxxxxxxxxxxxxxxxxxxx
VITE_APPWRITE_DATABASE_ID=chess-arena
VITE_APPWRITE_ROOMS_COLLECTION_ID=rooms
VITE_APPWRITE_MOVES_COLLECTION_ID=moves
VITE_APPWRITE_MESSAGES_COLLECTION_ID=messages
```

Sau khi thêm → **Redeploy** để build mới nhận biến (biến `VITE_*` được nhúng lúc build).

## 9. Bảo mật — mức hiện tại và đường nâng cấp

Đã đảm bảo (không cần server riêng):

- ✅ Không ai tự khai báo "tôi cầm Trắng" — màu suy ra từ anonymousUserId đối chiếu ghế trong document
- ✅ Người thứ ba không thể đi hộ: nước đi của họ bị replay loại (userId không khớp ghế nào)
- ✅ Sai lượt / nước không hợp lệ / trùng ply → bị replay loại đồng nhất trên mọi client
- ✅ Move document của mỗi người chỉ có chính họ ghi đè được (document-level write: user riêng)

Hạn chế (thú thật):

- ⚠️ Vì mọi anonymous session có quyền ghi collection, một người rành kỹ thuật có thể
  can thiệp **metadata** của phòng (status/winner…) nếu chủ ý phá. Nước đi vẫn an toàn nhờ replay.
- 🔒 Nâng cấp: tạo **Appwrite Function** (Node) `apply-move` — client gọi function thay vì ghi
  trực tiếp; function dùng `appwrite-node-sdk` + chess.js validate rồi mới cập nhật.
  Function chạy server-side với API key → chặn hoàn toàn can thiệp. Gói Free có quota
  function executions đủ dùng cho game casual.

## 10. Giới hạn Free / GitHub Student Pack

- **Appwrite Cloud Free**: giới hạn requests/bandwidth/tháng và số function executions
  — số liệu cụ thể thay đổi theo thời gian, kiểm tra [appwrite.io/pricing](https://appwrite.io/pricing).
  Đủ cho game casual với nhóm bạn; không phải "free unlimited".
- **Vercel Hobby**: 100GB bandwidth/tháng, build mỗi ngày — dư cho frontend tĩnh.
- **GitHub Student Developer Pack**: có credits **DigitalOcean** (~$200/năm) —
  dùng VPS đó **self-host Appwrite** (Docker) nếu muốn không giới hạn của cloud:
  `docker run -d -p 80:80 appwrite/appwrite` (hướng dẫn đầy đủ tại appwrite.io/docs/installation).
  Khi đó `VITE_APPWRITE_ENDPOINT` trỏ tới `https://appwrite.mydomain.com/v1` trên VPS.

## 11. Vận hành

- Phòng `abandoned`/`finished` nằm lại database làm lịch sử (tra theo anonymousUserId).
- Dọn dẹp định kỳ (tùy chọn): Appwrite Function theo lịch (schedule) xoá document cũ hơn 7 ngày.
