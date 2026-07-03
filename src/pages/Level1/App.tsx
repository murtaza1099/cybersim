import { Suspense, useRef, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { CameraControls, useGLTF, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'

import { PROP_POSITIONS as P }   from './config/propPositions'
import { ANCHORS }               from './config/anchors'
import type { AnchorKey }        from './config/anchors'
import { CAMERA_LIMITS, START_CAMERA } from '@/config/loadSceneConfig'
import { ATTACK_POINTS }         from './config/attacks'
import { colors, fonts }         from './styles/theme'
import { useGameStore }          from './stores/gameStore'
import { useCameraStore }        from './stores/cameraStore'
import { useAudioStore }         from './stores/audioStore'
import type { PcSubAttackResult } from '@/store/simulationStore'
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
import GuideCharacter            from './components/hud/GuideCharacter'
import CompletionScreen          from './components/CompletionScreen'
import ScenarioFeedbackModal     from './components/game/ScenarioFeedbackModal'
import ScenarioContextCard       from './components/game/ScenarioContextCard'
import CenteredOverlay           from './components/ui/CenteredOverlay'
import SceneLoader               from './components/ui/SceneLoader'
import IntroSequence             from './components/IntroSequence'
import { buzzAmplitude }         from './utils/buzzLimiter'

export type Level1ExitResult = {
  score: number
  status: 'completed' | 'failed' | 'in-progress'
  completedAttacks?: number
  failedAttacks?: number
  pcSubAttackResults?: PcSubAttackResult[]
}

type Level1SimulationProps = {
  onExit?: (result?: Level1ExitResult) => void
  onSceneReady?: () => void
}

type CameraControlsWithInputMaps = CameraControls & {
  mouseButtons: { right: number }
  touches: { two: number }
}

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
    width: 320, background: colors.surfaceDeep, backdropFilter: 'blur(14px)',
    border: `1px solid ${colors.border}`, borderRadius: 10, padding: '20px 22px',
    fontFamily: fonts.body,
  }
  const neutralDecisionButton: React.CSSProperties = {
    flex: 1,
    padding: '9px 0',
    borderRadius: 6,
    background: 'transparent',
    border: '1px solid rgba(0,240,255,0.28)',
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 9,
    cursor: 'pointer',
  }

  if (stage === 'consequence') {
    return (
      <div style={{ ...cardStyle, border: '1px solid #ff335566' }}>
        <div style={{ fontFamily: fonts.mono, fontSize: 22, color: colors.red, fontWeight: 700, marginBottom: 14, letterSpacing: '0.1em', textAlign: 'center' }}>
          −10 PTS
        </div>
        <div style={{ fontFamily: fonts.mono, fontSize: 10, color: '#ff335588', letterSpacing: '0.15em', marginBottom: 12, textAlign: 'center' }}>
          SECURITY FAILURE
        </div>
        <div style={{ fontSize: 13, color: '#ff8899', lineHeight: 1.75, marginBottom: 18, whiteSpace: 'pre-line' }}>
          {consequence}
        </div>
        <button onClick={handleUnderstood} style={{
          width: '100%', padding: '9px 0', borderRadius: 6, background: 'transparent',
          border: `1px solid ${colors.red}`, color: '#ff6688',
          fontFamily: fonts.display, fontSize: 10, cursor: 'pointer',
        }}>RETURN TO OFFICE</button>
      </div>
    )
  }

  if (stage === 'left') {
    return (
      <div style={cardStyle}>
        <div style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.green, textAlign: 'center', lineHeight: 1.8 }}>
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
        <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>
          ATTN: IT Department
        </div>
        <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDim, marginBottom: 16 }}>
          Server Components — Handle with care
        </div>
        <p style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.65, margin: '0 0 18px' }}>
          "DHL Express, delivery for the office. I have a package for your IT department."
        </p>
        <button onClick={handleSign} style={{ ...neutralDecisionButton, width: '100%', fontSize: 10, fontWeight: 700 }}>
          Sign for Delivery
        </button>
      </div>
    )
  }

  // Stage: request — courier asks for server room access
  return (
    <div style={cardStyle}>
      <div style={{ fontFamily: fonts.mono, fontSize: 10, color: '#ffbb44', letterSpacing: '0.1em', marginBottom: 10 }}>
        ⚠ ADDITIONAL REQUEST
      </div>
      <p style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.65, margin: '0 0 18px' }}>
        "Thanks. Also — I need to quickly check a few network ports in your server room to confirm this hardware will be compatible. Only takes 2 minutes."
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleLetIn} style={neutralDecisionButton}>
          Sure, come in →
        </button>
        <button onClick={handleSecurity} style={neutralDecisionButton}>
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
      {/* Cool overhead fluorescent wash; ambient fill comes from Environment. */}
      <rectAreaLight
        position={[0, 3.8, -0.6]} width={6} height={2.6} intensity={4.2} color="#dce8ff"
        rotation={[-Math.PI / 2, 0, 0]}
      />
      {/* Warm desk lamp glow */}
      <pointLight position={[1.2, 1.1, 0.5]} color="#ffd580" intensity={0.9} distance={3} decay={2} />
      {/* Monitor blue glow (animated via MonitorGlow) */}
      <MonitorGlow />
      {/* Cool side fill to keep silhouettes readable without extra point lights. */}
      <directionalLight position={[-5, 3, 2]} color="#8ab4e8" intensity={0.45} />
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

