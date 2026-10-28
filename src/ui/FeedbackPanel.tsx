import { ClipboardPaste, Mail, Send } from 'lucide-react'
import { useState } from 'react'
import type { AssessmentResult } from '@/domain/types'
import { BRAND_EMAIL } from './Logo'
import { PLANS, planById } from './plans'
import type { PlanId } from './plans'
import { Button } from './Button'
import { Panel } from './Panel'
import { percent } from '@/format'

interface FeedbackPanelProps {
  plan: PlanId
  result: AssessmentResult
}

const TOPICS = [
  'Скоринг и вердикт',
  'Портфельный симулятор',
  'Графики и интерфейс',
  'Подписка',
  'Ошибка в расчёте',
  'Другое',
] as const

type Topic = (typeof TOPICS)[number]

const USAGE_OPTIONS: Array<{ value: PlanId; label: string }> = [
  { value: 'free', label: 'Пользуюсь бесплатно' },
  { value: 'investor', label: 'Есть подписка Инвестор' },
  { value: 'platform', label: 'Есть подписка Платформа' },
]

/**
 * Обратная связь бесплатна. Ответ адресуется автору письмом: приложение ничего
 * не отправляет самостоятельно и не хранит отзыв в базе. Если пользователь отвечает,
 * что пользуется бесплатно, рядом появляется предложение того тарифа, который
 * закрывает его же запрос.
 */
export function FeedbackPanel({ plan, result }: FeedbackPanelProps) {
  const [topic, setTopic] = useState<Topic>('Скоринг и вердикт')
  const [usage, setUsage] = useState<PlanId>(plan)
  const [email, setEmail] = useState('')
  const [words, setWords] = useState('')
  const [sent, setSent] = useState(false)

  const summary = composeSummary(topic, usage, email, words, result)
  const mailtoHref = `mailto:${BRAND_EMAIL}?subject=${encodeURIComponent(
    `ЗаёмСкан — ${topic}`,
  )}&body=${encodeURIComponent(summary)}`

  const offerPlan = PLANS.find((item) => item.id === 'investor')!
  const showOffer = sent && usage === 'free'

  return (
    <Panel
      id="feedback"
      tone="var(--color-sand-500)"
      title="Обратная связь"
      description="Отзыв уходит на почту автору — прямо из вашего письма, без формы подписки и без аккаунта. Разабор вопроса бесплатный, даже если подписки нет."
    >
      {sent ? (
        <SentView
          summary={summary}
          mailtoHref={mailtoHref}
          showOffer={showOffer}
          offerPlan={offerPlan}
          onBack={() => setSent(false)}
        />
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            setSent(true)
          }}
          className="grid gap-x-8 gap-y-5 lg:grid-cols-2"
        >
          <div>
            <label htmlFor="qa-topic" className="block text-sm font-medium text-sand-100">
              О чём отзыв
            </label>
            <select
              id="qa-topic"
              name="topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value as Topic)}
              className="mt-2 w-full border border-line bg-ink-700 px-3 py-2 text-sm transition-colors hover:border-line-strong focus:border-brass-400 focus:outline-none"
            >
              {TOPICS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <label htmlFor="qa-usage" className="mt-4 block text-sm font-medium text-sand-100">
              Как вы пользуетесь сервисом
            </label>
            <select
              id="qa-usage"
              name="usage"
              value={usage}
              onChange={(event) => setUsage(event.target.value as PlanId)}
              className="mt-2 w-full border border-line bg-ink-700 px-3 py-2 text-sm transition-colors hover:border-line-strong focus:border-brass-400 focus:outline-none"
            >
              {USAGE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <label htmlFor="qa-email" className="mt-4 block text-sm font-medium text-sand-100">
              Почта для ответа <span className="text-sand-700">(не обязательно)</span>
            </label>
            <input
              id="qa-email"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              inputMode="email"
              value={email}
              placeholder="имя@example…"
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full border border-line bg-ink-700 px-3 py-2 text-sm text-sand-100 transition-colors hover:border-line-strong focus:border-brass-400 focus:outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="qa-text" className="block text-sm font-medium text-sand-100">
              Что не хватило или что сработало
            </label>
            <textarea
              id="qa-text"
              name="message"
              rows={7}
              required
              value={words}
              onChange={(event) => setWords(event.target.value)}
              placeholder="Например: смотрю логистическую компанию, а ползунок долга не доходит до моих 9× EBITDA…"
              className="mt-2 w-full flex-1 resize-y border border-line bg-ink-700 px-3 py-2 text-sm leading-relaxed text-sand-100 transition-colors hover:border-line-strong focus:border-brass-400 focus:outline-none"
            />
            <p className="mt-2 text-xs text-sand-700">
              Ничего не хранится: вы собираете письмо сами и видите его перед отправкой.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4 sm:col-span-2">
            <Button variant="primary" type="submit" size="md">
              <Send aria-hidden="true" className="size-4" />
              Собрать письмо
            </Button>
            <a
              href={mailtoHref}
              className="inline-flex items-center gap-1.5 text-xs text-sand-500 underline-offset-2 transition-colors hover:text-brass-300 hover:underline"
            >
              <Mail aria-hidden="true" className="size-3.5" />
              Написать напрямую на {BRAND_EMAIL}
            </a>
          </div>
        </form>
      )}
    </Panel>
  )
}

