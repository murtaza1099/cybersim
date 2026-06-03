import * as THREE from 'three'

export const CAM_POSITIONS = {
  initial:  { pos: new THREE.Vector3(-3.2, 2.0, 2.5), target: new THREE.Vector3(0.5, 0.9, 0.5) },
  pc:       { pos: new THREE.Vector3(-2.28, 1.85,  0.50), target: new THREE.Vector3( 1.70, 0.71,  0.62) },
  phone:    { pos: new THREE.Vector3(-1.20, 4.40,  0.85), target: new THREE.Vector3(-1.20, 3.83,  0.65) },
  landline: { pos: new THREE.Vector3(-1.40, 2.80, -1.20), target: new THREE.Vector3( 0.25, 0.95,  1.85) },
  usb:      { pos: new THREE.Vector3( 1.98, 3.60,  2.75), target: new THREE.Vector3( 1.33, 1.20,  4.34) },
  door:     { pos: new THREE.Vector3( 0.65, 3.35,  3.10), target: new THREE.Vector3( 6.35, 1.38,  1.93) },
  notepad:  { pos: new THREE.Vector3(-1.85, 1.90,  0.20), target: new THREE.Vector3(-0.50, 1.42, -0.55) },
} as const

export type CamKey = keyof typeof CAM_POSITIONS

// Maps each anchor key to its focused camera position
export const ANCHOR_TO_CAM: Record<string, CamKey> = {
  PC_MONITOR_1: 'pc',
  PC_MONITOR_2: 'pc',
  PC_MONITOR_3: 'pc',
  MOBILE_DESK:  'phone',
  DESK_PHONE:   'landline',
  WASHROOM:     'usb',
  ENTRY_DOOR:   'door',
  NOTEPAD:      'notepad',
}
