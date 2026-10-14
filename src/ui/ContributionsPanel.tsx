import { memo } from 'react'
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { AssessmentResult, BenchmarkComparison } from '@/domain/types'
import { TONE_COLOR } from '@/format'

interface ContributionsPanelProps {
  result: AssessmentResult
}

/** Вклад в логит: положительный тянет риск вверх, отрицательный снижает. */
export const ContributionsPanel = memo(function ContributionsPanel({ result }: ContributionsPanelProps) {
  const data = result.contributions.map((item) => ({
    key: item.key,
    short: item.label,
    contribution: Number(item.contribution.toFixed(4)),
    value: item.humanValue,
    center: item.humanCenter,
    beta: item.beta,
    comment: item.comment,
    effect: item.effect,
  }))

  const tone = TONE_COLOR[result.gradeTone]

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
      <div>
        <h3 className="text-sm font-medium text-sand-300">Вклад каждого фактора в логит</h3>
        <p className="mt-1 max-w-[64ch] text-xs leading-relaxed text-sand-700">
          Вклад = β · (X − центр). Положительный столбец тянет риск вверх, отрицательный
          снижает. В сумме со свободным членом β₀ = −1,35 столбцы дают логит заёмщика.
        </p>
        <div className="mt-4 h-[260px] w-full" role="img" aria-label="Диаграмма вклада факторов в вероятность дефолта">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 4 }}>
              <XAxis
                type="number"
                stroke="var(--color-sand-700)"
                tick={{ fill: 'var(--color-sand-700)', fontSize: 11 }}
                tickLine={false}
                tickFormatter={(v: number) => v.toFixed(1)}
              />
              <YAxis
                type="category"
                dataKey="short"
                width={132}
                stroke="var(--color-sand-700)"
                tick={{ fill: 'var(--color-sand-300)', fontSize: 11 }}
                tickLine={false}
              />
              <ReferenceLine x={0} stroke="var(--color-line-strong)" />
              <Tooltip
                cursor={{ fill: 'rgb(255 255 255 / 0.03)' }}
                content={<ContributionTooltip />}
              />
              <Bar dataKey="contribution" radius={[2, 2, 2, 2]} isAnimationActive={false}>
                {data.map((item) => (
                  <Cell
                    key={item.key}
                    fill={item.contribution > 0.005 ? 'var(--color-risk-8)' : item.contribution < -0.005 ? 'var(--color-risk-1)' : 'var(--color-sand-700)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-sand-300">Сравнение со средним по отрасли</h3>
        <p className="mt-1 max-w-[64ch] text-xs leading-relaxed text-sand-700">
          Отклонение в процентах от эталонного показателя отрасли. Зелёным отмечено то, что
          лучше среднего.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <caption className="sr-only">
              Сравнение показателей заёмщика со средними значениями по отрасли
            </caption>
            <thead>
              <tr className="border-b border-line text-left text-xs text-sand-700">
                <th scope="col" className="pb-2 font-normal">
                  Показатель
                </th>
                <th scope="col" className="pb-2 text-right font-normal">
                  Заёмщик
                </th>
                <th scope="col" className="pb-2 text-right font-normal">
                  Отрасль
                </th>
                <th scope="col" className="pb-2 text-right font-normal">
                  Отклонение
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {result.benchmark.map((row) => (
                <BenchmarkRow key={row.key} row={row} />
              ))}
            </tbody>
          </table>
        </div>
        <p
          className="mt-4 border-l-2 px-3 py-2 text-xs leading-relaxed"
          style={{ borderColor: tone, background: 'var(--color-ink-700)' }}
        >
          Итоговый риск <span className="tnum font-semibold" style={{ color: tone }}>{result.grade}</span>:
          {' '}логит {result.logit.toFixed(3)}, порог отсечки — грейд D при PD ≥ 60 %.
        </p>
      </div>
    </div>
  )
})

function BenchmarkRow({ row }: { row: BenchmarkComparison }) {
  const better = row.better === 'higher' ? row.companyValue > row.industryValue : row.companyValue < row.industryValue
  const same = Math.abs(row.companyValue - row.industryValue) < 1e-9
  const color = same ? 'var(--color-sand-700)' : better ? 'var(--color-risk-1)' : 'var(--color-risk-8)'
  const deviation =
    row.industryValue === 0 ? 0 : (row.companyValue - row.industryValue) / Math.abs(row.industryValue)

  return (
    <tr>
      <th scope="row" className="py-2 pr-3 text-left text-xs font-normal text-sand-500">
        {row.label}
        {row.better === 'lower' ? <span className="text-sand-700"> ↓</span> : null}
      </th>
      <td className="tnum py-2 text-right text-sand-100">{formatRow(row)}</td>
      <td className="tnum py-2 text-right text-sand-500">{formatBenchmark(row)}</td>
      <td className="tnum py-2 text-right font-medium" style={{ color }}>
        {same ? '—' : `${deviation > 0 ? '+' : '−'}${Math.abs(deviation * 100).toFixed(0)} %`}
      </td>
    </tr>
  )
}

function formatRow(row: BenchmarkComparison): string {
  if (row.key === 'hasCollateral') return row.companyValue === 1 ? 'Есть' : 'Нет'
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(row.companyValue)
}

function formatBenchmark(row: BenchmarkComparison): string {
  if (row.key === 'hasCollateral') return row.industryValue === 1 ? 'Есть' : 'Нет'
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(row.industryValue)
}

interface TooltipPayloadEntry {
  payload: {
    short: string
    contribution: number
    value: string
    center: string
    beta: number
    comment: string
    effect: string
  }
}

function ContributionTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
}) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null

  const positive = row.contribution > 0.005
  const neutral = row.effect === 'neutral'

  return (
    <div className="max-w-[38ch] border border-line-strong bg-ink-950 px-3 py-2 text-xs shadow-xl">
      <div className="text-sm font-medium text-sand-100">{row.short}</div>
      <dl className="tnum mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-sand-500">
        <dt>Значение</dt>
        <dd className="text-right text-sand-200">{row.value}</dd>
        <dt>Центр</dt>
        <dd className="text-right text-sand-200">{row.center}</dd>
        <dt>Коэффициент β</dt>
        <dd className="text-right text-sand-200">{row.beta.toFixed(2)}</dd>
        <dt>Вклад</dt>
        <dd
          className="text-right font-semibold"
          style={{ color: neutral ? 'var(--color-sand-700)' : positive ? 'var(--color-risk-8)' : 'var(--color-risk-1)' }}
        >
          {row.contribution > 0 ? '+' : ''}
          {row.contribution.toFixed(2)}
        </dd>
      </dl>
      <p className="mt-2 leading-relaxed text-sand-500">{row.comment}</p>
    </div>
  )
}