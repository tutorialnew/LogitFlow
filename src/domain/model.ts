/**
 * Калибровка модели и отраслевые эталоны.
 *
 * Это единственное место, где живут числа экономики. Интерфейс приложения (раздел
 * «Математическая справка») читает отсюда же, поэтому формулы в UI и формулы в расчётах
 * разойтись не могут.
 */
import type { FactorKey, IndustryId } from './types'

export interface IndustryDef {
  id: IndustryId
  label: string
  short: string
  /** Отраслевой риск 0…1: волатильность выручки и спроса. */
  risk: number
  /** Средние безопасные значения отрасли. */
  benchmark: {
    revenue: number
    ageMonths: number
    debtToEbitda: number
    netMargin: number
    hasCollateral: boolean
  }
  comment: string
}

export const INDUSTRIES: IndustryDef[] = [
  {
    id: 'it',
    label: 'IT и цифровые услуги',
    short: 'IT',
    risk: 0.18,
    benchmark: { revenue: 35, ageMonths: 42, debtToEbitda: 1.5, netMargin: 18, hasCollateral: false },
    comment: 'Низкий отраслевой риск, но короткая история и почти нет залога.',
  },
  {
    id: 'retail',
    label: 'Розничная торговля',
    short: 'Торговля',
    risk: 0.42,
    benchmark: { revenue: 45, ageMonths: 60, debtToEbitda: 3, netMargin: 8, hasCollateral: true },
    comment: 'Базовая отрасль: умеренная маржа и заметная залоговая нагрузка.',
  },
  {
    id: 'manufacturing',
    label: 'Производство',
    short: 'Производство',
    risk: 0.5,
    benchmark: { revenue: 220, ageMonths: 132, debtToEbitda: 3.5, netMargin: 11, hasCollateral: true },
    comment: 'Высокие требования к залогу, но устойчивая выручка при капитальных вложениях.',
  },
  {
    id: 'food',
    label: 'Общественное питание',
    short: 'Общепит',
    risk: 0.56,
    benchmark: { revenue: 22, ageMonths: 54, debtToEbitda: 3.6, netMargin: 7, hasCollateral: true },
    comment: 'Маржа тонкая, аренда и срок жизни точки критичны.',
  },
  {
    id: 'construction',
    label: 'Строительство и подряд',
    short: 'Строительство',
    risk: 0.7,
    benchmark: { revenue: 90, ageMonths: 84, debtToEbitda: 4.4, netMargin: 6, hasCollateral: true },
    comment: 'Самый цикличный сектор: субподряд, срывы сроков, высокая долговая нагрузка.',
  },
  {
    id: 'logistics',
    label: 'Логистика и перевозки',
    short: 'Логистика',
    risk: 0.62,
    benchmark: { revenue: 110, ageMonths: 72, debtToEbitda: 4.8, netMargin: 7, hasCollateral: true },
    comment: 'Топливо и валютная часть себестоимости делают маржу нестабильной.',
  },
]

export const INDUSTRY_BY_ID: Record<IndustryId, IndustryDef> = Object.fromEntries(
  INDUSTRIES.map((i) => [i.id, i]),
) as Record<IndustryId, IndustryDef>

export interface ModelCalibration {
  /** Свободный член. */
  intercept: number
  /** Опорные (безопасные) значения признаков, относительно которых считается вклад. */
  centers: Record<FactorKey, number>
  /** Коэффициенты признаков. */
  betas: Record<FactorKey, number>
  /** Коэффициент рыночной премии за риск: r_rec = r_f + PD·LGD·k. */
  riskAversion: number
  /** Безрисковая ставка по умолчанию: доходность ПДС. */
  riskFreeRate: number
  lgd: number
}

export const MODEL_CALIBRATION: ModelCalibration = {
  intercept: -1.35,
  // Опорная («безопасная») компания: выручка 50 млн, 4 года, Долг/EBITDA = 3,
  // маржа 10%, отрасль «Розничная торговля», без залога. Её логит равен ровно β₀.
  centers: {
    revenue: Math.log(50),
    ageMonths: Math.log(5),
    debtToEbitda: 3,
    netMargin: 10,
    industryRisk: 0.42,
    hasCollateral: 0,
  },
  betas: {
    revenue: -0.55,
    ageMonths: -0.85,
    debtToEbitda: 0.3,
    netMargin: -0.08,
    industryRisk: 1.25,
    hasCollateral: -1.05,
  },
  riskAversion: 2.2,
  riskFreeRate: 0.18,
  lgd: 0.8,
}

/** Шкала риска: девять монотонно сдвигающихся от изумрудного к багровому тонов. */
export const GRADE_LADDER: ReadonlyArray<{
  code: NonNullable<import('./types').GradeCode>
  max: number
  label: string
  tone: import('./types').RiskTone
  description: string
}> = [
  {
    code: 'AAA',
    max: 0.005,
    label: 'Особая надёжность',
    tone: 'emerald',
    description: 'Уровень облигации крупного эмитента. Дефолт маловероятен.',
  },
  {
    code: 'AA',
    max: 0.015,
    label: 'Высокая надёжность',
    tone: 'green',
    description: 'Устойчивый бизнес с понятным денежным потоком и запасом прочности.',
  },
  {
    code: 'A',
    max: 0.04,
    label: 'Надёжный заёмщик',
    tone: 'lime',
    description: 'Риск заметно ниже среднего по рынку заёмных средств.',
  },
  {
    code: 'BBB',
    max: 0.09,
    label: 'Приемлемый риск',
    tone: 'yellow',
    description: 'Нижняя граница инвестиционного уровня. Ставка должна быть выше безрисковой.',
  },
  {
    code: 'BB',
    max: 0.16,
    label: 'Повышенный риск',
    tone: 'amber',
    description: 'Слабые стороны есть, платёжеспособность зависит от внешних факторов.',
  },
  {
    code: 'B',
    max: 0.26,
    label: 'Высокий риск',
    tone: 'orange',
    description: 'Каждый дефолт в шести-семи реальных. Нужна повышенная ставка и контроль.',
  },
  {
    code: 'CC',
    max: 0.4,
    label: 'Очень высокий риск',
    tone: 'coral',
    description: 'Дефолт — реальный сценарий, а не хвостовой. Инвестиция близка к спекулятивной.',
  },
  {
    code: 'C',
    max: 0.6,
    label: 'Повышенная вероятность дефолта',
    tone: 'red',
    description: 'Скорее всего не вернёт. Имеет смысл только при залоге с быстрой реализацией.',
  },
  {
    code: 'D',
    max: Number.POSITIVE_INFINITY,
    label: 'Отсечка',
    tone: 'crimson',
    description: 'Признаки заёмщика указывают на дефолт. Кредитование нецелесообразно.',
  },
]

export const PD_HORIZON_YEARS = 1
export const RISK_AVERSION_NOTE = `Премия за риск = PD · LGD · ${MODEL_CALIBRATION.riskAversion}`