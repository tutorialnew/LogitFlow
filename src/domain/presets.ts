/** Демонстрационные кейсы для защиты диплома. */
import type { BorrowerProfile, IndustryId } from './types'

export interface CompanyPreset {
  id: string
  title: string
  tagline: string
  /** Ожидаемая история для защиты. */
  story: string
  /** Рекомендуемая ставка платформы для этого кейса. */
  rate: number
  borrower: BorrowerProfile
}

const borrower = (
  name: string,
  industry: IndustryId,
  revenue: number,
  ageMonths: number,
  debtToEbitda: number,
  netMargin: number,
  hasCollateral: boolean,
): BorrowerProfile => ({
  name,
  industry,
  revenue,
  ageMonths,
  debtToEbitda,
  netMargin,
  hasCollateral,
})

export const COMPANY_PRESETS: CompanyPreset[] = [
  {
    id: 'bakery',
    title: 'Пекарня у дома',
    tagline: 'Средний риск, высокая ставка',
    story:
      'Небольшая пекарня с понятным спросом и залогом, но тонкой маржой и арендой в счёт оборота. ' +
      'Показывает главный парадокс рынка: понятный бизнес ещё не значит выгодный.',
    rate: 0.32,
    borrower: borrower('Пекарня у дома', 'food', 18, 72, 4.2, 8, true),
  },
  {
    id: 'it-startup',
    title: 'IT-стартап',
    tagline: 'Высокая рентабельность, нет залога',
    story:
      'Отличная юнит-экономика и почти нулевой долг, но три года истории и нет обеспечения. ' +
      'Показывает, как прибыль компенсирует возраст, а не отменяет его.',
    rate: 0.3,
    borrower: borrower('IT-стартап', 'it', 25, 18, 1, 25, false),
  },
  {
    id: 'logistics',
    title: 'Логистическая компания',
    tagline: 'Высокая долговая нагрузка — скрытый риск',
    story:
      'Крупная выручка и солидный возраст выглядят убедительно, пока не посчитаешь долг в шесть с половиной ' +
      'EBITDA. Демонстрация эффекта скрытой долговой нагрузки — ключевой кейс работы.',
    rate: 0.36,
    borrower: borrower('Логистическая компания', 'logistics', 120, 84, 7.5, 6, false),
  },
  {
    id: 'manufacturing',
    title: 'Производственное предприятие',
    tagline: 'Надёжный заёмщик с низким PD',
    story:
      'Классический инвестиционный заёмщик: давняя история, залог, умеренная маржа и масштаб. ' +
      'Показывает верхнюю границу качества портфеля.',
    rate: 0.24,
    borrower: borrower('Производственное предприятие', 'manufacturing', 450, 180, 2, 15, true),
  },
]

export const DEFAULT_BORROWER = COMPANY_PRESETS[0]!.borrower