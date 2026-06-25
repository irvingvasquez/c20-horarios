import { useState, type FormEvent } from 'react'
import type { StudyProgram, Subject } from '../types'

interface ProgramManagerProps {
  programs: StudyProgram[]
  subjects: Subject[]
  onAdd: (program: Omit<StudyProgram, 'id'>) => Promise<void>
  onUpdate: (program: StudyProgram) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

const emptyForm = {
  name: '',
  acronym: '',
}

export function ProgramManager({
  programs,
  subjects,
  onAdd,
  onUpdate,
  onDelete,
}: ProgramManagerProps) {
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'success'>('error')

  function subjectCount(programId: number) {
    return subjects.filter((subject) => subject.programId === programId).length
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')

    if (!form.name.trim()) {
      setMessage('Escribe el nombre del programa de estudios.')
      setMessageType('error')
      return
    }

    if (!form.acronym.trim()) {
      setMessage('Escribe el acrónimo del programa.')
      setMessageType('error')
      return
    }

    const payload = {
      name: form.name.trim(),
      acronym: form.acronym.trim().toUpperCase(),
    }

    if (editingId) {
      const existing = programs.find((item) => item.id === editingId)
      if (existing) {
        await onUpdate({ ...existing, ...payload })
      }
      setEditingId(null)
    } else {
      await onAdd(payload)
    }

    setForm(emptyForm)
    setMessage('Programa guardado.')
    setMessageType('success')
  }

  async function handleDelete(id: number) {
    setMessage('')
    try {
      await onDelete(id)
      setMessage('Programa eliminado.')
      setMessageType('success')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo eliminar el programa.')
      setMessageType('error')
    }
  }

  function startEdit(program: StudyProgram) {
    setEditingId(program.id ?? null)
    setForm({
      name: program.name,
      acronym: program.acronym,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2>Programas de estudios</h2>
          <p>Cada programa agrupa sus materias. Un programa tiene muchas materias.</p>
        </div>
      </header>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Nombre
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Ej. Ingeniería en Sistemas"
          />
        </label>
        <label>
          Acrónimo
          <input
            value={form.acronym}
            onChange={(event) => setForm({ ...form, acronym: event.target.value })}
            placeholder="Ej. IS"
            maxLength={12}
          />
        </label>
        <div className="form-actions">
          <button type="submit">{editingId ? 'Guardar cambios' : 'Agregar programa'}</button>
          {editingId && (
            <button type="button" className="secondary" onClick={cancelEdit}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {message && <p className={`message ${messageType}`}>{message}</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Acrónimo</th>
              <th>Programa</th>
              <th>Materias</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {programs.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-cell">
                  Aún no hay programas registrados.
                </td>
              </tr>
            ) : (
              programs.map((program) => (
                <tr key={program.id}>
                  <td>
                    <span className="acronym-badge">{program.acronym || '—'}</span>
                  </td>
                  <td>{program.name}</td>
                  <td>{subjectCount(program.id!)}</td>
                  <td className="row-actions">
                    <button type="button" className="link" onClick={() => startEdit(program)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="link danger"
                      onClick={() => program.id && void handleDelete(program.id)}
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
