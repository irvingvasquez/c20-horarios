import { useState } from 'react'
import type { AcademicActivity, DayOfWeek, DayWorkSettings, ScheduleEntry, StudyProgram, Subject } from '../types'
import { ScheduleBuilder } from './ScheduleBuilder'
import { TimeAssignment } from './TimeAssignment'
import { TimetableView } from './TimetableView'

interface ScheduleWizardProps {
  programs: StudyProgram[]
  subjects: Subject[]
  activities: AcademicActivity[]
  schedule: ScheduleEntry[]
  daySettings: DayWorkSettings[]
  onAssignSubject: (entries: Omit<ScheduleEntry, 'id'>[]) => Promise<void>
  onAssignActivity: (entries: Omit<ScheduleEntry, 'id'>[]) => Promise<void>
  onClearSchedule: () => Promise<void>
  onRemoveSubjectFromDay: (subjectId: number, day: DayOfWeek) => Promise<void>
  onClearActivities: () => Promise<void>
  onUpdateEntry: (id: number, changes: Partial<ScheduleEntry>) => Promise<void>
  onUpdateEntries: (updates: Array<{ id: number; startTime: string }>) => Promise<void>
  onGenerateDay: (day: DayOfWeek) => Promise<void>
  onUpsertDaySetting: (day: DayOfWeek, workDayStart: string) => Promise<void>
}

const steps = [
  { id: 1, label: 'Paso 1: Carga horaria' },
  { id: 2, label: 'Paso 2: Horas de inicio' },
  { id: 3, label: 'Paso 3: Cuadro horario' },
] as const

type StepId = (typeof steps)[number]['id']

export function ScheduleWizard({
  programs,
  subjects,
  activities,
  schedule,
  daySettings,
  onAssignSubject,
  onAssignActivity,
  onClearSchedule,
  onRemoveSubjectFromDay,
  onClearActivities,
  onUpdateEntry,
  onUpdateEntries,
  onGenerateDay,
  onUpsertDaySetting,
}: ScheduleWizardProps) {
  const [step, setStep] = useState<StepId>(1)

  return (
    <div className="schedule-wizard">
      <nav className="step-nav">
        {steps.map((item) => (
          <button
            key={item.id}
            type="button"
            className={step === item.id ? 'step-tab active' : 'step-tab'}
            onClick={() => setStep(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {step === 1 && (
        <ScheduleBuilder
          programs={programs}
          subjects={subjects}
          activities={activities}
          schedule={schedule}
          onAssignSubject={onAssignSubject}
          onAssignActivity={onAssignActivity}
          onRemoveSubjectFromDay={onRemoveSubjectFromDay}
          onClearActivities={onClearActivities}
          onClearSchedule={onClearSchedule}
        />
      )}

      {step === 2 && (
        <TimeAssignment
          schedule={schedule}
          subjects={subjects}
          activities={activities}
          programs={programs}
          daySettings={daySettings}
          onUpdateEntry={onUpdateEntry}
          onUpdateEntries={onUpdateEntries}
          onGenerateDay={onGenerateDay}
          onUpsertDaySetting={onUpsertDaySetting}
        />
      )}

      {step === 3 && (
        <TimetableView
          schedule={schedule}
          subjects={subjects}
          activities={activities}
          programs={programs}
        />
      )}

      <div className="step-actions">
        {step > 1 && (
          <button type="button" className="secondary" onClick={() => setStep((step - 1) as StepId)}>
            Anterior
          </button>
        )}
        {step < 3 && (
          <button type="button" onClick={() => setStep((step + 1) as StepId)}>
            Siguiente
          </button>
        )}
      </div>
    </div>
  )
}