// ─── A prop that buzzes in place ONCE for its objective ───────────────────────
// Plays exactly one 3s pulse the first time its objective becomes active in the
// free scene, then never again for the whole play. The "already buzzed" latch
// lives in gameStore keyed by point id (buzzedPointIds), NOT a component ref, so
// it survives this prop unmounting/remounting when a Windows/Android OS overlay
// opens and closes — that remount was the source of the second vibration.
function BuzzingProp({ object, position, rotation, scale, pointId, active }: {
  object: THREE.Object3D
  position: number[]
  rotation: number[]
  scale: number | number[]
  pointId: number
  active: boolean
}) {
  const ref = useRef<THREE.Group>(null)
  const buzzStartedAt = useRef<number | null>(null)
  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime

    // Arm exactly one pulse per objective for the whole play. Guard on the shared
    // latch: if this objective already buzzed (even before a remount), never arm.
    if (active && buzzStartedAt.current === null && !useGameStore.getState().buzzedPointIds.includes(pointId)) {
      useGameStore.getState().markBuzzed(pointId)
      buzzStartedAt.current = t
    }

    // Drive the pinned 3s envelope to completion, independent of focusMode.
    const amplitude = buzzStartedAt.current === null
      ? 0
      : buzzAmplitude(t - buzzStartedAt.current)

    if (amplitude > 0) {
      g.position.set(
        position[0] + Math.sin(t * 55) * 0.006 * amplitude,
        position[1],
        position[2] + Math.cos(t * 48) * 0.006 * amplitude,
      )
    } else {
      g.position.set(position[0], position[1], position[2])
    }
  })
  return (
    <group ref={ref} position={position as [number, number, number]} rotation={rotation as [number, number, number]} scale={scale as number | [number, number, number]}>
      <primitive object={object} />
    </group>
  )
}

