import { useState } from 'react'
import { Button } from '../common/Button'
import { pushToast } from '../../state/uiStore'

interface CopyRoomCodeButtonProps {
  code: string
}

/** Copy mã phòng vào clipboard với phản hồi "Đã copy" + toast */
export function CopyRoomCodeButton({ code }: CopyRoomCodeButtonProps) {
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
    pushToast(`Đã copy mã phòng: ${code}`, 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="secondary" onClick={() => void copy()}>
      {copied ? '✓ Đã copy!' : '📋 Copy mã phòng'}
    </Button>
  )
}
