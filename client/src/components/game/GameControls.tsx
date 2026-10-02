import { Button } from '../common/Button'
import { ResignButton } from './ResignButton'

interface GameControlsProps {
  canResign: boolean
  onResign: () => void
  /** Quay lại màn hình tạo trận đấu */
  onChangeSetup: () => void
}

/** Khối nút điều khiển ván đấu trong sidebar */
export function GameControls({ canResign, onResign, onChangeSetup }: GameControlsProps) {
  return (
    <section
      aria-label="Điều khiển ván đấu"
      className="flex flex-col gap-2 rounded-xl border border-white/5 bg-slate-900/60 p-3"
    >
      <ResignButton onConfirm={onResign} disabled={!canResign} />
      <Button variant="secondary" fullWidth onClick={onChangeSetup}>
        Đổi cấu hình / Ván mới
      </Button>
    </section>
  )
}
