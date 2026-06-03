import { useState } from 'react'
import { useEditorStore } from '../EditorStore'

export function ExportPanel() {
  const open = useEditorStore(s => s.exportOpen)
  const setExportOpen = useEditorStore(s => s.setExportOpen)
  const exportConfig = useEditorStore(s => s.exportConfig)
  const [status, setStatus] = useState('')

  if (!open) return null
  const json = JSON.stringify(exportConfig(), null, 2)

  const copy = async () => {
    await navigator.clipboard.writeText(json)
    setStatus('Copied.')
  }

  const save = async () => {
    const response = await fetch('/editor/save-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: exportConfig() }),
    })
    if (!response.ok) {
      setStatus('Save failed. Is the dev server running?')
      return
    }
    setStatus('Saved! Reload the game to apply changes.')
  }

  return (
    <div className="editor-export-backdrop">
      <aside className="editor-export-panel">
        <header>
          <h2>EXPORT JSON</h2>
          <button onClick={() => setExportOpen(false)}>CLOSE</button>
        </header>
        <pre>{json}</pre>
        <div className="editor-button-row">
          <button onClick={copy}>COPY TO CLIPBOARD</button>
          <button onClick={save}>SAVE TO src/config/sceneConfig.json</button>
        </div>
        {status && <div className={status.startsWith('Saved') ? 'editor-status good' : 'editor-status'}>{status}</div>}
      </aside>
    </div>
  )
}
