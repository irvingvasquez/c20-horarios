import { useMemo } from 'react'
import { DAYS, type AcademicActivity, type ScheduleEntry, type StudyProgram, type Subject } from '../types'
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

export function TimetableView({ schedule, subjects, activities, programs }: TimetableViewProps) {
  const rows = useMemo(
    () => buildTimetableRows(schedule, subjects, activities, programs),
    [schedule, subjects, activities, programs],
  )

  const missingCount = countEntriesMissingStartTime(schedule)

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
        </table>
      </div>
    </section>
  )
}
