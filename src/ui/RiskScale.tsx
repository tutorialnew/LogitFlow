import { GRADE_LADDER, INDUSTRY_BY_ID } from '@/domain/model'
import { calculateAssessment } from '@/domain/calculateAssessment'
import type { IndustryId } from '@/domain/types'
import { TONE_COLOR, logPosition, percent } from '@/format'

/**
 * PD «средней безопасной» компании выбранной отрасли.
 *
 * Считается через ту же согласованную границу `calculateAssessment`, чтобы в интерфейсе
 * не появилось второй реализации модели. Результат кэшируется: отраслей шесть, пересчёт
 * не нужен.
 */
const cache = new Map<IndustryId, number>()

export function industryPd(industry: IndustryId): number {
  const cached = cache.get(industry)
  if (cached !== undefined) return cached

  const { benchmark } = INDUSTRY_BY_ID[industry]
  const result = calculateAssessment({
    borrower: { name: INDUSTRY_BY_ID[industry].label, ...benchmark, industry },
    terms: { rate: 0.3, lgd: 0.8, riskFreeRate: 0.18 },
  })
  cache.set(industry, result.pd)
  return result.pd
}

const AXIS_TICKS = [0.001, 0.01, 0.05, 0.15, 0.4, 1]

interface RiskScaleProps {
  pd: number
  grade: string
  industry: IndustryId
}

const boundaries = (() => {
  const edges = [0, ...GRADE_LADDER.slice(0, -1).map((step) => step.max)]
  const positions = edges.map((edge) => logPosition(edge))
  return positions.map((start, index) => {
    const end = positions[index + 1] ?? 100
    return {
      code: GRADE_LADDER[index]!.code,
      label: GRADE_LADDER[index]!.label,
      tone: GRADE_LADDER[index]!.tone,
      start,
      width: end - start,
    }
  })
})()

/**
 * Шкала надёжности — центральный образ интерфейса: не «большая цифра», а положение
 * заёмщика в рейтинговой шкале с девятью порогами. Читается как котировка.
 */
export function RiskScale({ pd, grade, industry }: RiskScaleProps) {
  const marker = logPosition(pd)
  const average = logPosition(industryPd(industry))
  const tone = TONE_COLOR[GRADE_LADDER.find((s) => s.code === grade)?.tone ?? 'amber']

  return (
    <div className="select-none">
      <div className="relative h-9 w-full overflow-visible">
        <div className="absolute inset-x-0 top-4 flex h-2" role="presentation">
          {boundaries.map((band) => (
            <div
              key={band.code}
              className="h-2 first:rounded-l-[2px] last:rounded-r-[2px]"
              style={{ width: `${band.width}%`, background: TONE_COLOR[band.tone] }}
            />
          ))}
        </div>

        {/* Маркер среднего по отрасли */}
        <div
          className="pointer-events-none absolute top-0 h-9 -translate-x-1/2"
          style={{ left: `${average}%` }}
          aria-hidden="true"
        >
          <div className="h-6 w-px bg-sand-300/50" />
        </div>

        {/* Маркер заёмщика */}
        <div className="pointer-events-none absolute -top-1 -translate-x-1/2" style={{ left: `${marker}%` }}>
          <div className="flex flex-col items-center">
            <div
              className="whitespace-nowrap border px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
              style={{
                color: '#070c15',
                background: tone,
                borderColor: tone,
              }}
            >
              {percent(pd, 1)}
            </div>
            <div className="h-7 w-0.5" style={{ background: tone }} />
          </div>
        </div>
      </div>

      <div className="relative mt-1 h-4">
        {boundaries.map((band) => {
          const center = band.start + band.width / 2
          return (
            <span
              key={band.code}
              className="tnum absolute top-0 whitespace-nowrap text-[10px] font-medium text-sand-500"
              style={
                center > 92
                  ? { left: '100%', transform: 'translateX(-100%)' }
                  : { left: `${center}%`, transform: 'translateX(-50%)' }
              }
            >
              {band.code}
            </span>
          )
        })}
      </div>

      <div className="relative mt-1 h-4 border-t border-line" aria-hidden="true">
        {AXIS_TICKS.map((tick) => {
          const left = logPosition(tick)
          return (
            <span
              key={tick}
              className="tnum absolute top-1 -translate-x-1/2 whitespace-nowrap text-[10px] text-sand-700"
              // Крайние деления прижимаем к краям шкалы, иначе подпись уезжает за пределы панели.
              style={left > 92 ? { left: '100%', transform: 'translateX(-100%)' } : { left: `${left}%` }}
            >
              {tick === 1 ? '100 %' : percent(tick, tick < 0.01 ? 1 : 0)}
            </span>
          )
        })}
      </div>

      <p className="sr-only">
        Вероятность дефолта {percent(pd, 1)}, грейд {grade}. Средний показатель по отрасли —{' '}
        {percent(industryPd(industry), 1)}. Шкала логарифмическая: деления 0,1 %, 1 %, 5 %, 15 %, 40 %, 100 %.
      </p>
      <p aria-hidden="true" className="mt-2 text-xs text-sand-700">
        Вертикальная отметка слева — средний показатель по отрасли «{INDUSTRY_BY_ID[industry].short}» (
        {percent(industryPd(industry), 1)}).
      </p>
    </div>
  )
}