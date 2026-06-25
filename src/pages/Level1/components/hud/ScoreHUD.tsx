import { useGameStore } from '../../stores/gameStore'
import { ATTACK_POINTS } from '../../config/attacks'
import { colors, fonts } from '../../styles/theme'
import { useEffect, useState, useRef, useMemo } from 'react'

// One-time keyframes for the clock value fade
if (typeof document !== 'undefined' && !document.getElementById('hud-kf')) {
  const s = document.createElement('style')
  s.id = 'hud-kf'
  s.textContent = `@keyframes hudClockFade { from { opacity: 0; } to { opacity: 1; } }`
  document.head.appendChild(s)
}

// In-world clock: snapshots to the current attack's time. Falls back to the intro time.
function currentSceneTime(currentPointId: number): string {
  const lookupId = currentPointId > 8 ? 8 : currentPointId
  return ATTACK_POINTS.find(a => a.id === lookupId)?.time ?? '15:47'
}

// Best possible score: every reward, no failed deductions (= 1040).
const MAX_SCORE = ATTACK_POINTS.reduce((sum, a) => sum + a.scoreReward, 0)

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
  const sceneTime       = useMemo(() => currentSceneTime(currentPointId), [currentPointId])

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
      {/* In-world clock — snapshots forward as objectives advance */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <span
          key={sceneTime}
          style={{
            fontFamily: fonts.mono, fontSize: 13, color: colors.cyan,
            letterSpacing: '0.15em', padding: '4px 10px', borderRadius: 4,
            border: '1px solid #00f0ff33', background: 'rgba(0,240,255,0.05)',
            animation: 'hudClockFade 400ms ease',
          }}
        >
          [ {sceneTime} ]
        </span>
      </div>
      <div style={{ fontFamily: fonts.mono, fontSize: 9, color: 'rgba(0,240,255,0.5)', letterSpacing: 2, marginBottom: 8 }}>
        [ SCORE ]
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontFamily: fonts.display, fontSize: 26, color: colors.cyan, fontWeight: 700, lineHeight: 1 }}>
          {displayScore}
        </span>
        <span style={{ fontFamily: fonts.mono, fontSize: 13, color: 'rgba(0,240,255,0.45)', fontWeight: 600 }}>
          / {MAX_SCORE}
        </span>
      </div>
      <div style={{ fontFamily: fonts.mono, fontSize: 9, color: 'rgba(0,240,255,0.4)', marginTop: 2, marginBottom: 8 }}>
        PTS
      </div>
      {/* Score progress toward the maximum */}
      <div style={{ width: '100%', height: 3, borderRadius: 2, background: '#1a1f2e', overflow: 'hidden', marginBottom: 10 }}>
        <div style={{
          height: '100%', borderRadius: 2,
          width: `${Math.min(100, (score / MAX_SCORE) * 100)}%`,
          background: `linear-gradient(90deg, ${colors.cyan}, ${colors.green})`,
          boxShadow: '0 0 6px rgba(0,240,255,0.4)',
          transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }} />
      </div>
      <div style={{ fontFamily: fonts.mono, fontSize: 9, color: 'rgba(156,163,175,0.7)', marginBottom: 6 }}>
        OBJ: {completedPoints.filter(id => ATTACK_POINTS.some(a => a.id === id)).length} / {ATTACK_POINTS.length}
      </div>
      <div style={{ display: 'flex', gap: 3 }}>
        {ATTACK_POINTS.map(a => {
          const isDone    = completedPoints.includes(a.id)
          const isCurrent = a.id === currentPointId && !isDone
          return (
            <div key={a.id} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: isDone ? colors.green : isCurrent ? colors.cyan : '#1a2030',
              boxShadow: isCurrent ? `0 0 6px ${colors.cyan}` : 'none',
              transition: 'background 0.4s, box-shadow 0.4s',
            }} />
          )
        })}
      </div>
    </div>
  )
}