// ─── GLB models + annotation points ──────────────────────────────────────────
function OfficeScene({ onReady, sweepComplete }: { onReady: () => void; sweepComplete: boolean }) {
  const { scene: roomScene }   = useGLTF('/studio_office_interior.glb', '/draco/')
  const { scene: phoneScene }  = useGLTF('/Smartphone.glb', '/draco/')
  const { scene: telScene }    = useGLTF('/Telephone.glb', '/draco/')
  const { scene: usbScene }    = useGLTF('/usb_memory.glb', '/draco/')
  const { scene: wbScene }     = useGLTF('/Whiteboard.glb', '/draco/')
  const { scene: boxScene }    = useGLTF('/Box.glb', '/draco/')
  const { scene: holderScene } = useGLTF('/DeskOrganizer.glb', '/draco/')

  const activePoint = useGameStore(s => s.activePoint)
  const focusMode   = useGameStore(s => s.focusMode)
  const currentPointId = useGameStore(s => s.currentPointId)

  // Staggered hotspot reveal: once the cinematic sweep settles, the annotation
  // points fade in one by one (180ms apart) rather than all at once.
  const [revealedCount, setRevealedCount] = useState(0)
  useEffect(() => {
    if (!sweepComplete) return
    if (revealedCount >= ATTACK_POINTS.length) return
    const t = setTimeout(() => setRevealedCount(c => c + 1), 180)
    return () => clearTimeout(t)
  }, [sweepComplete, revealedCount])

  useEffect(() => {
    if (activePoint === null) return
    const attack = ATTACK_POINTS.find(a => a.id === activePoint)
    if (!attack) return

    useCameraStore.getState().focusOn(attack.camKey)
  }, [activePoint])

  useEffect(() => {
    if (focusMode === 'free') useCameraStore.getState().restoreInitial()
  }, [focusMode])

  // All useGLTF calls have resolved by the time this runs (Suspense). Signal the
  // loader once the first frame has actually painted.
  useEffect(() => {
    const id = requestAnimationFrame(() => onReady())
    return () => cancelAnimationFrame(id)
  }, [onReady])

  return (
    <>
      <primitive object={roomScene} />
      <BuzzingProp object={phoneScene} pointId={4} position={P.phone.position}     rotation={P.phone.rotation}     scale={P.phone.scale}     active={currentPointId === 4 && focusMode === 'free'} />
      <BuzzingProp object={telScene}   pointId={5} position={P.telephone.position} rotation={P.telephone.rotation} scale={P.telephone.scale} active={currentPointId === 5 && focusMode === 'free'} />
      <primitive object={usbScene}    position={P.usb.position}        rotation={P.usb.rotation}        scale={P.usb.scale} />
      <primitive object={wbScene}     position={P.whiteboard.position} rotation={P.whiteboard.rotation} scale={P.whiteboard.scale} />
      <primitive object={boxScene}    position={P.box.position}        rotation={P.box.rotation}        scale={P.box.scale} />
      <primitive object={holderScene} position={P.holder.position}     rotation={P.holder.rotation}     scale={P.holder.scale} />

      {sweepComplete && ATTACK_POINTS.map((a, index) => {
        if (index >= revealedCount) return null
        const pos = ANCHORS[a.anchorKey as AnchorKey]
        if (!pos) { console.error(`Missing anchor: ${a.anchorKey}`); return null }
        return <AnnotationPoint key={a.id} id={a.id} displayLabel={String.fromCharCode(65 + index)} position={pos} />
      })}
    </>
  )
}

useGLTF.preload('/studio_office_interior.glb', '/draco/')
useGLTF.preload('/Smartphone.glb', '/draco/')
useGLTF.preload('/Telephone.glb', '/draco/')
useGLTF.preload('/usb_memory.glb', '/draco/')
useGLTF.preload('/Whiteboard.glb', '/draco/')
useGLTF.preload('/Box.glb', '/draco/')
useGLTF.preload('/DeskOrganizer.glb', '/draco/')

// ─── 360° cinematic office sweep ──────────────────────────────────────────────
// Renders inside the <Canvas> (uses useFrame). Orbits the camera around the
// office for ~5s, then glides to the start position and re-enables controls.
interface OfficeSweepProps {
  active: boolean
  onComplete: () => void
}

