import { useState } from 'react'
import { Button } from '../common/Button'
import { pushToast } from '../../state/uiStore'

interface CopyInviteLinkButtonProps {
  code: string
}

/** Copy link mời vào phòng — domain lấy từ browser location, không hard-code */
export function CopyInviteLinkButton({ code }: CopyInviteLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const buildLink = (): string => {
    // HashRouter → link dạng origin/path#/game/CODE, hoạt động cả dev, Vercel và file://
    return `${window.location.origin}${window.location.pathname}#/game/${code}`
  }

  const copy = async () => {
    const link = buildLink()
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = link
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
    }
    setCopied(true)
    pushToast('Đã copy link mời — gửi cho đối thủ của bạn', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="primary" onClick={() => void copy()}>
      {copied ? '✓ Đã copy link mời!' : '🔗 Copy invite link'}
    </Button>
  )
}
