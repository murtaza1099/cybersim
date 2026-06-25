import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../stores/gameStore'
import { usePcStore } from '../stores/pcStore'
import OutlookApp from './windows/apps/OutlookApp'
import BrowserApp from './windows/apps/BrowserApp'
import FileExplorerApp from './windows/apps/FileExplorerApp'
import MessagesApp from './android/apps/MessagesApp'
import DialerApp from './android/apps/DialerApp'

function resetStores(activePoint: number) {
  act(() => {
    useGameStore.getState().resetGame()
    useGameStore.setState({ activePoint })
    usePcStore.getState().resetSession()
    usePcStore.setState({ sessionActive: true, startedAt: Date.now() })
  })
}

describe('Level 1 realism content', () => {
  beforeEach(() => {
    resetStores(1)
  })

  it('renders richer phishing and BEC email cues without changing selection flow', () => {
    act(() => {
      usePcStore.getState().fireEvent('phish_email')
      usePcStore.getState().fireEvent('ceo_email')
    })

    render(<OutlookApp />)

    expect(screen.getByText(/External sender/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /details/i }))
    expect(screen.getByText(/Reply-To: security-notice@account-microsoft-verify\.com/i)).toBeInTheDocument()
    expect(screen.getByText(/Microsoft account services/i)).toBeInTheDocument()

    fireEvent.click(screen.getByText(/URGENT/i))
    expect(screen.getByText(/Forwarded message/i)).toBeInTheDocument()
    expect(screen.getByText(/Sent from my iPhone/i)).toBeInTheDocument()
  })

  it('renders fake Chrome update browser chrome with a wrong download host', () => {
    const { rerender } = render(<BrowserApp />)

    act(() => {
      usePcStore.getState().fireEvent('clickfix')
    })
    rerender(<BrowserApp />)

    expect(screen.getByText(/chrome-browser-security\.com/i)).toBeInTheDocument()
    expect(screen.getAllByText(/ChromeSetup\.exe/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/download\.chromesecurity-updates\.com/i).length).toBeGreaterThan(0)
  })

  it('renders the LinkedIn attachment lure, USB bait, and odd malware process list', () => {
    const { rerender } = render(<FileExplorerApp />)

    expect(screen.getAllByText(/LinkedIn Recruiter/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Portfolio\.pdf\s+\.exe/i)).toBeInTheDocument()

    resetStores(6)
    rerender(<FileExplorerApp />)
    expect(screen.getByText(/Salary Review 2025/i)).toBeInTheDocument()
    expect(screen.getByText(/Teams meeting notes/i)).toBeInTheDocument()

    resetStores(8)
    rerender(<FileExplorerApp />)
    expect(screen.getAllByText(/svch0st\.exe/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/wscript\.exe/i).length).toBeGreaterThan(0)
  })

  it('renders SMS and vishing social-engineering tells', () => {
    resetStores(4)
    const { rerender } = render(<MessagesApp />)

    expect(screen.getAllByText(/7726/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/bit\.ly\/nb-case-4831/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/expands to national-bank-secure\.com/i)).toBeInTheDocument()
    expect(screen.getByText(/Reply STOP/i)).toBeInTheDocument()

    resetStores(5)
    rerender(<DialerApp />)
    expect(screen.getByText(/Spoofed caller ID/i)).toBeInTheDocument()
    expect(screen.getByText(/Do not call back/i)).toBeInTheDocument()
  })
})
