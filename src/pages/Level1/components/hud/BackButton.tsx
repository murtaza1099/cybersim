import { useEffect } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { useCameraStore } from '../../stores/cameraStore'
import type { Level1ExitResult } from '../../App'

type BackButtonProps = {
  onExit?: (result?: Level1ExitResult) => void
}

export default function BackButton({ onExit }: BackButtonProps) {
  const focusMode   = useGameStore(s => s.focusMode)
  const closeOS     = useGameStore(s => s.closeOS)
  const exitToScene = useGameStore(s => s.exitToScene)
  const score       = useGameStore(s => s.score)
  const completed   = useGameStore(s => s.completedPoints.length)
  const failed      = useGameStore(s => s.failedPoints.length)

  const handleBack = () => {
    if (focusMode === 'free') {
      const shouldExit = window.confirm('Exit simulation? Progress will be saved locally.')
      if (!shouldExit) return
      onExit?.({
        score,
        status: 'in-progress',
        completedAttacks: completed,
        failedAttacks: failed,
      })
    } else if (focusMode === 'windows' || focusMode === 'android') {
      closeOS()
    } else if (focusMode === 'point') {
      exitToScene()
      useCameraStore.getState().restoreInitial()
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleBack()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  if (focusMode === 'windows') return null

  return (
    <button
      onClick={handleBack}
      style={{
        position: 'fixed', top: 20, left: 20, zIndex: 300,
        background: 'rgba(8,12,20,0.88)', backdropFilter: 'blur(8px)',
        border: '1px solid #3a3f4a', borderRadius: 20,
        padding: '8px 18px', cursor: 'pointer',
        fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#9ca3af',
      }}
    >
      {focusMode === 'free' ? 'EXIT' : '< BACK'}
    </button>
  )
}
