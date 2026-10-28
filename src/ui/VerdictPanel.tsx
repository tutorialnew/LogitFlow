import { CheckCircle2, CircleSlash, Copy, Info, Lock, TrendingDown, TrendingUp } from 'lucide-react'
import { FACTOR_SPECS } from '@/domain/factors'
import type { AssessmentResult } from '@/domain/types'
import { TONE_COLOR, VERDICT_COLOR, percent, signedPercent } from '@/format'
import { Panel } from './Panel'
import { Stat } from './Controls'
import { Button } from './Button'
import { gradeWash } from './backgrounds'
import type { PlanId } from './plans'
import { planLimits } from './plans'

const VerdictIcon = {
  attractive: CheckCircle2,
  fair: Info,
  underpriced: TrendingDown,
  critical: CircleSlash,
} as const

interface VerdictPanelProps {
  result: AssessmentResult
  plan: PlanId
}

export function VerdictPanel({ result, plan }: VerdictPanelProps) {
  const gradeColor = TONE_COLOR[result.gradeTone]
  const verdictColor = VERDICT_COLOR[result.expected.verdict]
  const Icon = VerdictIcon[result.expected.verdict]
  const riskSpec = FACTOR_SPECS.find((s) => s.key === 'debtToEbitda')!
  const safetySpec = FACTOR_SPECS.find((s) => s.key === 'netMargin')!
  const limits = planLimits(plan)
  const report = buildReport(result)

  return (
    <Panel
      tone={gradeColor}
      wash={gradeWash(gradeColor)}
      title="Вердикт инвестора"
      description="Пересчитывается мгновенно при изменении любого параметра. Все числа — в валюте долей: 0,18 = 18 %."
    >
      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-4">
        <div>
          <div className="text-xs text-sand-500">Вероятность дефолта за 12 месяцев</div>
          <div
            className="tnum mt-1 text-5xl font-semibold leading-none tracking-tight"
            style={{ color: gradeColor }}
          >
            {percent(result.pd, 2)}
          </div>
          <div className="tnum mt-2 text-xs text-sand-700">
            Z = {result.logit.toFixed(3)} · σ(Z) = 1 / (1 + e<sup>−Z</sup>)
          </div>
        </div>
        <div className="flex items-baseline gap-3 border-l border-line pl-6">
          <span className="tnum text-4xl font-semibold leading-none" style={{ color: gradeColor }}>
            {result.grade}
          </span>
          <span className="text-sm text-sand-300">{result.gradeLabel.toLowerCase()}</span>
        </div>
      </div>

      <p className="mt-5 max-w-[72ch] text-sm leading-relaxed text-sand-200">{result.narrative}</p>

      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-3">
        <Stat
          label="Ставка безубыточности"
          value={percent(result.expected.breakEvenRate)}
          hint="Минимальная ставка, при которой E(R) = 0."
        />
        <Stat
          label="Премия за риск"
          value={signedPercent(result.expected.premium)}
          tone={result.expected.coversRisk ? 'var(--color-risk-1)' : 'var(--color-risk-9)'}
          hint={`E(R) минус безрисковые ${percent(result.terms.riskFreeRate, 0)}.`}
        />
        <Stat
          label="Рекомендуемая ставка"
          value={percent(result.expected.recommendedRate)}
          hint={`Безрисковая + PD · LGD · 2,2 — ставка, за которую риск считают оплаченным.`}
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {result.topRiskFactor ? (
          <FactorNote
            icon={TrendingUp}
            tone="var(--color-risk-8)"
            heading="Что тянет риск вверх"
            title={result.topRiskFactor.label}
            text={result.topRiskFactor.comment}
            delta={`+${(result.topRiskFactor.contribution * 100).toFixed(2)} к логиту`}
          />
        ) : null}
        {result.topSafetyFactor ? (
          <FactorNote
            icon={TrendingDown}
            tone="var(--color-risk-1)"
            heading="Что снижает риск"
            title={result.topSafetyFactor.label}
            text={result.topSafetyFactor.comment}
            delta={`−${(Math.abs(result.topSafetyFactor.contribution) * 100).toFixed(2)} к логиту`}
          />
        ) : (
          <p className="max-w-[52ch] border border-line bg-ink-700/50 px-3 py-3 text-xs leading-relaxed text-sand-500">
            Ни один фактор сейчас не отклоняет заёмщика от безопасного уровня отрасли — риск
            определяется базовой ставкой PD {percent(result.pd, 1)}. Сдвиньте долговую нагрузку
            или маржу, чтобы увидеть разбор.
          </p>
        )}
      </div>

      <div
        className="mt-5 flex items-start gap-3 border px-4 py-3"
        style={{ borderColor: `${verdictColor}55`, background: `${verdictColor}12` }}
        role="status"
        aria-live="polite"
      >
        <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" style={{ color: verdictColor }} />
        <div className="min-w-0">
          <div className="text-sm font-semibold" style={{ color: verdictColor }}>
            {result.expected.verdictLabel}
          </div>
          <p className="mt-1 max-w-[72ch] text-sm leading-relaxed text-sand-200">
            {result.expected.verdictText}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        {limits.canCopyReport ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void navigator.clipboard?.writeText(report)
            }}
          >
            <Copy aria-hidden="true" className="size-3.5" />
            Копировать отчёт
          </Button>
        ) : (
          <>
            <Button variant="secondary" size="sm" disabled title={`Доступно в тарифах «Инвестор» и «Платформа»`}>
              <Lock aria-hidden="true" className="size-3.5" />
              Копировать отчёт
            </Button>
            <a
              href="#plans"
              className="text-xs text-sand-500 underline-offset-2 transition-colors hover:text-brass-300 hover:underline"
            >
              Отчёт открывается в подписке «Инвестор» →
            </a>
          </>
        )}
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-2 border-t border-line pt-4 text-xs text-sand-500 sm:grid-cols-2">
        <div className="flex justify-between gap-3">
          <dt>Справочные факторы модели</dt>
          <dd className="tnum text-sand-300">
            {riskSpec.short}, {safetySpec.short} и ещё 4
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Логистическая регрессия</dt>
          <dd className="tnum text-sand-300">6 признаков + свободный член</dd>
        </div>
      </dl>
    </Panel>
  )
}

