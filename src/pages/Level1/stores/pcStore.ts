import { create } from 'zustand'
import type { PcSubAttackId } from '../types'
import { PC_TIMELINE } from '../config/pcTimeline'

export type PcAttackStatus = 'pending' | 'passed' | 'failed'

export interface PcAttackState {
  status: PcAttackStatus
  action: string | null      // chosen action label (telemetry)
  tDecisionMs: number | null // time from attack appearing → decision
  inspected: string[]        // inspection micro-behaviours performed before deciding
}

export interface PcScoreBreakdown {
  base: number
  inspectionBonus: number
  recklessPenalty: number
  fpPenalty: number
  total: number
}

// Per-attack reward — sums to 550 (= ATK_001 scoreReward).
const REWARD: Record<PcSubAttackId, number> = {
  email_phish: 100, ceo_fraud: 120, clickfix: 100, macro_doc: 120, fake_defender: 110,
}
const ATTACK_IDS = Object.keys(REWARD) as PcSubAttackId[]

const freshAttacks = (): Record<PcSubAttackId, PcAttackState> =>
  Object.fromEntries(
    ATTACK_IDS.map(id => [id, { status: 'pending', action: null, tDecisionMs: null, inspected: [] }]),
  ) as Record<PcSubAttackId, PcAttackState>

interface PcState {
  sessionActive: boolean
  startedAt: number
  fired: Record<string, boolean>
  firedAt: Record<string, number>
  attacks: Record<PcSubAttackId, PcAttackState>
  falsePositives: string[]

  startSession: () => void
  fireEvent: (id: string) => void
  trigger: (action: string) => void
  recordInspection: (id: PcSubAttackId, kind: string) => void
  resolveAttack: (id: PcSubAttackId, passed: boolean, action: string) => void
  reportLegit: (eventId: string) => void
  allResolved: () => boolean
  resolvedCount: () => number
  scoreBreakdown: () => PcScoreBreakdown
  resetSession: () => void
  cleanup: () => void
}

// Timers live outside the store so cleanup() can always cancel them — orphaned
// timers firing after unmount are the #1 bug in this kind of build.
let timers: ReturnType<typeof setTimeout>[] = []
const clearTimers = () => { timers.forEach(clearTimeout); timers = [] }

export const usePcStore = create<PcState>()((set, get) => ({
  sessionActive: false,
  startedAt: 0,
  fired: {},
  firedAt: {},
  attacks: freshAttacks(),
  falsePositives: [],

  startSession() {
    clearTimers()
    const startedAt = Date.now()
    set({ sessionActive: true, startedAt, fired: {}, firedAt: {}, attacks: freshAttacks(), falsePositives: [] })
    // Schedule all time-triggered events. Action-triggered ones wait for trigger().
    PC_TIMELINE.filter(e => e.at != null).forEach(e => {
      timers.push(setTimeout(() => get().fireEvent(e.id), e.at ?? 0))
    })
  },

  fireEvent(id) {
    if (get().fired[id]) return
    const ev = PC_TIMELINE.find(e => e.id === id)
    const now = Date.now()
    set(s => ({
      fired: { ...s.fired, [id]: true },
      firedAt: { ...s.firedAt, [id]: now, ...(ev?.attackId ? { [ev.attackId]: now } : {}) },
    }))
  },

  trigger(action) {
    PC_TIMELINE.filter(e => e.on === action && !get().fired[e.id]).forEach(e => {
      timers.push(setTimeout(() => get().fireEvent(e.id), e.delay ?? 0))
    })
  },

  recordInspection(id, kind) {
    set(s => {
      const a = s.attacks[id]
      if (!a || a.status !== 'pending' || a.inspected.includes(kind)) return s
      return { attacks: { ...s.attacks, [id]: { ...a, inspected: [...a.inspected, kind] } } }
    })
  },

  resolveAttack(id, passed, action) {
    const a = get().attacks[id]
    if (!a || a.status !== 'pending') return
    const firedAt = get().firedAt[id] ?? get().startedAt
    const tDecisionMs = Date.now() - firedAt
    set(s => ({
      attacks: { ...s.attacks, [id]: { ...s.attacks[id], status: passed ? 'passed' : 'failed', action, tDecisionMs } },
    }))
  },

  reportLegit(eventId) {
    set(s => (s.falsePositives.includes(eventId) ? s : { falsePositives: [...s.falsePositives, eventId] }))
  },

  allResolved() {
    return ATTACK_IDS.every(id => get().attacks[id].status !== 'pending')
  },

  resolvedCount() {
    return ATTACK_IDS.filter(id => get().attacks[id].status !== 'pending').length
  },

  // score = passed rewards + inspection bonus − false-positive − reckless-speed.
  scoreBreakdown() {
    const { attacks, falsePositives } = get()
    let base = 0
    let inspectionBonus = 0
    let recklessPenalty = 0
    ATTACK_IDS.forEach(id => {
      const a = attacks[id]
      if (a.status === 'passed') base += REWARD[id]
      if (a.status !== 'pending' && a.inspected.length > 0) inspectionBonus += 10
      if (a.status === 'failed' && a.inspected.length === 0 && a.tDecisionMs != null && a.tDecisionMs < 3000) {
        recklessPenalty += 15
      }
    })
    const fpPenalty = falsePositives.length * 20
    const total = Math.max(0, Math.min(550, base + inspectionBonus - recklessPenalty - fpPenalty))
    return { base, inspectionBonus, recklessPenalty, fpPenalty, total }
  },

  resetSession() {
    clearTimers()
    set({ sessionActive: false, startedAt: 0, fired: {}, firedAt: {}, attacks: freshAttacks(), falsePositives: [] })
  },

  cleanup() { clearTimers() },
}))

export { REWARD as PC_REWARD, ATTACK_IDS as PC_ATTACK_IDS }
