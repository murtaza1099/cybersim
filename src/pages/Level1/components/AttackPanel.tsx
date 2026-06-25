import { useMemo } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useCameraStore } from '../stores/cameraStore'
import { ATTACK_POINTS } from '../config/attacks'
import { useAudioStore } from '../stores/audioStore'
import { colors, fonts } from '../styles/theme'

const glass: React.CSSProperties = {
  position: 'fixed', right: 0, top: 0, height: '100%', width: 420,
  background: colors.surface, backdropFilter: 'blur(12px)',
  borderLeft: `3px solid ${colors.cyan}`, boxShadow: '-4px 0 20px #00f0ff22',
  display: 'flex', flexDirection: 'column', padding: '32px 28px',
  fontFamily: fonts.body, zIndex: 90,
  overflowY: 'auto',
  transform: 'translateX(100%)',
  transition: 'transform 380ms cubic-bezier(0.16, 1, 0.3, 1)',
  willChange: 'transform',
}

const btn = (primary: boolean): React.CSSProperties => ({
  flex: 1, padding: '10px 0', borderRadius: 6, cursor: 'pointer', border: 'none',
  fontFamily: fonts.display, fontSize: 11, fontWeight: 700,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  ...(primary
    ? { background: colors.cyan, color: colors.bgBase }
    : { background: 'transparent', border: `1px solid ${colors.border}`, color: colors.textDim }),
})

export default function AttackPanel() {
  const activePoint     = useGameStore(s => s.activePoint)
  const activeLayer     = useGameStore(s => s.activeLayer)
  const reviewMode      = useGameStore(s => s.reviewMode)
  const score           = useGameStore(s => s.score)
  const completedPoints = useGameStore(s => s.completedPoints)
  const attempts        = useGameStore(s => s.attempts)
  const eventLog        = useGameStore(s => s.eventLog)
  const beginScenario   = useGameStore(s => s.beginScenario)
  const enterContext    = useGameStore(s => s.enterContext)
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
    // ATK_007 has a bespoke in-scene DeliveryCard — go straight to the scenario.
    if (attack.triggerOS === 'scene') {
      beginScenario()
      useAudioStore.getState().fadeOut('ambient_office_loop', 600)
      useAudioStore.getState().fadeIn('scenario_tension_loop', 0.13, 700)
      useAudioStore.getState().play(attack.audioCue)
      return
    }
    // Everyone else gets a scenario-context card before the OS opens.
    enterContext()
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
        <div style={{ fontFamily: fonts.mono, fontSize: 11, color: '#00f0ff66' }}>
          [ {attack.tag} // {reviewMode ? 'REVIEW' : 'LEVEL_1'} ]
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 0 }}>
          <div style={{ fontFamily: fonts.display, fontSize: 20, color: '#e5e7eb', lineHeight: 1.2 }}>
            {attack.label}
          </div>
          {attack.isAttack
            ? <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(255,51,85,0.12)', border: '1px solid #ff335566', color: '#ff6688', fontFamily: fonts.mono, fontSize: 10, whiteSpace: 'nowrap' }}>⚠ THREAT</span>
            : <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(255,170,0,0.1)', border: '1px solid #ffaa0055', color: '#ffbb44', fontFamily: fonts.mono, fontSize: 10, whiteSpace: 'nowrap' }}>⚠ INVESTIGATE</span>
          }
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 20 }}>
          {ATTACK_POINTS.map(a => (
            <div key={a.id} style={{
              width: 10, height: 10, borderRadius: '50%',
              background: completedPoints.includes(a.id) ? colors.green : a.id === activePoint ? colors.cyan : '#2a2f3a',
              boxShadow: a.id === activePoint ? `0 0 8px ${colors.cyan}` : 'none',
            }} />
          ))}
        </div>

        <p style={{ fontSize: 14, color: colors.textMuted, lineHeight: 1.7, margin: '0 0 12px' }}>
          {attack.briefing}
        </p>
        <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim, marginBottom: 14 }}>
          LOCATION: <span style={{ color: colors.cyan }}>{attack.displayName}</span>
        </div>

        <div style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.cyan, marginBottom: 16 }}>
          {attack.isAttack
            ? '▸ OBJECTIVE — Identify the threat vector and respond correctly.'
            : '▸ OBJECTIVE — Assess the situation. Not everything is an attack.'}
        </div>

        {/* Attempts counter */}
        {attemptCount > 0 && (
          <div style={{ fontFamily: fonts.mono, fontSize: 11, color: '#ff6688', marginBottom: 8 }}>
            ATTEMPTS: {attemptCount} — each wrong answer costs 10 pts
          </div>
        )}

        {/* Hint after 3 failures */}
        {showHint && (
          <div style={{
            padding: '10px 14px', borderRadius: 6,
            background: 'rgba(255,170,0,0.08)', border: '1px solid #ffaa0033',
            color: '#ffbb44', fontFamily: fonts.mono, fontSize: 11,
            lineHeight: 1.6, marginBottom: 16,
          }}>
            💡 HINT: {attack.hint}
          </div>
        )}

        {/* Event telemetry */}
        {pointLog.length > 0 && (
          <div style={{ maxHeight: 72, overflowY: 'auto', marginBottom: 16 }}>
            {pointLog.map(e => (
              <div key={e.id} style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.border, marginBottom: 2 }}>
                {new Date(e.ts).toLocaleTimeString()} — {e.type}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
          <button style={btn(true)}  onClick={handleBegin}>{reviewMode ? '[ BEGIN REVIEW ]' : '[ BEGIN ]'}</button>
          <button style={btn(false)} onClick={handleAbort}>[ ABORT ]</button>
        </div>

        <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.border, marginTop: 14 }}>
          SCORE: {score} // OBJ {completedPoints.filter(id => ATTACK_POINTS.some(a => a.id === id)).length}/{ATTACK_POINTS.length}
        </div>
      </>}
    </div>
  )
}
