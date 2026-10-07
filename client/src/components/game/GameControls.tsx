import { Button } from '../common/Button'
import { ResignButton } from './ResignButton'
import { useT } from '../../i18n/translations'

interface GameControlsProps {
  canResign: boolean
  onResign: () => void
  /** Quay lại màn hình tạo trận đấu */
  onChangeSetup: () => void
}

/** Khối nút điều khiển ván đấu trong sidebar */
export function GameControls({ canResign, onResign, onChangeSetup }: GameControlsProps) {
  const t = useT()
  return (
    <section
      aria-label={t('settings.gameplay')}
      className="flex flex-col gap-2 card p-3"
    >
      <ResignButton onConfirm={onResign} disabled={!canResign} />
      <Button variant="secondary" fullWidth onClick={onChangeSetup}>
        {t('offline.changeSetup')}
      </Button>
    </section>
  )
}
