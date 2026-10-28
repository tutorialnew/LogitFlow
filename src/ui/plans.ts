/**
 * Политика доступа и монетизации.
 *
 * Это не математика, а продуктовое правило: кто что видит. Поэтому модуль чистый
 * и проверяется тестами отдельно от расчётного ядра — через собственную границу
 * `planLimits(plan) → лимиты`.
 *
 * Хранение в localStorage — с версией ключа: при смене политики не подхватится
 * старое значение, а сбросится.
 */

export type PlanId = 'free' | 'investor' | 'platform'

export interface Plan {
  id: PlanId
  title: string
  /** Цена как строка: форматируем руками, чтобы не смешивать с расчётами. */
  price: string
  period: string
  note: string
  highlights: string[]
  tone: string
  /** Базовый тариф: оплачивать нечего. */
  isFree: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    title: 'Оценка',
    price: '0 ₽',
    period: 'навсегда',
    note: 'Посчитать один заём и увидеть вердикт.',
    highlights: [
      'Вероятность дефолта и грейд',
      'Объяснимый скоринг по 6 факторам',
      'Портфель до 10 займов',
      'Математическая справка',
    ],
    tone: 'var(--color-sand-500)',
    isFree: true,
  },
  {
    id: 'investor',
    title: 'Инвестор',
    price: '299 ₽',
    period: 'в месяц',
    note: 'Для тех, кто постоянно отбирает займы на платформе.',
    highlights: [
      'Портфель до 50 займов',
      'VaR и CVaR в портфельном симуляторе',
      'Копирование отчёта по одному заёму',
      'Сравнение сценариев между собой',
    ],
    tone: 'var(--color-brass-400)',
    isFree: false,
  },
  {
    id: 'platform',
    title: 'Платформа',
    price: '9 900 ₽',
    period: 'в месяц',
    note: 'Для кредитных платформ и финансовых консультантов.',
    highlights: [
      'Всё из «Инвестора»',
      'Свои калибровки модели под отрасль',
      'Вставка сравнения на свой сайт',
      'Поддержка и разбор модели',
    ],
    tone: 'var(--color-risk-1)',
    isFree: false,
  },
]

export const PLAN_STORAGE_KEY = 'zaemscan.plan.v1'

export const PLAN_IDS = PLANS.map((plan) => plan.id)

export function planById(id: PlanId): Plan {
  return PLANS.find((plan) => plan.id === id) ?? PLANS[0]!
}

export interface PlanLimits {
  /** Максимум займов в портфеле. */
  maxLoans: number
  /** Копировать текстовый отчёт по компании. */
  canCopyReport: boolean
  /** Разбор всех шести факторов с коэффициентами. */
  canSeeAllFactors: boolean
  /** Сравнение сценариев-пресетов в одном окне. */
  canCompareScenarios: boolean
}

const FREE_LIMITS: PlanLimits = {
  maxLoans: 10,
  canCopyReport: false,
  canSeeAllFactors: true,
  canCompareScenarios: false,
}

/** Правило, которое распространяет подписку на интерфейс. */
export function planLimits(plan: PlanId): PlanLimits {
  if (plan === 'free') return FREE_LIMITS
  if (plan === 'investor') {
    return {
      maxLoans: 50,
      canCopyReport: true,
      canSeeAllFactors: true,
      canCompareScenarios: true,
    }
  }
  return {
    maxLoans: 50,
    canCopyReport: true,
    canSeeAllFactors: true,
    canCompareScenarios: true,
  }
}

/** Есть ли у тарифа свойство, которого нет у бесплатного. */
export function planDiffers(plan: PlanId, key: keyof PlanLimits): boolean {
  const free = planLimits('free')
  const mine = planLimits(plan)
  if (key === 'maxLoans') return mine.maxLoans > free.maxLoans
  return Boolean(free[key]) !== Boolean(mine[key])
}

export function readPlan(): PlanId {
  if (typeof window === 'undefined') return 'free'
  try {
    const raw = window.localStorage.getItem(PLAN_STORAGE_KEY)
    return PLAN_IDS.includes(raw as PlanId) ? (raw as PlanId) : 'free'
  } catch {
    return 'free'
  }
}

export function writePlan(plan: PlanId): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PLAN_STORAGE_KEY, plan)
  } catch {
    // Без доступа к хранилищу подписка просто не запоминается между сессиями.
  }
}