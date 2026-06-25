import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../stores/gameStore'

// Inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('ap-kf')) {
  const s = document.createElement('style')
  s.id = 'ap-kf'
  s.textContent = `
    @keyframes glowPulse {
      0%,100% { box-shadow: 0 0 8px #00f0ff55, 0 0 16px #00f0ff33; }
      50%      { box-shadow: 0 0 16px #00f0ffaa, 0 0 32px #00f0ff66; }
    }
    /* Active hotspot — stronger, faster pulse so it draws the eye */
    @keyframes glowPulseStrong {
      0%,100% { box-shadow: 0 0 12px #00f0ff88, 0 0 24px #00f0ff44; }
      50%      { box-shadow: 0 0 24px #00f0ffdd, 0 0 44px #00f0ff88; }
    }
    /* Brief "you are here" cue fired on a locked click */
    @keyframes apLocateGlow {
      0%,100% { box-shadow: 0 0 18px #00f0ffcc, 0 0 36px #00f0ff77; }
      50%      { box-shadow: 0 0 34px #00f0ffff, 0 0 64px #00f0ffaa; }
    }
    @keyframes apLocateRing {
      0%   { transform: scale(0.7); opacity: 0.9; }
      100% { transform: scale(2.6); opacity: 0; }
    }
    @keyframes apHereBob {
      0%,100% { transform: translateX(-50%) translateY(0);    opacity: 0.7; }
      50%      { transform: translateX(-50%) translateY(-3px); opacity: 1; }
    }
    .ap-locating    { animation: apLocateGlow 0.7s ease-in-out infinite !important; }
    .ap-locate-ring { position:absolute; left:0; top:0; width:36px; height:36px; border-radius:50%; border:2px solid #00f0ff; pointer-events:none; animation: apLocateRing 1s ease-out infinite; }
    .ap-here        { position:absolute; bottom:140%; left:50%; color:#00f0ff; font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:0.15em; text-shadow:0 0 8px #00f0ff; pointer-events:none; white-space:nowrap; animation: apHereBob 0.8s ease-in-out infinite; }
    @keyframes unlockFlash {
      0%   { box-shadow: 0 0 0px #00f0ff; }
      20%  { box-shadow: 0 0 24px #00f0ffcc; }
      40%  { box-shadow: 0 0 4px #00f0ff44; }
      60%  { box-shadow: 0 0 20px #00f0ffaa; }
      80%  { box-shadow: 0 0 4px #00f0ff44; }
      100% { box-shadow: 0 0 14px #00f0ff66; }
    }
    @keyframes apFadeIn { from { opacity:0; } to { opacity:1; } }
    .ap-fadein { animation: apFadeIn 0.4s ease forwards; }
    .ap-unlocking { animation: unlockFlash 1.2s ease-in-out forwards; }
    /* displayName tooltip — hover only, never persistent (no attack spoilers) */
    .ap-tooltip { opacity: 0; transition: opacity 180ms ease; }
    .ap-marker:hover .ap-tooltip { opacity: 1; }
  `
  document.head.appendChild(s)
}

// Strict sequential: hotspots unlock one at a time, in order.
function unlockState(id: number, completed: number[], current: number): 'completed' | 'current' | 'locked' {
  if (completed.includes(id)) return 'completed'
  if (id === current) return 'current'
  return 'locked'
}

interface Props {
  id: number
  displayNumber: number   // sequential label shown on the marker (1..N)
  position: THREE.Vector3
}

