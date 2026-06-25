import { useState, type FormEvent } from 'react'
import type { AcademicActivity } from '../types'

interface ActivityManagerProps {
  activities: AcademicActivity[]
  onAdd: (activity: Omit<AcademicActivity, 'id'>) => Promise<void>
  onUpdate: (activity: AcademicActivity) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export function ActivityManager({
  activities,
  onAdd,
  onUpdate,
  onDelete,
}: ActivityManagerProps) {
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')

    if (!name.trim()) {
      setMessage('Escribe el nombre de la actividad.')
      return
    }

    if (editingId) {
      const existing = activities.find((item) => item.id === editingId)
      if (existing) {
        await onUpdate({ ...existing, name: name.trim() })
      }
      setEditingId(null)
    } else {
      await onAdd({ name: name.trim() })
    }

    setName('')
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2>Actividades académicas</h2>
          <p>Sirven para completar cada día hasta 8 horas.</p>
        </div>
      </header>

      <form className="inline-form" onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej. Tutorías, planeación, comité..."
        />
        <button type="submit">{editingId ? 'Guardar' : 'Agregar'}</button>
        {editingId && (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setEditingId(null)
              setName('')
            }}
          >
            Cancelar
          </button>
        )}
      </form>

      {message && <p className="message error">{message}</p>}

      <ul className="chip-list">
        {activities.length === 0 ? (
          <li className="empty-cell">Aún no hay actividades registradas.</li>
        ) : (
          activities.map((activity) => (
            <li key={activity.id} className="chip-item">
              <span>{activity.name}</span>
              <span className="chip-actions">
                <button
                  type="button"
                  className="link"
                  onClick={() => {
                    setEditingId(activity.id ?? null)
                    setName(activity.name)
                  }}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="link danger"
                  onClick={() => activity.id && onDelete(activity.id)}
                >
                  Eliminar
                </button>
              </span>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
