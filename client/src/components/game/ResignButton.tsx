import { useEffect, useState } from 'react'
import { Button } from '../common/Button'

interface ResignButtonProps {
  onConfirm: () => void
  disabled?: boolean
}

/** Nút đầu hàng với bước xác nhận để tránh nhầm lẫn */
export function ResignButton({ onConfirm, disabled = false }: ResignButtonProps) {
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (disabled) setConfirming(false)
  }, [disabled])

  if (!confirming) {
    return (
      <Button variant="danger" fullWidth disabled={disabled} onClick={() => setConfirming(true)}>
        🏳️ Đầu hàng
      </Button>
    )
  }

  return (
    <div className="flex gap-2">
      <Button variant="danger" fullWidth onClick={onConfirm}>
        Xác nhận đầu hàng
      </Button>
      <Button variant="ghost" onClick={() => setConfirming(false)}>
        Hủy
      </Button>
    </div>
  )
}
