import type { StudyProgram } from '../types'

export function formatProgramLabel(program: StudyProgram): string {
  if (program.acronym.trim()) {
    return `${program.acronym} — ${program.name}`
  }
  return program.name
}
