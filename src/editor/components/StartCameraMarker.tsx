import { Html } from '@react-three/drei'
import { useEditorStore } from '../EditorStore'

export function StartCameraMarker() {
  const startCamera = useEditorStore(s => s.startCamera)
  const selectProp = useEditorStore(s => s.selectProp)
  const selectHotspot = useEditorStore(s => s.selectHotspot)
  const previewMode = useEditorStore(s => s.previewMode)

  if (previewMode) return null

  return (
    <Html position={startCamera.position} center>
      <button
        className="editor-camera-marker"
        onClick={() => {
          selectProp(null)
          selectHotspot(null)
        }}
        title="Start camera"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7.5h11.5v9H4z" />
          <path d="m15.5 10 4.5-2.5v9L15.5 14z" />
        </svg>
      </button>
    </Html>
  )
}
