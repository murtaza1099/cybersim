export const PROP_BUZZ_DURATION_SECONDS = 3
const BUZZ_EASE_IN_SECONDS = 0.15

interface BuzzInput {
  buzzing: boolean
  clockElapsedSeconds: number
  startedAtSeconds: number | null
}

interface BuzzState {
  active: boolean
  amplitude: number
  startedAtSeconds: number | null
}

/**
 * Pure envelope for a single 3s buzz pulse: a quick linear ease-in over the
 * first ~150ms (0 -> 1), then an easeOutCubic decay back to 0 by
 * `PROP_BUZZ_DURATION_SECONDS`. `elapsedSinceStart` is seconds since the
 * pulse began; the result is always in [0, 1].
 */
export function buzzAmplitude(elapsedSinceStart: number): number {
  if (elapsedSinceStart <= 0 || elapsedSinceStart >= PROP_BUZZ_DURATION_SECONDS) return 0

  if (elapsedSinceStart < BUZZ_EASE_IN_SECONDS) {
    return elapsedSinceStart / BUZZ_EASE_IN_SECONDS
  }

  const decayT = (elapsedSinceStart - BUZZ_EASE_IN_SECONDS) / (PROP_BUZZ_DURATION_SECONDS - BUZZ_EASE_IN_SECONDS)
  const remaining = 1 - decayT
  return remaining * remaining * remaining
}

/**
 * Latches a single buzz pulse for as long as `buzzing` stays true: once
 * started, `startedAtSeconds` is pinned so the pulse cannot restart mid-flight
 * even after its 3s envelope has fully decayed. Only setting `buzzing` to
 * false (which resets `startedAtSeconds` to null) allows another pulse.
 */
export function nextBuzzState({ buzzing, clockElapsedSeconds, startedAtSeconds }: BuzzInput): BuzzState {
  if (!buzzing) return { active: false, amplitude: 0, startedAtSeconds: null }

  const start = startedAtSeconds ?? clockElapsedSeconds
  const elapsed = clockElapsedSeconds - start
  const active = elapsed <= PROP_BUZZ_DURATION_SECONDS
  return {
    active,
    amplitude: active ? buzzAmplitude(elapsed) : 0,
    startedAtSeconds: start,
  }
}
