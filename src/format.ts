import type { RiskTone, VerdictCode } from '@/domain/types'

/** Цвета шкалы риска. Порядок совпадает с GRADE_LADDER: девять ступеней. */
export const TONE_COLOR: Record<RiskTone, string> = {
  emerald: '#34d399',
  green: '#4ade80',
  lime: '#a3e635',
  yellow: '#facc15',
  amber: '#f59e0b',
  orange: '#fb923c',
  coral: '#f87171',
  red: '#ef4444',
  crimson: '#be123c',
}

export const VERDICT_COLOR: Record<VerdictCode, string> = {
  attractive: '#34d399',
  fair: '#facc15',
  underpriced: '#f59e0b',
  critical: '#ef4444',
}

const pct1 = new Intl.NumberFormat('ru-RU', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const pct2 = new Intl.NumberFormat('ru-RU', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const num0 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })
const num1 = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** 12.3 % — digits задаёт знаков после запятой. */
export const percent = (value: number, digits = 1): string => {
  if (digits === 0) return `${num0.format(value * 100)} %`
  if (digits === 2) return pct2.format(value)
  if (digits > 2) return `${(value * 100).toFixed(digits).replace('.', ',')} %`
  return pct1.format(value)
}

/** +3.5 п.п. / −3.5 п.п. — знак всегда явный, иначе колонка не читается. */
export const signedPercent = (value: number, digits: 0 | 1 | 2 = 1): string => {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '±'
  return `${sign}${percent(Math.abs(value), digits)}`
}

/** 18 млн ₽ */
export const money = (value: number): string => `${num1.format(value)} млн ₽`

/** 4.2 × EBITDA */
export const times = (value: number): string => `${num1.format(value)} × EBITDA`

/** Логарифмическая шкала PD: 0.1 % и 100 % читаются одинаково хорошо. */
export const logPosition = (pd: number): number => {
  const floor = Math.log10(0.001)
  const ceil = Math.log10(1)
  const value = Math.log10(Math.min(Math.max(pd, 0.001), 1))
  return ((value - floor) / (ceil - floor)) * 100
}