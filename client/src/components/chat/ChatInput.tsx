import { useState } from 'react'
import { Button } from '../common/Button'
import { CHAT_MESSAGE_MAX_LENGTH } from '../../constants/game'
import { useT } from '../../i18n/translations'

interface ChatInputProps {
  disabled?: boolean
  onSend: (text: string) => void
}

/** Ô nhập tin nhắn: Enter hoặc nút Gửi */
export function ChatInput({ disabled = false, onSend }: ChatInputProps) {
  const t = useT()
  const [text, setText] = useState('')

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
  }

  return (
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <input
        value={text}
        maxLength={CHAT_MESSAGE_MAX_LENGTH}
        onChange={(event) => setText(event.target.value)}
        placeholder={t('chat.placeholder')}
        aria-label={t('chat.title')}
        className="field-input min-w-0 px-3 py-1.5"
      />
      <Button type="submit" variant="secondary" disabled={disabled || !text.trim()}>
        {t('common.send')}
      </Button>
    </form>
  )
}
