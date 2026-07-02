import { describe, expect, it } from 'vitest'
import { buzzAmplitude, nextBuzzState, PROP_BUZZ_DURATION_SECONDS } from './buzzLimiter'

describe('buzzAmplitude (pure envelope)', () => {
  it('starts near 0 and ramps up quickly during the ease-in', () => {
    expect(buzzAmplitude(0)).toBe(0)
    expect(buzzAmplitude(0.01)).toBeGreaterThan(0)
    expect(buzzAmplitude(0.01)).toBeLessThan(0.2)
  })

  it('peaks early (by ~150ms) at amplitude 1', () => {
    expect(buzzAmplitude(0.15)).toBeCloseTo(1, 5)
  })

  it('decays monotonically from the peak to 0 by the 3s duration', () => {
    const samples = [0.15, 0.5, 1, 1.5, 2, 2.5, 2.9, 3]
    const amplitudes = samples.map(buzzAmplitude)

    for (let i = 1; i < amplitudes.length; i++) {
      expect(amplitudes[i]).toBeLessThanOrEqual(amplitudes[i - 1])
    }
    expect(amplitudes[0]).toBeCloseTo(1, 5)
    expect(amplitudes[amplitudes.length - 1]).toBe(0)
  })

  it('stays 0 for the entire ease-in-to-peak ramp and for anything at or past 3s', () => {
    expect(buzzAmplitude(3)).toBe(0)
    expect(buzzAmplitude(3.5)).toBe(0)
    expect(buzzAmplitude(10)).toBe(0)
  })

  it('never exceeds an amplitude of 1', () => {
    for (let t = 0; t <= 3; t += 0.1) {
      expect(buzzAmplitude(t)).toBeLessThanOrEqual(1)
      expect(buzzAmplitude(t)).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('prop buzz limiter', () => {
  it('is a single 3s pulse: ramps up, decays to 0 by 3s, and resets only after buzzing stops', () => {
    const started = nextBuzzState({ buzzing: true, clockElapsedSeconds: 10, startedAtSeconds: null })
    expect(started.active).toBe(true)
    expect(started.startedAtSeconds).toBe(10)
    expect(started.amplitude).toBe(0)

    const midPulse = nextBuzzState({
      buzzing: true,
      clockElapsedSeconds: 10 + PROP_BUZZ_DURATION_SECONDS / 2,
      startedAtSeconds: started.startedAtSeconds,
    })
    expect(midPulse.active).toBe(true)
    expect(midPulse.startedAtSeconds).toBe(10)
    expect(midPulse.amplitude).toBeGreaterThan(0)
    expect(midPulse.amplitude).toBeLessThan(1)

    const expired = nextBuzzState({
      buzzing: true,
      clockElapsedSeconds: 10 + PROP_BUZZ_DURATION_SECONDS + 0.01,
      startedAtSeconds: started.startedAtSeconds,
    })
    expect(expired.active).toBe(false)
    expect(expired.amplitude).toBe(0)
    expect(expired.startedAtSeconds).toBe(10)
  })

  it('does not restart the pulse while buzzing stays true, even long after it has decayed to 0', () => {
    const started = nextBuzzState({ buzzing: true, clockElapsedSeconds: 0, startedAtSeconds: null })

    const longAfter = nextBuzzState({
      buzzing: true,
      clockElapsedSeconds: PROP_BUZZ_DURATION_SECONDS * 5,
      startedAtSeconds: started.startedAtSeconds,
    })

    expect(longAfter.startedAtSeconds).toBe(0)
    expect(longAfter.active).toBe(false)
    expect(longAfter.amplitude).toBe(0)
  })

  it('resets once buzzing goes false, allowing a fresh pulse on the next activation', () => {
    const expired = nextBuzzState({ buzzing: true, clockElapsedSeconds: 10 + PROP_BUZZ_DURATION_SECONDS + 0.01, startedAtSeconds: 10 })

    const reset = nextBuzzState({ buzzing: false, clockElapsedSeconds: 12, startedAtSeconds: expired.startedAtSeconds })
    expect(reset).toEqual({ active: false, amplitude: 0, startedAtSeconds: null })

    const restarted = nextBuzzState({ buzzing: true, clockElapsedSeconds: 14, startedAtSeconds: reset.startedAtSeconds })
    expect(restarted.active).toBe(true)
    expect(restarted.startedAtSeconds).toBe(14)
    expect(restarted.amplitude).toBe(0)
  })
})
