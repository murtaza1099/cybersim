import { useGameStore } from '../../stores/gameStore'
import { useEffect, useState, useRef } from 'react'

// Hook: Animated counter for score
function useCountUp(target: number, duration: number) {
  const [display, setDisplay] = useState(target)
  const prev = useRef(target)
  useEffect(() => {
    const start = prev.current
    const diff = target - start
    if (diff === 0) return
    const startTime = performance.now()
    let frameId: number
    const tick = () => {
      const elapsed = performance.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)  // easeOutCubic
      setDisplay(Math.round(start + diff * eased))
      if (progress < 1) frameId = requestAnimationFrame(tick)
      else prev.current = target
    }
    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [target, duration])
  return display
}

export default function ScoreHUD() {
  const score           = useGameStore(s => s.score)
  const completedPoints = useGameStore(s => s.completedPoints)
  const currentPointId  = useGameStore(s => s.currentPointId)
  const displayScore    = useCountUp(score, 600)

  return (
    <div style={{
      position: 'fixed', top: 12, right: 12,
      width: 160, padding: '12px 16px',
      background: 'rgba(6,10,18,0.9)',
      border: '1px solid rgba(0,240,255,0.14)',
      borderRadius: 10,
      backdropFilter: 'blur(10px)',
      boxShadow: '0 0 20px rgba(0,240,255,0.05)',
      zIndex: 80,
    }}>
      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(0,240,255,0.5)', letterSpacing: 2, marginBottom: 8 }}>
        [ SCORE ]
      </div>
      <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 28, color: '#00f0ff', fontWeight: 700, lineHeight: 1 }}>
        {displayScore}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(0,240,255,0.4)', marginTop: 2, marginBottom: 10 }}>
        PTS
      </div>
      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(156,163,175,0.7)', marginBottom: 6 }}>
        OBJ {completedPoints.length}/8
      </div>
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: 8 }, (_, i) => {
          const id = i + 1
          const isDone    = completedPoints.includes(id)
          const isCurrent = id === currentPointId && !isDone
          return (
            <div key={id} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: isDone ? '#00ff88' : isCurrent ? '#00f0ff' : '#1a2030',
              boxShadow: isCurrent ? '0 0 6px #00f0ff' : 'none',
              transition: 'background 0.4s, box-shadow 0.4s',
            }} />
          )
        })}
      </div>
    </div>
  )
}
