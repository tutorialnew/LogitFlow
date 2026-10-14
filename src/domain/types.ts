/** Доменные типы математического ядра. Единственное, что знает UI о модуле. */

export type IndustryId =
  | 'it'
  | 'retail'
  | 'manufacturing'
  | 'food'
  | 'construction'
  | 'logistics'

export type FactorKey =
  | 'revenue'
  | 'ageMonths'
  | 'debtToEbitda'
  | 'netMargin'
  | 'industryRisk'
  | 'hasCollateral'

export type RadarAxisKey =
  | 'scale'
  | 'age'
  | 'stability'
  | 'profitability'
  | 'industry'
  | 'collateral'

export type BenchmarkKey = Exclude<FactorKey, 'industryRisk'>

export type RiskTone =
  | 'emerald'
  | 'green'
  | 'lime'
  | 'yellow'
  | 'amber'
  | 'orange'
  | 'coral'
  | 'red'
  | 'crimson'

export type GradeCode = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CC' | 'C' | 'D'

export type VerdictCode = 'attractive' | 'fair' | 'underpriced' | 'critical'

export interface BorrowerProfile {
  name: string
  /** Годовая выручка, млн ₽/год. */
  revenue: number
  /** Срок существования бизнеса, месяцев. */
  ageMonths: number
  /** Долговая нагрузка Debt / EBITDA, «turns». */
  debtToEbitda: number
  /** Рентабельность по чистой прибыли, %. */
  netMargin: number
  industry: IndustryId
  /** Наличие залога или поручительства. */
  hasCollateral: boolean
}

export interface DealTerms {
  /** Номинальная годовая ставка по займу, доля единицы (0.3 = 30%). */
  rate: number
  /** Потеря при дефолте, доля единицы (0.8 = 80%). */
  lgd: number
  /** Безрисковая ставка: депозит / ОФЗ, доля единицы. */
  riskFreeRate: number
}

export interface PortfolioSpec {
  /** Целевое число займов в генерируемом портфеле, 1…50. */
  loans: number
  /** Сумма одного займа, млн ₽. */
  amountPerLoan: number
  mode: 'generated' | 'manual'
  /** Ручной портфель. Пустой массив допустим. */
  entries?: BorrowerProfile[]
  /** Seed детерминированного PRNG для режима `generated`. */
  seed?: number
}

export interface AssessmentInput {
  borrower: BorrowerProfile
  terms: DealTerms
  portfolio?: PortfolioSpec
}

export type RiskEffect = 'raises-risk' | 'lowers-risk' | 'neutral'

export interface FactorContribution {
  key: FactorKey
  label: string
  /** Значение признака в человеческих единицах. */
  humanValue: string
  /** Опорное значение центра в человеческих единицах. */
  humanCenter: string
  beta: number
  /** β·(X − center): сдвиг логита. */
  contribution: number
  effect: RiskEffect
  comment: string
}

export interface BenchmarkComparison {
  key: BenchmarkKey
  label: string
  companyValue: number
  industryValue: number
  /** companyValue / industryValue, 0 при нулевом эталоне. */
  ratio: number
  /** В сторону какого значения смотреть «лучше». */
  better: 'higher' | 'lower'
  unit: string
}

export interface RadarAxis {
  key: RadarAxisKey
  label: string
  /** 0…1, больше — лучше. */
  company: number
  /** 0…1, больше — лучше. */
  industry: number
}

export interface ExpectedReturnResult {
  rate: number
  lgd: number
  riskFreeRate: number
  /** E(R) = r·(1−PD) − PD·LGD. */
  expectedReturn: number
  /** E(R) − riskFreeRate. */
  premium: number
  /** Ставка, при которой E(R) = 0. */
  breakEvenRate: number
  /** Ставка с премией за риск по рыночному коэффициенту. */
  recommendedRate: number
  /** E(R) ≥ riskFreeRate. */
  coversRisk: boolean
  verdict: VerdictCode
  verdictLabel: string
  verdictText: string
}

export interface PortfolioBin {
  defaults: number
  probability: number
  /** Средний множитель капитала: 0.8 + … */
  multiple: number
  /** Доходность сценария, доля единицы. */
  pnlPercent: number
}

export interface PortfolioOutcome {
  loans: number
  amountPerLoan: number
  totalInvested: number
  /** Средний PD по займам портфеля. */
  averagePd: number
  distribution: PortfolioBin[]
  /** E[P&L] портфеля. */
  expectedReturn: number
  probabilityOfProfit: number
  probabilityOfLoss: number
  /** Вероятность потери больше 10% капитала. */
  probabilityLossAbove10: number
  var95: number
  cvar95: number
  worstCase: number
  bestCase: number
  /** E(R) одного отдельно взятого займа из портфеля. */
  singleLoanExpectation: number
}

export interface PortfolioResult {
  mode: 'generated' | 'manual'
  generated: PortfolioOutcome | null
  manual: PortfolioOutcome | null
  /** Что показывать в интерфейсе. */
  active: PortfolioOutcome
}

export interface Grade {
  code: GradeCode
  label: string
  tone: RiskTone
  description: string
}

export interface AssessmentResult {
  borrower: BorrowerProfile
  terms: DealTerms
  /** Z до сигмоиды. */
  logit: number
  /** PD за 12 месяцев, 0…1. */
  pd: number
  grade: GradeCode
  gradeLabel: string
  gradeDescription: string
  gradeTone: RiskTone
  contributions: FactorContribution[]
  topRiskFactor: FactorContribution | null
  topSafetyFactor: FactorContribution | null
  benchmark: BenchmarkComparison[]
  radar: { axes: RadarAxis[] }
  expected: ExpectedReturnResult
  narrative: string
  portfolio: PortfolioResult | null
}