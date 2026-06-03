import { useMemo } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useCameraStore } from '../stores/cameraStore'
import { ATTACK_POINTS } from '../config/attacks'
import { useAudioStore } from '../stores/audioStore'

const glass: React.CSSProperties = {
  position: 'fixed', right: 0, top: 0, height: '100%', width: 420,
  background: 'rgba(8,12,20,0.95)', backdropFilter: 'blur(12px)',
  borderLeft: '3px solid #00f0ff', boxShadow: '-4px 0 20px #00f0ff22',
  display: 'flex', flexDirection: 'column', padding: '32px 28px',
  fontFamily: "'DM Sans', sans-serif", zIndex: 90,
  overflowY: 'auto',
  transform: 'translateX(100%)',
  transition: 'transform 380ms cubic-bezier(0.16, 1, 0.3, 1)',
  willChange: 'transform',
}

const btn = (primary: boolean): React.CSSProperties => ({
  flex: 1, padding: '10px 0', borderRadius: 6, cursor: 'pointer', border: 'none',
  fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  ...(primary
    ? { background: '#00f0ff', color: '#050810' }
    : { background: 'transparent', border: '1px solid #3a3f4a', color: '#6c7280' }),
})

export default function AttackPanel() {
  const activePoint     = useGameStore(s => s.activePoint)
  const activeLayer     = useGameStore(s => s.activeLayer)
  const reviewMode      = useGameStore(s => s.reviewMode)
  const score           = useGameStore(s => s.score)
  const completedPoints = useGameStore(s => s.completedPoints)
  const attempts        = useGameStore(s => s.attempts)
  const eventLog        = useGameStore(s => s.eventLog)
  const openOS          = useGameStore(s => s.openOS)
  const beginScenario   = useGameStore(s => s.beginScenario)
  const exitToScene     = useGameStore(s => s.exitToScene)

  // Hide when OS is open so panel doesn't cover it. Windows modal has 80ms entry delay
  // so the panel slides out first (380ms CSS transition, t=0) then Windows fades in (t=80ms).
  const shouldShow = activePoint !== null && activeLayer === 'briefing'
  const attack  = useMemo(
    () => ATTACK_POINTS.find(a => a.id === activePoint) ?? null,
    [activePoint]
  )

  const handleBegin = () => {
    if (!attack) return
    beginScenario()
    useAudioStore.getState().fadeOut('ambient_office_loop', 600)
    useAudioStore.getState().fadeIn('scenario_tension_loop', 0.13, 700)
    if (attack.triggerOS !== 'scene') openOS(attack.triggerOS as 'windows' | 'android')
    if (attack.audioCue === 'phone_ring_landline') {
      useAudioStore.getState().startLoop('phone_ring_landline')
    } else {
      useAudioStore.getState().play(attack.audioCue)
    }
  }

  const handleAbort = () => {
    exitToScene()
    useCameraStore.getState().restoreInitial()
  }

  const pointLog   = eventLog.filter(e => e.pointId === activePoint).slice(-3)
  const attemptCount = attack ? (attempts[attack.id] ?? 0) : 0
  const showHint     = attemptCount >= 3

  return (
    <div style={{ ...glass, transform: shouldShow ? 'translateX(0)' : 'translateX(100%)' }}>
      {attack && <>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#00f0ff66' }}>
          [ {attack.tag} // {reviewMode ? 'REVIEW' : 'LEVEL_1'} ]
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 0 }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, color: '#e5e7eb', lineHeight: 1.2 }}>
            {attack.label}
          </div>
          {attack.isAttack
            ? <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(255,51,85,0.12)', border: '1px solid #ff335566', color: '#ff6688', fontFamily: "'JetBrains Mono',monospace", fontSize: 10, whiteSpace: 'nowrap' }}>⚠ THREAT</span>
            : <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(255,170,0,0.1)', border: '1px solid #ffaa0055', color: '#ffbb44', fontFamily: "'JetBrains Mono',monospace", fontSize: 10, whiteSpace: 'nowrap' }}>⚠ INVESTIGATE</span>
          }
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 20 }}>
          {ATTACK_POINTS.map(a => (
            <div key={a.id} style={{
              width: 10, height: 10, borderRadius: '50%',
              background: completedPoints.includes(a.id) ? '#00ff88' : a.id === activePoint ? '#00f0ff' : '#2a2f3a',
              boxShadow: a.id === activePoint ? '0 0 8px #00f0ff' : 'none',
            }} />
          ))}
        </div>

        <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.7, margin: '0 0 12px' }}>
          {attack.briefing}
        </p>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#6c7280', marginBottom: 14 }}>
          LOCATION: <span style={{ color: '#00f0ff' }}>{attack.displayName}</span>
        </div>

        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#00f0ff', marginBottom: 16 }}>
          {attack.isAttack
            ? '▸ OBJECTIVE — Identify the threat vector and respond correctly.'
            : '▸ OBJECTIVE — Assess the situation. Not everything is an attack.'}
        </div>

        {/* Attempts counter */}
        {attemptCount > 0 && (
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#ff6688', marginBottom: 8 }}>
            ATTEMPTS: {attemptCount} — each wrong answer costs 10 pts
          </div>
        )}

        {/* Hint after 3 failures */}
        {showHint && (
          <div style={{
            padding: '10px 14px', borderRadius: 6,
            background: 'rgba(255,170,0,0.08)', border: '1px solid #ffaa0033',
            color: '#ffbb44', fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
            lineHeight: 1.6, marginBottom: 16,
          }}>
            💡 HINT: {attack.hint}
          </div>
        )}

        {/* Event telemetry */}
        {pointLog.length > 0 && (
          <div style={{ maxHeight: 72, overflowY: 'auto', marginBottom: 16 }}>
            {pointLog.map(e => (
              <div key={e.id} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#3a3f4a', marginBottom: 2 }}>
                {new Date(e.ts).toLocaleTimeString()} — {e.type}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
          <button style={btn(true)}  onClick={handleBegin}>{reviewMode ? '[ BEGIN REVIEW ]' : '[ BEGIN ]'}</button>
          <button style={btn(false)} onClick={handleAbort}>[ ABORT ]</button>
        </div>

        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#3a3f4a', marginTop: 14 }}>
          SCORE: {score} // OBJ {completedPoints.length}/8
        </div>
      </>}
    </div>
  )
}
