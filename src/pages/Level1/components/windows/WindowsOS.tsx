import { useEffect, useMemo, useState, useRef, type ReactNode } from 'react'
import { WindowsProvider, useWindowsCtx } from './WindowsContext'
import { useGameStore } from '../../stores/gameStore'
import { ATTACK_POINTS } from '../../config/attacks'
import type { AppName, OpenApp } from '../../types'
import OutlookApp      from './apps/OutlookApp'
import BrowserApp      from './apps/BrowserApp'
import FileExplorerApp from './apps/FileExplorerApp'

// ─── CSS injection ────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('win-os-styles')) {
  const s = document.createElement('style')
  s.id = 'win-os-styles'
  s.textContent = `
    @keyframes winEnterOuter {
      from { opacity: 0; transform: scale(0.97); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes winExitOuter {
      from { opacity: 1; transform: scale(1); }
      to   { opacity: 0; transform: scale(0.97); }
    }
    @keyframes winInnerOpen {
      from { opacity:0; transform: scale(0.95) translateY(-8px); }
      to   { opacity:1; transform: scale(1)    translateY(0px); }
    }
    @keyframes winInnerExit {
      from { opacity:1; transform: scale(1) translateY(0); }
      to   { opacity:0; transform: scale(0.96) translateY(8px); }
    }
    .win-outer-enter {
      animation: winEnterOuter 200ms ease forwards;
      animation-delay: 80ms;
      opacity: 0;
    }
    .win-outer-exit { animation: winExitOuter 220ms cubic-bezier(0.4,0,0.2,1) forwards; }
    .win-inner-open { animation: winInnerOpen 200ms cubic-bezier(0.34,1.56,0.64,1) forwards; }
    .win-inner-exit { animation: winInnerExit 180ms ease forwards; }
    .win-scanlines {
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 3px,
        rgba(0,240,255,0.012) 3px,
        rgba(0,240,255,0.012) 4px
      );
      pointer-events: none;
      position: absolute;
      inset: 0;
    }
    .win-icon-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; user-select: none; width: 72px; }
    .win-icon-area {
      width: 48px; height: 48px; border-radius: 14px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      display: flex; align-items: center; justify-content: center;
      transition: background 180ms ease, border-color 180ms ease;
    }
    .win-icon-wrap:hover .win-icon-area {
      background: rgba(0,240,255,0.1);
      border-color: rgba(0,240,255,0.3);
    }
    .win-icon-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: rgba(255,255,255,0.75);
      text-align: center;
      transition: color 180ms ease;
    }
    .win-icon-wrap:hover .win-icon-label { color: #00f0ff; }
    .win-taskbar-pill {
      display: flex; align-items: center; gap: 6px;
      padding: 4px 10px; border-radius: 4px;
      font-family: 'JetBrains Mono', monospace; font-size: 10px;
      cursor: pointer;
      transition: background 150ms ease, border-color 150ms ease;
    }
  `
  document.head.appendChild(s)
}

// ─── SVG icons ────────────────────────────────────────────────────────────────
const IconOutlook = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00a4ef" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <polyline points="2,4 12,13 22,4"/>
  </svg>
)
const IconBrowser = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4fc3f7" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)
const IconFolder = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffd54f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
)
const IconTrash = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#90a4ae" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

const APP_LABELS: Record<AppName, string> = {
  outlook: 'Outlook', browser: 'Browser', fileExplorer: 'File Explorer',
  messages: 'Messages', dialer: 'Dialer',
}

const DESKTOP_ICONS: { name: AppName | null; label: string; Icon: React.FC }[] = [
  { name: 'outlook',      label: 'Outlook',       Icon: IconOutlook },
  { name: 'browser',      label: 'Browser',        Icon: IconBrowser },
  { name: 'fileExplorer', label: 'File Explorer',  Icon: IconFolder  },
  { name: null,           label: 'Recycle Bin',    Icon: IconTrash   },
]

