export const DAYS = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
] as const

export type DayOfWeek = (typeof DAYS)[number]

export const DAY_LABELS: Record<DayOfWeek, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
}

export const HOURS_PER_DAY = 8

export interface StudyProgram {
  id?: number
  name: string
  acronym: string
}

export interface Subject {
  id?: number
  programId: number
  name: string
  totalHours: number
  hoursPerSession: number
}

export interface AcademicActivity {
  id?: number
  name: string
}

export interface DayWorkSettings {
  day: DayOfWeek
  workDayStart: string
}

export interface ScheduleEntry {
  id?: number
  subjectId?: number
  activityId?: number
  day: DayOfWeek
  hours: number
  startTime?: string
}

export interface DayBlock {
  label: string
  hours: number
  subjectId?: number
  activityId?: number
}

export interface ExportPayload {
  version: 5
  exportedAt: string
  hoursPerDay: number
  programs: StudyProgram[]
  subjects: Subject[]
  activities: AcademicActivity[]
  schedule: ScheduleEntry[]
  daySettings: DayWorkSettings[]
}
