import { useEffect, useMemo, useRef } from 'react'
import { TransformControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useEditorStore } from '../EditorStore'
import type { PropObject } from '../types/editor.types'

export function PropGizmo({ prop }: { prop: PropObject }) {
  const objectRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(prop.glbPath)
  const selected = useEditorStore(s => s.selectedPropId === prop.id)
  const mode = useEditorStore(s => s.mode)
  const showGizmos = useEditorStore(s => s.showGizmos)
  const previewMode = useEditorStore(s => s.previewMode)
  const selectProp = useEditorStore(s => s.selectProp)
  const updateProp = useEditorStore(s => s.updateProp)
  const clonedScene = useMemo(() => scene.clone(true), [scene])

  useEffect(() => {
    clonedScene.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = prop.castShadow
        child.receiveShadow = true
      }
    })
  }, [clonedScene, prop.castShadow])

  if (!prop.visible) return null

  const syncTransform = () => {
    const object = objectRef.current
    if (!object) return
    updateProp(prop.id, {
      position: [object.position.x, object.position.y, object.position.z],
      rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
      scale: [object.scale.x, object.scale.y, object.scale.z],
    })
  }

  return (
    <group>
      <group
        ref={objectRef}
        position={prop.position}
        rotation={prop.rotation}
        scale={prop.scale}
        onClick={event => {
          event.stopPropagation()
          selectProp(prop.id)
        }}
      >
        <primitive object={clonedScene} />
        {selected && !previewMode && (
          <boxHelper args={[undefined, '#00f0ff']} />
        )}
      </group>
      {!selected && showGizmos && !previewMode && (
        <mesh position={[prop.position[0], prop.position[1] + 0.25, prop.position[2]]}>
          <sphereGeometry args={[0.025, 12, 12]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.72} />
        </mesh>
      )}
      {selected && showGizmos && !previewMode && mode !== 'select' && objectRef.current && (
        <TransformControls object={objectRef.current} mode={mode} onObjectChange={syncTransform} size={0.75} />
      )}
    </group>
  )
}
