import { useState, useEffect } from 'react'
import { useGameStore } from '../../stores/gameStore'

export default function SessionResumeToast() {
  const score           = useGameStore(s => s.score)
  const completedPoints = useGameStore(s => s.completedPoints)
  const currentPointId  = useGameStore(s => s.currentPointId)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (score > 0 || completedPoints.length > 0) {
      setVisible(true)
      const t = setTimeout(() => setVisible(false), 4000)
      return () => clearTimeout(t)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 120, left: '50%', transform: 'translateX(-50%)',
      zIndex: 190, padding: '10px 20px', borderRadius: 6,
      background: 'rgba(0,12,20,0.92)', border: '1px solid #00f0ff',
      fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#00f0ff',
      whiteSpace: 'nowrap', animation: 'slideUp 0.25s ease',
    }}>
      [ SESSION RESTORED ] OBJ {currentPointId}/8 — SCORE: {score} pts
    </div>
  )
}
