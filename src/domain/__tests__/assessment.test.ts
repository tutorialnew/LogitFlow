/**
 * Тесты математического ядра.
 *
 * Единственная пересекаемая граница — `calculateAssessment`. Тесты проверяют поведение,
 * а не внутренности: переименование приватной функции не должно ломать сборку тестов.
 * Ожидаемые значения взяты из docs/MATH-SPEC.md (worked examples), а не пересчитываются
 * тем же кодом, что и реализация.
 */
import { describe, expect, it } from 'vitest'
import { calculateAssessment } from '../calculateAssessment'
import type { AssessmentInput, BorrowerProfile } from '../types'
import { COMPANY_PRESETS } from '../presets'

// Опорная компания из docs/MATH-SPEC.md: все признаки ровно в центре → Z = β₀ = −1.35.
const REF: BorrowerProfile = {
  name: 'Эталон',
  revenue: 50,
  ageMonths: 48,
  debtToEbitda: 3,
  netMargin: 10,
  industry: 'retail',
  hasCollateral: false,
}

const TERMS = { rate: 0.3, lgd: 0.8, riskFreeRate: 0.18 }

const assess = (patch: Partial<BorrowerProfile>, extra: Partial<AssessmentInput> = {}) =>
  calculateAssessment({
    borrower: { ...REF, ...patch },
    terms: TERMS,
    ...extra,
  })

describe('вероятность дефолта', () => {
  it('даёт 20.6% для эталонной компании из спецификации', () => {
    const { pd, logit } = assess({})
    expect(logit).toBeCloseTo(-1.35, 6)
    expect(pd).toBeCloseTo(0.2059, 4)
  })

  it('растёт при увеличении долговой нагрузки', () => {
    const low = assess({ debtToEbitda: 2 }).pd
    const high = assess({ debtToEbitda: 7 }).pd
    expect(high).toBeGreaterThan(low)
  })

  it('падает при росте выручки, возраста и рентабельности', () => {
    expect(assess({ revenue: 400 }).pd).toBeLessThan(assess({ revenue: 8 }).pd)
    expect(assess({ ageMonths: 180 }).pd).toBeLessThan(assess({ ageMonths: 6 }).pd)
    expect(assess({ netMargin: 25 }).pd).toBeLessThan(assess({ netMargin: -5 }).pd)
  })

  it('снижается при наличии залога', () => {
    expect(assess({ hasCollateral: true }).pd).toBeLessThan(assess({ hasCollateral: false }).pd)
  })

  it('удерживается в (0, 1) на экстремальных входных данных', () => {
    const worst = calculateAssessment({
      borrower: {
        name: 'Худший',
        revenue: 0.01,
        ageMonths: 1,
        debtToEbitda: 20,
        netMargin: -90,
        industry: 'construction',
        hasCollateral: false,
      },
      terms: TERMS,
    })
    const best = calculateAssessment({
      borrower: {
        name: 'Лучший',
        revenue: 1_000_000,
        ageMonths: 600,
        debtToEbitda: 0,
        netMargin: 90,
        industry: 'it',
        hasCollateral: true,
      },
      terms: TERMS,
    })
    expect(worst.pd).toBeGreaterThan(0.5)
    expect(worst.pd).toBeLessThan(1)
    expect(best.pd).toBeGreaterThan(0)
    expect(best.pd).toBeLessThan(0.001)
  })

  it('учитывает отраслевой риск: строительство опаснее IT при прочих равных', () => {
    expect(assess({ industry: 'construction' }).pd).toBeGreaterThan(assess({ industry: 'it' }).pd)
  })
})

describe('декомпозиция вклада факторов', () => {
  it('разлагает логит на вклад каждого фактора плюс свободный член', () => {
    const { logit, contributions } = assess({})
    const sum = contributions.reduce((acc, c) => acc + c.contribution, -1.35)
    expect(sum).toBeCloseTo(logit, 10)
  })

  it('показывает шесть факторов и подписывает вклад каждого', () => {
    const { contributions } = assess({})
    expect(contributions).toHaveLength(6)
    for (const c of contributions) {
      expect(Number.isFinite(c.contribution)).toBe(true)
      expect(c.humanValue.length).toBeGreaterThan(0)
      expect(c.comment.length).toBeGreaterThan(0)
    }
  })

  it('отмечает рост долга как повышающий риск, а залог как снижающий', () => {
    const { contributions } = assess({ debtToEbitda: 9 })
    const debt = contributions.find((c) => c.key === 'debtToEbitda')
    const collateral = contributions.find((c) => c.key === 'hasCollateral')
    expect(debt?.effect).toBe('raises-risk')
    expect(debt?.contribution).toBeGreaterThan(0)
    expect(collateral?.effect).toBe('neutral')
    expect(collateral?.contribution).toBe(0)
  })

  it('находит главный фактор риска и главный фактор защиты', () => {
    const { topRiskFactor, topSafetyFactor } = assess({ debtToEbitda: 9, netMargin: 30 })
    expect(topRiskFactor?.key).toBe('debtToEbitda')
    expect(topSafetyFactor?.key).toBe('netMargin')
  })

  it('не выдаёт факторов риска и защиты, если все признаки в центре', () => {
    const { topRiskFactor, topSafetyFactor } = assess({})
    expect(topRiskFactor).toBeNull()
    expect(topSafetyFactor).toBeNull()
  })
})