const AnnotationPoint = memo(function AnnotationPoint({ id, displayNumber, position }: Props) {
  const currentPointId  = useGameStore(s => s.currentPointId)
  const completedPoints = useGameStore(s => s.completedPoints)
  const startPoint      = useGameStore(s => s.startPoint)
  const activeLayer     = useGameStore(s => s.activeLayer)
  const lockedToastVisible = useGameStore(s => s.lockedToastVisible)
  const prevPointId = useRef(currentPointId)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [locate, setLocate] = useState(false)
  const prevLocked = useRef(lockedToastVisible)

  const state = unlockState(id, completedPoints, currentPointId)
  const uiBlocked = activeLayer !== 'scene' && activeLayer !== 'complete'
  // Far-future locked points are dimmer but still visible so user can see where attacks are
  const farFuture = state === 'locked' && id > currentPointId + 2

  // Entry animation: fade + scale-pop shortly after mount. Each marker mounts as
  // the post-sweep staggered reveal advances, so this drives the staggered pop-in.
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  // Trigger unlock animation when this point transitions to 'current' state
  useEffect(() => {
    if (state === 'current' && prevPointId.current !== currentPointId) {
      setIsUnlocking(true)
      setTimeout(() => { setIsUnlocking(false) }, 1200)
    }
    prevPointId.current = currentPointId
  }, [currentPointId, state])

  // On a locked click, the active hotspot flashes a 2s "here" cue (radial ring +
  // arrow + intensified glow) so the player's eye is drawn to the right step.
  useEffect(() => {
    const rising = lockedToastVisible && !prevLocked.current
    prevLocked.current = lockedToastVisible
    if (rising && state === 'current') {
      setLocate(true)
      const t = setTimeout(() => setLocate(false), 2000)
      return () => clearTimeout(t)
    }
  }, [lockedToastVisible, state])

  const handleClick = useCallback(() => {
    if (!uiBlocked) startPoint(id)
  }, [id, startPoint, uiBlocked])

  const bubble: React.CSSProperties = {
    width: 36, height: 36, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13,
    cursor: state === 'locked' || uiBlocked ? 'default' : 'pointer',
    userSelect: 'none',
    opacity: farFuture ? 0.25 : 1,
    transition: 'background 400ms ease, border-color 400ms ease, opacity 400ms ease',
    ...(state === 'current'
      ? { background: '#0a0e14', border: '2px solid #00f0ff', color: '#00f0ff', boxShadow: '0 0 12px #00f0ff88, 0 0 24px #00f0ff44', animation: 'glowPulseStrong 0.55s ease-in-out 3' }
      : state === 'completed'
      ? { background: '#001a12', border: '1px solid #00ff88', color: '#00ff88' }
      : { background: '#0d1117', border: '1px solid #3a3f4a', color: '#3a3f4a', opacity: farFuture ? 0.2 : 0.5 }),
  }

  const line: React.CSSProperties = {
    width: 1, height: 44, margin: '0 auto',
    borderLeft: `1px dashed ${state === 'current' ? '#00f0ff66' : state === 'completed' ? '#00ff8844' : '#3a3f4a22'}`,
    opacity: farFuture ? 0.3 : 1,
    transition: 'border-color 400ms ease, opacity 400ms ease',
  }

  const tooltip: React.CSSProperties = {
    position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
    whiteSpace: 'nowrap', padding: '4px 10px', borderRadius: 4,
    background: 'rgba(5,8,16,0.92)', border: '1px solid #00f0ff33',
    color: '#00f0ff', fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
    pointerEvents: 'none',
  }

  return (
    <Html
      position={[position.x, position.y + 0.35, position.z]}
      transform={false}
      occlude={false}
      zIndexRange={[100 + id * 10, id * 10]}
    >
      <div
        style={{
          position: 'relative',
          display: uiBlocked ? 'none' : 'block',
          pointerEvents: state === 'locked' ? 'none' : 'auto',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.6)',
          transition: 'opacity 400ms ease, transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div className="ap-marker" style={{ position: 'relative', display: 'inline-block' }} onClick={handleClick}>
          {locate && <span className="ap-locate-ring" />}
          <div style={bubble} className={isUnlocking ? 'ap-unlocking' : locate ? 'ap-locating' : ''}>
            {displayNumber}
          </div>
          {locate && <div className="ap-here">▾ HERE</div>}
          {/* Neutral prompt only — never the location or the attack type (no spoilers) */}
          {state !== 'locked' && (
            <div className="ap-tooltip" style={tooltip}>{state === 'completed' ? '✓ REVIEW' : '▸ INSPECT'}</div>
          )}
        </div>
        <div style={line} />
      </div>
    </Html>
  )
})

export default AnnotationPoint
