function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export function parseDateLike(input?: string | number | Date | null): Date | null {
  if (!input && input !== 0) return null
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input
  if (typeof input === 'number') {
    const date = new Date(input)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const raw = String(input).trim()
  if (!raw) return null

  const normalized = raw.replace('T', ' ').replace(/Z$/, '').replace(/\.\d+$/, '')
  const match = normalized.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/)
  if (match) {
    const [, y, m, d, hh = '0', mm = '0', ss = '0'] = match
    const date = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss))
    return Number.isNaN(date.getTime()) ? null : date
  }

  const fallback = new Date(normalized.replace(/-/g, '/'))
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

export function formatDateTimeFixed(input?: string | number | Date | null): string {
  const date = parseDateLike(input)
  if (!date) return '-'
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}
