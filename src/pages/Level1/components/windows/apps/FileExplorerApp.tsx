import { useState } from 'react'
import { useGameStore } from '../../../stores/gameStore'
import { useCameraStore } from '../../../stores/cameraStore'
import { usePcStore } from '../../../stores/pcStore'
import { colors, fonts } from '../../../styles/theme'

if (typeof document !== 'undefined' && !document.getElementById('fe-kf')) {
  const s = document.createElement('style')
  s.id = 'fe-kf'
  s.textContent = `
    @keyframes ptsMinus6 { 0%,100% { opacity:1 } 60% { opacity:0.3 } }
    .pts-flash6 { animation: ptsMinus6 0.4s ease 3 }
    @keyframes processFlicker {
      0%,100% { color: #ff6688 } 50% { color: #ff3355 }
    }
    .proc-warn { animation: processFlicker 1.2s ease-in-out infinite }
  `
  document.head.appendChild(s)
}

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace" }
const neutralDecisionButton: React.CSSProperties = {
  flex: 1,
  padding: '9px 0',
  borderRadius: 6,
  background: 'transparent',
  border: '1px solid rgba(0,240,255,0.28)',
  color: colors.textPrimary,
  fontFamily: fonts.display,
  fontSize: 10,
  cursor: 'pointer',
}
const neutralDecisionButtonSmall: React.CSSProperties = {
  ...neutralDecisionButton,
  fontSize: 9,
}
const neutralOfficeButton: React.CSSProperties = {
  fontSize: 12,
  padding: '4px 12px',
  minWidth: 112,
  borderRadius: 3,
  border: '1px solid rgba(0,240,255,0.28)',
  background: 'transparent',
  color: colors.textPrimary,
  cursor: 'pointer',
}
const neutralReportButton: React.CSSProperties = {
  fontFamily: fonts.mono,
  fontSize: 11,
  padding: '8px 18px',
  borderRadius: 6,
  cursor: 'pointer',
  background: 'transparent',
  border: '1px solid rgba(0,240,255,0.28)',
  color: colors.textPrimary,
}

function ConsequencePanel({ pts, text, onUnderstood }: { pts: string; text: string; onUnderstood: () => void }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(18,2,6,0.97)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '28px 32px', zIndex: 20,
    }}>
      <div className="pts-flash6" style={{ ...mono, fontSize: 22, color: '#ff3355', fontWeight: 700, marginBottom: 18, letterSpacing: '0.1em' }}>
        {pts}
      </div>
      <div style={{ ...mono, fontSize: 10, color: '#ff335588', letterSpacing: '0.18em', marginBottom: 14 }}>
        SECURITY FAILURE
      </div>
      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#ff8899', lineHeight: 1.8, textAlign: 'center', maxWidth: 380, marginBottom: 26, whiteSpace: 'pre-line' }}>
        {text}
      </div>
      <button onClick={onUnderstood} style={{
        padding: '9px 28px', background: 'transparent', border: '1px solid #ff3355',
        color: '#ff6688', ...mono, fontSize: 11, cursor: 'pointer', borderRadius: 4,
      }}>RETURN TO OFFICE</button>
    </div>
  )
}

// ─── ATK_006 — USB Bait ───────────────────────────────────────────────────────
const USB_FILES = [
  { name: 'Salary Review 2025 - final.xlsx',        icon: '📊', size: '4.2 MB', danger: true,  reason: 'salary' },
  { name: 'Teams meeting notes - Q4 planning.docx', icon: '📄', size: '1.7 MB', danger: true,  reason: 'meeting_notes' },
  { name: 'HR contact list.pdf.lnk',                icon: '📎', size: '8 KB',   danger: true,  reason: 'shortcut' },
  { name: 'README - payroll export.txt',            icon: '📝', size: '3 KB',   danger: false, reason: 'readme' },
]

