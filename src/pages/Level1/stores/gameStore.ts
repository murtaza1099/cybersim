import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ActiveLayer, FocusMode, GameEvent } from '../types'
import type { PcSubAttackResult } from '@/store/simulationStore'
import { ATTACK_POINTS } from '../config/attacks'
import { useAudioStore } from './audioStore'
import { recordObjectiveOutcome } from './analytics'

function sfx(name: string) {
  useAudioStore.getState().play(name)
}

// The real 3D hotspots in objective order — currently [1, 4, 5, 6, 7, 8].
// (PC attacks 2 & 3 were merged into the Main Workstation, point 1.)
const OBJECTIVE_IDS = ATTACK_POINTS.map(a => a.id)
const OBJECTIVE_COUNT = OBJECTIVE_IDS.length

function nextUnresolved(resolved: number[]): number {
  for (const id of OBJECTIVE_IDS) if (!resolved.includes(id)) return id
  return 99 // sentinel — no hotspot matches once everything is resolved
}

function resolvedObjectives(completed: number[], failed: number[]): number {
  return OBJECTIVE_IDS.filter(id => completed.includes(id) || failed.includes(id)).length
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
  pcSubAttackResults: PcSubAttackResult[]
}

interface GameActions {
  startPoint: (id: number) => void
  enterBriefing: () => void
  enterContext: () => void
  beginScenario: () => void
  completePoint: (id: number, scoreDelta: number) => void
  failAttempt: (id: number, reason: string) => void
  openOS: (kind: 'windows' | 'android') => void
  closeOS: () => void
  exitToScene: () => void
  setSubtitle: (text: string, durationMs: number) => void
  setPcSubAttackResults: (results: PcSubAttackResult[]) => void
  reconcileObjective: () => void
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
      pcSubAttackResults: [],

      startPoint(id) {
        const { currentPointId, completedPoints, failedPoints } = get()
        const isReview = completedPoints.includes(id) || failedPoints.includes(id)
        // Strict sequential: only the current objective opens; finish it to unlock the next.
        const unlocked = isReview || id === currentPointId
        if (!unlocked) {
          get().logEvent({ type: 'locked_attempt', pointId: id })
          // Softer cue — ARIA delivers the guidance now, so no harsh glitch.
          sfx('ui_hover')
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

      enterContext() {
        const { activePoint } = get()
        if (activePoint === null) return
        // Intermediate scenario-context card between the briefing and the OS/scene.
        set({ activeLayer: 'context', focusMode: 'point' })
        get().logEvent({ type: 'context_opened', pointId: activePoint })
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
        recordObjectiveOutcome({ pointId: id, outcome: 'completed', scoreDelta })
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
        recordObjectiveOutcome({ pointId: id, outcome: 'failed', scoreDelta: -10, reason })
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
        const resolvedCount = resolvedObjectives(completedPoints, failedPoints)
        set({ activePoint: null, focusMode: 'free', activeLayer: resolvedCount >= OBJECTIVE_COUNT ? 'complete' : 'scene', reviewMode: false })
        useAudioStore.getState().stopAllScenarioAudio()
      },

      setSubtitle(text, durationMs) {
        set({ subtitleText: text })
        setTimeout(() => set({ subtitleText: null }), durationMs)
      },

      setPcSubAttackResults(results) {
        set({ pcSubAttackResults: results })
      },

      // Safe runtime heal (called once on mount): if a stale save left
      // currentPointId on an objective that no longer has a hotspot, snap it back
      // to the first unresolved objective so the right marker is clickable.
      reconcileObjective() {
        const { currentPointId, completedPoints, failedPoints } = get()
        const completed = Array.isArray(completedPoints) ? completedPoints : []
        const failed = Array.isArray(failedPoints) ? failedPoints : []
        if (!OBJECTIVE_IDS.includes(currentPointId)) {
          set({ currentPointId: nextUnresolved([...completed, ...failed]) })
        }
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
        try { localStorage.removeItem('cybersim-level1') } catch {
          // Local storage may be unavailable in private or embedded contexts.
        }
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
          pcSubAttackResults: [],
        })
      },
    }),
    {
      name: 'cybersim-level1',
      partialize: (s) => ({
        currentPointId: s.currentPointId,
        completedPoints: s.completedPoints,
        failedPoints: s.failedPoints,
        score: s.score,
        attempts: s.attempts,
        eventLog: s.eventLog.slice(-50),
        pcSubAttackResults: s.pcSubAttackResults,
      }),
    }
  )
)
