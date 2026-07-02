import { useCallback, useEffect, useState } from 'react'
import { countSubjectsByProgram, db, loadAllData } from '../db'
import { getDefaultWorkDayStart, layoutDaySchedule } from '../utils/dayLayout'
import type {
  AcademicActivity,
  DayOfWeek,
  DayWorkSettings,
  ScheduleEntry,
  StudyProgram,
  Subject,
} from '../types'

export function useAppData() {
  const [programs, setPrograms] = useState<StudyProgram[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [activities, setActivities] = useState<AcademicActivity[]>([])
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([])
  const [daySettings, setDaySettings] = useState<DayWorkSettings[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const data = await loadAllData()
    setPrograms(data.programs)
    setSubjects(data.subjects)
    setActivities(data.activities)
    setSchedule(data.schedule)
    setDaySettings(data.daySettings)
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    programs,
    subjects,
    activities,
    schedule,
    daySettings,
    loading,
    refresh,
    async addProgram(program: Omit<StudyProgram, 'id'>) {
      await db.programs.add(program)
      await refresh()
    },
    async updateProgram(program: StudyProgram) {
      if (!program.id) return
      await db.programs.update(program.id, program)
      await refresh()
    },
    async deleteProgram(id: number) {
      const subjectCount = await countSubjectsByProgram(id)
      if (subjectCount > 0) {
        throw new Error('No se puede eliminar un programa que tiene materias asignadas.')
      }
      await db.programs.delete(id)
      await refresh()
    },
    async addSubject(subject: Omit<Subject, 'id'>) {
      await db.subjects.add(subject)
      await refresh()
    },
    async updateSubject(subject: Subject) {
      if (!subject.id) return
      await db.subjects.update(subject.id, subject)
      await refresh()
    },
    async deleteSubject(id: number) {
      await db.transaction('rw', db.subjects, db.schedule, async () => {
        await db.schedule.where('subjectId').equals(id).delete()
        await db.subjects.delete(id)
      })
      await refresh()
    },
    async addActivity(activity: Omit<AcademicActivity, 'id'>) {
      await db.activities.add(activity)
      await refresh()
    },
    async updateActivity(activity: AcademicActivity) {
      if (!activity.id) return
      await db.activities.update(activity.id, activity)
      await refresh()
    },
    async deleteActivity(id: number) {
      await db.transaction('rw', db.activities, db.schedule, async () => {
        await db.schedule.where('activityId').equals(id).delete()
        await db.activities.delete(id)
      })
      await refresh()
    },
    async addScheduleEntries(entries: Omit<ScheduleEntry, 'id'>[]) {
      await db.schedule.bulkAdd(entries)
      await refresh()
    },
    async updateScheduleEntry(id: number, changes: Partial<ScheduleEntry>) {
      await db.schedule.update(id, changes)
      await refresh()
    },
    async updateScheduleEntries(updates: Array<{ id: number; startTime: string }>) {
      await db.transaction('rw', db.schedule, async () => {
        for (const update of updates) {
          await db.schedule.update(update.id, { startTime: update.startTime })
        }
      })
      await refresh()
    },
    async replaceDayActivityEntries(day: DayOfWeek, entries: Omit<ScheduleEntry, 'id'>[]) {
      await db.transaction('rw', db.schedule, async () => {
        const dayEntries = await db.schedule.where('day').equals(day).toArray()

        for (const entry of dayEntries) {
          if (entry.activityId && entry.id) {
            await db.schedule.delete(entry.id)
          }
        }

        if (entries.length > 0) {
          await db.schedule.bulkAdd(entries)
        }
      })
      await refresh()
    },
    async generateDaySchedule(day: DayOfWeek) {
      const data = await loadAllData()
      const workDayStart = getDefaultWorkDayStart(day, data.daySettings)
      const result = layoutDaySchedule(day, workDayStart, data.schedule)

      if (!result.ok) {
        throw new Error(result.message)
      }

      await db.transaction('rw', db.schedule, async () => {
        const dayEntries = await db.schedule.where('day').equals(day).toArray()

        for (const entry of dayEntries) {
          if (entry.activityId && entry.id) {
            await db.schedule.delete(entry.id)
          }
        }

        if (result.activityEntries.length > 0) {
          await db.schedule.bulkAdd(result.activityEntries)
        }
      })
      await refresh()
    },
    async upsertDaySetting(day: DayOfWeek, workDayStart: string) {
      await db.daySettings.put({ day, workDayStart })
      await refresh()
    },
    async removeScheduleEntry(id: number) {
      await db.schedule.delete(id)
      await refresh()
    },
    async removeSubjectFromDay(subjectId: number, day: DayOfWeek) {
      await db.transaction('rw', db.schedule, async () => {
        const entries = await db.schedule
          .where('day')
          .equals(day)
          .filter((entry) => entry.subjectId === subjectId)
          .toArray()

        await db.schedule.bulkDelete(
          entries.map((entry) => entry.id).filter((id): id is number => id !== undefined),
        )
      })
      await refresh()
    },
    async clearAllActivities() {
      await db.transaction('rw', db.schedule, async () => {
        const entries = await db.schedule
          .filter((entry) => entry.activityId !== undefined)
          .toArray()

        await db.schedule.bulkDelete(
          entries.map((entry) => entry.id).filter((id): id is number => id !== undefined),
        )
      })
      await refresh()
    },
    async clearSchedule() {
      await db.transaction('rw', db.schedule, db.daySettings, async () => {
        await db.schedule.clear()
        await db.daySettings.clear()
      })
      await refresh()
    },
  }
}
