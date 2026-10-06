import { useEffect, useState } from 'react'
import { Button } from '../common/Button'
import { useT } from '../../i18n/translations'

interface ResignButtonProps {
  onConfirm: () => void
  disabled?: boolean
}

/** Nút đầu hàng với bước xác nhận để tránh nhầm lẫn */
export function ResignButton({ onConfirm, disabled = false }: ResignButtonProps) {
  const t = useT()
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (disabled) setConfirming(false)
  }, [disabled])

  if (!confirming) {
    return (
      <Button variant="danger" fullWidth disabled={disabled} onClick={() => setConfirming(true)}>
        {t('resign.button')}
      </Button>
    )
  }

  return (
    <div className="flex gap-2">
      <Button variant="danger" fullWidth onClick={onConfirm}>
        {t('resign.confirm')}
      </Button>
      <Button variant="ghost" onClick={() => setConfirming(false)}>
        {t('common.cancel')}
      </Button>
    </div>
  )
}
