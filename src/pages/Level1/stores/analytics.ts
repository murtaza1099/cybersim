import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Database } from '@/lib/database.types'
import { ATTACK_POINTS } from '../config/attacks'

type PointsLedgerInsert = Database['public']['Tables']['points_ledger']['Insert']
type EventInsert = Database['public']['Tables']['events']['Insert']
type ModuleProgressInsert = Database['public']['Tables']['module_progress']['Insert']

function pointLabel(pointId: number): string {
  return ATTACK_POINTS.find((p) => p.id === pointId)?.label ?? `Objective ${pointId}`
}

// Maps a 3D hotspot id to its attack_modules id (module_progress.module_id FK).
// quidProQuo has no dedicated Level 1 hotspot. Adjust here if objectives are re-themed.
const POINT_TO_MODULE: Record<number, string> = {
  1: 'password',   // Main Workstation — workstation hygiene
  4: 'phishing',   // Personal Phone — SMS phishing
  5: 'vishing',    // Office Landline — vishing call
  6: 'usbDrop',    // Unknown USB — USB bait
  7: 'tailgating', // Office Door — delivery pretext
  8: 'data',       // Admin Workstation — malware / data handling
}

/** Fire-and-forget: keeps profiles.last_active fresh so the live "active users"
 * metric reflects who is currently playing. Never throws. */
function touchLastActive(userId: string): void {
  void supabase
    .from('profiles')
    .update({ last_active: new Date().toISOString() })
    .eq('id', userId)
    .then(({ error }) => {
      if (error) console.error('[analytics] last_active update failed', error)
    })
}

/**
 * Fire-and-forget: records a points_ledger row + an events row for a
 * completed or failed objective, for the live admin dashboards. Never
 * throws and never awaited by the caller — a write failure only logs to
 * the console so it can't stall or error out the simulation.
 */
export function recordObjectiveOutcome(params: {
  pointId: number
  outcome: 'completed' | 'failed'
  scoreDelta: number
  reason?: string
}): void {
  const { userId, orgId } = useAuthStore.getState()
  if (!userId) return // local/anonymous play — nothing to attribute the row to

  const label = pointLabel(params.pointId)
  const reasonText =
    params.outcome === 'completed'
      ? `Objective completed: ${label}`
      : `Objective failed: ${label}${params.reason ? ` (${params.reason})` : ''}`

  const ledgerRow: PointsLedgerInsert = {
    user_id: userId,
    org_id: orgId,
    delta: params.scoreDelta,
    reason: reasonText,
  }
  const eventRow: EventInsert = {
    user_id: userId,
    org_id: orgId,
    type: params.outcome === 'completed' ? 'attack_completed' : 'attack_failed',
    payload: { pointId: params.pointId, label, scoreDelta: params.scoreDelta, reason: params.reason ?? null },
  }

  void supabase
    .from('points_ledger')
    .insert(ledgerRow)
    .then(({ error }) => {
      if (error) console.error('[analytics] points_ledger insert failed', error)
    })
  void supabase
    .from('events')
    .insert(eventRow)
    .then(({ error }) => {
      if (error) console.error('[analytics] events insert failed', error)
    })

  // Per-objective module progress so the module completion / pass-fail charts
  // update live as each attack is resolved (completeLevel1 later reconciles the
  // authoritative end-of-level scores).
  const moduleId = POINT_TO_MODULE[params.pointId]
  if (moduleId) {
    const progressRow: ModuleProgressInsert = {
      user_id: userId,
      module_id: moduleId,
      score: params.outcome === 'completed' ? Math.max(0, params.scoreDelta) : 0,
      completed_at: new Date().toISOString(),
    }
    void supabase
      .from('module_progress')
      .upsert(progressRow, { onConflict: 'user_id,module_id' })
      .then(({ error }) => {
        if (error) console.error('[analytics] module_progress upsert failed', error)
      })
  }

  touchLastActive(userId)
}

/**
 * Fire-and-forget: records a `level_completed` summary event when an employee
 * finishes Level 1, so the live admin activity feed shows completions. Never
 * throws and is never awaited by the caller.
 */
export function recordLevelComplete(params: {
  status: 'completed' | 'failed' | 'in-progress'
  score: number
  completedAttacks?: number
  failedAttacks?: number
}): void {
  const { userId, orgId } = useAuthStore.getState()
  if (!userId) return

  const eventRow: EventInsert = {
    user_id: userId,
    org_id: orgId,
    type: 'level_completed',
    payload: {
      level: 1,
      status: params.status,
      score: params.score,
      completedAttacks: params.completedAttacks ?? null,
      failedAttacks: params.failedAttacks ?? null,
    },
  }
  void supabase
    .from('events')
    .insert(eventRow)
    .then(({ error }) => {
      if (error) console.error('[analytics] level_completed event insert failed', error)
    })

  touchLastActive(userId)
}
