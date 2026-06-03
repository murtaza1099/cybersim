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
  `
  document.head.appendChild(s)
}

function unlockState(id: number, completed: number[], current: number): 'completed' | 'current' | 'locked' {
  if (completed.includes(id)) return 'completed'
  if (id === current) return 'current'
  return 'locked'
}

interface Props {
  id: number
  displayName: string
  tag: string
  label: string
  position: THREE.Vector3
}

const AnnotationPoint = memo(function AnnotationPoint({ id, displayName, tag, label, position }: Props) {
  const currentPointId  = useGameStore(s => s.currentPointId)
  const completedPoints = useGameStore(s => s.completedPoints)
  const startPoint      = useGameStore(s => s.startPoint)
  const activeLayer     = useGameStore(s => s.activeLayer)
  const prevPointId = useRef(currentPointId)
  const [isUnlocking, setIsUnlocking] = useState(false)

  const state = unlockState(id, completedPoints, currentPointId)
  const uiBlocked = activeLayer !== 'scene' && activeLayer !== 'complete'
  // Far-future locked points are dimmer but still visible so user can see where attacks are
  const farFuture = state === 'locked' && id > currentPointId + 2

  // Trigger unlock animation when this point transitions to 'current' state
  useEffect(() => {
    if (state === 'current' && prevPointId.current !== currentPointId) {
      setIsUnlocking(true)
      setTimeout(() => { setIsUnlocking(false) }, 1200)
    }
    prevPointId.current = currentPointId
  }, [currentPointId, state])

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
      ? { background: '#0a0e14', border: '2px solid #00f0ff', color: '#00f0ff', animation: 'glowPulse 2s ease-in-out infinite' }
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
      <div style={{ position: 'relative', display: uiBlocked ? 'none' : 'block', pointerEvents: state === 'locked' ? 'none' : 'auto' }} className={state === 'current' ? 'ap-fadein' : ''}>
        <div style={{ position: 'relative', display: 'inline-block' }} onClick={handleClick}>
          <div style={bubble} className={isUnlocking ? 'ap-unlocking' : ''}>
            {id}
          </div>
          {state === 'current' && (
            <div style={tooltip}>{displayName}</div>
          )}
        </div>
        <div style={line} />
      </div>
    </Html>
  )
})

export default AnnotationPoint
