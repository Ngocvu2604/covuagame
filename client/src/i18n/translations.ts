import { useMemo } from 'react'
import { useSettingsStore } from '../state/settingsStore'

/**
 * Hệ thống dịch Song ngữ (VI/EN) của Chess Arena.
 * - Từ điển phẳng 1 cấp, key là chuỗi tiếng Việt gốc (ngôn ngữ mặc định)
 *   → tra EN theo key; thiếu bản EN thì fallback về VI.
 * - useT() cho React components; getT() cho ngữ cảnh ngoài component (hooks/toast).
 */

export type Language = 'vi' | 'en'

const vi = {
  // Common
  'common.cancel': 'Hủy',
  'common.backHome': '← Về trang chủ',
  'common.save': 'Lưu',
  'common.send': 'Gửi',
  'common.yourTurn': 'Đến lượt',
  'common.waiting': 'Đang chờ',
  'common.close': 'Đóng',

  // Home
  'home.title': 'KING OF CHESS',
  'home.tagline': 'Chơi cờ. Vui vẻ.',
  'home.playVsAi': 'Chơi với máy',
  'home.playOnline': 'Chơi Online',
  'home.settings': 'Cài đặt',
  'home.offlineNote': 'Chơi với máy hoạt động hoàn toàn offline',

  // Game header
  'header.home': 'Về trang chủ',
  'header.settings': 'Cài đặt',

  // Lobby
  'lobby.yourName': 'TÊN CỦA BẠN',
  'lobby.namePlaceholder': 'Nhập tên của bạn',
  'lobby.createSection': 'TẠO PHÒNG MỚI',
  'lobby.yourColor': 'QUÂN CỦA BẠN',
  'lobby.colorWhite': 'Trắng',
  'lobby.colorBlack': 'Đen',
  'lobby.colorRandom': 'Ngẫu nhiên',
  'lobby.timeSection': 'THỜI GIAN (PHÚT)',
  'lobby.create': 'Tạo phòng',
  'lobby.or': 'HOẶC',
  'lobby.joinSection': 'THAM GIA PHÒNG',
  'lobby.codeLabel': 'Mã phòng',
  'lobby.join': 'Tham gia phòng',
  'lobby.back': '← Về trang chủ',
  'lobby.warnMisconfigured':
    '⚠ Bản deploy này chưa cấu hình Appwrite (thiếu biến VITE_APPWRITE_* trên Vercel). Chức năng Online sẽ không hoạt động — thêm biến vào Vercel rồi Redeploy (xem APPWRITE_SETUP.md).',
  'lobby.errNotFound': 'Không tìm thấy phòng.',
  'lobby.errFull': 'Phòng đã đầy.',
  'lobby.errFinished': 'Phòng này không còn hoạt động.',
  'lobby.errInvalidCode': 'Mã phòng không hợp lệ.',
  'lobby.errInvalidName': 'Tên người chơi không hợp lệ.',
  'lobby.errInvalidTime': 'Thời gian không hợp lệ.',
  'lobby.errAckTimeout': 'Máy chủ không phản hồi.',
  'lobby.errGeneric': 'Không thể kết nối máy chủ.',
  'lobby.errCodeLength': 'Mã phòng gồm đúng 6 ký tự.',

  // Invite page
  'invite.title': 'Tham gia phòng',
  'invite.joining': 'Đang vào phòng',
  'invite.backToLobby': 'Về sảnh Online',

  // Waiting screen
  'wait.title': 'Phòng đã được tạo!',
  'wait.share': 'Chia sẻ mã hoặc link mời cho đối thủ của bạn:',
  'wait.showCode': 'Hiện mã phòng',
  'wait.hideCode': 'Ẩn mã phòng',
  'wait.copyLink': 'Sao chép liên kết mời',
  'wait.copiedLink': '✓ Đã copy link mời!',
  'wait.copyCode': 'Copy mã phòng',
  'wait.copiedCode': '✓ Đã copy!',
  'wait.toastCode': 'Đã copy mã phòng: {code}',
  'wait.toastLink': 'Đã copy link mời — gửi cho đối thủ của bạn',
  'wait.status': 'Đang chờ đối thủ tham gia…',
  'wait.leave': '← Rời phòng',

  // Game screen
  'game.yourTurn': 'Đến lượt',
  'game.waiting': 'Đang chờ',
  'game.thinking': 'Đang suy nghĩ…',
  'game.white': 'Trắng',
  'game.black': 'Đen',
  'game.turnWhite': 'Đến lượt Trắng',
  'game.turnBlack': 'Đến lượt Đen',
  'game.aiName': 'Máy',
  'game.opponentDisconnected': '⌛ Mất kết nối — chờ quay lại…',
  'game.reconnectBanner': '⌛ Đối thủ mất kết nối — tự động xử thua sau {seconds}s…',
  'game.reconnectedToast': '{name} đã kết nối lại',
  'game.abandonWinToast': 'Đối thủ mất kết nối quá lâu — bạn thắng',
  'game.moveRejected': 'Nước đi bị từ chối ({error})',
  'game.leave': 'Rời phòng',
  'game.leaveConfirmTitle': 'Bạn có chắc muốn thoát không?',
  'game.leaveConfirmBody': 'Rời trận lúc đang chơi sẽ bị tính là thua.',
  'game.leaveConfirmGo': 'Thoát trận',
  'game.leaveConfirmStay': 'Tiếp tục đấu',
  'game.changeSetup': 'Đổi cấu hình / Ván mới',
  'game.newGame': 'Ván mới',
  'game.restoring': 'Đang khôi phục phiên phòng…',
  'game.initServerFail': 'Không thể kết nối tới máy chủ game',

  // Resign
  'resign.button': 'Đầu hàng',
  'resign.confirm': 'Xác nhận đầu hàng',

  // Draw
  'draw.offer': 'Xin hòa',
  'draw.offered': '½ Đã đề nghị hòa — chờ phản hồi…',
  'draw.modalTitle': 'Đối thủ đề nghị hòa',
  'draw.accept': 'Chấp nhận',
  'draw.decline': 'Từ chối',

  // Rematch
  'rematch.offer': 'Mời chơi lại',
  'rematch.offered': 'Đã mời chơi lại — chờ phản hồi…',
  'rematch.declinedBtn': 'Lời mời bị từ chối',
  'rematch.modalTitle': 'Đối thủ muốn chơi lại',
  'rematch.accept': 'Chấp nhận chơi lại',
  'rematch.resultLabel': 'Mời chơi lại',
  'rematch.resultWaiting': 'Đã mời chơi lại — chờ phản hồi…',
  'rematch.resultIncoming': 'Đối thủ muốn chơi lại',

  // Result overlay
  'result.wins': 'thắng!',
  'result.whiteWins': 'Trắng thắng',
  'result.blackWins': 'Đen thắng',
  'result.drawTitle': 'Hòa',
  'result.rematch': 'Mời chơi lại',
  'result.home': 'Về trang chủ',
  'reason.checkmate': 'Hết cờ',
  'reason.stalemate': 'Hết nước đi hợp lệ',
  'reason.threefold-repetition': 'Lặp lại nước đi 3 lần',
  'reason.fifty-move': 'Luật 50 nước',
  'reason.insufficient-material': 'Không đủ lực lượng chiếu hết',
  'reason.resignation': 'Đầu hàng',
  'reason.left': 'Rời trận',
  'reason.abandoned': 'Mất kết nối quá lâu',
  'reason.timeout': 'Hết giờ',
  'reason.agreement': 'Thỏa thuận hòa',

  // Promotion
  'promo.title': 'Phong cấp',
  'promo.cancel': 'Hủy',

  // Check
  'check.badge': 'Chiếu!',

  // Chat
  'chat.title': 'TIN NHẮN',
  'chat.placeholder': 'Nhập tin nhắn…',
  'chat.empty': 'Chúc đối thủ may mắn nào!',

  // History
  'history.title': 'LỊCH SỬ NƯỚC ĐI',
  'history.empty': 'Chưa có nước đi nào',

  // Offline setup
  'setup.title': 'Tạo trận đấu',
  'setup.subtitle': 'Chơi với máy — hoạt động hoàn toàn offline',
  'setup.difficulty': 'ĐỘ KHÓ',
  'setup.colorSection': 'QUÂN CỦA BẠN',
  'setup.colorWhite': 'Trắng',
  'setup.colorBlack': 'Đen',
  'setup.colorRandom': 'Ngẫu nhiên',
  'setup.timeSection': 'THỜI GIAN (PHÚT)',
  'setup.start': 'Bắt đầu trận đấu',
  'setup.back': '← Về trang chủ',

  // Difficulty
  'difficulty.easy': 'Tân Binh',
  'difficulty.easyDesc': 'Dành cho người mới',
  'difficulty.medium': 'Kỳ Thủ',
  'difficulty.mediumDesc': 'Thử thách vừa phải',
  'difficulty.hard': 'Đại Kiện Tướng',
  'difficulty.hardDesc': 'Thử thách cao',

  // Offline game screen
  'offline.headerTitle': 'Chơi với máy',
  'offline.newGame': 'Ván mới',
  'offline.changeSetup': 'Đổi cấu hình / Ván mới',
  'offline.whiteToMove': 'Đến lượt Trắng',
  'offline.blackToMove': 'Đến lượt Đen',

  // Invite
  'invite.invalidCode': 'Mã phòng không hợp lệ.',

  // Settings
  'settings.player': 'NGƯỜI CHƠI',
  'settings.namePlaceholder': 'Nhập tên của bạn',
  'settings.language': 'NGÔN NGỮ',
  'settings.languageSelect': 'Ngôn ngữ',
  'settings.langVi': '🇻🇳 Tiếng Việt',
  'settings.langEn': '🇬🇧 English',
  'settings.appearance': 'GIAO DIỆN',
  'settings.boardTheme': 'Bàn cờ',
  'settings.pieceSet': 'Bộ quân cờ',
  'settings.darkMode': 'Chế độ nền',
  'settings.dark': 'Tối',
  'settings.darkEn': '🌙 Dark',
  'settings.dim': 'Dịu',
  'settings.dimEn': '🌗 Dim',
  'settings.light': 'Sáng',
  'settings.lightEn': '☀️ Light',
  'settings.coordinates': 'Tọa độ',
  'settings.coordinatesDesc': 'Tọa độ A–H / 1–8 trên bàn cờ',
  'settings.animation': 'Hoạt ảnh',
  'settings.animationDesc': 'Hiệu ứng di chuyển và highlight',
  'settings.audio': 'ÂM THANH',
  'settings.music': 'Nhạc nền',
  'settings.musicDesc': 'Nhạc nền nhẹ (thay bằng file của bạn tại public/audio/background.mp3)',
  'settings.volume': 'Âm lượng',
  'settings.sfx': 'Hiệu ứng âm thanh',
  'settings.sfxDesc': 'Âm đi quân, ăn quân, chiếu…',
  'settings.gameplay': 'LƯỢT ĐI',
  'settings.moveMode': 'Cách di chuyển quân',
  'settings.moveModeDesc': 'Kéo-thả hoạt động tốt nhất bằng chuột; cảm ứng dùng bấm chọn',
  'settings.moveClick': 'Bấm chọn',
  'settings.moveDrag': 'Kéo & thả',
  'settings.moveBoth': 'Kết hợp',
  'settings.showLegalMoves': 'Hiện nước đi hợp lệ',
  'settings.showLastMove': 'Hiện nước cuối',
  'settings.defaultDifficulty': 'Độ khó mặc định (chơi với máy)',
  'settings.errName': 'Tên phải từ 1 đến 20 ký tự.',
}

