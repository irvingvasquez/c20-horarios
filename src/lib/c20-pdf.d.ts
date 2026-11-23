import type { ExportPayload } from '../types'

export interface C20PdfOptions {
  filasMinimas?: number
}

export interface C20Fila {
  nombre: string
  dias: string[]
  horas: number
}

export function construirFilas(datos: ExportPayload): C20Fila[]
export function buildC20Html(datos: ExportPayload, opciones?: C20PdfOptions): string
export function printC20(datos: ExportPayload, opciones?: C20PdfOptions): void