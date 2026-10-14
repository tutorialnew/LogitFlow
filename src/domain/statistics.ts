/** Сигмоида, стабильная на экстремальных аргументах, и производные от неё. */

/** PD = 1 / (1 + e^-Z). Ветвление спасает от переполнения при |Z| > 709. */
export function sigmoid(z: number): number {
  if (z >= 0) return 1 / (1 + Math.exp(-z))
  const e = Math.exp(z)
  return e / (1 + e)
}

/** Предельный эффект ∂PD/∂X_i = β_i · PD · (1 − PD). */
export function marginalEffect(beta: number, pd: number): number {
  return beta * pd * (1 - pd)
}