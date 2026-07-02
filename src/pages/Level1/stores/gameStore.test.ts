import { beforeEach, describe, expect, it, vi } from 'vitest'

const { recordObjectiveOutcome } = vi.hoisted(() => ({
  recordObjectiveOutcome: vi.fn(),
}))

vi.mock('./analytics', () => ({ recordObjectiveOutcome }))
vi.mock('./audioStore', () => ({
  useAudioStore: { getState: () => ({ play: vi.fn(), stopAllScenarioAudio: vi.fn() }) },
}))

import { useGameStore } from './gameStore'

describe('gameStore analytics writes', () => {
  beforeEach(() => {
    recordObjectiveOutcome.mockReset()
    useGameStore.getState().resetGame()
  })

  it('records a completed outcome on a genuine completion', () => {
    useGameStore.setState({ activePoint: 1, reviewMode: false })

    useGameStore.getState().completePoint(1, 550)

    expect(recordObjectiveOutcome).toHaveBeenCalledTimes(1)
    expect(recordObjectiveOutcome).toHaveBeenCalledWith({ pointId: 1, outcome: 'completed', scoreDelta: 550 })
  })

  it('does not record again when completePoint is replayed in review mode', () => {
    useGameStore.setState({ activePoint: 1, reviewMode: false })
    useGameStore.getState().completePoint(1, 550)
    recordObjectiveOutcome.mockClear()

    useGameStore.setState({ activePoint: 1, reviewMode: true })
    useGameStore.getState().completePoint(1, 550)

    expect(recordObjectiveOutcome).not.toHaveBeenCalled()
  })

  it('records a failed outcome with the reason on a genuine failure', () => {
    useGameStore.setState({ activePoint: 6, reviewMode: false })

    useGameStore.getState().failAttempt(6, 'plugged in unknown USB')

    expect(recordObjectiveOutcome).toHaveBeenCalledTimes(1)
    expect(recordObjectiveOutcome).toHaveBeenCalledWith({
      pointId: 6,
      outcome: 'failed',
      scoreDelta: -10,
      reason: 'plugged in unknown USB',
    })
  })

  it('does not record when replaying a wrong choice on an already-resolved objective', () => {
    useGameStore.setState({ completedPoints: [6] })

    useGameStore.getState().failAttempt(6, 'plugged in unknown USB')

    expect(recordObjectiveOutcome).not.toHaveBeenCalled()
  })
})
