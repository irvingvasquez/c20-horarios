import { useMemo, useState } from 'react'
import {
  DAYS,
  DAY_LABELS,
  HOURS_PER_DAY,
  type AcademicActivity,
  type DayOfWeek,
  type ScheduleEntry,
  type StudyProgram,
  type Subject,
} from '../types'
import {
  HOUR_INPUT_MIN,
  HOUR_INPUT_STEP,
  isDayComplete,
  parseHoursInput,
} from '../utils/hours'
import {
  buildActivityAssignment,
  buildSubjectAssignment,
  formatHours,
  getDayBlocks,
  getDayRemainingHours,
  summarizeWeek,
} from '../utils/schedule'

interface ScheduleBuilderProps {
  programs: StudyProgram[]
  subjects: Subject[]
  activities: AcademicActivity[]
  schedule: ScheduleEntry[]
  onAssignSubject: (entries: Omit<ScheduleEntry, 'id'>[]) => Promise<void>
  onAssignActivity: (entries: Omit<ScheduleEntry, 'id'>[]) => Promise<void>
  onClearSchedule: () => Promise<void>
}

export function ScheduleBuilder({
  programs,
  subjects,
  activities,
  schedule,
  onAssignSubject,
  onAssignActivity,
  onClearSchedule,
}: ScheduleBuilderProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('')
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([])
  const [selectedActivityId, setSelectedActivityId] = useState<number | ''>('')
  const [activityDay, setActivityDay] = useState<DayOfWeek>('lunes')
  const [activityHours, setActivityHours] = useState(1)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'success'>('error')

  const weekSummary = useMemo(() => summarizeWeek(schedule), [schedule])

  const selectedSubject = subjects.find((item) => item.id === selectedSubjectId)

  function getProgramAcronym(programId: number) {
    const program = programs.find((item) => item.id === programId)
    return program?.acronym.trim() || 'Sin programa'
  }

  function toggleDay(day: DayOfWeek) {
    setSelectedDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    )
  }

  async function handleAssignSubject() {
    setMessage('')

    if (!selectedSubject) {
      setMessage('Selecciona una materia.')
      setMessageType('error')
      return
    }

    const result = buildSubjectAssignment(selectedSubject, selectedDays, schedule)
    if (!result.ok || !result.entries) {
      setMessage(result.message ?? 'No se pudo asignar la materia.')
      setMessageType('error')
      return
    }

    await onAssignSubject(result.entries)
    setMessage(
      `Se asignaron ${formatHours(result.entries.reduce((sum, entry) => sum + entry.hours, 0))} de ${selectedSubject.name}.`,
    )
    setMessageType('success')
  }

  async function handleAssignActivity() {
    setMessage('')

    const activity = activities.find((item) => item.id === selectedActivityId)
    if (!activity) {
      setMessage('Selecciona una actividad académica.')
      setMessageType('error')
      return
    }

    const result = buildActivityAssignment(activity, activityDay, activityHours, schedule)
    if (!result.ok || !result.entries) {
      setMessage(result.message ?? 'No se pudo asignar la actividad.')
      setMessageType('error')
      return
    }

    await onAssignActivity(result.entries)
    setMessage(`Se agregaron ${formatHours(activityHours)} de ${activity.name} en ${DAY_LABELS[activityDay]}.`)
    setMessageType('success')
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2>Paso 1: Construir horario</h2>
          <p>Asigna materias por día y completa con actividades académicas.</p>
        </div>
        <button type="button" className="secondary" onClick={() => void onClearSchedule()}>
          Limpiar horario
        </button>
      </header>

      <div className="builder-grid">
        <div className="builder-card">
          <h3>1. Asignar materia</h3>
          <label>
            Materia
            <select
              value={selectedSubjectId}
              onChange={(event) =>
                setSelectedSubjectId(event.target.value ? Number(event.target.value) : '')
              }
            >
              <option value="">Selecciona una materia</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({getProgramAcronym(subject.programId)})
                </option>
              ))}
            </select>
          </label>

          {selectedSubject && (
            <p className="hint">
              Cada asignación coloca {formatHours(selectedSubject.hoursPerSession)} en cada día seleccionado.
            </p>
          )}

          <div className="day-picker">
            {DAYS.map((day) => (
              <button
                key={day}
                type="button"
                className={selectedDays.includes(day) ? 'day-chip active' : 'day-chip'}
                onClick={() => toggleDay(day)}
              >
                {DAY_LABELS[day]}
              </button>
            ))}
          </div>

          <button type="button" onClick={() => void handleAssignSubject()}>
            Agregar al horario
          </button>
        </div>

        <div className="builder-card">
          <h3>2. Rellenar con actividad</h3>
          <label>
            Actividad
            <select
              value={selectedActivityId}
              onChange={(event) =>
                setSelectedActivityId(event.target.value ? Number(event.target.value) : '')
              }
            >
              <option value="">Selecciona una actividad</option>
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.name}
                </option>
              ))}
            </select>
          </label>

          <div className="form-grid compact">
            <label>
              Día
              <select
                value={activityDay}
                onChange={(event) => setActivityDay(event.target.value as DayOfWeek)}
              >
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {DAY_LABELS[day]} ({formatHours(getDayRemainingHours(day, schedule))} libres)
                  </option>
                ))}
              </select>
            </label>
            <label>
              Horas
              <input
                type="number"
                min={HOUR_INPUT_MIN}
                step={HOUR_INPUT_STEP}
                max={getDayRemainingHours(activityDay, schedule)}
                value={activityHours}
                onChange={(event) =>
                  setActivityHours(parseHoursInput(event.target.value))
                }
              />
            </label>
          </div>

          <button type="button" onClick={() => void handleAssignActivity()}>
            Agregar relleno
          </button>
        </div>
      </div>

      {message && <p className={`message ${messageType}`}>{message}</p>}

      <div className="schedule-grid">
        {DAYS.map((day) => {
          const blocks = getDayBlocks(day, schedule, subjects, activities)
          const total = weekSummary[day]
          const remaining = getDayRemainingHours(day, schedule)
          const complete = isDayComplete(total, HOURS_PER_DAY)

          return (
            <article key={day} className={complete ? 'day-card complete' : 'day-card'}>
              <header>
                <h3>{DAY_LABELS[day]}</h3>
                <span className={complete ? 'badge success' : 'badge'}>
                  {formatHours(total)} / {HOURS_PER_DAY}h
                </span>
              </header>

              <ul className="block-list">
                {blocks.length === 0 ? (
                  <li className="empty-block">Sin asignaciones</li>
                ) : (
                  blocks.map((block) => (
                    <li
                      key={`${block.subjectId ?? 'a'}-${block.activityId ?? 's'}-${block.label}`}
                      className={block.subjectId ? 'block subject-block' : 'block activity-block'}
                    >
                      <span>{block.label}</span>
                      <strong>{formatHours(block.hours)}</strong>
                    </li>
                  ))
                )}
              </ul>

              {!complete && (
                <p className="day-footer">Faltan {formatHours(remaining)} para completar el día.</p>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
