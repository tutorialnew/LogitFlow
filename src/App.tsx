import { useCallback, useMemo, useState, Suspense } from 'react'
import { calculateAssessment } from '@/domain/calculateAssessment'
import { MODEL_CALIBRATION } from '@/domain/model'
import { COMPANY_PRESETS, DEFAULT_BORROWER } from '@/domain/presets'
import type { BorrowerProfile, DealTerms } from '@/domain/types'
import { AppShell } from '@/ui/AppShell'
import { Hero } from '@/ui/Hero'
import { Panel } from '@/ui/Panel'
import { BorrowerPanel } from '@/ui/BorrowerPanel'
import { TermsPanel } from '@/ui/TermsPanel'
import { VerdictPanel } from '@/ui/VerdictPanel'
import { BlockFallback } from '@/ui/BlockFallback'
import { PlansPanel } from '@/ui/PlansPanel'
import { FeedbackPanel } from '@/ui/FeedbackPanel'
import { ContentMapPanel } from '@/ui/ContentMapPanel'
import { planLimits, readPlan, writePlan } from '@/ui/plans'
import type { PlanId } from '@/ui/plans'
import type { PortfolioState } from '@/ui/PortfolioPanel'
import {
  ContributionsPanel,
  MathReference,
  PortfolioPanel,
  RiskProfilePanel,
} from '@/ui/LazyBlocks'

const INITIAL_TERMS: DealTerms = {
  rate: COMPANY_PRESETS[0]!.rate,
  lgd: MODEL_CALIBRATION.lgd,
  riskFreeRate: MODEL_CALIBRATION.riskFreeRate,
}

const INITIAL_PORTFOLIO: PortfolioState = {
  loans: 20,
  amountPerLoan: 1,
  mode: 'generated',
  entries: [],
  seed: 20260114,
}

export default function App() {
  const [borrower, setBorrower] = useState<BorrowerProfile>(DEFAULT_BORROWER)
  const [terms, setTerms] = useState<DealTerms>(INITIAL_TERMS)
  const [portfolio, setPortfolio] = useState<PortfolioState>(INITIAL_PORTFOLIO)
  const [presetId, setPresetId] = useState<string | null>(COMPANY_PRESETS[0]!.id)

  /** Подписка — единственное продуктовое состояние, живущее между сессиями. */
  const [plan, setPlan] = useState<PlanId>(() => readPlan())

  const patchBorrower = useCallback((patch: Partial<BorrowerProfile>) => {
    setBorrower((prev) => ({ ...prev, ...patch }))
  }, [])

  const patchTerms = useCallback((patch: Partial<DealTerms>) => {
    setTerms((prev) => ({ ...prev, ...patch }))
  }, [])

  const patchPortfolio = useCallback((patch: Partial<PortfolioState>) => {
    setPortfolio((prev) => ({ ...prev, ...patch }))
  }, [])

  /** Смена тарифа сразу сжимает портфель до нового лимита — без фантомных займов. */
  const applyPlan = useCallback((next: PlanId) => {
    writePlan(next)
    const limits = planLimits(next)
    setPortfolio((prev) => ({ ...prev, loans: Math.min(prev.loans, limits.maxLoans) }))
    setPlan(next)
  }, [])

  /**
   * Единственная точка расчёта во всём приложении. Графики и таблицы получают
   * производные значения, а не пересчитывают модель сами.
   */
  const result = useMemo(
    () => calculateAssessment({ borrower, terms, portfolio }),
    [borrower, terms, portfolio],
  )

  const applyPreset = useCallback((preset: (typeof COMPANY_PRESETS)[number]) => {
    setBorrower(preset.borrower)
    setTerms((prev) => ({ ...prev, rate: preset.rate }))
    setPresetId(preset.id)
  }, [])

  /** Ручное изменение параметров снимает метку активного пресета. */
  const onManualChange = useCallback((patch: Partial<BorrowerProfile>) => {
    setPresetId(null)
    patchBorrower(patch)
  }, [patchBorrower])

  /** Добавление текущей компании подчиняется лимиту тарифа. */
  const addCurrent = useCallback(() => {
    const limits = planLimits(plan)
    setPortfolio((prev) => {
      if (prev.entries.length >= limits.maxLoans) return prev
      return {
        ...prev,
        mode: 'manual',
        entries: [...prev.entries, { ...borrower, name: borrower.name || `Заёмщик ${prev.entries.length + 1}` }],
      }
    })
  }, [borrower, plan])

  const removeAt = useCallback((index: number) => {
    setPortfolio((prev) => ({ ...prev, entries: prev.entries.filter((_, i) => i !== index) }))
  }, [])

  return (
    <AppShell result={result} plan={plan}>
      <div className="space-y-8">
        <Hero result={result} activePresetId={presetId} plan={plan} onApplyPreset={applyPreset} />

        <BorrowerPanel borrower={borrower} onChange={onManualChange} />

        <Panel
          id="terms"
          tone="var(--color-sand-700)"
          title="Условия сделки"
          description="Ставка, потери при дефолте и безрисковая альтернатива. Эти три числа превращают вероятность дефолта в рублёвый исход."
        >
          <TermsPanel terms={terms} onChange={patchTerms} />
        </Panel>

        <VerdictPanel result={result} plan={plan} />

        <Panel
          id="scoring"
          tone="var(--color-brass-500)"
          title="Объяснимый скоринг"
          description="Почему именно этому заёмщику присвоен его грейд: каждый фактор раскладывается на сдвиг логита и сравнивается со средним по отрасли."
        >
          <Suspense fallback={<BlockFallback minHeight={300} />}>
            <ContributionsPanel result={result} />
          </Suspense>
        </Panel>

        <Panel
          id="profile"
          tone="var(--color-sand-500)"
          title="Профиль риска и доходность"
          description="Слева — визуальный профиль заёмщика, справа — сколько инвестор реально заработает на этих рисках."
        >
          <Suspense fallback={<BlockFallback minHeight={360} />}>
            <RiskProfilePanel result={result} />
          </Suspense>
        </Panel>

        <Suspense fallback={<BlockFallback minHeight={460} label="Загружается портфельный симулятор" />}>
          <PortfolioPanel
            state={portfolio}
            onChange={patchPortfolio}
            onAddCurrent={addCurrent}
            onRemoveAt={removeAt}
            result={result}
            plan={plan}
          />
        </Suspense>

        <PlansPanel plan={plan} onChangePlan={applyPlan} />

        <FeedbackPanel plan={plan} result={result} />

        <Panel
          id="map"
          tone="var(--color-sand-700)"
          title="Карта разделов"
          description="Индекс всех блоков страницы: что где находится и зачем нужен. Продублирован в навигации слева — только активные разделы."
        >
          <ContentMapPanel />
        </Panel>

        <Suspense fallback={<BlockFallback minHeight={300} label="Загружается математическая справка" />}>
          <MathReference />
        </Suspense>
      </div>
    </AppShell>
  )
}
