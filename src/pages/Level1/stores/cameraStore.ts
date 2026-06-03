import { create } from 'zustand'
import * as THREE from 'three'
import type { RefObject } from 'react'
import type { CameraControls } from '@react-three/drei'
import { CAM_POSITIONS } from '../config/cameraPositions'
import type { CamKey } from '../config/cameraPositions'
import { CAMERA_LIMITS } from '@/config/loadSceneConfig'

interface CameraState {
  controlsRef: RefObject<CameraControls> | null
  initialPos: THREE.Vector3
  initialTarget: THREE.Vector3
  setControlsRef: (ref: RefObject<CameraControls>) => void
  setInitialPose: (pos: THREE.Vector3, target: THREE.Vector3) => void
  focusOn: (camKey: string) => void
  restoreInitial: () => void
}

export const useCameraStore = create<CameraState>()((set, get) => ({
  controlsRef: null,
  initialPos:    CAM_POSITIONS.initial.pos.clone(),
  initialTarget: CAM_POSITIONS.initial.target.clone(),

  setControlsRef(ref) { set({ controlsRef: ref }) },

  setInitialPose(pos, target) {
    set({ initialPos: pos, initialTarget: target })
  },

  focusOn(camKey) {
    const ref = get().controlsRef?.current
    if (!ref) return
    const cam = CAM_POSITIONS[camKey as CamKey]
    if (!cam) return

    // Disable orbit while dollying
    ref.enabled = false
    ref.setLookAt(
      cam.pos.x,    cam.pos.y,    cam.pos.z,
      cam.target.x, cam.target.y, cam.target.z,
      true
    )
    // Re-enable tight orbit after dolly completes (~1.3s)
    setTimeout(() => {
      const r = get().controlsRef?.current
      if (!r) return
      r.enabled = true
      r.minDistance = 0.8
      r.maxDistance = 3.0
      r.minAzimuthAngle = -Math.PI * 0.25
      r.maxAzimuthAngle =  Math.PI * 0.25
    }, 1400)
  },

  restoreInitial() {
    const { controlsRef, initialPos, initialTarget } = get()
    const ref = controlsRef?.current
    if (!ref) return
    // Restore free-roam limits before animating back
    ref.enabled = true
    ref.minDistance = CAMERA_LIMITS.minDistance
    ref.maxDistance = CAMERA_LIMITS.maxDistance
    ref.minPolarAngle = CAMERA_LIMITS.minPolarAngle
    ref.maxPolarAngle = CAMERA_LIMITS.maxPolarAngle
    ref.minAzimuthAngle = CAMERA_LIMITS.minAzimuthAngle
    ref.maxAzimuthAngle = CAMERA_LIMITS.maxAzimuthAngle
    ref.setLookAt(
      initialPos.x, initialPos.y, initialPos.z,
      initialTarget.x, initialTarget.y, initialTarget.z,
      true
    )
  },
}))
