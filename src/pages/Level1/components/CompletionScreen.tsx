import { useCameraStore } from '../stores/cameraStore'
import { useGameStore }   from '../stores/gameStore'
import { ATTACK_POINTS }  from '../config/attacks'
import type { Level1ExitResult } from '../App'

const MAX_SCORE = ATTACK_POINTS.reduce((sum, a) => sum + a.scoreReward, 0)

function getRating(score: number): { label: string; color: string } {
  if (score >= MAX_SCORE)    return { label: 'EXPERT DEFENDER',    color: '#00ff88' }
  if (score >= 700)          return { label: 'SECURITY AWARE',     color: '#00f0ff' }
  if (score >= 400)          return { label: 'NEEDS TRAINING',     color: '#ffbb44' }
  return                            { label: 'HIGH RISK PROFILE',  color: '#ff3355' }
}

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace" }

type CompletionScreenProps = {
  onExit?: (result?: Level1ExitResult) => void
}

export default function CompletionScreen({ onExit }: CompletionScreenProps) {
  const score     = useGameStore(s => s.score)
  const attempts  = useGameStore(s => s.attempts)
  const completed = useGameStore(s => s.completedPoints.length)
  const failed    = useGameStore(s => s.failedPoints.length)
  const resetGame = useGameStore(s => s.resetGame)
  const rating    = getRating(score)

  const struggled  = ATTACK_POINTS.filter(a => (attempts[a.id] ?? 0) > 0)
  const firstTries = ATTACK_POINTS.filter(a => (attempts[a.id] ?? 0) === 0)

  const handleReplay = () => {
    resetGame()
    useCameraStore.getState().restoreInitial()
  }

  const handleBackToDashboard = () => {
    onExit?.({
      score,
      status: 'completed',
      completedAttacks: completed,
      failedAttacks: failed,
      pcSubAttackResults: useGameStore.getState().pcSubAttackResults,
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(5,8,16,0.97)',
      backdropFilter: 'blur(16px)', zIndex: 200,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflowY: 'auto', padding: '40px 24px',
    }}>
      {/* Header */}
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 28, color: '#00ff88', letterSpacing: '0.12em', marginBottom: 6, textAlign: 'center' }}>
        LEVEL 1 COMPLETE
      </div>
      <div style={{ ...mono, fontSize: 12, color: '#6c7280', letterSpacing: '0.1em', marginBottom: 32, textAlign: 'center' }}>
        Security Awareness Assessment — Results
      </div>

      {/* Score breakdown */}
      <div style={{ width: '100%', maxWidth: 560, background: '#0a0e18', border: '1px solid #1a1f2a', borderRadius: 10, overflow: 'hidden', marginBottom: 28 }}>
        <div style={{ padding: '10px 20px', background: '#0d1320', borderBottom: '1px solid #1a1f2a', ...mono, fontSize: 11, color: '#6c7280' }}>
          ATTACK BREAKDOWN
        </div>
        {ATTACK_POINTS.map(a => {
          const att = attempts[a.id] ?? 0
          const pts = att === 0 ? a.scoreReward : Math.max(0, a.scoreReward - att * 10)
          return (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', padding: '9px 20px', borderBottom: '1px solid #1a1f2a' }}>
              <div style={{ ...mono, fontSize: 10, color: '#3a3f4a', width: 80, flexShrink: 0 }}>{a.tag}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#9ca3af', flex: 1 }}>{a.label}</div>
              <div style={{ ...mono, fontSize: 11, color: att === 0 ? '#00ff88' : '#ffbb44', marginRight: 16 }}>
                +{pts}
              </div>
              <div style={{ ...mono, fontSize: 10, color: att > 0 ? '#ff6688' : '#3a3f4a' }}>
                {att > 0 ? `${att} attempt${att > 1 ? 's' : ''}` : '✓ first try'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Final score */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 42, color: rating.color, letterSpacing: '0.06em', lineHeight: 1 }}>
          {score}
        </div>
        <div style={{ ...mono, fontSize: 12, color: '#6c7280', marginTop: 4 }}>
          / {MAX_SCORE} pts
        </div>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, color: rating.color, marginTop: 12, letterSpacing: '0.12em' }}>
          {rating.label}
        </div>
      </div>

      {/* Awareness summary */}
      <div style={{ width: '100%', maxWidth: 560, marginBottom: 32 }}>
        {struggled.length > 0 && (
          <div style={{ padding: '12px 16px', borderRadius: 6, background: '#1a0808', border: '1px solid #ff335533', marginBottom: 12 }}>
            <div style={{ ...mono, fontSize: 10, color: '#ff6688', marginBottom: 8, letterSpacing: '0.1em' }}>YOU STRUGGLED WITH</div>
            {struggled.map(a => (
              <div key={a.id} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#ff9988', lineHeight: 1.6 }}>
                • {a.label}
              </div>
            ))}
          </div>
        )}
        {firstTries.length > 0 && (
          <div style={{ padding: '12px 16px', borderRadius: 6, background: '#001a0a', border: '1px solid #00ff8833' }}>
            <div style={{ ...mono, fontSize: 10, color: '#00ff88', marginBottom: 8, letterSpacing: '0.1em' }}>YOUR STRENGTHS</div>
            {firstTries.map(a => (
              <div key={a.id} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#00cc66', lineHeight: 1.6 }}>
                • {a.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 14, width: '100%', maxWidth: 560 }}>
        <button onClick={handleReplay} style={{
          flex: 1, padding: '13px 0', borderRadius: 8, cursor: 'pointer',
          background: '#00f0ff', border: 'none',
          fontFamily: "'Orbitron',sans-serif", fontSize: 11, color: '#050810',
          fontWeight: 700, letterSpacing: '0.1em',
        }}>
          [ REPLAY LEVEL 1 ]
        </button>
        <button onClick={handleBackToDashboard} style={{
          flex: 1, padding: '13px 0', borderRadius: 8,
          background: 'transparent', border: '1px solid #00ff88',
          fontFamily: "'Orbitron',sans-serif", fontSize: 11, color: '#00ff88',
          letterSpacing: '0.06em', cursor: 'pointer',
        }}>
          BACK TO DASHBOARD
        </button>
      </div>
    </div>
  )
}
