import * as THREE from 'three'

export const ANCHORS = {
  // PC monitor — triangle spread so annotation bubbles don't overlap
  // Base B = (0.52, 1.16, 0.37); offsets form left/center-high/right triangle
  PC_MONITOR_1: new THREE.Vector3( 0.17, 1.36,  0.37),  // left   — Phishing Email
  PC_MONITOR_2: new THREE.Vector3( 0.52, 1.61,  0.37),  // center-high — Fake Update
  PC_MONITOR_3: new THREE.Vector3( 0.87, 1.36,  0.37),  // right  — LinkedIn

  // Individual props
  MOBILE_DESK:  new THREE.Vector3(-0.85, 0.78, -0.45),
  DESK_PHONE:   new THREE.Vector3(-0.10, 1.05,  1.90),

  // Room fixtures
  WASHROOM:     new THREE.Vector3( 1.33, 1.20,  4.34),
  ENTRY_DOOR:   new THREE.Vector3( 4.35, 1.38,  3.28),

  // Desk notepad
  NOTEPAD:      new THREE.Vector3(-0.50, 0.82, -0.55),
} as const

export type AnchorKey = keyof typeof ANCHORS