function Point6() {
  const [selected, setSelected]       = useState<string | null>(null)
  const [consequence, setConsequence] = useState<{ pts: string; text: string } | null>(null)
  const [succeeded, setSucceeded]     = useState<'eject' | 'report' | null>(null)
  const completePoint = useGameStore(s => s.completePoint)
  const failAttempt   = useGameStore(s => s.failAttempt)
  const exitToScene   = useGameStore(s => s.exitToScene)

  const handleFileClick = (f: typeof USB_FILES[0]) => {
    setSelected(f.name)
    if (f.danger) {
      const curiosityNote =
        f.reason === 'salary' ? 'Curiosity about salary data is specifically engineered by attackers.'
      : f.reason === 'meeting_notes' ? 'Attackers use ordinary meeting names because they look safe enough to skim.'
      : f.reason === 'shortcut' ? 'A shortcut can launch commands while pretending to be a document.'
      : 'The file name was chosen to feel routine.'
      failAttempt(6, `opened_${f.reason}`)
      setConsequence({
        pts: '−10 PTS',
        text: `You opened a file from an unknown USB. The file could launch macros, shortcuts, or firmware-level payloads before you see anything useful.\n\n${curiosityNote}\n\nAttackers leave these drives in lobbies, carparks, and bathrooms. Real attack consequence: workstation compromise within seconds.`,
      })
    }
  }

  const handleEject = () => {
    setSucceeded('eject')
    setTimeout(() => completePoint(6, 150), 1400)
  }

  const handleReport = () => {
    setSucceeded('report')
    setTimeout(() => completePoint(6, 150), 1400)
  }

  const handleUnderstood = () => {
    exitToScene()
    useCameraStore.getState().restoreInitial()
  }

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', background: '#060a12', color: '#e5e7eb' }}>

      {/* Sidebar */}
      <div style={{ width: 176, borderRight: '1px solid #1a1f2a', padding: '12px 0', flexShrink: 0 }}>
        <div style={{ padding: '6px 14px', ...mono, fontSize: 10, color: '#3a3f4a' }}>DRIVES</div>
        <div style={{ padding: '8px 14px', ...mono, fontSize: 11, color: '#6c7280' }}>
          💾 C:\ System
        </div>
        <div style={{ padding: '8px 14px', ...mono, fontSize: 11, color: '#ff6688', background: '#1a0814', borderLeft: '2px solid #ff3355' }}>
          ⚠ HR_PAYROLL_Q4 (E:\)
        </div>
      </div>

      {/* File list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: '8px 18px', ...mono, fontSize: 10, color: '#3a3f4a', borderBottom: '1px solid #1a1f2a', flexShrink: 0 }}>
          E:\  —  HR_PAYROLL_Q4  —  8.0 GB
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', ...mono, fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#0a0e14' }}>
                {['Name', 'Size', 'Type'].map(h => (
                  <th key={h} style={{ padding: '8px 18px', textAlign: 'left', color: '#6c7280', fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {USB_FILES.map(f => (
                <tr key={f.name}
                    onClick={() => handleFileClick(f)}
                    style={{ background: selected === f.name ? '#0d1320' : 'transparent', cursor: 'pointer', transition: 'background 0.1s' }}>
                  <td style={{ padding: '9px 18px', color: f.danger ? '#ff9966' : '#9ca3af' }}>
                    {f.icon} {f.name}
                  </td>
                  <td style={{ padding: '9px 18px', color: '#6c7280' }}>{f.size}</td>
                  <td style={{ padding: '9px 18px', color: f.danger ? '#ff6644' : '#3a3f4a', fontSize: 10 }}>
                    {f.danger ? 'Office Document' : 'Config'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Status bar */}
        <div style={{ padding: '5px 18px', borderTop: '1px solid #1a1f2a', ...mono, fontSize: 10, color: '#3a3f4a', flexShrink: 0 }}>
          Drive from unknown manufacturer · Volume label: HR_PAYROLL_Q4 · Last modified: Today 6:14 AM
        </div>

        {/* Action bar */}
        {!succeeded && !consequence && (
          <div style={{ padding: '12px 18px', borderTop: '1px solid #1a1f2a', display: 'flex', gap: 10, flexShrink: 0 }}>
            <button onClick={handleEject} style={neutralDecisionButton}>
              ⏏ Eject Drive Without Opening
            </button>
            <button onClick={handleReport} style={neutralDecisionButton}>
              📋 Report to IT
            </button>
          </div>
        )}

        {succeeded && (
          <div style={{ margin: 18, padding: '12px 16px', borderRadius: 6, border: '1px solid #00ff88', color: '#00ff88', ...mono, fontSize: 12, lineHeight: 1.7 }}>
            {succeeded === 'eject' ? (
              <>✓ Correct! Drive ejected safely. +150 pts<br />
              <span style={{ fontSize: 11, color: '#00cc66' }}>
                The only safe action. This USB likely contained a malicious shortcut, macro, or BadUSB payload.<br />
                Rule: Never plug in a USB you didn't buy yourself.
              </span></>
            ) : (
              <>✓ Even better. +150 pts<br />
              <span style={{ fontSize: 11, color: '#00cc66' }}>
                Reporting means IT can check if other drives were planted around the building.
              </span></>
            )}
          </div>
        )}
      </div>

      {consequence && <ConsequencePanel {...consequence} onUnderstood={handleUnderstood} />}
    </div>
  )
}

