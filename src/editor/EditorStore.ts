import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CameraLimits, CameraPose, EditorMode, HotspotConfig, PropObject, SceneConfig, StartCamera, Vec3 } from './types/editor.types'

const deg = Math.PI / 180

export const defaultProps: PropObject[] = [
  { id: 'phone', glbPath: '/Smartphone.glb', position: [-0.75, 0.78, -0.25], rotation: [-1.57, 6.28, 0], scale: [1.15, 1.15, 1.15], visible: true, castShadow: true },
  { id: 'telephone', glbPath: '/Telephone.glb', position: [-0.15, 0.9, 1.9], rotation: [0, 3.8, 0], scale: [0.35, 0.35, 0.35], visible: true, castShadow: true },
  { id: 'usb', glbPath: '/usb_memory.glb', position: [1.2, 1.13, 4.35], rotation: [0, 4.7, 0], scale: [0.1, 0.1, 0.1], visible: true, castShadow: true },
  { id: 'whiteboard', glbPath: '/Whiteboard.glb', position: [4.09, 1.75, -0.1], rotation: [0, 4.75, 0], scale: [1.75, 1.75, 1.75], visible: true, castShadow: true },
  { id: 'box', glbPath: '/Box.glb', position: [4.85, 0.04, 3.27], rotation: [0, 0, 0], scale: [1.4687875223324514, 1, 1], visible: true, castShadow: true },
  { id: 'holder', glbPath: '/DeskOrganizer.glb', position: [0.23, 0.53, -0.15], rotation: [0, 4.15, 0], scale: [0.5, 0.5, 0.5], visible: true, castShadow: true },
]

export const defaultHotspots: HotspotConfig[] = [
  { id: 1, label: 'Main Workstation', attackId: 'ATK_001', anchorPosition: [-0.45, 1.36, 0.37], focusCamPos: [-1.65, 1.42, 0.42], focusCamTarget: [1.7, 0.71, 0.62], focusCamFov: 55, focusDuration: 1.2, state: 'unlocked', visible: true, unlockAfter: null },
  { id: 2, label: "John's Workstation", attackId: 'ATK_002', anchorPosition: [0.92, 1.28, 0.37], focusCamPos: [2.28, 1.42, 0.69], focusCamTarget: [1.25, 1.44, 0.58], focusCamFov: 56, focusDuration: 1.2, state: 'unlocked', visible: true, unlockAfter: null },
  { id: 3, label: 'Designer PC', attackId: 'ATK_003', anchorPosition: [0.47, 0.84, -2.11], focusCamPos: [2.42, 1.51, -1.86], focusCamTarget: [0.93, 0.58, -1.8], focusCamFov: 54, focusDuration: 1.2, state: 'unlocked', visible: true, unlockAfter: null },
  { id: 4, label: 'Personal Phone', attackId: 'ATK_004', anchorPosition: [-0.85, 0.78, -0.45], focusCamPos: [-1.12, 4.47, 0.91], focusCamTarget: [-1.08, 3.99, 0.72], focusCamFov: 55, focusDuration: 1.2, state: 'unlocked', visible: true, unlockAfter: null },
  { id: 5, label: 'Office Landline', attackId: 'ATK_005', anchorPosition: [-0.1, 1.05, 1.9], focusCamPos: [-1.49, 2.8, -1.09], focusCamTarget: [0.32, 0.9, 1.95], focusCamFov: 55, focusDuration: 1.2, state: 'unlocked', visible: true, unlockAfter: null },
  { id: 6, label: 'Unknown USB / Finance PC', attackId: 'ATK_006', anchorPosition: [1.33, 1.2, 4.34], focusCamPos: [1.96, 3.62, 2.74], focusCamTarget: [1.46, 1.62, 4.34], focusCamFov: 55, focusDuration: 1.2, state: 'locked', visible: true, unlockAfter: null },
  { id: 7, label: 'Office Door', attackId: 'ATK_007', anchorPosition: [4.35, 1.38, 3.28], focusCamPos: [0.65, 3.35, 3.1], focusCamTarget: [6.21, 1.26, 2.39], focusCamFov: 55, focusDuration: 1.2, state: 'locked', visible: true, unlockAfter: null },
  { id: 8, label: 'Admin Workstation', attackId: 'ATK_008', anchorPosition: [-0.35, 0.97, -1.86], focusCamPos: [-1.94, 1.63, -0.45], focusCamTarget: [-0.68, 1.21, -1.76], focusCamFov: 55, focusDuration: 1.2, state: 'locked', visible: true, unlockAfter: 6 },
]

const defaultStartCamera: StartCamera = { position: [-8.72, 2, 2.49], target: [0.5, 0.9, 0.5], fov: 56 }
const defaultCameraLimits: CameraLimits = {
  minDistance: 0.5,
  maxDistance: 9.5,
  minPolarAngle: 0.7086036763096978,
  maxPolarAngle: 1.7139133254584316,
  minAzimuthAngle: -1.361356816555577,
  maxAzimuthAngle: 1.8675022996339325,
}

