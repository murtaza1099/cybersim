import { useEffect, useMemo, useState, useRef, useCallback, type ReactNode, type FC } from 'react'
import { WindowsProvider, useWindowsCtx } from './WindowsContext'
import { useGameStore } from '../../stores/gameStore'
import { usePcStore, PC_ATTACK_IDS } from '../../stores/pcStore'
import { useCameraStore } from '../../stores/cameraStore'
import { useAuthStore } from '@/store/authStore'
import { colors, fonts } from '../../styles/theme'
import { PC_TIMELINE, type PcToastIcon } from '../../config/pcTimeline'
import { ATTACK_POINTS } from '../../config/attacks'
import type { AppName, OpenApp, PcSubAttackId } from '../../types'
import OutlookApp      from './apps/OutlookApp'
import BrowserApp      from './apps/BrowserApp'
import FileExplorerApp from './apps/FileExplorerApp'
import FakeDefenderApp from './apps/FakeDefenderApp'

// ─── CSS injection ────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('win-os-styles')) {
  const s = document.createElement('style')
  s.id = 'win-os-styles'
  s.textContent = `
    @keyframes winEnterOuter { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
    @keyframes winExitOuter  { from { opacity: 1; transform: scale(1); }    to { opacity: 0; transform: scale(0.97); } }
    @keyframes winInnerOpen  { from { opacity:0; transform: scale(0.95) translateY(-8px); } to { opacity:1; transform: scale(1) translateY(0px); } }
    @keyframes winInnerExit  { from { opacity:1; transform: scale(1) translateY(0); }       to { opacity:0; transform: scale(0.96) translateY(8px); } }
    @keyframes winIconAppear { from { opacity:0; transform: scale(0.6) translateY(6px); }    to { opacity:1; transform: scale(1) translateY(0); } }
    @keyframes winPulseDot   { 0%,100% { box-shadow: 0 0 0 0 rgba(255,170,0,0.55); } 50% { box-shadow: 0 0 0 5px rgba(255,170,0,0); } }
    .win-outer-enter { animation: winEnterOuter 200ms ease forwards; animation-delay: 80ms; opacity: 0; }
    .win-outer-exit  { animation: winExitOuter 220ms cubic-bezier(0.4,0,0.2,1) forwards; }
    .win-inner-open  { animation: winInnerOpen 200ms cubic-bezier(0.34,1.56,0.64,1) forwards; }
    .win-inner-exit  { animation: winInnerExit 180ms ease forwards; }
    .win-icon-appear { animation: winIconAppear 360ms cubic-bezier(0.34,1.56,0.64,1) forwards; }
    .win-dotgrid { position:absolute; inset:0; pointer-events:none; background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 32px 32px; }
    .win-icon-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; user-select: none; width: 84px; padding: 6px 4px; border-radius: 8px; cursor: pointer; transition: background 150ms ease; position: relative; }
    .win-icon-wrap:hover { background: rgba(255,255,255,0.07); }
    .win-icon-area { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); transition: background 150ms ease, border-color 150ms ease; }
    .win-icon-wrap:hover .win-icon-area { background: rgba(76,194,255,0.12); border-color: rgba(76,194,255,0.35); }
    .win-icon-label { font-family: ${fonts.body}; font-size: 11px; color: rgba(255,255,255,0.85); text-align: center; line-height: 1.25; max-width: 80px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .win-tasktip { display: flex; align-items: center; justify-content: center; width: 38px; height: 30px; border-radius: 6px; cursor: pointer; transition: background 150ms ease; position: relative; }
    .win-tasktip:hover { background: rgba(255,255,255,0.08); }
    .win-tray-btn { display:flex; align-items:center; justify-content:center; padding: 4px 6px; border-radius: 6px; cursor: pointer; transition: background 150ms ease; }
    .win-tray-btn:hover { background: rgba(255,255,255,0.08); }
  `
  document.head.appendChild(s)
}

