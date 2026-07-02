import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Database } from '@/lib/database.types'
import { ATTACK_POINTS } from '../config/attacks'

type PointsLedgerInsert = Database['public']['Tables']['points_ledger']['Insert']
type EventInsert = Database['public']['Tables']['events']['Insert']

function pointLabel(pointId: number): string {
  return ATTACK_POINTS.find((p) => p.id === pointId)?.label ?? `Objective ${pointId}`
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
}
