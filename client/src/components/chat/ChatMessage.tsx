import type { ChatMessage } from '../../types/room'

interface ChatMessageItemProps {
  message: ChatMessage
  isMine: boolean
}

/** Bong bóng tin nhắn: của mình căn phải (xanh), của đối thủ căn trái */
export function ChatMessageItem({ message, isMine }: ChatMessageItemProps) {
  return (
    <div className={`flex max-w-[85%] flex-col ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
      <p className="mb-0.5 px-1 text-[11px] text-slate-500">{message.fromName}</p>
      <p
        className={`break-words rounded-2xl px-3 py-1.5 text-sm ${
          isMine ? 'bg-emerald-600/40 text-emerald-50' : 'bg-slate-800 text-slate-200'
        }`}
      >
        {message.text}
      </p>
    </div>
  )
}
