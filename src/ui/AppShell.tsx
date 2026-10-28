import { useEffect, useState } from 'react'
import type { AssessmentResult } from '@/domain/types'
import { TONE_COLOR, percent } from '@/format'
import { BRAND_DOMAINS, Logo } from './Logo'
import { CONTENT_MAP } from './contentMap'
import { planById } from './plans'
import type { PlanId } from './plans'

/** Навигация строится из карты контента: единый источник для индекса и сайдбара. */
const NAV_SECTIONS = CONTENT_MAP.filter((entry) => entry.inNav)

interface AppShellProps {
  result: AssessmentResult
  plan: PlanId
  children: React.ReactNode
}

/**
 * Каркас страницы: липкая навигация с подсветкой активного раздела и индикатором риска.
 * Наблюдение за скроллом — единственный источник активного пункта, без IntersectionObserver
 * на каждый блок.
 */
export function AppShell({ result, plan, children }: AppShellProps) {
  const [active, setActive] = useState<string>(NAV_SECTIONS[0]!.id)

  useEffect(() => {
    const targets = NAV_SECTIONS.map((section) => document.getElementById(section.id)).filter(
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
  const planTitle = planById(plan).title

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-brass-400 focus:bg-ink-800 focus:px-4 focus:py-2 focus:text-sm focus:text-brass-300"
      >
        Перейти к содержимому
      </a>

      <header
        className="sticky top-0 z-40 border-b border-line bg-ink-900/92 backdrop-blur"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-3 sm:px-6">
          <a href="#hero" className="shrink-0" aria-label={`${'ЗаёмСкан'} — к началу страницы`}>
            <Logo withName />
          </a>
          <div className="hidden min-w-0 flex-1 lg:block">
            <p className="truncate text-xs text-sand-500">
              Оценка инвестиционной привлекательности малого бизнеса · краудлендинг и
              краудинвестинг
            </p>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-4">
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
            <a
              href="#plans"
              title="Действующий тариф — сравнить уровни доступа"
              className="hidden border border-line px-2.5 py-1 text-xs text-sand-300 transition-colors hover:border-brass-400 hover:text-brass-300 sm:block"
            >
              тариф «{planTitle}»
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px] gap-8 px-4 py-8 sm:px-6 lg:py-12">
        <nav aria-label="Разделы дашборда" className="hidden w-52 shrink-0 lg:block">
          <ul className="sticky top-24 space-y-0.5">
            {NAV_SECTIONS.map((section) => {
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Logo withName />
            <span className="tnum">{BRAND_DOMAINS.join(' · ')}</span>
          </div>
          <p className="mt-4 max-w-[80ch]">
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
