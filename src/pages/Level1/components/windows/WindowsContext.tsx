import { createContext, useContext, useReducer, useEffect, useState, type ReactNode, type Dispatch } from 'react'
import type { OpenApp, WindowsAction } from '../../types'

interface WinState { openApps: OpenApp[]; clock: string }
interface WinCtx   { openApps: OpenApp[]; clock: string; dispatch: Dispatch<WindowsAction> }

const Ctx = createContext<WinCtx | null>(null)

function clock(): string {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function reducer(apps: OpenApp[], action: WindowsAction): OpenApp[] {
  const maxZ = apps.reduce((m, a) => Math.max(m, a.zIndex), 0)
  switch (action.type) {
    case 'OPEN_APP': {
      const ex = apps.find(a => a.appName === action.appName)
      if (ex) return apps.map(a => a.id === ex.id ? { ...a, minimized: false, zIndex: maxZ + 1 } : a)
      return [...apps, { id: String(Date.now()), appName: action.appName, minimized: false, maximized: false, zIndex: maxZ + 1 }]
    }
    case 'CLOSE_APP':    return apps.filter(a => a.id !== action.id)
    case 'FOCUS_APP':    return apps.map(a => a.id === action.id ? { ...a, zIndex: maxZ + 1, minimized: false } : a)
    case 'MINIMIZE':     return apps.map(a => a.id === action.id ? { ...a, minimized: !a.minimized } : a)
    case 'MAXIMIZE':     return apps.map(a => a.id === action.id ? { ...a, maximized: !a.maximized } : a)
    default:             return apps
  }
}

export function WindowsProvider({ children }: { children: ReactNode }) {
  const [openApps, dispatch] = useReducer(reducer, [])
  const [time, setTime]      = useState(clock)

  useEffect(() => {
    const id = setInterval(() => setTime(clock()), 1000)
    return () => clearInterval(id)
  }, [])

  return <Ctx.Provider value={{ openApps, clock: time, dispatch }}>{children}</Ctx.Provider>
}

export function useWindowsCtx() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useWindowsCtx outside WindowsProvider')
  return ctx
}
