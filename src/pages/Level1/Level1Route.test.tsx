import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Level1Route from './Level1Route'

const simulation = vi.hoisted(() => ({
  onSceneReady: undefined as (() => void) | undefined,
}))

vi.mock('./App', () => ({
  default: ({ onSceneReady }: { onSceneReady?: () => void }) => {
    simulation.onSceneReady = onSceneReady
    return <div data-testid="level1-simulation" />
  },
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      ...props
    }: React.ComponentProps<'div'> & {
      initial?: unknown
      animate?: unknown
      exit?: unknown
      transition?: unknown
    }) => <div {...props}>{children}</div>,
  },
}))

describe('Level1Route loader', () => {
  afterEach(() => {
    vi.useRealTimers()
    simulation.onSceneReady = undefined
  })

  it('stays visible past the old fixed timeout until the scene reports readiness', () => {
    vi.useFakeTimers()

    render(
      <MemoryRouter>
        <Level1Route />
      </MemoryRouter>
    )

    expect(screen.getByText('LOADING ENVIRONMENT')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(6000)
    })

    expect(screen.getByText('LOADING ENVIRONMENT')).toBeInTheDocument()

    act(() => {
      simulation.onSceneReady?.()
    })

    expect(screen.queryByText('LOADING ENVIRONMENT')).not.toBeInTheDocument()
  })
})
