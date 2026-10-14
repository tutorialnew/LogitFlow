/**
 * Внутренний шов: логистическая регрессия и разложение логита на вклады факторов.
 * Наружу не выставляется — проверяется через `calculateAssessment`.
 */
import { GRADE_LADDER, INDUSTRIES, INDUSTRY_BY_ID, MODEL_CALIBRATION } from './model'
import { clamp, safeLog } from './normalize'
import { sigmoid } from './statistics'
import type { BorrowerProfile, FactorKey, Grade, RiskEffect } from './types'

export interface FactorSpec {
  key: FactorKey
  label: string
  short: string
  /** Что этот фактор значит для инвестора простым языком. */
  hint: string
  /** Значение признака в масштабе модели (после логарифмирования, где нужно). */
  value: (b: BorrowerProfile) => number
  /** Значение признака в человеческих единицах — для текста и подсказок. */
  raw: (b: BorrowerProfile) => number
  /** Опорное значение центра в человеческих единицах. */
  centerRaw: number
  /** Коэффициент β модели. */
  beta: number
  /** Единица измерения. */
  unit: string
  /** Как подписать отклонение заёмщика от центра. */
  formatDelta: (delta: number) => string
}

const nf = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 })

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = Math.round(n) % 10
  const mod100 = Math.round(n) % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

function yearsLabel(months: number): string {
  if (months < 12) return `${Math.round(months)} мес.`
  const years = months / 12
  return `${nf.format(years)} ${plural(years, 'год', 'года', 'лет')}`
}

/** Опорные значения в человеческих единицах: центр фактора = безопасный уровень. */
export const FACTOR_CENTER_RAW: Record<FactorKey, number> = {
  revenue: 50,
  ageMonths: 48,
  debtToEbitda: 3,
  netMargin: 10,
  industryRisk: INDUSTRY_BY_ID.retail.risk,
  hasCollateral: 0,
}

export const FACTOR_SPECS: FactorSpec[] = [
  {
    key: 'revenue',
    label: 'Годовая выручка',
    short: 'Выручка',
    hint: 'Масштаб бизнеса. Крупная выручка означает, что клиентская база и оборачиваемость уже проверены.',
    value: (b) => safeLog(b.revenue, Math.log(50)),
    raw: (b) => b.revenue,
    centerRaw: FACTOR_CENTER_RAW.revenue,
    beta: MODEL_CALIBRATION.betas.revenue,
    unit: 'млн ₽/год',
    formatDelta: (d) => `${nf.format(Math.abs(d))} млн ₽/год`,
  },
  {
    key: 'ageMonths',
    label: 'Срок существования',
    short: 'Возраст',
    hint: 'Сколько лет бизнес работает. Накопленная кредитная история резко снижает риск дефолта.',
    value: (b) => safeLog(1 + b.ageMonths / 12, Math.log(5)),
    raw: (b) => b.ageMonths,
    centerRaw: FACTOR_CENTER_RAW.ageMonths,
    beta: MODEL_CALIBRATION.betas.ageMonths,
    unit: 'лет',
    formatDelta: (d) => yearsLabel(Math.abs(d)),
  },
  {
    key: 'debtToEbitda',
    label: 'Долговая нагрузка',
    short: 'Долговая нагрузка',
    hint: 'Отношение всех долгов к годовой прибыли (EBITDA). Каждый дополнительный «turn» долга заметно повышает риск.',
    value: (b) => b.debtToEbitda,
    raw: (b) => b.debtToEbitda,
    centerRaw: FACTOR_CENTER_RAW.debtToEbitda,
    beta: MODEL_CALIBRATION.betas.debtToEbitda,
    unit: '× EBITDA',
    formatDelta: (d) => `${nf.format(Math.abs(d))} × EBITDA`,
  },
  {
    key: 'netMargin',
    label: 'Рентабельность',
    short: 'Рентабельность',
    hint: 'Сколько процентов выручки остаётся после расходов и налогов. Запас прочности на случай шока.',
    value: (b) => b.netMargin,
    raw: (b) => b.netMargin,
    centerRaw: FACTOR_CENTER_RAW.netMargin,
    beta: MODEL_CALIBRATION.betas.netMargin,
    unit: '%',
    formatDelta: (d) => `${nf.format(Math.abs(d))} п.п. маржи`,
  },
  {
    key: 'industryRisk',
    label: 'Отраслевой риск',
    short: 'Отрасль',
    hint: 'Цикличность и волатильность спроса в выбранной отрасли. Строительство рискованнее IT.',
    value: (b) => INDUSTRY_BY_ID[b.industry].risk,
    raw: (b) => INDUSTRY_BY_ID[b.industry].risk,
    centerRaw: FACTOR_CENTER_RAW.industryRisk,
    beta: MODEL_CALIBRATION.betas.industryRisk,
    unit: 'индекс риска',
    formatDelta: (d) => `${nf.format(Math.abs(d * 100))} пунктов отраслевого индекса`,
  },
  {
    key: 'hasCollateral',
    label: 'Залог или поручительство',
    short: 'Обеспечение',
    hint: 'Обеспечение кредита. Даже при дефолте инвестор сможет вернуть часть вложенного.',
    value: (b) => (b.hasCollateral ? 1 : 0),
    raw: (b) => (b.hasCollateral ? 1 : 0),
    centerRaw: FACTOR_CENTER_RAW.hasCollateral,
    beta: MODEL_CALIBRATION.betas.hasCollateral,
    unit: 'да/нет',
    formatDelta: () => '',
  },
]

