import type { ReactNode } from 'react'
import { BOARD_THEME_LIST } from '../../constants/chess'
import { DIFFICULTY_OPTIONS } from '../../constants/difficulty'
import { PIECE_SET_LIST } from '../../constants/pieceSets'
import { useSettingsStore } from '../../state/settingsStore'
import { useT } from '../../i18n/translations'

/**
 * Nội dung cài đặt dùng chung cho SettingsPage và SettingsDrawer.
 * Bố cục: Ngôn ngữ → Appearance (Bàn cờ / Bộ quân / Hiển thị) → Âm thanh → Lượt đi.
 * Mục dạng danh sách chọn (select): bàn cờ, bộ quân, cách di chuyển, độ khó.
 * Mọi thay đổi áp dụng NGAY LẬP TỨC và tự lưu vào localStorage qua persist.
 */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <p className="section-label">{title}</p>
      {children}
    </section>
  )
}

function Group({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-1 rounded-lg border border-white/5 bg-slate-800/40 px-3 py-2">{children}</div>
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <p className="min-w-0 text-sm text-slate-200">{label}</p>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-emerald-500' : 'bg-slate-700'
        } focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400`}
      >
        <span
          className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}

interface SelectOption<T extends string> {
  value: T
  label: string
}

function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (value: T) => void
  options: SelectOption<T>[]
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <p className="min-w-0 text-sm text-slate-200">{label}</p>
      <select
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value as T)}
        className="shrink-0 rounded-lg border border-white/10 bg-slate-800 px-2.5 py-1.5 text-sm text-slate-200 outline-none transition focus:border-emerald-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function SettingsContent() {
  const t = useT()
  const settings = useSettingsStore()

  return (
    <div className="flex flex-col gap-5">
      {/* NGÔN NGỮ — đầu tiên để người mới tìm được; tên ngôn ngữ giữ nguyên bản gốc cho dễ nhận biết */}
      <Section title={t('settings.language')}>
        <Group>
          <SelectField
            label={t('settings.languageSelect')}
            value={settings.language}
            onChange={settings.setLanguage}
            options={[
              { value: 'vi', label: 'Tiếng Việt' },
              { value: 'en', label: 'English' },
            ]}
          />
        </Group>
      </Section>

      <Section title={t('settings.appearance')}>
        <Group>
          <SelectField
            label={t('settings.boardTheme')}
            value={settings.boardTheme}
            onChange={settings.setBoardTheme}
            options={BOARD_THEME_LIST.map((theme) => ({ value: theme.id, label: theme.label }))}
          />
          <SelectField
            label={t('settings.pieceSet')}
            value={settings.pieceSet}
            onChange={settings.setPieceSet}
            options={PIECE_SET_LIST.map((set) => ({ value: set.id, label: set.label }))}
          />
          <SelectField
            label={t('settings.darkMode')}
            value={settings.displayMode}
            onChange={settings.setDisplayMode}
            options={[
              { value: 'dark', label: t('settings.dark') },
              { value: 'dim', label: t('settings.dim') },
              { value: 'light', label: t('settings.light') },
            ]}
          />
          <Toggle
            label={t('settings.coordinates')}
            checked={settings.showCoordinates}
            onChange={settings.setShowCoordinates}
          />
          <Toggle
            label={t('settings.animation')}
            checked={settings.animationsEnabled}
            onChange={settings.setAnimationsEnabled}
          />
        </Group>
      </Section>

      <Section title={t('settings.audio')}>
        <Group>
          <Toggle
            label={t('settings.music')}
            checked={settings.musicEnabled}
            onChange={settings.setMusicEnabled}
          />
          <div className="flex items-center gap-3 py-1">
            <span className="w-16 shrink-0 text-sm text-slate-200">{t('settings.volume')}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.musicVolume * 100)}
              onChange={(event) => settings.setMusicVolume(Number(event.target.value) / 100)}
              aria-label={t('settings.volume')}
              className="h-1.5 w-full cursor-pointer accent-emerald-500"
            />
            <span className="w-9 shrink-0 text-right text-xs tabular-nums text-slate-400">
              {Math.round(settings.musicVolume * 100)}%
            </span>
          </div>
          <Toggle
            label={t('settings.sfx')}
            checked={settings.soundEnabled}
            onChange={settings.setSoundEnabled}
          />
        </Group>
      </Section>

      <Section title={t('settings.gameplay')}>
        <Group>
          <SelectField
            label={t('settings.moveMode')}
            value={settings.moveMode}
            onChange={settings.setMoveMode}
            options={[
              { value: 'click', label: t('settings.moveClick') },
              { value: 'drag', label: t('settings.moveDrag') },
              { value: 'both', label: t('settings.moveBoth') },
            ]}
          />
          <Toggle
            label={t('settings.showLegalMoves')}
            checked={settings.showLegalMoves}
            onChange={settings.setShowLegalMoves}
          />
          <Toggle
            label={t('settings.showLastMove')}
            checked={settings.showLastMove}
            onChange={settings.setShowLastMove}
          />
        </Group>
        <SelectField
          label={t('settings.defaultDifficulty')}
          value={settings.defaultDifficulty}
          onChange={settings.setDefaultDifficulty}
          options={DIFFICULTY_OPTIONS.map((option) => ({
            value: option.id,
            label: t(option.nameKey),
          }))}
        />
      </Section>
    </div>
  )
}
