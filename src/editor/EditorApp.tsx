/*
WORKFLOW:
  1. Open /editor in development
  2. SET START VIEW:
     - Orbit to where you want the simulation to begin
     - Click "CAPTURE CURRENT VIEW" in Scene Panel
     - Click "PREVIEW FROM START" to verify
  3. PLACE PROPS:
     - Select a prop from the Scene Objects list
     - Use TRANSLATE mode to drag it to correct surface
     - Adjust rotation/scale in inspector
  4. SET HOTSPOT ANCHORS:
     - Click a hotspot in the list
     - Drag its sphere in the viewport to the correct 3D position
  5. SET FOCUS CAMERAS:
     - With hotspot selected, orbit camera to ideal focus view
     - Click "CAPTURE CURRENT VIEW AS FOCUS"
     - Click "PREVIEW FOCUS" to verify the player's experience
  6. TEST EVERYTHING:
     - Click PREVIEW to see the scene without editor UI
     - Verify start position, all hotspot positions, focus animations
  7. EXPORT:
     - Click EXPORT JSON
     - Click SAVE
     - Reload the game to see changes applied
*/
import { EditorScene } from './EditorScene'
import { useEditorStore } from './EditorStore'
import { ExportPanel } from './panels/ExportPanel'
import { InspectorPanel } from './panels/InspectorPanel'
import type { EditorMode } from './types/editor.types'
import './editor.css'

function Toolbar() {
  const mode = useEditorStore(s => s.mode)
  const setMode = useEditorStore(s => s.setMode)
  const showGrid = useEditorStore(s => s.showGrid)
  const showGizmos = useEditorStore(s => s.showGizmos)
  const showCameraFrustum = useEditorStore(s => s.showCameraFrustum)
  const previewMode = useEditorStore(s => s.previewMode)
  const isDirty = useEditorStore(s => s.isDirty)
  const toggleFlag = useEditorStore(s => s.toggleFlag)
  const setExportOpen = useEditorStore(s => s.setExportOpen)

  return (
    <div className="editor-toolbar">
      <div>
        {([
          ['select', 'SELECT'],
          ['translate', 'MOVE'],
          ['rotate', 'ROTATE'],
          ['scale', 'SCALE'],
        ] as Array<[EditorMode, string]>).map(([value, label]) => (
          <button key={value} className={mode === value ? 'active' : ''} onClick={() => setMode(value)}>{label}</button>
        ))}
      </div>
      <div className="editor-scene-title">CYBERSIM // LEVEL 01 EDITOR {isDirty ? '*' : ''}</div>
      <div>
        <button className={showGrid ? 'active' : ''} onClick={() => toggleFlag('showGrid')}>GRID</button>
        <button className={showGizmos ? 'active' : ''} onClick={() => toggleFlag('showGizmos')}>GIZMOS</button>
        <button className={showCameraFrustum ? 'active' : ''} onClick={() => toggleFlag('showCameraFrustum')}>FRUSTUM</button>
        <button className={previewMode ? 'active' : ''} onClick={() => toggleFlag('previewMode')}>PREVIEW</button>
        <button onClick={() => setExportOpen(true)}>EXPORT JSON</button>
      </div>
    </div>
  )
}

export default function EditorApp() {
  const previewMode = useEditorStore(s => s.previewMode)

  if (!import.meta.env.DEV) {
    return <div className="editor-dev-guard">The Cybersim scene editor is available in development only.</div>
  }

  return (
    <main className="cybersim-editor">
      <section className="editor-viewport">
        {!previewMode && <Toolbar />}
        <EditorScene />
      </section>
      {!previewMode && <InspectorPanel />}
      <ExportPanel />
    </main>
  )
}
