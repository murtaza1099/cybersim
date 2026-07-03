import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
  message: string
}

/**
 * Error boundary for the Level 1 simulation. Any throw in the 3D scene tree —
 * including a GLTF/draco asset load or decode failure (useGLTF throws rather
 * than suspends when a fetch/parse fails) or a lost WebGL context — used to
 * propagate to the React root and unmount the whole app to a white screen.
 * This catches it, ALWAYS logs the real error + component stack to the console,
 * and shows a visible, on-theme fallback with a reload action instead of a
 * silent blank. Inline styles are used so the fallback renders even if styling
 * or a chunk failed to load.
 */
export class SceneErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    // Never silently blank — surface the actual error and component stack.
    console.error('[Level1] Simulation crashed:', error, '\nComponent stack:', info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        role="alert"
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#050810',
          backgroundImage:
            'linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: 24,
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '0.28em', color: '#00e5ff', marginBottom: 14 }}>
          // SIMULATION ERROR
        </div>
        <div style={{ fontFamily: "'Orbitron', 'DM Sans', sans-serif", fontSize: 26, fontWeight: 800, color: '#e5e7eb', marginBottom: 10 }}>
          Simulation failed to load
        </div>
        <div style={{ fontSize: 14, color: '#9ca3af', maxWidth: 460, lineHeight: 1.6, marginBottom: 10 }}>
          Something went wrong while starting the 3D environment. Your training progress is safe — reload to try again.
        </div>
        {this.state.message && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#6b7280', maxWidth: 560, marginBottom: 24, wordBreak: 'break-word' }}>
            {this.state.message}
          </div>
        )}
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 28px', borderRadius: 8, cursor: 'pointer',
            background: '#00e5ff', border: 'none', color: '#050810',
            fontFamily: "'Orbitron', 'DM Sans', sans-serif", fontSize: 12, fontWeight: 800, letterSpacing: '0.08em',
          }}
        >
          RELOAD SIMULATION
        </button>
      </div>
    )
  }
}