function FactorNote({
  icon: Icon,
  tone,
  heading,
  title,
  text,
  delta,
}: {
  icon: typeof TrendingUp
  tone: string
  heading: string
  title: string
  text: string
  delta: string
}) {
  return (
    <div className="border border-line bg-ink-700/50 px-3 py-3">
      <div className="flex items-center gap-2 text-xs text-sand-500">
        <Icon aria-hidden="true" className="size-3.5" style={{ color: tone }} />
        {heading}
        <span className="tnum ml-auto" style={{ color: tone }}>
          {delta}
        </span>
      </div>
      <div className="mt-1.5 text-sm font-medium text-sand-100">{title}</div>
      <p className="mt-1 max-w-[52ch] text-xs leading-relaxed text-sand-500">{text}</p>
    </div>
  )
}

/** Текстовый отчёт по заёмщику: то, что копирует инвестор в свою заметку о сделке. */
function buildReport(result: AssessmentResult): string {
  const lines = [
    'LogitFlow · отчёт по заёмщику',
    `Компания: ${result.borrower.name} (${result.borrower.industry})`,
    `PD за 12 мес.: ${percent(result.pd, 2)} · грейд ${result.grade} (${result.gradeLabel.toLowerCase()})`,
    `Z = ${result.logit.toFixed(3)}`,
    `Безубыточная ставка: ${percent(result.expected.breakEvenRate)}`,
    `Премия за риск: ${signedPercent(result.expected.premium)}`,
    `Рекомендуемая ставка: ${percent(result.expected.recommendedRate)}`,
    `Вердикт: ${result.expected.verdictLabel}`,
    result.expected.verdictText,
  ]
  if (result.topRiskFactor) lines.push(`Тянет риск вверх: ${result.topRiskFactor.label} — ${result.topRiskFactor.comment}`)
  if (result.topSafetyFactor) lines.push(`Снижает риск: ${result.topSafetyFactor.label} — ${result.topSafetyFactor.comment}`)
  lines.push('', 'Коэффициенты модели — учебная калибровка, не инвестиционная рекомендация.')
  return lines.join('\n')
}