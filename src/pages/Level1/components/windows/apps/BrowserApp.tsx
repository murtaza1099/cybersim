import { useState, type CSSProperties } from 'react'
import { useGameStore } from '../../../stores/gameStore'
import { usePcStore } from '../../../stores/pcStore'
import { colors, fonts } from '../../../styles/theme'

const mono: CSSProperties = { fontFamily: fonts.mono }

export default function BrowserApp() {
  const activePoint = useGameStore(s => s.activePoint)
  const firedClickfix = usePcStore(s => Boolean(s.fired.clickfix))
  const clickfixStatus = usePcStore(s => s.attacks.clickfix?.status ?? 'pending')

  if (activePoint !== 1) return <CompanyPortal />
  if (firedClickfix || clickfixStatus !== 'pending') return <ClickFix />
  return <CompanyPortal />
}

function CompanyPortal() {
  return (
    <BrowserShell url="https://portal.techcorp.local/home" status="Ready">
      <div style={{ padding: 24, color: '#d7dee9', fontFamily: fonts.body }}>
        <div style={{ ...mono, fontSize: 10, color: colors.cyan, letterSpacing: '0.14em', marginBottom: 8 }}>TECHCORP INTRANET</div>
        <h1 style={{ margin: 0, fontFamily: fonts.display, fontSize: 20, color: '#f3f4f6' }}>Company Portal</h1>
        <p style={{ margin: '10px 0 18px', maxWidth: 500, fontSize: 13, lineHeight: 1.7, color: '#aeb9c8' }}>
          Welcome back. Your security dashboard, HR links, and team notices are available below.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          <PortalTile title="Security Center" body="No urgent action required. Review alerts before following instructions." />
          <PortalTile title="Company News" body="Quarterly updates, policy reminders, and internal announcements." />
          <PortalTile title="People Tools" body="Directory, payroll, leave requests, and onboarding resources." />
          <PortalTile title="Support" body="Open a ticket or call the internal help desk for verified IT requests." />
        </div>
      </div>
    </BrowserShell>
  )
}

function PortalTile({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ border: '1px solid rgba(76,194,255,0.14)', background: 'rgba(255,255,255,0.035)', borderRadius: 7, padding: 14, minHeight: 92 }}>
      <div style={{ fontFamily: fonts.display, fontSize: 12, color: '#edf6ff', marginBottom: 7 }}>{title}</div>
      <div style={{ fontFamily: fonts.body, fontSize: 12.5, lineHeight: 1.55, color: '#9ba8ba' }}>{body}</div>
    </div>
  )
}

