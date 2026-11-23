import { useMemo } from 'react'
import { useAppDataContext } from '../context/AppDataContext'
import type { FormatoC20 } from '../types'
import { DAYS, type AcademicActivity, type ScheduleEntry, type StudyProgram, type Subject } from '../types'
import { totalScheduleHours } from '../utils/formato'
import {
  buildTimetableCsv,
  buildTimetableRows,
  countEntriesMissingStartTime,
  DAY_COLUMN_LABELS,
  formatTotalHoursCell,
} from '../utils/timetable'

interface TimetableViewProps {
  schedule: ScheduleEntry[]
  subjects: Subject[]
  activities: AcademicActivity[]
  programs: StudyProgram[]
}

function FormatoPeriodoFields({
  formato,
  onPatch,
}: {
  formato: FormatoC20
  onPatch: (partial: Partial<FormatoC20>) => Promise<void>
}) {
  return (
    <fieldset className="formato-fieldset builder-card timetable-period-fields">
      <legend>Periodo del cuadro horario</legend>
      <p className="hint">
        Estos datos van en el Formato C-20 y suelen cambiar junto con cada horario.
      </p>
      <div className="form-grid">
        <label>
          Periodo
          <input
            value={formato.periodo}
            onChange={(event) => void onPatch({ periodo: event.target.value })}
            placeholder="Agosto 2026 - Diciembre 2026"
          />
        </label>
        <label>
          Vigencia
          <input
            value={formato.vigencia}
            onChange={(event) => void onPatch({ vigencia: event.target.value })}
            placeholder="Diciembre 2026"
          />
        </label>
        <label>
          Fecha de llenado
          <input
            type="date"
            value={formato.fechaLlenado}
            onChange={(event) => void onPatch({ fechaLlenado: event.target.value })}
          />
        </label>
      </div>
    </fieldset>
  )
}

function FormatoObservacionesField({
  formato,
  onPatch,
}: {
  formato: FormatoC20
  onPatch: (partial: Partial<FormatoC20>) => Promise<void>
}) {
  return (
    <fieldset className="formato-fieldset builder-card timetable-observaciones">
      <legend>Observaciones</legend>
      <label>
        Observaciones del Formato C-20
        <textarea
          rows={4}
          value={formato.observaciones}
          onChange={(event) => void onPatch({ observaciones: event.target.value })}
          placeholder="Ninguna"
        />
      </label>
    </fieldset>
  )
}

export function TimetableView({ schedule, subjects, activities, programs }: TimetableViewProps) {
  const { formato, updateFormato } = useAppDataContext()

  async function patchFormato(partial: Partial<FormatoC20>) {
    await updateFormato({ ...formato, ...partial })
  }
  const rows = useMemo(
    () => buildTimetableRows(schedule, subjects, activities, programs),
    [schedule, subjects, activities, programs],
  )

  const missingCount = countEntriesMissingStartTime(schedule)
  const scheduleTotalHours = useMemo(() => totalScheduleHours(schedule), [schedule])

  function handleExportCsv() {
    const csv = buildTimetableCsv(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `horario-clases-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (schedule.length === 0) {
    return (
      <section className="panel">
        <header className="panel-header">
          <div>
            <h2>Paso 3: Cuadro horario</h2>
            <p>Primero construye tu horario en el paso 1.</p>
          </div>
        </header>
        <FormatoPeriodoFields formato={formato} onPatch={patchFormato} />
        <FormatoObservacionesField formato={formato} onPatch={patchFormato} />
      </section>
    )
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2>Paso 3: Cuadro horario</h2>
          <p>Horario de clases con rangos de inicio y fin por día.</p>
        </div>
        <button type="button" onClick={handleExportCsv}>
          Descargar CSV
        </button>
      </header>

      <FormatoPeriodoFields formato={formato} onPatch={patchFormato} />

      {missingCount > 0 && (
        <p className="message error">
          Hay bloques sin hora de inicio. Completa el paso 2 para llenar todas las celdas.
        </p>
      )}

      <div className="table-wrap timetable-wrap">
        <table className="timetable-table">
          <thead>
            <tr>
              <th>Actividad</th>
              {DAYS.map((day) => (
                <th key={day}>{DAY_COLUMN_LABELS[day]}</th>
              ))}
              <th>HORAS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.activityKey}>
                <td className="activity-cell">{row.label}</td>
                {DAYS.map((day) => (
                  <td key={day} className={row.days[day] ? 'time-cell filled' : 'time-cell'}>
                    {row.days[day] || ''}
                  </td>
                ))}
                <td className="hours-cell">{formatTotalHoursCell(row.totalHours)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="timetable-total-row">
              <td className="activity-cell">Total</td>
              {DAYS.map((day) => (
                <td key={day} className="time-cell" />
              ))}
              <td className="hours-cell">{formatTotalHoursCell(scheduleTotalHours)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <FormatoObservacionesField formato={formato} onPatch={patchFormato} />
    </section>
  )
}