interface SentViewProps {
  summary: string
  mailtoHref: string
  showOffer: boolean
  offerPlan: (typeof PLANS)[number]
  onBack: () => void
}

function SentView({ summary, mailtoHref, showOffer, offerPlan, onBack }: SentViewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
      <div className="min-w-0">
        <p className="text-sm leading-relaxed text-sand-200">
          Письмо собрано и проверено. Скопируйте его или откройте почтовый клиент — реквизиты
          не запрашиваются, данные не хранятся.
        </p>
        <blockquote className="tnum mt-3 whitespace-pre-wrap border-l-2 border-line pl-3 text-xs leading-relaxed text-sand-500">
          {summary}
        </blockquote>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void navigator.clipboard?.writeText(summary)
            }}
          >
            <ClipboardPaste aria-hidden="true" className="size-3.5" />
            Скопировать текст
          </Button>
          <a
            href={mailtoHref}
            className="text-xs text-sand-500 underline-offset-2 transition-colors hover:text-brass-300 hover:underline"
          >
            Открыть почтовый клиент
          </a>
          <Button variant="ghost" size="sm" onClick={onBack}>
            Написать ещё
          </Button>
        </div>
      </div>

      {showOffer ? (
        <aside
          className="border px-4 py-4"
          style={{ borderColor: `${offerPlan.tone}55`, background: 'var(--color-ink-700)' }}
        >
          <h3 className="text-sm font-semibold" style={{ color: offerPlan.tone }}>
            Судя по отзыву, подойдёт «{offerPlan.title}»
          </h3>
          <p className="mt-1.5 max-w-[52ch] text-xs leading-relaxed text-sand-500">
            Самые частые запросы в отзывах — про больший портфель и глубину хвостового риска.
            Тариф «{offerPlan.title}» за {offerPlan.price} {offerPlan.period} открывает до 50
            займов, VaR/CVaR и отчёт по заёмщику.
          </p>
          <a
            href="#plans"
            className="mt-3 inline-flex text-xs font-medium underline-offset-2 transition-colors hover:underline"
            style={{ color: offerPlan.tone }}
          >
            Сравнить тарифы →
          </a>
        </aside>
      ) : null}
    </div>
  )
}

function composeSummary(
  topic: string,
  usage: PlanId,
  email: string,
  words: string,
  result: AssessmentResult,
): string {
  return [
    `ЗаёмСкан · отзыв · ${topic}`,
    `Доступ: ${planById(usage).title}`,
    `Заёмщик в расчёте: ${result.borrower.name} (${result.borrower.industry}), PD ${percent(result.pd, 2)}, грейд ${result.grade}.`,
    email ? `Почта: ${email}` : 'Почта: не указана',
    '',
    words.trim() || '(текст отзыва пуст)',
  ].join('\n')
}