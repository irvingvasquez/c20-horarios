import { useMemo, useState } from 'react'
import {
  DAYS,
  DAY_LABELS,
  type AcademicActivity,
  type DayOfWeek,
  type DayWorkSettings,
  type ScheduleEntry,
  type Subject,
} from '../types'
import { getDefaultWorkDayStart, stackSubjectsFromDayStart } from '../utils/dayLayout'
import { formatHours } from '../utils/hours'
import { addHoursToTime } from '../utils/time'
import { getEntryLabel } from '../utils/timetable'

interface TimeAssignmentProps {
  schedule: ScheduleEntry[]
  subjects: Subject[]
  activities: AcademicActivity[]
  daySettings: DayWorkSettings[]
  onUpdateEntry: (id: number, changes: Partial<ScheduleEntry>) => Promise<void>
  onUpdateEntries: (updates: Array<{ id: number; startTime: string }>) => Promise<void>
  onGenerateDay: (day: DayOfWeek) => Promise<void>
  onUpsertDaySetting: (day: DayOfWeek, workDayStart: string) => Promise<void>
}

export function TimeAssignment({
  schedule,
  subjects,
  activities,
  daySettings,
  onUpdateEntry,
  onUpdateEntries,
  onGenerateDay,
  onUpsertDaySetting,
}: TimeAssignmentProps) {
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'success'>('error')

  const daysWithEntries = useMemo(
    () => DAYS.filter((day) => schedule.some((entry) => entry.day === day)),
    [schedule],
  )

  async function handleWorkDayStartChange(day: DayOfWeek, workDayStart: string) {
    setMessage('')
    await onUpsertDaySetting(day, workDayStart)
  }

  async function handleSubjectStartChange(entryId: number, startTime: string) {
    setMessage('')
    await onUpdateEntry(entryId, { startTime: startTime || undefined })
  }

  async function handleStackSubjects(day: DayOfWeek) {
    setMessage('')
    const workDayStart = getDefaultWorkDayStart(day, daySettings)
    const result = stackSubjectsFromDayStart(day, workDayStart, schedule)

    if (!result.ok) {
      setMessage(result.message)
      setMessageType('error')
      return
    }

    await onUpdateEntries(result.updates)
    setMessage(`Materias de ${DAY_LABELS[day]} apiladas desde ${workDayStart}.`)
    setMessageType('success')
  }

  async function handleGenerateDay(day: DayOfWeek) {
    setMessage('')

    try {
      await onGenerateDay(day)
      setMessage(
        `Horario de ${DAY_LABELS[day]} generado. Las actividades se repartieron en los huecos libres.`,
      )
      setMessageType('success')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo generar el día.')
      setMessageType('error')
    }
  }

  async function handleGenerateAllDays() {
    setMessage('')

    for (const day of daysWithEntries) {
      try {
        await onGenerateDay(day)
      } catch (error) {
        setMessage(
          `${DAY_LABELS[day]}: ${error instanceof Error ? error.message : 'Error al generar.'}`,
        )
        setMessageType('error')
        return
      }
    }

    setMessage('Horario generado para todos los días.')
    setMessageType('success')
  }

  if (schedule.length === 0) {
    return (
      <section className="panel">
        <header className="panel-header">
          <div>
            <h2>Paso 2: Horas de inicio</h2>
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
          <h2>Paso 2: Horas de inicio</h2>
          <p>
            Define el inicio del día laboral y las horas de inicio de cada materia. Al generar, el
            sistema reparte las horas de actividades disponibles en los huecos libres (no necesitan
            ser continuas).
          </p>
        </div>
        <button type="button" onClick={() => void handleGenerateAllDays()}>
          Generar todos los días
        </button>
      </header>

      {message && <p className={`message ${messageType}`}>{message}</p>}

      <div className="day-layout-list">
        {daysWithEntries.map((day) => {
          const dayEntries = schedule.filter((entry) => entry.day === day)
          const subjectEntries = dayEntries.filter((entry) => entry.subjectId)
          const activityEntries = dayEntries.filter((entry) => entry.activityId)
          const workDayStart = getDefaultWorkDayStart(day, daySettings)

          return (
            <article key={day} className="day-layout-card">
              <header className="day-layout-header">
                <div>
                  <h3>{DAY_LABELS[day]}</h3>
                  <p>Valida materias, luego genera el reparto de actividades.</p>
                </div>
                <div className="day-layout-actions">
                  <button type="button" className="secondary" onClick={() => void handleStackSubjects(day)}>
                    Apilar materias
                  </button>
                  <button type="button" onClick={() => void handleGenerateDay(day)}>
                    Generar día
                  </button>
                </div>
              </header>

              <label className="workday-start">
                Inicio del día laboral
                <input
                  type="time"
                  className="time-input"
                  value={workDayStart}
                  onChange={(event) => void handleWorkDayStartChange(day, event.target.value)}
                />
              </label>

              {subjectEntries.length > 0 && (
                <div className="table-wrap">
                  <h4>Materias</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Materia</th>
                        <th>Horas</th>
                        <th>Inicio</th>
                        <th>Fin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectEntries.map((entry) => {
                        const endTime = entry.startTime
                          ? addHoursToTime(entry.startTime, entry.hours)
                          : null

                        return (
                          <tr key={entry.id}>
                            <td>{getEntryLabel(entry, subjects, activities)}</td>
                            <td>{formatHours(entry.hours)}</td>
                            <td>
                              <input
                                type="time"
                                className="time-input"
                                value={entry.startTime ?? ''}
                                onChange={(event) =>
                                  entry.id &&
                                  void handleSubjectStartChange(entry.id, event.target.value)
                                }
                              />
                            </td>
                            <td>{endTime ?? '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {activityEntries.length > 0 && (
                <div className="table-wrap">
                  <h4>Actividades académicas (automáticas)</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Actividad</th>
                        <th>Horas</th>
                        <th>Inicio</th>
                        <th>Fin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityEntries.map((entry) => {
                        const endTime = entry.startTime
                          ? addHoursToTime(entry.startTime, entry.hours)
                          : null

                        return (
                          <tr key={entry.id} className="auto-row">
                            <td>{getEntryLabel(entry, subjects, activities)}</td>
                            <td>{formatHours(entry.hours)}</td>
                            <td>{entry.startTime ?? '—'}</td>
                            <td>{endTime ?? '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
