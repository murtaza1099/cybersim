import { useState } from 'react'
import { useGameStore } from '../../../stores/gameStore'
import { useAudioStore } from '../../../stores/audioStore'
import { useCameraStore } from '../../../stores/cameraStore'

if (typeof document !== 'undefined' && !document.getElementById('msg-kf')) {
  const s = document.createElement('style')
  s.id = 'msg-kf'
  s.textContent = `
    @keyframes ptsMinus3 { 0%,100% { opacity:1 } 60% { opacity:0.3 } }
    .pts-flash3 { animation: ptsMinus3 0.4s ease 3 }
  `
  document.head.appendChild(s)
}

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace" }
const neutralDecisionButton: React.CSSProperties = {
  padding: '11px',
  borderRadius: 8,
  background: 'transparent',
  border: '1px solid rgba(0,240,255,0.28)',
  color: '#e5e7eb',
  fontFamily: "'Orbitron',sans-serif",
  fontSize: 10,
  cursor: 'pointer',
  letterSpacing: '0.06em',
}

export default function MessagesApp() {
  const activePoint = useGameStore(s => s.activePoint)
  const [detail, setDetail]           = useState(true)
  const [hoverUrl, setHoverUrl]       = useState(false)
  const [consequence, setConsequence] = useState<string | null>(null)
  const [succeeded, setSucceeded]     = useState(false)
  const completePoint = useGameStore(s => s.completePoint)
  const failAttempt   = useGameStore(s => s.failAttempt)
  const exitToScene   = useGameStore(s => s.exitToScene)
  const showLegacySmsChoices = false

  if (activePoint !== 4) return null

  const handleVerify = () => {
    failAttempt(4, 'clicked_sms_link')
    setConsequence(
      'You visited a credential-harvesting site. The shortened link expanded to "national-bank-secure.com", which is not National Bank\'s real website (nationalbank.com). Attackers register similar-sounding domains.\n\nThe shortcode sender can be spoofed or abused through SMS providers — it does not prove origin.\n\nAlways contact your bank using the number on the back of your card.'
    )
  }

  const handleIgnore = () => {
    setSucceeded(true)
    setTimeout(() => completePoint(4, 120), 1400)
  }

  const handleWrongChoice = (reason: string) => {
    useAudioStore.getState().playSound('ui_click')
    failAttempt(4, reason)
    setConsequence('Credential theft risk: the shortened link expands to a fake banking portal designed to steal login codes.')
  }

  const handleCorrectChoice = () => {
    useAudioStore.getState().playSound('ui_click')
    setSucceeded(true)
    setTimeout(() => completePoint(4, 120), 1400)
  }

  const handleUnderstood = () => {
    exitToScene()
    useCameraStore.getState().restoreInitial()
  }

  // Thread list
  if (!detail) {
    return (
      <div style={{ height: '100%', background: '#06080f', color: '#e5e7eb', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', fontFamily: "'Orbitron',sans-serif", fontSize: 12, color: '#00f0ff', borderBottom: '1px solid #1a1f2a' }}>
          Messages
        </div>
        <div onClick={() => setDetail(true)}
             style={{ padding: '14px 16px', borderBottom: '1px solid #1a1f2a', cursor: 'pointer', background: '#0d1117', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1a0814', border: '1px solid #ff335544', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏦</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <div style={{ ...mono, fontSize: 13, color: '#ff6688', fontWeight: 700 }}>7726 NATBANK</div>
              <div style={{ ...mono, fontSize: 10, color: '#3a3f4a' }}>Now</div>
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              FRAUD ALERT: Unusual transaction detected...
            </div>
          </div>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4466', flexShrink: 0 }} />
        </div>
      </div>
    )
  }

  // Conversation view
  return (
    <div style={{ position: 'relative', height: '100%', background: '#06080f', color: '#e5e7eb', display: 'flex', flexDirection: 'column' }}>

      {/* Consequence overlay */}
      {consequence && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(18,2,6,0.97)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '24px 28px', zIndex: 20,
        }}>
          <div className="pts-flash3" style={{ ...mono, fontSize: 22, color: '#ff3355', fontWeight: 700, marginBottom: 18, letterSpacing: '0.1em' }}>
            −10 PTS
          </div>
          <div style={{ ...mono, fontSize: 10, color: '#ff335588', letterSpacing: '0.18em', marginBottom: 14 }}>
            SECURITY FAILURE
          </div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#ff8899', lineHeight: 1.8, textAlign: 'center', marginBottom: 24, whiteSpace: 'pre-line' }}>
            {consequence}
          </div>
          <button onClick={handleUnderstood} style={{
            padding: '9px 28px', background: 'transparent', border: '1px solid #ff3355',
            color: '#ff6688', ...mono, fontSize: 11, cursor: 'pointer', borderRadius: 4,
          }}>RETURN TO OFFICE</button>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '12px 16px', fontFamily: "'Orbitron',sans-serif", fontSize: 12, color: '#00f0ff', borderBottom: '1px solid #1a1f2a', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span onClick={() => setDetail(false)} style={{ cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>◁</span>
        <span style={{ color: '#ff6688' }}>7726 NATBANK</span>
        <span style={{ ...mono, fontSize: 9, color: '#3a3f4a', marginLeft: 4 }}>Bank shortcode — spoofable</span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: '16px 14px', overflowY: 'auto' }}>
        {/* Sender info note */}
        <div style={{ textAlign: 'center', ...mono, fontSize: 10, color: '#3a3f4a', marginBottom: 16 }}>
          Sender: 7726 shortcode · Delivery route not verified
        </div>

        {/* SMS bubble */}
        <div style={{ background: '#0d1117', borderRadius: '14px 14px 14px 2px', padding: '12px 14px', maxWidth: '88%', marginBottom: 12 }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#9ca3af', lineHeight: 1.65 }}>
            National Bank: A card payment of $2,847.00 was attempted from your account.
            <br /><br />
            If this wasn't you, verify immediately to freeze the transfer:
            <br />
            <span
              onMouseEnter={() => setHoverUrl(true)}
              onMouseLeave={() => setHoverUrl(false)}
              style={{ color: '#e5e7eb', textDecoration: 'underline', cursor: 'help', ...mono, fontSize: 12 }}>
              bit.ly/nb-case-4831
            </span>
            <br /><br />
            Reply STOP to opt out of security alerts.
          </div>
          <div style={{ marginTop: 8, ...mono, fontSize: 10, color: '#8b96a8' }}>
            Link preview: bit.ly/nb-case-4831 expands to national-bank-secure.com
          </div>
          {hoverUrl && (
            <div style={{ marginTop: 8, ...mono, fontSize: 10, color: '#ff6644', background: '#1a0808', padding: '3px 8px', borderRadius: 3 }}>
              ⚠ Not nationalbank.com — suspicious lookalike domain
            </div>
          )}
        </div>

        {showLegacySmsChoices && succeeded && (
          <div style={{ padding: '12px 14px', border: '1px solid #00ff88', borderRadius: 8, ...mono, fontSize: 12, color: '#00ff88', lineHeight: 1.7 }}>
            ✓ Correct! +120 pts<br />
            <span style={{ fontSize: 11, color: '#00cc66' }}>
              The shortcode can be spoofed. The URL reveals the truth —<br />
              it's not nationalbank.com. Never click links in bank texts.
            </span>
          </div>
        )}

        {succeeded && (
          <div style={{ padding: '12px 14px', border: '1px solid #00ff88', borderRadius: 8, ...mono, fontSize: 12, color: '#00ff88', lineHeight: 1.7 }}>
            Correct! +120 pts<br />
            <span style={{ fontSize: 11, color: '#00cc66' }}>
              Threat neutralized. The clue was the shortened link expanding to an unofficial banking domain. Always verify through an official channel.
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      {showLegacySmsChoices && !succeeded && !consequence && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid #1a1f2a', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          <button onClick={handleVerify} style={neutralDecisionButton}>
            ⚡ VERIFY NOW — Freeze Transaction
          </button>
          <button onClick={handleIgnore} style={neutralDecisionButton}>
            [ IGNORE & BLOCK ]
          </button>
        </div>
      )}

      {!succeeded && !consequence && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid #1a1f2a', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          <button onClick={() => handleWrongChoice('tapped_sms_link')} style={neutralDecisionButton}>
            1. Tap the link
          </button>
          <button onClick={() => handleWrongChoice('replied_with_account_details')} style={neutralDecisionButton}>
            2. Reply with account details
          </button>
          <button onClick={handleCorrectChoice} style={neutralDecisionButton}>
            3. Call bank using official number
          </button>
          <button onClick={handleCorrectChoice} style={neutralDecisionButton}>
            4. Report as phishing
          </button>
        </div>
      )}
    </div>
  )
}
