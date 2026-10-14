/** Внутренний шов: автоматическое текстовое резюме оценки для инвестора. */
import type { FactorContribution, Grade } from './types'

const pct = (n: number) => `${(n * 100).toFixed(1)} %`
const up = (n: number) => `+${(n * 100).toFixed(1)} п.п. к логиту`
const down = (n: number) => `−${(n * 100).toFixed(1)} п.п. к логиту`

export function buildNarrative(args: {
  borrowerName: string
  industryLabel: string
  pd: number
  grade: Grade
  topRisk: FactorContribution | null
  topSafety: FactorContribution | null
  expectedReturn: number
  riskFreeRate: number
  premium: number
  coversRisk: boolean
  breakEvenRate: number
}): string {
  const {
    borrowerName,
    industryLabel,
    pd,
    grade,
    topRisk,
    topSafety,
    expectedReturn,
    riskFreeRate,
    premium,
    coversRisk,
    breakEvenRate,
  } = args

  const parts: string[] = [
    `${borrowerName} (${industryLabel}) получает грейд ${grade.code} — «${grade.label.toLowerCase()}». ` +
      `Вероятность дефолта за 12 месяцев оценивается в ${pct(pd)}.`,
  ]

  if (topRisk && topRisk.contribution > 0.005) {
    parts.push(`Главная слабость — ${topRisk.label.toLowerCase()}: ${up(topRisk.contribution)}.`)
  }
  if (topSafety && topSafety.contribution < -0.005) {
    parts.push(`Главная опора — ${topSafety.label.toLowerCase()}: ${down(Math.abs(topSafety.contribution))}.`)
  }

  if (coversRisk) {
    parts.push(
      `При данных условиях ожидаемая доходность ${pct(expectedReturn)} против безрисковых ${pct(riskFreeRate)}: ` +
        `премия ${up(premium)} перекрывает риск, и сделка проходит решение.`,
    )
  } else {
    parts.push(
      `При данных условиях ожидаемая доходность ${pct(expectedReturn)} ниже безрисковых ${pct(riskFreeRate)}: ` +
        `премия ${down(Math.abs(premium))} не покрывает риск. Ставка безубыточности — ${pct(breakEvenRate)}; ` +
        'её нужно поднять либо снизить PD залогом и лучшей отчётностью.',
    )
  }

  return parts.join(' ')
}