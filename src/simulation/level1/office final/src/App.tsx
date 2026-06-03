import { Suspense, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { CameraControls, useGLTF, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'

import { PROP_POSITIONS as P }   from './config/propPositions'
import { ANCHORS }               from './config/anchors'
import type { AnchorKey }        from './config/anchors'
import { ATTACK_POINTS }         from './config/attacks'
import { useGameStore }          from './stores/gameStore'
import { useCameraStore }        from './stores/cameraStore'
import { useAudioStore }         from './stores/audioStore'
import AnnotationPoint           from './components/AnnotationPoint'
import AttackPanel               from './components/AttackPanel'
import ScoreToast                from './components/hud/ScoreToast'
import WindowsOS                 from './components/windows/WindowsOS'
import AndroidOS                 from './components/android/AndroidOS'
import ScoreHUD                  from './components/hud/ScoreHUD'
import BackButton                from './components/hud/BackButton'
import LockedToast               from './components/hud/LockedToast'
import SessionResumeToast        from './components/hud/SessionResumeToast'
import SubtitleBar               from './components/hud/SubtitleBar'
import CompletionScreen          from './components/CompletionScreen'
import ScenarioFeedbackModal     from './components/game/ScenarioFeedbackModal'
import CenteredOverlay           from './components/ui/CenteredOverlay'

// ─── Delivery dialogue (ATK_007) ─────────────────────────────────────────────
function DeliveryCard({ onDone }: { onDone: () => void }) {
  const [stage, setStage]             = useState<'arrive' | 'request' | 'consequence' | 'left'>('arrive')
  const [consequence, setConsequence] = useState('')
  const completePoint = useGameStore(s => s.completePoint)
  const failAttempt   = useGameStore(s => s.failAttempt)

  const handleSign = () => {
    useAudioStore.getState().playSound('ui_click')
    setStage('request')
  }

  const handleLetIn = () => {
    failAttempt(7, 'let_in_stranger')
    setConsequence(
      "You allowed an unverified person into your server room.\n\nThe DHL uniform was purchased online for £40. The 'compatibility check' was cover for installing a network tap.\n\nAlways verify with reception/security BEFORE allowing access to sensitive areas. A real delivery person never needs server room access."
    )
    setStage('consequence')
  }

  const handleSecurity = () => {
    setStage('left')
    setTimeout(() => {
      completePoint(7, 150)
      useCameraStore.getState().restoreInitial()
      onDone()
    }, 1800)
  }

  const handleUnderstood = () => {
    useGameStore.getState().exitToScene()
    useCameraStore.getState().restoreInitial()
  }

  const cardStyle: React.CSSProperties = {
    width: 320, background: 'rgba(6,10,18,0.97)', backdropFilter: 'blur(14px)',
    border: '1px solid #3a3f4a', borderRadius: 10, padding: '20px 22px',
    fontFamily: "'DM Sans',sans-serif",
  }

  if (stage === 'consequence') {
    return (
      <div style={{ ...cardStyle, border: '1px solid #ff335566' }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, color: '#ff3355', fontWeight: 700, marginBottom: 14, letterSpacing: '0.1em', textAlign: 'center' }}>
          −10 PTS
        </div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#ff335588', letterSpacing: '0.15em', marginBottom: 12, textAlign: 'center' }}>
          SECURITY FAILURE
        </div>
        <div style={{ fontSize: 13, color: '#ff8899', lineHeight: 1.75, marginBottom: 18, whiteSpace: 'pre-line' }}>
          {consequence}
        </div>
        <button onClick={handleUnderstood} style={{
          width: '100%', padding: '9px 0', borderRadius: 6, background: 'transparent',
          border: '1px solid #ff3355', color: '#ff6688',
          fontFamily: "'Orbitron',sans-serif", fontSize: 10, cursor: 'pointer',
        }}>RETURN TO OFFICE</button>
      </div>
    )
  }

  if (stage === 'left') {
    return (
      <div style={cardStyle}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#00ff88', textAlign: 'center', lineHeight: 1.8 }}>
          ✓ Correct! +150 pts<br />
          <span style={{ fontSize: 11, color: '#00cc66' }}>
            Courier has left. Legitimate couriers deliver to reception.<br />
            They never need access to server rooms or network equipment.
          </span>
        </div>
      </div>
    )
  }

  if (stage === 'arrive') {
    return (
      <div style={cardStyle}>
        {/* DHL-style header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '8px 12px', background: '#d40511', borderRadius: 6 }}>
          <div style={{ fontFamily: 'system-ui', fontSize: 16, fontWeight: 900, color: '#ffcc00', letterSpacing: '0.08em' }}>DHL</div>
          <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'white', opacity: 0.9 }}>Express Delivery</div>
        </div>
        <div style={{ fontSize: 14, color: '#e5e7eb', fontWeight: 600, marginBottom: 6 }}>Delivery for this address</div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
          ATTN: IT Department
        </div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#6c7280', marginBottom: 16 }}>
          Server Components — Handle with care
        </div>
        <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.65, margin: '0 0 18px' }}>
          "DHL Express, delivery for the office. I have a package for your IT department."
        </p>
        <button onClick={handleSign} style={{
          width: '100%', padding: '9px 0', borderRadius: 6, background: '#00f0ff',
          border: 'none', color: '#050810',
          fontFamily: "'Orbitron',sans-serif", fontSize: 10, cursor: 'pointer', fontWeight: 700,
        }}>
          Sign for Delivery
        </button>
      </div>
    )
  }

  // Stage: request — courier asks for server room access
  return (
    <div style={cardStyle}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#ffbb44', letterSpacing: '0.1em', marginBottom: 10 }}>
        ⚠ ADDITIONAL REQUEST
      </div>
      <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.65, margin: '0 0 18px' }}>
        "Thanks. Also — I need to quickly check a few network ports in your server room to confirm this hardware will be compatible. Only takes 2 minutes."
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleLetIn} style={{
          flex: 1, padding: '9px 0', borderRadius: 6, background: 'transparent',
          border: '1px solid #ff3355', color: '#ff6688',
          fontFamily: "'Orbitron',sans-serif", fontSize: 9, cursor: 'pointer',
        }}>
          Sure, come in →
        </button>
        <button onClick={handleSecurity} style={{
          flex: 1, padding: '9px 0', borderRadius: 6, background: '#001a0f',
          border: '1px solid #00ff88', color: '#00ff88',
          fontFamily: "'Orbitron',sans-serif", fontSize: 9, cursor: 'pointer',
        }}>
          Wait here, I'll get security
        </button>
      </div>
    </div>
  )
}

// ─── Monitor glow ─────────────────────────────────────────────────────────────
function MonitorGlow() {
  const ref = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.intensity = 0.4 + Math.sin(clock.elapsedTime * 1.2) * 0.2
  })
  return (
    <pointLight
      ref={ref}
      position={[ANCHORS.PC_MONITOR_2.x, ANCHORS.PC_MONITOR_2.y, ANCHORS.PC_MONITOR_2.z]}
      color="#00c8ff"
      distance={2}
      decay={2}
    />
  )
}

// ─── Scene lights ─────────────────────────────────────────────────────────────
function SceneLights() {
  useEffect(() => {
    RectAreaLightUniformsLib.init()
  }, [])

  return (
    <>
      {/* Overhead fluorescent strips */}
      <rectAreaLight
        position={[0, 3.8, 0]} width={6} height={2} intensity={4} color="#e8f0ff"
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <rectAreaLight
        position={[0, 3.8, -2]} width={4} height={1} intensity={3} color="#dce8ff"
        rotation={[-Math.PI / 2, 0, 0]}
      />
      {/* Warm desk lamp glow */}
      <pointLight position={[1.2, 1.1, 0.5]}  color="#ffd580" intensity={0.8} distance={3}   decay={2} />
      {/* Monitor blue glow (animated via MonitorGlow) */}
      <MonitorGlow />
      {/* Shelf warm accent */}
      <pointLight position={[2.5, 2.2, -1.5]} color="#ff9960" intensity={0.3} distance={2.5} decay={2} />
      {/* Cool fill from window side */}
      <directionalLight position={[-5, 3, 2]}  color="#8ab4e8" intensity={0.5} />
      {/* Subtle floor bounce */}
      <pointLight position={[0, 0.05, 0]}      color="#3d2a18" intensity={0.4} distance={5}   decay={1.5} />
      {/* Washroom isolated light */}
      <pointLight position={[ANCHORS.WASHROOM.x, ANCHORS.WASHROOM.y, ANCHORS.WASHROOM.z]} color="#c0d8ff" intensity={0.7} distance={3} decay={2} />
    </>
  )
}

// ─── Audio reactor (runs once at root level) ──────────────────────────────────
function AudioReactor() {
  const focusMode  = useGameStore(s => s.focusMode)
  const activePoint = useGameStore(s => s.activePoint)
  const activeLayer = useGameStore(s => s.activeLayer)

  useEffect(() => {
    const audio = useAudioStore.getState()
    if (focusMode === 'windows' || focusMode === 'android') {
      audio.fadeOut('ambient_office_loop', 500)
    } else if (focusMode === 'free') {
      audio.fadeIn('ambient_office_loop', 0.14, 700)
    }
  }, [focusMode])

  useEffect(() => {
    const audio = useAudioStore.getState()
    if (activeLayer === 'scenario') {
      audio.fadeIn('scenario_tension_loop', 0.13, 700)
    } else {
      audio.fadeOut('scenario_tension_loop', 600)
    }
  }, [activeLayer])

  useEffect(() => {
    if (activePoint !== 5 || activeLayer !== 'scenario') {
      useAudioStore.getState().stopLoop('phone_ring_landline')
    }
  }, [activeLayer, activePoint])

  return null
}

// ─── GLB models + annotation points ──────────────────────────────────────────
function OfficeScene() {
  const { scene: roomScene }   = useGLTF('/studio_office_interior.glb')
  const { scene: phoneScene }  = useGLTF('/Smartphone.glb')
  const { scene: telScene }    = useGLTF('/Telephone.glb')
  const { scene: usbScene }    = useGLTF('/usb_memory.glb')
  const { scene: wbScene }     = useGLTF('/Whiteboard.glb')
  const { scene: boxScene }    = useGLTF('/Box.glb')
  const { scene: holderScene } = useGLTF('/DeskOrganizer.glb')

  const activePoint = useGameStore(s => s.activePoint)
  const focusMode   = useGameStore(s => s.focusMode)

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(roomScene)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    console.log('[CYBERSIM] Room size:', size, 'Center:', center)
  }, [roomScene])

  useEffect(() => {
    if (activePoint === null) return
    const attack = ATTACK_POINTS.find(a => a.id === activePoint)
    if (!attack) return

    useCameraStore.getState().focusOn(attack.camKey)
  }, [activePoint])

  useEffect(() => {
    if (focusMode === 'free') useCameraStore.getState().restoreInitial()
  }, [focusMode])

  return (
    <>
      <primitive object={roomScene}   castShadow receiveShadow />
      <primitive object={phoneScene}  castShadow receiveShadow position={P.phone.position}      rotation={P.phone.rotation}      scale={P.phone.scale} />
      <primitive object={telScene}    castShadow receiveShadow position={P.telephone.position}  rotation={P.telephone.rotation}  scale={P.telephone.scale} />
      <primitive object={usbScene}    castShadow receiveShadow position={P.usb.position}        rotation={P.usb.rotation}        scale={P.usb.scale} />
      <primitive object={wbScene}     castShadow receiveShadow position={P.whiteboard.position} rotation={P.whiteboard.rotation} scale={P.whiteboard.scale} />
      <primitive object={boxScene}    castShadow receiveShadow position={P.box.position}        rotation={P.box.rotation}        scale={P.box.scale} />
      <primitive object={holderScene} castShadow receiveShadow position={P.holder.position}     rotation={P.holder.rotation}     scale={P.holder.scale} />

      {ATTACK_POINTS.map(a => {
        const pos = ANCHORS[a.anchorKey as AnchorKey]
        if (!pos) { console.error(`Missing anchor: ${a.anchorKey}`); return null }
        return <AnnotationPoint key={a.id} id={a.id} displayName={a.displayName} tag={a.tag} label={a.label} position={pos} />
      })}
    </>
  )
}

