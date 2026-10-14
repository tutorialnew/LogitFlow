import { useEffect, useState } from 'react'
import type { AssessmentResult } from '@/domain/types'
import { TONE_COLOR, percent } from '@/format'

const SECTIONS = [
  { id: 'borrower', label: 'Параметры заёмщика' },
  { id: 'terms', label: 'Условия сделки' },
  { id: 'scoring', label: 'Объяснимый скоринг' },
  { id: 'profile', label: 'Профиль и доходность' },
  { id: 'portfolio', label: 'Портфельный симулятор' },
  { id: 'math', label: 'Математическая справка' },
] as const

interface AppShellProps {
  result: AssessmentResult
  children: React.ReactNode
}

/**
 * Каркас страницы: липкая навигация с подсветкой активного раздела и индикатором риска.
 * Наблюдение за скроллом — единственный источник активного пункта, без IntersectionObserver
 * на каждый блок.
 */
export function AppShell({ result, children }: AppShellProps) {
  const [active, setActive] = useState<string>(SECTIONS[0].id)

  useEffect(() => {
    const targets = SECTIONS.map((section) => document.getElementById(section.id)).filter(
      (element): element is HTMLElement => element !== null,
    )

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: 0 },
    )

    for (const target of targets) observer.observe(target)
    return () => observer.disconnect()
  }, [])

  const tone = TONE_COLOR[result.gradeTone]

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-brass-400 focus:bg-ink-800 focus:px-4 focus:py-2 focus:text-sm focus:text-brass-300"
      >
        Перейти к содержимому
      </a>

      <header className="sticky top-0 z-40 border-b border-line bg-ink-900/92 backdrop-blur"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sand-100">
              Оценка привлекательности бизнеса
            </p>
            <p className="truncate text-xs text-sand-500">
              Краудлендинг и краудинвестинг · логистическая регрессия PD
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <div className="text-right">
              <div className="tnum text-xs text-sand-500">PD за 12 мес.</div>
              <div className="tnum text-sm font-semibold" style={{ color: tone }}>
                {percent(result.pd, 2)}
              </div>
            </div>
            <div
              className="tnum border px-2.5 py-1 text-sm font-bold"
              style={{ color: tone, borderColor: `${tone}66` }}
            >
              {result.grade}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px] gap-8 px-4 py-8 sm:px-6 lg:py-12">
        <nav aria-label="Разделы дашборда" className="hidden w-52 shrink-0 lg:block">
          <ul className="sticky top-24 space-y-0.5">
            {SECTIONS.map((section) => {
              const isActive = active === section.id
              return (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    aria-current={isActive ? 'true' : undefined}
                    className={`block border-l-2 py-1.5 pl-3 text-sm transition-colors ${
                      isActive
                        ? 'border-brass-400 font-medium text-sand-100'
                        : 'border-line text-sand-500 hover:border-line-strong hover:text-sand-300'
                    }`}
                  >
                    {section.label}
                  </a>
                </li>
              )
            })}
          </ul>
          <p className="sticky top-[22rem] mt-6 max-w-[30ch] text-xs leading-relaxed text-sand-700">
            Расчёты выполняются локально в браузере. Данные никуда не отправляются.
          </p>
        </nav>

        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>

      <footer
        className="border-t border-line px-4 py-8 sm:px-6"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto max-w-[1440px] text-xs leading-relaxed text-sand-700">
          <p className="max-w-[80ch]">
            Учебный инструмент для оценки инвестиционной привлекательности малого бизнеса.
            Коэффициенты модели заданы экономической калибровкой и не являются инвестиционной
            рекомендацией. Решения о вложениях принимает инвестор, оценивая свои риски и
            финансовое состояние.
          </p>
        </div>
      </footer>
    </div>
  )
}