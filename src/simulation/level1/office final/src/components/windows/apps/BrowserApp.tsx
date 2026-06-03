import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../../../stores/gameStore'
import { useCameraStore } from '../../../stores/cameraStore'

if (typeof document !== 'undefined' && !document.getElementById('br-kf')) {
  const s = document.createElement('style')
  s.id = 'br-kf'
  s.textContent = `
    @keyframes scaleIn { from { opacity:0; transform:scale(0.88) } to { opacity:1; transform:scale(1) } }
    .popup-in { animation: scaleIn 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards }
    @keyframes ptsMinus2 { 0%,100% { opacity:1 } 60% { opacity:0.3 } }
    .pts-flash2 { animation: ptsMinus2 0.4s ease 3 }
  `
  document.head.appendChild(s)
}

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace" }

// ─── Consequence overlay reusable ────────────────────────────────────────────
function ConsequencePanel({ pts, text, onUnderstood }: { pts: string; text: string; onUnderstood: () => void }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(18,2,6,0.97)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 40px', zIndex: 20,
    }}>
      <div className="pts-flash2" style={{ ...mono, fontSize: 22, color: '#ff3355', fontWeight: 700, marginBottom: 20, letterSpacing: '0.1em' }}>
        {pts}
      </div>
      <div style={{ ...mono, fontSize: 10, color: '#ff335588', letterSpacing: '0.18em', marginBottom: 14 }}>
        SECURITY FAILURE
      </div>
      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#ff8899', lineHeight: 1.8, textAlign: 'center', maxWidth: 380, marginBottom: 28, whiteSpace: 'pre-line' }}>
        {text}
      </div>
      <button onClick={onUnderstood} style={{
        padding: '9px 28px', background: 'transparent', border: '1px solid #ff3355',
        color: '#ff6688', ...mono, fontSize: 11, cursor: 'pointer', borderRadius: 4, letterSpacing: '0.08em',
      }}>RETURN TO OFFICE</button>
    </div>
  )
}

