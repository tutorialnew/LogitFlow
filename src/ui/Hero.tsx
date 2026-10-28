import { ArrowRight, FileBarChart, Play } from 'lucide-react'
import { COMPANY_PRESETS } from '@/domain/presets'
import type { CompanyPreset } from '@/domain/presets'
import type { AssessmentResult } from '@/domain/types'
import { TONE_COLOR, percent } from '@/format'
import { heroBand } from './backgrounds'
import { Button } from './Button'
import { RiskScale } from './RiskScale'
import type { PlanId } from './plans'
import { planLimits } from './plans'

interface HeroProps {
  result: AssessmentResult
  activePresetId: string | null
  plan: PlanId
  onApplyPreset: (preset: CompanyPreset) => void
}

export function Hero({ result, activePresetId, plan, onApplyPreset }: HeroProps) {
  const tone = TONE_COLOR[result.gradeTone]
  const limits = planLimits(plan)

  return (
    <header
      id="hero"
      className="relative -mx-4 scroll-mt-20 border-b border-line px-4 pb-8 pt-2 sm:-mx-6 sm:px-6"
    >
      {/* Фон баннера: дуги риска и тёплый свет. Атмосфера вместо стоковой фотографии. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[440px]"
        style={{ backgroundImage: heroBand, backgroundSize: 'cover', backgroundPosition: 'bottom center' }}
      />

      <div className="relative">
        <div className="mt-8 max-w-[68ch]">
          <h1 className="text-3xl font-semibold leading-[1.15] text-sand-100 sm:text-[2.6rem]">
            Стоит ли инвестору вкладываться в этот заём
          </h1>
          <p className="mt-4 max-w-[64ch] text-base leading-relaxed text-sand-300">
            Задайте параметры компании — модель логистической регрессии посчитает вероятность
            дефолта за 12 месяцев, объяснит, какие именно факторы её двигают, и покажет,
            перекрывает ли предложенная ставка риск и потери при дефолте. Всё считается
            в браузере: ни сервера, ни передачи данных.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => document.getElementById('borrower')?.scrollIntoView()}
          >
            <Play aria-hidden="true" className="size-4" />
            Оценить компанию
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => document.getElementById('math')?.scrollIntoView()}
          >
            <FileBarChart aria-hidden="true" className="size-4" />
            Смотреть формулы модели
          </Button>
          <a
            href="#scoring"
            className="group inline-flex items-center gap-1.5 text-sm text-sand-300 transition-colors hover:text-brass-300"
          >
            К объяснимому скорингу
            <ArrowRight
              aria-hidden="true"
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
            />
          </a>
        </div>

        <div className="mt-10 border border-line bg-ink-800/85 px-5 py-5 backdrop-blur-sm sm:px-6">
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
            <span className="tnum ml-auto text-xs text-sand-700">
              PD за 12 мес. · {percent(result.pd, 2)}
              <br />
              тариф: до {limits.maxLoans} займов в портфеле
            </span>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-sm font-medium text-sand-300">Готовые кейсы для демонстрации</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {COMPANY_PRESETS.map((preset) => {
              const active = preset.id === activePresetId
              return (
                <li key={preset.id}>
                  {/* Карточка-пресет: это не «кнопка-действие», а выбранный кейс,
                      поэтому у неё собственная колонка-раскладка без hacks. */}
                  <button
                    type="button"
                    onClick={() => onApplyPreset(preset)}
                    aria-pressed={active}
                    className={`group flex h-full w-full flex-col items-start border px-4 py-3 text-left transition-colors ${
                      active
                        ? 'border-brass-400 bg-ink-700'
                        : 'border-line bg-ink-800/70 hover:border-line-strong hover:bg-ink-700'
                    }`}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-sand-100">{preset.title}</span>
                      <ArrowRight
                        aria-hidden="true"
                        className={`size-4 shrink-0 transition-transform ${
                          active
                            ? 'text-brass-300'
                            : 'text-sand-700 group-hover:translate-x-0.5 group-hover:text-brass-400'
                        }`}
                      />
                    </span>
                    <span className="text-xs text-brass-400">{preset.tagline}</span>
                    <span className="text-xs leading-relaxed text-sand-500">{preset.story}</span>
                    <span aria-hidden="true" className="mt-auto h-px w-full bg-line" />
                    <span className="tnum mt-2.5 text-[10px] text-sand-700">
                      ставка {percent(preset.rate, 1)} в год
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </header>
  )
}
