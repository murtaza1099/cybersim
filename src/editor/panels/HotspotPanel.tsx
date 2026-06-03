import { useEditorStore } from '../EditorStore'
import { Vec3Input } from './CameraPanel'
import type { HotspotState } from '../types/editor.types'

export function HotspotPanel() {
  const hotspot = useEditorStore(s => s.hotspots.find(h => h.id === s.selectedHotspotId))
  const hotspots = useEditorStore(s => s.hotspots)
  const updateHotspot = useEditorStore(s => s.updateHotspot)
  const captureCurrentCameraAsFocus = useEditorStore(s => s.captureCurrentCameraAsFocus)
  const requestCameraPreview = useEditorStore(s => s.requestCameraPreview)
  if (!hotspot) return null

  return (
    <>
      <section className="editor-section">
        <h2>HOTSPOT #{hotspot.id}</h2>
        <div className="editor-title">{hotspot.label}</div>
      </section>
      <section className="editor-section">
        <h2>IDENTITY</h2>
        <label className="editor-field"><span>Label</span><input value={hotspot.label} onChange={event => updateHotspot(hotspot.id, { label: event.target.value })} /></label>
        <label className="editor-field"><span>Attack ID</span><input value={hotspot.attackId} onChange={event => updateHotspot(hotspot.id, { attackId: event.target.value })} /></label>
        <label className="editor-field">
          <span>State</span>
          <select value={hotspot.state} onChange={event => updateHotspot(hotspot.id, { state: event.target.value as HotspotState })}>
            <option value="unlocked">unlocked</option>
            <option value="locked">locked</option>
            <option value="completed">completed</option>
          </select>
        </label>
        <label className="editor-toggle"><input type="checkbox" checked={hotspot.visible} onChange={event => updateHotspot(hotspot.id, { visible: event.target.checked })} /> Visible</label>
      </section>
      <section className="editor-section">
        <h2>ANCHOR POSITION</h2>
        <Vec3Input label="Anchor" value={hotspot.anchorPosition} onChange={anchorPosition => updateHotspot(hotspot.id, { anchorPosition })} />
        <div className="editor-muted">Drag the sphere in the viewport for rough placement, then tune here.</div>
      </section>
      <section className="editor-section">
        <h2>FOCUS CAMERA</h2>
        <Vec3Input label="Position" value={hotspot.focusCamPos} onChange={focusCamPos => updateHotspot(hotspot.id, { focusCamPos })} />
        <Vec3Input label="Target" value={hotspot.focusCamTarget} onChange={focusCamTarget => updateHotspot(hotspot.id, { focusCamTarget })} />
        <label className="editor-field"><span>FOV</span><input type="range" min={40} max={80} value={hotspot.focusCamFov} onChange={event => updateHotspot(hotspot.id, { focusCamFov: Number(event.target.value) })} /><b>{hotspot.focusCamFov} deg</b></label>
        <label className="editor-field"><span>Duration</span><input type="range" min={0.5} max={3} step={0.1} value={hotspot.focusDuration} onChange={event => updateHotspot(hotspot.id, { focusDuration: Number(event.target.value) })} /><b>{hotspot.focusDuration.toFixed(1)}s</b></label>
        <div className="editor-button-row">
          <button onClick={() => captureCurrentCameraAsFocus(hotspot.id)}>CAPTURE CURRENT VIEW AS FOCUS</button>
          <button onClick={() => requestCameraPreview({ position: hotspot.focusCamPos, target: hotspot.focusCamTarget, fov: hotspot.focusCamFov })}>PREVIEW FOCUS</button>
        </div>
      </section>
      <section className="editor-section">
        <h2>UNLOCK CONFIG</h2>
        <label className="editor-field">
          <span>Unlocks after</span>
          <select value={hotspot.unlockAfter ?? ''} onChange={event => updateHotspot(hotspot.id, { unlockAfter: event.target.value ? Number(event.target.value) : null })}>
            <option value="">None</option>
            {hotspots.filter(h => h.id !== hotspot.id).map(h => <option key={h.id} value={h.id}>{h.id}</option>)}
          </select>
        </label>
      </section>
    </>
  )
}
