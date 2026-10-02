import { Button } from '../common/Button'

interface DrawButtonProps {
  visible: boolean
  /** Chưa có lời mời hòa nào trên bàn */
  canOffer: boolean
  offerSentByMe: boolean
  /** Có lời mời từ đối thủ → hộp thoại modal xử lý, ẩn nút */
  incomingOffer: boolean
  onOffer: () => void
}

/** Nút xin hòa — ẩn khi có lời mời đến (modal đảm nhiệm) */
export function DrawButton({ visible, canOffer, offerSentByMe, incomingOffer, onOffer }: DrawButtonProps) {
  if (!visible || incomingOffer) return null
  return (
    <Button variant="secondary" fullWidth disabled={!canOffer || offerSentByMe} onClick={onOffer}>
      {offerSentByMe ? '½ Đã đề nghị hòa — chờ phản hồi…' : '½ Xin hòa'}
    </Button>
  )
}
