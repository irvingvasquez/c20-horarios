import type { CondicionAdscripcion, FormatoC20, ScheduleEntry } from '../types'
import { getFormatoWarnings } from '../utils/formato'
import { HOUR_INPUT_MIN, HOUR_INPUT_STEP, parseHoursInput } from '../utils/hours'

interface FormatoC20FormProps {
  formato: FormatoC20
  schedule: ScheduleEntry[]
  onUpdate: (next: FormatoC20) => Promise<void>
}

export function FormatoC20Form({ formato, schedule, onUpdate }: FormatoC20FormProps) {
  const warnings = getFormatoWarnings(formato, schedule)

  async function patchFormato(partial: Partial<FormatoC20>) {
    await onUpdate({ ...formato, ...partial })
  }

  async function patchDocente(partial: Partial<FormatoC20['docente']>) {
    await onUpdate({
      ...formato,
      docente: { ...formato.docente, ...partial },
    })
  }

  async function patchFirma(
    role: keyof FormatoC20['firmas'],
    partial: Partial<FormatoC20['firmas'][typeof role]>,
  ) {
    await onUpdate({
      ...formato,
      firmas: {
        ...formato.firmas,
        [role]: { ...formato.firmas[role], ...partial },
      },
    })
  }

  return (
    <div className="formato-stack">
      <header className="formato-header">
        <h2>Datos del formato C-20</h2>
        <p>Información institucional, del docente y firmas para el Formato C-20 del IPN.</p>
      </header>

      <fieldset className="formato-fieldset builder-card">
        <legend>Institución</legend>
        <div className="form-grid">
          <label>
            Escuela
            <input
              value={formato.escuela}
              onChange={(event) => void patchFormato({ escuela: event.target.value })}
            />
          </label>
          <label>
            Clave U.R.
            <input
              value={formato.claveUR}
              onChange={(event) => void patchFormato({ claveUR: event.target.value })}
            />
          </label>
        </div>
        <p className="hint formato-period-hint">
          Periodo, vigencia, fecha de llenado y observaciones se configuran en Horario → Paso 3:
          Cuadro horario.
        </p>
      </fieldset>

      <fieldset className="formato-fieldset builder-card">
        <legend>Docente</legend>
        <div className="form-grid">
          <label>
            Apellido paterno
            <input
              value={formato.docente.apellidoPaterno}
              onChange={(event) => void patchDocente({ apellidoPaterno: event.target.value })}
            />
          </label>
          <label>
            Apellido materno
            <input
              value={formato.docente.apellidoMaterno}
              onChange={(event) => void patchDocente({ apellidoMaterno: event.target.value })}
            />
          </label>
          <label>
            Nombre(s)
            <input
              value={formato.docente.nombres}
              onChange={(event) => void patchDocente({ nombres: event.target.value })}
            />
          </label>
          <label>
            R.F.C.
            <input
              value={formato.docente.rfc}
              onChange={(event) =>
                void patchDocente({ rfc: event.target.value.toUpperCase() })
              }
            />
          </label>
          <label>
            Grado máximo de estudios
            <input
              value={formato.docente.gradoMaximo}
              onChange={(event) => void patchDocente({ gradoMaximo: event.target.value })}
            />
          </label>
          <label>
            Egresado de
            <input
              value={formato.docente.egresadoDe}
              onChange={(event) => void patchDocente({ egresadoDe: event.target.value })}
            />
          </label>
          <label>
            Especialidad
            <input
              value={formato.docente.especialidad}
              onChange={(event) => void patchDocente({ especialidad: event.target.value })}
            />
          </label>
          <label>
            Departamento o academia
            <input
              value={formato.docente.departamento}
              onChange={(event) => void patchDocente({ departamento: event.target.value })}
            />
          </label>
          <label>
            Número de empleado
            <input
              value={formato.docente.numeroEmpleado}
              onChange={(event) => void patchDocente({ numeroEmpleado: event.target.value })}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="formato-fieldset builder-card">
        <legend>Nombramiento</legend>
        <div className="form-grid">
          <label>
            Fecha de ingreso al IPN
            <input
              type="date"
              value={formato.docente.fechaIngresoIPN}
              onChange={(event) => void patchDocente({ fechaIngresoIPN: event.target.value })}
            />
          </label>
          <label>
            Horas de nombramiento
            <input
              type="number"
              min={HOUR_INPUT_MIN}
              step={HOUR_INPUT_STEP}
              value={formato.docente.horasNombramiento}
              onChange={(event) =>
                void patchDocente({
                  horasNombramiento: parseHoursInput(event.target.value),
                })
              }
            />
          </label>
          <label>
            Categoría
            <input
              value={formato.docente.categoria}
              onChange={(event) => void patchDocente({ categoria: event.target.value })}
              placeholder="5440.0E3018-02500"
            />
          </label>
        </div>

        <div className="radio-group">
          <span className="radio-group-label">Condición de adscripción</span>
          <div className="radio-row">
            {(
              [
                ['base', 'Base'],
                ['interinato', 'Interinato'],
                ['otro', 'Otro'],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="radio-option">
                <input
                  type="radio"
                  name="condicionAdscripcion"
                  checked={formato.docente.condicionAdscripcion === value}
                  onChange={() =>
                    void patchDocente({ condicionAdscripcion: value as CondicionAdscripcion })
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {formato.docente.condicionAdscripcion === 'otro' && (
          <label>
            Especificar condición
            <input
              value={formato.docente.condicionOtro}
              onChange={(event) => void patchDocente({ condicionOtro: event.target.value })}
            />
          </label>
        )}

        <div className="checkbox-row">
          <span className="radio-group-label">Jornada de trabajo</span>
          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={formato.docente.jornada.matutino}
              onChange={(event) =>
                void patchDocente({
                  jornada: { ...formato.docente.jornada, matutino: event.target.checked },
                })
              }
            />
            Matutino
          </label>
          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={formato.docente.jornada.vespertino}
              onChange={(event) =>
                void patchDocente({
                  jornada: { ...formato.docente.jornada, vespertino: event.target.checked },
                })
              }
            />
            Vespertino
          </label>
        </div>
      </fieldset>

      <fieldset className="formato-fieldset builder-card">
        <legend>Firmas</legend>
        <div className="form-grid">
          <label>
            Nombre del profesor
            <input
              value={formato.firmas.profesor.nombre}
              onChange={(event) => void patchFirma('profesor', { nombre: event.target.value })}
            />
          </label>
          <label>
            Cargo (profesor)
            <input
              value={formato.firmas.profesor.cargo}
              onChange={(event) => void patchFirma('profesor', { cargo: event.target.value })}
            />
          </label>
          <label>
            Nombre del subdirector académico
            <input
              value={formato.firmas.subdirector.nombre}
              onChange={(event) => void patchFirma('subdirector', { nombre: event.target.value })}
            />
          </label>
          <label>
            Cargo (subdirector)
            <input
              value={formato.firmas.subdirector.cargo}
              onChange={(event) => void patchFirma('subdirector', { cargo: event.target.value })}
            />
          </label>
          <label>
            Nombre del director
            <input
              value={formato.firmas.director.nombre}
              onChange={(event) => void patchFirma('director', { nombre: event.target.value })}
            />
          </label>
          <label>
            Cargo (director)
            <input
              value={formato.firmas.director.cargo}
              onChange={(event) => void patchFirma('director', { cargo: event.target.value })}
            />
          </label>
        </div>
      </fieldset>

      {warnings.length > 0 && (
        <ul className="formato-warnings">
          {warnings.map((warning) => (
            <li key={warning} className="message error">
              {warning}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}