export type TranslationKey = keyof typeof vi

const en: Partial<Record<TranslationKey, string>> = {
  'common.cancel': 'Cancel',
  'common.backHome': '← Back to home',
  'common.save': 'Save',
  'common.send': 'Send',
  'common.yourTurn': 'Your turn',
  'common.waiting': 'Waiting',
  'common.close': 'Close',

  'home.playVsAi': 'Play vs AI',
  'home.playOnline': 'Play Online',
  'home.settings': 'Settings',
  'home.title': 'KING OF CHESS',
  'home.tagline': 'Play Chess. Have Fun.',
  'home.offlineNote': 'Play vs AI works fully offline',

  'header.home': 'Back to home',
  'header.settings': 'Settings',

  'lobby.yourName': 'YOUR NAME',
  'lobby.namePlaceholder': 'Enter your name',
  'lobby.createSection': 'CREATE NEW ROOM',
  'lobby.yourColor': 'YOUR COLOR',
  'lobby.colorWhite': 'White',
  'lobby.colorBlack': 'Black',
  'lobby.colorRandom': 'Random',
  'lobby.timeSection': 'TIME (MINUTES)',
  'lobby.create': 'Create Room',
  'lobby.or': 'OR',
  'lobby.joinSection': 'JOIN ROOM',
  'lobby.codeLabel': 'Room code',
  'lobby.join': 'Join Room',
  'lobby.back': '← Back to home',
  'lobby.warnMisconfigured':
    '⚠ This deployment has no Appwrite config (missing VITE_APPWRITE_* on Vercel). Online will not work — add the env vars and Redeploy (see APPWRITE_SETUP.md).',
  'lobby.errNotFound': 'Room not found.',
  'lobby.errFull': 'Room is full.',
  'lobby.errFinished': 'This room is no longer active.',
  'lobby.errInvalidCode': 'Invalid room code.',
  'lobby.errInvalidName': 'Invalid player name.',
  'lobby.errInvalidTime': 'Invalid time control.',
  'lobby.errAckTimeout': 'Game server did not respond.',
  'lobby.errGeneric': 'Cannot connect to the game server.',
  'lobby.errCodeLength': 'Room code must be exactly 6 characters.',

  'invite.title': 'Join room',
  'invite.joining': 'Joining room',
  'invite.backToLobby': 'Back to lobby',
  'invite.invalidCode': 'Invalid room code.',

  'wait.title': 'Room created!',
  'wait.share': 'Share the code or invite link with your opponent:',
  'wait.showCode': 'Show room code',
  'wait.hideCode': 'Hide room code',
  'wait.copyLink': 'Copy invite link',
  'wait.copiedLink': '✓ Invite link copied!',
  'wait.copyCode': 'Copy room code',
  'wait.copiedCode': '✓ Copied!',
  'wait.toastCode': 'Room code copied: {code}',
  'wait.toastLink': 'Invite link copied — send it to your opponent',
  'wait.status': 'Waiting for opponent…',
  'wait.leave': '← Leave room',

  'game.yourTurn': 'Your turn',
  'game.waiting': 'Waiting',
  'game.thinking': 'Thinking…',
  'game.white': 'White',
  'game.black': 'Black',
  'game.turnWhite': 'White to move',
  'game.turnBlack': 'Black to move',
  'game.aiName': 'AI',
  'game.opponentDisconnected': '⌛ Disconnected — waiting…',
  'game.reconnectBanner': '⌛ Opponent disconnected — auto forfeit in {seconds}s…',
  'game.reconnectedToast': '{name} reconnected',
  'game.abandonWinToast': 'Opponent disconnected too long — you win',
  'game.moveRejected': 'Move rejected ({error})',
  'game.leave': 'Leave room',
  'game.leaveConfirmTitle': 'Are you sure you want to leave?',
  'game.leaveConfirmBody': 'Leaving during a game counts as a loss.',
  'game.leaveConfirmGo': 'Leave game',
  'game.leaveConfirmStay': 'Keep playing',
  'game.changeSetup': 'Change setup / New game',
  'game.newGame': 'New game',
  'game.restoring': 'Restoring room session…',
  'game.initServerFail': 'Cannot connect to the game server',

  'resign.button': 'Resign',
  'resign.confirm': 'Confirm resignation',

  'draw.offer': 'Offer draw',
  'draw.offered': '½ Draw offered — waiting…',
  'draw.modalTitle': 'Opponent offers a draw',
  'draw.accept': 'Accept',
  'draw.decline': 'Decline',

  'rematch.offer': 'Offer rematch',
  'rematch.offered': 'Rematch offered — waiting…',
  'rematch.declinedBtn': 'Rematch declined',
  'rematch.modalTitle': 'Opponent wants a rematch',
  'rematch.accept': 'Accept rematch',
  'rematch.resultLabel': 'Offer rematch',
  'rematch.resultWaiting': 'Rematch offered — waiting…',
  'rematch.resultIncoming': 'Opponent wants a rematch',

  'result.wins': 'wins!',
  'result.whiteWins': 'White wins',
  'result.blackWins': 'Black wins',
  'result.drawTitle': 'Draw',
  'result.rematch': 'Offer rematch',
  'result.home': 'Back to home',
  'reason.checkmate': 'Checkmate',
  'reason.stalemate': 'Stalemate',
  'reason.threefold-repetition': 'Threefold repetition',
  'reason.fifty-move': 'Fifty-move rule',
  'reason.insufficient-material': 'Insufficient material',
  'reason.resignation': 'Resignation',
  'reason.left': 'Left game',
  'reason.abandoned': 'Disconnected',
  'reason.timeout': 'Timeout',
  'reason.agreement': 'Draw agreed',

  'promo.title': 'Promotion',
  'promo.cancel': 'Cancel',

  'check.badge': 'Check!',

  'chat.title': 'MESSAGES',
  'chat.placeholder': 'Type a message…',
  'chat.empty': 'Say good luck to your opponent!',

  'history.title': 'MOVE HISTORY',
  'history.empty': 'No moves yet',

  'setup.title': 'Create match',
  'setup.subtitle': 'Play vs AI — works fully offline',
  'setup.difficulty': 'DIFFICULTY',
  'setup.colorSection': 'YOUR COLOR',
  'setup.colorWhite': 'White',
  'setup.colorBlack': 'Black',
  'setup.colorRandom': 'Random',
  'setup.timeSection': 'TIME (MINUTES)',
  'setup.start': 'Start match',
  'setup.back': '← Back to home',

  'difficulty.easy': 'Rookie',
  'difficulty.easyDesc': 'For beginners',
  'difficulty.medium': 'Expert',
  'difficulty.mediumDesc': 'A fair challenge',
  'difficulty.hard': 'Grandmaster',
  'difficulty.hardDesc': 'A tough challenge',

  'offline.headerTitle': 'Play vs AI',
  'offline.newGame': 'New game',
  'offline.changeSetup': 'Change setup / New game',
  'offline.whiteToMove': 'White to move',
  'offline.blackToMove': 'Black to move',


  'settings.player': 'PLAYER',
  'settings.namePlaceholder': 'Enter your name',
  'settings.language': 'LANGUAGE',
  'settings.languageSelect': 'Language',
  'settings.langVi': '🇻🇳 Tiếng Việt',
  'settings.langEn': '🇬🇧 English',
  'settings.appearance': 'APPEARANCE',
  'settings.boardTheme': 'Board Theme',
  'settings.pieceSet': 'Piece Set',
  'settings.darkMode': 'Theme',
  'settings.dark': 'Dark',
  'settings.dim': 'Dim',
  'settings.light': 'Light',
  'settings.coordinates': 'Coordinates',
  'settings.coordinatesDesc': 'A–H / 1–8 labels on the board',
  'settings.animation': 'Animation',
  'settings.animationDesc': 'Move and highlight effects',
  'settings.audio': 'AUDIO',
  'settings.music': 'Background Music',
  'settings.musicDesc': 'Soft ambient music (replace with your file at public/audio/background.mp3)',
  'settings.volume': 'Volume',
  'settings.sfx': 'Sound Effects',
  'settings.sfxDesc': 'Move, capture, check sounds…',
  'settings.gameplay': 'GAMEPLAY',
  'settings.moveMode': 'Piece movement style',
  'settings.moveModeDesc': 'Drag & drop works best with a mouse; touch uses click-to-move',
  'settings.moveClick': 'Click',
  'settings.moveDrag': 'Drag & drop',
  'settings.moveBoth': 'Both',
  'settings.showLegalMoves': 'Show Legal Moves',
  'settings.showLastMove': 'Show Last Move',
  'settings.defaultDifficulty': 'Default difficulty (vs AI)',
  'settings.errName': 'Name must be 1–20 characters.',
}

const dictionaries: Record<Language, Partial<Record<TranslationKey, string>>> = { vi, en }

export function translate(
  lang: Language,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  let text = dictionaries[lang]?.[key] ?? vi[key] ?? key
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replace(`{${name}}`, String(value))
    }
  }
  return text
}

/** Dùng trong ngữ cảnh ngoài React (toast, provider) */
export function getT(): (key: TranslationKey, params?: Record<string, string | number>) => string {
  const lang = useSettingsStore.getState().language
  return (key, params) => translate(lang, key, params)
}

/** Hook cho React components */
export function useT(): (key: TranslationKey, params?: Record<string, string | number>) => string {
  const language = useSettingsStore((s) => s.language)
  return useMemo(() => (key: TranslationKey, params?: Record<string, string | number>) => translate(language, key, params), [language])
}
