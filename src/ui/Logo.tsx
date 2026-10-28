interface LogoProps {
  /** Размер квадрата-знака в пикселях. */
  size?: number
  /** Показывать ли название рядом со знаком. */
  withName?: boolean
  className?: string
}

/**
 * Знак: фрагмент шкалы риска. Не абстрактная «искра» — то же изображение, что и
 * в герое приложения: заёмщик находится в точке на ленте от изумрудного до багрового.
 * В 16 пикселях читается как крошечный индикатор, в 30 — как знак.
 */
export function Logo({ size = 30, withName = false, className = '' }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
        <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="7" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" />

        {/* Лента риска: изумруд → янтарь → багр */}
        <rect x="6" y="17" width="7" height="4" rx="1" fill="#34d399" />
        <rect x="13.4" y="17" width="7" height="4" rx="1" fill="#f59e0b" />
        <rect x="20.8" y="17" width="5.2" height="4" rx="1" fill="#be123c" />

        {/* Маркер оценки: латунная засечка над лентой */}
        <rect x="16.4" y="7" width="1.2" height="6" rx="0.6" fill="#ddb44a" />
        <path d="M17 15.6 L14.8 13.2 H19.2 Z" fill="#ddb44a" />
      </svg>

      {withName ? (
        <span className="flex flex-col leading-tight">
          <span className="text-[15px] font-bold tracking-tight text-sand-100">ЗаёмСкан</span>
          <span className="text-[10px] leading-tight text-sand-700">проверка заёмщика</span>
        </span>
      ) : null}
    </span>
  )
}

export const BRAND_NAME = 'ЗаёмСкан'
export const BRAND_TAGLINE = 'Проверка заёмщика за 60 секунд'
export const BRAND_DOMAINS = ['zaemscan.ru', 'zaem-scan.ru', 'zaemscan.app']
export const BRAND_EMAIL = 'hello@zaemscan.ru'