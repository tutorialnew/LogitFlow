import type { ReactNode } from 'react'

interface ToggleProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  tone?: string
}

/** Переключатель: подпись и контрол — один элемент попадания. */
export function Toggle({ label, description, checked, onChange, tone }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 border border-line bg-ink-700/60 px-3 py-3 transition-colors hover:border-line-strong has-[:focus-visible]:border-brass-400">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-[var(--color-brass-400)]"
      />
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-sm font-medium text-sand-100">
          {label}
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full"
            style={{ background: checked ? (tone ?? 'var(--color-brass-400)') : 'var(--color-sand-700)' }}
          />
        </span>
        <span className="mt-1 block max-w-[52ch] text-xs leading-relaxed text-sand-700">{description}</span>
      </span>
    </label>
  )
}

interface SegmentedProps<T extends string> {
  label: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
  name: string
}

/** Переключатель вкладок на настоящих кнопках: доступен с клавиатуры. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  name,
}: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex border border-line bg-ink-700">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            name={name}
            onClick={() => onChange(option.value)}
            className={`px-3 py-1.5 text-sm transition-colors ${
              selected
                ? 'bg-brass-400 font-semibold text-ink-950'
                : 'text-sand-300 hover:bg-ink-600 hover:text-sand-100'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

interface StatProps {
  label: string
  value: string
  hint?: string
  tone?: string
  children?: ReactNode
}

/** Показатель в колонке: подпись сверху, значение, расшифровка снизу. */
export function Stat({ label, value, hint, tone, children }: StatProps) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-sand-500">{label}</div>
      <div className="tnum mt-1 text-2xl font-semibold leading-tight" style={{ color: tone }}>
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs leading-relaxed text-sand-700">{hint}</div> : null}
      {children}
    </div>
  )
}