describe('грейд надёжности', () => {
  it('выдаёт AA проверенному производственному пресету', () => {
    const result = calculateAssessment({ borrower: COMPANY_PRESETS[3]!.borrower, terms: TERMS })
    expect(result.grade).toBe('AA')
    expect(result.pd).toBeLessThan(0.015)
  })

  it('выдаёт C логистике с высокой долговой нагрузкой', () => {
    const result = calculateAssessment({ borrower: COMPANY_PRESETS[2]!.borrower, terms: TERMS })
    expect(result.grade).toBe('C')
    expect(result.pd).toBeGreaterThan(0.4)
  })

  it('снижает грейд по мере ухудшения компании', () => {
    const scale = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CC', 'C', 'D']
    expect(scale.indexOf(assess({}).grade)).toBeLessThan(scale.indexOf(assess({ debtToEbitda: 12 }).grade))
  })

  it('возвращает человекочитаемые подпись и описание грейда', () => {
    const { gradeLabel, gradeDescription, gradeTone } = assess({})
    expect(gradeLabel.length).toBeGreaterThan(0)
    expect(gradeDescription.length).toBeGreaterThan(0)
    expect(gradeTone.length).toBeGreaterThan(0)
  })
})

describe('доходность с учётом риска', () => {
  it('считает E(R) по формуле r·(1−PD) − PD·LGD (worked example)', () => {
    // Пекарня: PD = 0.1933 при r = 30%, LGD = 80%
    // E(R) = 0.30·(1−0.1933) − 0.1933·0.80 = 0.242007 − 0.154648 = 0.087359
    const { expected } = calculateAssessment({ borrower: COMPANY_PRESETS[0]!.borrower, terms: TERMS })
    expect(expected.expectedReturn).toBeCloseTo(0.0874, 3)
    expect(expected.premium).toBeCloseTo(0.0874 - 0.18, 3)
  })

  it('находит ставку безубыточности PD·LGD/(1−PD)', () => {
    const { pd, expected } = assess({})
    expect(expected.breakEvenRate).toBeCloseTo(((pd ?? 0) * 0.8) / (1 - (pd ?? 1)), 10)
  })

  it('считает ставку оправданной только если E(R) не ниже безрисковой', () => {
    const safe = assess({ revenue: 900, ageMonths: 240, debtToEbitda: 1, netMargin: 28, hasCollateral: true })
    const risky = assess({ revenue: 6, ageMonths: 6, debtToEbitda: 10, netMargin: -15 })
    expect(safe.expected.coversRisk).toBe(true)
    expect(risky.expected.coversRisk).toBe(false)
  })

  it('повышает рекомендуемую ставку вместе с риском', () => {
    expect(assess({ debtToEbitda: 9 }).expected.recommendedRate).toBeGreaterThan(
      assess({ debtToEbitda: 1 }).expected.recommendedRate,
    )
  })

  it('выдаёт текстовый вердикт инвестору', () => {
    const { expected } = assess({})
    expect(expected.verdictText.length).toBeGreaterThan(20)
    expect(['attractive', 'fair', 'underpriced', 'critical']).toContain(expected.verdict)
  })
})

