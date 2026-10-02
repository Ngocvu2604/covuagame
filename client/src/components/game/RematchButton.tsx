import { Button } from '../common/Button'

interface RematchButtonProps {
  visible: boolean
  offerSentByMe: boolean
  /** Có lời mời từ đối thủ → modal xử lý, ẩn nút */
  incomingOffer: boolean
  onOffer: () => void
}

/** Nút mời chơi lại — chỉ hiện khi ván đã kết thúc */
export function RematchButton({ visible, offerSentByMe, incomingOffer, onOffer }: RematchButtonProps) {
  if (!visible || incomingOffer) return null
  return (
    <Button variant="primary" fullWidth disabled={offerSentByMe} onClick={onOffer}>
      {offerSentByMe ? '🔁 Đã mời chơi lại — chờ phản hồi…' : '🔁 Mời chơi lại'}
    </Button>
  )
}
