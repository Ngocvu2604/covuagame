import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT } from '../i18n/translations'
import { ChessBoard } from '../components/chess/ChessBoard'
import { PromotionDialog } from '../components/chess/PromotionDialog'
import { PlayerPanel } from '../components/player/PlayerPanel'
import { MoveHistory } from '../components/moves/MoveHistory'
import { GameControls } from '../components/game/GameControls'
import { GameHeader } from '../components/game/GameHeader'
import { GameResult } from '../components/game/GameResult'
import { SettingsDrawer } from '../components/settings/SettingsDrawer'
import { Button } from '../components/common/Button'
import { useChessGame } from '../hooks/useChessGame'
import { useChessAI } from '../hooks/useChessAI'
import { useChessClock } from '../hooks/useChessClock'
import { useGameSoundEvents } from '../hooks/useSound'
import { soundService } from '../services/soundService'
import { useGameStore } from '../state/gameStore'
import { useSettingsStore } from '../state/settingsStore'
import { usePlayerStore } from '../state/playerStore'
import { opposite } from '../chess/chessUtils'
import { TIME_CONTROL_OPTIONS } from '../constants/game'
import { DIFFICULTY_OPTIONS } from '../constants/difficulty'
import type { DifficultyId } from '../constants/difficulty'
import type { PlayerColor } from '../types/chess'

type ColorChoice = PlayerColor | 'random'

interface OfflineSetup {
  difficulty: DifficultyId
  colorChoice: ColorChoice
  timeMinutes: number | null
}

