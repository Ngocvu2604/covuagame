import { Button } from '../common/Button'
import { useT } from '../../i18n/translations'

interface RematchButtonProps {
  visible: boolean
  offerSentByMe: boolean
  /** Có lời mời từ đối thủ → modal xử lý, ẩn nút */
  incomingOffer: boolean
  /** Lời mời của tôi vừa bị đối thủ từ chối */
  declined: boolean
  onOffer: () => void
}

/** Nút mời chơi lại — chỉ hiện khi ván đã kết thúc, 3 trạng thái phản hồi */
export function RematchButton({ visible, offerSentByMe, incomingOffer, declined, onOffer }: RematchButtonProps) {
  const t = useT()
  if (!visible || incomingOffer) return null

  if (declined) {
    return (
      <Button variant="danger" fullWidth disabled>
        {t('rematch.declinedBtn')}
      </Button>
    )
  }

  return (
    <Button variant="primary" fullWidth disabled={offerSentByMe} onClick={onOffer}>
      {offerSentByMe ? t('rematch.offered') : t('rematch.offer')}
    </Button>
  )
}
