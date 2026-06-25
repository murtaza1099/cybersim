import { useEffect } from 'react'
import { ATTACK_POINTS } from '../../config/attacks'
import { useGameStore } from '../../stores/gameStore'
import { useAudioStore } from '../../stores/audioStore'

// One-time entry animation
if (typeof document !== 'undefined' && !document.getElementById('scc-kf')) {
  const s = document.createElement('style')
  s.id = 'scc-kf'
  s.textContent = `
    @keyframes sccIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .scc-in { animation: sccIn 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .scc-decision:hover { background: rgba(0,240,255,0.08) !important; }
  `
  document.head.appendChild(s)
}

// Header accent colour per attack category.
function categoryColor(id: number): string {
  if (id === 4 || id === 5) return '#ffaa00'        // phone / SMS
  if (id === 6 || id === 7 || id === 8) return '#ff3355' // USB / physical / system
  return '#00f0ff'                                   // email / web
}

interface ScenarioContextCardProps {
  attackId: number
  onProceed: () => void
  onAbort: () => void
}

export default function ScenarioContextCard({ attackId, onProceed, onAbort }: ScenarioContextCardProps) {
  // Play the scenario's context audio cue as the card opens. Phone (vishing) keeps
  // ringing as a loop; everything else is a one-shot. No cleanup here — on PROCEED the
  // scenario keeps its audio, and on ABORT/dismiss the game's exitToScene() →
  // stopAllScenarioAudio() stops any looping cue.
  useEffect(() => {
    const a = ATTACK_POINTS.find(p => p.id === attackId)
    const cue = a?.contextAudioCue ?? a?.audioCue
    if (!cue) return
    const audio = useAudioStore.getState()
    if (cue === 'phone_ring_landline') audio.startLoop('phone_ring_landline')
    else audio.play(cue)
  }, [attackId])

  const attack = ATTACK_POINTS.find(a => a.id === attackId)
  if (!attack) return null

  const accent = categoryColor(attack.id)
  const neutralDecisionButton: React.CSSProperties = {
    width: '100%',
    padding: '11px 0',
    borderRadius: 6,
    background: 'transparent',
    border: '1px solid rgba(0,240,255,0.28)',
    color: '#e5e7eb',
    fontFamily: "'Orbitron',sans-serif",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'background 200ms ease',
  }

  const handleProceed = () => {
    useAudioStore.getState().play('ui_click')
    onProceed()
  }

  // "Leave It & Report" — doing nothing is the correct response (USB drop).
  const handleSecondary = () => {
    useAudioStore.getState().play('ui_click')
    useGameStore.getState().completePoint(attack.id, attack.scoreReward)
  }

  const handleAbort = () => {
    useAudioStore.getState().play('ui_click')
    onAbort()
  }

  return (
    <div style={{ minHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="scc-in" style={{
        width: 460, maxWidth: '92vw',
        background: 'rgba(6,10,18,0.97)', backdropFilter: 'blur(14px)',
        border: '1px solid #3a3f4a', borderTop: `2px solid ${accent}`,
        borderRadius: 10, padding: '22px 24px',
        fontFamily: "'DM Sans',sans-serif",
        boxShadow: `0 0 26px ${accent}22`,
      }}>
        {/* Header badge + time */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
              background: `${accent}1f`, border: `1px solid ${accent}66`,
            }}>
              {attack.contextIcon}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700,
              color: accent, letterSpacing: '0.14em',
            }}>
              {attack.contextHeader}
            </div>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#6c7280', letterSpacing: '0.1em' }}>
            {attack.time}
          </div>
        </div>

        {/* Location line */}
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#6c7280', letterSpacing: '0.08em', marginBottom: 12 }}>
          LOCATION: <span style={{ color: accent }}>{attack.displayName}</span>
        </div>

        {/* Narrative */}
        <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.75, margin: '0 0 22px' }}>
          {attack.contextNarrative}
        </p>

        {/* Primary action */}
        <button className="scc-decision" onClick={handleProceed} style={neutralDecisionButton}>
          {attack.actionLabel ?? 'Proceed'} →
        </button>

        {/* Optional secondary (correct "do nothing" action) */}
        {attack.actionLabelSecondary && (
          <button className="scc-decision" onClick={handleSecondary} style={{ ...neutralDecisionButton, marginTop: 10 }}>
            {attack.actionLabelSecondary}
          </button>
        )}

        {/* Abort */}
        <button className="scc-decision" onClick={handleAbort} style={{ ...neutralDecisionButton, marginTop: 10 }}>
          [ STEP AWAY ]
        </button>
      </div>
    </div>
  )
}
