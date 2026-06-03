import { degreesToRadians, radiansToDegrees, useEditorStore } from '../EditorStore'
import type { CameraLimits, StartCamera, Vec3 } from '../types/editor.types'

type Vec3InputProps = {
  label: string
  value: Vec3
  onChange: (value: Vec3) => void
  step?: number
}

export function Vec3Input({ label, value, onChange, step = 0.01 }: Vec3InputProps) {
  const update = (index: number, next: number) => {
    const copy: Vec3 = [...value]
    copy[index] = next
    onChange(copy)
  }

  return (
    <label className="editor-field editor-vec3">
      <span>{label}</span>
      {(['X', 'Y', 'Z'] as const).map((axis, index) => (
        <input
          key={axis}
          aria-label={`${label} ${axis}`}
          type="number"
          step={step}
          value={Number(value[index].toFixed(3))}
          onChange={event => update(index, Number(event.target.value))}
        />
      ))}
    </label>
  )
}

export function CameraPanel() {
  const startCamera = useEditorStore(s => s.startCamera)
  const cameraLimits = useEditorStore(s => s.cameraLimits)
  const updateStartCamera = useEditorStore(s => s.updateStartCamera)
  const updateCameraLimits = useEditorStore(s => s.updateCameraLimits)
  const captureCurrentCameraAsStart = useEditorStore(s => s.captureCurrentCameraAsStart)
  const requestCameraPreview = useEditorStore(s => s.requestCameraPreview)

  const patchStart = (patch: Partial<StartCamera>) => updateStartCamera(patch)
  const patchLimits = (patch: Partial<CameraLimits>) => updateCameraLimits(patch)

  return (
    <>
      <section className="editor-section">
        <h2>START CAMERA</h2>
        <Vec3Input label="Position" value={startCamera.position} onChange={position => patchStart({ position })} />
        <Vec3Input label="Target" value={startCamera.target} onChange={target => patchStart({ target })} />
        <label className="editor-field">
          <span>FOV</span>
          <input type="range" min={40} max={90} value={startCamera.fov} onChange={event => patchStart({ fov: Number(event.target.value) })} />
          <b>{startCamera.fov} deg</b>
        </label>
        <div className="editor-button-row">
          <button onClick={captureCurrentCameraAsStart}>CAPTURE CURRENT VIEW</button>
          <button onClick={() => requestCameraPreview(startCamera)}>PREVIEW FROM START</button>
        </div>
      </section>
      <section className="editor-section">
        <h2>CAMERA LIMITS</h2>
        <label className="editor-field">
          <span>Min Distance</span>
          <input type="number" step={0.1} value={cameraLimits.minDistance} onChange={event => patchLimits({ minDistance: Number(event.target.value) })} />
        </label>
        <label className="editor-field">
          <span>Max Distance</span>
          <input type="number" step={0.1} value={cameraLimits.maxDistance} onChange={event => patchLimits({ maxDistance: Number(event.target.value) })} />
        </label>
        <label className="editor-field">
          <span>Polar Min</span>
          <input type="number" step={1} value={radiansToDegrees(cameraLimits.minPolarAngle)} onChange={event => patchLimits({ minPolarAngle: degreesToRadians(Number(event.target.value)) })} />
        </label>
        <label className="editor-field">
          <span>Polar Max</span>
          <input type="number" step={1} value={radiansToDegrees(cameraLimits.maxPolarAngle)} onChange={event => patchLimits({ maxPolarAngle: degreesToRadians(Number(event.target.value)) })} />
        </label>
        <label className="editor-field">
          <span>Azimuth Min</span>
          <input type="number" step={1} min={-180} max={180} value={radiansToDegrees(cameraLimits.minAzimuthAngle)} onChange={event => patchLimits({ minAzimuthAngle: degreesToRadians(Number(event.target.value)) })} />
        </label>
        <label className="editor-field">
          <span>Azimuth Max</span>
          <input type="number" step={1} min={-180} max={180} value={radiansToDegrees(cameraLimits.maxAzimuthAngle)} onChange={event => patchLimits({ maxAzimuthAngle: degreesToRadians(Number(event.target.value)) })} />
        </label>
        <button onClick={() => requestCameraPreview(startCamera)}>TEST LIMITS</button>
      </section>
    </>
  )
}
