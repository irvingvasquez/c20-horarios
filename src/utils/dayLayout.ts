import { HOURS_PER_DAY, type DayOfWeek, type ScheduleEntry } from '../types'
import { roundHours } from './hours'
import { formatMinutesAsTime, parseTimeToMinutes } from './time'

interface TimeInterval {
  startMin: number
  endMin: number
}

interface ActivityPool {
  activityId: number
  remainingMinutes: number
}

export interface DayLayoutUpdate {
  id: number
  startTime: string
}

export type DayLayoutResult =
  | { ok: true; activityEntries: Omit<ScheduleEntry, 'id'>[] }
  | { ok: false; message: string }

function entryDurationMinutes(entry: ScheduleEntry): number {
  return Math.round(roundHours(entry.hours) * 60)
}

function entryInterval(entry: ScheduleEntry, startTime: string): TimeInterval | null {
  const startMin = parseTimeToMinutes(startTime)
  if (startMin === null) return null
  return { startMin, endMin: startMin + entryDurationMinutes(entry) }
}

function intervalsOverlap(left: TimeInterval, right: TimeInterval): boolean {
  return left.startMin < right.endMin && right.startMin < left.endMin
}

function getDayEntries(schedule: ScheduleEntry[], day: DayOfWeek): ScheduleEntry[] {
  return schedule.filter((entry) => entry.day === day)
}

function buildActivityPools(activityEntries: ScheduleEntry[]): ActivityPool[] {
  const pools: ActivityPool[] = []

  for (const entry of activityEntries) {
    if (!entry.activityId) continue

    const existing = pools.find((pool) => pool.activityId === entry.activityId)
    const minutes = entryDurationMinutes(entry)

    if (existing) {
      existing.remainingMinutes += minutes
      continue
    }

    pools.push({
      activityId: entry.activityId,
      remainingMinutes: minutes,
    })
  }

  return pools
}

function getNextPoolWithMinutes(pools: ActivityPool[]): ActivityPool | undefined {
  return pools.find((pool) => pool.remainingMinutes > 0)
}

function buildGaps(
  dayStartMin: number,
  workEndMin: number,
  subjectIntervals: TimeInterval[],
): TimeInterval[] {
  if (subjectIntervals.length === 0) {
    return [{ startMin: dayStartMin, endMin: workEndMin }]
  }

  const sorted = [...subjectIntervals].sort((left, right) => left.startMin - right.startMin)
  const gaps: TimeInterval[] = []

  if (sorted[0].startMin > dayStartMin) {
    gaps.push({ startMin: dayStartMin, endMin: sorted[0].startMin })
  }

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index]
    const next = sorted[index + 1]

    if (next.startMin > current.endMin) {
      gaps.push({ startMin: current.endMin, endMin: next.startMin })
    }
  }

  const last = sorted[sorted.length - 1]
  if (last.endMin < workEndMin) {
    gaps.push({ startMin: last.endMin, endMin: workEndMin })
  }

  return gaps.filter((gap) => gap.endMin > gap.startMin)
}

function validateSubjects(
  subjectEntries: ScheduleEntry[],
  dayStartMin: number,
  workEndMin: number,
): { ok: true; intervals: TimeInterval[] } | { ok: false; message: string } {
  if (subjectEntries.some((entry) => !entry.startTime)) {
    return {
      ok: false,
      message: 'Todas las materias deben tener hora de inicio antes de generar.',
    }
  }

  const intervals: TimeInterval[] = []

  for (const entry of subjectEntries) {
    const interval = entryInterval(entry, entry.startTime!)
    if (!interval) {
      return { ok: false, message: 'Hay una materia con hora de inicio inválida.' }
    }

    if (interval.startMin < dayStartMin || interval.endMin > workEndMin) {
      return {
        ok: false,
        message: 'Una materia se sale del horario de 8 horas del día.',
      }
    }

    if (intervals.some((existing) => intervalsOverlap(existing, interval))) {
      return { ok: false, message: 'Las materias se traslapan entre sí.' }
    }

    intervals.push(interval)
  }

  return { ok: true, intervals }
}

