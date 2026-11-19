import { type ChangeEvent } from 'react'
import { exportData, importData } from '../db'
import type { FormatoC20, ImportPayload, ScheduleEntry } from '../types'
import { FormatoC20Form } from './FormatoC20Form'

interface ExportPanelProps {
  formato: FormatoC20
  schedule: ScheduleEntry[]
  onUpdateFormato: (next: FormatoC20) => Promise<void>
  onImported: () => Promise<void>
}

export function ExportPanel({
  formato,
  schedule,
  onUpdateFormato,
  onImported,
}: ExportPanelProps) {
  async function handleExport() {
    const payload = await exportData()
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    anchor.href = url
    anchor.download = `c20-horarios-${date}-v6.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const payload = JSON.parse(text) as ImportPayload

      if (!payload.subjects || !payload.activities || !payload.schedule) {
        throw new Error('Archivo inválido')
      }

      await importData({
        programs: payload.programs,
        subjects: payload.subjects,
        activities: payload.activities,
        schedule: payload.schedule,
        daySettings: payload.daySettings,
        formato: payload.formato,
      })
      await onImported()
      event.target.value = ''
    } catch {
      window.alert('No se pudo importar el archivo. Verifica que sea un JSON exportado por esta app.')
      event.target.value = ''
    }
  }

  return (
    <>
      <section className="panel formato-export-panel">
        <header className="panel-header">
          <div>
            <h2>Exportar e importar</h2>
            <p>Guarda una copia de respaldo o muévela a otra computadora (JSON versión 6).</p>
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
          Los datos se guardan localmente en tu navegador (IndexedDB). El JSON incluye el horario y
          los datos del formato C-20.
        </p>
      </section>

      <FormatoC20Form formato={formato} schedule={schedule} onUpdate={onUpdateFormato} />
    </>
  )
}