// ─── AppWindow (inner chrome) ─────────────────────────────────────────────────
function AppWindow({ app, children }: { app: OpenApp; children: ReactNode }) {
  const { dispatch } = useWindowsCtx()
  const [pos, setPos]       = useState({ x: 120, y: 45 })
  const [isExiting, setIsExiting] = useState(false)
  const drag = useRef({ active: false, sx: 0, sy: 0, ix: 0, iy: 0 })

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => dispatch({ type: 'CLOSE_APP', id: app.id }), 180)
  }
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { active: true, sx: e.clientX, sy: e.clientY, ix: pos.x, iy: pos.y }
  }
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return
    setPos({ x: drag.current.ix + e.clientX - drag.current.sx, y: drag.current.iy + e.clientY - drag.current.sy })
  }
  const onUp = () => { drag.current.active = false }

  if (app.minimized) return null

  const style: React.CSSProperties = app.maximized
    ? { position: 'absolute', inset: 0, zIndex: app.zIndex, background: 'rgba(8,12,20,0.97)', overflow: 'hidden' }
    : {
        position: 'absolute', left: pos.x, top: pos.y,
        width: 680, height: 420, zIndex: app.zIndex,
        background: 'rgba(8,12,20,0.97)',
        border: '1px solid rgba(0,240,255,0.15)',
        borderRadius: 8, overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 20px rgba(0,240,255,0.05)',
      }

  return (
    <div
      className={`win-inner-open${isExiting ? ' win-inner-exit' : ''}`}
      style={style}
      onPointerDown={() => dispatch({ type: 'FOCUS_APP', id: app.id })}
    >
      {/* Inner title bar */}
      <div
        style={{
          height: 28, flexShrink: 0,
          background: 'rgba(0,240,255,0.04)',
          borderBottom: '1px solid rgba(0,240,255,0.08)',
          display: 'flex', alignItems: 'center', padding: '0 12px',
          cursor: 'move', userSelect: 'none',
        }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
      >
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(0,240,255,0.7)', flex: 1 }}>
          {APP_LABELS[app.appName]}
        </span>
        <button
          onClick={e => { e.stopPropagation(); dispatch({ type: 'MAXIMIZE', id: app.id }) }}
          style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 12, marginRight: 6, padding: '2px 6px' }}
        >⬜</button>
        <button
          onClick={e => { e.stopPropagation(); handleClose() }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '2px 6px', color: '#9ca3af' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ff5f57')}
          onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
        >✕</button>
      </div>
      <div style={{ height: 'calc(100% - 28px)', overflow: 'auto' }}>{children}</div>
    </div>
  )
}

function AppContent({ appName }: { appName: AppName }) {
  if (appName === 'outlook')      return <OutlookApp />
  if (appName === 'browser')      return <BrowserApp />
  if (appName === 'fileExplorer') return <FileExplorerApp />
  return <div style={{ color: '#6c7280', padding: 20, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>App: {appName}</div>
}

// ─── Desktop ──────────────────────────────────────────────────────────────────
function Desktop() {
  const { openApps, clock, dispatch } = useWindowsCtx()
  const activePoint = useGameStore(s => s.activePoint)
  const attack = useMemo(
    () => ATTACK_POINTS.find(a => a.id === activePoint) ?? null,
    [activePoint]
  )
  const maxZ = openApps.reduce((m, a) => Math.max(m, a.zIndex), 0)

  useEffect(() => {
    if (attack?.appToOpen && attack.triggerOS === 'windows') {
      dispatch({ type: 'OPEN_APP', appName: attack.appToOpen })
    }
  }, [attack?.appToOpen, attack?.triggerOS, dispatch])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Desktop area */}
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse 120% 80% at 30% 60%, #0d1829 0%, #060a12 100%)',
      }}>
        <div className="win-scanlines" />

        {/* Icons — top-left 2×2 grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24, position: 'absolute', top: 0, left: 0 }}>
          {DESKTOP_ICONS.map(ic => {
            const isOpen = ic.name ? openApps.some(a => a.appName === ic.name) : false
            return (
              <div
                key={ic.label}
                className="win-icon-wrap"
                onClick={() => ic.name && dispatch({ type: 'OPEN_APP', appName: ic.name })}
                style={{ cursor: ic.name ? 'pointer' : 'default' }}
              >
                <div className="win-icon-area">
                  <ic.Icon />
                </div>
                <span className="win-icon-label">{ic.label}</span>
                {isOpen && (
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#00f0ff', marginTop: -2 }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Open app windows */}
        {openApps.map(app => (
          <AppWindow key={app.id} app={app}>
            <AppContent appName={app.appName} />
          </AppWindow>
        ))}
      </div>

      {/* Taskbar */}
      <div style={{
        height: 32, flexShrink: 0,
        background: 'rgba(6,10,18,0.98)',
        borderTop: '1px solid rgba(0,240,255,0.08)',
        display: 'flex', alignItems: 'center', padding: '0 4px', gap: 4,
      }}>
        <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: '#00f0ff', padding: '0 12px', letterSpacing: '0.05em', cursor: 'default' }}>
          ▶ SYS
        </span>
        {openApps.filter(a => !a.minimized).map(a => {
          const isActive = a.zIndex === maxZ
          return (
            <button
              key={a.id}
              className="win-taskbar-pill"
              onClick={() => dispatch({ type: 'FOCUS_APP', id: a.id })}
              style={{
                background: isActive ? 'rgba(0,240,255,0.12)' : 'rgba(0,240,255,0.06)',
                border: `1px solid ${isActive ? 'rgba(0,240,255,0.3)' : 'rgba(0,240,255,0.12)'}`,
                color: '#e5e7eb',
              }}
            >
              {APP_LABELS[a.appName]}
            </button>
          )
        })}
        <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(0,240,255,0.6)', paddingRight: 12 }}>
          {clock}
        </span>
      </div>
    </div>
  )
}

