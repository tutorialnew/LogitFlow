import { INDUSTRIES, INDUSTRY_BY_ID } from '@/domain/model'
import { FACTOR_SPECS } from '@/domain/factors'
import { FIELD_LIMITS } from '@/domain/normalize'
import type { BorrowerProfile, IndustryId } from '@/domain/types'
import { money, percent, times } from '@/format'
import { Panel } from './Panel'
import { SliderField } from './SliderField'
import { Toggle } from './Controls'

interface BorrowerPanelProps {
  borrower: BorrowerProfile
  onChange: (patch: Partial<BorrowerProfile>) => void
}

const specOf = (key: string) => FACTOR_SPECS.find((spec) => spec.key === key)!

const AGE_LIMIT = FIELD_LIMITS.ageMonths

export function BorrowerPanel({ borrower, onChange }: BorrowerPanelProps) {
  const industry = INDUSTRY_BY_ID[borrower.industry]
  const collateral = specOf('hasCollateral')

  return (
    <Panel
      id="borrower"
      tone="var(--color-brass-500)"
      title="Параметры заёмщика"
      description="Двигайте ползунки — расчёт пересчитывается на лету. Подсказка под каждым показателем объясняет, почему он важен для инвестора."
    >
      <div className="grid gap-x-8 lg:grid-cols-2">
        <div className="divide-y divide-line">
          <SliderField
            name="revenue"
            label="Годовая выручка"
            hint={specOf('revenue').hint}
            value={borrower.revenue}
            min={FIELD_LIMITS.revenue.min}
            max={FIELD_LIMITS.revenue.max}
            step={FIELD_LIMITS.revenue.step}
            display={money(borrower.revenue)}
            benchmark={money(specOf('revenue').centerRaw)}
            onChange={(revenue) => onChange({ revenue })}
          />
          <SliderField
            name="ageMonths"
            label="Срок существования"
            hint={specOf('ageMonths').hint}
            value={borrower.ageMonths}
            min={AGE_LIMIT.min}
            max={AGE_LIMIT.max}
            step={AGE_LIMIT.step}
            display={
              borrower.ageMonths < 12
                ? `${borrower.ageMonths} мес.`
                : `${(borrower.ageMonths / 12).toFixed(1).replace('.', ',')} года`
            }
            benchmark={`${(specOf('ageMonths').centerRaw / 12).toFixed(0)} года`}
            onChange={(ageMonths) => onChange({ ageMonths })}
          />
          <SliderField
            name="debtToEbitda"
            label="Долговая нагрузка, Долг / EBITDA"
            hint={specOf('debtToEbitda').hint}
            value={borrower.debtToEbitda}
            min={FIELD_LIMITS.debtToEbitda.min}
            max={FIELD_LIMITS.debtToEbitda.max}
            step={FIELD_LIMITS.debtToEbitda.step}
            display={times(borrower.debtToEbitda)}
            benchmark={times(specOf('debtToEbitda').centerRaw)}
            onChange={(debtToEbitda) => onChange({ debtToEbitda })}
          />
          <SliderField
            name="netMargin"
            label="Рентабельность по чистой прибыли"
            hint={specOf('netMargin').hint}
            value={borrower.netMargin}
            min={FIELD_LIMITS.netMargin.min}
            max={FIELD_LIMITS.netMargin.max}
            step={FIELD_LIMITS.netMargin.step}
            display={percent(borrower.netMargin / 100, 1)}
            benchmark={`${specOf('netMargin').centerRaw} %`}
            onChange={(netMargin) => onChange({ netMargin })}
          />
        </div>

        <div className="mt-6 lg:mt-0">
          <div className="py-4">
            <label htmlFor="industry" className="text-sm font-medium text-sand-100">
              Отрасль бизнеса
            </label>
            <select
              id="industry"
              name="industry"
              value={borrower.industry}
              onChange={(event) => onChange({ industry: event.target.value as IndustryId })}
              className="mt-2 w-full border border-line bg-ink-700 px-3 py-2 text-sm transition-colors hover:border-line-strong focus:border-brass-400 focus:outline-none"
            >
              {INDUSTRIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <p className="mt-2 max-w-[62ch] text-xs leading-relaxed text-sand-700">
              {specOf('industryRisk').hint} Индекс отраслевого риска —{' '}
              <span className="text-sand-500">{industry.risk} из 100</span>: {industry.comment}
            </p>
          </div>

          <div className="py-4">
            <Toggle
              label={collateral.label}
              description={collateral.hint}
              checked={borrower.hasCollateral}
              tone="var(--color-risk-1)"
              onChange={(hasCollateral) => onChange({ hasCollateral })}
            />
          </div>

          <div className="py-4">
            <label htmlFor="name" className="text-sm font-medium text-sand-100">
              Название компании
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={borrower.name}
              maxLength={80}
              autoComplete="organization"
              onChange={(event) => onChange({ name: event.target.value })}
              className="mt-2 w-full border border-line bg-ink-700 px-3 py-2 text-sm text-sand-100 transition-colors hover:border-line-strong focus:border-brass-400 focus:outline-none"
              placeholder="Например, ООО «Пекарня у дома»…"
            />
            <p className="mt-2 text-xs text-sand-700">Подпись в резюме для инвестора и на графиках.</p>
          </div>
        </div>
      </div>
    </Panel>
  )
}