describe('профиль риска и эталон отрасли', () => {
  it('нормализует оси в диапазон 0…1', () => {
    for (const axis of assess({}).radar.axes) {
      expect(axis.company).toBeGreaterThanOrEqual(0)
      expect(axis.company).toBeLessThanOrEqual(1)
      expect(axis.industry).toBeGreaterThanOrEqual(0)
      expect(axis.industry).toBeLessThanOrEqual(1)
    }
  })

  it('даёт сильной компании профиль ближе к идеалу, чем слабой', () => {
    const strong = assess({ revenue: 500, ageMonths: 200, debtToEbitda: 1, netMargin: 30 }).radar
    const weak = assess({ revenue: 4, ageMonths: 6, debtToEbitda: 11, netMargin: -30 }).radar
    const avg = (r: typeof strong) => r.axes.reduce((s, a) => s + a.company, 0) / r.axes.length
    expect(avg(strong)).toBeGreaterThan(avg(weak))
  })

  it('подставляет эталон именно выбранной отрасли', () => {
    const it = assess({ industry: 'it' }).radar.axes.find((a) => a.key === 'industry')!
    const construction = assess({ industry: 'construction' }).radar.axes.find(
      (a) => a.key === 'industry',
    )!
    expect(it.industry).toBeGreaterThan(construction.industry)
  })

  it('сравнивает заёмщика со средними безопасными значениями отрасли', () => {
    const { benchmark } = assess({ industry: 'logistics', revenue: 120 })
    expect(benchmark).toHaveLength(5)
    const revenue = benchmark.find((b) => b.key === 'revenue')!
    expect(revenue.companyValue).toBe(120)
    expect(revenue.industryValue).toBe(110)
    expect(revenue.better).toBe('higher')
    const debt = benchmark.find((b) => b.key === 'debtToEbitda')!
    expect(debt.better).toBe('lower')
  })
})

describe('портфельный симулятор', () => {
  const portfolio = {
    loans: 20,
    amountPerLoan: 1,
    mode: 'generated' as const,
    seed: 42,
  }

  it('возвращает распределение числа дефолтов, суммирующееся в 1', () => {
    const { portfolio: p } = calculateAssessment({ borrower: REF, terms: TERMS, portfolio })
    const active = p!.active
    const total = active.distribution.reduce((s, b) => s + b.probability, 0)
    expect(total).toBeCloseTo(1, 9)
    expect(active.distribution).toHaveLength(portfolio.loans + 1)
  })

  it('считает нулевые дефолты как произведение (1−pᵢ) — событие «все выплатили»', () => {
    // p₁ = σ(−1.35) = 0.205870;  p₂ = σ(−2.70) = 0.062974  →  P(0) = 0.744123
    const borrowers = [REF, { ...REF, name: 'Б', industry: 'it' as const, hasCollateral: true }]
    const { portfolio: p } = calculateAssessment({
      borrower: REF,
      terms: TERMS,
      portfolio: { loans: 2, amountPerLoan: 1, mode: 'manual', entries: borrowers },
    })
    const active = p!.active
    expect(active.loans).toBe(2)
    expect(active.distribution[0]!.probability).toBeCloseTo(0.744123, 5)
    expect(active.distribution[2]!.probability).toBeCloseTo(0.20587 * 0.062974, 5)
    expect(active.distribution[1]!.probability).toBeCloseTo(1 - 0.744123 - 0.012964, 5)
  })

  it('даёт ожидаемую доходность портфеля, равную средней E(R) по займам (закон полного математического ожидания)', () => {
    const borrowers = [REF, { ...REF, name: 'Б', industry: 'logistics' as const }]
    const { portfolio: p } = calculateAssessment({
      borrower: REF,
      terms: TERMS,
      portfolio: { loans: 2, amountPerLoan: 1, mode: 'manual', entries: borrowers },
    })
    const active = p!.active
    const meanOfIndividual = borrowers
      .map((b) => calculateAssessment({ borrower: b, terms: TERMS }).expected.expectedReturn)
      .reduce((s, r) => s + r, 0) / borrowers.length
    expect(active.expectedReturn).toBeCloseTo(meanOfIndividual, 10)
  })

  it('диверсификация повышает вероятность прибыли: 20 займов против 1', () => {
    const many = calculateAssessment({
      borrower: REF,
      terms: TERMS,
      portfolio: { ...portfolio, loans: 20 },
    }).portfolio!.active
    const one = calculateAssessment({
      borrower: REF,
      terms: TERMS,
      portfolio: { ...portfolio, loans: 1 },
    }).portfolio!.active
    expect(many.probabilityOfProfit).toBeGreaterThan(one.probabilityOfProfit)
    expect(many.cvar95).toBeGreaterThan(one.cvar95)
  })

  it('держит CVaR не выше VaR и оба внутри диапазона доходностей', () => {
    const { active } = calculateAssessment({
      borrower: REF,
      terms: TERMS,
      portfolio,
    }).portfolio!
    expect(active.cvar95).toBeLessThanOrEqual(active.var95 + 1e-12)
    expect(active.var95).toBeGreaterThanOrEqual(active.worstCase - 1e-12)
    expect(active.var95).toBeLessThanOrEqual(active.bestCase + 1e-12)
  })

  it('лучший и худший сценарий соответствуют нулю и всем дефолтам', () => {
    const { active } = calculateAssessment({ borrower: REF, terms: TERMS, portfolio }).portfolio!
    expect(active.worstCase).toBeCloseTo(-0.8, 10)
    expect(active.bestCase).toBeCloseTo(0.3, 10)
  })

  it('переводит доходность сценария в долю единицы: 20 займов, 5 дефолтов → 0.3 − 5·0.055', () => {
    const { active } = calculateAssessment({ borrower: REF, terms: TERMS, portfolio }).portfolio!
    expect(active.distribution[5]!.pnlPercent).toBeCloseTo(0.3 - 5 * 0.055, 10)
  })

  it('воспроизводим по seed: одинаковый вход — одинаковый портфель', () => {
    const a = calculateAssessment({ borrower: REF, terms: TERMS, portfolio })
    const b = calculateAssessment({ borrower: REF, terms: TERMS, portfolio })
    expect(a.portfolio!.active.distribution).toEqual(b.portfolio!.active.distribution)
    const other = calculateAssessment({
      borrower: REF,
      terms: TERMS,
      portfolio: { ...portfolio, seed: 7 },
    })
    expect(other.portfolio!.active.distribution).not.toEqual(a.portfolio!.active.distribution)
  })

  it('считает общий объём вложений и средний PD портфеля', () => {
    const { active } = calculateAssessment({
      borrower: REF,
      terms: TERMS,
      portfolio: { ...portfolio, amountPerLoan: 2.5 },
    }).portfolio!
    expect(active.totalInvested).toBeCloseTo(20 * 2.5, 10)
    expect(active.averagePd).toBeGreaterThan(0)
    expect(active.averagePd).toBeLessThan(1)
  })

  it('не создаёт портфельный блок, если спецификация не передана', () => {
    expect(calculateAssessment({ borrower: REF, terms: TERMS }).portfolio).toBeNull()
  })

  it('пустой ручной портфель не ломает расчёт', () => {
    const result = calculateAssessment({
      borrower: REF,
      terms: TERMS,
      portfolio: { loans: 5, amountPerLoan: 1, mode: 'manual', entries: [] },
    })
    expect(result.portfolio!.active.loans).toBe(0)
    expect(result.portfolio!.manual).toBeNull()
  })
})

