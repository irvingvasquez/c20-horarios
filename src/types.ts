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

export type CondicionAdscripcion = 'base' | 'interinato' | 'otro'

export interface FormatoFirma {
  nombre: string
  cargo: string
}

export interface FormatoDocente {
  apellidoPaterno: string
  apellidoMaterno: string
  nombres: string
  rfc: string
  gradoMaximo: string
  egresadoDe: string
  especialidad: string
  departamento: string
  numeroEmpleado: string
  fechaIngresoIPN: string
  horasNombramiento: number
  categoria: string
  condicionAdscripcion: CondicionAdscripcion
  condicionOtro: string
  jornada: { matutino: boolean; vespertino: boolean }
}

export interface FormatoC20 {
  escuela: string
  claveUR: string
  periodo: string
  vigencia: string
  fechaLlenado: string
  observaciones: string
  docente: FormatoDocente
  firmas: {
    profesor: FormatoFirma
    subdirector: FormatoFirma
    director: FormatoFirma
  }
}

export interface ExportPayload {
  version: 6
  exportedAt: string
  hoursPerDay: number
  programs: StudyProgram[]
  subjects: Subject[]
  activities: AcademicActivity[]
  schedule: ScheduleEntry[]
  daySettings: DayWorkSettings[]
  formato: FormatoC20
}

/** JSON importado (v5 sin formato o v6 con campos parciales). */
export interface ImportPayload {
  version?: number
  exportedAt?: string
  hoursPerDay?: number
  programs?: StudyProgram[]
  subjects?: Subject[]
  activities?: AcademicActivity[]
  schedule?: ScheduleEntry[]
  daySettings?: DayWorkSettings[]
  formato?: Partial<FormatoC20>
}
