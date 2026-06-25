import { type ChangeEvent } from 'react'
import { exportData, importData } from '../db'
import type { ExportPayload } from '../types'

interface ExportPanelProps {
  onImported: () => Promise<void>
}

export function ExportPanel({ onImported }: ExportPanelProps) {
  async function handleExport() {
    const payload = await exportData()
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `c20-horarios-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const payload = JSON.parse(text) as ExportPayload

      if (!payload.subjects || !payload.activities || !payload.schedule) {
        throw new Error('Archivo inválido')
      }

      await importData({
        programs: payload.programs,
        subjects: payload.subjects,
        activities: payload.activities,
        schedule: payload.schedule,
        daySettings: payload.daySettings,
      })
      await onImported()
      event.target.value = ''
    } catch {
      window.alert('No se pudo importar el archivo. Verifica que sea un JSON exportado por esta app.')
      event.target.value = ''
    }
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2>Exportar e importar</h2>
          <p>Guarda una copia de respaldo o muévela a otra computadora.</p>
        </div>
      </header>

      <div className="export-actions">
        <button type="button" onClick={() => void handleExport()}>
          Descargar JSON
        </button>
        <label className="file-button">
          Importar JSON
          <input type="file" accept="application/json,.json" onChange={(event) => void handleImport(event)} />
        </label>
      </div>

      <p className="hint">
        Los datos se guardan localmente en tu navegador (IndexedDB). El JSON te permite respaldarlos
        o, más adelante, cargarlos en una versión web publicada.
      </p>
    </section>
  )
}
