import type { ReactNode } from 'react'

interface PanelProps {
  id?: string
  /** Оттенок цветового рельса слева. Кодирует риск блока, а не декорирует. */
  tone?: string | null
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

/**
 * Панель-«лист реестра»: волосяная рамка, цветной рельс слева, сплющенные углы.
 * Один визуальный язык для всех блоков — вместо набора одинаковых скруглённых карточек.
 */
export function Panel({ id, tone, title, description, actions, children }: PanelProps) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className="relative scroll-mt-24 border border-line bg-ink-800"
      style={{ borderLeftWidth: 3, borderLeftColor: tone ?? 'var(--color-line)' }}
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 id={id ? `${id}-title` : undefined} className="text-lg font-semibold text-sand-100">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-[70ch] text-sm leading-relaxed text-sand-500">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  )
}