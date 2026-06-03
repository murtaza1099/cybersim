import { useEffect, useState } from 'react'

// One-time keyframes for the logo glow
if (typeof document !== 'undefined' && !document.getElementById('loader-kf')) {
  const s = document.createElement('style')
  s.id = 'loader-kf'
  s.textContent = `
    @keyframes loaderLogoGlow {
      0%,100% { text-shadow: 0 0 12px #00f0ff66; }
      50%      { text-shadow: 0 0 22px #00f0ffcc; }
    }
  `
  document.head.appendChild(s)
}

interface Props {
  /** True once the 3D scene's first frame has rendered. */
  ready: boolean
}

/**
 * Fullscreen loading overlay shown while the office GLBs load. Rendered inside
 * the Canvas's wrapping div (NOT inside the Three.js scene). The progress bar is
 * intentionally fake — it climbs to 85% over ~2s to build suspense, then jumps to
 * 100% the moment `ready` flips true, at which point the overlay fades out.
 */
export default function SceneLoader({ ready }: Props) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (ready) { setProgress(100); return }
    const start = performance.now()
    let raf: number
    const tick = () => {
      const t = Math.min((performance.now() - start) / 2000, 1)
      setProgress(Math.round(85 * t))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [ready])

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 190,
      background: '#0f1318',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 18,
      opacity: ready ? 0 : 1,
      transition: 'opacity 600ms ease',
      pointerEvents: ready ? 'none' : 'auto',
    }}>
      <div style={{
        fontFamily: "'Orbitron',sans-serif", fontSize: 28, fontWeight: 700,
        color: '#00f0ff', letterSpacing: '0.18em',
        animation: 'loaderLogoGlow 2.2s ease-in-out infinite',
      }}>
        CyberSim
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#6c7280', letterSpacing: '0.22em' }}>
        INITIALISING SIMULATION...
      </div>

      {/* Fake progress bar */}
      <div style={{ width: 280, maxWidth: '70vw', height: 4, background: '#1a1f2e', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: 'linear-gradient(90deg, #00f0ff, #00ff88)',
          boxShadow: '0 0 8px #00f0ff88',
          transition: 'width 200ms ease',
        }} />
      </div>

      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#3a4150', letterSpacing: '0.2em' }}>
        LOADING OFFICE ENVIRONMENT
      </div>
    </div>
  )
}
