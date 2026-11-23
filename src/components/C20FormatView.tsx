import { useEffect, useMemo, useState, useTransition } from 'react'
import { buildC20Html, printC20 } from '../lib/c20-pdf.js'
import type {
  AcademicActivity,
  DayWorkSettings,
  ExportPayload,
  FormatoC20,
  ScheduleEntry,
  StudyProgram,
  Subject,
} from '../types'
import { useAppDataContext } from '../context/AppDataContext'
import { getStoredFormato } from '../db'
import { buildExportPayload } from '../utils/exportPayload'
import {
  defaultFormato,
  isFormatoHeaderIncomplete,
  mergeFormato,
  totalScheduleHours,
} from '../utils/formato'
import { roundHours } from '../utils/hours'
import { countEntriesMissingStartTime } from '../utils/timetable'

interface C20FormatViewProps {
  programs: StudyProgram[]
  subjects: Subject[]
  activities: AcademicActivity[]
  schedule: ScheduleEntry[]
  daySettings: DayWorkSettings[]
  onOpenDatosTab: () => void
}

/** Ajusta el HTML de pantalla del formato para caber en el iframe de vista previa. */
function buildPreviewHtml(payload: ExportPayload): string {
  const html = buildC20Html(payload)
  const previewCss = `<style id="c20-preview-fit">
@media screen {
  html, body { background: #fff !important; padding: 0 !important; margin: 0 !important; overflow: hidden !important; }
  .hoja {
    width: 100% !important;
    height: auto !important;
    min-height: 100%;
    padding: 3mm !important;
    margin: 0 !important;
    box-shadow: none !important;
  }
}
</style>`
  return html.includes('</head>') ? html.replace('</head>', `${previewCss}</head>`) : html
}

export function C20FormatView({
  programs,
  subjects,
  activities,
  schedule,
  daySettings,
  onOpenDatosTab,
}: C20FormatViewProps) {
  const { formato: hookFormato } = useAppDataContext()
  const [storedFormato, setStoredFormato] = useState<FormatoC20 | null>(null)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewError, setPreviewError] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let active = true
    void getStoredFormato().then((stored) => {
      if (active) setStoredFormato(mergeFormato(stored))
    })
    return () => {
      active = false
    }
  }, [])

  const formato = useMemo(() => {
    const fromContext = mergeFormato(hookFormato ?? defaultFormato())
    if (!isFormatoHeaderIncomplete(fromContext)) return fromContext
    if (storedFormato) {
      const fromDb = mergeFormato(storedFormato)
      if (!isFormatoHeaderIncomplete(fromDb)) return fromDb
    }
    return fromContext
  }, [hookFormato, storedFormato])

  const exportPayload = useMemo(
    () =>
      buildExportPayload({
        programs,
        subjects,
        activities,
        schedule,
        daySettings,
        formato,
      }),
    [programs, subjects, activities, schedule, daySettings, formato],
  )

  useEffect(() => {
    setPreviewError('')
    const handle = window.setTimeout(() => {
      startTransition(() => {
        try {
          setPreviewHtml(buildPreviewHtml(exportPayload))
        } catch (error) {
          setPreviewHtml('')
          setPreviewError(
            error instanceof Error ? error.message : 'No se pudo generar la vista previa.',
          )
        }
      })
    }, 0)
    return () => window.clearTimeout(handle)
  }, [exportPayload])

  const scheduleTotal = useMemo(() => totalScheduleHours(schedule), [schedule])
  const missingStartCount = useMemo(() => countEntriesMissingStartTime(schedule), [schedule])
  const nombramiento = roundHours(formato.docente.horasNombramiento)
  const hoursMismatch = schedule.length > 0 && nombramiento !== scheduleTotal

  function handlePrint() {
    printC20(exportPayload)
  }

  if (schedule.length === 0) {
    return (
      <section className="panel">
        <header className="panel-header">
          <div>
            <h2>Paso 4: Formato C-20</h2>
            <p>Primero construye tu horario en el paso 1.</p>
          </div>
        </header>
      </section>
    )
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2>Paso 4: Formato C-20</h2>
          <p>Vista previa del formato oficial listo para imprimir o guardar como PDF.</p>
        </div>
        <div className="c20-print-actions">
          <button type="button" onClick={handlePrint}>
            Imprimir / Guardar PDF
          </button>
          <p className="hint c20-print-hint">
            En el diálogo elige &quot;Guardar como PDF&quot;, tamaño Carta, escala 100 % y desactiva
            &quot;Encabezados y pies de página&quot;.
          </p>
        </div>
      </header>

      {missingStartCount > 0 && (
        <p className="message error">
          Hay {missingStartCount} bloque(s) sin hora de inicio. Completa el paso 2; esos bloques no
          aparecerán en el formato hasta que tengan horario.
        </p>
      )}

      {isFormatoHeaderIncomplete(formato) && (
        <p className="message error">
          Faltan datos del formato (nombre, R.F.C., periodo o fecha de llenado).{' '}
          <button type="button" className="link" onClick={onOpenDatosTab}>
            Completar en Datos
          </button>
        </p>
      )}

      {hoursMismatch && (
        <p className="message error">
          Las horas de nombramiento ({nombramiento}) no coinciden con la suma del horario (
          {scheduleTotal}).
        </p>
      )}

      {previewError && <p className="message error">{previewError}</p>}

      <div className="c20-preview-frame">
        {isPending && !previewHtml && <p className="hint c20-preview-loading">Generando vista previa…</p>}
        {previewHtml && (
          <iframe
            title="Vista previa Formato C-20"
            srcDoc={previewHtml}
            className="c20-preview-iframe"
            loading="lazy"
            sandbox="allow-same-origin"
          />
        )}
      </div>
    </section>
  )
}