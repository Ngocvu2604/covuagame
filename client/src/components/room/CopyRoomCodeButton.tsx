import { useState } from 'react'
import { Button } from '../common/Button'
import { pushToast } from '../../state/uiStore'
import { useT } from '../../i18n/translations'

interface CopyRoomCodeButtonProps {
  code: string
}

/** Copy mã phòng vào clipboard với phản hồi "Đã copy" + toast */
export function CopyRoomCodeButton({ code }: CopyRoomCodeButtonProps) {
  const t = useT()
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // Fallback cho trình duyệt không hỗ trợ Clipboard API
      const textarea = document.createElement('textarea')
      textarea.value = code
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
    }
    setCopied(true)
    pushToast(t('wait.toastCode', { code }), 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="secondary" onClick={() => void copy()}>
      {copied ? t('wait.copiedCode') : t('wait.copyCode')}
    </Button>
  )
}
