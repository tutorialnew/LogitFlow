import { memo } from 'react'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { AssessmentResult } from '@/domain/types'
import { TONE_COLOR, percent } from '@/format'

interface RiskProfilePanelProps {
  result: AssessmentResult
}

export const RiskProfilePanel = memo(function RiskProfilePanel({ result }: RiskProfilePanelProps) {
  const tone = TONE_COLOR[result.gradeTone]
  const data = result.radar.axes.map((axis) => ({
    axis: axis.label,
    Заёмщик: axis.company,
    Отрасль: axis.industry,
  }))

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <h3 className="text-sm font-medium text-sand-300">Профиль риска в сравнении с отраслью</h3>
        <p className="mt-1 max-w-[64ch] text-xs leading-relaxed text-sand-700">
          Шесть осей нормализованы в шкалу 0…1, где больше — лучше. Ломаная отрасли — типичный
          безопасный заёмщик этой отрасли. Чем ближе контур к внешнему кругу, тем устойчивее
          бизнес.
        </p>
        <div className="mt-4 h-[300px] w-full" role="img" aria-label="Радарная диаграмма профиля риска">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="72%">
              <PolarGrid stroke="var(--color-line)" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fill: 'var(--color-sand-300)', fontSize: 11 }}
              />
              <Radar
                name="Отрасль"
                dataKey="Отрасль"
                stroke="var(--color-sand-500)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                fill="var(--color-sand-500)"
                fillOpacity={0.08}
                isAnimationActive={false}
              />
              <Radar
                name="Заёмщик"
                dataKey="Заёмщик"
                stroke={tone}
                strokeWidth={2}
                fill={tone}
                fillOpacity={0.22}
                isAnimationActive={false}
              />
              <Tooltip content={<RadarTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-sand-500">
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="h-0.5 w-5" style={{ background: tone }} />
            Заёмщик
          </li>
          <li className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-0.5 w-5"
              style={{
                backgroundImage: 'repeating-linear-gradient(to right, var(--color-sand-500) 0 4px, transparent 4px 7px)',
              }}
            />
            Среднее по отрасли
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-medium text-sand-300">Доходность с учётом риска</h3>
        <p className="mt-1 max-w-[64ch] text-xs leading-relaxed text-sand-700">
          Номинальная ставка платформы обещает {percent(result.terms.rate, 1)} годовых. Но с
          вероятностью {percent(result.pd, 1)} заёмщик не вернёт ничего и сверх того потеряет{' '}
          {percent(result.terms.lgd, 0)} вложенного. Математическое ожидание считается за год.
        </p>

        <div className="mt-5 space-y-4">
          <ReturnBar
            label="Обещает платформа"
            value={result.expected.rate}
            tone="var(--color-brass-400)"
            note={`Ставка ${percent(result.expected.rate, 1)} годовых, если заёмщик платит.`}
          />
          <ReturnBar
            label="Ожидается по вероятностям"
            value={result.expected.expectedReturn}
            tone={result.expected.coversRisk ? 'var(--color-risk-1)' : 'var(--color-risk-9)'}
            note={`E(R) = ${percent(result.expected.rate, 2)} · (1 − ${percent(result.pd, 4)}) − ${percent(result.pd, 4)} · ${percent(result.terms.lgd, 2)} = ${percent(result.expected.expectedReturn, 2)}.`}
          />
          <ReturnBar
            label="Безрисковая альтернатива"
            value={result.terms.riskFreeRate}
            tone="var(--color-sand-500)"
            note={`${percent(result.terms.riskFreeRate, 1)} — депозит или ОФЗ, где риска дефолта нет.`}
          />
        </div>

        <p className="mt-5 max-w-[68ch] border border-line bg-ink-700/60 px-3 py-2.5 text-xs leading-relaxed text-sand-500">
          Разница между обещанием и ожиданием — это и есть «цена риска», которую инвестор платит
          за доступ к доходности. Если она отрицательная, ставка занижена для уровня этого
          заёмщика: минимум, при котором ожидание не отрицательное, —{' '}
          <span className="tnum font-medium text-sand-200">{percent(result.expected.breakEvenRate)}</span>.
        </p>
      </div>
    </div>
  )
})

function ReturnBar({
  label,
  value,
  tone,
  note,
}: {
  label: string
  value: number
  tone: string
  note: string
}) {
  const width = Math.min(100, Math.abs(value) * 220)
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-sand-300">{label}</span>
        <span className="tnum text-lg font-semibold" style={{ color: tone }}>
          {percent(value, 2)}
        </span>
      </div>
      <div className="mt-1.5 h-2.5 w-full bg-ink-700">
        <div className="h-full" style={{ width: `${width}%`, background: tone }} />
      </div>
      <p className="tnum mt-1 text-xs leading-relaxed text-sand-700">{note}</p>
    </div>
  )
}

function RadarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="border border-line-strong bg-ink-950 px-3 py-2 text-xs shadow-xl">
      <div className="text-sm font-medium text-sand-100">{label}</div>
      <dl className="tnum mt-1 space-y-0.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex justify-between gap-4">
            <dt style={{ color: entry.color }}>{entry.name}</dt>
            <dd className="text-sand-200">{percent(entry.value, 0)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}