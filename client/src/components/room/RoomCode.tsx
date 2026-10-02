interface RoomCodeProps {
  code: string
}

/** Hiển thị mã phòng to, dễ đọc, cho phép chọn để copy thủ công */
export function RoomCode({ code }: RoomCodeProps) {
  return (
    <p
      data-testid="room-code"
      className="select-all rounded-xl border border-emerald-500/40 bg-emerald-600/10 px-6 py-4 font-mono text-4xl font-bold tracking-[0.3em] text-emerald-300"
    >
      {code}
    </p>
  )
}
