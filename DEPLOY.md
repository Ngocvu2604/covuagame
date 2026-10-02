# 🚀 Deploy Chess Arena online 24/7

Tài liệu này trả lời: **làm sao để website chạy liên tục kể cả khi máy tính cá nhân tắt**, và cách nối **domain riêng** vào dự án.

## 0. Tổng quan hạ tầng

```
DOMAIN (mydomain.com)
   ↓  DNS (A / CNAME record)
HOSTING
   ├── Frontend (React/Vite build tĩnh)  → Vercel / Netlify / Cloudflare Pages / Nginx trên VPS
   └── Backend  (Node.js + Socket.IO)    → VPS / Render / Railway (CẦN server có trạng thái)
         ↘ rooms + games đang lưu TRONG RAM của process Node
```

> ⚠️ Quan trọng: rooms/games hiện đang lưu **trong bộ nhớ** của server Node. Muốn chạy 24/7 đúng nghĩa,
> backend PHẢI chạy trên một máy luôn bật (VPS hoặc PaaS luôn-on). Frontend tĩnh thì deploy ở đâu cũng được.
> Về lâu dài nên thêm Redis/DB cho rooms (xem mục 6) để backend có thể scale/restart không mất ván.

---

## 1. Cách nhanh nhất (không cần VPS): Vercel (frontend) + Render/Railway (backend)

### 1a. Deploy backend lên Render (miễn phí tier có sleeps — xem lưu ý)

