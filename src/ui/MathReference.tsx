import { MODEL_CALIBRATION, INDUSTRIES, GRADE_LADDER, PD_HORIZON_YEARS } from '@/domain/model'
import { FACTOR_SPECS } from '@/domain/factors'
import { percent } from '@/format'
import { Panel } from './Panel'
import { Disclosure } from './Disclosure'

/** Раздел «Математическая справка» — открывается на защите прямо в интерфейсе. */
export function MathReference() {
  return (
    <Panel
      id="math"
      tone="var(--color-sand-700)"
      title="Математическая справка"
      description="Формулы, переменные и границы применимости модели. Числа в таблице читаются из тех же констант, что использует расчёт, поэтому документация и результат не могут разойтись."
    >
      <Disclosure
        question="Как считается вероятность дефолта"
        answer="Логистическая регрессия на шесть признаков. Каждый признак нормализован относительно безопасного уровня — опорной компании, поэтому модель видит отклонение заёмщика, а не абсолютные числа. Сигмоида отображает взвешенную сумму в вероятность."
        defaultOpen
      >
        <div className="overflow-x-auto">
          <p className="font-mono text-sm text-brass-300">
            Z = β₀ + Σ βᵢ·(Xᵢ − centerᵢ),&nbsp;&nbsp;PD = 1 / (1 + e<sup>−Z</sup>)
          </p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-sm">
            <caption className="sr-only">Коэффициенты логистической регрессии</caption>
            <thead>
              <tr className="border-b border-line text-left text-xs text-sand-700">
                <th scope="col" className="pb-2 font-normal">Признак X</th>
                <th scope="col" className="pb-2 font-normal">Преобразование</th>
                <th scope="col" className="pb-2 text-right font-normal">center</th>
                <th scope="col" className="pb-2 text-right font-normal">β</th>
                <th scope="col" className="pb-2 pl-4 font-normal">Что означает знак</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {FACTOR_SPECS.map((spec) => (
                <tr key={spec.key}>
                  <th scope="row" className="py-2 pr-3 text-left text-xs font-normal text-sand-200">
                    {spec.label}
                  </th>
                  <td className="py-2 pr-3 font-mono text-xs text-sand-500">
                    {TRANSFORM[spec.key]}
                  </td>
                  <td className="tnum py-2 text-right text-xs text-sand-300">
                    {CENTER_LABEL[spec.key]}
                  </td>
                  <td className="tnum py-2 text-right font-semibold" style={{ color: betaColor(spec.beta) }}>
                    {spec.beta > 0 ? '+' : '−'}
                    {Math.abs(spec.beta).toFixed(2)}
                  </td>
                  <td className="py-2 pl-4 text-xs leading-relaxed text-sand-500">{SIGN_MEANING[spec.key]}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line">
                <th scope="row" className="pt-2 text-left text-xs font-normal text-sand-300">
                  Свободный член β₀
                </th>
                <td className="pt-2 font-mono text-xs text-sand-500">константа</td>
                <td className="tnum pt-2 text-right text-xs text-sand-300">—</td>
                <td className="tnum pt-2 text-right font-semibold text-sand-200">
                  {MODEL_CALIBRATION.intercept.toFixed(2)}
                </td>
                <td className="pt-2 pl-4 text-xs leading-relaxed text-sand-500">
                  Опорная компания получает PD {percent(0.2059, 1)} — середина рынка займов МСП.
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Disclosure>

      <Disclosure
        question="Как читать вклад факторов"
        answer="Логит раскладывается на сумму вкладов: вклад = β · (X − center). Положительный вклад поднимает риск, отрицательный опускает. Так инвестор видит не итоговый балл, а конкретные причины, и понимает, какой показатель улучшить в первую очередь."
      >
        <p className="font-mono text-sm text-brass-300">
          вкладᵢ = βᵢ · (Xᵢ − centerᵢ),&nbsp;&nbsp;Z = β₀ + Σ вкладᵢ
        </p>
        <p className="mt-3 max-w-[72ch] text-sm leading-relaxed text-sand-300">
          Предельный эффект ∂PD/∂Xᵢ = βᵢ · PD · (1 − PD) показывает, на сколько процентных
          пунктов изменится вероятность дефолта при небольшом изменении признака. Он
          убывает с ростом PD — поэтому один и тот же дефект долга опаснее для проблемного
          заёмщика, чем для устойчивого.
        </p>
      </Disclosure>

      <Disclosure
        question="Почему ставка должна быть выше безрисковой"
        answer="Инвестор за один год получает r при выплате и теряет LGD при дефолте. Вероятностное ожидание показывает, сколько он реально заработает на единицу вложенного — и сравнивается с доходностью безрискового инструмента."
      >
        <p className="font-mono text-sm text-brass-300">
          E(R) = r·(1 − PD) − PD·LGD,&nbsp;&nbsp;r* = PD·LGD / (1 − PD)
        </p>
        <ul className="mt-3 max-w-[72ch] space-y-2 text-sm leading-relaxed text-sand-300">
          <li>
            <span className="text-sand-100">Ставка безубыточности r*</span> — ставка, при которой
            E(R) = 0. Ниже неё вложение теряет капитал в среднем.
          </li>
          <li>
            <span className="text-sand-100">Премия за риск</span> = E(R) − r<sub>f</sub>. Пока она
            положительна, ставка оплачивает риск.
          </li>
          <li>
            <span className="text-sand-100">Рекомендуемая ставка</span> = r<sub>f</sub> + PD · LGD ·{' '}
            {MODEL_CALIBRATION.riskAversion} — рыночная премия с коэффициентом риск-averse 2,2.
          </li>
          <li>
            Параметры по умолчанию: LGD {percent(MODEL_CALIBRATION.lgd, 0)}, безрисковая ставка r
            <sub>f</sub> {percent(MODEL_CALIBRATION.riskFreeRate, 0)}.
          </li>
        </ul>
      </Disclosure>

      <Disclosure
        question="Как устроен портфельный симулятор"
        answer="Число дефолтов в портфеле — сумма независимых бернуллиев с разными вероятностями, то есть пуассон-биномиальное распределение. Оно считается точно рекуррентной формулой за O(N²), поэтому при N до 50 результат мгновенный и воспроизводимый. Монте-Карло здесь дал бы шум без выигрыша."
      >
        <p className="font-mono text-sm text-brass-300">
          P<sub>k</sub> ← P<sub>k</sub>·(1 − pᵢ) + P<sub>k−1</sub>·pᵢ;&nbsp;&nbsp;P&amp;L<sub>k</sub> = ((N−k)(1+r) +
          k(1−LGD))/N − 1
        </p>
        <p className="mt-3 max-w-[72ch] text-sm leading-relaxed text-sand-300">
          VaR 95 % — квантиль доходности на 5 % слева, CVaR 95 % — средняя доходность в худших
          5 % сценариев. Оба показывают глубину хвостового риска, а не только его вероятность.
        </p>
      </Disclosure>

      <Disclosure
        question="Шкала грейдов и отраслевые эталоны"
        answer="Грейд присваивается по порогам PD за 12 месяцев. Эталон отрасли — средние безопасные значения, с которыми сравнивается заёмщик в блоке «Объяснимый скоринг» и на радар-чарте."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <caption className="sr-only">Шкала грейдов надёжности</caption>
            <thead>
              <tr className="border-b border-line text-left text-xs text-sand-700">
                <th scope="col" className="pb-2 font-normal">Грейд</th>
                <th scope="col" className="pb-2 text-right font-normal">PD, до</th>
                <th scope="col" className="pb-2 pl-4 font-normal">Смысл для инвестора</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {GRADE_LADDER.map((step) => (
                <tr key={step.code}>
                  <th scope="row" className="tnum py-1.5 text-left font-semibold text-sand-100">
                    {step.code}
                  </th>
                  <td className="tnum py-1.5 text-right text-xs text-sand-300">
                    {Number.isFinite(step.max) ? percent(step.max, 1) : '—'}
                  </td>
                  <td className="py-1.5 pl-4 text-xs leading-relaxed text-sand-500">{step.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[660px] border-collapse text-sm">
            <caption className="sr-only">Отраслевые эталоны</caption>
            <thead>
              <tr className="border-b border-line text-left text-xs text-sand-700">
                <th scope="col" className="pb-2 font-normal">Отрасль</th>
                <th scope="col" className="pb-2 text-right font-normal">Риск, 0…1</th>
                <th scope="col" className="pb-2 text-right font-normal">Выручка</th>
                <th scope="col" className="pb-2 text-right font-normal">Возраст</th>
                <th scope="col" className="pb-2 text-right font-normal">Долг/EBITDA</th>
                <th scope="col" className="pb-2 text-right font-normal">Маржа</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {INDUSTRIES.map((item) => (
                <tr key={item.id}>
                  <th scope="row" className="py-1.5 text-left text-xs font-normal text-sand-200">
                    {item.label}
                  </th>
                  <td className="tnum py-1.5 text-right text-xs text-sand-300">{item.risk}</td>
                  <td className="tnum py-1.5 text-right text-xs text-sand-500">{item.benchmark.revenue} млн ₽</td>
                  <td className="tnum py-1.5 text-right text-xs text-sand-500">{item.benchmark.ageMonths} мес.</td>
                  <td className="tnum py-1.5 text-right text-xs text-sand-500">{item.benchmark.debtToEbitda}</td>
                  <td className="tnum py-1.5 text-right text-xs text-sand-500">{item.benchmark.netMargin} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Disclosure>

      <Disclosure
        question="Границы применимости модели"
        answer="Честное описание ограничений. Коэффициенты заданы экономической калибровкой, а не обучением на исторической выборке: открытых размеченных данных по дефолтам российских МСП нет. Модель пригодна для сравнения сценариев между собой, но не для оценки абсолютного уровня дефолтов на рынке."
      >
        <ul className="max-w-[78ch] space-y-2 text-sm leading-relaxed text-sand-300">
          <li>
            1. <span className="text-sand-100">Линейная форма логита.</span> Каждый признак влияет
            на риск логарифмически; реальные зависимости нелинейны. Ввод ограничен сверху.
          </li>
          <li>
            2. <span className="text-sand-100">Независимость признаков.</span> Реальные компании
            кластеризуются по отрасли и макроэкономике: «20 IT-займов» — это ставка на один
            макрофактор, а не диверсификация.
          </li>
          <li>
            3. <span className="text-sand-100">Горизонт {PD_HORIZON_YEARS} год и постоянная LGD.</span>{' '}
            Для реальных стратегий нужны регрессия к среднему PD и плановое снижение ставки.
          </li>
          <li>
            4. <span className="text-sand-100">Один заёмщик — один сценарий.</span> Не моделируются
            реструктуризация, досрочный погашение и отказ от залога.
          </li>
        </ul>
      </Disclosure>
    </Panel>
  )
}

const TRANSFORM: Record<string, string> = {
  revenue: 'ln(выручка)',
  ageMonths: 'ln(1 + лет)',
  debtToEbitda: 'как есть',
  netMargin: 'как есть',
  industryRisk: 'как есть',
  hasCollateral: '0 / 1',
}

const CENTER_LABEL: Record<string, string> = {
  revenue: 'ln 50',
  ageMonths: 'ln 5',
  debtToEbitda: '3',
  netMargin: '10',
  industryRisk: '0,42',
  hasCollateral: '0',
}

const SIGN_MEANING: Record<string, string> = {
  revenue: 'Отрицательный: крупная выручка снижает риск',
  ageMonths: 'Отрицательный: кредитная история снижает риск',
  debtToEbitda: 'Положительный: каждый «turn» долга повышает риск',
  netMargin: 'Отрицательный: прибыль — это запас прочности',
  industryRisk: 'Положительный: цикличность отрасли повышает риск',
  hasCollateral: 'Отрицательный: обеспечение повышает шанс возврата',
}

function betaColor(beta: number): string {
  return beta > 0 ? 'var(--color-risk-8)' : 'var(--color-risk-1)'
}