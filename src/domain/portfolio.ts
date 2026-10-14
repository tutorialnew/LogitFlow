/**
 * Внутренний шов: портфельный симулятор.
 *
 * Число дефолтов — сумма независимых бернуллиев с разными вероятностями
 * (пуассон-биномиальное распределение). Считается точно за O(N²) динамикой,
 * поэтому график не «прыгает» и воспроизводится на защите.
 */
import type { BorrowerProfile, DealTerms, PortfolioOutcome, PortfolioBin } from './types'

/** Детерминированный PRNG: один seed — один портфель. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Точное распределение числа дефолтов.
 * `dp[k]` — вероятность ровно k дефолтов среди уже обработанных займов.
 */
export function defaultDistribution(pds: readonly number[]): number[] {
  const dp = [1]
  for (const pd of pds) {
    const next = new Array<number>(dp.length + 1).fill(0)
    for (let k = 0; k < dp.length; k++) {
      next[k] = (next[k] ?? 0) + dp[k]! * (1 - pd)
      next[k + 1] = (next[k + 1] ?? 0) + dp[k]! * pd
    }
    dp.length = next.length
    for (let k = 0; k < next.length; k++) dp[k] = next[k]!
  }
  return dp
}

/** Доходность сценария при k дефолтах из n. Доли единицы: 0.30 = +30 %. */
export function pnlFor(defaults: number, loans: number, rate: number, lgd: number): number {
  if (loans === 0) return 0
  const survivors = loans - defaults
  return ((survivors * (1 + rate) + defaults * (1 - lgd)) / loans) - 1
}

/**
 * Квантиль распределения доходностей на уровне alpha (слева, по худшей части).
 * Массив идёт от лучших сценариев к худшим, поэтому обходим с конца.
 */
function quantile(bins: PortfolioBin[], alpha: number): number {
  let acc = 0
  for (let i = bins.length - 1; i >= 0; i--) {
    acc += bins[i]!.probability
    if (acc >= alpha - 1e-12) return bins[i]!.pnlPercent
  }
  return bins[bins.length - 1]?.pnlPercent ?? 0
}

export function simulatePortfolio(
  pds: readonly number[],
  terms: Pick<DealTerms, 'rate' | 'lgd'>,
  amountPerLoan: number,
  perLoanReturn: number,
): PortfolioOutcome {
  const loans = pds.length
  const probabilities = defaultDistribution(pds)

  const distribution: PortfolioBin[] = probabilities.map((probability, defaults) => ({
    defaults,
    probability,
    multiple: (1 - terms.lgd) * (defaults / loans) + (1 + terms.rate) * (1 - defaults / loans),
    pnlPercent: pnlFor(defaults, loans, terms.rate, terms.lgd),
  }))

  const expectedReturn = distribution.reduce((acc, bin) => acc + bin.probability * bin.pnlPercent, 0)
  const probabilityOfProfit = distribution
    .filter((bin) => bin.pnlPercent > 1e-9)
    .reduce((acc, bin) => acc + bin.probability, 0)

  const var95 = quantile(distribution, 0.05)
  const tail = distribution.filter((bin) => bin.pnlPercent <= var95 + 1e-12)
  const tailMass = tail.reduce((acc, bin) => acc + bin.probability, 0)
  const cvar95 =
    tailMass > 0
      ? tail.reduce((acc, bin) => acc + bin.probability * bin.pnlPercent, 0) / tailMass
      : var95

  return {
    loans,
    amountPerLoan,
    totalInvested: Math.round(loans * amountPerLoan * 1000) / 1000,
    averagePd: loans === 0 ? 0 : pds.reduce((a, b) => a + b, 0) / loans,
    distribution,
    expectedReturn,
    probabilityOfProfit,
    probabilityOfLoss: 1 - probabilityOfProfit,
    probabilityLossAbove10: distribution
      .filter((bin) => bin.pnlPercent < -0.1)
      .reduce((acc, bin) => acc + bin.probability, 0),
    var95,
    cvar95,
    worstCase: pnlFor(loans, loans, terms.rate, terms.lgd),
    bestCase: pnlFor(0, loans, terms.rate, terms.lgd),
    singleLoanExpectation: perLoanReturn,
  }
}

/** Профили заёмщиков для сгенерированного портфеля. */
export function generateBorrowers(count: number, seed: number): BorrowerProfile[] {
  const rng = mulberry32(seed)
  const industries: BorrowerProfile['industry'][] = ['it', 'retail', 'food', 'logistics', 'manufacturing', 'construction']

  return Array.from({ length: count }, (_, i) => {
    const industry = industries[Math.floor(rng() * industries.length)]!
    const revenue = Math.round(10 ** (1 + rng() * 1.8) * 10) / 10
    const ageMonths = Math.round(12 + rng() * 200)
    const debtToEbitda = Math.round(rng() * 6 * 10) / 10
    const netMargin = Math.round((-5 + rng() * 28) * 10) / 10
    return {
      name: `Заёмщик ${i + 1}`,
      industry,
      revenue,
      ageMonths,
      debtToEbitda,
      netMargin,
      hasCollateral: rng() > 0.4,
    }
  })
}