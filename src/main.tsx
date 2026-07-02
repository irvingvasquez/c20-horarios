import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ActivityManager } from './components/ActivityManager'
import { ExportPanel } from './components/ExportPanel'
import { ProgramManager } from './components/ProgramManager'
import { ScheduleWizard } from './components/ScheduleWizard'
import { SubjectManager } from './components/SubjectManager'
import { useAppData } from './hooks/useAppData'
import { getSubjectRemainingHours } from './utils/schedule'
import './index.css'

type Tab = 'programas' | 'materias' | 'actividades' | 'horario' | 'datos'

const tabs: { id: Tab; label: string }[] = [
  { id: 'programas', label: 'Programas' },
  { id: 'materias', label: 'Materias' },
  { id: 'actividades', label: 'Actividades' },
  { id: 'horario', label: 'Horario' },
  { id: 'datos', label: 'Datos' },
]

function App() {
  const [tab, setTab] = useState<Tab>('materias')
  const data = useAppData()

  if (data.loading) {
    return <div className="loading-screen">Cargando horario...</div>
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Carga horaria</p>
          <h1>C20 Horarios</h1>
          <p className="subtitle">
            Administra programas, materias, asigna horarios de clase y exporta tu cuadro horario.
          </p>
        </div>
      </header>

      <nav className="tab-nav">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? 'tab active' : 'tab'}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'programas' && (
          <ProgramManager
            programs={data.programs}
            subjects={data.subjects}
            onAdd={data.addProgram}
            onUpdate={data.updateProgram}
            onDelete={data.deleteProgram}
          />
        )}

        {tab === 'materias' && (
          <SubjectManager
            programs={data.programs}
            subjects={data.subjects}
            onAdd={data.addSubject}
            onUpdate={data.updateSubject}
            onDelete={data.deleteSubject}
            getRemainingHours={(subject) => getSubjectRemainingHours(subject, data.schedule)}
          />
        )}

        {tab === 'actividades' && (
          <ActivityManager
            activities={data.activities}
            onAdd={data.addActivity}
            onUpdate={data.updateActivity}
            onDelete={data.deleteActivity}
          />
        )}

        {tab === 'horario' && (
          <ScheduleWizard
            programs={data.programs}
            subjects={data.subjects}
            activities={data.activities}
            schedule={data.schedule}
            daySettings={data.daySettings}
            onAssignSubject={data.addScheduleEntries}
            onAssignActivity={data.addScheduleEntries}
            onClearSchedule={data.clearSchedule}
            onUpdateEntry={data.updateScheduleEntry}
            onUpdateEntries={data.updateScheduleEntries}
            onGenerateDay={data.generateDaySchedule}
            onUpsertDaySetting={data.upsertDaySetting}
          />
        )}

        {tab === 'datos' && <ExportPanel onImported={data.refresh} />}
      </main>

      <footer className="app-footer">
        <p>
          Desarrollado por{' '}
          <a href="https://jivg.org" target="_blank" rel="noreferrer">
            Juan Irving Vasquez
          </a>
        </p>
        <p>
          Centro de Innovación y Desarrollo Tecnológico en Cómputo · Instituto Politécnico Nacional
        </p>
        <p>Licencia BSD 3-Clause</p>
      </footer>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
