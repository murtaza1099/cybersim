import { useState } from 'react'
import { useGameStore } from '../../../stores/gameStore'
import { useCameraStore } from '../../../stores/cameraStore'

if (typeof document !== 'undefined' && !document.getElementById('ol-sb')) {
  const s = document.createElement('style')
  s.id = 'ol-sb'
  s.textContent = `
    .ol-scroll::-webkit-scrollbar { width: 4px }
    .ol-scroll::-webkit-scrollbar-track { background: #0a0e14 }
    .ol-scroll::-webkit-scrollbar-thumb { background: #00f0ff44; border-radius: 2px }
    .ol-scroll::-webkit-scrollbar-thumb:hover { background: #00f0ff88 }
    @keyframes ptsMinus { 0%,100% { opacity:1 } 60% { opacity:0.4 } }
    .pts-flash { animation: ptsMinus 0.4s ease 3 }
  `
  document.head.appendChild(s)
}

const EMAILS = [
  {
    id: 'a',
    from: 'IT-Security@micros0ft-helpdesk.net',
    fromTooltip: '⚠ Domain mismatch: "micros0ft" uses a zero (0) not the letter O',
    subject: '⚠ URGENT: Verify your account or lose access in 24h',
    unread: true,
    phishing: true,
    body: [
      { type: 'text', content: 'Dear [Employee],\n\nWe have detected unusual sign-in activity on your Microsoft 365 account.\nTo prevent unauthorized access, you must verify your credentials within\n24 hours or your account will be suspended.\n\nYour sign-in was detected from:\n' },
      { type: 'info', content: 'Location: Novosibirsk, Russia\nDevice: Unknown Android Device\nTime: Today at 3:42 AM\n' },
      { type: 'text', content: '\nClick here to verify your identity:\n' },
      { type: 'cta', content: 'VERIFY NOW →', url: 'http://micros0ft-verify.ru/login' },
      { type: 'text', content: '\n\nIf you do not verify, IT will be forced to disable your account.\n\nRegards,\nMicrosoft IT Security Team\nCase ID: #MSF-2024-88821' },
    ],
  },
  {
    id: 'b',
    from: 'calendar@company.com',
    fromTooltip: null,
    subject: 'Q2 All-Hands — Thursday 3pm',
    unread: false,
    phishing: false,
    body: [{ type: 'text', content: 'Hi team,\n\nReminder: Q2 All-Hands is this Thursday at 3pm in Conference Room B.\nPlease confirm your attendance via the calendar invite.\n\nBest,\nAdmin Team' }],
  },
  {
    id: 'c',
    from: 'updates@slack.com',
    fromTooltip: null,
    subject: 'New message in #general',
    unread: false,
    phishing: false,
    body: [{ type: 'text', content: 'You have 3 new messages in #general:\n\n• Alex: Morning everyone!\n• Sam: Has anyone reviewed the new design?\n• Jordan: Sending the report shortly.\n\nOpen Slack to reply.' }],
  },
]

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace" }

type ConsequenceState = { text: string; pts: string } | null