// ─── ATK_002 — Fake Chrome Update ────────────────────────────────────────────
function Point2() {
  const [popupVisible, setPopupVisible]   = useState(false)
  const [phase, setPhase]                 = useState<'popup' | 'warning' | 'done' | null>(null)
  const [hoverUpdate, setHoverUpdate]     = useState(false)
  const [countdown, setCountdown]         = useState(15)
  const [consequence, setConsequence]     = useState<{ pts: string; text: string } | null>(null)
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completePoint = useGameStore(s => s.completePoint)
  const failAttempt   = useGameStore(s => s.failAttempt)
  const exitToScene   = useGameStore(s => s.exitToScene)

  useEffect(() => {
    const t = setTimeout(() => { setPopupVisible(true); setPhase('popup') }, 1500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (phase === 'warning') {
      setCountdown(15)
      countRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(countRef.current!)
            return 0
          }
          return c - 1
        })
      }, 1000)
    }
    return () => { if (countRef.current) clearInterval(countRef.current) }
  }, [phase])

  const handleUpdate = (fromWarning = false) => {
    failAttempt(2, fromWarning ? 'clicked_update_after_warning' : 'clicked_fake_update')
    setPopupVisible(false)
    setPhase(null)
    setConsequence({
      pts: '−10 PTS',
      text: 'You ran a fake Chrome installer. This would have installed a keylogger on your machine.\n\nReal Chrome updates happen automatically in the background — you never need to click a popup or download anything manually to update Chrome.',
    })
  }

  const handleNotNow = () => {
    if (phase === 'popup') {
      setPhase('warning')
    } else if (phase === 'warning') {
      clearInterval(countRef.current!)
      setPopupVisible(false)
      setPhase('done')
      setTimeout(() => completePoint(2, 100), 600)
    }
  }

  const handleUnderstood = () => {
    exitToScene()
    useCameraStore.getState().restoreInitial()
  }

  return (
    <div style={{ position: 'relative', height: '100%', background: '#0a1020', overflow: 'hidden' }}>
      {/* Fake browser content */}
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Address bar */}
        <div style={{ background: '#0d1525', borderBottom: '1px solid #1a2035', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffbd2e' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#28c840' }} />
          <div style={{ flex: 1, background: '#1a2035', borderRadius: 12, padding: '3px 12px', ...mono, fontSize: 11, color: '#6c7280' }}>
            🔒 intranet.company.local/dashboard
          </div>
        </div>
        {/* Page */}
        <div style={{ flex: 1, padding: 28, color: '#9ca3af', fontFamily: "'DM Sans',sans-serif", overflowY: 'auto' }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, color: '#e5e7eb', marginBottom: 12 }}>Company Dashboard</div>
          <p style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>Welcome back. Today's announcements:</p>
          <div style={{ background: '#0d1525', border: '1px solid #1a2035', borderRadius: 6, padding: '12px 16px', marginBottom: 12, fontSize: 13 }}>
            📋 Q2 planning documents uploaded to SharePoint
          </div>
          <div style={{ background: '#0d1525', border: '1px solid #1a2035', borderRadius: 6, padding: '12px 16px', fontSize: 13 }}>
            🔧 Scheduled maintenance Friday 11pm–2am
          </div>
        </div>
        {/* Status bar */}
        <div style={{ background: '#070e1a', borderTop: '1px solid #1a2035', padding: '3px 14px', ...mono, fontSize: 10, color: hoverUpdate ? '#ff6644' : '#3a3f4a' }}>
          {hoverUpdate ? '→ chrome-update-now.xyz/ChromeSetup_v124.exe' : 'Ready'}
        </div>
      </div>

      {/* Chrome update popup */}
      {popupVisible && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="popup-in" style={{
            background: '#f8f9fa', borderRadius: 8, padding: 24, width: 360,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            {phase === 'popup' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  {/* Chrome icon approximation */}
                  <svg width="32" height="32" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="15" fill="#4285f4" />
                    <circle cx="16" cy="16" r="9" fill="white" />
                    <circle cx="16" cy="16" r="6" fill="#4285f4" />
                    <path d="M16 1 A15 15 0 0 1 29 8.5 L22 16 A9 9 0 0 0 16 7 Z" fill="#ea4335" />
                    <path d="M29 8.5 A15 15 0 0 1 29 23.5 L22 16 A9 9 0 0 0 25 16 Z" fill="#fbbc05" />
                    <path d="M29 23.5 A15 15 0 0 1 3 23.5 L10 16 A9 9 0 0 0 16 25 Z" fill="#34a853" />
                  </svg>
                  <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 16, fontWeight: 600, color: '#202124' }}>Chrome</div>
                </div>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 14, color: '#3c4043', marginBottom: 8 }}>
                  A critical update is available. Update now to stay protected.
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#80868b', marginBottom: 18 }}>
                  Current: 124.0.6367.78 → New: 124.0.6367.201
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={handleNotNow} style={{ padding: '7px 16px', borderRadius: 4, border: 'none', background: 'transparent', color: '#1a73e8', fontFamily: 'system-ui', fontSize: 13, cursor: 'pointer' }}>
                    Not now
                  </button>
                  <button
                    onMouseEnter={() => setHoverUpdate(true)}
                    onMouseLeave={() => setHoverUpdate(false)}
                    onClick={() => handleUpdate(false)}
                    style={{ padding: '7px 16px', borderRadius: 4, border: 'none', background: '#1a73e8', color: 'white', fontFamily: 'system-ui', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                    Update Chrome
                  </button>
                </div>
                <div style={{ fontFamily: 'system-ui', fontSize: 10, color: '#9aa0a6', marginTop: 10 }}>
                  Updates are signed by Google LLC
                </div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: 'system-ui', fontSize: 15, fontWeight: 600, color: '#d93025', marginBottom: 10 }}>
                  ⚠ Are you sure?
                </div>
                <div style={{ fontFamily: 'system-ui', fontSize: 13, color: '#3c4043', marginBottom: 6, lineHeight: 1.6 }}>
                  Your browser is currently vulnerable to known security exploits.
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#d93025', marginBottom: 16 }}>
                  Auto-closing in {countdown}s...
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={handleNotNow} style={{ padding: '7px 16px', borderRadius: 4, border: 'none', background: 'transparent', color: '#1a73e8', fontFamily: 'system-ui', fontSize: 13, cursor: 'pointer' }}>
                    I'll take the risk
                  </button>
                  <button
                    onMouseEnter={() => setHoverUpdate(true)}
                    onMouseLeave={() => setHoverUpdate(false)}
                    onClick={() => handleUpdate(true)}
                    style={{ padding: '7px 16px', borderRadius: 4, border: 'none', background: '#d93025', color: 'white', fontFamily: 'system-ui', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                    Update Now
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}


      {consequence && <ConsequencePanel {...consequence} onUnderstood={handleUnderstood} />}
    </div>
  )
}