useGLTF.preload('/studio_office_interior.glb')
useGLTF.preload('/Smartphone.glb')
useGLTF.preload('/Telephone.glb')
useGLTF.preload('/usb_memory.glb')
useGLTF.preload('/Whiteboard.glb')
useGLTF.preload('/Box.glb')
useGLTF.preload('/DeskOrganizer.glb')

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const controlsRef     = useRef<CameraControls>(null)
  const focusMode       = useGameStore(s => s.focusMode)
  const activePoint     = useGameStore(s => s.activePoint)
  const activeLayer     = useGameStore(s => s.activeLayer)
  const completedPoints = useGameStore(s => s.completedPoints)
  const failedPoints    = useGameStore(s => s.failedPoints)
  const allComplete     = new Set([...completedPoints, ...failedPoints]).size === 8

  useEffect(() => {
    useCameraStore.getState().setControlsRef(controlsRef)
    useAudioStore.getState().init()

    // Position camera at start and disable panning after controls mount
    const t = setTimeout(() => {
      const ctrl = controlsRef.current
      if (!ctrl) return
      ctrl.setLookAt(-3.2, 2.0, 2.5, 0.5, 0.9, 0.5, false)
      // Disable right-click pan and two-finger pan (ACTION.NONE = 0)
      ;(ctrl as any).mouseButtons.right = 0
      ;(ctrl as any).touches.two = 0
      useCameraStore.getState().setInitialPose(
        new THREE.Vector3(-3.2, 2.0, 2.5),
        new THREE.Vector3(0.5, 0.9, 0.5)
      )
    }, 120)

    const unlock = () => useAudioStore.getState().unlock()
    document.addEventListener('click',   unlock, { once: true })
    document.addEventListener('keydown', unlock, { once: true })
    return () => {
      clearTimeout(t)
      document.removeEventListener('click',   unlock)
      document.removeEventListener('keydown', unlock)
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050810', overflow: 'hidden' }}>
      <Canvas
        shadows
        camera={{ fov: 55, position: [-3.2, 2.0, 2.5], near: 0.1, far: 40 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        onCreated={({ gl }) => { gl.shadowMap.type = THREE.PCFSoftShadowMap }}
        style={{ pointerEvents: focusMode === 'windows' || focusMode === 'android' || focusMode === 'point' ? 'none' : 'auto' }}
      >
        <fog attach="fog" args={['#0c0e14', 6, 16]} />
        <color attach="background" args={['#0c0e14']} />
        {/* Floor — slightly below GLB floor */}
        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#1a1208" roughness={1} metalness={0} />
        </mesh>
        {/* Ceiling */}
        <mesh position={[0, 5.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#0f1118" roughness={1} />
        </mesh>
        {/* Back wall */}
        <mesh position={[0, 2.5, -8]}>
          <planeGeometry args={[30, 10]} />
          <meshStandardMaterial color="#12151e" roughness={1} />
        </mesh>
        {/* Front wall */}
        <mesh position={[0, 2.5, 8]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[30, 10]} />
          <meshStandardMaterial color="#12151e" roughness={1} />
        </mesh>
        {/* Left wall */}
        <mesh position={[-8, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[30, 10]} />
          <meshStandardMaterial color="#12151e" roughness={1} />
        </mesh>
        {/* Right wall */}
        <mesh position={[8, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[30, 10]} />
          <meshStandardMaterial color="#12151e" roughness={1} />
        </mesh>

        <SceneLights />
        <Environment preset="apartment" environmentIntensity={0.5} />

        <CameraControls
          ref={controlsRef}
          minDistance={1.5}
          maxDistance={6.5}
          minPolarAngle={Math.PI * 0.12}
          maxPolarAngle={Math.PI * 0.44}
          minAzimuthAngle={-Math.PI * 0.52}
          maxAzimuthAngle={Math.PI * 0.52}
          dampingFactor={0.06}
          smoothTime={0.3}
          dollySpeed={0.8}
          truckSpeed={0}
          enabled={focusMode === 'free'}
        />

        <Suspense fallback={null}>
          <OfficeScene />
        </Suspense>
      </Canvas>

      <AudioReactor />
      <ScoreToast />
      <ScoreHUD />
      <BackButton />
      <SubtitleBar />
      <LockedToast />
      <SessionResumeToast />
      <AttackPanel />
      {activePoint === 7 && activeLayer === 'scenario' && (
        <CenteredOverlay>
          <div style={{ minHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DeliveryCard onDone={() => useGameStore.getState().exitToScene()} />
          </div>
        </CenteredOverlay>
      )}
      <ScenarioFeedbackModal />
      {focusMode === 'windows' && <WindowsOS />}
      {focusMode === 'android' && <AndroidOS />}
      {allComplete && activeLayer === 'complete' && <CompletionScreen />}
    </div>
  )
}
