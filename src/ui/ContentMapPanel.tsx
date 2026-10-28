import { CONTENT_MAP, groupByKind } from './contentMap'

/**
 * Карта разделов: весь контент приложения на одной странице с якорными ссылками.
 * Для защиты диплома показывает структуру, для инвестора — работает как индекс.
 */
export function ContentMapPanel() {
  const groups = groupByKind(CONTENT_MAP)

  return (
    <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <div key={group.kind}>
          <h3 className="text-xs font-medium text-sand-500">{group.title}</h3>
          <ul className="mt-2.5 divide-y divide-line">
            {group.rows.map((row) => (
              <li key={row.id} className="py-2.5 first:pt-0">
                <a
                  href={`#${row.id}`}
                  className="block text-sm font-medium text-sand-100 transition-colors hover:text-brass-300"
                >
                  {row.label}
                </a>
                <p className="mt-0.5 max-w-[48ch] text-xs leading-relaxed text-sand-700">
                  {row.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}