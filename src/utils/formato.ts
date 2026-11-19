import type {
  CondicionAdscripcion,
  FormatoC20,
  FormatoDocente,
  ScheduleEntry,
} from '../types'
import { roundHours } from './hours'

export const FORMATO_SETTINGS_ID = 'formato'

export const RFC_PATTERN = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/

export function defaultFormato(): FormatoC20 {
  return {
    escuela: '',
    claveUR: '',
    periodo: '',
    vigencia: '',
    fechaLlenado: '',
    observaciones: '',
    docente: {
      apellidoPaterno: '',
      apellidoMaterno: '',
      nombres: '',
      rfc: '',
      gradoMaximo: '',
      egresadoDe: '',
      especialidad: '',
      departamento: '',
      numeroEmpleado: '',
      fechaIngresoIPN: '',
      horasNombramiento: 40,
      categoria: '',
      condicionAdscripcion: 'base',
      condicionOtro: '',
      jornada: { matutino: true, vespertino: false },
    },
    firmas: {
      profesor: { nombre: '', cargo: 'PROFESOR' },
      subdirector: { nombre: '', cargo: 'SUBDIRECTOR ACADÉMICO' },
      director: { nombre: '', cargo: 'DIRECTOR' },
    },
  }
}

function asCondicion(value: unknown): CondicionAdscripcion {
  if (value === 'base' || value === 'interinato' || value === 'otro') {
    return value
  }
  return 'base'
}

export function mergeFormato(partial?: Partial<FormatoC20> | null): FormatoC20 {
  const base = defaultFormato()
  if (!partial) return base

  const docente: Partial<FormatoDocente> = partial.docente ?? {}
  const firmasPartial: Partial<FormatoC20['firmas']> = partial.firmas ?? {}
  const jornada: Partial<FormatoDocente['jornada']> = docente.jornada ?? {}

  return {
    escuela: partial.escuela ?? base.escuela,
    claveUR: partial.claveUR ?? base.claveUR,
    periodo: partial.periodo ?? base.periodo,
    vigencia: partial.vigencia ?? base.vigencia,
    fechaLlenado: partial.fechaLlenado ?? base.fechaLlenado,
    observaciones: partial.observaciones ?? base.observaciones,
    docente: {
      apellidoPaterno: docente.apellidoPaterno ?? base.docente.apellidoPaterno,
      apellidoMaterno: docente.apellidoMaterno ?? base.docente.apellidoMaterno,
      nombres: docente.nombres ?? base.docente.nombres,
      rfc: docente.rfc ?? base.docente.rfc,
      gradoMaximo: docente.gradoMaximo ?? base.docente.gradoMaximo,
      egresadoDe: docente.egresadoDe ?? base.docente.egresadoDe,
      especialidad: docente.especialidad ?? base.docente.especialidad,
      departamento: docente.departamento ?? base.docente.departamento,
      numeroEmpleado:
        docente.numeroEmpleado !== undefined && docente.numeroEmpleado !== null
          ? String(docente.numeroEmpleado)
          : base.docente.numeroEmpleado,
      fechaIngresoIPN: docente.fechaIngresoIPN ?? base.docente.fechaIngresoIPN,
      horasNombramiento:
        typeof docente.horasNombramiento === 'number' && Number.isFinite(docente.horasNombramiento)
          ? docente.horasNombramiento
          : base.docente.horasNombramiento,
      categoria: docente.categoria ?? base.docente.categoria,
      condicionAdscripcion: asCondicion(docente.condicionAdscripcion),
      condicionOtro: docente.condicionOtro ?? base.docente.condicionOtro,
      jornada: {
        matutino: jornada.matutino ?? base.docente.jornada.matutino,
        vespertino: jornada.vespertino ?? base.docente.jornada.vespertino,
      },
    },
    firmas: {
      profesor: {
        nombre: firmasPartial.profesor?.nombre ?? base.firmas.profesor.nombre,
        cargo: firmasPartial.profesor?.cargo?.trim() || base.firmas.profesor.cargo,
      },
      subdirector: {
        nombre: firmasPartial.subdirector?.nombre ?? base.firmas.subdirector.nombre,
        cargo: firmasPartial.subdirector?.cargo?.trim() || base.firmas.subdirector.cargo,
      },
      director: {
        nombre: firmasPartial.director?.nombre ?? base.firmas.director.nombre,
        cargo: firmasPartial.director?.cargo?.trim() || base.firmas.director.cargo,
      },
    },
  }
}

export function totalScheduleHours(schedule: ScheduleEntry[]): number {
  return roundHours(schedule.reduce((sum, entry) => sum + entry.hours, 0))
}

export function getFormatoWarnings(formato: FormatoC20, schedule: ScheduleEntry[]): string[] {
  const warnings: string[] = []
  const rfc = formato.docente.rfc.trim()

  if (rfc && !RFC_PATTERN.test(rfc)) {
    warnings.push('El R.F.C. no parece válido (formato esperado: 4 letras, 6 dígitos, 3 caracteres).')
  }

  const scheduleTotal = totalScheduleHours(schedule)
  const nombramiento = roundHours(formato.docente.horasNombramiento)

  if (schedule.length > 0 && nombramiento !== scheduleTotal) {
    warnings.push(
      `Las horas de nombramiento (${nombramiento}) no coinciden con la suma del horario (${scheduleTotal}).`,
    )
  }

  if (formato.docente.condicionAdscripcion === 'otro' && !formato.docente.condicionOtro.trim()) {
    warnings.push('Indica la condición de adscripción cuando seleccionas "Otro".')
  }

  return warnings
}