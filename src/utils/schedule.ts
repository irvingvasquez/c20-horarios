import {
  DAYS,
  HOURS_PER_DAY,
  type AcademicActivity,
  type DayBlock,
  type DayOfWeek,
  type ScheduleEntry,
  type Subject,
} from '../types'
import {
  formatHours,
  hoursFitWithin,
  roundHours,
} from './hours'

export { formatHours } from './hours'

export function getSubjectAssignedHours(
  subjectId: number,
  schedule: ScheduleEntry[],
): number {
  return roundHours(
    schedule
      .filter((entry) => entry.subjectId === subjectId)
      .reduce((sum, entry) => sum + entry.hours, 0),
  )
}

export function getSubjectRemainingHours(
  subject: Subject,
  schedule: ScheduleEntry[],
): number {
  if (!subject.id) return roundHours(subject.totalHours)
  const assigned = getSubjectAssignedHours(subject.id, schedule)
  return Math.max(0, roundHours(subject.totalHours - assigned))
}

export function getDayTotalHours(
  day: DayOfWeek,
  schedule: ScheduleEntry[],
): number {
  return roundHours(
    schedule
      .filter((entry) => entry.day === day)
      .reduce((sum, entry) => sum + entry.hours, 0),
  )
}

export function getDayRemainingHours(
  day: DayOfWeek,
  schedule: ScheduleEntry[],
): number {
  return Math.max(0, roundHours(HOURS_PER_DAY - getDayTotalHours(day, schedule)))
}

export function getDayBlocks(
  day: DayOfWeek,
  schedule: ScheduleEntry[],
  subjects: Subject[],
  activities: AcademicActivity[],
): DayBlock[] {
  const dayEntries = schedule.filter((entry) => entry.day === day)
  const blocks = new Map<string, DayBlock>()

  for (const entry of dayEntries) {
    const key = entry.subjectId
      ? `s-${entry.subjectId}`
      : `a-${entry.activityId}`

    const existing = blocks.get(key)
    if (existing) {
      existing.hours = roundHours(existing.hours + entry.hours)
      continue
    }

    if (entry.subjectId) {
      const subject = subjects.find((item) => item.id === entry.subjectId)
      blocks.set(key, {
        label: subject?.name ?? 'Materia desconocida',
        hours: roundHours(entry.hours),
        subjectId: entry.subjectId,
      })
      continue
    }

    const activity = activities.find((item) => item.id === entry.activityId)
    blocks.set(key, {
      label: activity?.name ?? 'Actividad desconocida',
      hours: roundHours(entry.hours),
      activityId: entry.activityId,
    })
  }

  return Array.from(blocks.values())
}

export interface AssignSubjectResult {
  ok: boolean
  message?: string
  entries?: Omit<ScheduleEntry, 'id'>[]
}

export function buildSubjectAssignment(
  subject: Subject,
  selectedDays: DayOfWeek[],
  schedule: ScheduleEntry[],
): AssignSubjectResult {
  if (!subject.id) {
    return { ok: false, message: 'La materia no tiene un identificador válido.' }
  }

  if (selectedDays.length === 0) {
    return { ok: false, message: 'Selecciona al menos un día.' }
  }

  const remaining = getSubjectRemainingHours(subject, schedule)
  if (remaining <= 0) {
    return { ok: false, message: 'Esta materia ya completó sus horas.' }
  }

  const hoursToAssign = roundHours(Math.min(subject.hoursPerSession, remaining))
  const entries: Omit<ScheduleEntry, 'id'>[] = []

  for (const day of selectedDays) {
    const dayRemaining = getDayRemainingHours(day, schedule)
    const alreadyPlanned = roundHours(
      entries
        .filter((entry) => entry.day === day)
        .reduce((sum, entry) => sum + entry.hours, 0),
    )
    const available = roundHours(dayRemaining - alreadyPlanned)

    if (!hoursFitWithin(hoursToAssign, available)) {
      return {
        ok: false,
        message: `${day} solo tiene ${formatHours(available)} disponibles.`,
      }
    }

    entries.push({
      subjectId: subject.id,
      day,
      hours: hoursToAssign,
    })
  }

  return { ok: true, entries }
}

export interface AssignActivityResult {
  ok: boolean
  message?: string
  entries?: Omit<ScheduleEntry, 'id'>[]
}

export function buildActivityAssignment(
  activity: AcademicActivity,
  day: DayOfWeek,
  hours: number,
  schedule: ScheduleEntry[],
): AssignActivityResult {
  if (!activity.id) {
    return { ok: false, message: 'La actividad no tiene un identificador válido.' }
  }

  const normalizedHours = roundHours(hours)

  if (normalizedHours <= 0) {
    return { ok: false, message: 'Indica una cantidad de horas válida.' }
  }

  const dayRemaining = getDayRemainingHours(day, schedule)
  if (!hoursFitWithin(normalizedHours, dayRemaining)) {
    return {
      ok: false,
      message: `${day} solo tiene ${formatHours(dayRemaining)} disponibles.`,
    }
  }

  return {
    ok: true,
    entries: [
      {
        activityId: activity.id,
        day,
        hours: normalizedHours,
      },
    ],
  }
}

export function summarizeWeek(
  schedule: ScheduleEntry[],
): Record<DayOfWeek, number> {
  return DAYS.reduce(
    (acc, day) => {
      acc[day] = getDayTotalHours(day, schedule)
      return acc
    },
    {} as Record<DayOfWeek, number>,
  )
}
