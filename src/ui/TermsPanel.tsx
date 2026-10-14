import { FIELD_LIMITS } from '@/domain/normalize'
import { MODEL_CALIBRATION } from '@/domain/model'
import type { DealTerms } from '@/domain/types'
import { percent } from '@/format'
import { SliderField } from './SliderField'

interface TermsPanelProps {
  terms: DealTerms
  onChange: (patch: Partial<DealTerms>) => void
}

export function TermsPanel({ terms, onChange }: TermsPanelProps) {
  return (
    <div className="divide-y divide-line border-y border-line px-1">
      <SliderField
        name="rate"
        label="Ставка платформы"
        hint="Номинальная годовая ставка, которую предлагает инвестплатформа заёмщику."
        value={terms.rate}
        min={FIELD_LIMITS.rate.min}
        max={FIELD_LIMITS.rate.max}
        step={FIELD_LIMITS.rate.step}
        display={percent(terms.rate, 1)}
        onChange={(rate) => onChange({ rate })}
      />
      <SliderField
        name="lgd"
        label="Потери при дефолте, LGD"
        hint="Какую долю вложенного инвестор не вернёт, если заёмщик не расплатится. Для залогового кредита ниже, для поручительства — почти всё."
        value={terms.lgd}
        min={FIELD_LIMITS.lgd.min}
        max={FIELD_LIMITS.lgd.max}
        step={FIELD_LIMITS.lgd.step}
        display={percent(terms.lgd, 0)}
        benchmark={percent(MODEL_CALIBRATION.lgd, 0)}
        onChange={(lgd) => onChange({ lgd })}
      />
      <SliderField
        name="risk-free-rate"
        label="Безрисковая ставка"
        hint="Доходность, которую даёт депозит или ОФЗ без риска дефолта. Это точка отсчёта: заёмная ставка должна быть выше."
        value={terms.riskFreeRate}
        min={FIELD_LIMITS.riskFreeRate.min}
        max={FIELD_LIMITS.riskFreeRate.max}
        step={FIELD_LIMITS.riskFreeRate.step}
        display={percent(terms.riskFreeRate, 1)}
        benchmark={percent(MODEL_CALIBRATION.riskFreeRate, 0)}
        onChange={(riskFreeRate) => onChange({ riskFreeRate })}
      />
    </div>
  )
}