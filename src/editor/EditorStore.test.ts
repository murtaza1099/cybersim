import { describe, expect, it } from 'vitest'
import { useEditorStore } from './EditorStore'

describe('editor scene export', () => {
  it('exports hotspot camera poses in the game config shape', () => {
    useEditorStore.getState().resetToDefaults()
    useEditorStore.getState().updateHotspot(1, {
      focusCamPos: [1, 2, 3],
      focusCamTarget: [4, 5, 6],
      focusCamFov: 64,
      focusDuration: 1.7,
    })

    const config = useEditorStore.getState().exportConfig()

    expect(config.hotspots[0]).toMatchObject({
      id: 1,
      focusCam: {
        position: [1, 2, 3],
        target: [4, 5, 6],
        fov: 64,
        duration: 1.7,
      },
    })
  })
})
