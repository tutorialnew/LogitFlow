import { useState } from 'react'
import { Check, LoaderCircle, ShieldCheck, X } from 'lucide-react'
import { PLANS, planById, planLimits } from './plans'
import type { Plan, PlanId } from './plans'
import { Button } from './Button'
import { Panel } from './Panel'

interface PlansPanelProps {
  plan: PlanId
  onChangePlan: (plan: PlanId) => void
}

/** Активируемый в данный момент тариф — у его кнопки крутится индикатор. */
type Stage = PlanId | null

/**
 * Тарифы. Оплата не выполняется в браузере: нажатие «Подписаться» активирует
 * уровень в демо-режиме и объясняет, что для реальных платежей нужен бэкенд.
 * Никаких ложных обещаний «оплатите картой» — интерфейс не притворяется.
 */
export function PlansPanel({ plan, onChangePlan }: PlansPanelProps) {
  const current = planById(plan)
  const limits = planLimits(plan)
  const [stage, setStage] = useState<Stage>(null)

  return (
    <Panel
      id="plans"
      tone="var(--color-brass-400)"
      title="Подписка и уровни доступа"
      description="Расчёт вероятности дефолта и объяснимый скоринг остаются бесплатными. За деньги открывается то, что экономит время при отборе портфеля: большой портфель, VaR/CVaR, отчёт по заёмщику."
      actions={
        <span className="tnum border border-line bg-ink-700 px-2.5 py-1 text-xs text-sand-300">
          Теперь: {current.title}
        </span>
      }
    >
      <div className="grid gap-3 lg:grid-cols-3">
        {PLANS.map((item) => (
          <PlanCard
            key={item.id}
            plan={item}
            current={item.id === plan}
            onChoose={() => {
              if (item.isFree) {
                setStage(null)
                onChangePlan('free')
                return
              }
              // Демо-оплата: уровень активируется без сети, потому что реальный
              // платёж требует сервера и платёжного провайдера.
              setStage(item.id)
              window.setTimeout(() => {
                setStage(null)
                onChangePlan(item.id)
              }, 550)
            }}
            busy={stage === item.id}
          />
        ))}
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-2 border-t border-line pt-4 text-xs sm:grid-cols-2">
        <div className="flex justify-between gap-3">
          <dt className="text-sand-500">Действующие лимиты шкалы</dt>
          <dd className="tnum text-sand-300">
            до {limits.maxLoans} займов{limits.canCopyReport ? ' · отчёт' : ''}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-sand-500">Хранение выбора</dt>
          <dd className="text-sand-300">в браузере, без аккаунта</dd>
        </div>
      </dl>

      <p className="mt-4 flex items-start gap-2 max-w-[74ch] text-xs leading-relaxed text-sand-700">
        <ShieldCheck aria-hidden="true" className="mt-px size-3.5 shrink-0 text-sand-500" />
        Реквизиты не запрашиваются: в этой демо-версии активация подписки эмулируется.
        Для настоящих платежей подключается платёжный провайдер и бэкенд — тогда кнопка
        «Подписаться» создаст подписку с чеком и продлением.
      </p>
    </Panel>
  )
}

interface PlanCardProps {
  plan: Plan
  current: boolean
  onChoose: () => void
  busy: boolean
}

function PlanCard({ plan, current, onChoose, busy }: PlanCardProps) {
  return (
    <article
      className="flex flex-col border px-4 py-4"
      style={{ borderColor: current ? plan.tone : 'var(--color-line)', background: 'var(--color-ink-800)' }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-sand-100">{plan.title}</h3>
        {current ? (
          <span
            className="px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ color: 'var(--color-ink-950)', background: plan.tone }}
          >
            работает
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="tnum text-2xl font-semibold text-sand-100">{plan.price}</span>
        <span className="text-xs text-sand-500">{plan.period}</span>
      </div>
      <p className="mt-1.5 max-w-[42ch] text-xs leading-relaxed text-sand-500">{plan.note}</p>

      <ul className="mt-3 flex-1 space-y-2">
        {plan.highlights.map((line) => (
          <li key={line} className="flex items-start gap-2 text-xs leading-relaxed text-sand-300">
            <Check aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" style={{ color: plan.tone }} />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        {plan.isFree ? (
          current ? (
            <Button variant="ghost" size="sm" disabled>
              <Check aria-hidden="true" className="size-3.5" />
              Бесплатный тариф активен
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={onChoose}>
              Вернуться в бесплатный
            </Button>
          )
        ) : current ? (
          <Button variant="ghost" size="sm" onClick={onChoose}>
            <X aria-hidden="true" className="size-3.5" />
            Отключить подписку
          </Button>
        ) : (
          <Button variant="primary" size="md" onClick={onChoose} disabled={busy} className="w-full">
            {busy ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
            Подписаться
          </Button>
        )}
      </div>
    </article>
  )
}