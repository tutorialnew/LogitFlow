/**
 * Ленивая загрузка тяжёлых блоков с графиками.
 *
 * Recharts тянет за собой d3 — это половина бандла. Панели с графиками стоят ниже первого
 * экрана, поэтому они грузятся отдельным запросом, а первый экран (герой, параметры
 * заёмщика, вердикт) рисуется сразу.
 */
import { lazy } from 'react'

export const ContributionsPanel = lazy(() =>
  import('./ContributionsPanel').then((m) => ({ default: m.ContributionsPanel })),
)
export const RiskProfilePanel = lazy(() =>
  import('./RiskProfilePanel').then((m) => ({ default: m.RiskProfilePanel })),
)
export const PortfolioPanel = lazy(() =>
  import('./PortfolioPanel').then((m) => ({ default: m.PortfolioPanel })),
)
export const MathReference = lazy(() => import('./MathReference').then((m) => ({ default: m.MathReference })))