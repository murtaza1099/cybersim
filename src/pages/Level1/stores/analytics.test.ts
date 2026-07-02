import { beforeEach, describe, expect, it, vi } from 'vitest'

const { insertPointsLedger, insertEvents } = vi.hoisted(() => ({
  insertPointsLedger: vi.fn(),
  insertEvents: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'points_ledger') return { insert: insertPointsLedger }
      if (table === 'events') return { insert: insertEvents }
      throw new Error(`unexpected table ${table}`)
    },
  },
}))

vi.mock('@/store/authStore', () => ({
  useAuthStore: { getState: vi.fn() },
}))

import { useAuthStore } from '@/store/authStore'
import { recordObjectiveOutcome } from './analytics'

const mockedGetState = vi.mocked(useAuthStore.getState)

function authState(userId: string | null, orgId: string | null) {
  return { userId, orgId } as unknown as ReturnType<typeof useAuthStore.getState>
}

describe('recordObjectiveOutcome', () => {
  beforeEach(() => {
    insertPointsLedger.mockReset().mockResolvedValue({ error: null })
    insertEvents.mockReset().mockResolvedValue({ error: null })
    mockedGetState.mockReset()
  })

  it('writes a points_ledger row and an events row for a completed objective', async () => {
    mockedGetState.mockReturnValue(authState('user-1', 'org-1'))

    recordObjectiveOutcome({ pointId: 1, outcome: 'completed', scoreDelta: 550 })
    await Promise.resolve()

    expect(insertPointsLedger).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', org_id: 'org-1', delta: 550 }),
    )
    expect(insertEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        org_id: 'org-1',
        type: 'attack_completed',
        payload: expect.objectContaining({ pointId: 1, scoreDelta: 550 }),
      }),
    )
  })

  it('writes a negative delta and the failure reason for a failed objective', async () => {
    mockedGetState.mockReturnValue(authState('user-1', null))

    recordObjectiveOutcome({ pointId: 6, outcome: 'failed', scoreDelta: -10, reason: 'plugged in unknown USB' })
    await Promise.resolve()

    expect(insertPointsLedger).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', org_id: null, delta: -10 }),
    )
    expect(insertEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'attack_failed',
        payload: expect.objectContaining({ pointId: 6, reason: 'plugged in unknown USB' }),
      }),
    )
  })

  it('does nothing when there is no authenticated user (local/anonymous play)', () => {
    mockedGetState.mockReturnValue(authState(null, null))

    recordObjectiveOutcome({ pointId: 1, outcome: 'completed', scoreDelta: 550 })

    expect(insertPointsLedger).not.toHaveBeenCalled()
    expect(insertEvents).not.toHaveBeenCalled()
  })

  it('logs but does not throw when a write fails', async () => {
    mockedGetState.mockReturnValue(authState('user-1', null))
    insertPointsLedger.mockResolvedValue({ error: { message: 'boom' } })
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(() =>
      recordObjectiveOutcome({ pointId: 6, outcome: 'failed', scoreDelta: -10, reason: 'plugged in USB' }),
    ).not.toThrow()
    await Promise.resolve()
    await Promise.resolve()

    expect(errSpy).toHaveBeenCalledWith('[analytics] points_ledger insert failed', { message: 'boom' })
    errSpy.mockRestore()
  })
})