// ─── ATK_008 — Malware Drop ───────────────────────────────────────────────────
const PROCESSES = [
  { name: 'chrome.exe',     pid: 1842, cpu: '1.2%', mem: '180 MB', parent: 'explorer.exe', path: 'C:\\Program Files\\Google\\Chrome\\Application', suspicious: false },
  { name: 'explorer.exe',   pid: 1024, cpu: '0.8%', mem: '64 MB',  parent: 'winlogon.exe', path: 'C:\\Windows', suspicious: false },
  { name: 'svchost.exe',    pid: 892,  cpu: '1.4%', mem: '48 MB',  parent: 'services.exe', path: 'C:\\Windows\\System32', suspicious: false },
  { name: 'OneDrive.exe',   pid: 3120, cpu: '0.3%', mem: '96 MB',  parent: 'explorer.exe', path: 'C:\\Program Files\\Microsoft OneDrive', suspicious: false },
  { name: 'wscript.exe',    pid: 7481, cpu: '9%',   mem: '42 MB',  parent: 'explorer.exe', path: 'E:\\HR contact list.pdf.lnk', suspicious: true  },
  { name: 'svch0st.exe',    pid: 7502, cpu: '34%',  mem: '128 MB', parent: 'wscript.exe',  path: 'C:\\Users\\Public\\AppData\\Temp', suspicious: true  },
  { name: 'rundll32.exe',   pid: 7519, cpu: '8%',   mem: '32 MB',  parent: 'svch0st.exe',  path: 'C:\\Users\\Public\\AppData\\Temp', suspicious: true  },
]

