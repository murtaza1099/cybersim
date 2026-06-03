import { defaultProps, degreesToRadians, radiansToDegrees, useEditorStore } from '../EditorStore'
import { Vec3Input } from './CameraPanel'
import type { EditorMode, Vec3 } from '../types/editor.types'

export function PropPanel() {
  const prop = useEditorStore(s => s.props.find(p => p.id === s.selectedPropId))
  const mode = useEditorStore(s => s.mode)
  const setMode = useEditorStore(s => s.setMode)
  const updateProp = useEditorStore(s => s.updateProp)
  if (!prop) return null

  const setUniformScale = (scale: Vec3) => {
    const first = scale[0]
    updateProp(prop.id, { scale: [first, first, first] })
  }
  const reset = () => {
    const original = defaultProps.find(p => p.id === prop.id)
    if (original) updateProp(prop.id, original)
  }

  return (
    <>
      <section className="editor-section">
        <h2>PROP</h2>
        <div className="editor-title">{prop.id}</div>
        <div className="editor-muted">{prop.glbPath}</div>
      </section>
      <section className="editor-section">
        <h2>TRANSFORM</h2>
        <Vec3Input label="Position" value={prop.position} onChange={position => updateProp(prop.id, { position })} />
        <Vec3Input
          label="Rotation"
          value={[radiansToDegrees(prop.rotation[0]), radiansToDegrees(prop.rotation[1]), radiansToDegrees(prop.rotation[2])]}
          onChange={rotation => updateProp(prop.id, { rotation: rotation.map(degreesToRadians) as Vec3 })}
          step={1}
        />
        <Vec3Input label="Scale" value={prop.scale} onChange={scale => updateProp(prop.id, { scale })} />
        <button onClick={() => setUniformScale(prop.scale)}>LOCK UNIFORM</button>
        <label className="editor-toggle"><input type="checkbox" checked={prop.visible} onChange={event => updateProp(prop.id, { visible: event.target.checked })} /> Visible</label>
        <label className="editor-toggle"><input type="checkbox" checked={prop.castShadow} onChange={event => updateProp(prop.id, { castShadow: event.target.checked })} /> Cast shadow</label>
        <button onClick={reset}>RESET TRANSFORM</button>
      </section>
      <section className="editor-section">
        <h2>MODE</h2>
        <div className="editor-segment">
          {(['select', 'translate', 'rotate', 'scale'] as EditorMode[]).map(item => (
            <button key={item} className={mode === item ? 'active' : ''} onClick={() => setMode(item)}>{item.toUpperCase()}</button>
          ))}
        </div>
      </section>
    </>
  )
}
