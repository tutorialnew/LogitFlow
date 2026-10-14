import { useId } from 'react'

interface SliderFieldProps {
  label: string
  /** Подсказка простым языком — что фактор значит и почему важен. */
  hint: string
  value: number
  min: number
  max: number
  step: number
  /** Готовое человеческое представление значения. */
  display: string
  /** Подпись безопасного уровня для отсчёта. */
  benchmark?: string
  tone?: string
  onChange: (value: number) => void
  name: string
}

/**
 * Ползунок с числовым полем и подсказкой. Диапазон, шаг и отображаемое значение
 * приходят снаружи — компонент ничего не знает про модель.
 */
export function SliderField({
  label,
  hint,
  value,
  min,
  max,
  step,
  display,
  benchmark,
  tone,
  onChange,
  name,
}: SliderFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const inputId = `${id}-input`
  const filled = max === min ? 0 : ((value - min) / (max - min)) * 100

  return (
    <div className="py-4 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <label htmlFor={inputId} className="text-sm font-medium text-sand-100">
          {label}
        </label>
        <span className="tnum text-sm font-semibold text-sand-100">{display}</span>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <input
          id={inputId}
          type="range"
          name={name}
          min={min}
          max={max}
          step={step}
          value={value}
          aria-describedby={hintId}
          onChange={(event) => onChange(Number(event.target.value))}
          style={{
            background: `linear-gradient(to right, ${tone ?? 'var(--color-brass-400)'} ${filled}%, transparent ${filled}%)`,
            backgroundSize: '100% 2px',
            backgroundPosition: '0 center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <input
          type="number"
          name={`${name}-number`}
          aria-label={`${label}: числовое значение`}
          min={min}
          max={max}
          step={step}
          value={value}
          inputMode="decimal"
          autoComplete="off"
          onChange={(event) => {
            const next = Number(event.target.value)
            if (Number.isFinite(next)) onChange(next)
          }}
          className="tnum w-20 shrink-0 border border-line bg-ink-700 px-2 py-1 text-right text-sm text-sand-100 transition-colors hover:border-line-strong focus:border-brass-400 focus:outline-none"
        />
      </div>

      <p id={hintId} className="mt-2 max-w-[62ch] text-xs leading-relaxed text-sand-700">
        {hint}
        {benchmark ? <span className="text-sand-500"> Безопасный уровень: {benchmark}.</span> : null}
      </p>
    </div>
  )
}