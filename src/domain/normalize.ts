/** Приведение произвольного пользовательского ввода к валидному доменному значению. */
import type { BorrowerProfile, DealTerms, PortfolioSpec } from './types'
import { INDUSTRY_BY_ID } from './model'
import type { IndustryId } from './types'

const INDUSTRY_IDS = Object.keys(INDUSTRY_BY_ID) as IndustryId[]

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function safeLog(value: number, fallback: number): number {
  return value > 0 ? Math.log(value) : fallback
}

/** Диапазоны ползунков в UI. Тот же модуль читает их для построения подсказок. */
export const FIELD_LIMITS = {
  revenue: { min: 0.5, max: 1000, step: 0.5 },
  ageMonths: { min: 3, max: 360, step: 1 },
  debtToEbitda: { min: 0, max: 12, step: 0.1 },
  netMargin: { min: -40, max: 60, step: 0.5 },
  rate: { min: 0.05, max: 0.6, step: 0.005 },
  lgd: { min: 0.3, max: 1, step: 0.01 },
  riskFreeRate: { min: 0.01, max: 0.3, step: 0.005 },
  portfolioLoans: { min: 1, max: 50, step: 1 },
  amountPerLoan: { min: 0.1, max: 10, step: 0.1 },
} as const

export function normalizeBorrower(input: BorrowerProfile): BorrowerProfile {
  const industry = INDUSTRY_IDS.includes(input.industry) ? input.industry : 'retail'
  return {
    name: typeof input.name === 'string' && input.name.trim() ? input.name.trim().slice(0, 80) : 'Заёмщик',
    industry,
    revenue: clamp(finite(input.revenue, 50), FIELD_LIMITS.revenue.min, FIELD_LIMITS.revenue.max),
    ageMonths: clamp(
      finite(input.ageMonths, 60),
      FIELD_LIMITS.ageMonths.min,
      FIELD_LIMITS.ageMonths.max,
    ),
    debtToEbitda: clamp(
      finite(input.debtToEbitda, 3),
      FIELD_LIMITS.debtToEbitda.min,
      FIELD_LIMITS.debtToEbitda.max,
    ),
    netMargin: clamp(
      finite(input.netMargin, 10),
      FIELD_LIMITS.netMargin.min,
      FIELD_LIMITS.netMargin.max,
    ),
    hasCollateral: Boolean(input.hasCollateral),
  }
}

export function normalizeTerms(input: DealTerms): DealTerms {
  return {
    rate: clamp(finite(input.rate, 0.3), FIELD_LIMITS.rate.min, FIELD_LIMITS.rate.max),
    lgd: clamp(finite(input.lgd, 0.8), FIELD_LIMITS.lgd.min, FIELD_LIMITS.lgd.max),
    riskFreeRate: clamp(
      finite(input.riskFreeRate, 0.18),
      FIELD_LIMITS.riskFreeRate.min,
      FIELD_LIMITS.riskFreeRate.max,
    ),
  }
}

export function normalizePortfolio(input: PortfolioSpec | undefined): PortfolioSpec | undefined {
  if (!input) return undefined
  const mode = input.mode === 'manual' ? 'manual' : 'generated'
  return {
    loans: clamp(
      Math.round(finite(input.loans, 20)),
      FIELD_LIMITS.portfolioLoans.min,
      FIELD_LIMITS.portfolioLoans.max,
    ),
    amountPerLoan: clamp(
      finite(input.amountPerLoan, 1),
      FIELD_LIMITS.amountPerLoan.min,
      FIELD_LIMITS.amountPerLoan.max,
    ),
    mode,
    entries: input.entries ? input.entries.map(normalizeBorrower) : [],
    seed: Math.trunc(finite(input.seed ?? 1, 1)),
  }
}