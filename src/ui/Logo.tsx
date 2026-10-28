interface LogoProps {
  /** Размер квадрата-знака в пикселях. */
  size?: number
  /** Показывать ли название рядом со знаком. */
  withName?: boolean
  className?: string
}

/**
 * Знак: сигмоида — тонкая плавная дуга логистической функции, вылетающая вверх
 * стрелкой. Это буквально модель, на которой стоит продукт: S-кривая вероятности
 * дефолта, и она означает «решение найдено и направлено вверх».
 */
export function Logo({ size = 30, withName = false, className = '' }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
        <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="7" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" />

        {/* Тихие оси прибора */}
        <line x1="7" y1="26" x2="26" y2="26" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1" />
        <line x1="7" y1="26" x2="7" y2="7" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1" />

        {/* Сигмоида: медленный старт, подъём, плато */}
        <path
          d="M6.5 23 C 13 23, 13.5 11, 20 11 C 22.6 11, 24.5 10.2, 24.5 8"
          fill="none"
          stroke="#ddb44a"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Стрелка вверх: конец кривой */}
        <path d="M24.5 4.2 L22 8.4 L27 8.4 Z" fill="#ddb44a" />
      </svg>

      {withName ? (
        <span className="text-[15px] font-bold tracking-tight text-sand-100">LogitFlow</span>
      ) : null}
    </span>
  )
}

export const BRAND_NAME = 'LogitFlow'
export const BRAND_DOMAINS = ['logitflow.ru', 'logitflow.app', 'logitflow.io']
export const BRAND_EMAIL = 'hello@logitflow.ru'
