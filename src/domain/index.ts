/**
 * Публичная поверхность математического ядра.
 *
 * Наружу торчит одна функция расчёта (согласованная граница) и калибровочные
 * константы для раздела «Математическая справка». Внутренние модули (`factors`,
 * `portfolio`, `riskProfile`, …) импортируются напрямую только тестами и UI,
 * которым нужны справочные данные, — не для вычислений.
 */
export { calculateAssessment } from './calculateAssessment'
export {
  INDUSTRIES,
  INDUSTRY_BY_ID,
  MODEL_CALIBRATION,
  GRADE_LADDER,
  PD_HORIZON_YEARS,
  RISK_AVERSION_NOTE,
} from './model'
export type { IndustryDef } from './model'
export { FACTOR_SPECS } from './factors'
export { RADAR_AXES } from './riskProfile'
export { FIELD_LIMITS } from './normalize'
export { COMPANY_PRESETS, DEFAULT_BORROWER } from './presets'
export type { CompanyPreset } from './presets'
export type * from './types'