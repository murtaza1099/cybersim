export const PROP_BUZZ_DURATION_SECONDS = 0.35

interface BuzzInput {
  buzzing: boolean
  clockElapsedSeconds: number
  startedAtSeconds: number | null
}

interface BuzzState {
  active: boolean
  startedAtSeconds: number | null
}

export function nextBuzzState({ buzzing, clockElapsedSeconds, startedAtSeconds }: BuzzInput): BuzzState {
  if (!buzzing) return { active: false, startedAtSeconds: null }

  const start = startedAtSeconds ?? clockElapsedSeconds
  return {
    active: clockElapsedSeconds - start <= PROP_BUZZ_DURATION_SECONDS,
    startedAtSeconds: start,
  }
}
