import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brass-400 text-ink-950 border-brass-400 font-semibold hover:bg-brass-300 hover:border-brass-300',
  secondary:
    'bg-ink-700 text-sand-100 border-line hover:border-line-strong hover:bg-ink-600',
  ghost:
    'bg-transparent text-sand-300 border-transparent hover:bg-ink-700 hover:text-sand-100',
  danger:
    'bg-transparent text-risk-8 border-risk-8/40 hover:border-risk-8 hover:bg-risk-8/10',
}

const SIZES = {
  sm: 'px-2.5 py-1.5 text-xs gap-1.5',
  md: 'px-3 py-2 text-sm gap-2',
  lg: 'px-4 py-2.5 text-sm gap-2',
} as const

/**
 * Единая кнопка интерфейса: три размера, четыре варианта, явные состояния
 * наведения и фокуса. Никаких «сырых» кнопок с локальными классами.
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  style,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      {...rest}
      style={style}
      className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap border transition-[background-color,border-color,color,text-decoration-color] duration-150 ease-out focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-400 disabled:cursor-not-allowed disabled:opacity-55 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {children}
    </button>
  )
}