interface PlayerStatusProps {
  label: string
  highlight?: boolean
}

/** Dòng trạng thái dưới tên: "Đến lượt", "Đang chờ", "Đang suy nghĩ…" */
export function PlayerStatus({ label, highlight = false }: PlayerStatusProps) {
  return (
    <p className={`text-xs ${highlight ? 'font-medium text-emerald-400' : 'text-slate-400'}`}>
      {label}
    </p>
  )
}
