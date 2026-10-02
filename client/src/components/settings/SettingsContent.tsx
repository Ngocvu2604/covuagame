import type { ReactNode } from 'react'
import type { DisplayMode } from '../../types/chess'
import type { DifficultyId } from '../../constants/difficulty'
import { BOARD_THEME_LIST } from '../../constants/chess'
import { DIFFICULTY_OPTIONS } from '../../constants/difficulty'
import { PIECE_SET_LIST } from '../../constants/pieceSets'
import { useSettingsStore } from '../../state/settingsStore'
import { ChessPiece } from '../chess/ChessPiece'

/**
 * Nội dung cài đặt dùng chung cho SettingsPage và SettingsDrawer.
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

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
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
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
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
  const settings = useSettingsStore()

  return (
    <div className="flex flex-col gap-6">
      <Section title="Appearance">
        <div>
          <p className="mb-2 text-sm text-slate-200">Board Theme</p>
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

        <div>
          <p className="mb-2 text-sm text-slate-200">Piece Set</p>
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

        <div>
          <p className="mb-2 text-sm text-slate-200">Dark Mode</p>
          <Segmented<DisplayMode>
            ariaLabel="Chế độ hiển thị"
            value={settings.displayMode}
            onChange={settings.setDisplayMode}
            options={[
              { value: 'dark', label: '🌙 Tối' },
              { value: 'dim', label: '🌗 Dịu' },
              { value: 'light', label: '☀️ Sáng' },
            ]}
          />
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-white/5 bg-slate-800/40 px-3 py-2">
          <Toggle
            label="Coordinates"
            description="Tọa độ A–H / 1–8 trên bàn cờ"
            checked={settings.showCoordinates}
            onChange={settings.setShowCoordinates}
          />
          <Toggle
            label="Animation"
            description="Hiệu ứng di chuyển và highlight"
            checked={settings.animationsEnabled}
            onChange={settings.setAnimationsEnabled}
          />
        </div>
      </Section>

      <Section title="Audio">
        <div className="flex flex-col gap-1 rounded-xl border border-white/5 bg-slate-800/40 px-3 py-2">
          <Toggle
            label="Background Music"
            description="Nhạc nền nhẹ (thay bằng file của bạn tại public/audio/background.mp3)"
            checked={settings.musicEnabled}
            onChange={settings.setMusicEnabled}
          />
          <div className="flex items-center gap-3 py-1">
            <span className="w-14 shrink-0 text-sm text-slate-200">Volume</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.musicVolume * 100)}
              onChange={(event) => settings.setMusicVolume(Number(event.target.value) / 100)}
              aria-label="Âm lượng nhạc nền"
              className="h-1.5 w-full cursor-pointer accent-emerald-500"
            />
            <span className="w-9 shrink-0 text-right text-xs tabular-nums text-slate-400">
              {Math.round(settings.musicVolume * 100)}%
            </span>
          </div>
          <Toggle
            label="Sound Effects"
            description="Âm đi quân, ăn quân, chiếu..."
            checked={settings.soundEnabled}
            onChange={settings.setSoundEnabled}
          />
        </div>
      </Section>

      <Section title="Gameplay">
        <div className="flex flex-col gap-1 rounded-xl border border-white/5 bg-slate-800/40 px-3 py-2">
          <Toggle
            label="Show Legal Moves"
            description="Gợi ý các nước đi hợp lệ"
            checked={settings.showLegalMoves}
            onChange={settings.setShowLegalMoves}
          />
          <Toggle
            label="Show Last Move"
            description="Highlight nước đi cuối cùng"
            checked={settings.showLastMove}
            onChange={settings.setShowLastMove}
          />
        </div>
        <div>
          <p className="mb-2 text-sm text-slate-200">Độ khó mặc định (chơi với máy)</p>
          <Segmented<DifficultyId>
            ariaLabel="Độ khó mặc định"
            value={settings.defaultDifficulty}
            onChange={settings.setDefaultDifficulty}
            options={DIFFICULTY_OPTIONS.map((option) => ({
              value: option.id,
              label: `${option.emoji} ${option.name}`,
            }))}
          />
        </div>
      </Section>
    </div>
  )
}
