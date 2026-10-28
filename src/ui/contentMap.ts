/** Карта контента: единый источник и для навигации, и для раздела «Карта разделов». */

export interface ContentEntry {
  id: string
  label: string
  /** Одно предложение — что пользователь здесь делает. */
  description: string
  /** Группа: работать с расчётом, оформить доступ, изучить модель. */
  kind: 'expert' | 'pay' | 'docs'
  /** Показывать в навигации слева. */
  inNav: boolean
}

export const CONTENT_MAP: ContentEntry[] = [
  {
    id: 'hero',
    label: 'Герой',
    kind: 'expert',
    description: 'Знакомство с сервисом и шкала надёжности с готовыми кейсами.',
    inNav: false,
  },
  {
    id: 'borrower',
    label: 'Параметры заёмщика',
    kind: 'expert',
    description: 'Пять ползунков, отрасль и залог — всё, что модель считает о компании.',
    inNav: true,
  },
  {
    id: 'terms',
    label: 'Условия сделки',
    kind: 'expert',
    description: 'Ставка, потери при дефолте и безрисковая альтернатива.',
    inNav: true,
  },
  {
    id: 'scoring',
    label: 'Объяснимый скоринг',
    kind: 'expert',
    description: 'Вклад каждого фактора в вероятность дефолта со сравнением по отрасли.',
    inNav: true,
  },
  {
    id: 'profile',
    label: 'Профиль и доходность',
    kind: 'expert',
    description: 'Радар-чарт по шести осям и расчёт реальной ожидаемой доходности.',
    inNav: true,
  },
  {
    id: 'portfolio',
    label: 'Портфельный симулятор',
    kind: 'expert',
    description: 'Точное распределение убытков по 1…50 займам и эффект диверсификации.',
    inNav: true,
  },
  {
    id: 'plans',
    label: 'Подписка',
    kind: 'pay',
    description: 'Три уровня доступа: бесплатный, Инвестор, Платформа.',
    inNav: true,
  },
  {
    id: 'feedback',
    label: 'Обратная связь',
    kind: 'expert',
    description: 'Продуктивный ответ на вопрос — что скрывает модель, как ваш сценарий.',
    inNav: true,
  },
  {
    id: 'map',
    label: 'Карта разделов',
    kind: 'docs',
    description: 'Индекс всех блоков страницы: что где находится и зачем нужен.',
    inNav: false,
  },
  {
    id: 'math',
    label: 'Математическая справка',
    kind: 'docs',
    description: 'Формулы, коэффициенты, шкала грейдов, границы применимости.',
    inNav: true,
  },
]

const KIND_LABEL: Record<ContentEntry['kind'], string> = {
  expert: 'Экспертные блоки · работать с расчётом',
  pay: 'Доступ и подписка',
  docs: 'Документация · модель и формулы',
}

export function groupByKind(entries: ContentEntry[]): Array<{ kind: ContentEntry['kind']; title: string; rows: ContentEntry[] }> {
  const order: ContentEntry['kind'][] = ['expert', 'docs', 'pay']
  return order.flatMap((kind) => {
    const rows = entries.filter((entry) => entry.kind === kind)
    return rows.length === 0 ? [] : [{ kind, title: KIND_LABEL[kind], rows }]
  })
}