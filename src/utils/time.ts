export function parseTimeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

export function formatMinutesAsTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const hours = Math.floor(normalized / 60)
  const minutes = normalized % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function addHoursToTime(startTime: string, hours: number): string | null {
  const startMinutes = parseTimeToMinutes(startTime)
  if (startMinutes === null) return null
  const durationMinutes = Math.round(hours * 60)
  return formatMinutesAsTime(startMinutes + durationMinutes)
}

export function formatTimeRange(startTime: string, hours: number): string {
  const endTime = addHoursToTime(startTime, hours)
  if (!endTime) return ''
  return `${startTime} - ${endTime}`
}

export function isValidTime(value: string): boolean {
  return parseTimeToMinutes(value) !== null
}