function distributeActivitiesInGaps(
  day: DayOfWeek,
  gaps: TimeInterval[],
  pools: ActivityPool[],
): Omit<ScheduleEntry, 'id'>[] {
  const newEntries: Omit<ScheduleEntry, 'id'>[] = []

  for (const gap of gaps) {
    let gapCursor = gap.startMin
    let gapRemainingMinutes = gap.endMin - gap.startMin

    while (gapRemainingMinutes > 0) {
      const pool = getNextPoolWithMinutes(pools)
      if (!pool) break

      const takeMinutes = Math.min(gapRemainingMinutes, pool.remainingMinutes)
      if (takeMinutes <= 0) break

      newEntries.push({
        activityId: pool.activityId,
        day,
        hours: roundHours(takeMinutes / 60),
        startTime: formatMinutesAsTime(gapCursor),
      })

      pool.remainingMinutes -= takeMinutes
      gapCursor += takeMinutes
      gapRemainingMinutes -= takeMinutes
    }
  }

  return newEntries
}

export function layoutDaySchedule(
  day: DayOfWeek,
  workDayStart: string,
  schedule: ScheduleEntry[],
): DayLayoutResult {
  const dayStartMin = parseTimeToMinutes(workDayStart)
  if (dayStartMin === null) {
    return { ok: false, message: 'Indica una hora válida de inicio del día laboral.' }
  }

  const dayEntries = getDayEntries(schedule, day)
  if (dayEntries.length === 0) {
    return { ok: true, activityEntries: [] }
  }

  const workEndMin = dayStartMin + HOURS_PER_DAY * 60
  const subjectEntries = dayEntries.filter((entry) => entry.subjectId)
  const activityEntries = dayEntries
    .filter((entry) => entry.activityId)
    .sort((left, right) => (left.id ?? 0) - (right.id ?? 0))

  const subjectValidation = validateSubjects(subjectEntries, dayStartMin, workEndMin)
  if (!subjectValidation.ok) {
    return subjectValidation
  }

  const pools = buildActivityPools(activityEntries)
  const totalActivityMinutes = pools.reduce((sum, pool) => sum + pool.remainingMinutes, 0)

  if (totalActivityMinutes === 0) {
    return { ok: true, activityEntries: [] }
  }

  const gaps = buildGaps(dayStartMin, workEndMin, subjectValidation.intervals)
  const totalGapMinutes = gaps.reduce((sum, gap) => sum + (gap.endMin - gap.startMin), 0)

  if (totalGapMinutes < totalActivityMinutes) {
    return {
      ok: false,
      message:
        'No hay huecos suficientes entre las materias para ubicar todas las horas de actividades.',
    }
  }

  const newActivityEntries = distributeActivitiesInGaps(day, gaps, pools)
  const remainingMinutes = pools.reduce((sum, pool) => sum + pool.remainingMinutes, 0)

  if (remainingMinutes > 0) {
    return {
      ok: false,
      message:
        'Quedaron horas de actividades sin asignar. Verifica los traslapes y los huecos del día.',
    }
  }

  return { ok: true, activityEntries: newActivityEntries }
}

export function stackSubjectsFromDayStart(
  day: DayOfWeek,
  workDayStart: string,
  schedule: ScheduleEntry[],
): { ok: true; updates: DayLayoutUpdate[] } | { ok: false; message: string } {
  const dayStartMin = parseTimeToMinutes(workDayStart)
  if (dayStartMin === null) {
    return { ok: false, message: 'Indica una hora válida de inicio del día laboral.' }
  }

  const subjectEntries = getDayEntries(schedule, day)
    .filter((entry) => entry.subjectId)
    .sort((left, right) => (left.id ?? 0) - (right.id ?? 0))

  let cursor = dayStartMin
  const updates: DayLayoutUpdate[] = []

  for (const entry of subjectEntries) {
    const startTime = formatMinutesAsTime(cursor)
    cursor += entryDurationMinutes(entry)

    if (cursor > dayStartMin + HOURS_PER_DAY * 60) {
      return {
        ok: false,
        message: 'Las materias superan las 8 horas del día.',
      }
    }

    updates.push({ id: entry.id!, startTime })
  }

  return { ok: true, updates }
}

export function getDefaultWorkDayStart(
  day: DayOfWeek,
  daySettings: Array<{ day: DayOfWeek; workDayStart: string }>,
): string {
  return daySettings.find((setting) => setting.day === day)?.workDayStart ?? '08:00'
}
