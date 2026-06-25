import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import BrowserApp from './BrowserApp'
import { useGameStore } from '../../../stores/gameStore'
import { usePcStore } from '../../../stores/pcStore'

describe('BrowserApp', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
    useGameStore.setState({ activePoint: 1 })
    usePcStore.getState().resetSession()
    usePcStore.setState({ sessionActive: true, startedAt: Date.now() })
  })

  it('shows the main workstation browser and surfaces ClickFix after the event fires', () => {
    const { rerender } = render(<BrowserApp />)

    expect(screen.getByText(/Company Portal/i)).toBeInTheDocument()

    act(() => {
      usePcStore.getState().fireEvent('clickfix')
    })
    rerender(<BrowserApp />)

    expect(screen.getByText(/Chrome update required/i)).toBeInTheDocument()
    expect(screen.getByText(/Download ChromeSetup\.exe/i)).toBeInTheDocument()
  })
})
