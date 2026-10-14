/**
 * Внутренний шов: профиль риска (оси радар-чарта) и сравнение с эталоном отрасли.
 */
import { INDUSTRY_BY_ID } from './model'
import { clamp, safeLog } from './normalize'
import type { BenchmarkComparison, BorrowerProfile, RadarAxis } from './types'

const CAP_SCALE_REVENUE = 500
const CAP_AGE_YEARS = 16
const CAP_DEBT = 8
const MARGIN_FLOOR = -10
const MARGIN_SPAN = 50

export const RADAR_AXES: Array<Omit<RadarAxis, 'company' | 'industry'>> = [
  { key: 'scale', label: 'Масштаб' },
  { key: 'age', label: 'Возраст' },
  { key: 'stability', label: 'Устойчивость' },
  { key: 'profitability', label: 'Рентабельность' },
  { key: 'industry', label: 'Отрасль' },
  { key: 'collateral', label: 'Обеспечение' },
]

function profileOf(company: {
  revenue: number
  ageMonths: number
  debtToEbitda: number
  netMargin: number
  industry: BorrowerProfile['industry']
  hasCollateral: boolean
}): number[] {
  return [
    clamp(safeLog(company.revenue, 0) / Math.log(CAP_SCALE_REVENUE), 0, 1),
    clamp(safeLog(1 + company.ageMonths / 12, 0) / Math.log(1 + CAP_AGE_YEARS), 0, 1),
    clamp(1 - company.debtToEbitda / CAP_DEBT, 0, 1),
    clamp((company.netMargin - MARGIN_FLOOR) / MARGIN_SPAN, 0, 1),
    clamp(1 - INDUSTRY_BY_ID[company.industry].risk, 0, 1),
    0.5 + 0.5 * (company.hasCollateral ? 1 : 0),
  ]
}

export function buildRadar(borrower: BorrowerProfile): { axes: RadarAxis[] } {
  const industry = INDUSTRY_BY_ID[borrower.industry]
  const company = profileOf(borrower)
  const benchmark = profileOf({ ...industry.benchmark, industry: industry.id })

  const axes = RADAR_AXES.map((axis, i) => ({
    ...axis,
    company: round2(company[i]!),
    industry: round2(benchmark[i]!),
  }))

  return { axes }
}

const round2 = (n: number) => Math.round(n * 100) / 100

const BENCHMARK_META: Array<{
  key: BenchmarkComparison['key']
  label: string
  better: 'higher' | 'lower'
  unit: string
}> = [
  { key: 'revenue', label: 'Выручка', better: 'higher', unit: 'млн ₽/год' },
  { key: 'ageMonths', label: 'Возраст', better: 'higher', unit: 'мес.' },
  { key: 'debtToEbitda', label: 'Долговая нагрузка', better: 'lower', unit: '× EBITDA' },
  { key: 'netMargin', label: 'Рентабельность', better: 'higher', unit: '%' },
  { key: 'hasCollateral', label: 'Обеспечение', better: 'higher', unit: 'да/нет' },
]

export function buildBenchmark(borrower: BorrowerProfile): BenchmarkComparison[] {
  const { benchmark } = INDUSTRY_BY_ID[borrower.industry]

  return BENCHMARK_META.map(({ key, label, better, unit }) => {
    const companyValue = borrower[key] === true ? 1 : Number(borrower[key])
    const industryValue = benchmark[key] === true ? 1 : Number(benchmark[key])
    const ratio = industryValue === 0 ? 0 : companyValue / industryValue

    return { key, label, companyValue, industryValue, ratio, better, unit }
  })
}