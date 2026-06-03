import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ActiveLayer, FocusMode, GameEvent } from '../types'
import { useAudioStore } from './audioStore'

function sfx(name: string) {
  useAudioStore.getState().play(name)
}

function nextUnresolved(resolved: number[]): number {
  for (let i = 1; i <= 8; i++) if (!resolved.includes(i)) return i
  return 9
}

interface GameState {
  currentPointId: number
  completedPoints: number[]
  failedPoints: number[]
  score: number
  attempts: Record<number, number>
  eventLog: GameEvent[]
  activePoint: number | null
  focusMode: FocusMode
  activeLayer: ActiveLayer
  reviewMode: boolean
  subtitleText: string | null
  lockedToastVisible: boolean
}

interface GameActions {
  startPoint: (id: number) => void
  enterBriefing: () => void
  beginScenario: () => void
  completePoint: (id: number, scoreDelta: number) => void
  failAttempt: (id: number, reason: string) => void
  openOS: (kind: 'windows' | 'android') => void
  closeOS: () => void
  exitToScene: () => void
  setSubtitle: (text: string, durationMs: number) => void
  logEvent: (partial: Omit<GameEvent, 'id' | 'ts'>) => void
  resetGame: () => void
}

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      currentPointId: 1,
      completedPoints: [],
      failedPoints: [],
      score: 0,
      attempts: {},
      eventLog: [],
      activePoint: null,
      focusMode: 'free' as FocusMode,
      activeLayer: 'scene' as ActiveLayer,
      reviewMode: false,
      subtitleText: null,
      lockedToastVisible: false,

      startPoint(id) {
        const { currentPointId, completedPoints, failedPoints } = get()
        const isReview = completedPoints.includes(id) || failedPoints.includes(id)
        if (!isReview && id !== currentPointId) {
          get().logEvent({ type: 'locked_attempt', pointId: id })
          sfx('wrong_glitch')
          set({ lockedToastVisible: true })
          setTimeout(() => set({ lockedToastVisible: false }), 2500)
          return
        }
        set({ activePoint: id, focusMode: 'point', activeLayer: 'briefing', reviewMode: isReview })
        get().logEvent({ type: isReview ? 'attack_review_started' : 'attack_started', pointId: id })
        sfx('ui_click')
      },

      enterBriefing() {
        const { activePoint } = get()
        if (activePoint === null) return
        set({ activeLayer: 'briefing', focusMode: 'point' })
        get().logEvent({ type: 'briefing_opened', pointId: activePoint })
        sfx('ui_click')
      },

      beginScenario() {
        const { activePoint } = get()
        if (activePoint === null) return
        set({ activeLayer: 'scenario' })
        get().logEvent({ type: 'scenario_opened', pointId: activePoint })
        sfx('ui_click')
      },

      completePoint(id, scoreDelta) {
        const { completedPoints, failedPoints, score, reviewMode } = get()
        if (reviewMode || completedPoints.includes(id) || failedPoints.includes(id)) {
          set({ activePoint: null, focusMode: 'free', activeLayer: 'scene', reviewMode: false })
          get().logEvent({ type: 'attack_review_completed', pointId: id })
          useAudioStore.getState().stopAllScenarioAudio()
          return
        }
        const next = [...completedPoints, id]
        const resolved = [...new Set([...next, ...failedPoints])]
        set({
          completedPoints: next,
          score: score + scoreDelta,
          activeLayer: 'feedback',
          reviewMode: false,
          currentPointId: nextUnresolved(resolved),
        })
        get().logEvent({ type: 'attack_completed', pointId: id, payload: { scoreDelta } })
        sfx('correct_sting')
        setTimeout(() => sfx('score_gain'), 800)
        useAudioStore.getState().stopAllScenarioAudio()
      },

      failAttempt(id, reason) {
        const { score, attempts, completedPoints, failedPoints, reviewMode } = get()
        if (reviewMode || completedPoints.includes(id) || failedPoints.includes(id)) {
          get().logEvent({ type: 'review_wrong_choice', pointId: id, payload: { reason } })
          sfx('wrong_glitch')
          return
        }
        const newCount = (attempts[id] ?? 0) + 1
        const failed = [...failedPoints, id]
        const resolved = [...new Set([...completedPoints, ...failed])]
        set({
          score: Math.max(0, score - 10),
          attempts: { ...attempts, [id]: newCount },
          failedPoints: failed,
          activeLayer: 'feedback',
          currentPointId: nextUnresolved(resolved),
        })
        get().logEvent({ type: 'attack_failed', pointId: id, payload: { reason, attemptNumber: newCount } })
        sfx('wrong_glitch')
      },

      openOS(kind) {
        set({ focusMode: kind, activeLayer: 'scenario' })
        get().logEvent({ type: 'os_opened', payload: { kind } })
      },

      closeOS() {
        const { activePoint } = get()
        set({ focusMode: activePoint !== null ? 'point' : 'free', activeLayer: activePoint !== null ? 'briefing' : 'scene' })
        get().logEvent({ type: 'os_closed' })
        useAudioStore.getState().stopAllScenarioAudio()
      },

      exitToScene() {
        const { completedPoints, failedPoints } = get()
        const resolvedCount = new Set([...completedPoints, ...failedPoints]).size
        set({ activePoint: null, focusMode: 'free', activeLayer: resolvedCount >= 8 ? 'complete' : 'scene', reviewMode: false })
        useAudioStore.getState().stopAllScenarioAudio()
      },

      setSubtitle(text, durationMs) {
        set({ subtitleText: text })
        setTimeout(() => set({ subtitleText: null }), durationMs)
      },

      logEvent(partial) {
        const event: GameEvent = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          ts: Date.now(),
          ...partial,
        }
        set(s => ({ eventLog: [...s.eventLog.slice(-99), event] }))
      },

      resetGame() {
        try { localStorage.removeItem('cybersim-l1') } catch {}
        set({
          currentPointId: 1,
          completedPoints: [],
          failedPoints: [],
          score: 0,
          attempts: {},
          eventLog: [],
          activePoint: null,
          focusMode: 'free',
          activeLayer: 'scene',
          reviewMode: false,
          subtitleText: null,
          lockedToastVisible: false,
        })
      },
    }),
    {
      name: 'cybersim-l1',
      partialize: (s) => ({
        currentPointId: s.currentPointId,
        completedPoints: s.completedPoints,
        failedPoints: s.failedPoints,
        score: s.score,
        attempts: s.attempts,
        eventLog: s.eventLog.slice(-50),
      }),
    }
  )
)
