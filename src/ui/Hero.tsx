import { ArrowRight } from 'lucide-react'
import { COMPANY_PRESETS } from '@/domain/presets'
import type { CompanyPreset } from '@/domain/presets'
import type { AssessmentResult } from '@/domain/types'
import { TONE_COLOR } from '@/format'
import { RiskScale } from './RiskScale'

interface HeroProps {
  result: AssessmentResult
  activePresetId: string | null
  onApplyPreset: (preset: CompanyPreset) => void
}

export function Hero({ result, activePresetId, onApplyPreset }: HeroProps) {
  const tone = TONE_COLOR[result.gradeTone]

  return (
    <header id="hero" className="scroll-mt-24">
      <div className="max-w-[68ch]">
        <p className="text-sm text-sand-500">
          Сервис оценки инвестиционной привлекательности малого бизнеса
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-[1.15] text-sand-100 sm:text-[2.6rem]">
          Стоит ли инвестору вкладываться в этот заём
        </h1>
        <p className="mt-4 max-w-[64ch] text-base leading-relaxed text-sand-300">
          Задайте параметры компании — модель логистической регрессии посчитает вероятность
          дефолта за 12 месяцев, объяснит, какие именно факторы её двигают, и покажет,
          перекрывает ли предложенная ставка риск и потери при дефолте. Все расчёты идут
          в браузере, в реальном времени, без сервера.
        </p>
      </div>

      <div className="mt-10 border border-line bg-ink-800 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 className="text-sm font-medium text-sand-300">Шкала надёжности заёмщика</h2>
          <p className="text-xs text-sand-700">
            Логарифмическая шкала: девять порогов грейдов от AAA до D
          </p>
        </div>
        <div className="mt-4">
          <RiskScale pd={result.pd} grade={result.grade} industry={result.borrower.industry} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-4">
          <span className="text-sm text-sand-500">
            Грейд <span className="font-semibold" style={{ color: tone }}>{result.grade}</span> —{' '}
            {result.gradeLabel.toLowerCase()}
          </span>
          <span className="text-xs text-sand-700">{result.gradeDescription}</span>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-medium text-sand-300">Готовые кейсы для демонстрации</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {COMPANY_PRESETS.map((preset) => {
            const active = preset.id === activePresetId
            return (
              <li key={preset.id}>
                <button
                  type="button"
                  onClick={() => onApplyPreset(preset)}
                  aria-pressed={active}
                  className={`group flex h-full w-full flex-col border px-4 py-3 text-left transition-colors ${
                    active
                      ? 'border-brass-400 bg-ink-700'
                      : 'border-line bg-ink-800 hover:border-line-strong hover:bg-ink-700'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-sand-100">{preset.title}</span>
                    <ArrowRight
                      aria-hidden="true"
                      className={`size-4 shrink-0 transition-transform ${
                        active ? 'text-brass-300' : 'text-sand-700 group-hover:translate-x-0.5 group-hover:text-brass-400'
                      }`}
                    />
                  </span>
                  <span className="mt-1 text-xs text-brass-400">{preset.tagline}</span>
                  <span className="mt-2 text-xs leading-relaxed text-sand-500">{preset.story}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </header>
  )
}