export interface ScoredFactor {
  key: FactorKey
  label: string
  value: number
  center: number
  beta: number
  /** β · (X − center): сдвиг логита. */
  contribution: number
  effect: RiskEffect
  humanValue: string
  humanCenter: string
  comment: string
}

/** Z = β₀ + Σ βᵢ·(Xᵢ − centerᵢ) и пошаговое разложение по факторам. */
export function scoreLogit(borrower: BorrowerProfile): { logit: number; factors: ScoredFactor[] } {
  const { betas, centers, intercept } = MODEL_CALIBRATION
  let logit = intercept
  const factors: ScoredFactor[] = []

  for (const spec of FACTOR_SPECS) {
    const value = spec.value(borrower)
    const center = centers[spec.key]
    // `+ 0` убирает знак минус у нуля: -1.05 * 0 === -0.
    const contribution = betas[spec.key] * (value - center) + 0
    logit += contribution
    factors.push({
      key: spec.key,
      label: spec.label,
      value,
      center,
      beta: betas[spec.key],
      contribution,
      effect: contribution > 0.005 ? 'raises-risk' : contribution < -0.005 ? 'lowers-risk' : 'neutral',
      humanValue: humanValue(spec, spec.raw(borrower)),
      humanCenter: humanValue(spec, spec.centerRaw),
      comment: describeContribution(spec, contribution, spec.raw(borrower) - spec.centerRaw),
    })
  }

  return { logit, factors }
}

function humanValue(spec: FactorSpec, raw: number): string {
  switch (spec.key) {
    case 'revenue':
      return `${nf.format(raw)} млн ₽/год`
    case 'ageMonths':
      return yearsLabel(raw)
    case 'debtToEbitda':
      return `${nf.format(raw)} × EBITDA`
    case 'netMargin':
      return `${nf.format(raw)} %`
    case 'industryRisk': {
      const industry = INDUSTRIES.find((i) => Math.abs(i.risk - raw) < 1e-9)
      return industry
        ? `${industry.label} · риск ${Math.round(raw * 100)} из 100`
        : `Риск ${Math.round(raw * 100)} из 100`
    }
    case 'hasCollateral':
      return raw >= 1 ? 'Есть' : 'Нет'
  }
}

function describeContribution(spec: FactorSpec, contribution: number, rawDelta: number): string {
  const size = Math.abs(contribution)
  const points = `${size.toFixed(2)} пункта логита`

  if (spec.key === 'hasCollateral') {
    if (contribution < -0.005) {
      return `Обеспечение оформлено: риск ниже на ${points}. При дефолте возврат возможен.`
    }
    return 'Обеспечение не оформлено: возврат при дефолте возможен только с продажи имущества.'
  }

  if (contribution > 0.005) {
    return `${spec.short} на ${spec.formatDelta(rawDelta)} хуже безопасного уровня — повышает риск на ${points}.`
  }
  if (contribution < -0.005) {
    return `${spec.short} на ${spec.formatDelta(rawDelta)} лучше безопасного уровня — снижает риск на ${points}.`
  }
  return `${spec.short} совпадает с безопасным уровнем и на риск не влияет.`
}

export function probabilityOfDefault(logit: number): number {
  return clamp(sigmoid(logit), 0, 1)
}

export function gradeFor(pd: number): Grade {
  const step = GRADE_LADDER.find((s) => pd < s.max) ?? GRADE_LADDER[GRADE_LADDER.length - 1]!
  return { code: step.code, label: step.label, tone: step.tone, description: step.description }
}