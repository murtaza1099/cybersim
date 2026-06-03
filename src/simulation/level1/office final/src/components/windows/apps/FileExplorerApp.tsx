import { useState } from 'react'
import { useGameStore } from '../../../stores/gameStore'
import { useCameraStore } from '../../../stores/cameraStore'

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
  { name: 'Salary_Review_2025.xlsx', icon: '📊', size: '4.2 MB', danger: true,  reason: 'salary' },
  { name: 'Company_Restructure.pdf', icon: '📄', size: '2.8 MB', danger: true,  reason: 'restructure' },
  { name: 'autorun.inf',             icon: '⚙',  size: '1 KB',   danger: false, reason: 'auto' },
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
      const curiosityNote = f.reason === 'salary'
        ? 'Curiosity about salary data is specifically engineered by attackers.'
        : 'Job security fears are deliberate bait.'
      failAttempt(6, `opened_${f.reason}`)
      setConsequence({
        pts: '−10 PTS',
        text: `You opened a file from an unknown USB. The file contained hidden macros that would have executed immediately.\n\n${curiosityNote}\n\nAttackers leave these drives in lobbies, carparks, and bathrooms. 75% of people plug in found USB drives. Real attack consequence: full system compromise within seconds.`,
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
          ⚠ UNKNOWN_DRIVE (E:\)
        </div>
      </div>

      {/* File list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: '8px 18px', ...mono, fontSize: 10, color: '#3a3f4a', borderBottom: '1px solid #1a1f2a', flexShrink: 0 }}>
          E:\  —  UNKNOWN_DRIVE  —  8.0 GB
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
          Drive from unknown manufacturer · Last modified: Today 6:14 AM
        </div>

        {/* Action bar */}
        {!succeeded && !consequence && (
          <div style={{ padding: '12px 18px', borderTop: '1px solid #1a1f2a', display: 'flex', gap: 10, flexShrink: 0 }}>
            <button onClick={handleEject} style={{
              flex: 1, padding: '9px 0', borderRadius: 6, background: '#001a0f',
              border: '1px solid #00ff88', color: '#00ff88',
              fontFamily: "'Orbitron',sans-serif", fontSize: 10, cursor: 'pointer',
            }}>
              ⏏ Eject Drive Without Opening
            </button>
            <button onClick={handleReport} style={{
              flex: 1, padding: '9px 0', borderRadius: 6, background: 'transparent',
              border: '1px solid #ffaa44', color: '#ffbb66',
              fontFamily: "'Orbitron',sans-serif", fontSize: 10, cursor: 'pointer',
            }}>
              📋 Report to IT
            </button>
          </div>
        )}

        {succeeded && (
          <div style={{ margin: 18, padding: '12px 16px', borderRadius: 6, border: '1px solid #00ff88', color: '#00ff88', ...mono, fontSize: 12, lineHeight: 1.7 }}>
            {succeeded === 'eject' ? (
              <>✓ Correct! Drive ejected safely. +150 pts<br />
              <span style={{ fontSize: 11, color: '#00cc66' }}>
                The only safe action. This USB likely contained BadUSB firmware + malicious macros.<br />
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
  { name: 'chrome.exe',           pid: 1842, cpu: '1.2%',  mem: '180 MB', suspicious: false },
  { name: 'explorer.exe',         pid: 1024, cpu: '0.8%',  mem: '64 MB',  suspicious: false },
  { name: 'svchost.exe',          pid: 892,  cpu: '1.4%',  mem: '48 MB',  suspicious: false },
  { name: 'OneDrive.exe',         pid: 3120, cpu: '0.3%',  mem: '96 MB',  suspicious: false },
  { name: 'RegSvr32.exe',         pid: 7481, cpu: '34%',   mem: '128 MB', suspicious: true  },
  { name: 'svchost_update.exe',   pid: 7502, cpu: '12%',   mem: '64 MB',  suspicious: true  },
  { name: 'WMI_Helper.exe',       pid: 7519, cpu: '8%',    mem: '32 MB',  suspicious: true  },
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
          These processes started 4 minutes ago · Source: Unknown USB / Finance PC
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
              {['Process', 'PID', 'CPU', 'Memory', 'Status'].map(h => (
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
          <button onClick={handleIgnore} style={{
            flex: 1, padding: '9px 0', borderRadius: 6, background: 'transparent',
            border: '1px solid #3a3f4a', color: '#6c7280',
            fontFamily: "'Orbitron',sans-serif", fontSize: 9, cursor: 'pointer',
          }}>Ignore, Looks Fine</button>
          <button onClick={handleKill} style={{
            flex: 1, padding: '9px 0', borderRadius: 6, background: 'transparent',
            border: '1px solid #ff8844', color: '#ffaa66',
            fontFamily: "'Orbitron',sans-serif", fontSize: 9, cursor: 'pointer',
          }}>Kill The Processes</button>
          <button onClick={handleDisconnect} style={{
            flex: 1, padding: '9px 0', borderRadius: 6, background: '#001a0f',
            border: '1px solid #00ff88', color: '#00ff88',
            fontFamily: "'Orbitron',sans-serif", fontSize: 9, cursor: 'pointer',
          }}>Disconnect + Call IT</button>
        </div>
      )}

      {consequence && <ConsequencePanel {...consequence} onUnderstood={handleUnderstood} />}
    </div>
  )
}

export default function FileExplorerApp() {
  const activePoint = useGameStore(s => s.activePoint)
  if (activePoint === 6) return <Point6 />
  if (activePoint === 8) return <Point8 />
  return null
}
