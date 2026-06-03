import { useEffect } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { useCameraStore } from '../../stores/cameraStore'

export default function BackButton() {
  const focusMode   = useGameStore(s => s.focusMode)
  const closeOS     = useGameStore(s => s.closeOS)
  const exitToScene = useGameStore(s => s.exitToScene)

  const handleBack = () => {
    if (focusMode === 'windows' || focusMode === 'android') {
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
  })  // intentionally no dep array — picks up latest focusMode via closure refresh

  // Windows has its own red-circle X — don't show a second back button over it
  if (focusMode === 'free' || focusMode === 'windows') return null

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
      ◁ BACK
    </button>
  )
}
