import type { ReactNode } from 'react'
import type { DisplayMode, Language, MoveMode } from '../../types/chess'
import type { DifficultyId } from '../../constants/difficulty'
import { BOARD_THEME_LIST } from '../../constants/chess'
import { DIFFICULTY_OPTIONS } from '../../constants/difficulty'
import { PIECE_SET_LIST } from '../../constants/pieceSets'
import { useSettingsStore } from '../../state/settingsStore'
import { useT } from '../../i18n/translations'
import { ChessPiece } from '../chess/ChessPiece'

/**
 * Nội dung cài đặt dùng chung cho SettingsPage và SettingsDrawer.
 * Bố cục: Ngôn ngữ → Appearance (bàn cờ, quân cờ, hiển thị) → Audio → Gameplay.
 * Mọi thay đổi áp dụng NGAY LẬP TỨC và tự lưu vào localStorage qua persist.
 */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{title}</p>
      {children}
    </section>
  )
}

function Group({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-1 rounded-xl border border-white/5 bg-slate-800/40 px-3 py-2">{children}</div>
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

function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  ariaLabel: string
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="grid grid-cols-3 gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-lg border px-2 py-2 text-xs font-medium transition sm:text-sm ${
            value === option.value
              ? 'border-emerald-500 bg-emerald-600/15 text-emerald-200'
              : 'border-white/10 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function SettingsContent() {
  const t = useT()
  const settings = useSettingsStore()

  return (
    <div className="flex flex-col gap-5">
      {/* NGÔN NGỮ — đầu tiên để người mới tìm được */}
      <Section title={t('settings.language')}>
        <Segmented<Language>
          ariaLabel={t('settings.language')}
          value={settings.language}
          onChange={settings.setLanguage}
          options={[
            { value: 'vi', label: t('settings.langVi') },
            { value: 'en', label: t('settings.langEn') },
          ]}
        />
      </Section>

      <Section title={t('settings.appearance')}>
        {/* Bàn cờ */}
        <div>
          <p className="mb-2 text-sm text-slate-200">{t('settings.boardTheme')}</p>
          <div className="grid grid-cols-4 gap-2">
            {BOARD_THEME_LIST.map((theme) => (
              <button
                key={theme.id}
                type="button"
                aria-pressed={settings.boardTheme === theme.id}
                onClick={() => settings.setBoardTheme(theme.id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border px-1.5 py-2 transition ${
                  settings.boardTheme === theme.id
                    ? 'border-emerald-500 bg-emerald-600/15'
                    : 'border-white/10 bg-slate-800/60 hover:bg-slate-800'
                }`}
              >
                <span aria-hidden className="flex overflow-hidden rounded-md ring-1 ring-white/10">
                  <span style={{ backgroundColor: theme.light }} className="h-5 w-5" />
                  <span style={{ backgroundColor: theme.dark }} className="h-5 w-5" />
                </span>
                <span className="text-[11px] leading-none text-slate-300">{theme.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quân cờ */}
        <div>
          <p className="mb-2 text-sm text-slate-200">{t('settings.pieceSet')}</p>
          <div className="grid grid-cols-4 gap-2">
            {PIECE_SET_LIST.map((set) => (
              <button
                key={set.id}
                type="button"
                aria-pressed={settings.pieceSet === set.id}
                onClick={() => settings.setPieceSet(set.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border px-1.5 py-2 transition ${
                  settings.pieceSet === set.id
                    ? 'border-emerald-500 bg-emerald-600/15'
                    : 'border-white/10 bg-slate-800/60 hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center">
                  <ChessPiece type="knight" color="white" pieceSet={set.id} className="text-xl" />
                  <ChessPiece type="knight" color="black" pieceSet={set.id} className="-ml-1.5 text-xl" />
                </span>
                <span className="text-[11px] leading-none text-slate-300">{set.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Group>
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

        <div>
          <p className="mb-2 text-sm text-slate-200">{t('settings.darkMode')}</p>
          <Segmented<DisplayMode>
            ariaLabel={t('settings.darkMode')}
            value={settings.displayMode}
            onChange={settings.setDisplayMode}
            options={[
              { value: 'dark', label: t('settings.dark') },
              { value: 'dim', label: t('settings.dim') },
              { value: 'light', label: t('settings.light') },
            ]}
          />
        </div>
      </Section>

      <Section title={t('settings.audio')}>
        <Group>
          <Toggle
            label={t('settings.music')}
            checked={settings.musicEnabled}
            onChange={settings.setMusicEnabled}
          />
          <div className="flex items-center gap-3 py-1">
            <span className="w-14 shrink-0 text-sm text-slate-200">{t('settings.volume')}</span>
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
        <div>
          <p className="mb-2 text-sm text-slate-200">{t('settings.moveMode')}</p>
          <Segmented<MoveMode>
            ariaLabel={t('settings.moveMode')}
            value={settings.moveMode}
            onChange={settings.setMoveMode}
            options={[
              { value: 'click', label: t('settings.moveClick') },
              { value: 'drag', label: t('settings.moveDrag') },
              { value: 'both', label: t('settings.moveBoth') },
            ]}
          />
          <p className="mt-1.5 text-xs text-slate-500">{t('settings.moveModeDesc')}</p>
        </div>

        <Group>
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

        <div>
          <p className="mb-2 text-sm text-slate-200">{t('settings.defaultDifficulty')}</p>
          <Segmented<DifficultyId>
            ariaLabel={t('settings.defaultDifficulty')}
            value={settings.defaultDifficulty}
            onChange={settings.setDefaultDifficulty}
            options={DIFFICULTY_OPTIONS.map((option) => ({
              value: option.id,
              label: `${option.emoji} ${t(option.nameKey)}`,
            }))}
          />
        </div>
      </Section>
    </div>
  )
}
