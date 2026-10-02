interface MoveIndicatorProps {
  /** 'move' = ô đích trống (chấm tròn), 'capture' = ô có quân đối phương (vòng tròn) */
  variant: 'move' | 'capture'
}

/** Ký hiệu ô đích hợp lệ trên bàn cờ */
export function MoveIndicator({ variant }: MoveIndicatorProps) {
  if (variant === 'capture') {
    return <span className="pointer-events-none absolute inset-[6%] rounded-full border-4 border-slate-900/35" />
  }

  return (
    <span className="pointer-events-none absolute left-1/2 top-1/2 h-[28%] w-[28%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900/30" />
  )
}
