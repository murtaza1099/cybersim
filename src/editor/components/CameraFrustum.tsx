import { useMemo } from 'react'
import * as THREE from 'three'
import type { Vec3 } from '../types/editor.types'

function pointsForFrustum(position: Vec3, target: Vec3, fov: number) {
  const pos = new THREE.Vector3(...position)
  const tar = new THREE.Vector3(...target)
  const forward = tar.clone().sub(pos).normalize()
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()
  if (right.lengthSq() === 0) right.set(1, 0, 0)
  const up = new THREE.Vector3().crossVectors(right, forward).normalize()
  const distance = 0.75
  const height = Math.tan(THREE.MathUtils.degToRad(fov) / 2) * distance
  const width = height * 1.6
  const center = pos.clone().add(forward.multiplyScalar(distance))
  const corners = [
    center.clone().add(right.clone().multiplyScalar(-width)).add(up.clone().multiplyScalar(height)),
    center.clone().add(right.clone().multiplyScalar(width)).add(up.clone().multiplyScalar(height)),
    center.clone().add(right.clone().multiplyScalar(width)).add(up.clone().multiplyScalar(-height)),
    center.clone().add(right.clone().multiplyScalar(-width)).add(up.clone().multiplyScalar(-height)),
  ]

  return [
    pos, corners[0], pos, corners[1], pos, corners[2], pos, corners[3],
    corners[0], corners[1], corners[1], corners[2], corners[2], corners[3], corners[3], corners[0],
    pos, tar,
  ]
}

export function CameraFrustum({ position, target, fov = 55, color = '#00f0ff' }: { position: Vec3; target: Vec3; fov?: number; color?: string }) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(pointsForFrustum(position, target, fov))
    return g
  }, [position, target, fov])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.45} depthTest={false} />
    </lineSegments>
  )
}
