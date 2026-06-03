import { Html, Line } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'
import { useEditorStore } from '../EditorStore'
import { CameraFrustum } from './CameraFrustum'
import type { HotspotConfig } from '../types/editor.types'

const stateColors = {
  unlocked: '#00f0ff',
  locked: '#ffbb44',
  completed: '#00ff88',
}

export function HotspotMarker({ hotspot }: { hotspot: HotspotConfig }) {
  const dragging = useRef(false)
  const selected = useEditorStore(s => s.selectedHotspotId === hotspot.id)
  const showCameraFrustum = useEditorStore(s => s.showCameraFrustum)
  const previewMode = useEditorStore(s => s.previewMode)
  const selectHotspot = useEditorStore(s => s.selectHotspot)
  const updateHotspot = useEditorStore(s => s.updateHotspot)

  if (!hotspot.visible) return null

  const color = selected ? '#00f0ff' : stateColors[hotspot.state]

  return (
    <group>
      <mesh
        position={hotspot.anchorPosition}
        onClick={event => {
          event.stopPropagation()
          selectHotspot(hotspot.id)
        }}
        onPointerDown={event => {
          event.stopPropagation()
          dragging.current = true
          const target = event.target as Element
          target.setPointerCapture(event.pointerId)
        }}
        onPointerMove={event => {
          if (!dragging.current) return
          event.stopPropagation()
          const next = event.point.clone().add(new THREE.Vector3(0, 0.08, 0))
          updateHotspot(hotspot.id, { anchorPosition: [next.x, next.y, next.z] })
        }}
        onPointerUp={event => {
          dragging.current = false
          const target = event.target as Element
          target.releasePointerCapture(event.pointerId)
        }}
      >
        <sphereGeometry args={[selected ? 0.065 : 0.04, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 1.1 : 0.35} />
      </mesh>
      {!previewMode && (
        <>
          <Line points={[hotspot.anchorPosition, [hotspot.anchorPosition[0], 0.03, hotspot.anchorPosition[2]]]} color="#8090a0" transparent opacity={0.35} lineWidth={1} />
          <Html position={[hotspot.anchorPosition[0], hotspot.anchorPosition[1] + 0.18, hotspot.anchorPosition[2]]} center>
            <button className={`editor-hotspot-bubble ${hotspot.state} ${selected ? 'selected' : ''}`}>
              <span>{hotspot.id}</span>
              <strong>{hotspot.label}</strong>
            </button>
          </Html>
        </>
      )}
      {selected && showCameraFrustum && !previewMode && (
        <>
          <CameraFrustum position={hotspot.focusCamPos} target={hotspot.focusCamTarget} fov={hotspot.focusCamFov} />
          <Line points={[hotspot.focusCamPos, hotspot.anchorPosition]} color="#00f0ff" dashed dashSize={0.08} gapSize={0.05} transparent opacity={0.65} />
        </>
      )}
    </group>
  )
}
