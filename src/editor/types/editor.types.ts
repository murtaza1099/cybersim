export type Vec3 = [number, number, number]

export type PropObject = {
  id: string
  glbPath: string
  position: Vec3
  rotation: Vec3
  scale: Vec3
  visible: boolean
  castShadow: boolean
}

export type HotspotState = 'unlocked' | 'locked' | 'completed'

export type HotspotConfig = {
  id: number
  label: string
  attackId: string
  anchorPosition: Vec3
  focusCamPos: Vec3
  focusCamTarget: Vec3
  focusCamFov: number
  focusDuration: number
  state: HotspotState
  visible: boolean
  unlockAfter: number | null
}

export type StartCamera = {
  position: Vec3
  target: Vec3
  fov: number
}

export type CameraLimits = {
  minDistance: number
  maxDistance: number
  minPolarAngle: number
  maxPolarAngle: number
  minAzimuthAngle: number
  maxAzimuthAngle: number
}

export type EditorMode = 'select' | 'translate' | 'rotate' | 'scale'

export type FocusCameraConfig = {
  position: Vec3
  target: Vec3
  fov: number
  duration: number
}

export type SceneConfig = {
  startCamera: StartCamera
  cameraLimits: CameraLimits
  props: PropObject[]
  hotspots: Array<{
    id: number
    label: string
    attackId: string
    anchorPosition: Vec3
    focusCam: FocusCameraConfig
    state: HotspotState
    visible: boolean
    unlockAfter: number | null
  }>
}

export type CameraPose = {
  position: Vec3
  target: Vec3
  fov: number
}
