import { memo } from 'react'
import { Shuffle, Plus, X } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AssessmentResult, BorrowerProfile, PortfolioOutcome } from '@/domain/types'
import { FIELD_LIMITS } from '@/domain/normalize'
import { INDUSTRY_BY_ID } from '@/domain/model'
import { TONE_COLOR, percent, signedPercent } from '@/format'
import { Panel } from './Panel'
import { Segmented, Stat } from './Controls'
import { SliderField } from './SliderField'
import { Button } from './Button'
import { Lock } from 'lucide-react'
import type { PlanId } from './plans'
import { planLimits } from './plans'

export interface PortfolioState {
  loans: number
  amountPerLoan: number
  mode: 'generated' | 'manual'
  entries: BorrowerProfile[]
  seed: number
}

interface PortfolioPanelProps {
  state: PortfolioState
  onChange: (patch: Partial<PortfolioState>) => void
  onAddCurrent: () => void
  onRemoveAt: (index: number) => void
  result: AssessmentResult
  plan: PlanId
}

export const PortfolioPanel = memo(function PortfolioPanel({
  state,
  onChange,
  onAddCurrent,
  onRemoveAt,
  result,
  plan,
}: PortfolioPanelProps) {
  const portfolio = result.portfolio
  const active = portfolio?.active
  const tone = TONE_COLOR[result.gradeTone]
  const limits = planLimits(plan)
  const fieldCap = FIELD_LIMITS.portfolioLoans.max
  const gated = limits.maxLoans < fieldCap
  const canAddEntry = state.entries.length < limits.maxLoans

  const distribution = (active?.distribution ?? [])
    .filter((bin) => bin.probability > 1e-5)
    .map((bin) => ({ ...bin, gain: bin.pnlPercent > 0 }))

  // Кумулятивная вероятность не попасть в убыток: чем положе кривая, тем лучше диверсификация.
  let cumulative = 0
  const cumulativeCurve = (active?.distribution ?? []).map((bin) => {
    cumulative += bin.probability
    return { defaults: bin.defaults, safe: bin.defaults <= (active?.loans ?? 0), cumulative }
  })

  const manualMode = state.mode === 'manual'
  const isEmptyManual = manualMode && state.entries.length === 0

  return (
    <Panel
      id="portfolio"
      tone="var(--color-sand-500)"
      title="Портфельный симулятор инвестора"
      description="Распределение считается точно: число дефолтов — пуассон-биномиальная сумма независимых бернуллиев, решается динамикой за O(N²). Никакого Монте-Карло: один и тот же seed всегда даёт один и тот же портфель."
      actions={
        <Segmented
          name="portfolio-mode"
          label="Режим портфеля"
          value={state.mode}
          options={[
            { value: 'generated', label: 'Сгенерировать' },
            { value: 'manual', label: 'Свои компании' },
          ]}
          onChange={(mode) => onChange({ mode })}
        />
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="divide-y divide-line border-y border-line">
            <SliderField
              name="portfolio-loans"
              label="Число займов в портфеле"
              hint={
                gated
                  ? `Бесплатный тариф: до ${limits.maxLoans} займов. С подпиской доступно ${fieldCap}.`
                  : 'Разбивка капитала на большее число займов — главный способ снизить риск потери всего портфеля.'
              }
              value={Math.min(state.loans, limits.maxLoans)}
              min={FIELD_LIMITS.portfolioLoans.min}
              max={limits.maxLoans}
              step={1}
              display={`${Math.min(state.loans, limits.maxLoans)} ${state.loans === 1 ? 'заём' : 'займов'}`}
              tone="var(--color-sand-300)"
              onChange={(loans) => onChange({ loans })}
            />
            <SliderField
              name="amount-per-loan"
              label="Сумма одного займа"
              hint="При равных суммах вклада каждый заём получает одинаковый вес в портфеле."
              value={state.amountPerLoan}
              min={FIELD_LIMITS.amountPerLoan.min}
              max={FIELD_LIMITS.amountPerLoan.max}
              step={FIELD_LIMITS.amountPerLoan.step}
              display={`${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(state.amountPerLoan)} млн ₽`}
              tone="var(--color-sand-300)"
              onChange={(amountPerLoan) => onChange({ amountPerLoan })}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="md"
              onClick={onAddCurrent}
              disabled={!canAddEntry}
              title={!canAddEntry ? `Достигнут лимит ${limits.maxLoans} займов` : undefined}
            >
              <Plus aria-hidden="true" className="size-4" />
              Добавить компанию в портфель
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => onChange({ seed: (state.seed * 16807 + 11) % 2147483647 })}
            >
              <Shuffle aria-hidden="true" className="size-4" />
              Другая подборка
            </Button>
          </div>

          {gated ? (
            <div className="border border-dashed border-brass-400/45 px-3 py-3">
              <div className="flex items-center gap-2 text-xs font-medium text-brass-300">
                <Lock aria-hidden="true" className="size-3.5" />
                Бесплатный тариф · до {limits.maxLoans} займов
              </div>
              <p className="mt-1.5 max-w-[46ch] text-xs leading-relaxed text-sand-500">
                Портфель в {fieldCap} займов, VaR и CVaR на широких подборках без ограничений
                и копирование отчёта — в подписке «Инвестор».
              </p>
              <a
                href="#plans"
                className="mt-2 inline-flex text-xs font-medium text-brass-300 underline-offset-2 transition-colors hover:underline"
              >
                Сравнить тарифы →
              </a>
            </div>
          ) : null}

          {manualMode ? (
            <div className="border border-line bg-ink-700/40 px-3 py-3">
              <h3 className="text-xs text-sand-500">Свой портфель · {state.entries.length}</h3>
              {state.entries.length === 0 ? (
                <p className="mt-2 text-xs leading-relaxed text-sand-700">
                  Портфель пуст. Добавьте компании из разных отраслей — так диверсификация
                  работает по-настоящему. Пока пусто, расчёт показывает один заём.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-line">
                  {state.entries.map((entry, index) => (
                    <li key={`${entry.name}-${index}`} className="flex items-center gap-2 py-1.5">
                      <span className="min-w-0 flex-1 truncate text-xs text-sand-200" title={entry.name}>
                        {entry.name}
                      </span>
                      <span className="shrink-0 text-[10px] text-sand-700">
                        {INDUSTRY_BY_ID[entry.industry].short}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveAt(index)}
                        aria-label={`Убрать ${entry.name} из портфеля`}
                        className="shrink-0 p-1 text-sand-700 transition-colors hover:text-risk-8"
                      >
                        <X aria-hidden="true" className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="max-w-[44ch] text-xs leading-relaxed text-sand-700">
              Подборка из {state.loans} {state.loans === 1 ? 'займа' : 'займов'} по seed{' '}
              <span className="tnum">{state.seed}</span>: выручка, возраст, долг и маржа выбираются
              детерминированно, PD каждого считается той же моделью. Логистика убывающая — портфель
              качественнее одиночного займа.
            </p>
          )}
        </div>

        {isEmptyManual ? (
          <EmptyPortfolioState onAddCurrent={onAddCurrent} />
        ) : active ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              <Stat
                label="Вложено"
                value={`${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(active.totalInvested)} млн ₽`}
                hint={`${active.loans} × ${active.amountPerLoan} млн ₽`}
              />
              <Stat
                label="Вероятность прибыли"
                value={percent(active.probabilityOfProfit, 1)}
                tone={active.probabilityOfProfit > 0.8 ? 'var(--color-risk-1)' : 'var(--color-risk-5)'}
                hint={`Убыток в ${percent(active.probabilityOfLoss, 1)} сценариев.`}
              />
              <Stat
                label="VaR 95 %"
                value={signedPercent(active.var95)}
                tone="var(--color-risk-8)"
                hint="Худшая доходность с вероятностью 5 %."
              />
              <Stat
                label="CVaR 95 %"
                value={signedPercent(active.cvar95)}
                tone="var(--color-risk-9)"
                hint="Средняя доходность в худших 5 % сценариев."
              />
              <Stat
                label="Ожидаемая доходность"
                value={signedPercent(active.expectedReturn)}
                tone={active.expectedReturn > 0 ? 'var(--color-risk-1)' : 'var(--color-risk-9)'}
                hint="E[P&L] портфеля, взвешенное по вероятностям."
              />
              <Stat
                label="Средний PD"
                value={percent(active.averagePd, 1)}
                tone={tone}
                hint="Среднее по займам портфеля."
              />
              <Stat
                label="Один заём из портфеля"
                value={signedPercent(active.singleLoanExpectation)}
                hint="Что дал бы один отдельно взятый заём."
              />
              <Stat
                label="Выигрыш от N займов"
                value={signedPercent(active.expectedReturn - active.singleLoanExpectation)}
                tone={
                  active.expectedReturn - active.singleLoanExpectation > 0
                    ? 'var(--color-risk-1)'
                    : undefined
                }
                hint="Разница между портфелем и одиночным займом."
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <figure>
                <figcaption className="text-xs text-sand-500">
                  Распределение числа дефолтов: сколько займов не вернут капитал
                </figcaption>
                <div className="mt-2 h-[190px] w-full" role="img" aria-label="Распределение числа дефолтов в портфеле">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distribution} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                      <CartesianGrid stroke="var(--color-line)" vertical={false} />
                      <XAxis
                        dataKey="defaults"
                        stroke="var(--color-sand-700)"
                        tick={{ fill: 'var(--color-sand-700)', fontSize: 11 }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="var(--color-sand-700)"
                        tick={{ fill: 'var(--color-sand-700)', fontSize: 11 }}
                        tickLine={false}
                        tickFormatter={(v: number) => percent(v, 0)}
                      />
                      <Tooltip cursor={{ fill: 'rgb(255 255 255 / 0.03)' }} content={<BinTooltip />} />
                      <Bar dataKey="probability" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                        {distribution.map((bin) => (
                          <Cell key={bin.defaults} fill={bin.gain ? 'var(--color-risk-1)' : 'var(--color-risk-9)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </figure>

              <figure>
                <figcaption className="text-xs text-sand-500">
                  Накопленная вероятность убытка: с каждым займом портфель устойчивее
                </figcaption>
                <div className="mt-2 h-[190px] w-full" role="img" aria-label="Кумулятивная вероятность убытка портфеля">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cumulativeCurve} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                      <CartesianGrid stroke="var(--color-line)" vertical={false} />
                      <XAxis
                        dataKey="defaults"
                        stroke="var(--color-sand-700)"
                        tick={{ fill: 'var(--color-sand-700)', fontSize: 11 }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="var(--color-sand-700)"
                        tick={{ fill: 'var(--color-sand-700)', fontSize: 11 }}
                        tickLine={false}
                        tickFormatter={(v: number) => percent(v, 0)}
                      />
                      <Tooltip content={<CumulativeTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="cumulative"
                        stroke="var(--color-brass-400)"
                        strokeWidth={2}
                        fill="var(--color-brass-400)"
                        fillOpacity={0.14}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </figure>
            </div>
          </div>
        ) : null}
      </div>
    </Panel>
  )
})

function EmptyPortfolioState({ onAddCurrent }: { onAddCurrent: () => void }) {
  return (
    <div className="flex flex-col items-start justify-center border border-dashed border-line px-5 py-8">
      <h3 className="text-sm font-medium text-sand-200">Портфель пока пуст</h3>
      <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-sand-500">
        Диверсификация работает, только когда в портфеле несколько независимых заёмщиков.
        Добавьте текущую компанию и переключите её параметры — или добавьте компании из
        разных отраслей вручную.
      </p>
      <Button variant="primary" size="md" onClick={onAddCurrent}>
        <Plus aria-hidden="true" className="size-4" />
        Добавить компанию в портфель
      </Button>
    </div>
  )
}

function BinTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: { defaults: number; probability: number; pnlPercent: number } }>
}) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null
  return (
    <div className="tnum border border-line-strong bg-ink-950 px-3 py-2 text-xs shadow-xl">
      <div className="text-sm font-medium text-sand-100">
        {row.defaults} {row.defaults === 1 ? 'дефолт' : 'дефолтов'}
      </div>
      <div className="mt-1 text-sand-500">
        Вероятность <span className="text-sand-200">{percent(row.probability, 2)}</span>
      </div>
      <div className="text-sand-500">
        Доходность портфеля{' '}
        <span
          className={row.pnlPercent > 0 ? 'text-risk-1' : 'text-risk-9'}
        >
          {signedPercent(row.pnlPercent)}
        </span>
      </div>
    </div>
  )
}

function CumulativeTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: number
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="tnum border border-line-strong bg-ink-950 px-3 py-2 text-xs shadow-xl">
      <div className="text-sm font-medium text-sand-100">Дефолтов: {label}</div>
      <div className="mt-1 text-sand-500">
        Шанс не уйти в минус{' '}
        <span className="text-sand-200">{percent(payload[0]!.value, 1)}</span>
      </div>
    </div>
  )
}

export type { PortfolioOutcome }