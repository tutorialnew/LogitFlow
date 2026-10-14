/** Внутренний шов: доходность с учётом риска. */
import { MODEL_CALIBRATION } from './model'
import type { DealTerms, ExpectedReturnResult, GradeCode } from './types'

const pct = (n: number) => `${(n * 100).toFixed(1)} %`

export function expectedReturn(pd: number, terms: DealTerms): ExpectedReturnResult {
  const { rate, lgd, riskFreeRate } = terms
  const value = rate * (1 - pd) - pd * lgd
  const premium = value - riskFreeRate
  const breakEvenRate = (pd * lgd) / (1 - pd)
  const recommendedRate = riskFreeRate + pd * lgd * MODEL_CALIBRATION.riskAversion
  const coversRisk = value >= riskFreeRate

  const { verdict, verdictLabel, verdictText } = judge(premium, pd)

  return {
    rate,
    lgd,
    riskFreeRate,
    expectedReturn: value,
    premium,
    breakEvenRate,
    recommendedRate,
    coversRisk,
    verdict,
    verdictLabel,
    verdictText,
  }
}

function judge(premium: number, pd: number): Pick<
  ExpectedReturnResult,
  'verdict' | 'verdictLabel' | 'verdictText'
> {
  if (pd >= 0.6) {
    return {
      verdict: 'critical',
      verdictLabel: 'Отказ от сделки',
      verdictText:
        `Вероятность дефолта ${pct(pd)} настолько высока, что даже номинальная ставка не покрывает ` +
        'потери. Отрицательное математическое ожидание при любой разумной ставке.',
    }
  }
  if (premium >= 0.05) {
    return {
      verdict: 'attractive',
      verdictLabel: 'Ставка оправдывает риск',
      verdictText:
        `Ожидаемая доходность превышает безрисковую на ${pct(premium)}. ` +
        'Риск компенсирован с запасом — сделка проходит решение.',
    }
  }
  if (premium >= 0) {
    return {
      verdict: 'fair',
      verdictLabel: 'Ставка на грани',
      verdictText:
        `Ожидаемая доходность лишь на ${pct(premium)} выше безрисковой. ` +
        'Компенсация за риск минимальна: любая неточность в оценке делает сделку убыточной.',
    }
  }
  return {
    verdict: 'underpriced',
    verdictLabel: 'Риск не оплачен',
    verdictText:
      `Ожидаемая доходность на ${pct(Math.abs(premium))} ниже безрисковой. ` +
      'Ставку нужно поднять, снизить PD через залог, либо отказаться от сделки.',
  }
}

export function gradeHeadline(grade: GradeCode): string {
  return `Грейд ${grade}`
}