// ─── SVG icons ────────────────────────────────────────────────────────────────
const IconOutlook: FC = () => (<svg width="26" height="26" viewBox="0 0 32 32"><rect x="12" y="7" width="17" height="18" rx="1.5" fill="#fff" stroke="#0F6CBD" strokeWidth="1" /><path d="M13 9.5l7.5 5.5L28 9.5" fill="none" stroke="#0F6CBD" strokeWidth="1.4" /><rect x="3" y="5" width="15" height="22" rx="3" fill="#0F6CBD" /><text x="10.5" y="20.5" fontSize="13" fontWeight="800" fill="#fff" textAnchor="middle" fontFamily="Arial, sans-serif">O</text></svg>)
const IconBrowser: FC = () => (<svg width="26" height="26" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#fff" /><path d="M12 3a9 9 0 0 1 7.79 4.5H12a4.5 4.5 0 0 0-3.897 2.252L4.61 5.605A8.98 8.98 0 0 1 12 3z" fill="#EA4335" /><path d="M19.79 7.5A9 9 0 0 1 12 21l3.897-6.748A4.5 4.5 0 0 0 16.5 12a4.48 4.48 0 0 0-.61-2.5z" fill="#FBBC05" /><path d="M12 21A9 9 0 0 1 4.61 5.605l3.493 6.147A4.5 4.5 0 0 0 12 16.5q.51 0 .99-.11z" fill="#34A853" /><circle cx="12" cy="12" r="4.2" fill="#fff" /><circle cx="12" cy="12" r="3.3" fill="#4285F4" /></svg>)
const IconFolder: FC = () => (<svg width="26" height="26" viewBox="0 0 32 32"><path d="M3 9a2 2 0 0 1 2-2h6.5l2.2 2.6H27a2 2 0 0 1 2 2v11.4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#F2A100" /><path d="M3 13.5h26V23a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#FFC93C" /></svg>)
const IconTrash: FC = () => (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9fb3c7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5.5 7h13l-1.1 12.3a1.8 1.8 0 0 1-1.8 1.7H8.4a1.8 1.8 0 0 1-1.8-1.7z" fill="rgba(130,170,210,0.22)" /><path d="M3.5 7h17" /><path d="M9 4.5h6" /></svg>)
const IconThisPC: FC = () => (<svg width="26" height="26" viewBox="0 0 32 32"><rect x="3" y="6" width="26" height="16" rx="1.5" fill="#3E8FD6" /><rect x="5" y="8" width="22" height="12" rx="0.5" fill="#cfeaff" /><rect x="11" y="23.5" width="10" height="2" rx="1" fill="#3E8FD6" /><rect x="9" y="25.5" width="14" height="2" rx="1" fill="#2E73B0" /></svg>)
const IconExcel: FC = () => (<svg width="26" height="26" viewBox="0 0 32 32"><rect x="3" y="4" width="26" height="24" rx="2.5" fill="#107C41" /><path d="M11 11l10 10M21 11L11 21" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /></svg>)
const IconShield: FC = () => (<svg width="26" height="26" viewBox="0 0 32 32"><path d="M16 3l11 4v6.5c0 7-4.7 11.8-11 15.2C9.7 25.3 5 20.5 5 13.5V7z" fill="#1273CF" /><path d="M16 3v25.7C9.7 25.3 5 20.5 5 13.5V7z" fill="#0A4F94" /><path d="M11 16.2l3.4 3.4L22 12.2" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg>)
const IconNotepad: FC = () => (<svg width="26" height="26" viewBox="0 0 32 32"><rect x="6" y="4" width="20" height="24" rx="2" fill="#4AA3DF" /><rect x="6" y="4" width="20" height="6" rx="2" fill="#2E7CB8" /><rect x="10" y="14" width="12" height="1.8" rx="0.9" fill="#fff" /><rect x="10" y="18" width="12" height="1.8" rx="0.9" fill="#fff" /><rect x="10" y="22" width="8" height="1.8" rx="0.9" fill="#fff" /></svg>)
const IconTeams: FC = () => (<svg width="26" height="26" viewBox="0 0 32 32"><rect x="4" y="6" width="24" height="20" rx="3" fill="#5059C9" /><text x="16" y="21" fontSize="14" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="Arial, sans-serif">T</text></svg>)
const IconCalendar: FC = () => (<svg width="26" height="26" viewBox="0 0 32 32"><rect x="4" y="6" width="24" height="22" rx="2.5" fill="#fff" /><rect x="4" y="6" width="24" height="6.5" rx="2.5" fill="#D24726" /><rect x="9" y="3" width="2.5" height="6" rx="1.2" fill="#9c3520" /><rect x="20.5" y="3" width="2.5" height="6" rx="1.2" fill="#9c3520" /><text x="16" y="24" fontSize="10" fontWeight="700" fill="#D24726" textAnchor="middle" fontFamily="Arial, sans-serif">14</text></svg>)
const IconWindows: FC = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="#4cc2ff"><rect x="3" y="3" width="8" height="8" rx="0.5" /><rect x="13" y="3" width="8" height="8" rx="0.5" /><rect x="3" y="13" width="8" height="8" rx="0.5" /><rect x="13" y="13" width="8" height="8" rx="0.5" /></svg>)
const IconWifi: FC = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#cdd6e3" strokeWidth="1.7" strokeLinecap="round"><path d="M5 12.5a10 10 0 0 1 14 0" /><path d="M8 15.5a6 6 0 0 1 8 0" /><circle cx="12" cy="19" r="0.6" fill="#cdd6e3" stroke="none" /></svg>)
const IconVolume: FC = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#cdd6e3" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 8.5a4 4 0 0 1 0 7" /></svg>)
const IconBattery: FC = () => (<svg width="22" height="15" viewBox="0 0 30 16" fill="none"><rect x="1" y="3" width="24" height="10" rx="2" stroke="#cdd6e3" strokeWidth="1.4" /><rect x="26" y="6" width="2.5" height="4" rx="1" fill="#cdd6e3" /><rect x="3" y="5" width="18" height="6" rx="1" fill="#7ee787" /></svg>)
const IconBell: FC = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#cdd6e3" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>)

const TOAST_ICONS: Record<PcToastIcon, FC> = {
  shield: IconShield, mail: IconOutlook, browser: IconBrowser, excel: IconExcel, teams: IconTeams, calendar: IconCalendar,
}
const APP_LABELS: Record<AppName, string> = {
  outlook: 'Outlook', browser: 'Chrome', fileExplorer: 'File Explorer', messages: 'Messages', dialer: 'Dialer', defender: 'Windows Security',
}
const APP_ICONS: Record<AppName, FC> = {
  outlook: IconOutlook, browser: IconBrowser, fileExplorer: IconFolder, messages: IconFolder, dialer: IconFolder, defender: IconShield,
}

// ─── Windows toast ─────────────────────────────────────────────────────────────
interface ToastData { id: number; icon: ReactNode; title: string; body: string; actionLabel?: string; onAction?: () => void }
interface WindowsToastProps { icon: ReactNode; title: string; body: string; actionLabel?: string; onAction?: () => void; onDismiss: () => void }

function WindowsToast({ icon, title, body, actionLabel, onAction, onDismiss }: WindowsToastProps) {
  const [shown, setShown] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const close = useCallback(() => { setLeaving(true); setTimeout(onDismiss, 300) }, [onDismiss])
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true))
    const t = setTimeout(close, 5000)
    return () => { cancelAnimationFrame(raf); clearTimeout(t) }
  }, [close])
  const offset = leaving || !shown ? 'translateX(320px)' : 'translateX(0)'
  return (
    <div style={{ position: 'absolute', bottom: 48, right: 12, width: 300, zIndex: 60, background: 'rgba(28,32,44,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', transform: offset, transition: 'transform 300ms ease', padding: '12px 12px 12px 14px' }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 6, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: fonts.body, fontSize: 12.5, fontWeight: 600, color: '#f3f4f6' }}>{title}</div>
          <div style={{ fontFamily: fonts.body, fontSize: 11.5, color: '#9ca3af', marginTop: 2, lineHeight: 1.4 }}>{body}</div>
          {actionLabel && (
            <button onClick={() => { onAction?.(); close() }} style={{ marginTop: 8, padding: '5px 12px', borderRadius: 5, cursor: 'pointer', background: 'rgba(76,194,255,0.14)', border: '1px solid rgba(76,194,255,0.4)', color: '#9bd9ff', fontFamily: fonts.mono, fontSize: 10.5 }}>{actionLabel}</button>
          )}
        </div>
        <button onClick={close} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: 2, height: 'fit-content' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#e5e7eb')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>✕</button>
      </div>
    </div>
  )
}