describe('целостность результата', () => {
  it('детерминирован: один и тот же вход даёт тот же результат', () => {
    const input: AssessmentInput = {
      borrower: COMPANY_PRESETS[1]!.borrower,
      terms: TERMS,
      portfolio: { loans: 12, amountPerLoan: 0.5, mode: 'generated', seed: 3 },
    }
    expect(calculateAssessment(input)).toEqual(calculateAssessment(input))
  })

  it('песет входные параметры в результат без изменений', () => {
    const result = calculateAssessment({ borrower: REF, terms: TERMS })
    expect(result.borrower).toEqual(REF)
    expect(result.terms).toEqual(TERMS)
  })

  it('генерирует непустое резюме для инвестора с упоминанием грейда', () => {
    const { narrative, grade } = assess({})
    expect(narrative.length).toBeGreaterThan(60)
    expect(narrative).toContain(grade)
  })

  it('нормализует некорректные входные данные вместо выбрасывания ошибки', () => {
    const result = calculateAssessment({
      borrower: {
        name: 'Грязный ввод',
        revenue: -5,
        ageMonths: -10,
        debtToEbitda: Number.NaN,
        netMargin: 999,
        industry: 'retail',
        hasCollateral: false,
      },
      terms: { rate: 5, lgd: 42, riskFreeRate: -1 },
    })
    expect(Number.isFinite(result.pd)).toBe(true)
    expect(result.pd).toBeGreaterThanOrEqual(0)
    expect(result.pd).toBeLessThanOrEqual(1)
    expect(result.expected.expectedReturn).toBeLessThanOrEqual(1)
    expect(result.contributions.every((c) => Number.isFinite(c.contribution))).toBe(true)
  })

  it('покрывает все четыре демонстрационных пресета без NaN', () => {
    for (const preset of COMPANY_PRESETS) {
      const result = calculateAssessment({
        borrower: preset.borrower,
        terms: { rate: preset.rate, lgd: 0.8, riskFreeRate: 0.18 },
      })
      expect(Number.isFinite(result.pd)).toBe(true)
      expect(result.expected.verdict).toBeTruthy()
      expect(result.narrative.length).toBeGreaterThan(0)
    }
  })
})