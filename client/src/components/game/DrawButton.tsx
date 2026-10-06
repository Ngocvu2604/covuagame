import { Button } from '../common/Button'
import { useT } from '../../i18n/translations'

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
  const t = useT()
  if (!visible || incomingOffer) return null
  return (
    <Button variant="secondary" fullWidth disabled={!canOffer || offerSentByMe} onClick={onOffer}>
      {offerSentByMe ? t('draw.offered') : t('draw.offer')}
    </Button>
  )
}
