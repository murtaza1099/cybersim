import * as THREE from 'three'
import rawSceneConfig from './sceneConfig.json'
import type { SceneConfig, Vec3 } from '@/editor/types/editor.types'

const sceneConfig = rawSceneConfig as SceneConfig

const hotspotById = Object.fromEntries(sceneConfig.hotspots.map(h => [h.id, h]))
const propById = Object.fromEntries(sceneConfig.props.map(p => [p.id, p]))
const vec3 = (value: Vec3) => value

export const SCENE_PROPS = sceneConfig.props
export const START_CAMERA = sceneConfig.startCamera
// Azimuth is unbounded so the camera spins a full, seamless circle (no hard stop
// at the ±180° seam). JSON can't hold Infinity, so it's applied here instead.
export const CAMERA_LIMITS = {
  ...sceneConfig.cameraLimits,
  minAzimuthAngle: -Infinity,
  maxAzimuthAngle: Infinity,
}

export const ANCHORS = {
  PC_MONITOR_1: new THREE.Vector3(...hotspotById[1].anchorPosition),
  PC_MONITOR_2: new THREE.Vector3(...hotspotById[2].anchorPosition),
  PC_MONITOR_3: new THREE.Vector3(...hotspotById[3].anchorPosition),
  MOBILE_DESK: new THREE.Vector3(...hotspotById[4].anchorPosition),
  DESK_PHONE: new THREE.Vector3(...hotspotById[5].anchorPosition),
  WASHROOM: new THREE.Vector3(...hotspotById[6].anchorPosition),
  ENTRY_DOOR: new THREE.Vector3(...hotspotById[7].anchorPosition),
  NOTEPAD: new THREE.Vector3(...hotspotById[8].anchorPosition),
  ...Object.fromEntries(
    sceneConfig.hotspots.map(h => [`HOTSPOT_${h.id}`, new THREE.Vector3(...h.anchorPosition)]),
  ),
} as const

export const CAM_POSITIONS = {
  initial: {
    pos: new THREE.Vector3(...sceneConfig.startCamera.position),
    target: new THREE.Vector3(...sceneConfig.startCamera.target),
    fov: sceneConfig.startCamera.fov,
    duration: 0,
  },
  pc: {
    pos: new THREE.Vector3(...hotspotById[1].focusCam.position),
    target: new THREE.Vector3(...hotspotById[1].focusCam.target),
    fov: hotspotById[1].focusCam.fov,
    duration: hotspotById[1].focusCam.duration,
  },
  phone: {
    pos: new THREE.Vector3(...hotspotById[4].focusCam.position),
    target: new THREE.Vector3(...hotspotById[4].focusCam.target),
    fov: hotspotById[4].focusCam.fov,
    duration: hotspotById[4].focusCam.duration,
  },
  landline: {
    pos: new THREE.Vector3(...hotspotById[5].focusCam.position),
    target: new THREE.Vector3(...hotspotById[5].focusCam.target),
    fov: hotspotById[5].focusCam.fov,
    duration: hotspotById[5].focusCam.duration,
  },
  usb: {
    pos: new THREE.Vector3(...hotspotById[6].focusCam.position),
    target: new THREE.Vector3(...hotspotById[6].focusCam.target),
    fov: hotspotById[6].focusCam.fov,
    duration: hotspotById[6].focusCam.duration,
  },
  door: {
    pos: new THREE.Vector3(...hotspotById[7].focusCam.position),
    target: new THREE.Vector3(...hotspotById[7].focusCam.target),
    fov: hotspotById[7].focusCam.fov,
    duration: hotspotById[7].focusCam.duration,
  },
  notepad: {
    pos: new THREE.Vector3(...hotspotById[8].focusCam.position),
    target: new THREE.Vector3(...hotspotById[8].focusCam.target),
    fov: hotspotById[8].focusCam.fov,
    duration: hotspotById[8].focusCam.duration,
  },
  ...Object.fromEntries(
    sceneConfig.hotspots.map(h => [
      `HOTSPOT_${h.id}`,
      {
        pos: new THREE.Vector3(...h.focusCam.position),
        target: new THREE.Vector3(...h.focusCam.target),
        fov: h.focusCam.fov,
        duration: h.focusCam.duration,
      },
    ]),
  ),
} as const

const toLegacyScale = (scale: number[]) => scale[0] === scale[1] && scale[1] === scale[2] ? scale[0] : scale

export const PROP_POSITIONS = {
  phone: { position: propById.phone.position, rotation: propById.phone.rotation, scale: toLegacyScale(propById.phone.scale) },
  telephone: { position: propById.telephone.position, rotation: propById.telephone.rotation, scale: toLegacyScale(propById.telephone.scale) },
  usb: { position: propById.usb.position, rotation: propById.usb.rotation, scale: toLegacyScale(propById.usb.scale) },
  whiteboard: { position: propById.whiteboard.position, rotation: propById.whiteboard.rotation, scale: toLegacyScale(propById.whiteboard.scale) },
  box: { position: propById.box.position, rotation: propById.box.rotation, scale: toLegacyScale(propById.box.scale) },
  holder: { position: propById.holder.position, rotation: propById.holder.rotation, scale: toLegacyScale(propById.holder.scale) },
} as const

export const ANCHOR_TO_CAM: Record<string, keyof typeof CAM_POSITIONS> = {
  PC_MONITOR_1: 'pc',
  PC_MONITOR_2: 'pc',
  PC_MONITOR_3: 'pc',
  MOBILE_DESK: 'phone',
  DESK_PHONE: 'landline',
  WASHROOM: 'usb',
  ENTRY_DOOR: 'door',
  NOTEPAD: 'notepad',
}