// ─── WindowsOS ────────────────────────────────────────────────────────────────
export default function WindowsOS() {
  const closeOS     = useGameStore(s => s.closeOS)
  const [isExiting, setIsExiting]   = useState(false)
  const [outerMin,  setOuterMin]    = useState(false)
  const [outerMax,  setOuterMax]    = useState(false)
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  )

  useEffect(() => {
    const id = setInterval(() => {
      setClock(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => { closeOS(); setIsExiting(false) }, 220)
  }

  const modalWidth  = outerMax ? '90vw' : 920
  const modalHeight = 580

  // Minimized — just a pill at the bottom
  if (outerMin) {
    return (
      <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
        <div
          onClick={() => setOuterMin(false)}
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            zIndex: 200, cursor: 'pointer',
            background: 'rgba(6,10,18,0.98)',
            border: '1px solid rgba(0,240,255,0.18)',
            borderRadius: 8, padding: '8px 24px',
            display: 'flex', alignItems: 'center', gap: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
        >
          <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: '#00f0ff', letterSpacing: '0.12em' }}>
            CYBERSIM // JOHN'S WORKSTATION
          </span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(0,240,255,0.6)' }}>
            {clock}
          </span>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Backdrop — click does NOT close windows */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(6px)',
        zIndex: 199,
      }} />

      {/* Centering wrapper — no animation transform here */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 200,
      }}>
        {/* Animated content */}
        <div
          className={isExiting ? 'win-outer-exit' : 'win-outer-enter'}
          style={{
            width: modalWidth, height: modalHeight,
            background: '#0a0c14',
            border: '1px solid rgba(0,240,255,0.18)',
            borderRadius: 10, overflow: 'hidden',
            boxShadow: [
              '0 0 0 1px rgba(0,240,255,0.06)',
              '0 32px 80px rgba(0,0,0,0.85)',
              'inset 0 0 60px rgba(0,240,255,0.08)',
            ].join(', '),
            display: 'flex', flexDirection: 'column',
          }}
          onPointerDown={e => e.stopPropagation()}
        >
          {/* Title bar */}
          <div style={{
            height: 38, flexShrink: 0,
            background: 'linear-gradient(180deg, #111827 0%, #0d1117 100%)',
            borderBottom: '1px solid rgba(0,240,255,0.1)',
            display: 'flex', alignItems: 'center', padding: '0 16px',
          }}>
            {/* Traffic lights */}
            <div style={{ display: 'flex', gap: 6, marginRight: 16 }}>
              <div
                onClick={handleClose}
                title="Close"
                style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', cursor: 'pointer' }}
              />
              <div
                onClick={() => setOuterMin(true)}
                title="Minimize"
                style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e', cursor: 'pointer' }}
              />
              <div
                onClick={() => setOuterMax(m => !m)}
                title="Maximize"
                style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840', cursor: 'pointer' }}
              />
            </div>

            {/* Centered title */}
            <span style={{
              flex: 1, textAlign: 'center',
              fontFamily: "'Orbitron',sans-serif", fontSize: 10,
              color: 'rgba(0,240,255,0.6)', letterSpacing: '3px',
            }}>
              CYBERSIM // JOHN'S WORKSTATION
            </span>

            {/* Live clock */}
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(0,240,255,0.6)' }}>
              {clock}
            </span>
          </div>

          {/* Desktop + taskbar */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <WindowsProvider>
              <Desktop />
            </WindowsProvider>
          </div>
        </div>
      </div>
    </>
  )
}