function OfficeSweep({ active, onComplete }: OfficeSweepProps) {
  const elapsed   = useRef(0)
  const completed = useRef(false)

  // SWEEP PARAMETERS — tuned to the office GLB layout (centre ≈ origin).
  const SWEEP_DURATION = 4.5                              // total seconds for full sweep (short cinematic)
  const ORBIT_RADIUS   = 5.5                              // distance from office center (wider view)
  const ORBIT_HEIGHT   = 1.9                              // camera height during sweep
  const ORBIT_CENTER   = new THREE.Vector3(0, 0.8, 0)     // look-at target (office center)
  const START_ANGLE    = Math.PI * 1.05                   // start angle ≈ the start-camera side, for a smooth settle
  const END_ANGLE      = START_ANGLE + Math.PI * 2        // full 360°

  useFrame((_, delta) => {
    if (!active || completed.current) return

    const ref = useCameraStore.getState().controlsRef?.current
    if (!ref) return

    elapsed.current += delta

    const progress = Math.min(elapsed.current / SWEEP_DURATION, 1)

    // Easing: ease-in-out cubic — slow start, smooth through, slow settle.
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2

    const angle = START_ANGLE + (END_ANGLE - START_ANGLE) * eased

    // Camera position on a circle around ORBIT_CENTER.
    const camX = ORBIT_CENTER.x + Math.cos(angle) * ORBIT_RADIUS
    const camZ = ORBIT_CENTER.z + Math.sin(angle) * ORBIT_RADIUS
    const camY = ORBIT_HEIGHT

    // Block user input during the cinematic. NOTE: drei's <CameraControls> only
    // calls controls.update(delta) while `enabled` is true, so with it disabled we
    // must drive the update ourselves — otherwise setLookAt never applies and the
    // camera freezes. camera-controls ignores pointer input while disabled, so the
    // user still can't interfere.
    ref.enabled = false

    ref.setLookAt(
      camX, camY, camZ,                                       // camera position
      ORBIT_CENTER.x, ORBIT_CENTER.y, ORBIT_CENTER.z,         // look-at target
      false                                                    // snap — we ease the angle ourselves
    )
    ref.update(delta)   // apply the move (drei skips update() while disabled)

    // When the sweep completes, animate back to START_CAMERA smoothly.
    if (progress >= 1 && !completed.current) {
      completed.current = true

      // Re-enable controls and restore the free-roam camera limits.
      ref.enabled         = true
      ref.minDistance     = CAMERA_LIMITS.minDistance
      ref.maxDistance     = CAMERA_LIMITS.maxDistance
      ref.minPolarAngle   = CAMERA_LIMITS.minPolarAngle
      ref.maxPolarAngle   = CAMERA_LIMITS.maxPolarAngle
      ref.minAzimuthAngle = CAMERA_LIMITS.minAzimuthAngle
      ref.maxAzimuthAngle = CAMERA_LIMITS.maxAzimuthAngle

      // Glide to the final start position with a lerp.
      ref.setLookAt(
        START_CAMERA.position[0], START_CAMERA.position[1], START_CAMERA.position[2],
        START_CAMERA.target[0],   START_CAMERA.target[1],   START_CAMERA.target[2],
        true  // smooth lerp
      )

      // Wait for the lerp to settle (~0.8s), then hand control back.
      setTimeout(() => onComplete(), 820)
    }
  })

  // Reset internal timers whenever a fresh sweep is requested.
  useEffect(() => {
    if (active) {
      elapsed.current = 0
      completed.current = false
    }
  }, [active])

  return null  // drives the camera only — renders nothing
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Level1Simulation({ onExit, onSceneReady }: Level1SimulationProps) {
  const controlsRef     = useRef<CameraControls>(null)
  const focusMode       = useGameStore(s => s.focusMode)
  const activePoint     = useGameStore(s => s.activePoint)
  const activeLayer     = useGameStore(s => s.activeLayer)
  const completedPoints = useGameStore(s => s.completedPoints)
  const failedPoints    = useGameStore(s => s.failedPoints)
  const allComplete     = ATTACK_POINTS.every(a => completedPoints.includes(a.id) || failedPoints.includes(a.id))
  const [introComplete, setIntroComplete] = useState(false)
  const [sweepActive, setSweepActive]     = useState(false)
  const [sweepComplete, setSweepComplete] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [showLoader, setShowLoader] = useState(true)
  const sweepStarted = useRef(false)
  const handleSceneReady = useCallback(() => setSceneReady(true), [])

  // Keep the loader mounted briefly after the scene is ready so it can fade out.
  useEffect(() => {
    if (!sceneReady) return
    const t = setTimeout(() => setShowLoader(false), 700)
    return () => clearTimeout(t)
  }, [sceneReady])

  useEffect(() => {
    if (sceneReady) onSceneReady?.()
  }, [onSceneReady, sceneReady])

  useEffect(() => {
    if (!introComplete || !sceneReady || showLoader || sweepStarted.current) return
    sweepStarted.current = true
    setSweepActive(true)
  }, [introComplete, sceneReady, showLoader])

  useEffect(() => {
    // Heal any stale save (e.g. an old currentPointId) so the right hotspot opens.
    useGameStore.getState().reconcileObjective()
    useCameraStore.getState().setControlsRef(controlsRef)
    useAudioStore.getState().init()

    // Position camera at start and disable panning after controls mount
    const t = setTimeout(() => {
      const ctrl = controlsRef.current
      if (!ctrl) return
      ctrl.setLookAt(...START_CAMERA.position, ...START_CAMERA.target, false)
      // Disable right-click pan and two-finger pan (ACTION.NONE = 0)
      const controls = ctrl as CameraControlsWithInputMaps
      controls.mouseButtons.right = 0
      controls.touches.two = 0
      useCameraStore.getState().setInitialPose(
        new THREE.Vector3(...START_CAMERA.position),
        new THREE.Vector3(...START_CAMERA.target)
      )
    }, 120)

    return () => {
      clearTimeout(t)
      useAudioStore.getState().stopAll()
    }
  }, [])

  // Audio stays silent until the cinematic sweep begins (right after BEGIN MISSION).
  // Then ambient_office_loop fades up over 3s. unlock() starts ambient at full
  // volume, so we restart it through fadeIn to get the gentle ramp instead of a pop.
  // scenario_tension_loop is intentionally NOT started here — that waits for an attack.
  useEffect(() => {
    if (!sweepActive) return
    const audio = useAudioStore.getState()
    audio.unlock()
    audio.stopLoop('ambient_office_loop')
    audio.fadeIn('ambient_office_loop', 0.14, 3000)
  }, [sweepActive])

  // Scenario-context card → action button: open the OS / scene and start its audio cue.
  const handleContextProceed = () => {
    const attack = ATTACK_POINTS.find(a => a.id === activePoint)
    if (!attack) return
    const game  = useGameStore.getState()
    const audio = useAudioStore.getState()
    game.beginScenario()
    audio.fadeOut('ambient_office_loop', 600)
    audio.fadeIn('scenario_tension_loop', 0.13, 700)
    if (attack.triggerOS !== 'scene') game.openOS(attack.triggerOS as 'windows' | 'android')
    if (attack.audioCue === 'phone_ring_landline') {
      audio.startLoop('phone_ring_landline')
    } else {
      audio.play(attack.audioCue)
    }
  }

  const handleContextAbort = () => {
    useGameStore.getState().exitToScene()
    useCameraStore.getState().restoreInitial()
  }

  return (
    <div className="cybersim-level1-root" style={{ position: 'relative', width: '100vw', height: '100vh', background: '#050810', overflow: 'hidden' }}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ fov: START_CAMERA.fov, position: START_CAMERA.position, near: 0.1, far: 40 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        style={{ pointerEvents: focusMode === 'windows' || focusMode === 'android' || focusMode === 'point' ? 'none' : 'auto' }}
      >
        <fog attach="fog" args={['#0c0e14', 6, 16]} />
        <color attach="background" args={['#0c0e14']} />
        {/* Floor — slightly below GLB floor */}
        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
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
          minDistance={CAMERA_LIMITS.minDistance}
          maxDistance={CAMERA_LIMITS.maxDistance}
          minPolarAngle={CAMERA_LIMITS.minPolarAngle}
          maxPolarAngle={CAMERA_LIMITS.maxPolarAngle}
          minAzimuthAngle={CAMERA_LIMITS.minAzimuthAngle}
          maxAzimuthAngle={CAMERA_LIMITS.maxAzimuthAngle}
          dampingFactor={0.06}
          smoothTime={0.3}
          dollySpeed={0.4}
          truckSpeed={0}
          enabled={focusMode === 'free'}
        />

        <Suspense fallback={null}>
          <OfficeScene onReady={handleSceneReady} sweepComplete={sweepComplete} />
        </Suspense>

        <OfficeSweep
          active={sweepActive}
          onComplete={() => {
            setSweepActive(false)
            setSweepComplete(true)
          }}
        />
      </Canvas>

      {showLoader && <SceneLoader ready={sceneReady} />}

      <AudioReactor />
      <ScoreToast />
      <ScoreHUD />
      {/* Once the mission is complete, the CompletionScreen owns the exit — hide the
          EXIT button so it can't pop the "abort?" confirm over the results. */}
      {!(allComplete && activeLayer === 'complete') && <BackButton onExit={onExit} />}
      <SubtitleBar />
      <LockedToast />
      <GuideCharacter introComplete={introComplete} />
      <SessionResumeToast />
      <AttackPanel />
      {activePoint === 7 && activeLayer === 'scenario' && (
        <CenteredOverlay>
          <div style={{ minHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DeliveryCard onDone={() => useGameStore.getState().exitToScene()} />
          </div>
        </CenteredOverlay>
      )}
      {activeLayer === 'context' && activePoint !== null && activePoint !== 7 && (
        <CenteredOverlay>
          <ScenarioContextCard
            attackId={activePoint}
            onProceed={handleContextProceed}
            onAbort={handleContextAbort}
          />
        </CenteredOverlay>
      )}
      <ScenarioFeedbackModal />
      {focusMode === 'windows' && <WindowsOS />}
      {focusMode === 'android' && <AndroidOS />}
      {allComplete && activeLayer === 'complete' && <CompletionScreen onExit={onExit} />}

      {/* Cinematic sweep overlay — scanning HUD shown only while the camera orbits */}
      {sweepActive && !sweepComplete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.55) 100%)',
        }}>
          {/* Top-left: scanning label */}
          <div style={{
            position: 'absolute', top: 28, left: 110,
            fontFamily: fonts.mono, fontSize: 10,
            color: colors.cyan, letterSpacing: '0.2em',
            opacity: 0.7,
          }}>
            // SCANNING ENVIRONMENT...
          </div>

          {/* Bottom center: sweep status */}
          <div style={{
            position: 'absolute', bottom: 32, left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: fonts.mono, fontSize: 10,
            color: colors.cyan, letterSpacing: '0.25em',
            opacity: 0.5,
          }}>
            THREAT DETECTION ACTIVE
          </div>

          {/* Thin cyan corner brackets — no full rectangle */}
          <div style={{ position: 'absolute', top: 16, left: 16, width: 32, height: 32,
            borderTop: `1px solid ${colors.cyan}`, borderLeft: `1px solid ${colors.cyan}`, opacity: 0.35 }} />
          <div style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32,
            borderTop: `1px solid ${colors.cyan}`, borderRight: `1px solid ${colors.cyan}`, opacity: 0.35 }} />
          <div style={{ position: 'absolute', bottom: 16, left: 16, width: 32, height: 32,
            borderBottom: `1px solid ${colors.cyan}`, borderLeft: `1px solid ${colors.cyan}`, opacity: 0.35 }} />
          <div style={{ position: 'absolute', bottom: 16, right: 16, width: 32, height: 32,
            borderBottom: `1px solid ${colors.cyan}`, borderRight: `1px solid ${colors.cyan}`, opacity: 0.35 }} />
        </div>
      )}

      {!introComplete && (
        <IntroSequence onComplete={() => {
          setIntroComplete(true)
        }} />
      )}
    </div>
  )
}
