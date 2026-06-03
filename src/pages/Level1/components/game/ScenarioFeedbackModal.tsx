import { ATTACK_POINTS } from '../../config/attacks'
import { useGameStore } from '../../stores/gameStore'
import { useCameraStore } from '../../stores/cameraStore'
import CenteredOverlay from '../ui/CenteredOverlay'

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace" }

function failureCopy(id: number): string {
  switch (id) {
    case 1: return 'Credentials would be captured by a spoofed Microsoft login page, giving an attacker access to email, files, and internal systems.'
    case 2: return 'The fake installer would deploy malware under the cover of a browser update. Real Chrome updates do not require random popup downloads.'
    case 3: return 'The disguised executable would install remote access malware. Double extensions are a common trick for making programs look like documents.'
    case 4: return 'Credential theft risk: this link opens a fake banking portal designed to steal login codes.'
    case 5: return 'The caller would gain remote access by walking you through a convincing support script. Real IT should be verified through official channels.'
    case 6: return 'Unknown USB files can execute malicious macros or firmware attacks, leading to immediate workstation compromise.'
    case 7: return 'An unverified visitor could access restricted areas, plant network equipment, or gather sensitive information through social engineering.'
    case 8: return 'Ignoring or only killing processes lets malware persist, reconnect, and spread. Isolation and escalation are the safe response.'
    default: return 'The selected action would expose the organization to a realistic security compromise.'
  }
}

function successCopy(id: number): string {
  switch (id) {
    case 4: return 'Threat neutralized. The clue was the unofficial banking domain and urgent fraud language. Always verify through an official channel.'
    case 5: return 'Threat neutralized. You avoided remote access pressure and verified through a safer channel.'
    case 7: return 'Threat neutralized. Physical access requests must be verified before anyone reaches sensitive areas.'
    default: return 'Threat neutralized. You identified the suspicious signal and chose the safer response.'
  }
}

export default function ScenarioFeedbackModal() {
  const activeLayer = useGameStore(s => s.activeLayer)
  const activePoint = useGameStore(s => s.activePoint)
  const completedPoints = useGameStore(s => s.completedPoints)
  const failedPoints = useGameStore(s => s.failedPoints)
  const exitToScene = useGameStore(s => s.exitToScene)
  const attack = ATTACK_POINTS.find(a => a.id === activePoint)

  if (activeLayer !== 'feedback' || !attack) return null

  const failed = failedPoints.includes(attack.id)
  const completed = completedPoints.includes(attack.id)
  if (!failed && !completed) return null

  const handleReturn = () => {
    exitToScene()
    useCameraStore.getState().restoreInitial()
  }

  return (
    <CenteredOverlay>
      <section style={{
        background: failed
          ? 'linear-gradient(135deg, rgba(24,4,8,.98), rgba(8,10,18,.98))'
          : 'linear-gradient(135deg, rgba(0,26,15,.98), rgba(6,10,18,.98))',
        border: `1px solid ${failed ? '#ff335566' : '#00ff884d'}`,
        color: '#e5e7eb',
        padding: '32px',
        fontFamily: "'DM Sans',sans-serif",
      }}>
        <div style={{ ...mono, fontSize: 11, color: failed ? '#ff6688' : '#00ff88', letterSpacing: '.18em', marginBottom: 12 }}>
          {attack.tag} // {attack.displayName}
        </div>
        <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 28, margin: '0 0 14px', color: failed ? '#ff6688' : '#00ff88', letterSpacing: '.08em' }}>
          {failed ? 'SECURITY FAILURE' : 'THREAT NEUTRALIZED'}
        </h1>
        <p style={{ color: failed ? '#ffb3bf' : '#a7f3d0', fontSize: 15, lineHeight: 1.75, maxWidth: 680, margin: '0 0 28px' }}>
          {failed ? failureCopy(attack.id) : successCopy(attack.id)}
        </p>
        <button onClick={handleReturn} style={{
          padding: '12px 22px',
          borderRadius: 10,
          border: `1px solid ${failed ? '#ff3355' : '#00ff88'}`,
          background: failed ? '#ff3355' : '#00ff88',
          color: '#050810',
          cursor: 'pointer',
          fontFamily: "'Orbitron',sans-serif",
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '.08em',
        }}>
          RETURN TO OFFICE
        </button>
      </section>
    </CenteredOverlay>
  )
}
