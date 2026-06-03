import { useEditorStore } from '../EditorStore'
import { CameraPanel } from './CameraPanel'
import { HotspotPanel } from './HotspotPanel'
import { PropPanel } from './PropPanel'

function ScenePanel() {
  const props = useEditorStore(s => s.props)
  const hotspots = useEditorStore(s => s.hotspots)
  const selectProp = useEditorStore(s => s.selectProp)
  const selectHotspot = useEditorStore(s => s.selectHotspot)
  const updateProp = useEditorStore(s => s.updateProp)
  const updateHotspot = useEditorStore(s => s.updateHotspot)

  return (
    <>
      <CameraPanel />
      <section className="editor-section">
        <h2>SCENE OBJECTS</h2>
        <div className="editor-list">
          {props.map(prop => (
            <button key={prop.id} onClick={() => selectProp(prop.id)}>
              <input type="checkbox" checked={prop.visible} onClick={event => event.stopPropagation()} onChange={event => updateProp(prop.id, { visible: event.target.checked })} />
              <span>{prop.id}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="editor-section">
        <h2>HOTSPOT LIST</h2>
        <div className="editor-list">
          {hotspots.map(h => (
            <button key={h.id} onClick={() => selectHotspot(h.id)}>
              <strong>{h.id}</strong>
              <span>{h.label}</span>
              <select value={h.state} onClick={event => event.stopPropagation()} onChange={event => updateHotspot(h.id, { state: event.target.value as typeof h.state })}>
                <option value="unlocked">unlocked</option>
                <option value="locked">locked</option>
                <option value="completed">completed</option>
              </select>
              <input type="checkbox" checked={h.visible} onClick={event => event.stopPropagation()} onChange={event => updateHotspot(h.id, { visible: event.target.checked })} />
            </button>
          ))}
        </div>
      </section>
    </>
  )
}

export function InspectorPanel() {
  const selectedPropId = useEditorStore(s => s.selectedPropId)
  const selectedHotspotId = useEditorStore(s => s.selectedHotspotId)

  return (
    <aside className="editor-inspector">
      {selectedPropId && <PropPanel />}
      {selectedHotspotId && <HotspotPanel />}
      {!selectedPropId && !selectedHotspotId && <ScenePanel />}
    </aside>
  )
}
