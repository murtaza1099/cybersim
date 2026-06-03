import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useGameStore } from '../../stores/gameStore'

if (typeof document !== 'undefined' && !document.getElementById('score-toast-kf')) {
  const s = document.createElement('style')
  s.id = 'score-toast-kf'
  s.textContent = `
    @keyframes scorePop {
      0%   { opacity:0; transform: translateX(-50%) translateY(-12px) scale(0.9); }
      20%  { opacity:1; transform: translateX(-50%) translateY(0px)   scale(1.02); }
      80%  { opacity:1; transform: translateX(-50%) translateY(0px)   scale(1); }
      100% { opacity:0; transform: translateX(-50%) translateY(-8px)  scale(0.97); }
    }
    .score-toast-pop { animation: scorePop 1600ms ease forwards; }
  `
  document.head.appendChild(s)
}

interface ToastEntry { id: number; delta: number }

export default function ScoreToast() {
  const score = useGameStore(s => s.score)
  const prevRef = useRef(score)
  const [toasts, setToasts] = useState<ToastEntry[]>([])

  useEffect(() => {
    const prev = prevRef.current
    prevRef.current = score
    const delta = score - prev
    if (delta === 0) return
    const id = Date.now()
    setToasts(t => [...t, { id, delta }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 1700)
  }, [score])

  if (toasts.length === 0) return null

  return createPortal(
    <>
      {toasts.map((toast, i) => {
        const isPos = toast.delta > 0
        const label = isPos
          ? `✓  +${toast.delta} PTS`
          : `✗  −10 PTS`
        return (
          <div
            key={toast.id}
            className="score-toast-pop"
            style={{
              position: 'fixed',
              top: `calc(20% + ${i * 68}px)`,
              left: '50%',
              zIndex: 9999,
              pointerEvents: 'none',
              background: isPos ? 'rgba(0,20,12,0.95)' : 'rgba(20,4,8,0.95)',
              border: `1px solid ${isPos ? '#00ff88' : '#ff3355'}`,
              color: isPos ? '#00ff88' : '#ff6677',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.1em',
              padding: '12px 28px',
              borderRadius: 8,
              boxShadow: isPos
                ? '0 0 30px rgba(0,255,136,0.3)'
                : '0 0 30px rgba(255,51,85,0.3)',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </div>
        )
      })}
    </>,
    document.body
  )
}