type EditorState = {
  props: PropObject[]
  hotspots: HotspotConfig[]
  startCamera: StartCamera
  cameraLimits: CameraLimits
  selectedPropId: string | null
  selectedHotspotId: number | null
  mode: EditorMode
  showGrid: boolean
  showGizmos: boolean
  showCameraFrustum: boolean
  previewMode: boolean
  isDirty: boolean
  currentCamera: CameraPose
  requestedCamera: CameraPose | null
  exportOpen: boolean
  selectProp: (id: string | null) => void
  selectHotspot: (id: number | null) => void
  setMode: (mode: EditorMode) => void
  setCurrentCamera: (pose: CameraPose) => void
  requestCameraPreview: (pose: CameraPose) => void
  clearCameraRequest: () => void
  setExportOpen: (open: boolean) => void
  setFlag: (key: 'showGrid' | 'showGizmos' | 'showCameraFrustum' | 'previewMode', value: boolean) => void
  updateProp: (id: string, patch: Partial<PropObject>) => void
  updateHotspot: (id: number, patch: Partial<HotspotConfig>) => void
  updateStartCamera: (patch: Partial<StartCamera>) => void
  updateCameraLimits: (patch: Partial<CameraLimits>) => void
  toggleFlag: (key: 'showGrid' | 'showGizmos' | 'showCameraFrustum' | 'previewMode') => void
  captureCurrentCameraAsFocus: (hotspotId: number) => void
  captureCurrentCameraAsStart: () => void
  exportConfig: () => SceneConfig
  resetToDefaults: () => void
}

const cloneVec3 = (v: Vec3): Vec3 => [v[0], v[1], v[2]]
const cloneProp = (p: PropObject): PropObject => ({ ...p, position: cloneVec3(p.position), rotation: cloneVec3(p.rotation), scale: cloneVec3(p.scale) })
const cloneHotspot = (h: HotspotConfig): HotspotConfig => ({ ...h, anchorPosition: cloneVec3(h.anchorPosition), focusCamPos: cloneVec3(h.focusCamPos), focusCamTarget: cloneVec3(h.focusCamTarget) })

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      props: defaultProps.map(cloneProp),
      hotspots: defaultHotspots.map(cloneHotspot),
      startCamera: { ...defaultStartCamera },
      cameraLimits: { ...defaultCameraLimits },
      selectedPropId: null,
      selectedHotspotId: null,
      mode: 'select',
      showGrid: true,
      showGizmos: true,
      showCameraFrustum: true,
      previewMode: false,
      isDirty: false,
      currentCamera: { ...defaultStartCamera },
      requestedCamera: null,
      exportOpen: false,
      selectProp: id => set({ selectedPropId: id, selectedHotspotId: null }),
      selectHotspot: id => set({ selectedHotspotId: id, selectedPropId: null }),
      setMode: mode => set({ mode }),
      setCurrentCamera: currentCamera => set({ currentCamera }),
      requestCameraPreview: requestedCamera => set({ requestedCamera }),
      clearCameraRequest: () => set({ requestedCamera: null }),
      setExportOpen: exportOpen => set({ exportOpen }),
      setFlag: (key, value) => set({ [key]: value } as Pick<EditorState, typeof key>),
      toggleFlag: key => set(state => ({ [key]: !state[key] } as Pick<EditorState, typeof key>)),
      updateProp: (id, patch) => set(state => ({ props: state.props.map(prop => prop.id === id ? { ...prop, ...patch } : prop), isDirty: true })),
      updateHotspot: (id, patch) => set(state => ({ hotspots: state.hotspots.map(h => h.id === id ? { ...h, ...patch } : h), isDirty: true })),
      updateStartCamera: patch => set(state => ({ startCamera: { ...state.startCamera, ...patch }, isDirty: true })),
      updateCameraLimits: patch => set(state => ({ cameraLimits: { ...state.cameraLimits, ...patch }, isDirty: true })),
      captureCurrentCameraAsFocus: hotspotId => {
        const cam = get().currentCamera
        get().updateHotspot(hotspotId, {
          focusCamPos: cloneVec3(cam.position),
          focusCamTarget: cloneVec3(cam.target),
          focusCamFov: cam.fov,
        })
      },
      captureCurrentCameraAsStart: () => {
        const cam = get().currentCamera
        get().updateStartCamera({ position: cloneVec3(cam.position), target: cloneVec3(cam.target), fov: cam.fov })
      },
      exportConfig: () => {
        const { startCamera, cameraLimits, props, hotspots } = get()
        return {
          startCamera,
          cameraLimits,
          props,
          hotspots: hotspots.map(h => ({
            id: h.id,
            label: h.label,
            attackId: h.attackId,
            anchorPosition: h.anchorPosition,
            focusCam: {
              position: h.focusCamPos,
              target: h.focusCamTarget,
              fov: h.focusCamFov,
              duration: h.focusDuration,
            },
            state: h.state,
            visible: h.visible,
            unlockAfter: h.unlockAfter,
          })),
        }
      },
      resetToDefaults: () => set({
        props: defaultProps.map(cloneProp),
        hotspots: defaultHotspots.map(cloneHotspot),
        startCamera: { ...defaultStartCamera },
        cameraLimits: { ...defaultCameraLimits },
        selectedPropId: null,
        selectedHotspotId: null,
        mode: 'select',
        showGrid: true,
        showGizmos: true,
        showCameraFrustum: true,
        previewMode: false,
        isDirty: false,
        currentCamera: { ...defaultStartCamera },
        requestedCamera: null,
      }),
    }),
    {
      name: 'cybersim-editor-state',
      partialize: state => ({
        props: state.props,
        hotspots: state.hotspots,
        startCamera: state.startCamera,
        cameraLimits: state.cameraLimits,
        showGrid: state.showGrid,
        showGizmos: state.showGizmos,
        showCameraFrustum: state.showCameraFrustum,
      }),
    },
  ),
)

export const radiansToDegrees = (value: number) => Math.round((value / deg) * 100) / 100
export const degreesToRadians = (value: number) => value * deg