/** Trang chơi với máy: màn hình tạo trận (độ khó, màu, thời gian) rồi vào ván đấu */
export function OfflineGamePage() {
  const navigate = useNavigate()
  const t = useT()
  const defaultDifficulty = useSettingsStore((s) => s.defaultDifficulty)
  const playerName = usePlayerStore((s) => s.name)
  const endGame = useGameStore((s) => s.endGame)

  const [phase, setPhase] = useState<'setup' | 'playing'>('setup')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [setup, setSetup] = useState<OfflineSetup>({
    difficulty: defaultDifficulty,
    colorChoice: 'white',
    timeMinutes: null,
  })
  const [playerColor, setPlayerColor] = useState<PlayerColor>('white')

  const {
    state,
    selectedSquare,
    legalTargets,
    pendingPromotion,
    handleSquareClick,
    tryMoveTo,
    completePromotion,
    cancelPromotion,
    resetGame,
  } = useChessGame()

  const aiColor = opposite(playerColor)
  const { isThinking } = useChessAI({
    aiColor: phase === 'playing' ? aiColor : null,
    difficulty: setup.difficulty,
  })

  // Âm thanh theo diễn biến ván cờ (mục 15)
  useGameSoundEvents({ state: state, myColor: phase === 'playing' ? playerColor : null })

  const timeControlMs = setup.timeMinutes === null ? null : setup.timeMinutes * 60_000
  const handleFlag = useCallback(
    (side: PlayerColor) => {
      endGame({ winner: opposite(side), reason: 'timeout' })
    },
    [endGame],
  )
  const clock = useChessClock({
    initialMs: timeControlMs,
    activeSide: phase === 'playing' ? state.turn : null,
    running: phase === 'playing' && state.result === null,
    onFlag: handleFlag,
  })

  const difficultyOption = DIFFICULTY_OPTIONS.find((o) => o.id === setup.difficulty)
  const aiName = `${t('game.aiName')} · ${difficultyOption ? t(difficultyOption.nameKey) : ''}`

  const choiceButtonClass = (active: boolean) =>
    `rounded-xl border px-2 py-2 text-xs font-medium transition sm:px-3 sm:text-sm ${
      active
        ? 'border-emerald-500 bg-emerald-600/15 text-emerald-200'
        : 'border-white/10 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
    }`

  const startGame = () => {
    const color =
      setup.colorChoice === 'random'
        ? Math.random() < 0.5
          ? 'white'
          : 'black'
        : setup.colorChoice
    setPlayerColor(color)
    resetGame()
    clock.resetClock()
    setPhase('playing')
  }

  /** Chơi lại: đổi màu hai bên (như rematch trong cờ), ván mới bắt đầu */
  const handleRematch = () => {
    resetGame()
    clock.resetClock()
    setPlayerColor((color) => opposite(color))
  }

  const handleChangeSetup = () => {
    resetGame()
    clock.resetClock()
    setPhase('setup')
  }

  if (phase === 'setup') {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8 text-slate-100">
        <div className="w-full max-w-md card p-6 shadow-2xl backdrop-blur">
          <h2 className="text-center text-lg font-bold">{t('setup.title')}</h2>
          <p className="mt-1 text-center text-sm text-slate-400">
            {t('setup.subtitle')}
          </p>

          <section aria-label={t('setup.difficulty')} className="mt-6">
            <p className="mb-2 section-label">{t('setup.difficulty')}</p>
            <div className="flex flex-col gap-2">
              {DIFFICULTY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSetup((s) => ({ ...s, difficulty: option.id }))}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    setup.difficulty === option.id
                      ? 'border-emerald-500 bg-emerald-600/15'
                      : 'border-white/10 bg-slate-800/60 hover:bg-slate-800'
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold">{t(option.nameKey)}</span>
                    <span className="block text-xs text-slate-400">{t(option.descKey)}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section aria-label={t('setup.colorSection')} className="mt-5">
            <p className="mb-2 section-label">{t('setup.colorSection')}</p>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ['white', 'setup.colorWhite'],
                  ['black', 'setup.colorBlack'],
                  ['random', 'setup.colorRandom'],
                ] as const
              ).map(([value, labelKey]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSetup((s) => ({ ...s, colorChoice: value }))}
                  className={`flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-2 ${choiceButtonClass(setup.colorChoice === value)}`}
                >
                  <span>{t(labelKey)}</span>
                </button>
              ))}
            </div>
          </section>

          <section aria-label={t('setup.timeSection')} className="mt-5">
            <p className="mb-2 section-label">{t('setup.timeSection')}</p>
            <div className="grid grid-cols-5 gap-2">
              {TIME_CONTROL_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setSetup((s) => ({ ...s, timeMinutes: option.minutes }))}
                  className={choiceButtonClass(setup.timeMinutes === option.minutes)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <div className="mt-6 flex flex-col gap-2">
            <Button variant="primary" size="lg" fullWidth onClick={startGame}>
              {t('setup.start')}
            </Button>
            <Button variant="ghost" fullWidth onClick={() => navigate('/')}>
              {t('setup.back')}
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const clockFor = (color: PlayerColor): number | null => {
    if (timeControlMs === null) return null
    return color === 'white' ? clock.whiteMs : clock.blackMs
  }

  const winnerLabel =
    state.result && state.result.winner !== null
      ? state.result.winner === playerColor
        ? playerName || 'Bạn'
        : aiName
      : null

  const lastMoveRecord = state.moveHistory.at(-1) ?? null

  return (
    <main className="min-h-dvh px-4 py-4 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
        <GameHeader title={t('offline.headerTitle')} onOpenSettings={() => setSettingsOpen(true)} />

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,720px)_20rem] lg:justify-center">
          <div className="mx-auto flex w-full max-w-[min(720px,max(288px,calc(100dvh_-_240px)))] flex-col gap-2">
            <PlayerPanel
              name={aiName}
              color={aiColor}
              isActive={!state.result && state.turn === aiColor}
              statusLabel={
                state.turn === aiColor
                  ? isThinking
                    ? t('game.thinking')
                    : t('game.yourTurn')
                  : t('game.waiting')
              }
              timeMs={clockFor(aiColor)}
            />

            <ChessBoard
              pieces={state.pieces}
              orientation={playerColor}
              selectedSquare={selectedSquare}
              legalTargets={legalTargets}
              lastMove={state.lastMove}
              lastMoveIsCapture={lastMoveRecord?.captured != null}
              checkSquare={state.checkSquare}
              onPieceHover={() => soundService.playHover()}
              onDrop={tryMoveTo}
              dragColor={state.result === null ? playerColor : null}
              disabled={state.result !== null || state.turn === aiColor}
              onSquareClick={handleSquareClick}
            />

            <PlayerPanel
              name={playerName || 'Bạn'}
              color={playerColor}
              isActive={!state.result && state.turn === playerColor}
              statusLabel={state.turn === playerColor ? t('game.yourTurn') : t('game.waiting')}
              timeMs={clockFor(playerColor)}
            />
          </div>

          <aside className="mx-auto flex w-full max-w-[720px] flex-col gap-3 lg:mx-0 lg:w-full">
            <MoveHistory moves={state.moveHistory} />
            <GameControls
              canResign={state.result === null}
              onResign={() => endGame({ winner: opposite(playerColor), reason: 'resignation' })}
              onChangeSetup={handleChangeSetup}
            />
          </aside>
        </div>
      </div>

      {pendingPromotion && (
        <PromotionDialog color={state.turn} onSelect={completePromotion} onCancel={cancelPromotion} />
      )}
      {state.result && (
        <GameResult
          result={state.result}
          winnerLabel={winnerLabel}
          onRematch={handleRematch}
          onHome={() => navigate('/')}
        />
      )}
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  )
}
