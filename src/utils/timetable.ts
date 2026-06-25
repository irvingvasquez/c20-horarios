import { DAYS, type AcademicActivity, type DayOfWeek, type ScheduleEntry, type StudyProgram, type Subject } from '../types'
import { roundHours } from './hours'
import { formatTimeRange } from './time'

export const DAY_COLUMN_LABELS: Record<DayOfWeek, string> = {
  lunes: 'LUNES',
  martes: 'MARTES',
  miercoles: 'MIERCOLES',
  jueves: 'JUEVES',
  viernes: 'VIERNES',
}

export interface TimetableRow {
  activityKey: string
  label: string
  days: Record<DayOfWeek, string>
  totalHours: number
}

export interface ScheduleEntryView {
  entry: ScheduleEntry
  label: string
}

export function getEntryActivityKey(entry: ScheduleEntry): string {
  if (entry.subjectId) return `s-${entry.subjectId}`
  if (entry.activityId) return `a-${entry.activityId}`
  return `entry-${entry.id ?? 'unknown'}`
}

export function getTimetableRowLabel(
  entry: ScheduleEntry,
  subjects: Subject[],
  activities: AcademicActivity[],
  programs: StudyProgram[],
): string {
  if (entry.subjectId) {
    const subject = subjects.find((item) => item.id === entry.subjectId)
    if (!subject) return 'Materia desconocida'

    const program = programs.find((item) => item.id === subject.programId)
    const acronym = program?.acronym.trim()

    if (acronym) {
      return `${subject.name} (${acronym})`
    }

    return subject.name
  }

  return getEntryLabel(entry, subjects, activities)
}

export function getEntryLabel(
  entry: ScheduleEntry,
  subjects: Subject[],
  activities: AcademicActivity[],
): string {
  if (entry.subjectId) {
    return subjects.find((subject) => subject.id === entry.subjectId)?.name ?? 'Materia desconocida'
  }
  if (entry.activityId) {
    return (
      activities.find((activity) => activity.id === entry.activityId)?.name ??
      'Actividad desconocida'
    )
  }
  return 'Sin nombre'
}

export function listScheduleEntries(
  schedule: ScheduleEntry[],
  subjects: Subject[],
  activities: AcademicActivity[],
): ScheduleEntryView[] {
  return schedule
    .map((entry) => ({
      entry,
      label: getEntryLabel(entry, subjects, activities),
    }))
    .sort((left, right) => {
      const dayDiff = DAYS.indexOf(left.entry.day) - DAYS.indexOf(right.entry.day)
      if (dayDiff !== 0) return dayDiff
      return left.label.localeCompare(right.label, 'es')
    })
}

export function buildTimetableRows(
  schedule: ScheduleEntry[],
  subjects: Subject[],
  activities: AcademicActivity[],
  programs: StudyProgram[],
): TimetableRow[] {
  const keys = [...new Set(schedule.map(getEntryActivityKey))]

  const rows = keys.map((activityKey) => {
    const entries = schedule.filter((entry) => getEntryActivityKey(entry) === activityKey)
    const label = getTimetableRowLabel(entries[0], subjects, activities, programs)
    const days = DAYS.reduce(
      (acc, day) => {
        const dayEntries = entries.filter((entry) => entry.day === day)
        const ranges = dayEntries
          .filter((entry) => entry.startTime)
          .map((entry) => formatTimeRange(entry.startTime!, entry.hours))
          .filter(Boolean)

        acc[day] = ranges.join(', ')
        return acc
      },
      {} as Record<DayOfWeek, string>,
    )

    const totalHours = roundHours(entries.reduce((sum, entry) => sum + entry.hours, 0))

    return { activityKey, label, days, totalHours }
  })

  return rows.sort((left, right) => left.label.localeCompare(right.label, 'es'))
}

export function formatTotalHoursCell(value: number): string {
  const rounded = roundHours(value)
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

function escapeCsvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function buildTimetableCsv(rows: TimetableRow[]): string {
  const header = ['Actividad', ...DAYS.map((day) => DAY_COLUMN_LABELS[day]), 'HORAS']
  const lines = [header.join(',')]

  for (const row of rows) {
    lines.push(
      [
        escapeCsvCell(row.label),
        ...DAYS.map((day) => escapeCsvCell(row.days[day])),
        formatTotalHoursCell(row.totalHours),
      ].join(','),
    )
  }

  return lines.join('\n')
}

export function countEntriesMissingStartTime(schedule: ScheduleEntry[]): number {
  return schedule.filter((entry) => !entry.startTime).length
}
