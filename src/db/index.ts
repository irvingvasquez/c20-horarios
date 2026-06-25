import Dexie, { type EntityTable } from 'dexie'
import type {
  AcademicActivity,
  DayWorkSettings,
  ScheduleEntry,
  StudyProgram,
  Subject,
} from '../types'

export class C20Database extends Dexie {
  programs!: EntityTable<StudyProgram, 'id'>
  subjects!: EntityTable<Subject, 'id'>
  activities!: EntityTable<AcademicActivity, 'id'>
  schedule!: EntityTable<ScheduleEntry, 'id'>
  daySettings!: EntityTable<DayWorkSettings, 'day'>

  constructor() {
    super('c20-horarios')
    this.version(1).stores({
      subjects: '++id, name',
      activities: '++id, name',
      schedule: '++id, day, subjectId, activityId',
    })
    this.version(2)
      .stores({
        programs: '++id, name',
        subjects: '++id, name, programId',
        activities: '++id, name',
        schedule: '++id, day, subjectId, activityId',
      })
      .upgrade(async (transaction) => {
        const defaultProgramId = await transaction.table('programs').add({
          name: 'General',
          acronym: 'GEN',
        })
        const subjects = await transaction.table('subjects').toArray()

        for (const subject of subjects) {
          await transaction.table('subjects').update(subject.id, {
            programId: defaultProgramId,
          })
        }
      })
    this.version(3)
      .stores({
        programs: '++id, name, acronym',
        subjects: '++id, name, programId',
        activities: '++id, name',
        schedule: '++id, day, subjectId, activityId',
      })
      .upgrade(async (transaction) => {
        const programs = await transaction.table('programs').toArray()

        for (const program of programs) {
          if (!program.acronym) {
            await transaction.table('programs').update(program.id, {
              acronym: program.name === 'General' ? 'GEN' : '',
            })
          }
        }
      })
    this.version(4).stores({
      programs: '++id, name, acronym',
      subjects: '++id, name, programId',
      activities: '++id, name',
      schedule: '++id, day, subjectId, activityId',
    })
    this.version(5).stores({
      programs: '++id, name, acronym',
      subjects: '++id, name, programId',
      activities: '++id, name',
      schedule: '++id, day, subjectId, activityId',
      daySettings: 'day',
    })
  }
}

export const db = new C20Database()

export async function loadAllData() {
  const [programs, subjects, activities, schedule, daySettings] = await Promise.all([
    db.programs.orderBy('name').toArray(),
    db.subjects.orderBy('name').toArray(),
    db.activities.orderBy('name').toArray(),
    db.schedule.toArray(),
    db.daySettings.toArray(),
  ])

  return { programs, subjects, activities, schedule, daySettings }
}

export async function exportData() {
  const data = await loadAllData()
  return {
    version: 5 as const,
    exportedAt: new Date().toISOString(),
    hoursPerDay: 8,
    programs: data.programs,
    subjects: data.subjects,
    activities: data.activities,
    schedule: data.schedule,
    daySettings: data.daySettings,
  }
}

export async function importData(payload: {
  programs?: StudyProgram[]
  subjects?: Array<Omit<Subject, 'programId'> & { programId?: number }>
  activities?: AcademicActivity[]
  schedule?: ScheduleEntry[]
  daySettings?: DayWorkSettings[]
}) {
  await db.transaction(
    'rw',
    db.programs,
    db.subjects,
    db.activities,
    db.schedule,
    db.daySettings,
    async () => {
      await db.programs.clear()
      await db.subjects.clear()
      await db.activities.clear()
      await db.schedule.clear()
      await db.daySettings.clear()

      const programIdMap = new Map<number, number>()
      let fallbackProgramId: number | undefined

      if (payload.programs?.length) {
        for (const program of payload.programs) {
          const oldId = program.id
          const newId = (await db.programs.add({
            name: program.name,
            acronym: program.acronym ?? '',
          }))!
          fallbackProgramId ??= newId
          if (oldId !== undefined) {
            programIdMap.set(oldId, newId)
          }
        }
      } else {
        fallbackProgramId = (await db.programs.add({ name: 'General', acronym: 'GEN' }))!
      }

      const subjectIdMap = new Map<number, number>()
      const activityIdMap = new Map<number, number>()

      if (payload.subjects?.length) {
        for (const subject of payload.subjects) {
          const oldId = subject.id
          const { id: _id, programId, ...rest } = subject
          const resolvedProgramId =
            (programId !== undefined ? programIdMap.get(programId) : undefined) ??
            fallbackProgramId!

          const newId = (await db.subjects.add({
            ...rest,
            programId: resolvedProgramId,
          }))!

          if (oldId !== undefined) {
            subjectIdMap.set(oldId, newId)
          }
        }
      }

      if (payload.activities?.length) {
        for (const activity of payload.activities) {
          const oldId = activity.id
          const { id: _id, ...rest } = activity
          const newId = (await db.activities.add(rest))!
          if (oldId !== undefined) {
            activityIdMap.set(oldId, newId)
          }
        }
      }

      if (payload.schedule?.length) {
        for (const entry of payload.schedule) {
          const { id: _id, subjectId, activityId, ...rest } = entry
          await db.schedule.add({
            ...rest,
            subjectId:
              subjectId !== undefined ? subjectIdMap.get(subjectId) : undefined,
            activityId:
              activityId !== undefined ? activityIdMap.get(activityId) : undefined,
          })
        }
      }

      if (payload.daySettings?.length) {
        await db.daySettings.bulkPut(payload.daySettings)
      }
    },
  )
}

export async function countSubjectsByProgram(programId: number): Promise<number> {
  return db.subjects.where('programId').equals(programId).count()
}
