import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { ATTACK_POINTS } from '../../config/attacks'

// One-time keyframes for the avatar pulse
if (typeof document !== 'undefined' && !document.getElementById('aria-kf')) {
  const s = document.createElement('style')
  s.id = 'aria-kf'
  s.textContent = `
    @keyframes ariaPulse { 0%,100% { box-shadow: 0 0 8px #00f0ff55; } 50% { box-shadow: 0 0 18px #00f0ffaa; } }
  `
  document.head.appendChild(s)
}

const ARIA_LINES: Record<string, string> = {
  intro_done:       "Take your time. Look for anything that feels out of place.",
  point_1_active:   "Something arrived in your inbox. Check the main workstation.",
  point_2_active:   "John's screen has a popup waiting. Worth a look.",
  point_3_active:   "The designer's PC has a new LinkedIn message open.",
  point_4_active:   "Your phone just buzzed. A message from your bank.",
  point_5_active:   "The landline is ringing. IT Support, it says.",
  point_6_active:   "You found something in the washroom. Be careful.",
  point_7_active:   "Someone's at the door with a delivery.",
  point_8_active:   "Something's running on the admin workstation. This looks serious.",
  correct:          "Good instinct. That's exactly how attackers operate.",
  wrong:            "It happens. Social engineering is designed to feel normal.",
  locked_attempt:   "Finish what's in front of you first.",
  idle_20s:         "Something in this room is waiting for your attention.",
  all_complete:     "You've identified every threat. That's impressive situational awareness.",
}

interface Props {
  introComplete: boolean
}

export default function GuideCharacter({ introComplete }: Props) {
  const currentPointId     = useGameStore(s => s.currentPointId)
  const completedPoints    = useGameStore(s => s.completedPoints)
  const failedPoints       = useGameStore(s => s.failedPoints)
  const lockedToastVisible = useGameStore(s => s.lockedToastVisible)
  const activeLayer        = useGameStore(s => s.activeLayer)
  const allComplete = ATTACK_POINTS.every(a => completedPoints.includes(a.id) || failedPoints.includes(a.id))

  const [message, setMessage] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>()

  // Speak a line; new lines interrupt old ones and reset the 4s display timer.
  const speak = useCallback((key: string) => {
    const line = ARIA_LINES[key]
    if (!line) return
    setMessage(line)
    setVisible(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setVisible(false), 4000)
  }, [])

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current) }, [])

  // intro_done — fires once the intro overlay is dismissed
  useEffect(() => {
    if (introComplete) speak('intro_done')
  }, [introComplete, speak])

  // point_N_active — when the objective advances, after a 1200ms beat
  const prevPoint = useRef(currentPointId)
  useEffect(() => {
    if (currentPointId === prevPoint.current) return
    prevPoint.current = currentPointId
    const key = `point_${currentPointId}_active`
    if (!ARIA_LINES[key]) return
    const t = setTimeout(() => speak(key), 1200)
    return () => clearTimeout(t)
  }, [currentPointId, speak])

  // correct — a point was just completed
  const prevCompleted = useRef(completedPoints.length)
  useEffect(() => {
    if (completedPoints.length > prevCompleted.current) speak('correct')
    prevCompleted.current = completedPoints.length
  }, [completedPoints, speak])

  // wrong — a point was just failed
  const prevFailed = useRef(failedPoints.length)
  useEffect(() => {
    if (failedPoints.length > prevFailed.current) speak('wrong')
    prevFailed.current = failedPoints.length
  }, [failedPoints, speak])

  // locked_attempt — player tried an out-of-order hotspot
  useEffect(() => {
    if (lockedToastVisible) speak('locked_attempt')
  }, [lockedToastVisible, speak])

  // idle_20s — only nag while freely exploring the scene; reset on interaction
  useEffect(() => {
    if (activeLayer !== 'scene') return
    let timer: ReturnType<typeof setTimeout>
    const arm = () => { timer = setTimeout(() => { speak('idle_20s'); arm() }, 20000) }
    const reset = () => { clearTimeout(timer); arm() }
    reset()
    window.addEventListener('click', reset)
    window.addEventListener('keydown', reset)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('click', reset)
      window.removeEventListener('keydown', reset)
    }
  }, [activeLayer, speak])

  // all_complete — every threat resolved (kept last so it wins over `correct`)
  const prevAll = useRef(allComplete)
  useEffect(() => {
    if (allComplete && !prevAll.current) speak('all_complete')
    prevAll.current = allComplete
  }, [allComplete, speak])

  return (
    <div style={{
      position: 'fixed', left: 20, bottom: 20, zIndex: 185,
      display: 'flex', alignItems: 'flex-end', gap: 12,
      pointerEvents: 'none',
    }}>
      {/* Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '2px solid #00f0ff', background: '#0a0e14',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, animation: 'ariaPulse 2.6s ease-in-out infinite',
        }}>
          🛡
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#00f0ff',
          letterSpacing: '0.18em',
        }}>
          ARIA
        </div>
      </div>

      {/* Speech bubble */}
      <div style={{
        position: 'relative', maxWidth: 260, marginBottom: 16,
        background: 'rgba(8,12,20,0.95)', backdropFilter: 'blur(8px)',
        border: '1px solid #00f0ff33', borderRadius: 10,
        padding: '10px 14px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-6px)',
        transition: 'opacity 300ms ease, transform 300ms ease',
      }}>
        {/* left-pointing notch */}
        <div style={{
          position: 'absolute', left: -7, top: 18, width: 0, height: 0,
          borderTop: '7px solid transparent', borderBottom: '7px solid transparent',
          borderRight: '8px solid rgba(8,12,20,0.95)',
        }} />
        <div style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: '#00f0ff99',
          letterSpacing: '0.14em', marginBottom: 4,
        }}>
          ARIA · SECURITY AI
        </div>
        <div style={{
          fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: '#e5e7eb', lineHeight: 1.5,
        }}>
          {message}
        </div>
      </div>
    </div>
  )
}
