import { useState, type FormEvent } from 'react'
import type { StudyProgram, Subject } from '../types'
import { formatProgramLabel } from '../utils/programs'
import { HOUR_INPUT_MIN, HOUR_INPUT_STEP, parseHoursInput, roundHours } from '../utils/hours'
import { formatHours } from '../utils/schedule'

interface SubjectManagerProps {
  programs: StudyProgram[]
  subjects: Subject[]
  onAdd: (subject: Omit<Subject, 'id'>) => Promise<void>
  onUpdate: (subject: Subject) => Promise<void>
  onDelete: (id: number) => Promise<void>
  getRemainingHours: (subject: Subject) => number
}

const emptyForm = {
  programId: '' as number | '',
  name: '',
  totalHours: 40,
  hoursPerSession: 2,
}

export function SubjectManager({
  programs,
  subjects,
  onAdd,
  onUpdate,
  onDelete,
  getRemainingHours,
}: SubjectManagerProps) {
  const [form, setForm] = useState(emptyForm)
  const [filterProgramId, setFilterProgramId] = useState<number | ''>('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  const visibleSubjects = filterProgramId
    ? subjects.filter((subject) => subject.programId === filterProgramId)
    : subjects

  function getProgramLabel(programId: number) {
    const program = programs.find((item) => item.id === programId)
    return program ? formatProgramLabel(program) : '—'
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')

    if (!form.programId) {
      setMessage('Selecciona un programa de estudios.')
      return
    }

    if (!form.name.trim()) {
      setMessage('Escribe el nombre de la materia.')
      return
    }

    if (form.totalHours <= 0 || form.hoursPerSession <= 0) {
      setMessage('Las horas deben ser mayores a cero.')
      return
    }

    if (form.hoursPerSession > form.totalHours) {
      setMessage('Las horas por día no pueden superar el total.')
      return
    }

    const payload = {
      programId: form.programId,
      name: form.name.trim(),
      totalHours: roundHours(form.totalHours),
      hoursPerSession: roundHours(form.hoursPerSession),
    }

    if (editingId) {
      const existing = subjects.find((item) => item.id === editingId)
      if (existing) {
        await onUpdate({ ...existing, ...payload })
      }
      setEditingId(null)
    } else {
      await onAdd(payload)
    }

    setForm(emptyForm)
  }

  function startEdit(subject: Subject) {
    setEditingId(subject.id ?? null)
    setForm({
      programId: subject.programId,
      name: subject.name,
      totalHours: subject.totalHours,
      hoursPerSession: subject.hoursPerSession,
    })
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2>Materias</h2>
          <p>Cada materia pertenece a un programa de estudios.</p>
        </div>
      </header>

      {programs.length === 0 ? (
        <p className="message error">
          Primero crea al menos un programa de estudios en la pestaña Programas.
        </p>
      ) : (
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Programa
            <select
              value={form.programId}
              onChange={(event) =>
                setForm({
                  ...form,
                  programId: event.target.value ? Number(event.target.value) : '',
                })
              }
            >
              <option value="">Selecciona un programa</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {formatProgramLabel(program)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Nombre
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Ej. Matemáticas II"
            />
          </label>
          <label>
            Horas totales
            <input
              type="number"
              min={HOUR_INPUT_MIN}
              step={HOUR_INPUT_STEP}
              value={form.totalHours}
              onChange={(event) =>
                setForm({ ...form, totalHours: parseHoursInput(event.target.value) })
              }
            />
          </label>
          <label>
            Horas por día
            <input
              type="number"
              min={HOUR_INPUT_MIN}
              step={HOUR_INPUT_STEP}
              value={form.hoursPerSession}
              onChange={(event) =>
                setForm({ ...form, hoursPerSession: parseHoursInput(event.target.value) })
              }
            />
          </label>
          <div className="form-actions">
            <button type="submit">{editingId ? 'Guardar cambios' : 'Agregar materia'}</button>
            {editingId && (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setEditingId(null)
                  setForm(emptyForm)
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {message && <p className="message error">{message}</p>}

      <div className="filter-row">
        <label>
          Filtrar por programa
          <select
            value={filterProgramId}
            onChange={(event) =>
              setFilterProgramId(event.target.value ? Number(event.target.value) : '')
            }
          >
            <option value="">Todos</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {formatProgramLabel(program)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Programa</th>
              <th>Materia</th>
              <th>Total</th>
              <th>Por día</th>
              <th>Pendientes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visibleSubjects.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  Aún no hay materias registradas.
                </td>
              </tr>
            ) : (
              visibleSubjects.map((subject) => (
                <tr key={subject.id}>
                  <td>{getProgramLabel(subject.programId)}</td>
                  <td>{subject.name}</td>
                  <td>{formatHours(subject.totalHours)}</td>
                  <td>{formatHours(subject.hoursPerSession)}</td>
                  <td>{formatHours(getRemainingHours(subject))}</td>
                  <td className="row-actions">
                    <button type="button" className="link" onClick={() => startEdit(subject)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="link danger"
                      onClick={() => subject.id && onDelete(subject.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
