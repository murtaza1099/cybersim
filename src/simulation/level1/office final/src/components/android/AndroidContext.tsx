import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react'
import type { AndroidAction } from '../../types'

interface AndroidState { history: string[] }
interface AndroidCtx   { history: string[]; dispatch: Dispatch<AndroidAction> }

const Ctx = createContext<AndroidCtx | null>(null)

function reducer(state: AndroidState, action: AndroidAction): AndroidState {
  switch (action.type) {
    case 'OPEN': return { history: [...state.history, action.screen] }
    case 'BACK': return { history: state.history.slice(0, -1) }
    case 'HOME': return { history: [] }
    default:     return state
  }
}

interface ProviderProps {
  children: ReactNode
  // Synchronously pre-open this screen on mount (no useEffect timing issues)
  initialScreen?: string | null
}

export function AndroidProvider({ children, initialScreen }: ProviderProps) {
  const [state, dispatch] = useReducer(
    reducer,
    { history: initialScreen ? [initialScreen] : [] }
  )
  return <Ctx.Provider value={{ history: state.history, dispatch }}>{children}</Ctx.Provider>
}

export function useAndroidCtx() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAndroidCtx outside AndroidProvider')
  return ctx
}

export function currentScreen(history: string[]): string {
  return history[history.length - 1] ?? 'home'
}
