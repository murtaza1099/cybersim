import { describe, expect, it } from 'vitest'
import { applyEventInsert, applyLedgerInsert } from './analyticsStore'
import type { Database } from '@/lib/database.types'

type PointsLedgerRow = Database['public']['Tables']['points_ledger']['Row']
type EventRow = Database['public']['Tables']['events']['Row']

function ledgerRow(overrides: Partial<PointsLedgerRow> = {}): PointsLedgerRow {
  return {
    id: 'row-1',
    user_id: 'user-1',
    org_id: 'org-1',
    delta: 100,
    reason: 'Objective completed: PC Workstation',
    balance_after: 100,
    created_at: '2026-07-02T00:00:00.000Z',
    ...overrides,
  }
}

function eventRow(overrides: Partial<EventRow> = {}): EventRow {
  return {
    id: 'row-1',
    user_id: 'user-1',
    org_id: 'org-1',
    type: 'attack_completed',
    payload: { pointId: 1, label: 'PC Workstation', scoreDelta: 100, reason: null },
    created_at: '2026-07-02T00:00:00.000Z',
    ...overrides,
  }
}

describe('applyLedgerInsert', () => {
  it('accumulates the delta, tracks the active user, and prepends the feed', () => {
    const seen = new Set<string>(['existing-user'])
    const next = applyLedgerInsert({ totalPoints: 50, feed: [] }, ledgerRow({ delta: 25 }), seen)

    expect(next.totalPoints).toBe(75)
    expect(next.activeAgents).toBe(2)
    expect(next.feed).toHaveLength(1)
    expect(next.feed[0].kind).toBe('points')
    expect(next.feed[0].label).toContain('+25 pts')
  })

  it('does not double-count a user_id already seen', () => {
    const seen = new Set<string>(['user-1'])
    const next = applyLedgerInsert({ totalPoints: 0, feed: [] }, ledgerRow({ user_id: 'user-1' }), seen)

    expect(next.activeAgents).toBe(1)
  })

  it('caps the feed at 30 entries', () => {
    const existing = Array.from({ length: 30 }, (_, i) => ({
      id: `old-${i}`,
      ts: '2026-07-01T00:00:00.000Z',
      kind: 'points' as const,
      label: 'old',
      userId: null,
      orgId: null,
    }))
    const next = applyLedgerInsert({ totalPoints: 0, feed: existing }, ledgerRow(), new Set())

    expect(next.feed).toHaveLength(30)
    expect(next.feed[0].id).toBe('pl-row-1')
  })
})

describe('applyEventInsert', () => {
  it('increments threatsHandled and the per-objective distribution on attack_completed', () => {
    const next = applyEventInsert(
      { threatsHandled: 2, moduleDistribution: { '1': 3 }, feed: [] },
      eventRow({ type: 'attack_completed', payload: { pointId: 1 } }),
    )

    expect(next.threatsHandled).toBe(3)
    expect(next.moduleDistribution['1']).toBe(4)
    expect(next.feed[0].label).toContain('Objective cleared')
  })

  it('buckets under "unknown" when the payload has no pointId', () => {
    const next = applyEventInsert(
      { threatsHandled: 0, moduleDistribution: {}, feed: [] },
      eventRow({ type: 'attack_completed', payload: {} }),
    )

    expect(next.moduleDistribution.unknown).toBe(1)
  })

  it('does not increment threatsHandled or distribution for non-completion events, but still feeds', () => {
    const next = applyEventInsert(
      { threatsHandled: 5, moduleDistribution: { '1': 2 }, feed: [] },
      eventRow({ type: 'attack_failed', payload: { pointId: 1, label: 'PC Workstation' } }),
    )

    expect(next.threatsHandled).toBe(5)
    expect(next.moduleDistribution).toEqual({ '1': 2 })
    expect(next.feed[0].label).toBe('Objective failed: PC Workstation')
  })
})
