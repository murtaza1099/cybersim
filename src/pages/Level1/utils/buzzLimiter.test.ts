import { describe, expect, it } from 'vitest'
import { nextBuzzState, PROP_BUZZ_DURATION_SECONDS } from './buzzLimiter'

describe('prop buzz limiter', () => {
  it('limits prop vibration to the initial short burst and resets after buzzing stops', () => {
    const started = nextBuzzState({ buzzing: true, clockElapsedSeconds: 10, startedAtSeconds: null })
    expect(started).toEqual({ active: true, startedAtSeconds: 10 })

    const stillBuzzing = nextBuzzState({
      buzzing: true,
      clockElapsedSeconds: 10 + PROP_BUZZ_DURATION_SECONDS / 2,
      startedAtSeconds: started.startedAtSeconds,
    })
    expect(stillBuzzing).toEqual({ active: true, startedAtSeconds: 10 })

    const expired = nextBuzzState({
      buzzing: true,
      clockElapsedSeconds: 10 + PROP_BUZZ_DURATION_SECONDS + 0.01,
      startedAtSeconds: started.startedAtSeconds,
    })
    expect(expired).toEqual({ active: false, startedAtSeconds: 10 })

    const reset = nextBuzzState({ buzzing: false, clockElapsedSeconds: 12, startedAtSeconds: expired.startedAtSeconds })
    expect(reset).toEqual({ active: false, startedAtSeconds: null })

    const restarted = nextBuzzState({ buzzing: true, clockElapsedSeconds: 14, startedAtSeconds: reset.startedAtSeconds })
    expect(restarted).toEqual({ active: true, startedAtSeconds: 14 })
  })
})
