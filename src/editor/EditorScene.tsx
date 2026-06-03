import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { CameraControls, Environment, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { button, Leva, useControls } from 'leva'
import { AxisGrid } from './components/AxisGrid'
import { CameraFrustum } from './components/CameraFrustum'
import { HotspotMarker } from './components/HotspotMarker'
import { PropGizmo } from './components/PropGizmo'
import { StartCameraMarker } from './components/StartCameraMarker'
import { useEditorStore } from './EditorStore'

type CameraControlsWithPose = CameraControls & {
  getPosition: (target: THREE.Vector3) => THREE.Vector3
  getTarget: (target: THREE.Vector3) => THREE.Vector3
}

function RoomGLB() {
  const { scene } = useGLTF('/studio_office_interior.glb')
  return <primitive object={scene} castShadow receiveShadow />
}

function EditorLights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[-4, 6, 4]} intensity={1.2} castShadow />
      <pointLight position={[1.2, 1.1, 0.5]} color="#ffd580" intensity={0.8} distance={3} decay={2} />
      <pointLight position={[0.52, 1.61, 0.37]} color="#00c8ff" intensity={0.55} distance={2} decay={2} />
    </>
  )
}

function CameraRig() {
  const controlsRef = useRef<CameraControls>(null)
  const { camera } = useThree()
  const startCamera = useEditorStore(s => s.startCamera)
  const cameraLimits = useEditorStore(s => s.cameraLimits)
  const requestedCamera = useEditorStore(s => s.requestedCamera)
  const clearCameraRequest = useEditorStore(s => s.clearCameraRequest)
  const setCurrentCamera = useEditorStore(s => s.setCurrentCamera)

  useEffect(() => {
    const ctrl = controlsRef.current
    if (!ctrl) return
    ctrl.setLookAt(...startCamera.position, ...startCamera.target, false)
    if ('fov' in camera) {
      camera.fov = startCamera.fov
      camera.updateProjectionMatrix()
    }
    // Initial editor camera setup should not re-run while editing start fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const ctrl = controlsRef.current
    if (!ctrl || !requestedCamera) return
    ctrl.setLookAt(...requestedCamera.position, ...requestedCamera.target, true)
    if ('fov' in camera) {
      camera.fov = requestedCamera.fov
      camera.updateProjectionMatrix()
    }
    clearCameraRequest()
  }, [requestedCamera, clearCameraRequest, camera])

  useFrame(() => {
    const ctrl = controlsRef.current as CameraControlsWithPose | null
    if (!ctrl) return
    const pos = ctrl.getPosition(new THREE.Vector3())
    const target = ctrl.getTarget(new THREE.Vector3())
    setCurrentCamera({
      position: [pos.x, pos.y, pos.z],
      target: [target.x, target.y, target.z],
      fov: 'fov' in camera ? camera.fov : 55,
    })
  })

  return (
    <CameraControls
      ref={controlsRef}
      minDistance={cameraLimits.minDistance}
      maxDistance={cameraLimits.maxDistance}
      minPolarAngle={cameraLimits.minPolarAngle}
      maxPolarAngle={cameraLimits.maxPolarAngle}
      minAzimuthAngle={cameraLimits.minAzimuthAngle}
      maxAzimuthAngle={cameraLimits.maxAzimuthAngle}
      dampingFactor={0.06}
      smoothTime={0.3}
      dollySpeed={0.8}
    />
  )
}

function EditorSceneContents() {
  const props = useEditorStore(s => s.props)
  const hotspots = useEditorStore(s => s.hotspots)
  const showGrid = useEditorStore(s => s.showGrid)
  const showCameraFrustum = useEditorStore(s => s.showCameraFrustum)
  const startCamera = useEditorStore(s => s.startCamera)
  const selectedHotspot = useEditorStore(s => s.hotspots.find(h => h.id === s.selectedHotspotId))

  return (
    <>
      <color attach="background" args={['#080b10']} />
      <fog attach="fog" args={['#0c0e14', 7, 18]} />
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#12151e" roughness={1} />
      </mesh>
      <EditorLights />
      <Environment preset="apartment" environmentIntensity={0.45} />
      <Suspense fallback={null}>
        <RoomGLB />
        {props.map(prop => <PropGizmo key={prop.id} prop={prop} />)}
        {hotspots.map(hotspot => <HotspotMarker key={hotspot.id} hotspot={hotspot} />)}
        <StartCameraMarker />
        {showCameraFrustum && !selectedHotspot && <CameraFrustum position={startCamera.position} target={startCamera.target} fov={startCamera.fov} color="#4a6080" />}
        <AxisGrid visible={showGrid} />
      </Suspense>
      <CameraRig />
    </>
  )
}

export function EditorScene() {
  const setFlag = useEditorStore(s => s.setFlag)
  const showGrid = useEditorStore(s => s.showGrid)
  const showGizmos = useEditorStore(s => s.showGizmos)
  const showCameraFrustum = useEditorStore(s => s.showCameraFrustum)

  useControls('Viewport', {
    Grid: { value: showGrid, onChange: value => setFlag('showGrid', value) },
    Gizmos: { value: showGizmos, onChange: value => setFlag('showGizmos', value) },
    Frustum: { value: showCameraFrustum, onChange: value => setFlag('showCameraFrustum', value) },
    Reset: button(() => useEditorStore.getState().requestCameraPreview(useEditorStore.getState().startCamera)),
  })

  return (
    <>
      <Canvas
        shadows="soft"
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        camera={{ fov: 55, position: [0, 2.2, 5], near: 0.1, far: 40 }}
        onPointerMissed={() => {
          useEditorStore.getState().selectProp(null)
          useEditorStore.getState().selectHotspot(null)
        }}
      >
        <EditorSceneContents />
      </Canvas>
      <Leva collapsed hidden />
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
