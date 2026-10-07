import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../../types/room'
import type { PlayerColor } from '../../types/chess'
import { ChatMessageItem } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { useT } from '../../i18n/translations'

interface ChatBoxProps {
  messages: ChatMessage[]
  yourColor: PlayerColor
  disabled?: boolean
  onSend: (text: string) => void
}

/** Hộp chat giữa 2 người chơi: danh sách bong bóng + ô nhập, tự cuộn xuống cuối */
export function ChatBox({ messages, yourColor, disabled = false, onSend }: ChatBoxProps) {
  const t = useT()
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (container) container.scrollTop = container.scrollHeight
  }, [messages.length])

  return (
    <section
      aria-label={t('chat.title')}
      className="flex flex-col card"
    >
      <p className="section-label border-b border-white/5 px-4 py-2">
        {t('chat.title')}
      </p>
      <div ref={containerRef} className="flex max-h-44 min-h-24 flex-col gap-1.5 overflow-y-auto p-3">
        {messages.length === 0 && <p className="text-sm text-slate-500">{t('chat.empty')}</p>}
        {messages.map((message, index) => (
          <ChatMessageItem
            key={`${message.sentAt}-${index}`}
            message={message}
            isMine={message.from === yourColor}
          />
        ))}
      </div>
      <div className="border-t border-white/5 p-3">
        <ChatInput disabled={disabled} onSend={onSend} />
      </div>
    </section>
  )
}
