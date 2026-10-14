/**
 * Заглушка для лениво загружаемых блоков.
 *
 * Резервирует высоту, чтобы контент появлялся на своём месте и страница не прыгала.
 * Полоса вместо спиннера: спиннер мигает при каждой навигации и ничего не объясняет.
 */
export function BlockFallback({ minHeight = 320, label = 'Загружается блок расчётов' }: { minHeight?: number; label?: string }) {
  return (
    <div className="border border-line bg-ink-800 px-5 py-6 sm:px-6" style={{ minHeight }}>
      <div className="h-3 w-1/4 bg-ink-600" />
      <div className="mt-4 h-56 w-full bg-ink-700" />
      <p className="sr-only" role="status">
        {label}…
      </p>
    </div>
  )
}