function ClickFix() {
  const attacks = usePcStore(s => s.attacks)
  const recordInspection = usePcStore(s => s.recordInspection)
  const resolveAttack = usePcStore(s => s.resolveAttack)
  const status = attacks.clickfix?.status ?? 'pending'
  const [details, setDetails] = useState(false)

  const inspect = () => {
    setDetails(true)
    recordInspection('clickfix', 'command')
  }
  const runCommand = () => resolveAttack('clickfix', false, 'ran_command')
  const reportPage = () => resolveAttack('clickfix', true, 'reported_clickfix')

  if (status === 'passed') {
    return (
      <BrowserShell url="https://chrome-browser-security.com/update" status="Suspicious download reported">
        <ResultPanel
          tone="good"
          title="Threat Reported"
          body="Correct. Real Chrome updates come through Chrome itself or google.com. A padlock only means the wrong site has HTTPS; it does not make ChromeSetup.exe safe."
        />
      </BrowserShell>
    )
  }

  if (status === 'failed') {
    return (
      <BrowserShell url="https://chrome-browser-security.com/update" status="ChromeSetup.exe executed">
        <ResultPanel
          tone="bad"
          title="Security Failure"
          body="ChromeSetup.exe was served from a non-Google domain. Fake update installers commonly drop remote access malware while pretending to repair a browser."
        />
      </BrowserShell>
    )
  }

  return (
    <BrowserShell url="https://chrome-browser-security.com/update" status={details ? 'Domain is not google.com' : 'Download offered from download.chromesecurity-updates.com'}>
      <div style={{ minHeight: '100%', background: '#f7f8fb', color: '#202124', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22 }}>
        <div style={{ width: 430, border: '1px solid #d7dce5', borderRadius: 8, background: '#fff', boxShadow: '0 10px 30px rgba(20,25,40,0.18)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'conic-gradient(#4285f4 0 25%, #34a853 0 50%, #fbbc05 0 75%, #ea4335 0)', border: '2px solid #fff', boxShadow: '0 0 0 1px #d7dce5' }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 650 }}>Chrome update required</div>
              <div style={{ fontSize: 12, color: '#5f6368', marginTop: 2 }}>Your browser is out of date. Install the security update to continue.</div>
            </div>
          </div>

          <div style={{ border: '1px solid #e0e3ea', borderRadius: 6, padding: 14, marginBottom: 14, background: '#fafbff' }}>
            <div style={{ fontSize: 13, color: '#3c4043', lineHeight: 1.55, marginBottom: 12 }}>
              This site is using HTTPS and says the update is signed by Google LLC. The address bar, however, is not on a Google-owned host.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '96px 1fr', gap: '7px 10px', fontSize: 12 }}>
              <span style={{ color: '#5f6368' }}>File</span><strong>ChromeSetup.exe</strong>
              <span style={{ color: '#5f6368' }}>Source</span><code style={{ color: '#b42318', fontSize: 11 }}>download.chromesecurity-updates.com</code>
              <span style={{ color: '#5f6368' }}>Publisher</span><span>Google LLC (unverified)</span>
            </div>
          </div>

          <button onClick={runCommand} style={primaryButton}>
            Download ChromeSetup.exe
          </button>
          <button onClick={reportPage} style={safeButton}>
            Report suspicious download
          </button>
          <button onClick={inspect} style={inspectButton}>
            Inspect domain and certificate
          </button>

          {details && (
            <div style={{ ...mono, marginTop: 12, fontSize: 11, color: '#9a3412', lineHeight: 1.6, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 5, padding: 9 }}>
              Warning: the padlock belongs to chrome-browser-security.com, not google.com or chrome.google.com. The installer is downloaded from a second non-Google host.
            </div>
          )}
        </div>
      </div>
    </BrowserShell>
  )
}

function ResultPanel({ tone, title, body }: { tone: 'good' | 'bad'; title: string; body: string }) {
  const good = tone === 'good'
  const accent = good ? colors.green : colors.red
  return (
    <div style={{ height: '100%', minHeight: 330, background: good ? '#061711' : '#1a0508', color: '#f3f4f6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
      <div style={{ ...mono, fontSize: 11, color: accent, letterSpacing: '0.16em', marginBottom: 10 }}>{good ? 'CORRECT DECISION' : 'ATTACK EXECUTED'}</div>
      <div style={{ fontFamily: fonts.display, fontSize: 18, color: '#f8fafc', marginBottom: 10 }}>{title}</div>
      <div style={{ fontFamily: fonts.body, fontSize: 13, color: good ? '#a7f3d0' : '#ffb3bf', lineHeight: 1.7, maxWidth: 460 }}>{body}</div>
    </div>
  )
}

function BrowserShell({ url, status, children }: { url: string; status: string; children: React.ReactNode }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0a1020', overflow: 'hidden' }}>
      <div style={{ height: 43, flexShrink: 0, background: '#101827', borderBottom: '1px solid #202a3f', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px' }}>
        <span style={trafficDot('#ff5f57')} />
        <span style={trafficDot('#ffbd2e')} />
        <span style={trafficDot('#28c840')} />
        <div style={{ flex: 1, minWidth: 0, background: '#182235', border: '1px solid #2a3851', borderRadius: 16, padding: '5px 12px', ...mono, fontSize: 11, color: '#aab5c4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          🔒 {url}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>{children}</div>
      <div style={{ height: 24, flexShrink: 0, background: '#070d17', borderTop: '1px solid #182235', display: 'flex', alignItems: 'center', padding: '0 12px', ...mono, fontSize: 10, color: '#718096' }}>
        {status}
      </div>
    </div>
  )
}

const trafficDot = (background: string): CSSProperties => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  background,
  flexShrink: 0,
})

const primaryButton: CSSProperties = {
  width: '100%',
  padding: '10px 0',
  borderRadius: 5,
  border: '1px solid #bdc1c6',
  background: 'transparent',
  color: '#202124',
  fontSize: 13,
  fontWeight: 650,
  cursor: 'pointer',
  marginBottom: 8,
}

const safeButton: CSSProperties = {
  width: '100%',
  padding: '10px 0',
  borderRadius: 5,
  border: '1px solid #bdc1c6',
  background: 'transparent',
  color: '#202124',
  fontSize: 13,
  fontWeight: 650,
  cursor: 'pointer',
  marginBottom: 8,
}

const inspectButton: CSSProperties = {
  width: '100%',
  padding: '5px 0',
  border: 'none',
  background: 'transparent',
  color: '#5f6368',
  fontSize: 12,
  cursor: 'pointer',
  textDecoration: 'underline',
}