export default function OutlookApp() {
  const activePoint = useGameStore(s => s.activePoint)
  const [selected, setSelected]       = useState<string>('a')
  const [consequence, setConsequence] = useState<ConsequenceState>(null)
  const [hoverSender, setHoverSender] = useState(false)
  const [hoverUrl, setHoverUrl]       = useState(false)
  const [succeeded, setSucceeded]     = useState(false)
  const completePoint = useGameStore(s => s.completePoint)
  const failAttempt   = useGameStore(s => s.failAttempt)
  const exitToScene   = useGameStore(s => s.exitToScene)

  if (activePoint !== 1) return null

  const email = EMAILS.find(e => e.id === selected)!

  const handleSelect = (id: string) => {
    if (consequence) return
    setSelected(id)
    setSucceeded(false)
  }

  const handleVerifyNow = () => {
    failAttempt(1, 'clicked_verify_link')
    setConsequence({
      pts: '−10 PTS',
      text: 'You clicked a credential-harvesting link. Your Microsoft password would now be in the attacker\'s hands.\n\nIn reality: always verify the sender domain character by character before clicking any link. The "o" in "microsoft" was a zero (0) — "micros0ft" — pointing to a Russian .ru domain.',
    })
  }

  const handleReportPhishing = () => {
    setSucceeded(true)
    setTimeout(() => completePoint(1, 100), 600)
  }

  const handleUnderstood = () => {
    exitToScene()
    useCameraStore.getState().restoreInitial()
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#060a12', color: '#e5e7eb', position: 'relative' }}>

      {/* Consequence overlay */}
      {consequence && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(18,2,6,0.97)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '32px 40px', zIndex: 20,
        }}>
          <div className="pts-flash" style={{ ...mono, fontSize: 22, color: '#ff3355', fontWeight: 700, marginBottom: 20, letterSpacing: '0.1em' }}>
            {consequence.pts}
          </div>
          <div style={{ ...mono, fontSize: 10, color: '#ff335588', letterSpacing: '0.18em', marginBottom: 14 }}>
            SECURITY FAILURE
          </div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#ff8899', lineHeight: 1.8, textAlign: 'center', maxWidth: 380, marginBottom: 28, whiteSpace: 'pre-line' }}>
            {consequence.text}
          </div>
          <button onClick={handleUnderstood} style={{
            padding: '9px 28px', background: 'transparent', border: '1px solid #ff3355',
            color: '#ff6688', ...mono, fontSize: 11, cursor: 'pointer', borderRadius: 4, letterSpacing: '0.08em',
          }}>RETURN TO OFFICE</button>
        </div>
      )}

      {/* Email list */}
      <div className="ol-scroll" style={{ width: '34%', borderRight: '1px solid #1a1f2a', overflowY: 'auto' }}>
        <div style={{ padding: '10px 14px', fontFamily: "'Orbitron',sans-serif", fontSize: 11, color: '#00f0ff', borderBottom: '1px solid #1a1f2a' }}>
          INBOX (3)
        </div>
        {EMAILS.map(e => (
          <div key={e.id} onClick={() => handleSelect(e.id)}
               style={{ padding: '10px 14px', borderBottom: '1px solid #1a1f2a', cursor: 'pointer', background: selected === e.id ? '#0d1320' : 'transparent', position: 'relative' }}>
            {e.unread && (
              <div style={{ position: 'absolute', top: 10, right: 12, width: 7, height: 7, borderRadius: '50%', background: '#ff4466' }} />
            )}
            <div style={{ fontSize: 11, color: e.phishing ? '#ff6688' : '#6c7280', ...mono, marginBottom: 2, paddingRight: 16 }}>{e.from}</div>
            <div style={{ fontSize: 12, color: '#e5e7eb', fontWeight: e.unread ? 700 : 400 }}>{e.subject}</div>
          </div>
        ))}
      </div>

      {/* Reader */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="ol-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 12px', minHeight: 0 }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, color: '#e5e7eb', marginBottom: 6 }}>{email.subject}</div>

          {/* Sender with hover tooltip */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}
               onMouseEnter={() => setHoverSender(true)}
               onMouseLeave={() => setHoverSender(false)}>
            <div style={{ fontSize: 11, color: email.phishing ? '#ff6688' : '#6c7280', ...mono, cursor: email.phishing ? 'help' : 'default' }}>
              From: {email.from}
            </div>
            {hoverSender && email.fromTooltip && (
              <div style={{
                position: 'absolute', bottom: '130%', left: 0, zIndex: 30,
                background: '#1a0808', border: '1px solid #ff335566',
                color: '#ff9988', ...mono, fontSize: 11,
                padding: '5px 10px', borderRadius: 4, whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}>
                {email.fromTooltip}
              </div>
            )}
          </div>

          {/* Body */}
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#9ca3af', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
            {email.body.map((part, i) => {
              if (part.type === 'text') return <span key={i}>{part.content}</span>
              if (part.type === 'info') return <span key={i} style={{ color: '#ffbb44', ...mono, fontSize: 12 }}>{part.content}</span>
              if (part.type === 'cta') return (
                <span key={i} style={{ display: 'inline-block', marginTop: 4 }}>
                  <button
                    onMouseEnter={() => setHoverUrl(true)}
                    onMouseLeave={() => setHoverUrl(false)}
                    onClick={handleVerifyNow}
                    style={{
                      padding: '8px 18px', background: '#1a3a8a', border: '1px solid #4466cc',
                      color: '#88aaff', ...mono, fontSize: 12, cursor: 'pointer', borderRadius: 4,
                      letterSpacing: '0.05em',
                    }}>
                    {part.content}
                  </button>
                </span>
              )
              return null
            })}
          </div>

          {/* Status bar URL hint */}
          {hoverUrl && (
            <div style={{ marginTop: 10, ...mono, fontSize: 10, color: '#ff6644', background: '#1a0808', padding: '3px 8px', borderRadius: 3, display: 'inline-block' }}>
              → http://micros0ft-verify.ru/login
            </div>
          )}

          {/* Non-phishing safe note */}
          {!email.phishing && (
            <div style={{ marginTop: 14, padding: '5px 10px', borderRadius: 4, background: '#001a0a', border: '1px solid #00ff8822', color: '#00ff8866', ...mono, fontSize: 10 }}>
              ✓ This email appears legitimate
            </div>
          )}

        </div>

        {/* Sticky action bar */}
        {!succeeded && !consequence && (
          <div style={{ padding: '12px 24px', borderTop: '1px solid #1a1f2a', background: '#060a12', flexShrink: 0 }}>
            {email.phishing ? (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleVerifyNow} style={{
                  flex: 1, padding: '10px 0', borderRadius: 6, cursor: 'pointer',
                  background: '#1a3a8a', border: '1px solid #4466cc',
                  color: '#88aaff', ...mono, fontSize: 11, letterSpacing: '0.05em',
                }}>
                  VERIFY NOW →
                </button>
                <button onClick={handleReportPhishing} style={{
                  flex: 1, padding: '10px 0', borderRadius: 6, cursor: 'pointer',
                  background: '#001a0f', border: '1px solid #00ff88',
                  color: '#00ff88', ...mono, fontSize: 11, letterSpacing: '0.05em',
                }}>
                  [ REPORT PHISHING ]
                </button>
              </div>
            ) : (
              <div style={{ ...mono, fontSize: 11, color: '#3a3f4a', textAlign: 'center' }}>No action required</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
