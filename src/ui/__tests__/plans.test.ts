/**
 * Тесты политики доступа.
 *
 * Отдельная граница (не математическое ядро): договор с интерфейсом о том,
 * что именно покупает пользователь. Проверяем поведение, а не реализацию.
 */
import { describe, expect, it } from 'vitest'
import {
  PLANS,
  PLAN_IDS,
  PLAN_STORAGE_KEY,
  planById,
  planDiffers,
  planLimits,
} from '../plans'

describe('тарифы', () => {
  it('содержит три тарифа, первым бесплатный', () => {
    expect(PLAN_IDS).toEqual(['free', 'investor', 'platform'])
    expect(PLANS[0]!.isFree).toBe(true)
    expect(PLANS.filter((plan) => !plan.isFree)).toHaveLength(2)
  })

  it('у каждого платного тарифа есть цена и период, у бесплатного — ноль', () => {
    for (const plan of PLANS) {
      expect(plan.price.length).toBeGreaterThan(0)
      expect(plan.period.length).toBeGreaterThan(0)
      expect(plan.highlights.length).toBeGreaterThan(0)
    }
    expect(PLANS[0]!.price).toBe('0 ₽')
  })

  it('неизвестный тариф отбрасывается в бесплатный', () => {
    expect(planById('unknown' as never).id).toBe('free')
  })
})

describe('лимиты тарифа', () => {
  it('бесплатный тариф ограничивает портфель десятью займами', () => {
    const limits = planLimits('free')
    expect(limits.maxLoans).toBe(10)
    expect(limits.canCopyReport).toBe(false)
  })

  it('покупка расширяет портфель до пятидесяти займов и открывает отчёт', () => {
    for (const plan of ['investor', 'platform'] as const) {
      const limits = planLimits(plan)
      expect(limits.maxLoans).toBe(50)
      expect(limits.canCopyReport).toBe(true)
    }
  })

  it('все операции, доступные бесплатному тарифу, доступны и платным', () => {
    const free = planLimits('free')
    for (const plan of ['investor', 'platform'] as const) {
      const mine = planLimits(plan)
      expect(mine.maxLoans).toBeGreaterThanOrEqual(free.maxLoans)
      for (const key of ['canCopyReport', 'canSeeAllFactors', 'canCompareScenarios'] as const) {
        if (free[key]) expect(mine[key]).toBe(true)
      }
    }
  })

  it('показывает, за что именно платит пользователь', () => {
    expect(planDiffers('free', 'maxLoans')).toBe(false)
    expect(planDiffers('investor', 'maxLoans')).toBe(true)
    expect(planDiffers('investor', 'canCopyReport')).toBe(true)
    expect(planDiffers('platform', 'canCompareScenarios')).toBe(true)
  })
})

describe('хранение выбора', () => {
  it('ключ хранилища версионированный — при смене политики старое не подхватится', () => {
    expect(PLAN_STORAGE_KEY).toMatch(/\.v\d+$/)
  })
})