1. Push project lên GitHub.
2. Trên [render.com](https://render.com) → **New → Web Service** → chọn repo.
3. Cấu hình:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start` (chạy `node dist/server.js`)
   - **Instance type**: Free (⚠️ free tier **sleep sau 15 phút không có traffic** — socket kết nối lại sẽ tự đánh thức, nhưng ván đang chơi trong RAM sẽ MẤT khi sleep. Để 24/7 thật sự hãy dùng Starter ~$7/tháng hoặc VPS).
4. Environment variables (nếu cần): `PORT` (Render tự set), `CORS_ORIGINS=https://mydomain.com`
5. Sau khi deploy bạn có URL dạng `https://chess-arena-api.onrender.com`.

### 1b. Deploy frontend lên Vercel

1. Trên [vercel.com](https://vercel.com) → **Add New → Project** → chọn repo GitHub.
2. Cấu hình:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite (tự nhận)
   - **Build Command**: `npm run build` · **Output Directory**: `dist`
3. Environment variable: `VITE_SERVER_URL=https://chess-arena-api.onrender.com`
   (client đọc biến này trong `src/online/socketClient.ts` — nếu bỏ trống sẽ mặc định trỏ `http://localhost:3001` → **bắt buộc phải set khi deploy**).
4. Deploy → có URL `https://chess-arena.vercel.app`.

### 1c. Nối domain riêng vào Vercel

Giả sử domain `mydomain.com` (mua ở Namecheap/GoDaddy/Porkbun...):

1. Vercel → Project → **Settings → Domains** → thêm `mydomain.com` và `www.mydomain.com`.
2. Vercel hiển thị DNS record cần tạo — về nhà đăng ký domain, tạo:

| Type  | Name  | Value                | Ghi chú |
|-------|-------|----------------------|---------|
| A     | `@`   | `76.76.21.21`        | apex domain → Vercel |
| CNAME | `www` | `cname.vercel-dns.com` | www → Vercel |

3. **Xóa các record cũ gây conflict**: record `A`/`AAAA`/`CNAME` khác đang trỏ `@` hoặc `www`
   (đặc biệt nếu domain từng trỏ nơi khác). Nếu registrar bắt buộc dùng nameserver riêng của họ,
   có thể đổi **Nameservers** của domain về Vercel (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`) —
   khi đó quản lý record ngay trong Vercel, không cần tạo tay.
4. **SSL**: Vercel tự cấp + gia hạn certificate Let's Encrypt cho cả `mydomain.com` và `www` —
   không cần cấu hình gì. Chờ propagation 5–60 phút, kiểm tra `https://mydomain.com` hiện ổ khóa.
5. Backend (Render) cũng hỗ trợ **Custom Domain**: Settings → Custom Domains → thêm
   `api.mydomain.com` → tạo `CNAME api → <render-url>`. Khi đó set
   `VITE_SERVER_URL=https://api.mydomain.com` ở Vercel để URL thống nhất.

---

## 2. Cách "thật" 24/7 + kiểm soát đầy đủ: VPS (Hetzner/DigitalOcean/Vultr ~$4–6/tháng)

### 2a. Cài đặt server (Ubuntu 22.04+)

```bash
# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git
sudo npm install -g pm2

# Tải code
git clone https://github.com/<bạn>/chess-arena.git && cd chess-arena

# Backend
npm install
npm run build --workspace server          # → server/dist

# Frontend
npm install
npm run build --workspace client          # → client/dist
```

### 2b. Chạy backend bằng PM2 (tự restart khi crash / reboot)

```bash
pm2 start server/dist/server.js --name chess-arena-api
pm2 save                  # lưu danh sách process
pm2 startup               # in ra 1 lệnh sudo — chạy lệnh đó để PM2 tự khởi động cùng máy
```

- PM2 **tự restart process nếu crash** ✓
- `pm2 startup` + `pm2 save` → **tự chạy lại khi VPS reboot** ✓
- VPS luôn bật → website chạy 24/7 kể cả khi máy cá nhân tắt ✓

### 2c. Nginx: serve frontend + reverse-proxy backend (WebSocket)

Tạo `/etc/nginx/sites-available/chess-arena`:

```nginx
server {
    listen 80;
    server_name mydomain.com www.mydomain.com;

    # Frontend (file tĩnh từ build)
    root /var/www/chess-arena/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;   # SPA fallback
    }

    # Backend Socket.IO (cần hỗ trợ WebSocket upgrade)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /health {
        proxy_pass http://127.0.0.1:3001;
    }
    location /rooms/ {
        proxy_pass http://127.0.0.1:3001;
    }
}
```

> Nếu dùng cấu hình này (Nginx proxy cùng domain), frontend KHÔNG cần
> `VITE_SERVER_URL` — sửa `socketClient.ts` bỏ default localhost hoặc set
> `VITE_SERVER_URL=` (rỗng) khi build để dùng cùng origin.

```bash
sudo ln -s /etc/nginx/sites-available/chess-arena /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 2d. HTTPS/SSL miễn phí bằng Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d mydomain.com -d www.mydomain.com
# Certbot tự cấu hình SSL + tự gia hạn (systemd timer)
```

### 2e. DNS trỏ về VPS

Tại nhà đăng ký domain:

| Type | Name | Value           |
|------|------|-----------------|
| A    | `@`  | `<IP VPS của bạn>` |
| A    | `www`| `<IP VPS của bạn>` |

(Xóa record cũ conflict nếu có.) Chờ propagation (5 phút – 24 giờ, thường ~10 phút),
kiểm tra `https://mydomain.com`.

### 2f. Firewall

```bash
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
```

---

## 3. Tắt máy cá nhân thì website có còn chạy không?

| Hình thức | Tắt máy cá nhân còn chạy? | Lý do |
|-----------|---------------------------|-------|
| `npm run dev` trên máy cá nhân | ❌ KHÔNG | dev server chạy trong máy bạn, tắt máy = tắt web |
| `npm start` trên máy cá nhân | ❌ KHÔNG | cùng lý do |
| Vercel + Render (PaaS) | ✅ CÓ | code chạy trên máy chủ của họ, luôn bật (Render free tier có sleep) |
| VPS + PM2 + Nginx | ✅ CÓ | code chạy trên VPS luôn bật, PM2 tự restart |

Máy cá nhân của bạn chỉ cần để **push code lên GitHub** — sau đó mọi thứ chạy trên server.

---

## 4. Checklist sau khi deploy

- [ ] `https://mydomain.com` mở được, có ổ khóa SSL
- [ ] `https://api.mydomain.com/health` (hoặc `/health` trên domain) trả `{"ok":true}`
- [ ] Chơi online 2 thiếtប (điện thoại + máy tính) nối được phòng
- [ ] `pm2 list` hiển thị `online`
- [ ] `pm2 restart chess-arena-api` → web vẫn hoạt động sau restart
- [ ] VPS reboot → `pm2 startup` đã cấu hình → API tự chạy lại

## 5. Lựa chọn khác

- **Cloudflare Pages** (frontend): tương tự Vercel, kèm CDN toàn cầu.
- **Railway/Fly.io** (backend): chạy Node + keep-alive, hỗ trợ WebSocket, có gói nhỏ.
- **Caddy** thay Nginx: tự động SSL không cần certbot (`mydomain.com { reverse_proxy ... }`).

## 6. Việc nên làm tiếp cho production (không bắt buộc để chạy)

- Lưu rooms/games vào **Redis** thay vì RAM → restart server không mất ván, scale nhiều instance được.
- Rate-limit chat/move (`socket.io` middleware) để chống spam.
- Logging zentral (pm2 logs / pino) + monitoring (UptimeRobot ping `/health` miễn phí).
