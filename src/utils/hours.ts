export function roundHours(value: number): number {
  return Math.round(value * 10) / 10
}

export function parseHoursInput(value: string): number {
  if (value.trim() === '') return 0
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? roundHours(parsed) : 0
}

export function formatHours(value: number): string {
  const rounded = roundHours(value)
  return Number.isInteger(rounded) ? `${rounded}h` : `${rounded.toFixed(1)}h`
}

export function hoursFitWithin(needed: number, available: number): boolean {
  return roundHours(needed) <= roundHours(available) + 0.001
}

export function isDayComplete(total: number, target: number): boolean {
  return roundHours(total) >= roundHours(target)
}

export const HOUR_INPUT_STEP = 0.5
export const HOUR_INPUT_MIN = 0.5