// ─── AppWindow (inner draggable chrome) ───────────────────────────────────────
function AppWindow({ app, children }: { app: OpenApp; children: ReactNode }) {
  const { dispatch } = useWindowsCtx()
  const [pos, setPos] = useState({ x: 120, y: 45 })
  const [isExiting, setIsExiting] = useState(false)
  const drag = useRef({ active: false, sx: 0, sy: 0, ix: 0, iy: 0 })
  const handleClose = () => { setIsExiting(true); setTimeout(() => dispatch({ type: 'CLOSE_APP', id: app.id }), 180) }
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Don't start a drag (which captures the pointer) when pressing the
    // min/max/close buttons — otherwise their click never fires.
    if ((e.target as HTMLElement).closest('button')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { active: true, sx: e.clientX, sy: e.clientY, ix: pos.x, iy: pos.y }
  }
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => { if (!drag.current.active) return; setPos({ x: drag.current.ix + e.clientX - drag.current.sx, y: drag.current.iy + e.clientY - drag.current.sy }) }
  const onUp = () => { drag.current.active = false }
  if (app.minimized) return null

  const style: React.CSSProperties = app.maximized
    ? { position: 'absolute', inset: 0, zIndex: app.zIndex, background: 'rgba(8,12,20,0.97)', overflow: 'hidden' }
    : { position: 'absolute', left: pos.x, top: pos.y, width: 680, height: 420, zIndex: app.zIndex, background: 'rgba(8,12,20,0.97)', border: '1px solid rgba(76,194,255,0.18)', borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }
  const Icon = APP_ICONS[app.appName]

  return (
    <div className={`win-inner-open${isExiting ? ' win-inner-exit' : ''}`} style={style} onPointerDown={() => dispatch({ type: 'FOCUS_APP', id: app.id })}>
      <div style={{ height: 30, flexShrink: 0, background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', padding: '0 6px 0 12px', gap: 8, cursor: 'move', userSelect: 'none' }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}>
        <span style={{ display: 'inline-flex', transform: 'scale(0.7)' }}><Icon /></span>
        <span style={{ fontFamily: fonts.body, fontSize: 12, color: '#cdd6e3', flex: 1 }}>{APP_LABELS[app.appName]}</span>
        <button onClick={e => { e.stopPropagation(); dispatch({ type: 'MINIMIZE', id: app.id }) }} style={titlebarBtn}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>─</button>
        <button onClick={e => { e.stopPropagation(); dispatch({ type: 'MAXIMIZE', id: app.id }) }} style={{ ...titlebarBtn, fontSize: 11 }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>☐</button>
        <button onClick={e => { e.stopPropagation(); handleClose() }} style={titlebarBtn}
          onMouseEnter={e => { e.currentTarget.style.background = '#e81123'; e.currentTarget.style.color = '#fff' }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}>✕</button>
      </div>
      <div style={{ height: 'calc(100% - 30px)', overflow: 'auto' }}>{children}</div>
    </div>
  )
}
const titlebarBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 13, padding: '2px 9px' }

function AppContent({ appName }: { appName: AppName }) {
  if (appName === 'outlook')      return <OutlookApp />
  if (appName === 'browser')      return <BrowserApp />
  if (appName === 'fileExplorer') return <FileExplorerApp />
  if (appName === 'defender')     return <FakeDefenderApp />
  return <div style={{ color: colors.textDim, padding: 20, fontFamily: fonts.mono, fontSize: 12 }}>App: {appName}</div>
}

// ─── Desktop ──────────────────────────────────────────────────────────────────
interface DesktopIcon { key: string; label: string; app: AppName | null; Icon: FC; col: 0 | 1 }
const BASE_ICONS: DesktopIcon[] = [
  { key: 'outlook',      label: 'Outlook',          app: 'outlook',      Icon: IconOutlook, col: 0 },
  { key: 'fileExplorer', label: 'File Explorer',    app: 'fileExplorer', Icon: IconFolder,  col: 0 },
  { key: 'recycle',      label: 'Recycle Bin',      app: null,           Icon: IconTrash,   col: 0 },
  { key: 'thispc',       label: 'This PC',          app: null,           Icon: IconThisPC,  col: 0 },
  { key: 'browser',      label: 'Chrome Browser',   app: 'browser',      Icon: IconBrowser, col: 1 },
  { key: 'defender',     label: 'Windows Security', app: 'defender',     Icon: IconShield,  col: 1 },
  { key: 'notepad',      label: 'Notepad',          app: null,           Icon: IconNotepad, col: 1 },
]

// Pinned apps shown in the Start menu.
const START_APPS: { app: AppName; label: string; Icon: FC }[] = [
  { app: 'outlook',      label: 'Outlook',  Icon: IconOutlook },
  { app: 'browser',      label: 'Chrome',   Icon: IconBrowser },
  { app: 'fileExplorer', label: 'Files',    Icon: IconFolder },
  { app: 'defender',     label: 'Security', Icon: IconShield },
]

function Desktop({ isPcSession }: { isPcSession: boolean }) {
  const { openApps, dispatch } = useWindowsCtx()
  const fired   = usePcStore(s => s.fired)
  const attacks = usePcStore(s => s.attacks)
  const trigger = usePcStore(s => s.trigger)
  const maxZ = openApps.reduce((m, a) => Math.max(m, a.zIndex), 0)

  // Toast queue — one at a time, 500ms gap.
  const [queue, setQueue]   = useState<ToastData[]>([])
  const [active, setActive] = useState<ToastData | null>(null)
  const cooling = useRef(false)
  const shownToasts = useRef<Set<string>>(new Set())
  const showToast = useCallback((t: Omit<ToastData, 'id'>) => setQueue(q => [...q, { ...t, id: Date.now() + Math.random() }]), [])
  useEffect(() => {
    if (active || cooling.current || queue.length === 0) return
    setActive(queue[0]); setQueue(q => q.slice(1))
  }, [active, queue])
  const dismissToast = useCallback(() => {
    setActive(null); cooling.current = true
    // Clear gap between toasts so they arrive one at a time, not in a burst.
    setTimeout(() => { cooling.current = false; setQueue(q => [...q]) }, 1200)
  }, [])

  // Surface a toast whenever a timeline event with a toast fires.
  useEffect(() => {
    if (!isPcSession) return
    PC_TIMELINE.forEach(ev => {
      if (!ev.toast || !fired[ev.id] || shownToasts.current.has(ev.id)) return
      shownToasts.current.add(ev.id)
      const Icon = TOAST_ICONS[ev.toast.icon]
      const onAction = ev.toast.action === 'openDefender' ? () => dispatch({ type: 'OPEN_APP', appName: 'defender' }) : undefined
      showToast({ icon: <Icon />, title: ev.toast.title, body: ev.toast.body, actionLabel: ev.toast.actionLabel, onAction })
    })
  }, [fired, isPcSession, dispatch, showToast])

  // PC session opens with Outlook already up (the phish is waiting in the inbox).
  // Single-scenario windows points (USB / Malware) auto-open File Explorer instead.
  useEffect(() => {
    if (isPcSession) { dispatch({ type: 'OPEN_APP', appName: 'outlook' }); return }
    const ap = useGameStore.getState().activePoint
    if (ap === 6 || ap === 8) dispatch({ type: 'OPEN_APP', appName: 'fileExplorer' })
  }, [isPcSession, dispatch])

  // Fire the action-triggered events when the browser opens (ClickFix-style reactivity).
  const browserOpen = openApps.some(a => a.appName === 'browser')
  const triggeredBrowser = useRef(false)
  useEffect(() => {
    if (isPcSession && browserOpen && !triggeredBrowser.current) { triggeredBrowser.current = true; trigger('browser:opened') }
  }, [isPcSession, browserOpen, trigger])

  // "NEW" badge on the macro file for 5s after it appears.
  const [newBadge, setNewBadge] = useState(false)
  const [startOpen, setStartOpen] = useState(false)
  useEffect(() => {
    if (!fired.macro_doc) return
    setNewBadge(true)
    const t = setTimeout(() => setNewBadge(false), 5000)
    return () => clearTimeout(t)
  }, [fired.macro_doc])

  const macroVisible = isPcSession && fired.macro_doc
  const browserPulse = isPcSession && fired.browser_nudge && (attacks.clickfix?.status ?? 'pending') === 'pending'

  const icons: DesktopIcon[] = macroVisible
    ? [...BASE_ICONS, { key: 'excel', label: 'Portfolio.pdf .exe', app: 'fileExplorer', Icon: IconExcel, col: 1 }]
    : BASE_ICONS
  const col0 = icons.filter(i => i.col === 0)
  const col1 = icons.filter(i => i.col === 1)

  const renderIcon = (ic: DesktopIcon) => {
    const isOpen = ic.app ? openApps.some(a => a.appName === ic.app) : false
    const isExcel = ic.key === 'excel'
    const showPulse = ic.key === 'browser' && browserPulse
    return (
      <div key={ic.key} className={`win-icon-wrap${isExcel ? ' win-icon-appear' : ''}`} onClick={() => ic.app && dispatch({ type: 'OPEN_APP', appName: ic.app })} style={{ cursor: ic.app ? 'pointer' : 'default' }}>
        <div className="win-icon-area" style={showPulse ? { animation: 'winPulseDot 1.4s ease-in-out infinite' } : undefined}><ic.Icon /></div>
        <span className="win-icon-label">{ic.label}</span>
        {showPulse && <div style={{ position: 'absolute', top: 4, right: 16, width: 9, height: 9, borderRadius: '50%', background: colors.amber, border: '1.5px solid #0d1829' }} />}
        {isExcel && newBadge && <div style={{ position: 'absolute', top: 2, right: 8, padding: '1px 5px', borderRadius: 3, background: colors.green, color: '#04240f', fontFamily: fonts.mono, fontSize: 8, fontWeight: 700 }}>NEW</div>}
        {isOpen && <div style={{ width: 4, height: 4, borderRadius: '50%', background: colors.cyan, marginTop: -2 }} />}
      </div>
    )
  }

  const clock = useClock()

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        backgroundColor: '#0a1326',
        // Windows 11 "Bloom"-style abstract wallpaper — layered soft glows (no copyrighted asset).
        backgroundImage: [
          'radial-gradient(58% 48% at 50% 47%, rgba(60,110,205,0.55) 0%, rgba(60,110,205,0) 70%)',
          'radial-gradient(42% 52% at 36% 40%, rgba(0,176,220,0.40) 0%, rgba(0,176,220,0) 70%)',
          'radial-gradient(46% 50% at 64% 56%, rgba(135,95,215,0.34) 0%, rgba(135,95,215,0) 72%)',
          'radial-gradient(36% 40% at 58% 30%, rgba(0,210,200,0.22) 0%, rgba(0,210,200,0) 70%)',
          'radial-gradient(130% 120% at 50% 64%, rgba(14,30,60,0) 35%, rgba(6,12,28,0.92) 100%)',
        ].join(','),
      }}>
        <div style={{ display: 'flex', gap: 4, padding: 18, position: 'absolute', top: 0, left: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{col0.map(renderIcon)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{col1.map(renderIcon)}</div>
        </div>
        {openApps.map(app => (<AppWindow key={app.id} app={app}><AppContent appName={app.appName} /></AppWindow>))}
        {active && <WindowsToast key={active.id} icon={active.icon} title={active.title} body={active.body} actionLabel={active.actionLabel} onAction={active.onAction} onDismiss={dismissToast} />}

        {/* Start menu */}
        {startOpen && (
          <>
            <div onClick={() => setStartOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 70 }} />
            <div style={{
              position: 'absolute', bottom: 10, left: 10, width: 300, zIndex: 71,
              background: 'rgba(32,38,52,0.96)', backdropFilter: 'blur(30px) saturate(125%)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 16,
              boxShadow: '0 14px 44px rgba(0,0,0,0.6)',
            }}>
              <div style={{ fontFamily: fonts.body, fontSize: 11, color: '#9aa6b6', marginBottom: 10, letterSpacing: '0.04em' }}>Pinned</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                {START_APPS.map(a => (
                  <div key={a.app}
                    onClick={() => { dispatch({ type: 'OPEN_APP', appName: a.app }); setStartOpen(false) }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 4px', borderRadius: 8, cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <a.Icon />
                    <span style={{ fontFamily: fonts.body, fontSize: 10, color: '#dfe6f0', textAlign: 'center', lineHeight: 1.2 }}>{a.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', fontFamily: fonts.mono, fontSize: 10, color: '#7e8aa0' }}>
                CyberSim Workstation
              </div>
            </div>
          </>
        )}
      </div>

      {/* Win11 taskbar */}
      <div style={{ height: 40, flexShrink: 0, background: 'rgba(10,14,22,0.98)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
        <div className="win-tasktip" title="Start" onClick={() => setStartOpen(o => !o)} style={{ background: startOpen ? 'rgba(255,255,255,0.12)' : undefined }}><IconWindows /></div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
          {openApps.map(a => {
            const Icon = APP_ICONS[a.appName]
            const isActive = a.zIndex === maxZ && !a.minimized
            return (
              <div key={a.id} className="win-tasktip" title={APP_LABELS[a.appName]} onClick={() => dispatch({ type: 'FOCUS_APP', id: a.id })} style={{ background: isActive ? 'rgba(255,255,255,0.1)' : undefined }}>
                <span style={{ transform: 'scale(0.62)', display: 'inline-flex' }}><Icon /></span>
                <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: isActive ? 14 : 5, height: 2.5, borderRadius: 2, background: isActive ? colors.cyan : 'rgba(255,255,255,0.4)', transition: 'width 150ms ease' }} />
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <div className="win-tray-btn"><IconWifi /></div>
          <div className="win-tray-btn"><IconVolume /></div>
          <div className="win-tray-btn" style={{ gap: 5 }} title="87%"><span style={{ fontFamily: fonts.mono, fontSize: 9, color: '#9aa6b6' }}>87%</span><IconBattery /></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.15, padding: '0 8px', fontFamily: fonts.body, color: '#cdd6e3' }}>
            <span style={{ fontSize: 11 }}>{clock.time}</span><span style={{ fontSize: 10, color: '#8b96a8' }}>{clock.date}</span>
          </div>
          <div className="win-tray-btn"><IconBell /></div>
        </div>
      </div>
    </div>
  )
}

function useClock() {
  const fmt = () => { const d = new Date(); return { time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), date: d.toLocaleDateString('en-GB') } }
  const [c, setC] = useState(fmt)
  useEffect(() => { const id = setInterval(() => setC(fmt()), 1000); return () => clearInterval(id) }, [])
  return c
}

// ─── End-of-session debrief ───────────────────────────────────────────────────
const SUB_LABELS: Record<PcSubAttackId, string> = {
  email_phish: 'Spear Phishing — Credential Reset', ceo_fraud: 'CEO Wire Fraud (BEC)', clickfix: 'Fake Chrome Update', macro_doc: 'LinkedIn Attachment Trap', fake_defender: 'Fake Defender Scareware',
}
const SUB_LEVER: Record<PcSubAttackId, string> = {
  email_phish: 'Authority + Urgency / Fear', ceo_fraud: 'Authority + Urgency + Secrecy', clickfix: 'Urgency + Browser trust', macro_doc: 'Curiosity + career opportunity', fake_defender: 'Fear / loss aversion',
}
const SUB_TELL: Record<PcSubAttackId, string> = {
  email_phish: 'Sender domain and Reply-To were not microsoft.com.', ceo_fraud: 'Near-miss domain + secrecy + extreme urgency.', clickfix: 'ChromeSetup.exe came from a non-Google domain.', macro_doc: 'Portfolio.pdf .exe was an application hiding behind a document name.', fake_defender: 'Real Defender is free and never asks for payment.',
}

function Debrief({ onExit }: { onExit: () => void }) {
  const attacks = usePcStore(s => s.attacks)
  // Terminal state — compute the breakdown non-reactively to avoid a new-object selector.
  const breakdown = usePcStore.getState().scoreBreakdown()
  const ids = Object.keys(SUB_LABELS) as PcSubAttackId[]
  const passed = ids.filter(id => attacks[id].status === 'passed').length

  // Decision speed vs the industry median time-to-click (~21s) — the most memorable stat.
  const MEDIAN_CLICK_S = 21
  const decided = ids.map(id => attacks[id].tDecisionMs).filter((t): t is number => t != null)
  const avgSecs = decided.length ? decided.reduce((a, b) => a + b, 0) / decided.length / 1000 : null

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 80, background: 'rgba(5,8,16,0.97)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, overflowY: 'auto' }}>
      <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.cyan, letterSpacing: '0.2em', marginBottom: 6 }}>WORKSTATION SECURED</div>
      <div style={{ fontFamily: fonts.display, fontSize: 24, fontWeight: 700, color: '#e5e7eb' }}>SESSION DEBRIEF</div>
      <div style={{ fontFamily: fonts.display, fontSize: 14, color: passed === ids.length ? colors.green : colors.amber, margin: '4px 0 8px' }}>
        {passed}/{ids.length} handled correctly · +{breakdown.total} pts
      </div>
      <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, marginBottom: 16, textAlign: 'center' }}>
        ⏱ Your avg decision: <span style={{ color: avgSecs != null && avgSecs < MEDIAN_CLICK_S ? colors.red : colors.green }}>{avgSecs != null ? `${avgSecs.toFixed(1)}s` : '—'}</span>
        {'  ·  '}industry median time-to-click: <span style={{ color: colors.amber }}>{MEDIAN_CLICK_S}s</span>
      </div>

      <div style={{ width: 'min(540px, 92%)', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        {ids.map(id => {
          const a = attacks[id]
          const ok = a.status === 'passed'
          return (
            <div key={id} style={{ padding: '9px 12px', borderRadius: 6, background: ok ? 'rgba(0,255,136,0.06)' : 'rgba(255,51,85,0.06)', border: `1px solid ${ok ? 'rgba(0,255,136,0.22)' : 'rgba(255,51,85,0.22)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: ok ? colors.green : colors.red, fontFamily: fonts.mono, fontSize: 13 }}>{ok ? '✓' : '✕'}</span>
                <span style={{ flex: 1, fontFamily: fonts.body, fontSize: 13, color: '#cdd6e3' }}>{SUB_LABELS[id]}</span>
                <span style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDim }}>{SUB_LEVER[id]}</span>
                {a.inspected.length > 0 && <span title="You inspected before deciding" style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.cyan }}>🔍</span>}
              </div>
              <div style={{ fontFamily: fonts.body, fontSize: 11.5, color: ok ? '#8fd9b6' : '#ffb3bf', marginTop: 4, marginLeft: 23, lineHeight: 1.5 }}>
                The tell: {SUB_TELL[id]}
                {a.tDecisionMs != null && (() => {
                  const secs = a.tDecisionMs / 1000
                  if (!ok && secs < MEDIAN_CLICK_S) return <span style={{ color: colors.red }}> · ⚡ {secs.toFixed(1)}s — under the {MEDIAN_CLICK_S}s median; urgency beat verification</span>
                  if (a.inspected.length > 0)        return <span style={{ color: colors.cyan }}> · 🔍 inspected, then decided in {secs.toFixed(1)}s</span>
                  return <span style={{ color: colors.textDim }}> · decided in {secs.toFixed(1)}s</span>
                })()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Score breakdown */}
      <div style={{ width: 'min(540px, 92%)', fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, display: 'flex', flexWrap: 'wrap', gap: '4px 16px', justifyContent: 'center', marginBottom: 18 }}>
        <span>base +{breakdown.base}</span>
        <span style={{ color: colors.cyan }}>inspection +{breakdown.inspectionBonus}</span>
        {breakdown.recklessPenalty > 0 && <span style={{ color: colors.red }}>reckless −{breakdown.recklessPenalty}</span>}
        {breakdown.fpPenalty > 0 && <span style={{ color: colors.amber }}>false-positive −{breakdown.fpPenalty}</span>}
        <span style={{ color: '#e5e7eb' }}>= {breakdown.total}</span>
      </div>

      <button onClick={onExit} style={{ padding: '12px 28px', borderRadius: 8, cursor: 'pointer', background: colors.cyan, border: 'none', color: colors.bgBase, fontFamily: fonts.display, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em' }}>[ EXIT WORKSTATION ]</button>
    </div>
  )
}

// ─── WindowsOS (outer modal) ──────────────────────────────────────────────────
export default function WindowsOS() {
  const closeOS     = useGameStore(s => s.closeOS)
  const activePoint = useGameStore(s => s.activePoint)
  const userName    = useAuthStore(s => s.userName)
  const isPcSession = activePoint === 1

  const resolvedCount = usePcStore(s => s.resolvedCount())
  const allResolvedRaw = usePcStore(s => s.allResolved())
  const allResolved   = isPcSession && allResolvedRaw

  const [isExiting, setIsExiting] = useState(false)
  const [outerMin, setOuterMin]   = useState(false)
  const [outerMax, setOuterMax]   = useState(false)
  const [sessionSecs, setSessionSecs] = useState(0)
  const clock = useClock()

  const employeeName = useMemo(() => {
    const first = (userName ?? '').trim().split(/\s+/)[0] || 'Agent'
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
  }, [userName])

  // Title reflects which station is open — only the player's own PC gets "— NAME'S PC".
  const stationName = (ATTACK_POINTS.find(a => a.id === activePoint)?.displayName ?? 'Workstation').toUpperCase()
  const titleText = `CYBERSIM // ${stationName}${isPcSession ? ` — ${employeeName}'S PC` : ''}`

  useEffect(() => {
    if (!isPcSession) return
    usePcStore.getState().startSession()
    setSessionSecs(0)
    const id = setInterval(() => setSessionSecs(s => s + 1), 1000)
    return () => { clearInterval(id); usePcStore.getState().resetSession() }
  }, [isPcSession])

  const handleClose = () => { setIsExiting(true); setTimeout(() => { closeOS(); setIsExiting(false) }, 220) }

  const handleExitWorkstation = () => {
    const pc = usePcStore.getState()
    // Capture per-sub-attack outcomes for Org Admin analytics before the session resets.
    const results = PC_ATTACK_IDS.map(id => ({ id, label: SUB_LABELS[id], passed: pc.attacks[id].status === 'passed' }))
    const total = pc.scoreBreakdown().total
    const game = useGameStore.getState()
    game.setPcSubAttackResults(results)
    game.completePoint(1, total)
    game.exitToScene()
    useCameraStore.getState().restoreInitial()
    pc.resetSession()
  }

  const modalWidth  = outerMax ? '90vw' : 920
  const modalHeight = 580
  const sessionTimer = `${String(Math.floor(sessionSecs / 60)).padStart(2, '0')}:${String(sessionSecs % 60).padStart(2, '0')}`
  const progressRatio = isPcSession ? resolvedCount / 5 : 0

  if (outerMin) {
    return (
      <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
        <div onClick={() => setOuterMin(false)} style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 200, cursor: 'pointer', background: 'rgba(6,10,18,0.98)', border: '1px solid rgba(76,194,255,0.2)', borderRadius: 8, padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
          <span style={{ fontFamily: fonts.display, fontSize: 10, color: colors.cyan, letterSpacing: '0.12em' }}>CYBERSIM // {stationName}</span>
          <span style={{ fontFamily: fonts.mono, fontSize: 11, color: 'rgba(76,194,255,0.6)' }}>{clock.time}</span>
        </div>
      </>
    )
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', zIndex: 199 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 200 }}>
        <div className={isExiting ? 'win-outer-exit' : 'win-outer-enter'}
          style={{ width: modalWidth, height: modalHeight, background: '#0a0c14', border: '1px solid rgba(76,194,255,0.2)', borderRadius: 10, overflow: 'hidden', boxShadow: ['0 0 0 1px rgba(76,194,255,0.06)', '0 32px 80px rgba(0,0,0,0.85)'].join(', '), display: 'flex', flexDirection: 'column', position: 'relative' }}
          onPointerDown={e => e.stopPropagation()}>
          {isPcSession && (
            <div style={{ height: 3, flexShrink: 0, background: 'rgba(255,255,255,0.06)' }}>
              <div style={{ height: '100%', width: `${progressRatio * 100}%`, background: `linear-gradient(90deg, ${colors.red}, ${colors.amber}, ${colors.green})`, transition: 'width 500ms cubic-bezier(0.16,1,0.3,1)' }} />
            </div>
          )}

          <div style={{ height: 38, flexShrink: 0, background: 'linear-gradient(180deg, #111827 0%, #0d1117 100%)', borderBottom: '1px solid rgba(76,194,255,0.1)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <div onClick={handleClose} title="Close" style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', cursor: 'pointer' }} />
              <div onClick={() => setOuterMin(true)} title="Minimize" style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e', cursor: 'pointer' }} />
              <div onClick={() => setOuterMax(m => !m)} title="Maximize" style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840', cursor: 'pointer' }} />
            </div>
            <span style={{ flex: 1, textAlign: 'center', fontFamily: fonts.display, fontSize: 10, color: 'rgba(76,194,255,0.65)', letterSpacing: '2.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {titleText}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: fonts.mono, fontSize: 11, color: 'rgba(76,194,255,0.6)' }}>[ {clock.time} ]</span>
              {isPcSession && <span style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.amber }} title="Time in session">⏱ {sessionTimer}</span>}
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            <WindowsProvider><Desktop isPcSession={isPcSession} /></WindowsProvider>
            {allResolved && <Debrief onExit={handleExitWorkstation} />}
          </div>
        </div>
      </div>
    </>
  )
}