// ─── ATK_003 — LinkedIn Scam ──────────────────────────────────────────────────
function Point3() {
  const [consequence, setConsequence] = useState<{ pts: string; text: string } | null>(null)
  const [succeeded, setSucceeded]     = useState(false)
  const [hoverFile, setHoverFile]     = useState(false)
  const completePoint = useGameStore(s => s.completePoint)
  const failAttempt   = useGameStore(s => s.failAttempt)
  const exitToScene   = useGameStore(s => s.exitToScene)

  const handleDownload = () => {
    failAttempt(3, 'opened_exe')
    setConsequence({
      pts: '−10 PTS',
      text: 'You ran a .exe file disguised as a PDF. Attackers use double extensions (.pdf.exe) knowing most operating systems hide the final extension by default.\n\nThe attachment was a Remote Access Trojan (RAT) that would have given the attacker full control of your machine.',
    })
  }

  const handleIgnore = () => {
    setSucceeded(true)
    setTimeout(() => completePoint(3, 100), 600)
  }

  const handleUnderstood = () => {
    exitToScene()
    useCameraStore.getState().restoreInitial()
  }

  return (
    <div style={{ position: 'relative', height: '100%', background: '#0a1020', overflow: 'hidden' }}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Address bar */}
        <div style={{ background: '#0d1525', borderBottom: '1px solid #1a2035', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffbd2e' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#28c840' }} />
          <div style={{ flex: 1, background: '#1a2035', borderRadius: 12, padding: '3px 12px', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#6c7280' }}>
            🔒 www.linkedin.com/messaging
          </div>
        </div>

        {/* LinkedIn UI */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 80px' }}>
          {/* Header */}
          <div style={{ background: '#0077b5', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontFamily: 'system-ui', fontSize: 18, fontWeight: 700, color: 'white', letterSpacing: '-0.5px' }}>in</div>
            <div style={{ fontFamily: 'system-ui', fontSize: 14, color: 'white', fontWeight: 600 }}>Messaging</div>
          </div>

          {/* Message */}
          <div style={{ padding: '20px 16px', maxWidth: 560, margin: '0 auto' }}>
            <div style={{ background: '#0d1525', borderRadius: 10, padding: 20, border: '1px solid #1a2a3a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1a3a5a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👤</div>
                <div>
                  <div style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 14, fontFamily: 'system-ui' }}>Sarah Chen 🔗</div>
                  <div style={{ color: '#6c7280', fontSize: 12, fontFamily: 'system-ui' }}>Strategic Recruiter at McKinsey & Company</div>
                  <div style={{ color: '#4a9c74', fontSize: 11, fontFamily: 'system-ui' }}>✓ 500+ connections</div>
                </div>
              </div>

              <div style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.75, marginBottom: 16, fontFamily: "'DM Sans',sans-serif" }}>
                Hi! I came across your profile and was immediately impressed. We have an exciting Senior Analyst role that's a perfect fit — 40% salary increase, remote-first, equity package.
                <br /><br />
                I have 2 other candidates interviewing this week, so I need to know by Friday. Please download our role brief and complete the quick skills assessment:
              </div>

              {/* Attachment */}
              <div
                onMouseEnter={() => setHoverFile(true)}
                onMouseLeave={() => setHoverFile(false)}
                style={{ background: '#06080f', border: `1px solid ${hoverFile ? '#ff3355' : '#1a2a3a'}`, borderRadius: 6, padding: '10px 14px', marginBottom: 16, cursor: 'pointer', transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>📎</span>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: hoverFile ? '#ff6688' : '#e5e7eb' }}>
                      Role_Brief_McKinsey.pdf.exe
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#6c7280', marginTop: 2 }}>
                      1.2 MB · {hoverFile ? '⚠ .exe — this is an executable program' : 'PDF Document'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif" }}>
                Looking forward to connecting! 🌟
              </div>

              {!succeeded && !consequence && (
                <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                  <button onClick={handleDownload} style={{
                    flex: 1, padding: '10px 0', borderRadius: 6, cursor: 'pointer',
                    background: '#0077b5', border: 'none', color: 'white',
                    fontFamily: 'system-ui', fontSize: 13, fontWeight: 600,
                  }}>
                    Download & Complete Assessment
                  </button>
                  <button onClick={handleIgnore} style={{
                    flex: 1, padding: '10px 0', borderRadius: 6, cursor: 'pointer',
                    background: 'transparent', border: '1px solid #00ff88',
                    color: '#00ff88', fontFamily: "'Orbitron',sans-serif", fontSize: 10,
                  }}>
                    [ IGNORE & MARK SUSPICIOUS ]
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {consequence && <ConsequencePanel {...consequence} onUnderstood={handleUnderstood} />}
    </div>
  )
}

export default function BrowserApp() {
  const activePoint = useGameStore(s => s.activePoint)
  if (activePoint === 2) return <Point2 />
  if (activePoint === 3) return <Point3 />
  return null
}
