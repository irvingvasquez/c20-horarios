import {
  HOURS_PER_DAY,
  type AcademicActivity,
  type DayWorkSettings,
  type ExportPayload,
  type FormatoC20,
  type ScheduleEntry,
  type StudyProgram,
  type Subject,
} from '../types'
import { mergeFormato } from './formato'

export function buildExportPayload(input: {
  programs: StudyProgram[]
  subjects: Subject[]
  activities: AcademicActivity[]
  schedule: ScheduleEntry[]
  daySettings: DayWorkSettings[]
  formato: FormatoC20
}): ExportPayload {
  return {
    version: 6,
    exportedAt: new Date().toISOString(),
    hoursPerDay: HOURS_PER_DAY,
    programs: input.programs,
    subjects: input.subjects,
    activities: input.activities,
    schedule: input.schedule,
    daySettings: input.daySettings,
    formato: mergeFormato(input.formato),
  }
}