function Point8() {
  const [consequence, setConsequence] = useState<{ pts: string; text: string } | null>(null)
  const [succeeded, setSucceeded]     = useState(false)
  const eventLog      = useGameStore(s => s.eventLog)
  const completePoint = useGameStore(s => s.completePoint)
  const failAttempt   = useGameStore(s => s.failAttempt)
  const exitToScene   = useGameStore(s => s.exitToScene)

  // Did the user fail point 6? (opened a USB file)
  const failedUsb = eventLog.some(e => e.type === 'attack_failed' && e.pointId === 6)

  const handleIgnore = () => {
    failAttempt(8, 'ignored_malware')
    setConsequence({
      pts: '−10 PTS',
      text: 'Malware continued running. Within 3 minutes it had:\n1. Exfiltrated your email contacts\n2. Installed a persistent keylogger\n3. Added your machine to a botnet\n\nWhen an unknown process uses 34% CPU — act immediately. "Looks fine" is never an acceptable response.',
    })
  }

  const handleKill = () => {
    failAttempt(8, 'killed_processes_only')
    setConsequence({
      pts: '−10 PTS',
      text: 'Killing processes doesn\'t remove malware. It restarts on the next reboot via registry persistence.\n\nYou need to isolate the machine from the network AND involve the IT/security team immediately. Speed of network isolation is everything.',
    })
  }

  const handleDisconnect = () => {
    setSucceeded(true)
    setTimeout(() => completePoint(8, 200), 1600)
  }

  const handleUnderstood = () => {
    exitToScene()
    useCameraStore.getState().restoreInitial()
  }

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', background: '#060a12', color: '#e5e7eb' }}>

      {/* Alert banner */}
      <div style={{ background: '#1a0408', borderBottom: '1px solid #ff335544', padding: '8px 18px', flexShrink: 0 }}>
        <div style={{ ...mono, fontSize: 11, color: '#ff6688' }}>
          ⚠ PROCESS MONITOR — Unusual Activity Detected
        </div>
        <div style={{ ...mono, fontSize: 10, color: '#ff335588', marginTop: 3 }}>
          These processes started 4 minutes ago · Parent chain: explorer.exe → wscript.exe → svch0st.exe
        </div>
        {failedUsb && (
          <div style={{ ...mono, fontSize: 10, color: '#ffaa44', marginTop: 4 }}>
            ⚡ We see you opened files from the USB in the washroom earlier. These processes were started by that action.
          </div>
        )}
      </div>

      {/* Process table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', ...mono, fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#0a0e14' }}>
              {['Process', 'PID', 'CPU', 'Memory', 'Parent', 'Path', 'Status'].map(h => (
                <th key={h} style={{ padding: '8px 16px', textAlign: 'left', color: '#6c7280', fontWeight: 400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PROCESSES.map(p => (
              <tr key={p.pid} style={{ background: p.suspicious ? '#1a0408' : 'transparent', borderBottom: '1px solid #1a1f2a' }}>
                <td style={{ padding: '8px 16px', color: p.suspicious ? '#ff9966' : '#9ca3af' }}>
                  {p.suspicious ? <span className="proc-warn">⚠ {p.name}</span> : p.name}
                </td>
                <td style={{ padding: '8px 16px', color: '#3a3f4a' }}>{p.pid}</td>
                <td style={{ padding: '8px 16px', color: p.suspicious ? '#ff6644' : '#6c7280', fontWeight: p.suspicious ? 700 : 400 }}>{p.cpu}</td>
                <td style={{ padding: '8px 16px', color: '#6c7280' }}>{p.mem}</td>
                <td style={{ padding: '8px 16px', color: p.suspicious ? '#ff9966' : '#6c7280' }}>{p.parent}</td>
                <td style={{ padding: '8px 16px', color: p.suspicious ? '#ff9966' : '#3a3f4a', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.path}</td>
                <td style={{ padding: '8px 16px', fontSize: 10 }}>
                  {p.suspicious
                    ? <span style={{ color: '#ff3355', background: '#1a0408', padding: '2px 6px', borderRadius: 3, border: '1px solid #ff335544' }}>UNKNOWN</span>
                    : <span style={{ color: '#00ff8877' }}>OK</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {succeeded && (
        <div style={{ margin: 16, padding: '12px 16px', borderRadius: 6, border: '1px solid #00ff88', color: '#00ff88', ...mono, fontSize: 12, lineHeight: 1.7, flexShrink: 0 }}>
          ✓ Correct! +200 pts<br />
          <span style={{ fontSize: 11, color: '#00cc66' }}>
            Isolation prevents lateral movement. Every second a compromised machine stays connected, the attacker reaches further into your network.
          </span>
        </div>
      )}

      {!succeeded && !consequence && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid #1a1f2a', display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={handleIgnore} style={neutralDecisionButtonSmall}>Ignore, Looks Fine</button>
          <button onClick={handleKill} style={neutralDecisionButtonSmall}>Kill The Processes</button>
          <button onClick={handleDisconnect} style={neutralDecisionButtonSmall}>Disconnect + Call IT</button>
        </div>
      )}

      {consequence && <ConsequencePanel {...consequence} onUnderstood={handleUnderstood} />}
    </div>
  )
}

// ─── PC-ATK-D — Macro-Enabled Document Trap (Main Workstation session) ─────────
const monoD: React.CSSProperties = { fontFamily: fonts.mono }

function MacroDoc() {
  const attacks          = usePcStore(s => s.attacks)
  const recordInspection = usePcStore(s => s.recordInspection)
  const resolveAttack    = usePcStore(s => s.resolveAttack)
  const status = attacks.macro_doc?.status ?? 'pending'
  const [declined, setDeclined] = useState(false)
  const [details, setDetails]   = useState(false)

  const inspect    = () => { setDetails(true); recordInspection('macro_doc', 'file') }
  const onEnable   = () => resolveAttack('macro_doc', false, 'enabled_content')
  const onDont     = () => setDeclined(true)
  const onReport   = () => resolveAttack('macro_doc', true, 'reported')

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f3f3f3', color: '#1b1b1b', fontFamily: 'system-ui, sans-serif' }}>
      {/* Excel-style ribbon */}
      <div style={{ background: '#107c41', color: '#fff', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ fontWeight: 700 }}>X</span>
        <span style={{ fontSize: 13 }}>Q2_Salary_Benchmark_Report.xlsm — Protected View</span>
      </div>

      {/* Security warning bar (real Excel styling) */}
      {status === 'pending' && !declined && (
        <div style={{ background: '#fff4ce', borderBottom: '1px solid #e8d98a', padding: '8px 14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 16 }}>⚠</span>
            <span style={{ fontSize: 12.5, color: '#3b3b00' }}>SECURITY WARNING Macros have been disabled.</span>
            <button onClick={onEnable} style={neutralOfficeButton}>Enable Content</button>
            <button onClick={onDont} style={neutralOfficeButton}>Don’t Enable</button>
            <button onClick={inspect} style={{ ...monoD, fontSize: 10, padding: '3px 8px', borderRadius: 3, border: '1px solid #cfcfcf', background: '#fff', cursor: 'pointer', color: '#5f6368' }}>details</button>
          </div>
          {details && (
            <div style={{ ...monoD, fontSize: 10.5, color: '#9c1c1c', marginTop: 6 }}>
              ⚠ .xlsm = macro-enabled workbook. You didn’t request this file. Enabling content runs code immediately.
            </div>
          )}
        </div>
      )}

      {/* Fake blurred spreadsheet body */}
      <div style={{ flex: 1, overflow: 'auto', padding: 0, position: 'relative' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, filter: status === 'pending' && !declined ? 'blur(2px)' : 'none' }}>
          <tbody>
            {['Name','Band','Current','Proposed'].map((h, r) => (
              <tr key={r}>
                {[0,1,2,3].map(c => (
                  <td key={c} style={{ border: '1px solid #d4d4d4', padding: '6px 12px', background: r === 0 ? '#e8e8e8' : '#fff', color: r === 0 ? '#1b1b1b' : '#888', fontWeight: r === 0 ? 600 : 400 }}>
                    {r === 0 ? h : '████'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {(status !== 'pending' || declined) && (
          <div style={{ position: 'absolute', inset: 0, background: status === 'failed' ? 'rgba(24,4,8,0.97)' : 'rgba(5,8,16,0.97)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center' }}>
            {status === 'failed' ? (
              <>
                <div style={{ ...monoD, fontSize: 11, color: colors.red, letterSpacing: '0.15em', marginBottom: 10 }}>✕ SECURITY FAILURE</div>
                <div style={{ fontFamily: fonts.body, fontSize: 13, color: '#ffb3bf', lineHeight: 1.7, maxWidth: 420 }}>
                  Macros executed the instant you enabled content — a keylogger installed and your machine phoned home to a command-and-control server. Never enable macros on a document you didn’t expect.
                </div>
              </>
            ) : status === 'passed' ? (
              <>
                <div style={{ ...monoD, fontSize: 11, color: colors.green, letterSpacing: '0.15em', marginBottom: 10 }}>✓ FILE REPORTED</div>
                <div style={{ fontFamily: fonts.body, fontSize: 13, color: '#a7f3d0', lineHeight: 1.7, maxWidth: 420 }}>
                  Correct. An unexpected macro-enabled (.xlsm) file with an irresistible name is a classic delivery vector. You kept macros off and flagged it.
                </div>
              </>
            ) : (
              <>
                <div style={{ ...monoD, fontSize: 11, color: colors.amber, marginBottom: 12 }}>Macros left disabled. Flag the file so IT can investigate it.</div>
                <button onClick={onReport} style={neutralReportButton}>
                  Report File to IT
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function LinkedInAttachment() {
  const attacks          = usePcStore(s => s.attacks)
  const recordInspection = usePcStore(s => s.recordInspection)
  const resolveAttack    = usePcStore(s => s.resolveAttack)
  const status = attacks.macro_doc?.status ?? 'pending'
  const [details, setDetails] = useState(false)

  const inspect  = () => { setDetails(true); recordInspection('macro_doc', 'file') }
  const onOpen   = () => resolveAttack('macro_doc', false, 'opened_portfolio_exe')
  const onReport = () => resolveAttack('macro_doc', true, 'reported_portfolio_exe')

  if (status === 'failed') {
    return (
      <div style={{ height: '100%', background: 'rgba(24,4,8,0.97)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center' }}>
        <div style={{ ...monoD, fontSize: 11, color: colors.red, letterSpacing: '0.15em', marginBottom: 10 }}>✕ SECURITY FAILURE</div>
        <div style={{ fontFamily: fonts.body, fontSize: 13, color: '#ffb3bf', lineHeight: 1.7, maxWidth: 430 }}>
          The "portfolio" was an executable disguised with spacing and a double extension. Opening it would install remote access malware under the cover of a recruiter attachment.
        </div>
      </div>
    )
  }

  if (status === 'passed') {
    return (
      <div style={{ height: '100%', background: 'rgba(5,18,13,0.97)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center' }}>
        <div style={{ ...monoD, fontSize: 11, color: colors.green, letterSpacing: '0.15em', marginBottom: 10 }}>✓ FILE REPORTED</div>
        <div style={{ fontFamily: fonts.body, fontSize: 13, color: '#a7f3d0', lineHeight: 1.7, maxWidth: 430 }}>
          Correct. Recruiter messages can be real, but "Portfolio.pdf .exe" is an application hiding behind a document-looking name.
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#060a12', color: '#e5e7eb', fontFamily: fonts.body }}>
      <div style={{ padding: '10px 14px', background: '#0d1320', borderBottom: '1px solid #1a1f2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ ...monoD, fontSize: 11, color: colors.cyan }}>LINKEDIN RECRUITER MESSAGE</div>
        <div style={{ ...monoD, fontSize: 10, color: '#6c7280' }}>Received 2 min ago</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <div style={{ border: '1px solid rgba(0,240,255,0.16)', background: 'rgba(255,255,255,0.035)', borderRadius: 7, padding: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#0a66c2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>in</div>
            <div>
              <div style={{ fontWeight: 700, color: '#f3f4f6', fontSize: 14 }}>Maya Rosen · LinkedIn Recruiter</div>
              <div style={{ ...monoD, fontSize: 10, color: '#7f8da3' }}>Talent Partner, Northbridge Studio</div>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#aeb9c8', lineHeight: 1.7 }}>
            Hi, I saw your design work through a mutual contact. We are shortlisting contractors today and your portfolio looks like a strong fit. Could you take a quick look at the attached brief before 17:00?
          </p>
        </div>

        <div style={{ border: '1px solid #1a1f2a', borderRadius: 7, overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', background: '#0a0e14', ...monoD, fontSize: 10, color: '#6c7280' }}>ATTACHMENTS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 92px 100px', gap: 0, alignItems: 'center', padding: '12px 14px', background: '#0d1320', borderTop: '1px solid #1a1f2a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <span style={{ fontSize: 22 }}>📄</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ ...monoD, fontSize: 12, color: '#f3f4f6', whiteSpace: 'pre' }}>Portfolio.pdf        .exe</div>
                <div style={{ ...monoD, fontSize: 10, color: '#6c7280', marginTop: 2 }}>Downloaded from media-linkedin-cdn.com</div>
              </div>
            </div>
            <div style={{ ...monoD, fontSize: 11, color: '#9ca3af' }}>842 KB</div>
            <div style={{ ...monoD, fontSize: 10, color: '#ff9966' }}>Application</div>
          </div>
        </div>

        {details && (
          <div style={{ ...monoD, marginTop: 12, padding: 10, borderRadius: 5, border: '1px solid rgba(255,170,0,0.28)', background: 'rgba(255,170,0,0.08)', color: colors.amber, fontSize: 10.5, lineHeight: 1.6 }}>
            File name padding hides the true extension. Windows may visually emphasize "Portfolio.pdf" while the executable ".exe" sits far to the right.
          </div>
        )}
      </div>

      <div style={{ padding: '12px 18px', borderTop: '1px solid #1a1f2a', display: 'flex', gap: 10, flexShrink: 0 }}>
        <button onClick={onOpen} style={neutralOfficeButton}>Open Portfolio</button>
        <button onClick={onReport} style={neutralOfficeButton}>Report Attachment</button>
        <button onClick={inspect} style={neutralOfficeButton}>Inspect File Properties</button>
      </div>
    </div>
  )
}

export default function FileExplorerApp() {
  const activePoint = useGameStore(s => s.activePoint)
  if (activePoint === 1) return <LinkedInAttachment />   // Main Workstation PC session
  if (activePoint === 6) return <Point6 />
  if (activePoint === 8) return <Point8 />
  return null
}
