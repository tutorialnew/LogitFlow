import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface DisclosureProps {
  question: string
  answer: string
  /** Формулы/таблицы внутри ответа. */
  children?: React.ReactNode
  defaultOpen?: boolean
}

/** Аккордеон раздела «Математическая справка». Нативные кнопка + region. */
export function Disclosure({ question, answer, children, defaultOpen = false }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  const regionId = `${id}-region`

  return (
    <div className="border-b border-line last:border-b-0">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={regionId}
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:text-brass-300"
        >
          <span className="text-sm font-medium text-sand-100">{question}</span>
          <ChevronDown
            aria-hidden="true"
            className={`size-4 shrink-0 text-sand-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </h3>
      <div id={regionId} hidden={!open} className="pb-5">
        <p className="max-w-[78ch] text-sm leading-relaxed text-sand-300">{answer}</p>
        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </div>
  )
}