import { useState } from 'react'
import { usePcStore } from '../../../stores/pcStore'
import { colors, fonts } from '../../../styles/theme'

const mono: React.CSSProperties = { fontFamily: fonts.mono }

const ShieldBig = ({ color }: { color: string }) => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l8 3v6c0 5-3.4 8.5-8 11-4.6-2.5-8-6-8-11V5z" /><path d="M9 12l2 2 4-4" />
  </svg>
)

export default function FakeDefenderApp() {
  const attacks          = usePcStore(s => s.attacks)
  const recordInspection = usePcStore(s => s.recordInspection)
  const resolveAttack    = usePcStore(s => s.resolveAttack)
  const status = attacks.fake_defender?.status ?? 'pending'

  const [phase, setPhase] = useState<'fake' | 'real'>('fake')
  const [tell, setTell]   = useState(false)

  const inspect = () => { setTell(true); recordInspection('fake_defender', 'payment') }
  const onPay   = () => resolveAttack('fake_defender', false, 'paid')
  const onClose = () => setPhase('real')
  const onDone  = () => resolveAttack('fake_defender', true, 'closed_and_verified')

  // Resolved states
  if (status === 'failed') {
    return (
      <Wrap bg="#180408">
        <ShieldBig color={colors.red} />
        <div style={{ ...mono, fontSize: 11, color: colors.red, letterSpacing: '0.15em', margin: '12px 0 8px' }}>✕ SECURITY FAILURE</div>
        <p style={msgStyle('#ffb3bf')}>Your card details were captured. Real Windows Security is built into Windows and is completely free — it never asks for payment. A “threat found → pay to clean” pop-up is scareware (a fake antivirus / tech-support scam).</p>
      </Wrap>
    )
  }
  if (status === 'passed' || phase === 'real') {
    return (
      <Wrap bg="#0a1a12">
        <ShieldBig color={colors.green} />
        <div style={{ ...mono, fontSize: 11, color: colors.green, letterSpacing: '0.15em', margin: '12px 0 4px' }}>WINDOWS SECURITY</div>
        <div style={{ fontFamily: fonts.body, fontSize: 15, color: '#e5e7eb', marginBottom: 4 }}>No threats found</div>
        <div style={{ fontFamily: fonts.body, fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>Your device is protected · Last scan: just now</div>
        {status !== 'passed' ? (
          <>
            <p style={msgStyle('#a7f3d0')}>The real, built-in scanner is clean. That payment pop-up was scareware designed to panic you into paying.</p>
            <button onClick={onDone} style={btn(colors.green)}>Dismiss scareware &amp; close</button>
          </>
        ) : (
          <p style={msgStyle('#a7f3d0')}>Correct. You ignored the fake alert and verified with the real, built-in Windows Security — which charges nothing and found nothing.</p>
        )}
      </Wrap>
    )
  }

  // Fake scareware window
  return (
    <div style={{ height: '100%', background: '#0b0b0d', color: '#f3f4f6', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif', position: 'relative' }}>
      <div style={{ background: '#c42b1c', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <ShieldBig color="#fff" />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Windows Defender — Threat Detected</div>
          <div style={{ fontSize: 11.5, opacity: 0.9, fontFamily: 'monospace' }}>Trojan:Win32/Wacatac.B!ml</div>
        </div>
        <button onClick={onClose} title="Close" style={{ marginLeft: 'auto', background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, padding: '4px 10px', borderRadius: 4 }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
        <div style={{ fontSize: 13.5, color: '#ffd9d9', lineHeight: 1.6, marginBottom: 14 }}>
          Your PC is infected with <b>3 threats</b> that are stealing your data right now. Activate protection immediately to remove them.
        </div>

        <div style={{ background: '#16161a', border: '1px solid #2a2a30', borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Premium Protection</span>
            <span style={{ fontSize: 14, color: '#ff7b72' }}>$29.99 / year</span>
          </div>
          <input placeholder="Card number" style={cardInput} />
          <div style={{ display: 'flex', gap: 8 }}>
            <input placeholder="MM/YY" style={{ ...cardInput, flex: 1 }} />
            <input placeholder="CVC" style={{ ...cardInput, flex: 1 }} />
          </div>
          <button onClick={onPay} style={{ width: '100%', marginTop: 12, padding: '11px 0', borderRadius: 6, border: 'none', background: '#c42b1c', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Clean Now — $29.99/year
          </button>
        </div>

        <button onClick={inspect} style={{ ...mono, fontSize: 10.5, marginTop: 12, background: 'none', border: 'none', color: '#8b96a8', cursor: 'pointer', textDecoration: 'underline' }}>
          Why is antivirus asking me to pay?
        </button>
        {tell && (
          <div style={{ ...mono, fontSize: 11, color: colors.amber, marginTop: 8, lineHeight: 1.6 }}>
            ⚠ The real Windows Security is free and built into Windows — it never takes payment. Close this and open the genuine app instead.
          </div>
        )}
      </div>
    </div>
  )
}

const cardInput: React.CSSProperties = { width: '100%', marginBottom: 8, padding: '9px 11px', borderRadius: 5, border: '1px solid #2a2a30', background: '#0b0b0d', color: '#e5e7eb', fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box' }
const msgStyle = (color: string): React.CSSProperties => ({ fontFamily: fonts.body, fontSize: 13, color, lineHeight: 1.7, maxWidth: 420, textAlign: 'center', marginBottom: 16 })
const btn = (c: string): React.CSSProperties => ({ ...mono, fontSize: 11, padding: '9px 20px', borderRadius: 6, cursor: 'pointer', background: 'transparent', border: `1px solid ${c}`, color: c })

function Wrap({ bg, children }: { bg: string; children: React.ReactNode }) {
  return <div style={{ height: '100%', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center' }}>{children}</div>
}
