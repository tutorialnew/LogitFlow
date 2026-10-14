/**
 * СОГЛАСОВАННАЯ ГРАНИЦА МОДУЛЯ (см. docs/ADR-001-math-core-seam.md).
 *
 * Единственный вход математического ядра. UI вызывает его и рисует результат;
 * тесты проверяют его и ничего больше. Всё, что внутри — приватная реализация.
 *
 * Модуль чистый: ни React, ни DOM, ни Math.random, ни Date. Один и тот же вход
 * всегда даёт один и тот же выход.
 */
import { INDUSTRY_BY_ID } from './model'
import { normalizeBorrower, normalizePortfolio, normalizeTerms } from './normalize'
import { gradeFor, probabilityOfDefault, scoreLogit } from './factors'
import { expectedReturn } from './expectedReturn'
import { buildBenchmark, buildRadar } from './riskProfile'
import { generateBorrowers, simulatePortfolio } from './portfolio'
import { buildNarrative } from './narrative'
import type {
  AssessmentInput,
  AssessmentResult,
  BorrowerProfile,
  DealTerms,
  FactorContribution,
  PortfolioOutcome,
  PortfolioResult,
} from './types'

export function calculateAssessment(input: AssessmentInput): AssessmentResult {
  const borrower = normalizeBorrower(input.borrower)
  const terms = normalizeTerms(input.terms)

  const { logit, factors } = scoreLogit(borrower)
  const pd = probabilityOfDefault(logit)
  const grade = gradeFor(pd)
  const expected = expectedReturn(pd, terms)

  const contributions: FactorContribution[] = factors.map((factor) => ({
    key: factor.key,
    label: factor.label,
    humanValue: factor.humanValue,
    humanCenter: factor.humanCenter,
    beta: factor.beta,
    contribution: factor.contribution,
    effect: factor.effect,
    comment: factor.comment,
  }))

  const topRiskFactor = pickStrongest(contributions, (c) => c.contribution)
  const topSafetyFactor = pickStrongest(contributions, (c) => -c.contribution)

  const industry = INDUSTRY_BY_ID[borrower.industry]

  return {
    borrower,
    terms,
    logit,
    pd,
    grade: grade.code,
    gradeLabel: grade.label,
    gradeDescription: grade.description,
    gradeTone: grade.tone,
    contributions,
    topRiskFactor,
    topSafetyFactor,
    benchmark: buildBenchmark(borrower),
    radar: buildRadar(borrower),
    expected,
    narrative: buildNarrative({
      borrowerName: borrower.name,
      industryLabel: industry.label,
      pd,
      grade,
      topRisk: topRiskFactor,
      topSafety: topSafetyFactor,
      expectedReturn: expected.expectedReturn,
      riskFreeRate: terms.riskFreeRate,
      premium: expected.premium,
      coversRisk: expected.coversRisk,
      breakEvenRate: expected.breakEvenRate,
    }),
    portfolio: buildPortfolio(input.portfolio, borrower, terms),
  }
}

/** Фактор с наибольшим ненулевым эффектом в указанную сторону проекции. */
function pickStrongest(
  contributions: FactorContribution[],
  project: (c: FactorContribution) => number,
): FactorContribution | null {
  let best: FactorContribution | null = null
  let bestValue = 0
  for (const contribution of contributions) {
    if (contribution.effect === 'neutral') continue
    const value = project(contribution)
    if (best === null || value > bestValue) {
      best = contribution
      bestValue = value
    }
  }
  return best
}

function buildPortfolio(
  spec: AssessmentInput['portfolio'],
  current: BorrowerProfile,
  terms: DealTerms,
): PortfolioResult | null {
  const normalized = normalizePortfolio(spec)
  if (!normalized) return null

  const { loans, amountPerLoan, mode, seed = 1 } = normalized
  const entries = normalized.entries ?? []

  const generated = runSimulation(generateBorrowers(loans, seed), terms, amountPerLoan)
  const manual = entries.length > 0 ? runSimulation(entries, terms, amountPerLoan) : null

  const fallback = runSimulation([current], terms, amountPerLoan)
  const active = mode === 'manual' ? (manual ?? runSimulation([], terms, amountPerLoan)) : generated

  return { mode, generated, manual, active: active ?? fallback }
}

function runSimulation(
  borrowers: BorrowerProfile[],
  terms: DealTerms,
  amountPerLoan: number,
): PortfolioOutcome {
  const normalized = normalizeTerms(terms)
  const pds = borrowers.map((b) => probabilityOfDefault(scoreLogit(normalizeBorrower(b)).logit))
  const perLoan =
    borrowers.length === 0
      ? 0
      : borrowers
          .map((_, i) => expectedReturn(pds[i]!, normalized).expectedReturn)
          .reduce((acc, r) => acc + r, 0) / borrowers.length

  return simulatePortfolio(pds, normalized, amountPerLoan, perLoan)
}