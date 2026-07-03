import { useEffect, useMemo, useState } from 'react'
import { AndroidProvider, useAndroidCtx, currentScreen } from './AndroidContext'
import MessagesApp from './apps/MessagesApp'
import DialerApp   from './apps/DialerApp'
import { ATTACK_POINTS } from '../../config/attacks'
import { useGameStore } from '../../stores/gameStore'
import CenteredOverlay from '../ui/CenteredOverlay'

if (typeof document !== 'undefined' && !document.getElementById('android-animation')) {
  const s = document.createElement('style')
  s.id = 'android-animation'
  s.textContent = `
    @keyframes phoneEnter {
      from { opacity: 0; transform: scale(0.92); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes phoneExit {
      from { opacity: 1; transform: scale(1); }
      to { opacity: 0; transform: scale(0.92); }
    }
    @keyframes appSlideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    @keyframes appSlideOut {
      from { transform: translateX(0); }
      to { transform: translateX(100%); }
    }
    .phone-container { animation: phoneEnter 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    .phone-container.exiting { animation: phoneExit 220ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
    .android-app-screen { animation: appSlideIn 220ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
    .android-app-screen.exiting { animation: appSlideOut 220ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
  `
  document.head.appendChild(s)
}

const ICONS = [
  { name: 'messages', label: 'Messages', glyph: '💬' },
  { name: 'dialer',   label: 'Phone',    glyph: '📞' },
  { name: 'browser',  label: 'Browser',  glyph: '🌐' },
  { name: 'settings', label: 'Settings', glyph: '⚙️' },
  { name: 'maps',     label: 'Maps',     glyph: '🗺️' },
]

function AppScreen({ screen }: { screen: string }) {
  if (screen === 'messages') return <MessagesApp />
  if (screen === 'dialer')   return <DialerApp />
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#3a3f4a' }}>
      {screen}
    </div>
  )
}

function Screen() {
  const { history, dispatch } = useAndroidCtx()
  const screen = currentScreen(history)
  const [isExiting, setIsExiting] = useState(false)
  // Notification badge on the app the current objective needs (e.g. Messages for
  // the SMS-phishing point) so the user knows what to open. Clears with the scene.
  const activePoint = useGameStore(s => s.activePoint)
  const objectiveApp = ATTACK_POINTS.find(a => a.id === activePoint && a.triggerOS === 'android')?.appToOpen ?? null

  const slideStyle = (show: boolean): React.CSSProperties => ({
    position: 'absolute', inset: 0,
    transform: show ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 220ms cubic-bezier(0.4, 0, 0.2, 1)',
    background: '#070c14', overflow: 'hidden',
  })

  const handleBack = () => {
    setIsExiting(true)
    setTimeout(() => {
      dispatch({ type: 'BACK' })
      setIsExiting(false)
    }, 200)
  }

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      {/* Home screen */}
      <div style={{
        ...slideStyle(screen === 'home'),
        background: 'radial-gradient(#0d1929, #04060f)',
        backgroundImage: ['radial-gradient(#0d1929, #04060f)', 'repeating-linear-gradient(transparent, transparent 2px, rgba(0,255,240,0.015) 2px, rgba(0,255,240,0.015) 4px)'].join(','),
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, padding: '24px 16px' }}>
          {ICONS.map(ic => {
            const notify = ic.name === objectiveApp
            return (
              <div key={ic.name}
                   onDoubleClick={() => dispatch({ type: 'OPEN', screen: ic.name })}
                   style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ position: 'relative', width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid #1a1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: notify ? '0 0 0 2px rgba(255,51,85,0.55)' : undefined }}>
                  {ic.glyph}
                  {notify && <div style={{ position: 'absolute', top: -5, right: -5, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, background: '#ff3355', color: '#fff', border: '2px solid #06080f', fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>1</div>}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#9ca3af' }}>{ic.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* App screen — slides in from right */}
      {screen !== 'home' && (
        <div className={`android-app-screen ${isExiting ? 'exiting' : ''}`} style={{ ...slideStyle(true), animationFillMode: 'forwards' }} key={screen}>
          <AppScreen screen={screen} />
        </div>
      )}
    </div>
  )
}

function AndroidAutoOpen() {
  const { dispatch } = useAndroidCtx()
  const activePoint = useGameStore(s => s.activePoint)
  const attack = useMemo(
    () => ATTACK_POINTS.find(a => a.id === activePoint) ?? null,
    [activePoint]
  )
  const appToOpen = attack?.triggerOS === 'android' ? attack.appToOpen : null

  useEffect(() => {
    if (!appToOpen) return
    dispatch({ type: 'HOME' })
    dispatch({ type: 'OPEN', screen: appToOpen })
  }, [appToOpen, dispatch])

  return null
}

export default function AndroidOS() {
  const activePoint = useGameStore(s => s.activePoint)
  const attack = useMemo(
    () => ATTACK_POINTS.find(a => a.id === activePoint) ?? null,
    [activePoint]
  )
  const initialScreen = attack?.triggerOS === 'android' ? attack.appToOpen ?? undefined : undefined

  if (activePoint === 5) {
    return (
      <CenteredOverlay onPointerDown={e => e.stopPropagation()}>
        <div style={{
          width: '100%',
          background: 'linear-gradient(135deg, #090d14, #111827)',
          border: '1px solid #00f0ff2e',
          borderRadius: 18,
          overflow: 'hidden',
          color: '#e5e7eb',
        }}>
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid #1a1f2a',
            fontFamily: "'Orbitron',sans-serif",
            fontSize: 12,
            letterSpacing: '.12em',
            color: '#00f0ff',
          }}>
            CYBERSIM // Office Landline
          </div>
          <div style={{ height: 'min(560px, 76vh)' }}>
            <AndroidProvider initialScreen="dialer">
              <DialerApp />
            </AndroidProvider>
          </div>
        </div>
      </CenteredOverlay>
    )
  }

  return (
    <CenteredOverlay size="phone" onPointerDown={e => e.stopPropagation()}>
      <div style={{
        width: '100%', height: '100%',
        background: '#06080f', borderRadius: 36, padding: '12px 8px 20px',
        boxShadow: '0 0 0 1px #1a1f2a, 0 32px 80px #00000099',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Speaker notch */}
        <div style={{ width: 60, height: 6, background: '#0d1017', borderRadius: 3, margin: '0 auto 8px' }} />

        {/* Screen */}
        <div style={{ flex: 1, borderRadius: 24, overflow: 'hidden', background: '#070c14', display: 'flex', flexDirection: 'column' }}>
          {/* Status bar */}
          <div style={{ height: 24, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', padding: '0 12px', flexShrink: 0 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#9ca3af' }}>▮▮▮▮</span>
            <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#9ca3af' }}>
              🔋 {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
          </div>

          <AndroidProvider initialScreen={initialScreen}>
            <AndroidAutoOpen />
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <Screen />
            </div>
            <AndroidNavBar />
          </AndroidProvider>
        </div>
      </div>
    </CenteredOverlay>
  )
}

function AndroidNavBar() {
  const { dispatch } = useAndroidCtx()
  const style: React.CSSProperties = { flex: 1, background: 'none', border: 'none', color: '#9ca3af', fontSize: 16, cursor: 'pointer' }
  return (
    <div style={{ height: 40, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      <button style={style} onClick={() => dispatch({ type: 'BACK' })}>◁</button>
      <button style={style} onClick={() => dispatch({ type: 'HOME' })}>○</button>
      <button style={style}>▭</button>
    </div>
  )
}
